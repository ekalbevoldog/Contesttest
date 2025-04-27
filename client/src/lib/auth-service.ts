/**
 * Consolidated Authentication Service
 * 
 * This service provides a unified authentication approach:
 * - Uses Supabase Auth as the primary authentication mechanism
 * - Falls back to simple-auth only when necessary
 * - Provides clear, consistent session management
 */

import { supabase, getSupabase } from './supabase-client';
import { storeAuthData, getStoredAuthData, clearAuthData, isAuthenticated as isSimpleAuthenticated } from './simple-auth';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Extended user type that includes role and other application-specific data
export interface EnhancedUser extends SupabaseUser {
  role?: string;
  profile_completed?: boolean;
  [key: string]: any;
}

// Authentication result type
export interface AuthResult {
  success: boolean;
  user?: EnhancedUser;
  session?: any;
  error?: string;
  source?: 'supabase' | 'simple-auth'; // Track which auth system was used
}

// Helper to check if Supabase is initialized
const ensureSupabaseInitialized = async () => {
  try {
    await getSupabase();
    return true;
  } catch (error) {
    console.error('[AuthService] Failed to initialize Supabase', error);
    return false;
  }
};

/**
 * Primary login function
 * - First attempts Supabase Auth
 * - Falls back to simple-auth via API endpoint if Supabase fails
 */
export async function login(email: string, password: string): Promise<AuthResult> {
  console.log('[AuthService] Login attempt for:', email);
  
  // Ensure Supabase is initialized
  const supabaseInitialized = await ensureSupabaseInitialized();
  
  // Step 1: Try Supabase Auth first
  if (supabaseInitialized) {
    try {
      console.log('[AuthService] Attempting Supabase Auth login');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.warn('[AuthService] Supabase Auth login failed:', error.message);
        // Continue to fallback
      } else if (data?.user) {
        console.log('[AuthService] Supabase Auth login successful');
        
        // Get user data from our database
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
        
        let enhancedUser: EnhancedUser = data.user;
        
        if (!userDataError && userData) {
          enhancedUser = {
            ...data.user,
            ...userData,
            auth_id: data.user.id // Ensure auth_id is always set to Supabase ID
          };
        }
        
        // Store in simple-auth for persistence and compatibility
        if (data.session?.access_token) {
          storeAuthData(data.session.access_token, enhancedUser);
        }
        
        return {
          success: true,
          user: enhancedUser,
          session: data.session,
          source: 'supabase'
        };
      }
    } catch (supabaseError) {
      console.error('[AuthService] Supabase Auth error:', supabaseError);
      // Continue to fallback
    }
  }
  
  // Step 2: Fall back to API endpoint (server-side authentication)
  console.log('[AuthService] Falling back to API authentication');
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || errorData.message || 'Authentication failed',
        source: 'simple-auth'
      };
    }
    
    const data = await response.json();
    
    // Store auth data in simple-auth
    if (data.token) {
      storeAuthData(data.token, data.user);
    }
    
    return {
      success: true,
      user: data.user as EnhancedUser,
      session: data.session,
      source: 'simple-auth'
    };
  } catch (apiError) {
    console.error('[AuthService] API login error:', apiError);
    return {
      success: false,
      error: apiError instanceof Error ? apiError.message : 'Authentication failed',
      source: 'simple-auth'
    };
  }
}

/**
 * Registration function
 * - Creates user in Supabase Auth
 * - Creates user record in our database
 */
export async function register(userData: {
  email: string;
  password: string;
  fullName: string;
  role: string;
}): Promise<AuthResult> {
  console.log('[AuthService] Register attempt for:', userData.email);
  
  // Ensure Supabase is initialized
  const supabaseInitialized = await ensureSupabaseInitialized();
  
  if (!supabaseInitialized) {
    return {
      success: false,
      error: 'Supabase client not initialized',
      source: 'supabase'
    };
  }
  
  try {
    // Use the consolidated API endpoint for registration
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || errorData.message || 'Registration failed',
        source: 'supabase'
      };
    }
    
    const data = await response.json();
    
    // Store auth data for session persistence
    if (data.token) {
      storeAuthData(data.token, data.user);
    }
    
    return {
      success: true,
      user: data.user as EnhancedUser,
      session: data.session,
      source: 'supabase'
    };
  } catch (error) {
    console.error('[AuthService] Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
      source: 'supabase'
    };
  }
}

/**
 * Unified logout function
 * - Handles both Supabase Auth and simple-auth logout
 */
