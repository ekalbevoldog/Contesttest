import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryParams } from '@/hooks/use-query-params';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleProtectedRoute } from '@/lib/simplified-protected-route';

const SubscriptionSuccessContent = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const query = useQueryParams();
  
  // Get payment intent status from query parameters
  const paymentIntentId = query.get('payment_intent');
  const paymentIntentClientSecret = query.get('payment_intent_client_secret');
  const redirectStatus = query.get('redirect_status');
  
  useEffect(() => {
    const verifySubscription = async () => {
      try {
        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }
        
        // Verify the subscription status
        const response = await apiRequest('GET', '/api/subscription/status');
        
        if (!response.ok) {
          throw new Error('Failed to verify subscription status');
        }
        
        const data = await response.json();
        
        if (data.subscription && data.subscription.status === 'active') {
          setSubscriptionDetails(data.subscription);
        } else {
          setError('Subscription not found or not active');
        }
      } catch (err) {
        console.error('Error verifying subscription:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    if (redirectStatus === 'succeeded' || paymentIntentId) {
      verifySubscription();
    } else {
      setLoading(false);
      setError('Invalid payment status');
    }
  }, [user, paymentIntentId, redirectStatus]);
  
  // Handle navigation to dashboard
  const handleContinue = () => {
    const destination = user?.role ? `/${user.role.toLowerCase()}-dashboard` : '/dashboard';
    navigate(destination);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="mt-4 text-lg">Verifying your subscription...</div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-3xl mx-auto py-16 px-4">
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center">
          {error ? (
            <CardTitle className="text-2xl md:text-3xl">Subscription Status</CardTitle>
          ) : (
            <>
              <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl md:text-3xl">Subscription Successful!</CardTitle>
            </>
          )}
          <CardDescription className="text-lg">
            {error 
              ? 'There was an issue with your subscription'
              : 'Thank you for subscribing to our service'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-6">
              <p className="text-destructive font-medium">Error: {error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please contact support if you believe this is an error. Your payment may still have been processed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-md p-4 mb-6">
                <p className="font-medium">Your subscription is now active!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  You now have access to all premium features.
                </p>
              </div>
              
              {subscriptionDetails && (
                <div className="grid gap-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Plan</span>
                    <span>{subscriptionDetails.plan || 'Premium'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Status</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  {subscriptionDetails.currentPeriodEnd && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="font-medium">Next Billing Date</span>
                      <span>
                        {new Date(subscriptionDetails.currentPeriodEnd * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/account/subscription')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Manage Subscription
          </Button>
          
          <Button 
            onClick={handleContinue}
            className="w-full sm:w-auto"
          >
            Continue to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const SubscriptionSuccess = () => {
  return (
    <SimpleProtectedRoute>
      <SubscriptionSuccessContent />
    </SimpleProtectedRoute>
  );
};

export default SubscriptionSuccess;