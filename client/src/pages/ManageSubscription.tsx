import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, CheckCircle, CreditCard, Calendar, ArrowUpCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS } from '../data/subscription-plans';

interface Subscription {
  id: string;
  status: string;
  planType: string;
  planName: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  paymentMethod?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
}

export default function ManageSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [isCreatingPortal, setIsCreatingPortal] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setIsLoading(false);
        setError('You must be logged in to view subscription details');
        return;
      }

      try {
        const response = await apiRequest('GET', '/api/subscription/subscription');
        
        if (!response.ok) {
          const data = await response.json();
          if (response.status === 404) {
            // Not an error - just no subscription yet
            setSubscription(null);
            setIsLoading(false);
            return;
          }
          throw new Error(data.message || 'Failed to fetch subscription details');
        }
        
        const data = await response.json();
        setSubscription(data.subscription);
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        toast({
          title: "Failed to load subscription",
          description: "We couldn't load your subscription details. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user, toast]);

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    
    setProcessingAction(true);
    try {
      const response = await apiRequest('POST', '/api/subscription/cancel-subscription', {
        subscriptionId: subscription.id
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel subscription');
      }
      
      const data = await response.json();
      
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will remain active until the end of the current billing period.",
      });
      
      // Refresh subscription data
      setSubscription(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: true
      } : null);
      
    } catch (err) {
      console.error('Error canceling subscription:', err);
      toast({
        title: "Cancellation Failed",
        description: err instanceof Error ? err.message : 'Failed to cancel your subscription',
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
      setCancelDialogOpen(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!subscription) return;
    
    setProcessingAction(true);
    try {
      const response = await apiRequest('POST', '/api/subscription/resume-subscription', {
        subscriptionId: subscription.id
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to resume subscription');
      }
      
      toast({
        title: "Subscription Resumed",
        description: "Your subscription has been resumed and will continue automatically.",
      });
      
      // Refresh subscription data
      setSubscription(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: false
      } : null);
      
    } catch (err) {
      console.error('Error resuming subscription:', err);
      toast({
        title: "Resume Failed",
        description: err instanceof Error ? err.message : 'Failed to resume your subscription',
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpgradeSubscription = async (planId: string) => {
    if (!subscription) return;
    
    setProcessingAction(true);
    try {
      const response = await apiRequest('POST', '/api/subscription/change-plan', {
        planId
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change subscription plan');
      }
      
      const data = await response.json();
      
      toast({
        title: "Plan Changed",
        description: data.message || "Your subscription plan has been updated successfully.",
      });
      
      // Refresh the subscription data
      const refreshResponse = await apiRequest('GET', '/api/subscription/subscription');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setSubscription(refreshData.subscription);
      }
      
    } catch (err) {
      console.error('Error changing subscription plan:', err);
      toast({
        title: "Plan Change Failed",
        description: err instanceof Error ? err.message : 'Failed to change your subscription plan',
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
      setUpgradeDialogOpen(false);
    }
  };

  const openStripePortal = async () => {
    setIsCreatingPortal(true);
    try {
      const response = await apiRequest('POST', '/api/subscription/create-portal-session', {
        return_url: window.location.href
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create portal session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe portal
      window.location.href = url;
    } catch (err) {
      console.error('Error creating portal session:', err);
      toast({
        title: "Portal Access Failed",
        description: err instanceof Error ? err.message : 'Failed to access the payment portal',
        variant: "destructive"
      });
      setIsCreatingPortal(false);
    }
  };

  // Format a date string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Canceling</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'past_due':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Past Due</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Canceled</Badge>;
      case 'trialing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Trial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-3xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>Manage your subscription plan and billing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium">Error Loading Subscription</h3>
              <p className="text-sm text-slate-500 mt-2 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subscription) {
    // No active subscription
    return (
      <div className="container max-w-3xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>Subscribe to access premium features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-8 text-center">
              <div className="p-3 bg-slate-100 rounded-full mb-4">
                <CreditCard className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
              <p className="text-sm text-slate-500 max-w-md mb-6">
                You don't have an active subscription. Subscribe to a plan to access premium features 
                and enhance your experience.
              </p>
              <Button asChild>
                <Link to="/subscription-plans">View Subscription Plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active subscription view
  return (
    <div className="container max-w-3xl mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>Manage your subscription plan and billing</CardDescription>
            </div>
            <div>
              {getStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current plan details */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-4 bg-slate-50 rounded-md">
              <div>
                <h3 className="text-lg font-semibold">{subscription.planName} Plan</h3>
                <p className="text-sm text-slate-500">
                  ${(subscription.amount / 100).toFixed(2)}/month
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {!subscription.cancelAtPeriodEnd && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpgradeDialogOpen(true)}
                    disabled={processingAction}
                  >
                    Change Plan
                  </Button>
                )}
                <Button
                  variant={subscription.cancelAtPeriodEnd ? "default" : "outline"}
                  size="sm"
                  onClick={subscription.cancelAtPeriodEnd ? handleResumeSubscription : () => setCancelDialogOpen(true)}
                  disabled={processingAction}
                >
                  {processingAction ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : subscription.cancelAtPeriodEnd ? (
                    "Resume Subscription"
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Billing details */}
            <div>
              <h3 className="text-md font-medium mb-3">Billing Information</h3>
              <dl className="space-y-2">
                <div className="flex justify-between py-1">
                  <dt className="text-sm text-slate-500">Billing period:</dt>
                  <dd className="text-sm font-medium">Monthly</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-sm text-slate-500">Next payment:</dt>
                  <dd className="text-sm font-medium">
                    {subscription.cancelAtPeriodEnd ? (
                      <span className="text-amber-600">No future payments</span>
                    ) : (
                      formatDate(subscription.currentPeriodEnd)
                    )}
                  </dd>
                </div>
                {subscription.paymentMethod && (
                  <div className="flex justify-between py-1">
                    <dt className="text-sm text-slate-500">Payment method:</dt>
                    <dd className="text-sm font-medium flex items-center">
                      <CreditCard className="h-4 w-4 mr-1 text-slate-400" />
                      {subscription.paymentMethod.brand.charAt(0).toUpperCase() + subscription.paymentMethod.brand.slice(1)} •••• {subscription.paymentMethod.last4}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-md text-sm flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Your subscription is scheduled to cancel</p>
                  <p className="mt-1">Your access will end on {formatDate(subscription.currentPeriodEnd)}. You can resume your subscription at any time before this date.</p>
                </div>
              </div>
            )}

            {!subscription.cancelAtPeriodEnd && subscription.status === 'active' && (
              <div className="p-4 bg-green-50 text-green-800 rounded-md text-sm flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Your subscription is active</p>
                  <p className="mt-1">You have full access to all {subscription.planName} plan features.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={openStripePortal}
            disabled={isCreatingPortal}
          >
            {isCreatingPortal ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opening payment portal...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Payment Methods
              </>
            )}
          </Button>
          <div className="text-xs text-center text-slate-500 mt-2">
            You'll be redirected to a secure Stripe portal to manage your payment methods and billing history.
          </div>
        </CardFooter>
      </Card>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your {subscription.planName} plan subscription? 
              You'll continue to have access until the current billing period ends on {formatDate(subscription.currentPeriodEnd)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelSubscription}
              disabled={processingAction}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {processingAction ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Plan Dialog */}
      <AlertDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Change Subscription Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Select the plan you'd like to switch to. Your billing will be adjusted immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-3">
            {Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => (
              <div 
                key={id}
                className={`p-3 border rounded-lg ${
                  id === subscription.planType 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'hover:bg-slate-50 cursor-pointer'
                }`}
                onClick={() => id !== subscription.planType && handleUpgradeSubscription(id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-slate-500">${(plan.price / 100).toFixed(2)}/month</p>
                  </div>
                  {id === subscription.planType ? (
                    <Badge variant="outline" className="bg-primary/20 border-primary/30">
                      Current
                    </Badge>
                  ) : id === 'enterprise' && subscription.planType === 'basic' ? (
                    <ArrowUpCircle className="h-5 w-5 text-green-500" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}