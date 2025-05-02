import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2 } from 'lucide-react';

// This page is shown after a successful subscription payment
const SubscriptionSuccess = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  
  useEffect(() => {
    // Display a success toast
    toast({
      title: 'Subscription Successful',
      description: 'Thank you for subscribing! Your payment has been processed.',
    });
    
    // Simulate a processing delay for better UX
    const timer = setTimeout(() => {
      setProcessing(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [toast]);
  
  const handleContinue = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {processing ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <CheckCircle2 className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">Subscription Confirmed!</CardTitle>
          <CardDescription>
            Your subscription has been successfully activated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center">
            {processing ? (
              <p>Processing your subscription details...</p>
            ) : (
              <>
                <p>
                  Your subscription is now active. You have full access to all premium features.
                </p>
                <p>
                  You can manage your subscription at any time from your account settings.
                </p>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled={processing} onClick={handleContinue}>
            Continue to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;