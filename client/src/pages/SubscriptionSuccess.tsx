import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Calendar, CreditCard } from 'lucide-react';

export default function SubscriptionSuccess() {
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        // Get the payment_intent and payment_intent_client_secret from URL
        const searchParams = new URLSearchParams(window.location.search);
        const paymentIntent = searchParams.get('payment_intent');
        
        if (!paymentIntent) {
          setError('No payment information found. Your subscription may not have been completed.');
          setIsLoading(false);
          return;
        }

        // Fetch subscription status using the payment intent
        const response = await apiRequest('GET', `/api/subscription/subscription-status?payment_intent=${paymentIntent}`);
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to verify subscription status');
        }
        
        const data = await response.json();
        setSubscription(data);
      } catch (err) {
        console.error('Error fetching subscription status:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        toast({
          title: "Verification Error",
          description: "We couldn't verify your subscription status. Please contact support.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [toast]);

  // Format a date string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Verification Failed</CardTitle>
            <CardDescription>We couldn't verify your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 mb-4">{error}</p>
            <p className="text-slate-500 text-sm">
              If you believe this is an error, please contact our support team
              for assistance or try again.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate('/subscription-plans')} 
              variant="outline" 
              className="w-full"
            >
              Return to Plans
            </Button>
            <Button 
              onClick={() => navigate('/account/subscription')} 
              className="w-full"
            >
              View My Subscriptions
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle>Subscription Confirmed!</CardTitle>
          <CardDescription>Your subscription has been successfully activated</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscription?.status === 'success' && (
              <>
                <div className="flex items-center gap-2 text-slate-700">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <span>Subscription ID: </span>
                  <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded">
                    {subscription.subscriptionId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Next billing date: </span>
                  <span className="font-medium">
                    {subscription.nextBillingDate || formatDate(subscription?.subscription?.currentPeriodEnd)}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-md mt-4">
                  <p className="text-sm text-slate-600">
                    Thank you for subscribing! You now have full access to all features 
                    included in your subscription plan. You can manage your subscription 
                    from your account settings at any time.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/business/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/account/subscription">Manage Subscription</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}