import { Router } from "express";
import Stripe from "stripe";
import { supabase } from "../lib/supabase";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn("Missing Stripe environment variables for webhook processing");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const router = Router();

// Process Stripe webhook events
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing webhook signature or secret key");
    return res.status(400).send("Webhook Error: Missing signature or secret");
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  console.log(`Webhook received: ${event.type}`);
  
  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        // Handle completed checkout session
        await handleCheckoutCompleted(session);
        break;
      
      case "invoice.paid":
        const invoice = event.data.object;
        // Handle successful payment
        await handleInvoicePaid(invoice);
        break;
      
      case "invoice.payment_failed":
        const failedInvoice = event.data.object;
        // Handle failed payment
        await handlePaymentFailed(failedInvoice);
        break;
      
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object;
        // Handle subscription changes
        await handleSubscriptionChange(subscription);
        break;
      
      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object;
        // Handle subscription deletion
        await handleSubscriptionDeleted(deletedSubscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    res.status(500).send(`Webhook processing error: ${err.message}`);
  }
});

// Handler functions for different webhook events

async function handleCheckoutCompleted(session) {
  // Process completed checkout
  if (session.mode === "subscription") {
    // Get customer from session
    const customer = await stripe.customers.retrieve(session.customer);
    
    if (!customer) {
      console.error("No customer found for checkout session");
      return;
    }
    
    // Get user ID from customer metadata
    const userId = customer.metadata.userId;
    
    if (!userId) {
      console.error("No user ID in customer metadata");
      return;
    }
    
    // Update user record with subscription info
    await supabase
      .from("users")
      .update({
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    
    // Log the subscription activation
    console.log(`Subscription activated for user ${userId}`);
  }
}

async function handleInvoicePaid(invoice) {
  if (!invoice.subscription) {
    return; // Not subscription related
  }
  
  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  
  // Find the user with this subscription ID
  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("subscription_id", invoice.subscription)
    .single();
  
  if (error || !user) {
    console.error(`No user found with subscription ID ${invoice.subscription}`);
    return;
  }
  
  // Update subscription status
  await supabase
    .from("users")
    .update({
      subscription_status: "active",
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  
  // Record payment in history
  await supabase
    .from("payment_history")
    .insert({
      user_id: user.id,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: "paid",
      payment_method: invoice.payment_method_types?.[0] || "unknown",
      created_at: new Date().toISOString(),
    });
  
  console.log(`Recorded successful payment for user ${user.id}`);
}

async function handlePaymentFailed(invoice) {
  if (!invoice.subscription) {
    return; // Not subscription related
  }
  
  // Find the user with this subscription ID
  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("subscription_id", invoice.subscription)
    .single();
  
  if (error || !user) {
    console.error(`No user found with subscription ID ${invoice.subscription}`);
    return;
  }
  
  // Update subscription status
  await supabase
    .from("users")
    .update({
      subscription_status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  
  // Record failed payment
  await supabase
    .from("payment_history")
    .insert({
      user_id: user.id,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription,
      amount: invoice.amount_due / 100, // Convert from cents
      currency: invoice.currency,
      status: "failed",
      payment_method: invoice.payment_method_types?.[0] || "unknown",
      created_at: new Date().toISOString(),
    });
  
  console.log(`Recorded failed payment for user ${user.id}`);
}

async function handleSubscriptionChange(subscription) {
  // Find the user with this subscription ID
  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("subscription_id", subscription.id)
    .single();
  
  if (error || !user) {
    console.error(`No user found with subscription ID ${subscription.id}`);
    return;
  }
  
  // Get plan information
  const priceId = subscription.items.data[0].price.id;
  
  // Update user subscription details
  await supabase
    .from("users")
    .update({
      subscription_status: subscription.status,
      subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  
  // Record subscription change
  await supabase
    .from("subscription_history")
    .insert({
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      created_at: new Date().toISOString(),
    });
  
  console.log(`Updated subscription for user ${user.id} to status: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription) {
  // Find the user with this subscription ID
  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("subscription_id", subscription.id)
    .single();
  
  if (error || !user) {
    console.error(`No user found with subscription ID ${subscription.id}`);
    return;
  }
  
  // Update user subscription status
  await supabase
    .from("users")
    .update({
      subscription_status: "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  
  // Record subscription cancellation
  await supabase
    .from("subscription_history")
    .insert({
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      status: "canceled",
      created_at: new Date().toISOString(),
    });
  
  console.log(`Subscription deleted for user ${user.id}`);
}

export default router;