import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '@/hooks/use-supabase-auth';
import { supabase } from '@/lib/supabase-client';

/**
 * Component for testing session persistence
 */
export function SessionTester() {
  const { user, session } = useAuth();
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

  const refreshSession = async () => {
    // Get current session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return;
    }
    
    if (!data.session) {
      console.log('No active session to refresh');
      return;
    }
    
    try {
      // Call our refresh endpoint
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('Session successfully refreshed');
        // Update the display
        setSessionInfo(data.session);
        setCookieInfo(document.cookie);
      } else {
        console.error('Failed to refresh session:', await response.text());
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
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
        <Button variant="outline" onClick={refreshSession}>
          Refresh Session
        </Button>
        <Button onClick={testSessionPersistence}>
          Test Persistence (Reload)
        </Button>
      </CardFooter>
    </Card>
  );
}