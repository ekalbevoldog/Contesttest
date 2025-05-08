import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { recoverSession } from '@/lib/session-persistence';

/**
 * Session Refresh Handler
 * 
 * This component ensures session tokens are refreshed at appropriate intervals
 * to maintain persistent authentication without requiring user action.
 */
export function SessionRefreshHandler() {
  const { user, refetchProfile } = useAuth();
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  
  // Attempt to recover session on initial load if no active session exists
  useEffect(() => {
    async function attemptSessionRecovery() {
      if (!user) {
        console.log('[SessionHandler] No active session, attempting recovery...');
        const recovered = await recoverSession();
        if (recovered) {
          console.log('[SessionHandler] Successfully recovered session on page load');
          // Force a manual refresh to update auth context with recovered session
          window.location.reload();
        }
      }
    }
    
    attemptSessionRecovery();
  }, [user]);

  // Regular interval session refresh
  useEffect(() => {
    if (!user) return;
    
    const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
    
    function scheduleNextRefresh() {
      // Calculate time until next refresh - simplified without session expiry
      const timeUntilNextRefresh = REFRESH_INTERVAL;
      
      return setTimeout(async () => {
        console.log('[SessionHandler] Time for scheduled profile refresh');
        await performRefresh();
      }, timeUntilNextRefresh);
    }
    
    async function performRefresh() {
      try {
        await refetchProfile();
        setLastRefresh(Date.now());
        console.log('[SessionHandler] Session refreshed successfully via profile refetch');
      } catch (error) {
        console.error('[SessionHandler] Error refreshing session:', error);
      }
    }
    
    console.log('[SessionHandler] Setting up session refresh schedule');
    const refreshTimer = scheduleNextRefresh();
    
    return () => {
      console.log('[SessionHandler] Clearing session refresh timer');
      clearTimeout(refreshTimer);
    };
  }, [user, refetchProfile, lastRefresh]);

  // Safety net: Periodically check session validity
  useEffect(() => {
    if (!user) return;
    
    const VALIDITY_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes
    
    const validityCheck = setInterval(async () => {
      const timeSinceLastRefresh = Date.now() - lastRefresh;
      
      // If it's been too long since our last successful refresh, force a new one
      if (timeSinceLastRefresh > VALIDITY_CHECK_INTERVAL) {
        console.log('[SessionHandler] Extended period without refresh, forcing profile check');
        try {
          await refetchProfile();
          setLastRefresh(Date.now());
        } catch (error) {
          console.error('[SessionHandler] Validity check refresh failed:', error);
          
          // If refresh fails, try recovery
          try {
            await recoverSession();
          } catch (recoveryError) {
            console.error('[SessionHandler] Session recovery also failed:', recoveryError);
          }
        }
      }
    }, VALIDITY_CHECK_INTERVAL);
    
    return () => {
      clearInterval(validityCheck);
    };
  }, [user, refetchProfile, lastRefresh]);
  
  // Handle page visibility changes to refresh session when tab becomes active
  useEffect(() => {
    if (!user) return;
    
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // If the page becomes visible and it's been a while since the last refresh
        const timeSinceLastRefresh = Date.now() - lastRefresh;
        if (timeSinceLastRefresh > 5 * 60 * 1000) { // 5 minutes
          console.log('[SessionHandler] Page became visible, refreshing profile');
          refetchProfile();
          setLastRefresh(Date.now());
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refetchProfile, lastRefresh]);

  // This is a background component, it doesn't render anything
  return null;
}