import { useEffect, useRef } from 'react';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

/**
 * Session Refresh Handler
 * 
 * This component ensures session tokens are refreshed at appropriate intervals
 * to maintain persistent authentication without requiring user action.
 */
export function SessionRefreshHandler() {
  const { session, refreshSession } = useSupabaseAuth();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    // If no session, nothing to refresh
    if (!session || !session.expires_at) return;
    
    // Calculate when to refresh the token
    // We'll refresh at 75% of the token lifetime to ensure we always have a valid token
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    
    // Calculate time until expiration in milliseconds
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    // If token is already expired or will expire within a minute, refresh immediately
    if (timeUntilExpiry < 60000) {
      console.log('[SessionRefresh] Token expires soon, refreshing immediately');
      refreshSession();
      return;
    }
    
    // Schedule refresh at 75% of remaining time to ensure we're well ahead of expiration
    const refreshTime = Math.max(timeUntilExpiry * 0.75, 10000); // Min 10 seconds
    
    console.log(`[SessionRefresh] Scheduling token refresh in ${Math.round(refreshTime / 1000)} seconds`);
    
    refreshTimerRef.current = setTimeout(() => {
      console.log('[SessionRefresh] Executing scheduled token refresh');
      refreshSession();
    }, refreshTime);
    
    // Set up a backup refresh on window focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session) {
        // Get fresh time calculations based on current time
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        
        // Only refresh if we're getting close to expiration (less than 25% of lifetime left)
        if (timeUntilExpiry < timeUntilExpiry * 0.25) {
          console.log('[SessionRefresh] Window focused, refreshing token');
          refreshSession();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, refreshSession]);
  
  // This is a background utility component that doesn't render anything
  return null;
}