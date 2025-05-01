import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutFormProps {
  planName: string;
}

const CheckoutForm = ({ planName }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription-success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
      // Success case is handled by return_url redirect
    } catch (err) {
      console.error('Payment confirmation error:', err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md border border-slate-200 p-4 shadow-sm">
        <PaymentElement />
      </div>

      <div className="flex items-center py-2">
        <Separator className="flex-1" />
        <span className="mx-2 text-sm text-slate-500">Secure payment via Stripe</span>
        <Separator className="flex-1" />
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing
          </>
        ) : (
          <>Subscribe to {planName} Plan</>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [plan, setPlan] = useState<any>(null);
  const [planId, setPlanId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Extract planId from URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const planIdParam = searchParams.get('planId');
    
    if (!planIdParam) {
      setError("Plan ID is missing. Please select a plan first.");
      setLoading(false);
      return;
    }

    setPlanId(planIdParam);

    // Fetch plan details
    const fetchPlan = async () => {
      try {
        const response = await apiRequest('GET', '/api/subscription/plans');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch plans');
        }
        
        const selectedPlan = data.plans.find((p: any) => p.id === planIdParam);
        if (!selectedPlan) {
          throw new Error('Selected plan not found');
        }
        
        setPlan(selectedPlan);
        
        // Create subscription setup with Stripe
        const subscriptionResponse = await apiRequest('POST', '/api/subscription/get-or-create-subscription', {
          planId: planIdParam
        });
        
        if (!subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          throw new Error(subscriptionData.message || 'Failed to set up subscription');
        }
        
        const subscriptionData = await subscriptionResponse.json();
        setClientSecret(subscriptionData.clientSecret);
      } catch (err) {
        console.error('Error during checkout setup:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        toast({
          title: "Checkout Error",
          description: err instanceof Error ? err.message : 'Failed to initialize checkout',
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [toast]);

  if (error) {
    return (
      <div className="container max-w-md mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Error</CardTitle>
            <CardDescription>There was a problem setting up your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/subscription-plans')} variant="outline" className="w-full">
              Return to Plans
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (loading || !clientSecret || !plan) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Subscribe to {plan.name} Plan</CardTitle>
          <CardDescription>Complete your subscription payment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Plan:</span>
              <span>{plan.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Price:</span>
              <span>${(plan.price / 100).toFixed(2)}/month</span>
            </div>
            <div className="text-sm text-slate-500 mt-4">
              <strong>Features include:</strong>
              <ul className="list-disc pl-5 mt-1">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="my-4" />

          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm planName={plan.name} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}