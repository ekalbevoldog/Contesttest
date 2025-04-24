/**
 * Authentication utility functions for working with Supabase Auth
 */
import { supabase } from './supabase-client';

/**
 * Login with email and password
 */
export async function loginWithEmail(email: string, password: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Register a new user
 */
export async function registerWithEmail(email: string, password: string, fullName: string, role: string) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName, role }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Registration failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

/**
 * Create user profile
 */
export async function createUserProfile(userType: string, profileData: any) {
  try {
    const response = await fetch('/api/supabase/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...profileData,
        userType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Failed to create profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Profile creation error:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    // First try to get user from Supabase directly
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return null;
    }
    
    if (!sessionData?.session) {
      return null;
    }
    
    // If we have a session, fetch the full user profile from our API
    const response = await fetch('/api/auth/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionData.session.access_token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated
        return null;
      }
      throw new Error('Failed to get user profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Logout the current user
 */
export async function logout() {
  try {
    // Get the current session to include token in logout request
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Call server-side logout endpoint
    if (sessionData?.session?.access_token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
      });
    }
    
    // Also perform client-side logout
    await supabase.auth.signOut();
    
    // Clear any local storage items
    localStorage.removeItem('contestedUserData');
    localStorage.removeItem('userId');
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Try direct Supabase logout as fallback
    try {
      await supabase.auth.signOut();
      return true;
    } catch (directError) {
      console.error('Direct Supabase logout failed:', directError);
      throw directError;
    }
  }
}

/**
 * Check if a user has a profile
 */
export async function checkUserProfile(userId: string, userRole: string) {
  try {
    // Determine the endpoint based on user role
    const endpoint = userRole === 'athlete' 
      ? `/api/supabase/athlete-profile/${userId}`
      : `/api/supabase/business-profile/${userId}`;
    
    const response = await fetch(endpoint);
    
    if (response.ok) {
      // Profile exists
      return true;
    }
    
    if (response.status === 404) {
      // Profile doesn't exist
      return false;
    }
    
    // Some other error
    throw new Error('Failed to check user profile');
  } catch (error) {
    console.error('Error checking user profile:', error);
    return false;
  }
}