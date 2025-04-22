import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase, testSupabaseConnection, initializeSupabase } from '@/lib/supabase-client';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus('loading');
      setErrorMessage(null);
      
      // Test the connection
      const success = await testSupabaseConnection();
      
      // Get the count of sessions for display
      const { data, error } = await supabase.from('sessions').select('count');
      
      if (success) {
        setConnectionStatus('success');
        if (data && data.length > 0) {
          setSessionCount(data[0].count);
        }
      } else {
        setConnectionStatus('error');
        setErrorMessage('Connection failed. Check console for details.');
      }
      
      if (error) {
        console.error('Error getting session count:', error);
      }
    } catch (err) {
      setConnectionStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Connection test error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize Supabase first, then check connection when component mounts
    async function initialize() {
      try {
        setIsLoading(true);
        setConnectionStatus('loading');
        setErrorMessage(null);
        
        // First initialize Supabase with credentials from the server
        const initSuccess = await initializeSupabase();
        if (!initSuccess) {
          setConnectionStatus('error');
          setErrorMessage('Failed to initialize Supabase. Could not fetch configuration from server.');
          setIsLoading(false);
          return;
        }
        
        // Then test connection
        await checkConnection();
      } catch (error) {
        console.error('Error during initialization:', error);
        setConnectionStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error during initialization');
        setIsLoading(false);
      }
    }
    
    initialize();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>
          Tests the connection to Supabase from the client-side application
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connectionStatus === 'loading' && (
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Testing connection...</span>
          </div>
        )}
        
        {connectionStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 ml-2">Connection Successful</AlertTitle>
            <AlertDescription className="text-green-700 ml-7">
              Successfully connected to Supabase.
              {sessionCount !== null && (
                <div className="mt-2">
                  <span className="font-medium">Session count: </span>
                  {sessionCount}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {connectionStatus === 'error' && (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800 ml-2">Connection Failed</AlertTitle>
            <AlertDescription className="text-red-700 ml-7">
              {errorMessage || 'Failed to connect to Supabase. Check your credentials.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={async () => {
            setIsLoading(true);
            setConnectionStatus('loading');
            setErrorMessage(null);
            // Reinitialize Supabase and then check connection
            const initSuccess = await initializeSupabase();
            if (initSuccess) {
              await checkConnection();
            } else {
              setConnectionStatus('error');
              setErrorMessage('Failed to initialize Supabase. Could not fetch configuration from server.');
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Retest Connection'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default SupabaseConnectionTest;