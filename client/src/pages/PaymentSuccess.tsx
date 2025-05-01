import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useStripe } from '@stripe/react-stripe-js';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const stripe = useStripe();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<{
    status: 'loading' | 'success' | 'error';
    message?: string;
    paymentId?: string;
    amount?: number;
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

    if (!clientSecret) {
      setPaymentStatus({
        status: 'error',
        message: 'No payment information found. Please try again or contact support.',
      });
      return;
    }

    stripe
      .retrievePaymentIntent(clientSecret)
      .then(({ paymentIntent }) => {
        if (!paymentIntent) {
          setPaymentStatus({
            status: 'error',
            message: 'Payment information could not be retrieved.',
          });
          return;
        }

        switch (paymentIntent.status) {
          case 'succeeded':
            setPaymentStatus({
              status: 'success',
              message: 'Payment successful!',
              paymentId: paymentIntent.id,
              amount: paymentIntent.amount,
            });
            // Record successful payment in our system
            fetch('/api/record-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                status: 'completed',
              }),
            }).catch((err) => {
              console.error('Error recording payment:', err);
            });
            break;
          case 'processing':
            setPaymentStatus({
              status: 'success',
              message: 'Your payment is processing.',
              paymentId: paymentIntent.id,
              amount: paymentIntent.amount,
            });
            break;
          case 'requires_payment_method':
            setPaymentStatus({
              status: 'error',
              message: 'Your payment was not successful, please try again.',
            });
            break;
          default:
            setPaymentStatus({
              status: 'error',
              message: 'Something went wrong with your payment.',
            });
            break;
        }
      })
      .catch((err) => {
        console.error('Error retrieving payment intent:', err);
        setPaymentStatus({
          status: 'error',
          message: 'An unexpected error occurred. Please contact support.',
        });
      });
  }, [stripe, toast]);

  const handleReturnToDashboard = () => {
    setLocation('/');
  };

  return (
    <div className="container flex items-center justify-center min-h-[80vh] px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Payment Status</CardTitle>
          <CardDescription className="text-center">
            {paymentStatus.status === 'loading' ? 'Verifying your payment...' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          {paymentStatus.status === 'loading' && (
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full my-8" aria-label="Loading" />
          )}

          {paymentStatus.status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
              <p className="mb-4">{paymentStatus.message}</p>
              {paymentStatus.amount && (
                <p className="text-lg font-semibold mb-4">
                  Amount: ${(paymentStatus.amount / 100).toFixed(2)}
                </p>
              )}
              {paymentStatus.paymentId && (
                <p className="text-sm text-muted-foreground mb-6">
                  Transaction ID: {paymentStatus.paymentId}
                </p>
              )}
            </>
          )}

          {paymentStatus.status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <span className="text-2xl text-red-500">✗</span>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
              <p className="mb-6">{paymentStatus.message}</p>
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
        <CardFooter className="flex justify-center">
          <Button onClick={handleReturnToDashboard}>
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}