export async function logout(): Promise<boolean> {
  console.log('[AuthService] Logout attempt');
  
  // Always clear simple-auth data
  clearAuthData();
  
  // Try Supabase Auth logout
  try {
    await supabase.auth.signOut();
  } catch (supabaseError) {
    console.warn('[AuthService] Supabase Auth logout error:', supabaseError);
    // Continue anyway
  }
  
  // Always call the API logout endpoint too
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (apiError) {
    console.warn('[AuthService] API logout error:', apiError);
    // Continue anyway
  }
  
  // Clear browser storage
  if (typeof window !== 'undefined') {
    // Clear any Supabase tokens
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-auth-token');
    localStorage.removeItem('contested-auth');
    localStorage.removeItem('contestedUserData');
    
    // Clear any other auth-related items
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('auth-status');
    
    // Clear all potential Supabase tokens
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('contested')) {
        localStorage.removeItem(key);
      }
    });
  }
  
  return true;
}

/**
 * Check if user is authenticated using both auth systems
 */
export async function isAuthenticated(): Promise<boolean> {
  // First try Supabase Auth
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      return true;
    }
  } catch (supabaseError) {
    console.warn('[AuthService] Supabase Auth check error:', supabaseError);
  }
  
  // Fall back to simple-auth
  return isSimpleAuthenticated();
}

/**
 * Get current user data from either auth system
 */
export async function getCurrentUser(): Promise<EnhancedUser | null> {
  // First try Supabase Auth
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (!error && data?.user) {
      // Get additional user data from our database
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single();
      
      if (!userDataError && userData) {
        return {
          ...data.user,
          ...userData,
        } as EnhancedUser;
      }
      
      // Try finding user by email if auth_id wasn't found
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.user.email)
        .single();
      
      if (!emailError && userByEmail) {
        return {
          ...data.user,
          ...userByEmail,
        } as EnhancedUser;
      }
      
      return data.user as EnhancedUser;
    }
  } catch (supabaseError) {
    console.warn('[AuthService] Supabase Auth get user error:', supabaseError);
  }
  
  // Fall back to simple-auth
  const authData = getStoredAuthData();
  return authData?.user as EnhancedUser || null;
}

/**
 * Get auth token from either auth system
 */
export function getAuthToken(): string | null {
  // First try Supabase Auth
  try {
    const session = supabase.auth.getSession();
    // @ts-ignore - TypeScript doesn't recognize the synchronous method
    if (session?.data?.session?.access_token) {
      // @ts-ignore
      return session.data.session.access_token;
    }
  } catch (supabaseError) {
    console.warn('[AuthService] Supabase Auth get token error:', supabaseError);
  }
  
  // Fall back to simple-auth
  const authData = getStoredAuthData();
  return authData?.token || null;
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('[AuthService] Session refresh failed:', error);
      return false;
    }
    
    if (data?.session) {
      // Update the simple-auth storage with new token
      const userData = await getCurrentUser();
      if (userData && data.session.access_token) {
        storeAuthData(data.session.access_token, userData);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[AuthService] Session refresh error:', error);
    return false;
  }
}

/**
 * Initialize auth on app startup
 * - Attempts to restore session from both auth systems
 */
export async function initializeAuth(): Promise<boolean> {
  console.log('[AuthService] Initializing auth');
  
  // Ensure Supabase is initialized
  const supabaseInitialized = await ensureSupabaseInitialized();
  
  if (supabaseInitialized) {
    try {
      // Check if we have a Supabase session
      const { data, error } = await supabase.auth.getSession();
      
      if (!error && data?.session) {
        console.log('[AuthService] Found valid Supabase session');
        return true;
      }
    } catch (supabaseError) {
      console.warn('[AuthService] Supabase session check error:', supabaseError);
    }
  }
  
  // Try initializing from simple-auth
  const authData = getStoredAuthData();
  if (authData?.token && authData?.user) {
    console.log('[AuthService] Found valid simple-auth data');
    
    // Validate token with Supabase if possible
    if (supabaseInitialized) {
      try {
        const { data, error } = await supabase.auth.getUser(authData.token);
        
        if (!error && data?.user) {
          console.log('[AuthService] Simple-auth token valid with Supabase');
          return true;
        } else {
          console.warn('[AuthService] Simple-auth token invalid with Supabase');
          clearAuthData(); // Clean up invalid token
          return false;
        }
      } catch (validationError) {
        console.warn('[AuthService] Token validation error:', validationError);
      }
    }
    
    // If Supabase validation failed or wasn't available, trust the simple-auth data
    return true;
  }
  
  console.log('[AuthService] No valid auth data found');
  return false;
}