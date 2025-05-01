import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '../data/subscription-plans';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SubscriptionPlans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleProceedToCheckout = () => {
    if (!selectedPlan) {
      toast({
        title: "No Plan Selected",
        description: "Please select a subscription plan to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive"
      });
      navigate('/login?redirect=/subscription-plans');
      return;
    }

    navigate(`/checkout?planId=${selectedPlan}`);
  };

  return (
    <div className="container max-w-5xl mx-auto py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Subscription Plans</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Choose the right plan to elevate your business with personalized athlete partnerships
          and grow your brand's influence.
        </p>
      </div>

      {!isAuthenticated && (
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You'll need to sign in or create an account before subscribing to a plan.
          </AlertDescription>
        </Alert>
      )}

      <RadioGroup value={selectedPlan || ''} onValueChange={handleSelectPlan} className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {Object.values(SUBSCRIPTION_PLANS).map((plan) => (
            <Card 
              key={plan.id} 
              className={`
                relative border-2 transition-all duration-200 
                ${selectedPlan === plan.id ? 'border-primary shadow-md' : 'border-slate-200 hover:border-slate-300'}
              `}
            >
              {plan.recommended && (
                <Badge className="absolute top-4 right-4 bg-primary">Recommended</Badge>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-bold">${(plan.price / 100).toFixed(2)}</span>
                  <span className="text-slate-500 ml-1">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroupItem 
                  value={plan.id} 
                  id={`plan-${plan.id}`} 
                  className="sr-only" 
                />
                <Label 
                  htmlFor={`plan-${plan.id}`}
                  className="block cursor-pointer"
                >
                  <Separator className="my-4" />
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Label>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSelectPlan(plan.id)} 
                  variant={selectedPlan === plan.id ? "default" : "outline"} 
                  className="w-full"
                >
                  {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </RadioGroup>

      <div className="mt-10 text-center">
        <Button 
          onClick={handleProceedToCheckout} 
          size="lg" 
          disabled={!selectedPlan}
          className="min-w-[200px]"
        >
          Proceed to Checkout
        </Button>
        
        <p className="text-sm text-slate-500 mt-4">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </div>
  );
}