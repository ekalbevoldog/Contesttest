import Stripe from 'stripe';
import { z } from 'zod';

// Make sure the Stripe secret key is available
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Schema for subscription plans
export const SubscriptionPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  features: z.array(z.string()),
  stripePriceId: z.string()
});

export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

// Define the subscription plans with real Stripe price IDs
// These would come from your Stripe dashboard
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 99,
    features: [
      'Up to 5 athlete matches per month',
      'Basic analytics dashboard',
      'Email support',
      'Campaign management tools',
    ],
    stripePriceId: 'price_basic' // Replace with actual Stripe price ID
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 199,
    features: [
      'Up to 15 athlete matches per month',
      'Advanced analytics dashboard',
      'Priority email & chat support',
      'Comprehensive campaign management',
      'Performance reports',
    ],
    stripePriceId: 'price_pro' // Replace with actual Stripe price ID
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399,
    features: [
      'Unlimited athlete matches',
      'Executive analytics dashboard',
      '24/7 dedicated support',
      'Full campaign suite',
      'Custom reporting',
      'API access',
    ],
    stripePriceId: 'price_enterprise' // Replace with actual Stripe price ID
  }
};

// Schema for subscription data
export const SubscriptionSchema = z.object({
  id: z.string(),
  status: z.enum([
    'active', 
    'past_due', 
    'canceled', 
    'unpaid', 
    'trialing', 
    'incomplete', 
    'incomplete_expired', 
    'paused'
  ]),
  planType: z.string(),
  planName: z.string(),
  startDate: z.string(),
  currentPeriodEnd: z.string(),
  cancelAtPeriodEnd: z.boolean(),
  priceId: z.string(),
  amount: z.number(),
  lastPaymentDate: z.string().optional(),
  nextPaymentDate: z.string().optional(),
  paymentMethod: z.object({
    brand: z.string(),
    last4: z.string(),
    expiryMonth: z.number(),
    expiryYear: z.number()
  }).optional()
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// Helper function to create a customer in Stripe
export async function createCustomer(email: string, name?: string, metadata?: Record<string, string>) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata
    });
    
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

// Create a subscription setup intent for a customer
export async function createSubscription(customerId: string, priceId: string) {
  try {
    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: priceId,
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Return the client secret for the payment intent
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
    
    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Get subscription details
export async function getSubscription(subscriptionId: string): Promise<Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer', 'items.data.price']
    });

    if (!subscription) {
      return null;
    }

    // Extract the payment method details if available
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

    // Convert the subscription to our schema
    const price = subscription.items.data[0]?.price as Stripe.Price;
    const planId = Object.keys(SUBSCRIPTION_PLANS).find(
      key => SUBSCRIPTION_PLANS[key].stripePriceId === price.id
    ) || 'custom';
    
    const planName = SUBSCRIPTION_PLANS[planId]?.name || 'Custom Plan';
    
    return {
      id: subscription.id,
      status: subscription.status as any,
      planType: planId,
      planName: planName,
      startDate: new Date(subscription.start_date * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId: price.id,
      amount: price.unit_amount || 0,
      lastPaymentDate: subscription.latest_invoice 
        ? new Date((subscription.latest_invoice as any).created * 1000).toISOString() 
        : undefined,
      nextPaymentDate: subscription.current_period_end 
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : undefined,
      paymentMethod
    };
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

// Get customer's active subscriptions
export async function getCustomerSubscriptions(customerId: string): Promise<Subscription[]> {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.default_payment_method', 'data.items.data.price']
    });

    return subscriptions.data.map(subscription => {
      // Extract the payment method details if available
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

      // Get plan details
      const price = subscription.items.data[0]?.price as Stripe.Price;
      const planId = Object.keys(SUBSCRIPTION_PLANS).find(
        key => SUBSCRIPTION_PLANS[key].stripePriceId === price.id
      ) || 'custom';
      
      const planName = SUBSCRIPTION_PLANS[planId]?.name || 'Custom Plan';
      
      return {
        id: subscription.id,
        status: subscription.status as any,
        planType: planId,
        planName: planName,
        startDate: new Date(subscription.start_date * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceId: price.id,
        amount: price.unit_amount || 0,
        lastPaymentDate: subscription.latest_invoice 
          ? new Date((subscription.latest_invoice as any).created * 1000).toISOString() 
          : undefined,
        nextPaymentDate: subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : undefined,
        paymentMethod
      };
    });
  } catch (error) {
    console.error('Error retrieving customer subscriptions:', error);
    return [];
  }
}

// Cancel a subscription at period end
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    return true;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return false;
  }
}

// Resume a subscription that was cancelled but still active
export async function resumeSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
    return true;
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return false;
  }
}

// Change subscription plan
export async function changeSubscriptionPlan(subscriptionId: string, newPriceId: string): Promise<boolean> {
  try {
    // Get the subscription to find the current item ID
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = subscription.items.data[0].id;

    // Update the subscription with the new price
    await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: itemId,
        price: newPriceId,
      }],
    });

    return true;
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    return false;
  }
}

// Create a portal session for managing subscriptions
export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    
    return session.url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}

export default {
  stripe,
  SUBSCRIPTION_PLANS,
  createCustomer,
  createSubscription,
  getSubscription,
  getCustomerSubscriptions,
  cancelSubscription,
  resumeSubscription,
  changeSubscriptionPlan,
  createPortalSession
};