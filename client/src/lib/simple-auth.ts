// Simple authentication helper with localStorage persistence
import { supabase } from './supabase-client';

const AUTH_TOKEN_KEY = 'contested-auth-token';
const AUTH_USER_KEY = 'contested-user-data';

export interface AuthData {
  token: string;
  user: any;
  timestamp: number;
}

/**
 * Store authentication data in localStorage for persistence
 */
export function storeAuthData(token: string, user: any): void {
  if (typeof window === 'undefined') return;
  
  console.log('[SimpleAuth] Storing auth data');
  
  const authData: AuthData = {
    token,
    user,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authData));
    localStorage.setItem('auth-status', 'authenticated');
    console.log('[SimpleAuth] Auth data stored successfully');
  } catch (error) {
    console.error('[SimpleAuth] Error storing auth data:', error);
  }
}

/**
 * Retrieve stored authentication data from localStorage
 */
export function getStoredAuthData(): AuthData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const authDataStr = localStorage.getItem(AUTH_USER_KEY);
    if (!authDataStr) return null;
    
    const authData = JSON.parse(authDataStr) as AuthData;
    console.log('[SimpleAuth] Retrieved stored auth data');
    return authData;
  } catch (error) {
    console.error('[SimpleAuth] Error retrieving auth data:', error);
    return null;
  }
}

/**
 * Check if user is authenticated based on stored data
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const authStatus = localStorage.getItem('auth-status');
    const authData = getStoredAuthData();
    
    const isValid = !!authStatus && !!authData && !!authData.token;
    console.log('[SimpleAuth] Authentication check:', isValid);
    return isValid;
  } catch (error) {
    console.error('[SimpleAuth] Error checking auth status:', error);
    return false;
  }
}

/**
 * Clear authentication data on logout
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  console.log('[SimpleAuth] Clearing auth data');
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem('auth-status');
    localStorage.removeItem('supabase-auth');
    localStorage.removeItem('contestedUserData');
    
    // Also try to sign out from Supabase
    supabase.auth.signOut().catch(error => {
      console.error('[SimpleAuth] Error signing out from Supabase:', error);
    });
    
    console.log('[SimpleAuth] Auth data cleared successfully');
  } catch (error) {
    console.error('[SimpleAuth] Error clearing auth data:', error);
  }
}

/**
 * Get the authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('[SimpleAuth] Error getting auth token:', error);
    return null;
  }
}

/**
 * Set up authentication persistence on page load
 * This should be called once when the app initializes
 */
export async function initializeAuthFromStorage(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  console.log('[SimpleAuth] Initializing auth from storage');
  
  try {
    const authData = getStoredAuthData();
    
    if (!authData || !authData.token) {
      console.log('[SimpleAuth] No stored auth data found');
      return false;
    }
    
    // Check if the token is valid by calling Supabase
    const { data, error } = await supabase.auth.getUser(authData.token);
    
    if (error || !data.user) {
      console.error('[SimpleAuth] Stored token is invalid:', error);
      clearAuthData(); // Clean up invalid data
      return false;
    }
    
    console.log('[SimpleAuth] Successfully initialized auth from storage');
    return true;
  } catch (error) {
    console.error('[SimpleAuth] Error initializing auth from storage:', error);
    return false;
  }
}