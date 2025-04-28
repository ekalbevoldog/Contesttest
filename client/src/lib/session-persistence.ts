/**
 * Session Persistence Utilities
 * 
 * This module contains utilities for enhancing session persistence
 * and ensuring users maintain their authentication status across
 * page reloads, browser sessions, and token expirations.
 * 
 * OPTIMIZED VERSION - Reduces redundant storage operations and logging
 */

import { supabase } from './supabase-client';
import { createLogger } from './logger';

// Create module-specific logger
const logger = createLogger('SessionPersistence');

// Constants for local storage keys
const SESSION_STORAGE_KEY = 'supabase-auth';
const AUTH_STATUS_KEY = 'auth-status';
const USER_DATA_KEY = 'contestedUserData';

// Cache storage operations to prevent redundant reads/writes
const storageCache = {
  sessionData: null as any,
  userData: null as any,
  authStatus: null as string | null,
  lastRead: 0,
  // Cache validity period in milliseconds (10 seconds)
  cacheValidityPeriod: 10000
};

/**
 * Helper to get session data from storage with caching
 */
function getSessionData(): any {
  const now = Date.now();
  
  // If cache is valid, return cached data
  if (storageCache.sessionData && 
      (now - storageCache.lastRead < storageCache.cacheValidityPeriod)) {
    return storageCache.sessionData;
  }
  
  // Cache is invalid or empty, read from storage
  try {
    const data = localStorage.getItem(SESSION_STORAGE_KEY);
    if (data) {
      storageCache.sessionData = JSON.parse(data);
    } else {
      storageCache.sessionData = null;
    }
    storageCache.lastRead = now;
    return storageCache.sessionData;
  } catch (error) {
    logger.error('Error reading session data:', error);
    return null;
  }
}

/**
 * Helper to get auth status from storage with caching
 */
function getAuthStatus(): string | null {
  const now = Date.now();
  
  // If cache is valid, return cached data
  if (storageCache.authStatus !== null && 
      (now - storageCache.lastRead < storageCache.cacheValidityPeriod)) {
    return storageCache.authStatus;
  }
  
  // Cache is invalid or empty, read from storage
  try {
    storageCache.authStatus = localStorage.getItem(AUTH_STATUS_KEY);
    storageCache.lastRead = now;
    return storageCache.authStatus;
  } catch (error) {
    logger.error('Error reading auth status:', error);
    return null;
  }
}

/**
 * Persists the session data to local storage
 * 
 * @param session The session data to persist
 * @param userData Optional user data to store alongside the session
 */
export function persistSession(session: any, userData?: any) {
  if (!session || !session.access_token) return false;
  
  try {
    // Prepare session data object
    const sessionDataObj = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user_id: session.user?.id,
      timestamp: Date.now()
    };
    
    // 1. Update cache first
    storageCache.sessionData = sessionDataObj;
    storageCache.authStatus = 'authenticated';
    if (userData) {
      storageCache.userData = {
        ...userData,
        timestamp: Date.now()
      };
    }
    storageCache.lastRead = Date.now();
    
    // 2. Store the session data
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionDataObj));
    
    // 3. Set the authentication status flag
    localStorage.setItem(AUTH_STATUS_KEY, 'authenticated');
    
    // 4. Store any additional user data if provided
    if (userData) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify({
        ...userData,
        timestamp: Date.now()
      }));
    }
    
    return true;
  } catch (error) {
    logger.error('Error persisting session:', error);
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
    // 1. Get session data from cache or storage
    const parsedSession = getSessionData();
    if (!parsedSession) {
      return false;
    }
    
    // 2. Validate the session data has the necessary tokens
    if (!parsedSession.access_token || !parsedSession.refresh_token) {
      logger.info('Incomplete session data found');
      return false;
    }
    
    // 3. Check if session is expired or close to expiry
    if (parsedSession.expires_at) {
      const expiresAt = parsedSession.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      
      // If expired, try to refresh using the refresh token
      if (expiresAt <= now) {
        logger.info('Session expired, attempting refresh');
        const result = await refreshExpiredSession(parsedSession.refresh_token);
        return result;
      }
    }
    
    // 4. If session is still valid, set it in Supabase
    logger.info('Restoring valid session from storage');
    const { data, error } = await supabase.auth.setSession({
      access_token: parsedSession.access_token,
      refresh_token: parsedSession.refresh_token
    });
    
    if (error) {
      logger.error('Error setting session:', error);
      return false;
    }
    
    if (data?.session) {
      logger.info('Session successfully restored');
      
      // Update the session storage with latest data
      persistSession(data.session, data.user);
      
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error recovering session:', error);
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
  if (!refreshToken) {
    logger.info('No refresh token provided');
    return false;
  }
  
  try {
    logger.info('Attempting to refresh expired session');
    logger.debug('Using refresh token:', refreshToken.substring(0, 10) + '...');
    
    // Try to refresh the session with Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });
    
    if (error) {
      logger.error('Error refreshing session with Supabase:', error);
      
      // Try with direct API call as fallback
      try {
        logger.info('Attempting direct API refresh as fallback');
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          logger.error('Direct API refresh failed:', errorText);
          return false;
        }
        
        const refreshData = await response.json();
        if (refreshData?.access_token) {
          logger.info('Direct API refresh succeeded');
          
          // Manually set session with the refreshed tokens
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token || refreshToken
          });
          
          if (sessionError) {
            logger.error('Error setting refreshed session:', sessionError);
            return false;
          }
          
          logger.info('Session manually set after direct API refresh');
          if (sessionData?.session) {
            persistSession(sessionData.session, sessionData.user);
            
            // Call server refresh endpoint with new token
            await serverSideRefresh(sessionData.session.access_token);
            return true;
          }
        }
      } catch (directApiError) {
        logger.error('Error during direct API refresh attempt:', directApiError);
      }
      
      return false;
    }
    
    if (data?.session) {
      logger.info('Session successfully refreshed through Supabase');
      logger.debug('New access token:', data.session.access_token.substring(0, 10) + '...');
      
      // Update local storage with the new session
      persistSession(data.session, data.user);
      
      // Also refresh server-side session state
      await serverSideRefresh(data.session.access_token);
      return true;
    }
    
    logger.info('Refresh completed but no session returned');
    return false;
  } catch (error) {
    logger.error('Error in refresh process:', error);
    return false;
  }
}

/**
 * Helper function to refresh server-side session state
 */
async function serverSideRefresh(accessToken: string): Promise<boolean> {
  if (!accessToken) return false;
  
  try {
    logger.info('Refreshing server-side session state');
    logger.debug('Using access token:', accessToken.substring(0, 10) + '...');
    
    const response = await fetch('/api/auth/refresh-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.warn('Server-side refresh failed:', response.status, errorText);
      return false;
    }
    
    logger.info('Server-side session refreshed successfully');
    return true;
  } catch (serverError) {
    logger.warn('Server-side refresh error:', serverError);
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
    logger.error('Error clearing session data:', error);
    return false;
  }
}