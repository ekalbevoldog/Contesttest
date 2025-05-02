import { Router } from "express";
import Stripe from "stripe";
import { supabase } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import dotenv from "dotenv";

dotenv.config();

// Check for Stripe API key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Missing Stripe secret key. Payment features will not work.");
}

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const router = Router();

// Constants
const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: process.env.STRIPE_BASIC_PRICE_ID || "price_basic",
    name: "Basic",
    description: "Basic subscription with essential features",
  },
  PRO: {
    id: process.env.STRIPE_PRO_PRICE_ID || "price_pro",
    name: "Pro",
    description: "Professional plan with advanced features",
  },
  ENTERPRISE: {
    id: process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
    name: "Enterprise",
    description: "Full-featured enterprise plan",
  },
};

// Get subscription plans
router.get("/plans", (req, res) => {
  res.json({
    plans: Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
    })),
  });
});

// Get current user's subscription status
router.get("/status", requireAuth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // If user doesn't have a subscription, return null
    if (!user.subscription_id) {
      return res.json({ subscription: null });
    }

    // Get subscription from Stripe
    try {
      const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
      
      // Get the price details for more information
      const priceId = subscription.items.data[0]?.price.id;
      const price = priceId 
        ? await stripe.prices.retrieve(priceId)
        : null;
        
      // Format the subscription info
      return res.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          plan: price?.nickname || "Standard",
          priceId: priceId,
        }
      });
    } catch (err) {
      console.error("Error retrieving subscription from Stripe:", err);
      
      // If we can't get the subscription from Stripe, return the basic info we have
      return res.json({
        subscription: {
          id: user.subscription_id,
          status: user.subscription_status || "unknown",
        }
      });
    }
  } catch (err) {
    console.error("Error retrieving subscription status:", err);
    return res.status(500).json({ error: "Failed to retrieve subscription status" });
  }
});

// Create a checkout session for subscription
router.post("/create-checkout-session", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { priceId, successUrl, cancelUrl } = req.body;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate the price ID
    const validPriceIds = Object.values(SUBSCRIPTION_PLANS).map(plan => plan.id);
    const selectedPriceId = priceId || SUBSCRIPTION_PLANS.BASIC.id;
    
    if (!validPriceIds.includes(selectedPriceId)) {
      return res.status(400).json({ error: "Invalid price ID" });
    }

    // Set default URLs if not provided
    const defaultSuccessUrl = `${req.protocol}://${req.get('host')}/subscription/success`;
    const defaultCancelUrl = `${req.protocol}://${req.get('host')}/subscribe`;

    // Check if user already has a Stripe customer ID
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = customer.id;
      
      // Save the customer ID to the user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
        
      if (updateError) {
        console.error("Error updating user with Stripe customer ID:", updateError);
        return res.status(500).json({ error: "Failed to update user record" });
      }
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      metadata: {
        userId: user.id,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Cancel subscription
router.post("/cancel", requireAuth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!user.subscription_id) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(user.subscription_id, {
      cancel_at_period_end: true,
    });

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({ cancel_at_period_end: true })
      .eq('id', user.id);

    if (updateError) {
      console.error("Error updating user subscription status:", updateError);
    }

    res.json({
      message: "Subscription will be canceled at the end of the billing period",
      subscription: {
        id: subscription.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end,
      }
    });
  } catch (err) {
    console.error("Error canceling subscription:", err);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// Reactivate a canceled subscription
router.post("/reactivate", requireAuth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!user.subscription_id) {
      return res.status(400).json({ error: "No subscription found" });
    }

    // Reactivate the subscription
    const subscription = await stripe.subscriptions.update(user.subscription_id, {
      cancel_at_period_end: false,
    });

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({ cancel_at_period_end: false })
      .eq('id', user.id);

    if (updateError) {
      console.error("Error updating user subscription status:", updateError);
    }

    res.json({
      message: "Subscription reactivated successfully",
      subscription: {
        id: subscription.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      }
    });
  } catch (err) {
    console.error("Error reactivating subscription:", err);
    res.status(500).json({ error: "Failed to reactivate subscription" });
  }
});

// Change subscription plan
router.post("/change-plan", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { priceId } = req.body;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!user.subscription_id) {
      return res.status(400).json({ error: "No active subscription found" });
    }

    // Validate the price ID
    const validPriceIds = Object.values(SUBSCRIPTION_PLANS).map(plan => plan.id);
    
    if (!priceId || !validPriceIds.includes(priceId)) {
      return res.status(400).json({ error: "Invalid price ID" });
    }

    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(user.subscription_id);
    
    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(
      user.subscription_id,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceId,
          },
        ],
      }
    );

    res.json({
      message: "Subscription plan updated successfully",
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        priceId: priceId,
      }
    });
  } catch (err) {
    console.error("Error changing subscription plan:", err);
    res.status(500).json({ error: "Failed to change subscription plan" });
  }
});

// Create a portal session for subscription management
router.post("/create-portal-session", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { returnUrl } = req.body;

    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: "No Stripe customer found for this user" });
    }

    // Create a portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: returnUrl || `${req.protocol}://${req.get('host')}/account/subscription`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Error creating portal session:", err);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

export default router;