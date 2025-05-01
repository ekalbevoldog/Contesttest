// This file contains the subscription plans information used on the client-side

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in cents
  features: string[];
  description: string;
  stripePriceId: string;
  recommended?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 9900, // $99.00
    description: 'Essential features for growing businesses',
    features: [
      'Up to 5 athlete matches per month',
      'Basic analytics dashboard',
      'Email support',
      'Campaign management tools',
    ],
    stripePriceId: 'price_basic' // This should match the ID in Stripe's dashboard
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 19900, // $199.00
    description: 'Advanced features for scaling your athlete partnerships',
    features: [
      'Up to 15 athlete matches per month',
      'Advanced analytics dashboard',
      'Priority email & chat support',
      'Comprehensive campaign management',
      'Performance reports',
    ],
    stripePriceId: 'price_pro',
    recommended: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 39900, // $399.00
    description: 'Complete solution for large-scale influencer marketing',
    features: [
      'Unlimited athlete matches',
      'Executive analytics dashboard',
      '24/7 dedicated support',
      'Full campaign suite',
      'Custom reporting',
      'API access',
    ],
    stripePriceId: 'price_enterprise'
  }
};