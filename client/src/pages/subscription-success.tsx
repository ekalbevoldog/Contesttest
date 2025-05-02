import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryParams } from "@/hooks/use-query-params";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { UnifiedProtectedRoute } from "@/lib/unified-protected-route";

export default function SubscriptionSuccess() {
  return (
    <UnifiedProtectedRoute>
      <SubscriptionSuccessContent />
    </UnifiedProtectedRoute>
  );
}

function SubscriptionSuccessContent() {
  const [, setLocation] = useLocation();
  const query = useQueryParams();
  const [isLoading, setIsLoading] = useState(true);
  
  const subscriptionId = query.get("subscription_id");
  const payment_intent = query.get("payment_intent");
  const payment_intent_client_secret = query.get("payment_intent_client_secret");
  const redirect_status = query.get("redirect_status");
  
  const pendingPlan = localStorage.getItem("pendingSubscriptionPlan");
  
  // Remove the pending subscription plan from localStorage
  useEffect(() => {
    localStorage.removeItem("pendingSubscriptionPlan");
  }, []);
  
  // Simulate checking the subscription status
  useEffect(() => {
    // Invalidate subscription queries
    queryClient.invalidateQueries({ queryKey: ['/api/subscription/subscription'] });
    
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Determine the result of the subscription
  const isSuccess = redirect_status === "succeeded" || payment_intent !== null;
  
  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <h1 className="text-2xl font-bold mb-2">Processing your subscription</h1>
        <p className="text-gray-400">Please wait while we confirm your payment...</p>
      </div>
    );
  }
  
  if (!isSuccess) {
    return (
      <div className="container max-w-md py-12">
        <Card className="border border-red-800/30 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto rounded-full p-3 bg-red-900/20 mb-4 w-16 h-16 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="text-xl mb-2">Payment Failed</CardTitle>
            <CardDescription>
              We couldn't process your subscription payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm">
            <p>There was an issue processing your payment. No charges have been made.</p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => setLocation("/account/subscription")}
            >
              Try Again
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setLocation("/")}
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-md py-12">
      <Card className="border border-green-800/30 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto rounded-full p-3 bg-green-900/20 mb-4 w-16 h-16 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-xl mb-2">Subscription Activated!</CardTitle>
          <CardDescription>
            Your subscription has been successfully activated.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-6">
          <div className="flex justify-center mb-6 mt-3">
            <SubscriptionBadge size="lg" />
          </div>
          
          {pendingPlan && (
            <div className="mb-4">
              <p className="font-medium">You're now subscribed to:</p>
              <p className="text-2xl font-bold text-primary">{pendingPlan} Plan</p>
            </div>
          )}
          
          <p className="text-sm text-gray-400 mt-4">
            Thank you for your subscription! You now have access to all premium features.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-2">
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => setLocation("/")}
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full"
            asChild
          >
            <Link href="/account/subscription">
              Manage Subscription
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}