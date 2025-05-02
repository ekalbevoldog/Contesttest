import { useState, useEffect } from 'react';
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, CheckCircle2, AlertCircle, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import { UnifiedProtectedRoute } from '@/lib/unified-protected-route';

// Load the Stripe object outside component render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Component for the subscription form
const SubscriptionForm = ({ priceId, onSuccess }: { priceId: string, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: 'Subscription Error',
        description: 'Stripe has not yet loaded. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription/success',
        },
      });

      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message || 'An unknown error occurred',
          variant: 'destructive',
        });
      } else {
        // If we get here, the payment was successful
        toast({
          title: 'Payment Successful',
          description: 'Thank you for your subscription!',
        });
        onSuccess();
      }
    } catch (err) {
      toast({
        title: 'Error Processing Payment',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
      <PaymentElement />
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Subscribe Now'
        )}
      </Button>
    </form>
  );
};

// Component for the plan selection cards
const PlanCard = ({ 
  plan, 
  selected, 
  onSelect 
}: { 
  plan: any, 
  selected: boolean, 
  onSelect: () => void 
}) => {
  return (
    <Card className={`relative ${selected ? 'border-primary' : 'border-border'}`}>
      {selected && (
        <div className="absolute -top-2 -right-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {plan.name}
          <Badge variant={plan.metadata?.recommended ? 'default' : 'outline'}>
            {plan.metadata?.recommended ? 'Recommended' : `${(plan.unitAmount / 100).toFixed(2)} ${plan.currency.toUpperCase()}`}
          </Badge>
        </CardTitle>
        <CardDescription>
          {plan.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold mb-4">
          ${(plan.unitAmount / 100).toFixed(2)}/{plan.interval}
        </div>
        <ul className="space-y-2">
          {plan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onSelect} 
          variant={selected ? 'default' : 'outline'} 
          className="w-full"
        >
          {selected ? 'Selected' : 'Select Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Main subscription management page
const SubscribeContent = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Get user's current subscription status
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/subscription/status');
      return res.json();
    },
    enabled: !!user,
  });
  
  // Get available subscription plans
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/subscription/plans'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/subscription/plans');
      return res.json();
    },
  });
  
  // Create subscription mutation
  const createSubscription = useMutation({
    mutationFn: async (priceId: string) => {
      const res = await apiRequest('POST', '/api/get-or-create-subscription', { priceId });
      return res.json();
    },
    onSuccess: (data) => {
      // Update client secret for payment form
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else if (data.status === 'active') {
        // If subscription is already active, redirect to account page
        toast({
          title: 'Subscription Active',
          description: 'You already have an active subscription.',
        });
        navigate('/dashboard');
      }
      
      // Invalidate subscription status query
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Subscription Error',
        description: error.message || 'Failed to create subscription',
        variant: 'destructive',
      });
    },
  });
  
  // Handle plan selection
  const handleSelectPlan = (priceId: string) => {
    setSelectedPlan(priceId);
  };
  
  // Start the subscription process
  const handleStartSubscription = () => {
    if (!selectedPlan) {
      toast({
        title: 'Please Select a Plan',
        description: 'You need to select a subscription plan to continue.',
        variant: 'destructive',
      });
      return;
    }
    
    createSubscription.mutate(selectedPlan);
  };
  
  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/subscription/cancel');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Canceled',
        description: 'Your subscription will be canceled at the end of the current billing period.',
      });
      
      // Invalidate subscription status query
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Error',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    },
  });
  
  // Resume subscription mutation
  const resumeSubscription = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/subscription/resume');
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscription Resumed',
        description: 'Your subscription has been successfully resumed.',
      });
      
      // Invalidate subscription status query
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Resume Error',
        description: error.message || 'Failed to resume subscription',
        variant: 'destructive',
      });
    },
  });
  
  // Handle successful subscription
  const handleSubscriptionSuccess = () => {
    navigate('/dashboard');
  };
  
  // Return to dashboard if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);
  
  // Loading state
  if (subscriptionLoading || plansLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="mt-4 text-lg">Loading subscription information...</div>
      </div>
    );
  }
  
  // Show active subscription management
  if (subscription?.status === 'active') {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
          <p className="text-muted-foreground">Manage your current subscription</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your subscription is currently active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant="outline" className="text-green-500">
                  Active
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Plan:</span>
                <span>{subscription.plan || 'Standard Plan'}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Period Ends:</span>
                <span>
                  {subscription.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()
                    : 'Not available'}
                </span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md mt-6">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800 dark:text-amber-300">Cancellation Scheduled</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Your subscription is set to cancel at the end of the current billing period.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
            
            {subscription.cancelAtPeriodEnd ? (
              <Button 
                onClick={() => resumeSubscription.mutate()} 
                disabled={resumeSubscription.isPending}
              >
                {resumeSubscription.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Resume Subscription'
                )}
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={() => cancelSubscription.mutate()} 
                disabled={cancelSubscription.isPending}
              >
                {cancelSubscription.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Show payment form when client secret is available
  if (clientSecret) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
          <p className="text-muted-foreground">Enter your payment details to start your subscription</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Your subscription will start immediately</CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscriptionForm 
                priceId={selectedPlan || ''} 
                onSuccess={handleSubscriptionSuccess} 
              />
            </Elements>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show plan selection
  const plans = plansData?.plans || [];
  
  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Choose Your Subscription Plan</h1>
        <p className="text-muted-foreground">Select the plan that best suits your needs</p>
      </div>
      
      {plans.length === 0 ? (
        <div className="text-center p-12">
          <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Available Plans</h2>
          <p className="text-muted-foreground">
            There are currently no subscription plans available. Please check back later.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {plans.map((plan: any) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlan === plan.priceId}
                onSelect={() => handleSelectPlan(plan.priceId)}
              />
            ))}
          </div>
          
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleStartSubscription}
              disabled={!selectedPlan || createSubscription.isPending}
              size="lg"
            >
              {createSubscription.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const Subscribe = () => {
  return (
    <UnifiedProtectedRoute>
      <SubscribeContent />
    </UnifiedProtectedRoute>
  );
};

export default Subscribe;