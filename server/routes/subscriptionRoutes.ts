import { Router } from "express";
import Stripe from "stripe";
import { supabase } from "../lib/supabase";
import { verifyToken } from "../middleware/auth";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required environment variable: STRIPE_SECRET_KEY");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Available subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: "basic",
    name: "Basic",
    description: "Perfect for getting started",
    price: 9.99,
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_BASIC || "price_basic",
    features: [
      "Basic profile features",
      "10 athlete matches per month",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "The most popular plan",
    price: 29.99,
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_PRO || "price_pro",
    recommended: true,
    features: [
      "Advanced profile customization",
      "Unlimited athlete matches",
      "Advanced analytics dashboard",
      "Priority email support",
      "Brand integration options",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For serious businesses",
    price: 99.99,
    interval: "month",
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise",
    features: [
      "White-glove onboarding",
      "Dedicated account manager",
      "Custom integration options",
      "API access",
      "Advanced analytics & reporting",
      "Phone & email support",
      "Multiple team members",
    ],
  },
];

const router = Router();

// Get available subscription plans
router.get("/plans", (req, res) => {
  return res.json({ plans: SUBSCRIPTION_PLANS });
});

// Get current user's subscription
router.get("/subscription", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Get user details including subscription info
    const { data, error } = await supabase
      .from("users")
      .select("subscription_id, subscription_status, subscription_plan, subscription_current_period_end")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching user subscription:", error);
      return res.status(500).json({ error: "Failed to fetch subscription" });
    }
    
    if (!data || !data.subscription_id) {
      return res.json({ subscription: null });
    }
    
    // Format subscription data for frontend
    const subscriptionData = {
      id: data.subscription_id,
      status: data.subscription_status || "inactive",
      planType: data.subscription_plan || "free",
      currentPeriodEnd: data.subscription_current_period_end 
        ? Math.floor(new Date(data.subscription_current_period_end).getTime() / 1000)
        : null,
    };
    
    return res.json({ subscription: subscriptionData });
  } catch (error) {
    console.error("Error in subscription endpoint:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get subscription status (simplified endpoint for UI components)
router.get("/status", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Get user details including subscription info
    const { data, error } = await supabase
      .from("users")
      .select("subscription_status, subscription_plan")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching subscription status:", error);
      return res.status(500).json({ error: "Failed to fetch subscription status" });
    }
    
    // Return simplified subscription data
    return res.json({
      subscription: {
        status: data?.subscription_status || "inactive",
        plan: data?.subscription_plan || "free",
      },
    });
  } catch (error) {
    console.error("Error in subscription status endpoint:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Create or get existing subscription
router.post("/get-or-create-subscription", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    const { planId } = req.body;
    
    if (!userId || !userEmail) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Find the selected plan
    const selectedPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
    if (!selectedPlan) {
      return res.status(400).json({ error: "Invalid plan selected" });
    }
    
    // Get user record to check for existing Stripe customer
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("stripe_customer_id, subscription_id, subscription_status")
      .eq("id", userId)
      .single();
    
    if (userError) {
      console.error("Error fetching user data:", userError);
      return res.status(500).json({ error: "Failed to fetch user data" });
    }
    
    // Check if user has an active subscription
    if (userData?.subscription_status === "active" && userData?.subscription_id) {
      try {
        // Fetch the subscription from Stripe
        const existingSubscription = await stripe.subscriptions.retrieve(userData.subscription_id);
        
        // If it's already for the same plan, return success
        if (existingSubscription.items.data[0].price.id === selectedPlan.stripePriceId) {
          return res.json({
            status: "active",
            message: "Already subscribed to this plan",
          });
        }
        
        // Otherwise, update the subscription to the new plan
        const updatedSubscription = await stripe.subscriptions.update(
          existingSubscription.id,
          {
            items: [{
              id: existingSubscription.items.data[0].id,
              price: selectedPlan.stripePriceId,
            }],
            proration_behavior: "create_prorations",
          }
        );
        
        // Update user record with new plan
        await supabase
          .from("users")
          .update({
            subscription_plan: selectedPlan.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        
        return res.json({
          status: "updated",
          message: "Subscription updated successfully",
          subscriptionId: updatedSubscription.id,
        });
      } catch (stripeError) {
        console.error("Error with existing subscription:", stripeError);
        // If the subscription doesn't exist in Stripe, we'll create a new one
      }
    }
    
    // Get or create Stripe customer
    let customerId = userData?.stripe_customer_id;
    
    if (!customerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
        },
      });
      
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await supabase
        .from("users")
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }
    
    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: selectedPlan.stripePriceId,
        },
      ],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });
    
    // Update user record with subscription info
    await supabase
      .from("users")
      .update({
        subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_plan: selectedPlan.id,
        subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    
    // Add to subscription history
    await supabase
      .from("subscription_history")
      .insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        plan_id: selectedPlan.id,
        status: subscription.status,
        amount: selectedPlan.price,
        currency: "usd",
        interval: selectedPlan.interval,
        created_at: new Date().toISOString(),
      });
    
    // Return client secret for payment
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
    
    return res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({ error: "Failed to create subscription" });
  }
});

