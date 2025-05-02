import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertTriangle, CheckCircle, Crown, Clock } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { UnifiedProtectedRoute } from "@/lib/unified-protected-route";

// Make sure to replace with your app's Stripe public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
  recommended?: boolean;
}

export default function SubscriptionPage() {
  return (
    <UnifiedProtectedRoute>
      <SubscriptionPageContent />
    </UnifiedProtectedRoute>
  );
}

function SubscriptionPageContent() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Get available plans
  const { data: plansData, isLoading: plansLoading } = useQuery<{
    plans: SubscriptionPlan[];
  }>({
    queryKey: ['/api/subscription/plans'],
  });
  
  const plans = plansData?.plans || [];
  
  // Get current subscription
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery<{
    subscription: {
      id: string;
      status: string;
      planType: string;
      currentPeriodEnd: number;
    } | null;
  }>({
    queryKey: ['/api/subscription/subscription'],
    enabled: !!user,
  });
  
  const subscription = subscriptionData?.subscription;
  
  // Create portal session mutation
  const createPortalMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/subscription/create-portal-session', {
        return_url: window.location.href,
      });
      return await res.json();
    },
    onSuccess: (data: { url: string }) => {
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to open customer portal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiRequest('POST', '/api/subscription/get-or-create-subscription', {
        planId,
      });
      return await res.json();
    },
    onSuccess: (data: { clientSecret: string, subscriptionId: string }) => {
      // Save selected plan for after payment
      localStorage.setItem('pendingSubscriptionPlan', selectedPlan || '');
      // Redirect to checkout page
      stripePromise.then(stripe => {
        if (stripe) {
          stripe.confirmCardPayment(data.clientSecret, {
            payment_method: {
              card: {
                token: 'tok_visa', // For testing only - in production this would be a real card
              },
            },
            return_url: `${window.location.origin}/subscription-success?subscription_id=${data.subscriptionId}`,
          });
        }
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const res = await apiRequest('POST', '/api/subscription/cancel-subscription', {
        subscriptionId,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription canceled",
        description: "Your subscription has been canceled and will end at the end of the current billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/subscription'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Resume subscription mutation
  const resumeSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const res = await apiRequest('POST', '/api/subscription/resume-subscription', {
        subscriptionId,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription resumed",
        description: "Your subscription has been successfully resumed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/subscription'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resume subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle subscription creation
  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    createSubscriptionMutation.mutate(planId);
  };
  
  // Handle subscription cancellation
  const handleCancelSubscription = () => {
    if (subscription?.id) {
      if (confirm('Are you sure you want to cancel your subscription?')) {
        cancelSubscriptionMutation.mutate(subscription.id);
      }
    }
  };
  
  // Handle subscription resumption
  const handleResumeSubscription = () => {
    if (subscription?.id) {
      resumeSubscriptionMutation.mutate(subscription.id);
    }
  };
  
  // Handle management portal redirect
  const handleManageSubscription = () => {
    createPortalMutation.mutate();
  };
  
  // Format subscription expiration date
  const formatExpirationDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Render status info based on subscription status
  const renderSubscriptionStatus = () => {
    if (subscriptionLoading) {
      return (
        <div className="flex items-center space-x-4 my-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[160px]" />
          </div>
        </div>
      );
    }
    
    if (!subscription) {
      return (
        <div className="flex items-center space-x-4 my-4 text-gray-400">
          <Crown className="h-8 w-8 text-gray-500" />
          <div>
            <h3 className="text-sm font-medium">Free Plan</h3>
            <p className="text-xs">You're currently on the free plan</p>
          </div>
        </div>
      );
    }
    
    const status = subscription.status;
    const planName = subscription.planType || 'Premium';
    
    // Different UI based on subscription status
    if (status === 'active' || status === 'trialing') {
      return (
        <div className="flex items-center space-x-4 my-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div>
            <h3 className="text-sm font-medium">{planName} Plan (Active)</h3>
            <p className="text-xs">
              Your subscription is active until {formatExpirationDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        </div>
      );
    } else if (status === 'canceled') {
      return (
        <div className="flex items-center space-x-4 my-4">
          <Clock className="h-8 w-8 text-amber-500" />
          <div>
            <h3 className="text-sm font-medium">{planName} Plan (Canceling)</h3>
            <p className="text-xs">
              Your subscription will end on {formatExpirationDate(subscription.currentPeriodEnd)}
            </p>
          </div>
        </div>
      );
    } else if (status === 'past_due' || status === 'unpaid') {
      return (
        <div className="flex items-center space-x-4 my-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div>
            <h3 className="text-sm font-medium">{planName} Plan (Payment Issue)</h3>
            <p className="text-xs">
              We couldn't process your payment. Please update your payment details.
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-4 my-4">
        <Crown className="h-8 w-8 text-gray-500" />
        <div>
          <h3 className="text-sm font-medium">{planName} Plan ({status})</h3>
          <p className="text-xs">
            {subscription.currentPeriodEnd 
              ? `Subscription ends on ${formatExpirationDate(subscription.currentPeriodEnd)}`
              : 'Subscription details unavailable'}
          </p>
        </div>
      </div>
    );
  };
  
  // Subscription action buttons based on status
  const renderActionButtons = () => {
    if (!subscription) {
      return null;
    }
    
    const status = subscription.status;
    
    if (status === 'active' || status === 'trialing') {
      return (
        <div className="flex space-x-3 mt-4">
          <Button
            variant="outline"
            onClick={handleManageSubscription}
            disabled={createPortalMutation.isPending}
          >
            {createPortalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Manage Payment
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancelSubscription}
            disabled={cancelSubscriptionMutation.isPending}
          >
            {cancelSubscriptionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Subscription
          </Button>
        </div>
      );
    } else if (status === 'canceled') {
      return (
        <div className="flex space-x-3 mt-4">
          <Button
            variant="default"
            onClick={handleResumeSubscription}
            disabled={resumeSubscriptionMutation.isPending}
          >
            {resumeSubscriptionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resume Subscription
          </Button>
        </div>
      );
    } else if (status === 'past_due' || status === 'unpaid') {
      return (
        <div className="flex space-x-3 mt-4">
          <Button
            variant="default"
            onClick={handleManageSubscription}
            disabled={createPortalMutation.isPending}
          >
            {createPortalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Payment Method
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex space-x-3 mt-4">
        <Button
          variant="outline"
          onClick={handleManageSubscription}
          disabled={createPortalMutation.isPending}
        >
          {createPortalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Manage Subscription
        </Button>
      </div>
    );
  };
  
  return (
    <div className="container max-w-4xl py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-gray-400 mt-1">Manage your Contested subscription plan</p>
        </div>
        <SubscriptionBadge size="lg" showTooltip={true} redirectToUpgrade={false} />
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>Your current subscription status and details</CardDescription>
        </CardHeader>
        <CardContent>
          {renderSubscriptionStatus()}
          {renderActionButtons()}
        </CardContent>
      </Card>
      
      <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-neutral-800">
              <CardHeader>
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-28" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative border ${plan.recommended ? 'border-primary' : 'border-neutral-800'}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 right-4 bg-primary px-3 py-1 rounded-full text-xs font-medium">
                  Recommended
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-400 ml-2">/{plan.interval}</span>
                </div>
                <div className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  variant={plan.recommended ? 'default' : 'outline'}
                  disabled={
                    createSubscriptionMutation.isPending || 
                    (subscription?.planType === plan.id && subscription?.status === 'active')
                  }
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {createSubscriptionMutation.isPending && selectedPlan === plan.id && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {subscription?.planType === plan.id && subscription?.status === 'active' 
                    ? 'Current Plan' 
                    : 'Subscribe'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center border border-neutral-800">
          <p className="text-gray-400">No subscription plans are currently available.</p>
        </Card>
      )}
    </div>
  );
};