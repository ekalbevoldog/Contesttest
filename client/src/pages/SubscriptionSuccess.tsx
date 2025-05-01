import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useStripe } from '@stripe/react-stripe-js';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, Zap, Award } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function SubscriptionSuccess() {
  const [, setLocation] = useLocation();
  const stripe = useStripe();
  const { toast } = useToast();
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    status: 'loading' | 'success' | 'error';
    message?: string;
    subscriptionId?: string;
    planId?: string;
    planName?: string;
    nextBillingDate?: string;
  }>({
    status: 'loading',
  });

  useEffect(() => {
    if (!stripe) {
      return;
    }

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );
    
    const planId = new URLSearchParams(window.location.search).get('plan') || '';

    if (!clientSecret) {
      setSubscriptionStatus({
        status: 'error',
        message: 'No subscription information found. Please try again or contact support.',
      });
      return;
    }

    stripe
      .retrievePaymentIntent(clientSecret)
      .then(({ paymentIntent }) => {
        if (!paymentIntent) {
          setSubscriptionStatus({
            status: 'error',
            message: 'Subscription information could not be retrieved.',
          });
          return;
        }

        switch (paymentIntent.status) {
          case 'succeeded':
            // Get subscription details from our backend
            apiRequest('GET', `/api/subscription-status?payment_intent=${paymentIntent.id}`)
              .then(res => res.json())
              .then(data => {
                if (data.error) {
                  throw new Error(data.error);
                }
                
                const planMap: Record<string, string> = {
                  'basic': 'Basic',
                  'pro': 'Professional',
                  'enterprise': 'Enterprise'
                };
                
                setSubscriptionStatus({
                  status: 'success',
                  message: 'Your subscription is now active!',
                  subscriptionId: data.subscriptionId || paymentIntent.id,
                  planId: planId,
                  planName: planMap[planId] || 'Subscription',
                  nextBillingDate: data.nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                });
              })
              .catch(err => {
                console.error('Error fetching subscription details:', err);
                // Still mark as success even if we can't get details
                setSubscriptionStatus({
                  status: 'success',
                  message: 'Your subscription has been processed successfully!',
                  subscriptionId: paymentIntent.id,
                  planId: planId,
                  planName: {
                    'basic': 'Basic',
                    'pro': 'Professional',
                    'enterprise': 'Enterprise'
                  }[planId] || 'Subscription',
                });
              });
            break;
            
          case 'processing':
            setSubscriptionStatus({
              status: 'success',
              message: 'Your subscription is processing. You will have access shortly.',
              subscriptionId: paymentIntent.id,
              planId: planId,
              planName: {
                'basic': 'Basic',
                'pro': 'Professional',
                'enterprise': 'Enterprise'
              }[planId] || 'Subscription',
            });
            break;
            
          case 'requires_payment_method':
            setSubscriptionStatus({
              status: 'error',
              message: 'Your payment method was declined. Please update your payment information.',
            });
            break;
            
          default:
            setSubscriptionStatus({
              status: 'error',
              message: 'Something went wrong with your subscription payment.',
            });
            break;
        }
      })
      .catch((err) => {
        console.error('Error retrieving payment intent:', err);
        setSubscriptionStatus({
          status: 'error',
          message: 'An unexpected error occurred. Please contact support.',
        });
      });
  }, [stripe, toast]);

  const handleViewDashboard = () => {
    setLocation('/business-dashboard');  // Or the appropriate dashboard for their role
  };

  const handleViewSubscription = () => {
    setLocation('/account/subscription');
  };

  return (
    <div className="container flex items-center justify-center min-h-[80vh] px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Subscription Status</CardTitle>
          <CardDescription className="text-center">
            {subscriptionStatus.status === 'loading' ? 'Verifying your subscription...' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          {subscriptionStatus.status === 'loading' && (
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full my-8" aria-label="Loading" />
          )}

          {subscriptionStatus.status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Welcome Aboard!</h2>
              <p className="mb-6">{subscriptionStatus.message}</p>
              
              <div className="w-full space-y-4 mb-6">
                {subscriptionStatus.planName && (
                  <div className="flex items-center border rounded-lg p-3 bg-zinc-900">
                    <Award className="h-5 w-5 mr-3 text-amber-500" />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">Plan</h3>
                      <p className="text-base">{subscriptionStatus.planName}</p>
                    </div>
                  </div>
                )}
                
                {subscriptionStatus.nextBillingDate && (
                  <div className="flex items-center border rounded-lg p-3 bg-zinc-900">
                    <Calendar className="h-5 w-5 mr-3 text-amber-500" />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">Next Billing Date</h3>
                      <p className="text-base">{subscriptionStatus.nextBillingDate}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center border rounded-lg p-3 bg-zinc-900">
                  <Zap className="h-5 w-5 mr-3 text-amber-500" />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">Status</h3>
                    <p className="text-base text-green-500">Active</p>
                  </div>
                </div>
              </div>
              
              {subscriptionStatus.subscriptionId && (
                <p className="text-xs text-muted-foreground mb-6">
                  Subscription ID: {subscriptionStatus.subscriptionId}
                </p>
              )}
            </>
          )}

          {subscriptionStatus.status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <span className="text-2xl text-red-500">✗</span>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Subscription Failed</h2>
              <p className="mb-6">{subscriptionStatus.message}</p>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/checkout')}
                className="mb-4"
              >
                Try Again
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {subscriptionStatus.status === 'success' && (
            <>
              <Button onClick={handleViewDashboard}>
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={handleViewSubscription}>
                Manage Subscription
              </Button>
            </>
          )}
          
          {subscriptionStatus.status === 'error' && (
            <Button onClick={() => setLocation('/')}>
              Return Home
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}