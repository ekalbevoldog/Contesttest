/**
 * Subscription Controller
 * 
 * Handles HTTP requests related to subscriptions and payments.
 * Connects route handlers to the subscription service.
 */

import { Request, Response } from 'express';
import { subscriptionService, SUBSCRIPTION_PLANS } from '../services/subscriptionService';
import config from '../config/environment';
import Stripe from 'stripe';

// Initialize Stripe for webhook verification
const stripe = config.STRIPE_SECRET_KEY 
  ? new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

class SubscriptionController {
  /**
   * Get available subscription plans
   */
  getPlans(req: Request, res: Response) {
    try {
      // Get and format plans for client
      const plans = subscriptionService.getSubscriptionPlans().map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        description: plan.description,
        features: plan.features
      }));

      return res.status(200).json({ plans });
    } catch (error: any) {
      console.error('Get subscription plans error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving subscription plans' });
    }
  }

  /**
   * Get current user's subscription status
   */
  async getSubscriptionStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await subscriptionService.getUserSubscription(userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to retrieve subscription status' });
      }

      return res.status(200).json({ subscription: result.subscription });
    } catch (error: any) {
      console.error('Get subscription status error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving subscription status' });
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get request data
      const { priceId, successUrl, cancelUrl } = req.body;

      // Validate price ID
      const validPriceIds = Object.values(SUBSCRIPTION_PLANS).map(plan => plan.stripePriceId);
      const selectedPriceId = priceId || SUBSCRIPTION_PLANS.basic.stripePriceId;

      if (!validPriceIds.includes(selectedPriceId)) {
        return res.status(400).json({ error: 'Invalid price ID' });
      }

      // Set default URLs if not provided
      const defaultSuccessUrl = `${req.protocol}://${req.get('host')}/subscription/success`;
      const defaultCancelUrl = `${req.protocol}://${req.get('host')}/subscribe`;

      // Create checkout session
      const result = await subscriptionService.createCheckoutSession(
        userId,
        selectedPriceId,
        successUrl || defaultSuccessUrl,
        cancelUrl || defaultCancelUrl
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to create checkout session' });
      }

      return res.status(200).json({ 
        sessionId: result.sessionId,
        url: result.url
      });
    } catch (error: any) {
      console.error('Create checkout session error:', error);
      return res.status(500).json({ error: error.message || 'Error creating checkout session' });
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await subscriptionService.cancelSubscription(userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to cancel subscription' });
      }

      return res.status(200).json({
        message: 'Subscription will be canceled at the end of the billing period',
        subscription: result.subscription
      });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      return res.status(500).json({ error: error.message || 'Error canceling subscription' });
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await subscriptionService.reactivateSubscription(userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to reactivate subscription' });
      }

      return res.status(200).json({
        message: 'Subscription reactivated successfully',
        subscription: result.subscription
      });
    } catch (error: any) {
      console.error('Reactivate subscription error:', error);
      return res.status(500).json({ error: error.message || 'Error reactivating subscription' });
    }
  }

  /**
   * Change subscription plan
   */
  async changeSubscriptionPlan(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      // Validate price ID
      const validPriceIds = Object.values(SUBSCRIPTION_PLANS).map(plan => plan.stripePriceId);

      if (!validPriceIds.includes(priceId)) {
        return res.status(400).json({ error: 'Invalid price ID' });
      }

      const result = await subscriptionService.changeSubscriptionPlan(userId, priceId);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to change subscription plan' });
      }

      return res.status(200).json({
        message: 'Subscription plan updated successfully',
        subscription: result.subscription
      });
    } catch (error: any) {
      console.error('Change subscription plan error:', error);
      return res.status(500).json({ error: error.message || 'Error changing subscription plan' });
    }
  }

  /**
   * Create a billing portal session
   */
  async createPortalSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { returnUrl } = req.body;

      // Set default return URL if not provided
      const defaultReturnUrl = `${req.protocol}://${req.get('host')}/account/subscription`;

      const result = await subscriptionService.createPortalSession(
        userId,
        returnUrl || defaultReturnUrl
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to create portal session' });
      }

      return res.status(200).json({ url: result.url });
    } catch (error: any) {
      console.error('Create portal session error:', error);
      return res.status(500).json({ error: error.message || 'Error creating portal session' });
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      // Get the raw body for signature verification
      const rawBody = req.body;
      let event: Stripe.Event;

      // Verify webhook signature if secret is configured
      if (stripe && config.STRIPE_WEBHOOK_SECRET) {
        const signature = req.headers['stripe-signature'] as string;

        if (!signature) {
          return res.status(400).json({ error: 'Missing Stripe signature' });
        }

        // Construct and verify the event
        try {
          event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            config.STRIPE_WEBHOOK_SECRET
          );
        } catch (verifyError: any) {
          console.error('Webhook signature verification failed:', verifyError.message);
          return res.status(400).json({ error: 'Invalid signature' });
        }
      } else {
        // In development, we may not verify the signature
        event = rawBody as Stripe.Event;
        console.warn('Processing unverified webhook. Not recommended for production!');
      }

      // Process the event
      const success = await subscriptionService.processWebhook(event);

      if (!success) {
        return res.status(500).json({ error: 'Error processing webhook event' });
      }

      return res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook handler error:', error);
      return res.status(500).json({ error: error.message || 'Error processing webhook' });
    }
  }
}

// Create and export singleton instance
export const subscriptionController = new SubscriptionController();
export default subscriptionController;