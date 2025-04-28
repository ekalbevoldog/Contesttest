/**
 * Session Persistence Utilities
 * 
 * This module contains utilities for enhancing session persistence
 * and ensuring users maintain their authentication status across
 * page reloads, browser sessions, and token expirations.
 */

import { supabase } from './supabase-client';

// Constants for local storage keys
const SESSION_STORAGE_KEY = 'supabase-auth';
const AUTH_STATUS_KEY = 'auth-status';
const USER_DATA_KEY = 'contestedUserData';

/**
 * Persists the session data to local storage
 * 
 * @param session The session data to persist
 * @param userData Optional user data to store alongside the session
 */
export function persistSession(session: any, userData?: any) {
  if (!session || !session.access_token) return false;
  
  try {
    // 1. Store the session data
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user_id: session.user?.id,
      timestamp: Date.now()
    }));
    
    // 2. Set the authentication status flag
    localStorage.setItem(AUTH_STATUS_KEY, 'authenticated');
    
    // 3. Store any additional user data if provided
    if (userData) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify({
        ...userData,
        timestamp: Date.now()
      }));
    }
    
    return true;
  } catch (error) {
    console.error('[SessionPersistence] Error persisting session:', error);
    return false;
  }
}

/**
 * Attempts to recover and restore a session from local storage
 * 
 * @returns True if session was successfully restored, false otherwise
 */
export async function recoverSession(): Promise<boolean> {
  try {
    // 1. Check if we have session data in local storage
    const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionData) return false;
    
    const parsedSession = JSON.parse(sessionData);
    
    // 2. Validate the session data has the necessary tokens
    if (!parsedSession.access_token || !parsedSession.refresh_token) {
      console.log('[SessionPersistence] Incomplete session data found');
      return false;
    }
    
    // 3. Check if session is expired or close to expiry
    if (parsedSession.expires_at) {
      const expiresAt = parsedSession.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      
      // If expired, try to refresh using the refresh token
      if (expiresAt <= now) {
        console.log('[SessionPersistence] Session expired, attempting refresh');
        const result = await refreshExpiredSession(parsedSession.refresh_token);
        return result;
      }
    }
    
    // 4. If session is still valid, set it in Supabase
    console.log('[SessionPersistence] Restoring valid session from storage');
    const { data, error } = await supabase.auth.setSession({
      access_token: parsedSession.access_token,
      refresh_token: parsedSession.refresh_token
    });
    
    if (error) {
      console.error('[SessionPersistence] Error setting session:', error);
      return false;
    }
    
    if (data?.session) {
      console.log('[SessionPersistence] Session successfully restored');
      
      // Update the session storage with latest data
      persistSession(data.session, data.user);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[SessionPersistence] Error recovering session:', error);
    return false;
  }
}

/**
 * Tries to refresh an expired session using the refresh token
 * 
 * @param refreshToken The refresh token to use
 * @returns True if session was successfully refreshed, false otherwise
 */
async function refreshExpiredSession(refreshToken: string): Promise<boolean> {
  if (!refreshToken) return false;
  
  try {
    console.log('[SessionPersistence] Attempting to refresh expired session');
    
    // Try to refresh the session with Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });
    
    if (error) {
      console.error('[SessionPersistence] Error refreshing session:', error);
      return false;
    }
    
    if (data?.session) {
      console.log('[SessionPersistence] Session successfully refreshed');
      
      // Update local storage with the new session
      persistSession(data.session, data.user);
      
      // Also refresh server-side session state
      try {
        await fetch('/api/auth/refresh-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`
          },
          credentials: 'include'
        });
        console.log('[SessionPersistence] Server-side session refreshed');
      } catch (serverError) {
        console.warn('[SessionPersistence] Server-side refresh failed:', serverError);
        // Non-critical, we can still continue with the client-side refreshed session
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[SessionPersistence] Error in refresh process:', error);
    return false;
  }
}

/**
 * Clears all session data from local storage
 */
export function clearSessionData() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(AUTH_STATUS_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    
    // Clear any other potential auth-related items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('contested')) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('[SessionPersistence] Error clearing session data:', error);
    return false;
  }
}