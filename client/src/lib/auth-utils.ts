/**
 * Authentication utility functions for working with Supabase Auth
 */
import { supabase } from './supabase-client';

/**
 * Login with email and password
 */
export async function loginWithEmail(email: string, password: string) {
  try {
    console.log('[Auth Utils] Attempting login with email');

    // First attempt to sign in directly with Supabase for better session handling
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!supabaseError && supabaseData?.session) {
      console.log('[Auth Utils] Direct Supabase login successful');

      // Now call our API endpoint to sync the user data properly
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseData.session.access_token}`,
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        });

        if (response.ok) {
          console.log('[Auth Utils] API login sync successful');
          const apiData = await response.json();

          // Return combined data from both sources
          return {
            user: supabaseData.user,
            session: supabaseData.session,
            profile: apiData.profile || null,
            redirectTo: apiData.redirectTo || null,
            ...apiData
          };
        }

        // Even if API call fails, we still have a successful Supabase login
        console.log('[Auth Utils] API login sync failed, but Supabase login succeeded');
        return {
          user: supabaseData.user,
          session: supabaseData.session
        };
      } catch (apiError) {
        console.error('[Auth Utils] API login sync error:', apiError);
        // Non-blocking - return Supabase data anyway
        return {
          user: supabaseData.user,
          session: supabaseData.session
        };
      }
    }

    // If Supabase login failed, try our API endpoint
    if (supabaseError) {
      console.log('[Auth Utils] Direct Supabase login failed, trying API endpoint');
    }

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
      throw new Error(errorData.error || errorData.message || 'Login failed');
    }

    const apiData = await response.json();
    console.log('[Auth Utils] API login successful');

    // If API login succeeded but we don't have a Supabase session, set it
    if (apiData.session && !supabaseData?.session) {
      console.log('[Auth Utils] Setting Supabase session from API response');
      try {
        await supabase.auth.setSession({
          access_token: apiData.session.access_token,
          refresh_token: apiData.session.refresh_token
        });

        // Also store session data in localStorage as a backup
        try {
          localStorage.setItem('contested-auth', JSON.stringify({
            session: apiData.session,
            user: apiData.user || null,
            timestamp: new Date().toISOString()
          }));
          console.log('[Auth Utils] Saved session backup to localStorage');
        } catch (storageError) {
          console.warn('[Auth Utils] Failed to save session backup to localStorage:', storageError);
        }
      } catch (sessionError) {
        console.error('[Auth Utils] Failed to set Supabase session:', sessionError);
      }
    }

    return apiData;
  } catch (error) {
    console.error('[Auth Utils] Login error:', error);
    throw error;
  }
}

/**
 * Register a new user
 */
export async function registerWithEmail(email: string, password: string, fullName: string, role: string) {
  try {
    console.log('[Auth Utils] Attempting registration with email');

    // First try to register directly with Supabase for better session handling
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          user_type: role
        }
      }
    });

    if (!supabaseError && supabaseData?.session) {
      console.log('[Auth Utils] Direct Supabase registration successful');

      // Now call our API endpoint to create the corresponding database record
      try {
        console.log('[Auth Utils] Creating user record in database after Supabase registration');
        const serverResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseData.session.access_token}`,
          },
          body: JSON.stringify({ 
            email, 
            password, 
            fullName, 
            role,
            auth_id: supabaseData.user?.id // Include auth ID to link records
          }),
          credentials: 'include', // Important: include cookies in the request
        });

        if (serverResponse.ok) {
          console.log('[Auth Utils] Server registration sync successful');
          const serverData = await serverResponse.json();

          // Return combined data from both sources
          return {
            user: supabaseData.user,
            session: supabaseData.session,
            profile: serverData.profile || null,
            redirectTo: serverData.redirectTo || null,
            needsProfile: serverData.needsProfile || false,
            serverData
          };
        }

        // Even if API call fails, we still have a successful Supabase registration
        console.log('[Auth Utils] Server registration sync failed, but Supabase registration succeeded');
        return {
          user: supabaseData.user,
          session: supabaseData.session,
          // Assume profile needs to be created if server sync failed
          needsProfile: true
        };
      } catch (apiError) {
        console.error('[Auth Utils] Server registration sync error:', apiError);
        // Non-blocking error, still return Supabase data
        return {
          user: supabaseData.user,
          session: supabaseData.session,
          // Assume profile needs to be created if server sync failed
          needsProfile: true
        };
      }
    }

    // If Supabase registration failed or returned errors, try our server endpoint
    if (supabaseError) {
      console.log('[Auth Utils] Direct Supabase registration failed, trying server endpoint:', supabaseError.message);
    }

    console.log('[Auth Utils] Using server endpoint for registration');
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, fullName, role }),
      credentials: 'include', // Important: include cookies in the request
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || errorData.message || 'Registration failed');
    }

    const apiData = await response.json();
    console.log('[Auth Utils] Server registration successful');

    // If server registration succeeded but we don't have a Supabase session, set it
    if (apiData.session && !supabaseData?.session) {
      console.log('[Auth Utils] Setting Supabase session from server response');
      try {
        await supabase.auth.setSession({
          access_token: apiData.session.access_token,
          refresh_token: apiData.session.refresh_token
        });
      } catch (sessionError) {
        console.error('[Auth Utils] Error setting session:', sessionError);
      }
    }

    return apiData;
  } catch (error) {
    console.error('[Auth Utils] Registration error:', error);
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
    console.log('[Auth Utils] getCurrentUser called');
    
    // Check local storage first for recent cached data (less than 5 min old)
    const cachedData = localStorage.getItem('contestedUserData');
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        const isCacheValid = parsedData.timestamp && 
                          (Date.now() - parsedData.timestamp < 5 * 60 * 1000);
        
        if (isCacheValid) {
          console.log('[Auth Utils] Using cached user data');
          return parsedData;
        }
      } catch (err) {
        console.warn('[Auth Utils] Error parsing cached user data:', err);
      }
    }
    
    // First try to get user from Supabase directly
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[Auth Utils] Error getting session:', sessionError);
      return null;
    }

    // Regardless of whether we have a session, always try the API endpoint
    // It may use different forms of authentication (session cookies, etc.)
    console.log('[Auth Utils] Fetching user data from API, session available:', !!sessionData?.session);
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add auth token if we have it
      if (sessionData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
      }
      
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers,
        credentials: 'include' // Send cookies along with the request
      });
  
      console.log('[Auth Utils] API response status:', response.status);
      
      const userData = await response.json();
      console.log('[Auth Utils] User data received with keys:', Object.keys(userData));
      
      // Our enhanced auth endpoint will now return user: null instead of error
      // on unauthenticated requests, so we can check this directly
      if (!userData.authenticated) {
        console.log('[Auth Utils] User not authenticated according to API response');
        
        // If the API says we're not authenticated but we have a Supabase session,
        // this could indicate an auth state mismatch
        if (sessionData?.session) {
          console.warn('[Auth Utils] Auth state mismatch: Supabase has session but API says unauthenticated');
        }
        
        // Return the response data to allow proper handling
        return userData;
      }
      
      // Debug logs to help diagnose the structure
      if (userData.user) {
        console.log('[Auth Utils] User object found with keys:', Object.keys(userData.user));
      }
      
      if (userData.profile) {
        console.log('[Auth Utils] Profile object found with keys:', Object.keys(userData.profile));
      }
      
      // Cache the response data for faster access
      localStorage.setItem('contestedUserData', JSON.stringify({
        ...userData,
        timestamp: Date.now()
      }));
      
      return userData;
    } catch (apiError) {
      console.error('[Auth Utils] Error fetching from API:', apiError);
      
      // If API call fails but we have a Supabase session, use that as fallback
      if (sessionData?.session) {
        console.log('[Auth Utils] Falling back to Supabase user data after API error');
        
        // Get user data from Supabase session
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData?.user) {
          const user = userData.user;
          const role = user.user_metadata?.role || 
                      user.user_metadata?.userType || 
                      'user';
                      
          const fallbackUserData = {
            user: {
              id: user.id,
              email: user.email || '',
              role: role,
              user_metadata: user.user_metadata || {}
            },
            authenticated: true
          };
          
          return fallbackUserData;
        }
      }
    }
    
    return { user: null, authenticated: false };
  } catch (error) {
    console.error('[Auth Utils] Error getting current user:', error);
    return { user: null, authenticated: false, error: 'Error retrieving user' };
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('contestedUserData');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('contested-auth');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-auth-token');
    }

    return true;
  } catch (error) {
    console.error('Logout error:', error);

    // Try direct Supabase logout as fallback
    try {
      await supabase.auth.signOut();

      // Also clear localStorage in the fallback path
      if (typeof window !== 'undefined') {
        localStorage.removeItem('contestedUserData');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('contested-auth');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-auth-token');
      }

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