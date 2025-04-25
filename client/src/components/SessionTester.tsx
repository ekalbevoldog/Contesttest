import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { supabase } from '@/lib/supabase-client';

/**
 * Component for testing session persistence
 * This component helps verify that authentication
 * sessions persist properly between page loads
 */
export function SessionTester() {
  const auth = useSupabaseAuth();
  const { user, session, refreshSession } = auth;
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [cookieInfo, setCookieInfo] = useState<string>('');
  const [localStorageKeys, setLocalStorageKeys] = useState<string[]>([]);

  useEffect(() => {
    // Get current session info
    setSessionInfo(session);
    
    // Get all cookies
    setCookieInfo(document.cookie);
    
    // Get all localStorage keys
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    setLocalStorageKeys(keys);
  }, [session]);

  // Function to handle session refresh and update display
  const handleRefreshSession = async () => {
    await refreshSession();
    
    // Update display after refreshing
    setSessionInfo(session);
    setCookieInfo(document.cookie);
    
    // Also update localStorage keys
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) keys.push(key);
    }
    setLocalStorageKeys(keys);
  };

  const testSessionPersistence = () => {
    // Simulate page reload
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-3xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Session Persistence Tester</CardTitle>
        <CardDescription>Test if your login session persists between page reloads</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Current User</h3>
          <pre className="bg-muted p-2 rounded text-xs mt-2 max-h-32 overflow-auto">
            {user ? JSON.stringify({ id: user.id, email: user.email }, null, 2) : 'Not logged in'}
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-medium">Session Info</h3>
          <pre className="bg-muted p-2 rounded text-xs mt-2 max-h-32 overflow-auto">
            {sessionInfo ? 
              `Access Token: ${sessionInfo.access_token.substring(0, 15)}...\n` +
              `Expires At: ${new Date(sessionInfo.expires_at * 1000).toLocaleString()}`
              : 'No session'
            }
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-medium">Cookies</h3>
          <pre className="bg-muted p-2 rounded text-xs mt-2 max-h-32 overflow-auto">
            {cookieInfo || 'No cookies'}
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-medium">LocalStorage Keys</h3>
          <pre className="bg-muted p-2 rounded text-xs mt-2 max-h-32 overflow-auto">
            {localStorageKeys.length > 0 ? localStorageKeys.join('\n') : 'No localStorage keys'}
          </pre>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleRefreshSession}>
          Refresh Session
        </Button>
        <Button onClick={testSessionPersistence}>
          Test Persistence (Reload)
        </Button>
      </CardFooter>
    </Card>
  );
}