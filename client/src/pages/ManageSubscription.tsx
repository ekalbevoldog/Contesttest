import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CreditCard, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'paused' | 'loading' | 'error';

interface Subscription {
  id: string;
  status: SubscriptionStatus;
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

export default function ManageSubscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelationInProgress, setCancelationInProgress] = useState(false);

  useEffect(() => {
    loadSubscriptionDetails();
  }, []);

  const loadSubscriptionDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest('GET', '/api/subscription');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.subscription) {
        setError('No active subscription found.');
        setSubscription(null);
      } else {
        setSubscription(data.subscription);
      }
    } catch (err) {
      console.error('Error loading subscription details:', err);
      setError('Failed to load subscription details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelationInProgress(true);

    try {
      const response = await apiRequest('POST', '/api/cancel-subscription', {
        subscriptionId: subscription?.id
      });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription has been cancelled and will end on your current billing period.',
      });

      // Update the subscription status
      setSubscription(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: true
      } : null);

      setCancelDialogOpen(false);
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setCancelationInProgress(false);
    }
  };

  const handleResumeSubscription = async () => {
    setLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/resume-subscription', {
        subscriptionId: subscription?.id
      });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'Subscription Resumed',
        description: 'Your subscription has been resumed successfully.',
      });

      // Update the subscription status
      setSubscription(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: false
      } : null);
    } catch (err) {
      console.error('Error resuming subscription:', err);
      toast({
        title: 'Error',
        description: 'Failed to resume subscription. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = () => {
    setLocation('/update-payment-method');
  };

  const handleChangePlan = () => {
    setLocation('/checkout');
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return 'text-green-500';
      case 'trialing':
        return 'text-blue-500';
      case 'past_due':
      case 'unpaid':
      case 'incomplete':
        return 'text-amber-500';
      case 'canceled':
      case 'incomplete_expired':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'trialing':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'past_due':
      case 'unpaid':
      case 'incomplete':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'canceled':
      case 'incomplete_expired':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh] px-4 py-12">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
          <p>Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="container flex items-center justify-center min-h-[80vh] px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Subscription Management</CardTitle>
            <CardDescription>Manage your subscription plan and billing</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Active Subscription</AlertTitle>
              <AlertDescription>
                {error || "You don't currently have an active subscription."}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation('/checkout')} className="w-full">
              View Subscription Plans
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  const formattedAmount = (subscription.amount / 100).toFixed(2);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {getStatusIcon(subscription.status)}
                <div className="ml-2">
                  <div className="text-xl font-bold">{subscription.planName}</div>
                  <div className={`text-sm ${getStatusColor(subscription.status)}`}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    {subscription.cancelAtPeriodEnd && " (Cancels soon)"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Billing Cycle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="ml-2">
                  <div className="text-xl font-bold">${formattedAmount}/month</div>
                  <div className="text-sm text-muted-foreground">
                    Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              {subscription.paymentMethod ? (
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div className="ml-2">
                    <div className="text-xl font-bold">
                      {subscription.paymentMethod.brand.charAt(0).toUpperCase() + subscription.paymentMethod.brand.slice(1)} 
                      •••• {subscription.paymentMethod.last4}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expires {subscription.paymentMethod.expiryMonth}/{subscription.paymentMethod.expiryYear}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No payment method on file</div>
              )}
            </CardContent>
          </Card>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <Alert className="mb-8 border-amber-500 bg-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Your subscription is scheduled to cancel</AlertTitle>
            <AlertDescription>
              Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}. 
              You can resume your subscription anytime before this date.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
            <CardDescription>Review your plan and billing information</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Subscription ID</dt>
                <dd className="font-mono text-sm">{subscription.id}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Plan Type</dt>
                <dd>{subscription.planType}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Start Date</dt>
                <dd>{new Date(subscription.startDate).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Current Period Ends</dt>
                <dd>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</dd>
              </div>
              {subscription.lastPaymentDate && (
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">Last Payment</dt>
                  <dd>{new Date(subscription.lastPaymentDate).toLocaleDateString()}</dd>
                </div>
              )}
              {subscription.nextPaymentDate && !subscription.cancelAtPeriodEnd && (
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">Next Payment</dt>
                  <dd>{new Date(subscription.nextPaymentDate).toLocaleDateString()}</dd>
                </div>
              )}
              <div className="flex justify-between pb-2">
                <dt className="text-muted-foreground">Monthly Amount</dt>
                <dd className="font-semibold">${formattedAmount}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="space-y-4">
            <Button onClick={handleChangePlan}>
              Change Plan
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleUpdatePayment}
              className="ml-0 md:ml-4"
            >
              Update Payment Method
            </Button>
          </div>

          {subscription.cancelAtPeriodEnd ? (
            <Button 
              variant="default" 
              onClick={handleResumeSubscription}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                'Resume Subscription'
              )}
            </Button>
          ) : (
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  Cancel Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Your Subscription?</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel your subscription? You'll still have access until the end of your current billing period on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    If you change your mind, you can resume your subscription anytime before your current billing period ends.
                  </p>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setCancelDialogOpen(false)}
                  >
                    Keep Subscription
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    disabled={cancelationInProgress}
                  >
                    {cancelationInProgress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing
                      </>
                    ) : (
                      'Cancel Subscription'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}