// Cancel subscription
router.post("/cancel-subscription", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Get user's subscription ID
    const { data, error } = await supabase
      .from("users")
      .select("subscription_id")
      .eq("id", userId)
      .single();
    
    if (error || !data?.subscription_id) {
      return res.status(404).json({ error: "No active subscription found" });
    }
    
    // Cancel the subscription at period end
    await stripe.subscriptions.update(data.subscription_id, {
      cancel_at_period_end: true,
    });
    
    // Update user record
    await supabase
      .from("users")
      .update({
        subscription_status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    
    return res.json({ success: true, message: "Subscription canceled" });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// Resume subscription
router.post("/resume-subscription", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Get user's subscription ID
    const { data, error } = await supabase
      .from("users")
      .select("subscription_id")
      .eq("id", userId)
      .single();
    
    if (error || !data?.subscription_id) {
      return res.status(404).json({ error: "No subscription found to resume" });
    }
    
    // Resume the subscription
    await stripe.subscriptions.update(data.subscription_id, {
      cancel_at_period_end: false,
    });
    
    // Update user record
    await supabase
      .from("users")
      .update({
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    
    return res.json({ success: true, message: "Subscription resumed" });
  } catch (error) {
    console.error("Error resuming subscription:", error);
    return res.status(500).json({ error: "Failed to resume subscription" });
  }
});

// Create customer portal session
router.post("/create-portal-session", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { return_url } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Get user's Stripe customer ID
    const { data, error } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();
    
    if (error || !data?.stripe_customer_id) {
      return res.status(404).json({ error: "No Stripe customer found" });
    }
    
    // Create a customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: return_url || `${req.headers.origin}/account/subscription`,
    });
    
    return res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return res.status(500).json({ error: "Failed to create portal session" });
  }
});

// Process Stripe webhook events
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;
  
  // Verify webhook signature and extract the event
  try {
    // Make sure STRIPE_WEBHOOK_SECRET is set in environment variables
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Missing Stripe webhook secret");
      return res.status(500).send("Webhook Error: Missing Stripe webhook secret");
    }
    
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find the user with this subscription
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("subscription_id", subscription.id)
          .single();
        
        if (userError || !userData) {
          console.error("No user found with subscription:", subscription.id);
          return res.status(202).send("No user found with this subscription");
        }
        
        // Determine the plan from the subscription
        const priceId = subscription.items.data[0].price.id;
        const plan = SUBSCRIPTION_PLANS.find(p => p.stripePriceId === priceId);
        
        // Update the user's subscription status
        await supabase
          .from("users")
          .update({
            subscription_status: subscription.status,
            subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            subscription_plan: plan?.id || "unknown",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userData.id);
        
        break;
      
      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription;
        
        // Find the user with this subscription
        const { data: userWithDeletedSub, error: deleteError } = await supabase
          .from("users")
          .select("id")
          .eq("subscription_id", deletedSubscription.id)
          .single();
        
        if (deleteError || !userWithDeletedSub) {
          console.error("No user found with deleted subscription:", deletedSubscription.id);
          return res.status(202).send("No user found with this subscription");
        }
        
        // Update the user's subscription status
        await supabase
          .from("users")
          .update({
            subscription_status: "inactive",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userWithDeletedSub.id);
        
        break;
      
      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice;
        
        // Only process subscription invoices
        if (invoice.subscription) {
          // Find the user with this subscription
          const { data: invoiceUser, error: invoiceError } = await supabase
            .from("users")
            .select("id")
            .eq("subscription_id", invoice.subscription)
            .single();
          
          if (invoiceError || !invoiceUser) {
            console.error("No user found with invoice subscription:", invoice.subscription);
            return res.status(202).send("No user found for this invoice");
          }
          
          // Update the subscription status to active
          await supabase
            .from("users")
            .update({
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoiceUser.id);
          
          // Add to payment history
          await supabase
            .from("payment_history")
            .insert({
              user_id: invoiceUser.id,
              stripe_invoice_id: invoice.id,
              stripe_subscription_id: invoice.subscription as string,
              amount: invoice.amount_paid / 100, // Convert from cents
              currency: invoice.currency,
              status: "paid",
              payment_method: invoice.payment_method_types?.[0] || "unknown",
              created_at: new Date().toISOString(),
            });
        }
        break;
      
      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice;
        
        // Only process subscription invoices
        if (failedInvoice.subscription) {
          // Find the user with this subscription
          const { data: failedInvoiceUser, error: failedInvoiceError } = await supabase
            .from("users")
            .select("id")
            .eq("subscription_id", failedInvoice.subscription)
            .single();
          
          if (failedInvoiceError || !failedInvoiceUser) {
            console.error("No user found with failed invoice subscription:", failedInvoice.subscription);
            return res.status(202).send("No user found for this invoice");
          }
          
          // Update the subscription status to past_due
          await supabase
            .from("users")
            .update({
              subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("id", failedInvoiceUser.id);
          
          // Add to payment history
          await supabase
            .from("payment_history")
            .insert({
              user_id: failedInvoiceUser.id,
              stripe_invoice_id: failedInvoice.id,
              stripe_subscription_id: failedInvoice.subscription as string,
              amount: failedInvoice.amount_due / 100, // Convert from cents
              currency: failedInvoice.currency,
              status: "failed",
              payment_method: failedInvoice.payment_method_types?.[0] || "unknown",
              created_at: new Date().toISOString(),
            });
        }
        break;
    }
    
    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    res.status(500).send("Error processing webhook");
  }
});

export default router;