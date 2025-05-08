import { Request, Response, Router } from "express";
import Stripe from "stripe";
import { buffer } from "../utils/buffer";
import * as stripeService from "../services/stripeService";
import { storage } from "../storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia" as const,
});

const webhooksRouter = Router();

// Raw body parser for Stripe webhook
const getRawBody = async (req: Request): Promise<Buffer> => {
  if (req.body instanceof Buffer) {
    return req.body;
  }

  // If body-parser already parsed it, try to get the raw body
  if (req.rawBody) {
    return Buffer.from(req.rawBody);
  }

  // If we can't get the raw body, try to stringify and parse the body
  if (req.body) {
    return Buffer.from(JSON.stringify(req.body));
  }

  // If all else fails, return an empty buffer
  return Buffer.alloc(0);
};

// Webhook handling endpoint
webhooksRouter.post("/webhook", async (req: Request, res: Response) => {
  // Ensure we have the raw body for signature verification
  const rawBody = await getRawBody(req);

  // Get the signature from headers
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    console.error("Webhook error: No Stripe signature in headers");
    return res.status(400).json({ error: "Missing Stripe signature" });
  }

  // Get the webhook secret from environment variables or use a test value
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: Stripe.Event;

  try {
    // Verify the signature
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // In development, we may not have a webhook secret, so just parse the event
      // NOTE: In production, always verify the signature!
      const payload = JSON.parse(rawBody.toString());
      event = payload as Stripe.Event;
      console.warn(
        "WARNING: Processing unverified webhook. Not recommended for production!",
      );
    }
  } catch (err) {
    console.error(
      "Webhook signature verification failed:",
      err instanceof Error ? err.message : err,
    );
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    // Handle the event
    console.log(`Received webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        // Handle successful checkout session
        if (checkoutSession.customer && checkoutSession.subscription) {
          if (checkoutSession.metadata?.userId) {
            await handleSuccessfulSubscription(
              checkoutSession.metadata.userId,
              checkoutSession.customer as string,
              checkoutSession.subscription as string,
            );
          } else {
            console.error(
              "Checkout session completed but no userId in metadata",
              checkoutSession.id,
            );
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Handle subscription updates (upgrades, downgrades, etc)
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Handle subscription cancellation
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        // Handle successful invoice payment (renewals)
        if (invoice.subscription) {
          await handleInvoicePaymentSucceeded(invoice);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        // Handle failed invoice payment
        if (invoice.subscription) {
          await handleInvoicePaymentFailed(invoice);
        }
        break;
      }

      // Handle other event types as needed
      default:
        // Unexpected event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 success response
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
});

// Helper functions for webhook event handling
async function handleSuccessfulSubscription(
  userId: string,
  customerId: string,
  subscriptionId: string,
): Promise<void> {
  try {
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Get the price information to determine which plan they subscribed to
    const priceId = subscription.items.data[0]?.price.id;

    // Map price ID to plan name
    let planName = "basic";
    if (priceId) {
      // Map the price ID to our plan names
      // This should match the IDs in your subscription-plans.ts file
      if (priceId.includes("pro")) {
        planName = "pro";
      } else if (priceId.includes("enterprise")) {
        planName = "enterprise";
      }
    }

    // Update user with subscription info
    await storage.updateUserSubscription(userId, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: subscription.status,
      subscription_plan: planName,
      subscription_current_period_end: new Date(
        subscription.current_period_end * 1000,
      ),
    });

    // Create a subscription history record
    await storage.createSubscriptionHistory({
      user_id: userId,
      stripe_subscription_id: subscriptionId,
      plan_id: planName,
      price_id: priceId || "",
      status: subscription.status,
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.currency,
      interval: subscription.items.data[0]?.plan.interval || "month",
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });

    console.log(`Successfully processed subscription for user ${userId}`);
  } catch (error) {
    console.error("Error handling successful subscription:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  try {
    // Get the user associated with this subscription
    const user = await storage.getUserByStripeSubscriptionId(subscription.id);

    if (!user) {
      console.error(`No user found for subscription ${subscription.id}`);
      return;
    }

    // Get the price information to determine which plan they updated to
    const priceId = subscription.items.data[0]?.price.id;

    // Map price ID to plan name
    let planName = "basic";
    if (priceId) {
      if (priceId.includes("pro")) {
        planName = "pro";
      } else if (priceId.includes("enterprise")) {
        planName = "enterprise";
      }
    }

    // Update user subscription details
    await storage.updateUserSubscription(user.id, {
      subscription_status: subscription.status,
      subscription_plan: planName,
      subscription_current_period_end: new Date(
        subscription.current_period_end * 1000,
      ),
    });

    // Create a subscription history record for the update
    await storage.createSubscriptionHistory({
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      plan_id: planName,
      price_id: priceId || "",
      status: subscription.status,
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.currency,
      interval: subscription.items.data[0]?.plan.interval || "month",
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });

    console.log(`Successfully updated subscription for user ${user.id}`);
  } catch (error) {
    console.error("Error handling subscription update:", error);
    throw error;
  }
}

async function handleSubscriptionCancelled(
  subscription: Stripe.Subscription,
): Promise<void> {
  try {
    // Get the user associated with this subscription
    const user = await storage.getUserByStripeSubscriptionId(subscription.id);

    if (!user) {
      console.error(
        `No user found for cancelled subscription ${subscription.id}`,
      );
      return;
    }

    // Update user subscription details to mark as cancelled
    await storage.updateUserSubscription(user.id, {
      subscription_status: "canceled",
      subscription_current_period_end: new Date(
        subscription.current_period_end * 1000,
      ),
    });

    // Create a subscription history record for the cancellation
    await storage.createSubscriptionHistory({
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      plan_id: user.subscription_plan || "unknown",
      price_id: subscription.items.data[0]?.price.id || "",
      status: "canceled",
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.currency,
      interval: subscription.items.data[0]?.plan.interval || "month",
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: new Date(),
    });

    console.log(
      `Successfully processed subscription cancellation for user ${user.id}`,
    );
  } catch (error) {
    console.error("Error handling subscription cancellation:", error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
): Promise<void> {
  try {
    if (!invoice.subscription) return;

    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string,
    );

    // Get the user associated with this subscription
    const user = await storage.getUserByStripeSubscriptionId(subscription.id);

    if (!user) {
      console.error(`No user found for invoice payment ${invoice.id}`);
      return;
    }

    // Update the user's subscription period end date
    await storage.updateUserSubscription(user.id, {
      subscription_status: subscription.status,
      subscription_current_period_end: new Date(
        subscription.current_period_end * 1000,
      ),
    });

    console.log(`Successfully processed invoice payment for user ${user.id}`);
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  try {
    if (!invoice.subscription) return;

    // Get the subscription details
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string,
    );

    // Get the user associated with this subscription
    const user = await storage.getUserByStripeSubscriptionId(subscription.id);

    if (!user) {
      console.error(`No user found for failed invoice payment ${invoice.id}`);
      return;
    }

    // Update the user's subscription status
    await storage.updateUserSubscription(user.id, {
      subscription_status: subscription.status,
    });

    console.log(`Processed failed invoice payment for user ${user.id}`);

    // Here you could send an email notification to the user about the failed payment
  } catch (error) {
    console.error("Error handling invoice payment failed:", error);
    throw error;
  }
}

export default webhooksRouter;
