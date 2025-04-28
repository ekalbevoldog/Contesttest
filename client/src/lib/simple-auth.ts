// Simple authentication helper with localStorage persistence
import { supabase } from './supabase-client';
import { createLogger } from './logger';

// Create module-specific logger
const logger = createLogger('SimpleAuth');

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
  
  logger.info('Storing auth data');
  
  const authData: AuthData = {
    token,
    user,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authData));
    localStorage.setItem('auth-status', 'authenticated');
  } catch (error) {
    logger.error('Error storing auth data:', error);
  }
}

/**
 * Clear authentication data from localStorage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  logger.info('Clearing auth data');
  
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.setItem('auth-status', 'unauthenticated');
    
    // Also try to clear any session data
    localStorage.removeItem('supabase-auth');
    
    // Clear cookies as well
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name.includes('auth') || name.includes('session') || name.includes('contested')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
  } catch (error) {
    logger.error('Error clearing auth data:', error);
  }
}

/**
 * Get stored authentication data from localStorage
 */
export function getStoredAuthData(): AuthData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const authDataJson = localStorage.getItem(AUTH_USER_KEY);
    if (!authDataJson) return null;
    
    const authData = JSON.parse(authDataJson) as AuthData;
    
    // Check if auth data is expired (24 hours)
    const now = Date.now();
    const expireTime = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now - authData.timestamp > expireTime) {
      logger.info('Auth data expired, clearing');
      clearAuthData();
      return null;
    }
    
    return authData;
  } catch (error) {
    logger.error('Error getting stored auth data:', error);
    return null;
  }
}

/**
 * Get stored authentication token from localStorage
 */
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    logger.error('Error getting stored auth token:', error);
    return null;
  }
}

/**
 * Check if user is authenticated based on stored data
 */
export function isAuthenticated(): boolean {
  return !!getStoredAuthToken();
}

/**
 * Initialize authentication from localStorage if available
 */
export async function initializeAuthFromStorage(): Promise<boolean> {
  logger.info('Initializing auth from storage');
  
  // Try to get stored auth data
  const authData = getStoredAuthData();
  if (!authData || !authData.token) {
    logger.info('No stored auth data found');
    return false;
  }
  
  // Try to verify the token with the server
  try {
    const response = await fetch('/api/auth/user', {
      headers: {
        'Authorization': `Bearer ${authData.token}`
      }
    });
    
    if (response.ok) {
      logger.info('Auth token verified successfully');
      return true;
    } else {
      logger.warn('Stored auth token is invalid, clearing');
      clearAuthData();
      return false;
    }
  } catch (error) {
    logger.error('Error validating stored auth token:', error);
    return false;
  }
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
  logger.info('Attempting login for email:', email);
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logger.info('Login successful');
      storeAuthData(data.token, data.user);
      return { success: true, user: data.user };
    } else {
      logger.warn('Login failed:', data.error);
      return { success: false, error: data.error || 'Login failed' };
    }
  } catch (error) {
    logger.error('Error during login:', error);
    return { success: false, error: 'Network or server error' };
  }
}

/**
 * Register a new user
 */
export async function register(userData: any): Promise<{ success: boolean; user?: any; error?: string }> {
  logger.info('Attempting registration');
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      logger.info('Registration successful');
      storeAuthData(data.token, data.user);
      return { success: true, user: data.user };
    } else {
      logger.warn('Registration failed:', data.error);
      return { success: false, error: data.error || 'Registration failed' };
    }
  } catch (error) {
    logger.error('Error during registration:', error);
    return { success: false, error: 'Network or server error' };
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<boolean> {
  logger.info('Logging out user');
  
  try {
    const token = getStoredAuthToken();
    
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        logger.warn('Error calling logout endpoint:', error);
        // Continue with local logout even if server request fails
      }
    }
    
    // Try to sign out with Supabase as well
    try {
      await supabase.auth.signOut();
    } catch (error) {
      logger.warn('Error signing out with Supabase:', error);
    }
    
    // Clear local storage and cookies
    clearAuthData();
    
    logger.info('Logout complete');
    return true;
  } catch (error) {
    logger.error('Error during logout:', error);
    return false;
  }
}