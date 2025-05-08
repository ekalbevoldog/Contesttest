/**05/08/2025 - 13:30CST CST
 * Subscription Service
 * 
 * Manages user subscriptions and payments through Stripe.
 * Provides methods for creating, updating, and managing subscription plans.
 */

import Stripe from 'stripe';
import { supabase } from '../lib/supabase';
import config from '../config/environment';

// Validate Stripe configuration
if (!config.STRIPE_SECRET_KEY) {
  console.warn('Missing Stripe secret key. Payment features will be limited.');
}

// Initialize Stripe client
const stripe = config.STRIPE_SECRET_KEY 
  ? new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

// Interface for subscription plans
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  stripePriceId: string;
  features: string[];
  description: string;
}

// Interface for subscription data
export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid' | 'paused';
  planType: string;
  planName: string;
  startDate: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  amount: number;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  paymentMethod?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
}

// Interface for subscription result
export interface SubscriptionResult {
  success: boolean;
  subscription?: Subscription;
  error?: string;
  url?: string;
  sessionId?: string;
}

// Define subscription plans
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 99,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
    features: [
      'Up to 5 athlete matches per month',
      'Basic analytics dashboard',
      'Email support',
      'Campaign management tools',
    ],
    description: 'Perfect for getting started with NIL partnerships'
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 199,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    features: [
      'Up to 15 athlete matches per month',
      'Advanced analytics dashboard',
      'Priority email & chat support',
      'Comprehensive campaign management',
      'Performance reports',
    ],
    description: 'Enhanced features for serious businesses'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    features: [
      'Unlimited athlete matches',
      'Executive analytics dashboard',
      '24/7 dedicated support',
      'Full campaign suite',
      'Custom reporting',
      'API access',
    ],
    description: 'Complete solution for maximum impact'
  }
};

