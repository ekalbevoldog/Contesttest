import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Subscription plans
const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for getting started',
    price: 99,
    features: [
      'Up to 5 athlete matches per month',
      'Basic analytics dashboard',
      'Email support',
      'Campaign management tools'
    ],
    cta: 'Start Basic Plan'
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'Ideal for growing businesses',
    price: 199,
    features: [
      'Up to 15 athlete matches per month',
      'Advanced analytics dashboard',
      'Priority email & chat support',
      'Comprehensive campaign management',
      'Performance reports'
    ],
    cta: 'Start Professional Plan',
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For established brands',
    price: 399,
    features: [
      'Unlimited athlete matches',
      'Executive analytics dashboard',
      '24/7 dedicated support',
      'Full campaign suite',
      'Custom reporting',
      'API access'
    ],
    cta: 'Start Enterprise Plan'
  }
];

const SubscriptionForm = ({ selectedPlan }: { selectedPlan: typeof SUBSCRIPTION_PLANS[0] }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription-success?plan=${selectedPlan.id}`,
        },
      });

      if (error) {
        toast({
          title: "Subscription Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription Processing",
          description: "Your subscription is being processed. You will be redirected shortly.",
        });
      }
    } catch (err) {
      toast({
        title: "Subscription Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6 space-y-4">
        <div className="flex justify-between pb-4 border-b">
          <span className="font-semibold">Subscription</span>
          <span className="font-semibold">{selectedPlan.name} Plan</span>
        </div>
        <div className="flex justify-between">
          <span>Monthly payment</span>
          <span>${selectedPlan.price}.00 / month</span>
        </div>
      </div>
      
      <PaymentElement className="mb-6" />
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || !elements || isLoading}
      >
        {isLoading ? "Processing..." : `Subscribe to ${selectedPlan.name} Plan`}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground mt-4">
        By subscribing, you agree to our terms of service and privacy policy.
        You may cancel your subscription at any time.
      </p>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("pro"); // Default to Pro plan
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Find the selected plan
  const selectedPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];

  useEffect(() => {
    // Get plan from query params if available
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (planParam) {
      const validPlan = SUBSCRIPTION_PLANS.find(p => p.id === planParam);
      if (validPlan) {
        setSelectedPlanId(planParam);
      }
    }
  }, []);

  useEffect(() => {
    if (!selectedPlan) return;
    
    // Create Subscription Setup as soon as the plan is selected
    setIsLoading(true);
    setClientSecret(null);
    
    apiRequest("POST", "/api/get-or-create-subscription", { 
      planId: selectedPlan.id
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error.message || "Failed to set up subscription");
        }
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to initialize subscription. Please try again later.",
          variant: "destructive",
        });
        console.error("Subscription setup error:", error);
        setIsLoading(false);
      });
  }, [selectedPlanId, toast]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
            Choose Your Subscription Plan
          </span>
        </h1>
        <p className="text-center text-gray-300 max-w-2xl mx-auto mb-8">
          Select the plan that best fits your business needs. All plans include our core athlete matching technology.
        </p>
        
        <Tabs 
          defaultValue={selectedPlanId} 
          onValueChange={handleSelectPlan}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-8">
            {SUBSCRIPTION_PLANS.map(plan => (
              <TabsTrigger 
                key={plan.id} 
                value={plan.id}
                className={plan.recommended ? "relative" : ""}
              >
                {plan.recommended && (
                  <span className="absolute -top-7 left-0 right-0 text-xs font-medium text-amber-400">
                    RECOMMENDED
                  </span>
                )}
                {plan.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {SUBSCRIPTION_PLANS.map(plan => (
            <TabsContent key={plan.id} value={plan.id} className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{plan.name} Plan</span>
                    <span className="text-2xl">${plan.price}/mo</span>
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="font-medium">Features:</h3>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="h-5 w-5 text-amber-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {clientSecret && selectedPlanId === plan.id ? (
                    <div className="mt-8">
                      <Elements stripe={stripePromise} options={{ 
                        clientSecret,
                        appearance: { theme: 'night' } 
                      }}>
                        <SubscriptionForm selectedPlan={plan} />
                      </Elements>
                    </div>
                  ) : (
                    <Button 
                      className="w-full mt-8"
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isLoading && selectedPlanId === plan.id}
                    >
                      {isLoading && selectedPlanId === plan.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Loading...
                        </div>
                      ) : plan.cta}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}