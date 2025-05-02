import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { loadStripe } from '@stripe/stripe-js';
import { ChevronLeft, Crown, Check, Loader2 } from 'lucide-react';
import { UnifiedProtectedRoute } from '@/lib/unified-protected-route';
import { apiRequest } from '@/lib/queryClient';

// Plans configuration
const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$9.99',
    period: 'month',
    description: 'Essential features for individuals',
    features: [
      'Basic profile customization',
      'Limited match recommendations',
      'Email support'
    ],
    recommended: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19.99',
    period: 'month',
    description: 'Advanced features for serious users',
    features: [
      'Enhanced profile customization',
      'Unlimited match recommendations',
      'Priority email support',
      'Advanced analytics'
    ],
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49.99',
    period: 'month',
    description: 'Complete solution for businesses',
    features: [
      'All Pro features',
      'Dedicated account manager',
      'API access',
      'Custom integrations',
      'Team collaboration tools'
    ],
    recommended: false
  }
];

// Ensure Stripe key is set
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('Missing Stripe publishable key. Checkout functionality will not work.');
}

// Initialize Stripe outside of component rendering
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

// The subscription management component
const SubscribeContent = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useSupabaseAuth();

  // Fetch current subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        const response = await apiRequest('GET', '/api/subscription/status');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }
        
        const data = await response.json();
        setSubscription(data.subscription);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to load subscription details');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load subscription details. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user, toast]);

  // Handle subscription checkout
  const handleSubscribe = async (planId: string) => {
    try {
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Authentication Required',
          description: 'Please log in to subscribe to a plan.',
        });
        navigate('/auth');
        return;
      }

      setLoadingPlan(planId);
      
      // Get the real price ID from the server or use a mapping
      const priceMap: Record<string, string> = {
        'basic': import.meta.env.VITE_STRIPE_BASIC_PRICE_ID || 'price_basic',
        'pro': import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro',
        'enterprise': import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise'
      };
      
      const priceId = priceMap[planId];
      
      // Create checkout session
      const response = await apiRequest('POST', '/api/subscription/create-checkout-session', {
        priceId,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscribe`
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect to checkout
      window.location.href = url;
    } catch (err) {
      console.error('Error subscribing to plan:', err);
      toast({
        variant: 'destructive',
        title: 'Subscription Error',
        description: err instanceof Error ? err.message : 'Failed to process subscription. Please try again.',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      
      const response = await apiRequest('POST', '/api/subscription/cancel');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }
      
      const data = await response.json();
      
      // Update subscription status
      setSubscription({
        ...subscription,
        cancelAtPeriodEnd: true
      });
      
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will be cancelled at the end of the billing period.',
      });
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to cancel subscription. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle subscription reactivation
  const handleReactivateSubscription = async () => {
    try {
      setLoading(true);
      
      const response = await apiRequest('POST', '/api/subscription/reactivate');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reactivate subscription');
      }
      
      // Update subscription status
      setSubscription({
        ...subscription,
        cancelAtPeriodEnd: false
      });
      
      toast({
        title: 'Subscription Reactivated',
        description: 'Your subscription has been successfully reactivated.',
      });
    } catch (err) {
      console.error('Error reactivating subscription:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reactivate subscription. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create Stripe customer portal session
  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      
      const response = await apiRequest('POST', '/api/subscription/create-portal-session', {
        returnUrl: window.location.href
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }
      
      const { url } = await response.json();
      setPortalUrl(url);
      
      // Redirect to Stripe portal
      window.location.href = url;
    } catch (err) {
      console.error('Error creating portal session:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to access subscription management. Please try again.',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  // If user has an active subscription, show management interface
  if (subscription) {
    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const isPastDue = subscription.status === 'past_due';
    const isCancelled = subscription.cancelAtPeriodEnd;
    
    const formatDate = (timestamp: number) => {
      if (!timestamp) return 'Unknown';
      return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl md:text-3xl">Subscription Management</CardTitle>
            </div>
            <CardDescription className="text-base">
              Manage your subscription plan and billing details
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Subscription Status */}
            <div className="rounded-lg border p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Current Subscription</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium 
                  ${isActive && !isCancelled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 
                    isPastDue ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' : 
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}
                >
                  {isCancelled ? 'Cancelling' : subscription.status}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{subscription.plan || 'Standard'}</span>
                </div>
                
                {subscription.currentPeriodEnd && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">
                      {isCancelled ? 'Expires On' : 'Next Billing Date'}
                    </span>
                    <span className="font-medium">
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                )}
                
                {subscription.cancelAtPeriodEnd && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                    <p className="text-amber-800 dark:text-amber-200">
                      Your subscription will be canceled on the next billing date. 
                      You can continue to use premium features until then.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Subscription Actions */}
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold text-lg mb-4">Subscription Actions</h3>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={portalLoading || !isActive}
                  className="flex-1"
                >
                  {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Manage Payment Methods
                </Button>
                
                {subscription.cancelAtPeriodEnd ? (
                  <Button 
                    onClick={handleReactivateSubscription}
                    disabled={loading || !isActive}
                    className="flex-1"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Resume Subscription
                  </Button>
                ) : (
                  <Button 
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={loading || !isActive}
                    className="flex-1"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no subscription, show plans
  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground">
          Select the subscription that best fits your needs
        </p>
      </div>

      <Tabs defaultValue="monthly" className="w-full mb-8">
        <div className="flex justify-center mb-6">
          <TabsList>
            <TabsTrigger value="monthly">Monthly Billing</TabsTrigger>
            <TabsTrigger value="annual">Annual Billing (Save 20%)</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Card 
                key={plan.id}
                className={`border-2 ${plan.recommended ? 'border-primary shadow-lg shadow-primary/20' : 'shadow'}`}
              >
                {plan.recommended && (
                  <div className="bg-primary text-primary-foreground text-sm font-medium py-1 px-3 text-center">
                    Most Popular
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full"
                    variant={plan.recommended ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Subscribe</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="annual" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => {
              // Apply 20% discount for annual billing
              const monthlyPrice = parseFloat(plan.price.replace('$', ''));
              const annualPrice = (monthlyPrice * 12 * 0.8).toFixed(2);
              
              return (
                <Card 
                  key={plan.id}
                  className={`border-2 ${plan.recommended ? 'border-primary shadow-lg shadow-primary/20' : 'shadow'}`}
                >
                  {plan.recommended && (
                    <div className="bg-primary text-primary-foreground text-sm font-medium py-1 px-3 text-center">
                      Most Popular
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">${annualPrice}</span>
                      <span className="text-muted-foreground">/year</span>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="line-through">${monthlyPrice * 12}</span> Save 20%
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className="w-full"
                      variant={plan.recommended ? 'default' : 'outline'}
                      onClick={() => handleSubscribe(`${plan.id}_annual`)}
                      disabled={loadingPlan !== null}
                    >
                      {loadingPlan === `${plan.id}_annual` ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Subscribe</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
      
      {error && (
        <div className="mt-6 p-4 border border-destructive/50 bg-destructive/10 rounded-md">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            If this problem persists, please contact our support team.
          </p>
        </div>
      )}
      
      <div className="mt-12 text-center">
        <h3 className="text-xl font-semibold mb-4">Subscription FAQ</h3>
        
        <div className="max-w-3xl mx-auto space-y-6 text-left">
          <div>
            <h4 className="font-medium mb-2">How does billing work?</h4>
            <p className="text-muted-foreground">
              You'll be charged immediately upon subscribing, and then on the same date each billing period. 
              You can cancel anytime.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Can I change my plan later?</h4>
            <p className="text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. 
              Changes will be prorated for the remainder of your billing period.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">How do I cancel my subscription?</h4>
            <p className="text-muted-foreground">
              You can cancel your subscription at any time from the subscription management page.
              Your subscription will remain active until the end of your current billing period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap with protected route
const Subscribe = () => {
  return (
    <UnifiedProtectedRoute>
      <SubscribeContent />
    </UnifiedProtectedRoute>
  );
};

export default Subscribe;