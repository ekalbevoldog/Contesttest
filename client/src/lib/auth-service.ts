/**
 * Unified Authentication Service
 * 
 * This service consolidates authentication approaches:
 * - Uses Supabase Auth as the primary authentication mechanism
 * - Falls back to simple-auth only when necessary
 * - Manages user sessions consistently across the application
 */

import { supabase } from './supabase-client';
import * as simpleAuth from './simple-auth';

// User type with role information
export type UserRole = 'athlete' | 'business' | 'compliance' | 'admin';

export interface EnhancedUser {
  id: string;
  email: string;
  role?: UserRole;
  fullName?: string;
  profileCompleted?: boolean;
  // Add other user properties as needed
  [key: string]: any;
}

/**
 * Initialize authentication on app startup
 * Checks both Supabase and fallback auth
 */
export async function initializeAuth(): Promise<boolean> {
  console.log('[AuthService] Initializing auth');
  
  try {
    // First try Supabase Auth
    const { data, error } = await supabase.auth.getSession();
    
    if (!error && data?.session) {
      console.log('[AuthService] Supabase session found');
      return true;
    }
    
    // If no Supabase session, try fallback auth
    const fallbackSuccess = await simpleAuth.initializeAuthFromStorage();
    console.log('[AuthService] Fallback auth result:', fallbackSuccess);
    
    return fallbackSuccess;
  } catch (error) {
    console.error('[AuthService] Auth initialization error:', error);
    return false;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    // First check Supabase Auth
    const { data, error } = await supabase.auth.getSession();
    
    if (!error && data?.session) {
      console.log('[AuthService] User is authenticated via Supabase');
      return true;
    }
    
    // Fall back to simple auth
    const fallbackAuthenticated = simpleAuth.isAuthenticated();
    
    if (fallbackAuthenticated) {
      console.log('[AuthService] User is authenticated via fallback auth');
    } else {
      console.log('[AuthService] User is not authenticated');
    }
    
    return fallbackAuthenticated;
  } catch (error) {
    console.error('[AuthService] Error checking authentication:', error);
    return false;
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<EnhancedUser | null> {
  try {
    // First try Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (!error && user) {
      console.log('[AuthService] Retrieved user from Supabase');
      
      // Get user metadata including role
      let role: UserRole | undefined;
      let fullName = '';
      
      if (user.user_metadata) {
        // Try to get role from user metadata
        if (user.user_metadata.role) {
          role = user.user_metadata.role as UserRole;
        }
        
        // Try to get full name
        if (user.user_metadata.full_name) {
          fullName = user.user_metadata.full_name;
        }
      }
      
      return {
        id: user.id,
        email: user.email || '',
        role: role as UserRole | undefined,
        fullName: fullName
        // Don't spread user object to avoid duplicate properties
      };
    }
    
    // Fall back to simple auth
    const authData = simpleAuth.getStoredAuthData();
    
    if (authData && authData.user) {
      console.log('[AuthService] Retrieved user from fallback auth');
      
      return {
        id: authData.user.id,
        email: authData.user.email || '',
        role: authData.user.role as UserRole,
        fullName: authData.user.full_name || '',
        profileCompleted: authData.user.profile_completed || false,
        ...authData.user
      };
    }
    
    console.log('[AuthService] No user found');
    return null;
  } catch (error) {
    console.error('[AuthService] Error getting current user:', error);
    return null;
  }
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string): Promise<{
  success: boolean;
  user?: EnhancedUser;
  session?: any;
  error?: string;
}> {
  try {
    console.log('[AuthService] Attempting login');
    
    // First try Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error && data?.user) {
      console.log('[AuthService] Login successful via Supabase');
      
      // Get user metadata including role
      let role: UserRole | undefined;
      let fullName = '';
      
      if (data.user.user_metadata) {
        // Try to get role from user metadata
        if (data.user.user_metadata.role) {
          role = data.user.user_metadata.role as UserRole;
        }
        
        // Try to get full name
        if (data.user.user_metadata.full_name) {
          fullName = data.user.user_metadata.full_name;
        }
      }
      
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || '',
          role: role as UserRole | undefined,
          fullName: fullName,
          profileCompleted: data.user.user_metadata?.profile_completed || false
        },
        session: data.session
      };
    }
    
    console.log('[AuthService] Supabase login failed, trying fallback auth');
    
    // Fall back to simple auth
    const fallbackResult = await simpleAuth.login(email, password);
    
    if (fallbackResult.success && fallbackResult.user) {
      console.log('[AuthService] Login successful via fallback auth');
      
      return {
        success: true,
        user: {
          id: fallbackResult.user.id,
          email: fallbackResult.user.email || '',
          role: fallbackResult.user.role as UserRole,
          fullName: fallbackResult.user.full_name || '',
          profileCompleted: fallbackResult.user.profile_completed || false,
          ...fallbackResult.user
        },
        session: { access_token: fallbackResult.token }
      };
    }
    
    console.log('[AuthService] Login failed');
    return {
      success: false,
      error: error?.message || fallbackResult.error || 'Invalid email or password'
    };
  } catch (error) {
    console.error('[AuthService] Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error during login'
    };
  }
}