class SubscriptionService {
  /**
   * Get available subscription plans
   */
  getSubscriptionPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  /**
   * Get a user's subscription status
   */
  async getUserSubscription(userId: string): Promise<SubscriptionResult> {
    try {
      if (!stripe) {
        return { 
          success: false, 
          error: 'Stripe is not configured' 
        };
      }

      // Get user subscription information from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('stripe_customer_id, stripe_subscription_id, subscription_status, subscription_plan, subscription_current_period_end')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error getting user subscription data:', userError);
        return { 
          success: false, 
          error: userError.message || 'Failed to retrieve subscription information' 
        };
      }

      // If user doesn't have a subscription, return null
      if (!userData.stripe_subscription_id) {
        return { 
          success: true, 
          subscription: undefined 
        };
      }

      // Get subscription details from Stripe
      try {
        const subscription = await stripe.subscriptions.retrieve(
          userData.stripe_subscription_id,
          { expand: ['default_payment_method', 'items.data.price'] }
        );

        // Format subscription data
        const price = subscription.items.data[0]?.price as Stripe.Price;
        const planId = Object.keys(SUBSCRIPTION_PLANS).find(
          key => SUBSCRIPTION_PLANS[key].stripePriceId === price.id
        ) || 'custom';

        const planName = SUBSCRIPTION_PLANS[planId]?.name || 'Custom Plan';

        // Format payment method if available
        let paymentMethod = undefined;
        if (subscription.default_payment_method && typeof subscription.default_payment_method !== 'string') {
          const pm = subscription.default_payment_method as Stripe.PaymentMethod;
          if (pm.card) {
            paymentMethod = {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expiryMonth: pm.card.exp_month,
              expiryYear: pm.card.exp_year
            };
          }
        }

        const formattedSubscription: Subscription = {
          id: subscription.id,
          status: subscription.status as Subscription['status'],
          planType: planId,
          planName: planName,
          startDate: new Date(subscription.start_date * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          priceId: price.id,
          amount: price.unit_amount || 0,
          nextPaymentDate: subscription.current_period_end 
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : undefined,
          paymentMethod
        };

        return {
          success: true,
          subscription: formattedSubscription
        };
      } catch (stripeError: any) {
        console.error('Error retrieving subscription from Stripe:', stripeError);

        // Return basic subscription info from database as fallback
        return {
          success: true,
          subscription: {
            id: userData.stripe_subscription_id,
            status: (userData.subscription_status || 'unknown') as Subscription['status'],
            planType: userData.subscription_plan || 'unknown',
            planName: SUBSCRIPTION_PLANS[userData.subscription_plan]?.name || 'Unknown Plan',
            startDate: new Date().toISOString(), // We don't have this info
            currentPeriodEnd: userData.subscription_current_period_end 
              ? new Date(userData.subscription_current_period_end).toISOString() 
              : new Date().toISOString(),
            cancelAtPeriodEnd: false, // We don't have this info
            priceId: 'unknown',
            amount: SUBSCRIPTION_PLANS[userData.subscription_plan]?.price || 0
          }
        };
      }
    } catch (error: any) {
      console.error('Error getting user subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve subscription'
      };
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string): Promise<SubscriptionResult> {
    try {
      if (!stripe) {
        return { 
          success: false, 
          error: 'Stripe is not configured' 
        };
      }

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, stripe_customer_id')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error getting user data for checkout:', userError);
        return { 
          success: false, 
          error: userError.message || 'Failed to retrieve user information' 
        };
      }

      // Validate the price ID
      const validPriceIds = Object.values(SUBSCRIPTION_PLANS).map(plan => plan.stripePriceId);
      if (!validPriceIds.includes(priceId)) {
        return { 
          success: false, 
          error: 'Invalid price ID' 
        };
      }

      // Create or use existing customer
      let customerId = userData.stripe_customer_id;

      if (!customerId) {
        // Create a customer in Stripe
        const customer = await stripe.customers.create({
          email: userData.email,
          metadata: {
            user_id: userId
          }
        });

        customerId = customer.id;

        // Save customer ID in database
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          user_id: userId
        }
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url || undefined
      };
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      return {
        success: false,
        error: error.message || 'Failed to create checkout session'
      };
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string): Promise<SubscriptionResult> {
    try {
      if (!stripe) {
        return { 
          success: false, 
          error: 'Stripe is not configured' 
        };
      }

      // Get user subscription ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('stripe_subscription_id')
        .eq('id', userId)
        .single();

      if (userError || !userData.stripe_subscription_id) {
        return { 
          success: false, 
          error: 'No active subscription found' 
        };
      }

      // Cancel the subscription at period end
      const subscription = await stripe.subscriptions.update(
        userData.stripe_subscription_id,
        { cancel_at_period_end: true }
      );

      // Update user record
      await supabase
        .from('users')
        .update({ subscription_cancel_at_period_end: true })
        .eq('id', userId);

      // Log cancellation in subscription history
      this.logSubscriptionEvent(
        userId,
        userData.stripe_subscription_id,
        'canceled_scheduled',
        {
          cancel_at_period_end: true,
          current_period_end: subscription.current_period_end
        }
      );

      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status as Subscription['status'],
          planType: 'unknown', // We don't have this info here
          planName: 'Unknown',
          startDate: new Date(subscription.start_date * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          priceId: 'unknown',
          amount: 0
        }
      };
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel subscription'
      };
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(userId: string): Promise<SubscriptionResult> {
    try {
      if (!stripe) {
        return { 
          success: false, 
          error: 'Stripe is not configured' 
        };
      }

      // Get user subscription ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('stripe_subscription_id')
        .eq('id', userId)
        .single();

      if (userError || !userData.stripe_subscription_id) {
        return { 
          success: false, 
          error: 'No subscription found' 
        };
      }

      // Reactivate the subscription
      const subscription = await stripe.subscriptions.update(
        userData.stripe_subscription_id,
        { cancel_at_period_end: false }
      );

      // Update user record
      await supabase
        .from('users')
        .update({ subscription_cancel_at_period_end: false })
        .eq('id', userId);

      // Log reactivation in subscription history
      this.logSubscriptionEvent(
        userId,
        userData.stripe_subscription_id,
        'reactivated',
        {
          cancel_at_period_end: false
        }
      );

      return {
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status as Subscription['status'],
          planType: 'unknown', // We don't have this info here
          planName: 'Unknown',
          startDate: new Date(subscription.start_date * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          priceId: 'unknown',
          amount: 0
        }
      };
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      return {
        success: false,
        error: error.message || 'Failed to reactivate subscription'
      };
    }
  }

  /**
   * Change subscription plan
   */
  async changeSubscriptionPlan(userId: string, newPriceId: string): Promise<SubscriptionResult> {
    try {
      if (!stripe) {
        return { 
          success: false, 
          error: 'Stripe is not configured' 
        };
      }

      // Get user subscription ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('stripe_subscription_id')
        .eq('id', userId)
        .single();

      if (userError || !userData.stripe_subscription_id) {
        return { 
          success: false, 
          error: 'No active subscription found' 
        };
      }

      // Validate the price ID
      const validPriceIds = Object.values(SUBSCRIPTION_PLANS).map(plan => plan.stripePriceId);
      if (!validPriceIds.includes(newPriceId)) {
        return { 
          success: false, 
          error: 'Invalid price ID' 
        };
      }

      // Get subscription to find the current item ID
      const subscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id);
      const itemId = subscription.items.data[0].id;

      // Update the subscription with the new price
      const updatedSubscription = await stripe.subscriptions.update(
        userData.stripe_subscription_id,
        {
          items: [{
            id: itemId,
            price: newPriceId
          }]
        }
      );

      // Find the plan ID for the new price
      const planId = Object.keys(SUBSCRIPTION_PLANS).find(
        key => SUBSCRIPTION_PLANS[key].stripePriceId === newPriceId
      ) || 'custom';

      // Update user record with new plan
      await supabase
        .from('users')
        .update({ subscription_plan: planId })
        .eq('id', userId);

      // Log plan change in subscription history
      this.logSubscriptionEvent(
        userId,
        userData.stripe_subscription_id,
        'plan_changed',
        {
          previous_price_id: subscription.items.data[0].price.id,
          new_price_id: newPriceId,
          plan_id: planId
        }
      );

      return {
        success: true,
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status as Subscription['status'],
          planType: planId,
          planName: SUBSCRIPTION_PLANS[planId]?.name || 'Custom Plan',
          startDate: new Date(updatedSubscription.start_date * 1000).toISOString(),
          currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
          priceId: newPriceId,
          amount: SUBSCRIPTION_PLANS[planId]?.price || 0
        }
      };
    } catch (error: any) {
      console.error('Error changing subscription plan:', error);
      return {
        success: false,
        error: error.message || 'Failed to change subscription plan'
      };
    }
  }

  /**
   * Create a billing portal session
   */
  async createPortalSession(userId: string, returnUrl: string): Promise<SubscriptionResult> {
    try {
      if (!stripe) {
        return { 
          success: false, 
          error: 'Stripe is not configured' 
        };
      }

      // Get user's Stripe customer ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (userError || !userData.stripe_customer_id) {
        return { 
          success: false, 
          error: 'No Stripe customer found for this user' 
        };
      }

      // Create a portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: userData.stripe_customer_id,
        return_url: returnUrl
      });

      return {
        success: true,
        url: session.url
      };
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      return {
        success: false,
        error: error.message || 'Failed to create portal session'
      };
    }
  }

  /**
   * Log subscription event to history
   */
  private async logSubscriptionEvent(userId: string, subscriptionId: string, eventType: string, eventData: any): Promise<void> {
    try {
      await supabase
        .from('subscription_history')
        .insert({
          user_id: userId,
          subscription_id: subscriptionId,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging subscription event:', error);
    }
  }

  /**
   * Process webhook events from Stripe
   */
  async processWebhook(event: any): Promise<boolean> {
    try {
      console.log(`Processing webhook event: ${event.type}`);

      // Process different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;

          if (session.mode === 'subscription' && session.subscription && session.customer) {
            return await this.handleCheckoutCompleted(session);
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          return await this.handleSubscriptionUpdated(subscription);
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          return await this.handleSubscriptionDeleted(subscription);
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;

          if (invoice.subscription) {
            return await this.handleInvoicePaymentSucceeded(invoice);
          }
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;

          if (invoice.subscription) {
            return await this.handleInvoicePaymentFailed(invoice);
          }
          break;
        }
      }

      // For unhandled event types
      return true;
    } catch (error) {
      console.error('Error processing webhook:', error);
      return false;
    }
  }

  /**
   * Handle checkout.session.completed webhook event
   */
  private async handleCheckoutCompleted(session: any): Promise<boolean> {
    try {
      // Get user ID from metadata
      const userId = session.metadata?.user_id;

      if (!userId) {
        console.error('No user ID in checkout session metadata');
        return false;
      }

      // Get subscription details from Stripe
      const subscription = await stripe?.subscriptions.retrieve(
        session.subscription,
        { expand: ['items.data.price'] }
      );

      if (!subscription) {
        console.error('Could not retrieve subscription from Stripe');
        return false;
      }

      // Get the price ID to determine plan
      const priceId = subscription.items.data[0]?.price.id;

      // Find the plan for this price
      const planId = Object.keys(SUBSCRIPTION_PLANS).find(
        key => SUBSCRIPTION_PLANS[key].stripePriceId === priceId
      ) || 'custom';

      // Update user with subscription info
      await supabase
        .from('users')
        .update({
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          subscription_status: subscription.status,
          subscription_plan: planId,
          subscription_current_period_end: new Date(subscription.current_period_end * 1000),
          subscription_cancel_at_period_end: subscription.cancel_at_period_end
        })
        .eq('id', userId);

      // Log subscription creation in history
      await this.logSubscriptionEvent(
        userId,
        session.subscription,
        'created',
        {
          price_id: priceId,
          plan_id: planId,
          amount: subscription.items.data[0]?.price.unit_amount || 0,
          status: subscription.status,
          currency: subscription.currency,
          interval: subscription.items.data[0]?.plan.interval || 'month',
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000)
        }
      );

      return true;
    } catch (error) {
      console.error('Error handling checkout completed webhook:', error);
      return false;
    }
  }

  /**
   * Handle customer.subscription.updated webhook event
   */
  private async handleSubscriptionUpdated(subscription: any): Promise<boolean> {
    try {
      // Find user by subscription ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, subscription_plan')
        .eq('stripe_subscription_id', subscription.id)
        .maybeSingle();

      if (userError || !userData) {
        console.error('Could not find user for subscription:', subscription.id);
        return false;
      }

      // Get the price ID to determine if plan changed
      const priceId = subscription.items.data[0]?.price.id;

      // Find the plan for this price
      const planId = Object.keys(SUBSCRIPTION_PLANS).find(
        key => SUBSCRIPTION_PLANS[key].stripePriceId === priceId
      ) || 'custom';

      // Check if plan changed
      const planChanged = planId !== userData.subscription_plan;

      // Update user with subscription info
      await supabase
        .from('users')
        .update({
          subscription_status: subscription.status,
          subscription_plan: planId,
          subscription_current_period_end: new Date(subscription.current_period_end * 1000),
          subscription_cancel_at_period_end: subscription.cancel_at_period_end
        })
        .eq('id', userData.id);

      // Log subscription update in history
      await this.logSubscriptionEvent(
        userData.id,
        subscription.id,
        planChanged ? 'plan_changed' : 'updated',
        {
          price_id: priceId,
          plan_id: planId,
          previous_plan_id: userData.subscription_plan,
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: new Date(subscription.current_period_end * 1000)
        }
      );

      return true;
    } catch (error) {
      console.error('Error handling subscription updated webhook:', error);
      return false;
    }
  }

  /**
   * Handle customer.subscription.deleted webhook event
   */
  private async handleSubscriptionDeleted(subscription: any): Promise<boolean> {
    try {
      // Find user by subscription ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .maybeSingle();

      if (userError || !userData) {
        console.error('Could not find user for subscription:', subscription.id);
        return false;
      }

      // Update user record to mark subscription as canceled
      await supabase
        .from('users')
        .update({
          subscription_status: 'canceled',
          subscription_cancel_at_period_end: false,
          subscription_current_period_end: new Date(subscription.current_period_end * 1000)
        })
        .eq('id', userData.id);

      // Log subscription cancellation in history
      await this.logSubscriptionEvent(
        userData.id,
        subscription.id,
        'canceled',
        {
          canceled_at: new Date(),
          current_period_end: new Date(subscription.current_period_end * 1000)
        }
      );

      return true;
    } catch (error) {
      console.error('Error handling subscription deleted webhook:', error);
      return false;
    }
  }

  /**
   * Handle invoice.payment_succeeded webhook event
   */
  private async handleInvoicePaymentSucceeded(invoice: any): Promise<boolean> {
    try {
      // Get the subscription
      const subscription = await stripe?.subscriptions.retrieve(invoice.subscription);

      if (!subscription) {
        console.error('Could not retrieve subscription for invoice:', invoice.id);
        return false;
      }

      // Find user by subscription ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_subscription_id', invoice.subscription)
        .maybeSingle();

      if (userError || !userData) {
        console.error('Could not find user for subscription:', invoice.subscription);
        return false;
      }

      // Update user with renewed subscription period
      await supabase
        .from('users')
        .update({
          subscription_status: subscription.status,
          subscription_current_period_end: new Date(subscription.current_period_end * 1000)
        })
        .eq('id', userData.id);

      // Log payment in history
      await this.logSubscriptionEvent(
        userData.id,
        invoice.subscription,
        'payment_succeeded',
        {
          invoice_id: invoice.id,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          current_period_end: new Date(subscription.current_period_end * 1000)
        }
      );

      return true;
    } catch (error) {
      console.error('Error handling invoice payment succeeded webhook:', error);
      return false;
    }
  }

  /**
   * Handle invoice.payment_failed webhook event
   */
  private async handleInvoicePaymentFailed(invoice: any): Promise<boolean> {
    try {
      // Get the subscription
      const subscription = await stripe?.subscriptions.retrieve(invoice.subscription);

      if (!subscription) {
        console.error('Could not retrieve subscription for invoice:', invoice.id);
        return false;
      }

      // Find user by subscription ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('stripe_subscription_id', invoice.subscription)
        .maybeSingle();

      if (userError || !userData) {
        console.error('Could not find user for subscription:', invoice.subscription);
        return false;
      }

      // Update user with subscription status
      await supabase
        .from('users')
        .update({
          subscription_status: subscription.status
        })
        .eq('id', userData.id);

      // Log failed payment in history
      await this.logSubscriptionEvent(
        userData.id,
        invoice.subscription,
        'payment_failed',
        {
          invoice_id: invoice.id,
          attempt_count: invoice.attempt_count,
          next_payment_attempt: invoice.next_payment_attempt 
            ? new Date(invoice.next_payment_attempt * 1000) 
            : null
        }
      );

      // TODO: Add code to send email notification to user about failed payment

      return true;
    } catch (error) {
      console.error('Error handling invoice payment failed webhook:', error);
      return false;
    }
  }
}

// Create and export singleton instance
export const subscriptionService = new SubscriptionService();
export default subscriptionService;