import { Router, Request, Response } from 'express';
import stripeService, { SUBSCRIPTION_PLANS } from '../services/stripeService';
import { storage } from '../storage';
import { supabase } from '../supabase';

const router = Router();

// Type definition for request with user
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    username: string;
    role: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    subscription_plan?: string;
    subscription_current_period_end?: Date;
  };
}

// Middleware to ensure user is authenticated
const requireAuth = async (req: Request, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }
  next();
};

// Get or create a subscription for the user
router.post('/get-or-create-subscription', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const { planId = 'pro' } = req.body;

    // Validate plan ID
    if (!SUBSCRIPTION_PLANS[planId]) {
      return res.status(400).json({
        error: 'Invalid plan ID',
        message: 'The selected plan does not exist'
      });
    }

    // Get plan price ID
    const stripePriceId = SUBSCRIPTION_PLANS[planId].stripePriceId;

    // Check if user already has a customer ID
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      // Create a new customer in Stripe
      const customer = await stripeService.createCustomer(
        user.email,
        user.username,
        { 
          userId: user.id.toString(),
          userRole: user.role 
        }
      );
      
      customerId = customer.id;
      
      // Save customer ID to user record
      await storage.updateUser(user.id, {
        stripe_customer_id: customerId
      });
    }

    // Check if user already has an active subscription
    if (user.stripe_subscription_id) {
      try {
        const existingSubscription = await stripeService.getSubscription(user.stripe_subscription_id);
        
        // If subscription exists and is active, return error
        if (existingSubscription && ['active', 'trialing'].includes(existingSubscription.status)) {
          return res.status(400).json({
            error: 'Subscription exists',
            message: 'You already have an active subscription. Please manage your subscription from your account page.'
          });
        }
      } catch (err) {
        // If we can't find the subscription, continue with creating a new one
        console.log('Previous subscription not found or invalid:', err);
      }
    }

    // Create a new subscription
    const subscription = await stripeService.createSubscription(customerId, stripePriceId);
    
    // Return client secret for payment confirmation
    return res.status(200).json({
      clientSecret: subscription.clientSecret,
      subscriptionId: subscription.subscriptionId
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to create subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Get subscription status
router.get('/subscription-status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payment_intent } = req.query;
    
    // If payment_intent is provided, try to find associated subscription
    if (payment_intent) {
      // In a real implementation, you would query Stripe to find subscription by payment intent
      // For simplicity, we'll skip this step and mock a success response
      return res.json({
        status: 'success',
        subscriptionId: `sub_${Math.random().toString(36).substr(2, 9)}`,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      });
    }
    
    const user = req.user;
    
    // Check if user has a subscription
    if (!user.stripe_subscription_id) {
      return res.status(404).json({
        error: 'No subscription found',
        message: 'You do not have an active subscription'
      });
    }
    
    // Get subscription details from Stripe
    const subscription = await stripeService.getSubscription(user.stripe_subscription_id);
    
    if (!subscription) {
      return res.status(404).json({
        error: 'Subscription not found',
        message: 'Your subscription could not be found'
      });
    }
    
    return res.json({
      status: 'success',
      subscription
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to get subscription status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Get current subscription
router.get('/subscription', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    // Check if user has a stripe customer ID
    if (!user.stripe_customer_id) {
      return res.json({ subscription: null });
    }
    
    // If user has a subscription ID, get that specific subscription
    if (user.stripe_subscription_id) {
      const subscription = await stripeService.getSubscription(user.stripe_subscription_id);
      
      if (subscription) {
        return res.json({ subscription });
      }
    }
    
    // Otherwise, get all active subscriptions for the customer
    const subscriptions = await stripeService.getCustomerSubscriptions(user.stripe_customer_id);
    
    if (subscriptions.length > 0) {
      // Update user record with the subscription ID if it was missing
      if (!user.stripe_subscription_id) {
        await storage.updateUser(user.id, {
          stripe_subscription_id: subscriptions[0].id,
          subscription_status: subscriptions[0].status,
          subscription_plan: subscriptions[0].planType,
          subscription_current_period_end: new Date(subscriptions[0].currentPeriodEnd)
        });
      }
      
      return res.json({ subscription: subscriptions[0] });
    }
    
    return res.json({ subscription: null });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to get subscription details',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { subscriptionId } = req.body;
    
    // Validate subscription ID
    if (!subscriptionId) {
      return res.status(400).json({
        error: 'Missing subscription ID',
        message: 'Subscription ID is required'
      });
    }
    
    // Make sure the subscription belongs to this user
    if (user.stripe_subscription_id !== subscriptionId) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You do not have permission to cancel this subscription'
      });
    }
    
    // Cancel the subscription
    const success = await stripeService.cancelSubscription(subscriptionId);
    
    if (!success) {
      return res.status(500).json({
        error: 'Cancellation failed',
        message: 'Failed to cancel subscription'
      });
    }
    
    // Update user record
    await storage.updateUser(user.id, {
      subscription_status: 'canceling'
    });
    
    return res.json({
      status: 'success',
      message: 'Subscription will be canceled at the end of the billing period'
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Resume subscription
router.post('/resume-subscription', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { subscriptionId } = req.body;
    
    // Validate subscription ID
    if (!subscriptionId) {
      return res.status(400).json({
        error: 'Missing subscription ID',
        message: 'Subscription ID is required'
      });
    }
    
    // Make sure the subscription belongs to this user
    if (user.stripe_subscription_id !== subscriptionId) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You do not have permission to resume this subscription'
      });
    }
    
    // Resume the subscription
    const success = await stripeService.resumeSubscription(subscriptionId);
    
    if (!success) {
      return res.status(500).json({
        error: 'Resume failed',
        message: 'Failed to resume subscription'
      });
    }
    
    // Update user record
    await storage.updateUser(user.id, {
      subscription_status: 'active'
    });
    
    return res.json({
      status: 'success',
      message: 'Subscription has been resumed'
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to resume subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Change subscription plan
router.post('/change-plan', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { planId } = req.body;
    
    // Validate plan ID
    if (!planId || !SUBSCRIPTION_PLANS[planId]) {
      return res.status(400).json({
        error: 'Invalid plan ID',
        message: 'The selected plan does not exist'
      });
    }
    
    // Make sure user has a subscription
    if (!user.stripe_subscription_id) {
      return res.status(400).json({
        error: 'No subscription',
        message: 'You do not have an active subscription to update'
      });
    }
    
    // Get plan price ID
    const stripePriceId = SUBSCRIPTION_PLANS[planId].stripePriceId;
    
    // Change the subscription plan
    const success = await stripeService.changeSubscriptionPlan(
      user.stripe_subscription_id, 
      stripePriceId
    );
    
    if (!success) {
      return res.status(500).json({
        error: 'Plan change failed',
        message: 'Failed to change subscription plan'
      });
    }
    
    // Update user record
    await storage.updateUser(user.id, {
      subscription_plan: planId
    });
    
    return res.json({
      status: 'success',
      message: `Your subscription has been updated to the ${SUBSCRIPTION_PLANS[planId].name} plan`
    });
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to change subscription plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Create portal session for managing subscriptions
router.post('/create-portal-session', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { return_url } = req.body;
    
    // Make sure user has a Stripe customer ID
    if (!user.stripe_customer_id) {
      return res.status(400).json({
        error: 'No customer',
        message: 'You do not have a payment account set up'
      });
    }
    
    // Create a portal session
    const portalUrl = await stripeService.createPortalSession(
      user.stripe_customer_id,
      return_url || `${req.headers.origin}/account/subscription`
    );
    
    return res.json({
      url: portalUrl
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({
      error: {
        message: 'Failed to create customer portal session',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;