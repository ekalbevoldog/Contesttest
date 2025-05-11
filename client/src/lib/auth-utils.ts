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

    // Track authentication attempts
    let supabaseSuccess = false;
    let apiSuccess = false;
    let finalUserData = null;

    // If Supabase login worked, note the success
    if (!supabaseError && supabaseData?.session) {
      console.log('[Auth Utils] Direct Supabase login successful');
      supabaseSuccess = true;
    } else {
      console.log('[Auth Utils] Direct Supabase login failed:', supabaseError?.message);
    }

    // Always try our API endpoint to ensure server-side session is created
    // and to get profile data from the database
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add bearer token if available from Supabase
      if (supabaseSuccess && supabaseData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${supabaseData.session.access_token}`;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Important to include cookies
      });

      console.log('[Auth Utils] API login response status:', response.status);

      if (response.ok) {
        console.log('[Auth Utils] API login successful');
        const apiData = await response.json();
        apiSuccess = true;
        finalUserData = apiData;

        // If API call provides a session but we don't have one from Supabase,
        // synchronize it with Supabase client
        if (apiData.session && !supabaseSuccess) {
          console.log('[Auth Utils] Setting Supabase session from API response');
          try {
            await supabase.auth.setSession({
              access_token: apiData.session.access_token,
              refresh_token: apiData.session.refresh_token
            });
            supabaseSuccess = true;
          } catch (sessionError) {
            console.error('[Auth Utils] Error setting Supabase session:', sessionError);
          }
        }

        // Cache successful login data
        try {
          localStorage.setItem('contestedUserData', JSON.stringify({
            ...apiData,
            timestamp: Date.now()
          }));
          
          // Also store auth session as a backup
          if (apiData.session) {
            localStorage.setItem('contested-auth', JSON.stringify({
              session: apiData.session,
              user: apiData.user || null,
              timestamp: Date.now()
            }));
          }
          console.log('[Auth Utils] Saved session and user data to localStorage');
        } catch (storageError) {
          console.warn('[Auth Utils] Unable to store auth data in localStorage:', storageError);
        }
      } else {
        // API login failed, possibly due to server issues or incorrect credentials
        const errorData = await response.json();
        console.error('[Auth Utils] API login failed:', errorData);
        
        // If Supabase succeeded but API failed, we can still proceed with 
        // limited functionality using just the Supabase user data
        if (supabaseSuccess && supabaseData?.user) {
          console.log('[Auth Utils] Using Supabase data as fallback after API failure');
          const userData = supabaseData.user;
          const role = userData.user_metadata?.role || 
                      userData.user_metadata?.userType || 
                      userData.user_metadata?.user_type || 
                      'user';
                      
          finalUserData = {
            user: {
              id: userData.id,
              email: userData.email || '',
              role: role,
              ...(userData.user_metadata || {})
            },
            session: supabaseData.session,
            authenticated: true
          };
        } else {
          // Both authentication methods failed
          throw new Error(errorData.error || errorData.message || 'Login failed');
        }
      }
    } catch (apiError) {
      console.error('[Auth Utils] API login error:', apiError);
      
      // If Supabase succeeded but API call threw an exception, 
      // fall back to Supabase-only user data
      if (supabaseSuccess && supabaseData?.user) {
        console.log('[Auth Utils] Falling back to Supabase-only login due to API error');
        const userData = supabaseData.user;
        // Use nullish coalescing to handle potential null user_metadata
        const metadata = userData.user_metadata || {};
        const role = metadata.role || 
                    metadata.userType || 
                    metadata.user_type || 
                    'user';
                    
        finalUserData = {
          user: {
            id: userData.id,
            email: userData.email || '',
            role: role,
            ...metadata
          },
          session: supabaseData.session,
          authenticated: true
        };
      } else {
        // Both authentication methods failed
        const errorMessage = apiError instanceof Error 
          ? apiError.message 
          : 'Login failed';
        throw new Error(errorMessage);
      }
    }

    // If we have authentication from either source, return the data
    if (finalUserData) {
      // Ensure standard fields are present in the response
      return {
        ...finalUserData,
        authenticated: true
      };
    }

    // If we got here, both auth methods failed
    throw new Error('Login failed: Unable to authenticate with email and password');
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

    // Track authentication attempts
    let supabaseSuccess = false;
    let apiSuccess = false;
    let finalUserData = null;

    // First try to register directly with Supabase - only with email & password
    // No metadata is sent to avoid enum casting issues
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {} // Empty data object to ensure we're not getting any defaults
      }
    });

    // If Supabase registration worked, note the success
    if (!supabaseError && supabaseData?.session) {
      console.log('[Auth Utils] Direct Supabase registration successful');
      supabaseSuccess = true;
    } else {
      console.log('[Auth Utils] Direct Supabase registration failed:', supabaseError?.message);
    }

    // Always try our API endpoint to ensure server-side record creation
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add bearer token if available from Supabase
      if (supabaseSuccess && supabaseData?.session?.access_token) {
        headers['Authorization'] = `Bearer ${supabaseData.session.access_token}`;
      }

      // Prepare request data with proper typing
      const requestData: {
        email: string;
        password: string;
        fullName: string;
        role: string;
        auth_id?: string;
      } = { 
        email, 
        password, 
        fullName, 
        role 
      };

      // If we have a Supabase user ID, include it to link records
      if (supabaseSuccess && supabaseData?.user?.id) {
        requestData.auth_id = supabaseData.user.id;
      }

      console.log('[Auth Utils] Creating user record in database');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData),
        credentials: 'include', // Important: include cookies in the request
      });

      console.log('[Auth Utils] API registration response status:', response.status);

      if (response.ok) {
        console.log('[Auth Utils] API registration successful');
        const apiData = await response.json();
        apiSuccess = true;
        finalUserData = apiData;

        // If API call provides a session but we don't have one from Supabase,
        // synchronize it with Supabase client
        if (apiData.session && !supabaseSuccess) {
          console.log('[Auth Utils] Setting Supabase session from API response');
          try {
            await supabase.auth.setSession({
              access_token: apiData.session.access_token,
              refresh_token: apiData.session.refresh_token
            });
            supabaseSuccess = true;
          } catch (sessionError) {
            console.error('[Auth Utils] Error setting Supabase session:', sessionError);
          }
        }

        // Cache successful registration data
        try {
          localStorage.setItem('contestedUserData', JSON.stringify({
            ...apiData,
            timestamp: Date.now()
          }));
          
          // Also store auth session as a backup
          if (apiData.session) {
            localStorage.setItem('contested-auth', JSON.stringify({
              session: apiData.session,
              user: apiData.user || null,
              timestamp: Date.now()
            }));
          }
          console.log('[Auth Utils] Saved session and user data to localStorage');
        } catch (storageError) {
          console.warn('[Auth Utils] Unable to store auth data in localStorage:', storageError);
        }
      } else {
        // API registration failed
        const errorData = await response.json();
        console.error('[Auth Utils] API registration failed:', errorData);
        
        // If Supabase succeeded but API failed, we can still proceed with limited functionality
        if (supabaseSuccess && supabaseData?.user) {
          console.log('[Auth Utils] Using Supabase data as fallback after API failure');
          const userData = supabaseData.user;
          // Use nullish coalescing to handle potential null user_metadata
          const metadata = userData.user_metadata || {};
          const role = metadata.role || 
                      metadata.userType || 
                      metadata.user_type || 
                      'user';
                      
          finalUserData = {
            user: {
              id: userData.id,
              email: userData.email || '',
              role: role,
              ...metadata
            },
            session: supabaseData.session,
            authenticated: true,
            needsProfile: true // Assume profile needs to be created if server sync failed
          };
        } else {
          // Both registration methods failed
          throw new Error(errorData.error || errorData.message || 'Registration failed');
        }
      }
    } catch (apiError) {
      console.error('[Auth Utils] API registration error:', apiError);
      
      // If Supabase succeeded but API call threw an exception, 
      // fall back to Supabase-only user data
      if (supabaseSuccess && supabaseData?.user) {
        console.log('[Auth Utils] Falling back to Supabase-only registration due to API error');
        const userData = supabaseData.user;
        // Use nullish coalescing to handle potential null user_metadata
        const metadata = userData.user_metadata || {};
        const role = metadata.role || 
                    metadata.userType || 
                    metadata.user_type || 
                    'user';
                    
        finalUserData = {
          user: {
            id: userData.id,
            email: userData.email || '',
            role: role,
            ...metadata
          },
          session: supabaseData.session,
          authenticated: true,
          needsProfile: true // Assume profile needs to be created if server sync failed
        };
      } else {
        // Both authentication methods failed
        const errorMessage = apiError instanceof Error 
          ? apiError.message 
          : 'Registration failed';
        throw new Error(errorMessage);
      }
    }

    // If we have authentication from either source, return the data
    if (finalUserData) {
      // Ensure standard fields are present in the response
      return {
        ...finalUserData,
        authenticated: true
      };
    }

    // If we got here, both registration methods failed
    throw new Error('Registration failed: Unable to create account with email and password');
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
          // Use nullish coalescing to handle potential null user_metadata
          const metadata = user.user_metadata || {};
          const role = metadata.role || 
                      metadata.userType || 
                      'user';
                      
          const fallbackUserData = {
            user: {
              id: user.id,
              email: user.email || '',
              role: role,
              user_metadata: metadata
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