/**
 * Register a new user
 */
export async function register(data: {
  email: string;
  password: string;
  fullName?: string;
  role?: string;
  [key: string]: any;
}): Promise<{
  success: boolean;
  user?: EnhancedUser;
  session?: any;
  error?: string;
}> {
  try {
    console.log('[AuthService] Attempting registration');
    
    const { email, password, fullName, role = 'athlete', ...otherData } = data;
    
    // First try Supabase Auth
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
          role: role,
          ...otherData
        }
      }
    });
    
    if (!error && authData?.user) {
      console.log('[AuthService] Registration successful via Supabase');
      
      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email || '',
          role: role as UserRole,
          fullName: fullName || '',
          profileCompleted: false
        },
        session: authData.session
      };
    }
    
    console.log('[AuthService] Supabase registration failed, trying fallback auth');
    
    // Fall back to simple auth
    const fallbackResult = await simpleAuth.register(
      email,
      password,
      fullName || '',
      role
    );
    
    if (fallbackResult.success && fallbackResult.user) {
      console.log('[AuthService] Registration successful via fallback auth');
      
      return {
        success: true,
        user: {
          id: fallbackResult.user.id,
          email: fallbackResult.user.email || '',
          role: fallbackResult.user.role as UserRole,
          fullName: fallbackResult.user.full_name || '',
          profileCompleted: false,
          ...fallbackResult.user
        },
        session: { access_token: fallbackResult.token }
      };
    }
    
    console.log('[AuthService] Registration failed');
    return {
      success: false,
      error: error?.message || fallbackResult.error || 'Error creating account'
    };
  } catch (error) {
    console.error('[AuthService] Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error during registration'
    };
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<boolean> {
  try {
    console.log('[AuthService] Attempting logout');
    
    // First try Supabase Auth
    const { error } = await supabase.auth.signOut();
    
    if (!error) {
      console.log('[AuthService] Supabase logout successful');
    } else {
      console.log('[AuthService] Supabase logout error:', error);
    }
    
    // Also perform fallback auth logout
    const fallbackSuccess = await simpleAuth.logout();
    
    if (fallbackSuccess) {
      console.log('[AuthService] Fallback auth logout successful');
    }
    
    return true;
  } catch (error) {
    console.error('[AuthService] Logout error:', error);
    
    // Try to do local cleanup anyway
    simpleAuth.clearAuthData();
    
    return false;
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<boolean> {
  try {
    console.log('[AuthService] Refreshing session');
    
    // First try Supabase Auth
    const { data, error } = await supabase.auth.refreshSession();
    
    if (!error && data?.session) {
      console.log('[AuthService] Supabase session refreshed successfully');
      return true;
    }
    
    console.log('[AuthService] Supabase session refresh failed, trying fallback');
    
    // Call the fallback auth refresh endpoint
    try {
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        console.log('[AuthService] Fallback session refreshed successfully');
        return true;
      }
    } catch (fallbackError) {
      console.error('[AuthService] Fallback session refresh error:', fallbackError);
    }
    
    return false;
  } catch (error) {
    console.error('[AuthService] Session refresh error:', error);
    return false;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userData: {
  [key: string]: any;
}): Promise<{
  success: boolean;
  user?: EnhancedUser;
  error?: string;
}> {
  try {
    console.log('[AuthService] Updating user profile');
    
    // First try Supabase Auth
    const { data, error } = await supabase.auth.updateUser({
      data: userData
    });
    
    if (!error && data?.user) {
      console.log('[AuthService] User profile updated via Supabase');
      
      // Extract user data safely
      let role: UserRole | undefined;
      let fullName = '';
      
      if (data.user.user_metadata) {
        if (data.user.user_metadata.role && 
            ['athlete', 'business', 'compliance', 'admin'].includes(data.user.user_metadata.role)) {
          role = data.user.user_metadata.role as UserRole;
        }
        
        if (data.user.user_metadata.full_name) {
          fullName = data.user.user_metadata.full_name;
        }
      }
      
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || '',
          role: role,
          fullName: fullName,
          profileCompleted: data.user.user_metadata?.profile_completed || false
        }
      };
    }
    
    console.log('[AuthService] Supabase profile update failed');
    return {
      success: false,
      error: error?.message || 'Error updating profile'
    };
  } catch (error) {
    console.error('[AuthService] Profile update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error updating profile'
    };
  }
}