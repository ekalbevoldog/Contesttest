import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Default placeholder values
let supabaseUrl = '';
let supabaseKey = '';

// Declare supabase as a singleton to prevent multiple instances
// This is the root cause of the "Multiple GoTrueClient instances" warning
let _supabaseInstance: SupabaseClient | null = null;

// Create a function to get the Supabase client - singleton pattern
export const getSupabase = () => {
  if (!_supabaseInstance) {
    throw new Error('Supabase client not initialized. Call initializeSupabase() first.');
  }
  return _supabaseInstance;
};

// Export a supabase proxy that ensures initialization and redirects all calls to the singleton
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const instance = getSupabase();
    // @ts-ignore
    return instance[prop];
  }
});

// We'll use a flag to track initialization state
let isInitialized = false;

// Custom storage implementation that handles serialization and adds debugging
const customStorage = {
  getItem: (key: string): string | null => {
    try {
      const value = localStorage.getItem(key);
      console.log(`[Storage] Retrieved key ${key}: ${value ? 'exists' : 'null'}`);
      return value;
    } catch (error) {
      console.error(`[Storage] Error retrieving ${key}:`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      console.log(`[Storage] Setting key ${key}`);
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`[Storage] Error setting ${key}:`, error);
    }
  },
  removeItem: (key: string): void => {
    try {
      console.log(`[Storage] Removing key ${key}`);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[Storage] Error removing ${key}:`, error);
    }
  }
};

// Function to initialize the Supabase client with config from our server
export async function initializeSupabase(): Promise<boolean> {
  // If already initialized, just return true
  if (isInitialized && supabase) {
    console.log('[Client] Supabase already initialized.');
    return true;
  }

  try {
    console.log('[Client] Fetching Supabase configuration from server...');

    // Make sure we have a proper fetch call with error handling
    const response = await fetch('/api/config/supabase', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to fetch Supabase config (${response.status}): ${errorMessage}`);
    }

    const config = await response.json();

    // Validate configuration
    if (!config || !config.url || !config.key) {
      throw new Error('Invalid Supabase configuration received from server');
    }

    supabaseUrl = config.url;
    supabaseKey = config.key;

    console.log(`[Client] Supabase URL available: ${!!supabaseUrl}`);
    console.log(`[Client] Supabase URL prefix: ${supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : 'missing'}`);
    console.log(`[Client] Supabase Key available: ${!!supabaseKey}`);

    // Create only ONE instance of the Supabase client WITHOUT real-time configuration
    // This is the key fix for the "Multiple GoTrueClient instances" warning
    if (!_supabaseInstance) {
      console.log('[Client] Creating new Supabase client instance');
      _supabaseInstance = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          // Explicitly tell Supabase to use the browser's localStorage
          storage: customStorage,
          storageKey: 'contested-auth'
        },
        // Explicitly disable realtime to prevent WebSocket connection attempts
        realtime: {
          params: {
            eventsPerSecond: 0
          }
        },
        global: {
          headers: {
            'X-Client-Info': 'nil-connect' // Identify our app to Supabase
          }
        }
      });
    }

    console.log('[Client] Supabase initialized with realtime DISABLED');

    // Test the connection
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('[Client] Could not connect to Supabase:', error);
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    console.log('[Client] Supabase initialized successfully');
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[Client] Error initializing Supabase:', error);
    // Re-throw the error to propagate it to the caller for proper error handling
    throw error;
  }
}

// Helper functions for authentication
export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    // Use server-first approach to ensure complete synchronization
    console.log('[Client] Attempting to login via server endpoint...');
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // Important: include cookies in the request
    });

    if (!response.ok) {
      // Safely handle error responses that might be HTML instead of text
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorJson = await response.json();
          console.error('[Client] Login failed (JSON):', errorJson);
          throw new Error(errorJson.error || errorJson.message || 'Login failed');
        } else {
          const errorText = await response.text();
          console.error('[Client] Login failed (text):', errorText.substring(0, 150) + '...');
          throw new Error('Login failed. Please try again later.');
        }
      } catch (parseError) {
        console.error('[Client] Error parsing login error response:', parseError);
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }
    }

    // Safely parse the successful response
    let loginData;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        loginData = await response.json();
      } else {
        const textResponse = await response.text();
        console.error('[Client] Received non-JSON login response:', textResponse.substring(0, 150) + '...');
        throw new Error('Server returned an invalid response format. Please try again later.');
      }
    } catch (jsonError) {
      console.error('[Client] Error parsing login response:', jsonError);
      throw new Error('Failed to process login response. Please try again later.');
    }
    console.log('[Client] Server login successful');

    // Store both user and profile data in localStorage for persistence
    if (typeof window !== 'undefined') {
      // Store user profile data for quick access
      if (loginData.user) {
        localStorage.setItem('contestedUserData', JSON.stringify({
          ...loginData.user,
          timestamp: Date.now()
        }));
        console.log('[Client] Stored user data in localStorage');
      }
      
      // Store session data for persistence
      if (loginData.session) {
        // Store auth status separately to help check logged-in status quickly
        localStorage.setItem('auth-status', 'authenticated');
        
        // Store full session data
        localStorage.setItem('supabase-auth', JSON.stringify({
          ...loginData.session,
          timestamp: Date.now()
        }));
        console.log('[Client] Stored session data in localStorage');
      }
    }

    // Ensure Supabase auth state is synchronized
    if (loginData.session && loginData.session.access_token) {
      console.log('[Client] Setting session in Supabase from server login response');
      try {
        // Store the session received from server to Supabase's internal storage
        await supabase.auth.setSession({
          access_token: loginData.session.access_token,
          refresh_token: loginData.session.refresh_token
        });
        console.log('[Client] Supabase session successfully set');
      } catch (sessionError) {
        console.error('[Client] Error setting Supabase session:', sessionError);

        // If setting session fails, try the direct sign-in approach as fallback
        try {
          console.log('[Client] Falling back to direct Supabase auth...');
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
          });

          if (error) {
            console.warn('[Client] Direct Supabase auth fallback failed:', error);
          } else {
            console.log('[Client] Direct Supabase auth fallback successful');
            // Return combined data
            return {
              ...loginData,
              supabaseData: data
            };
          }
        } catch (signInError) {
          console.error('[Client] Error in direct Supabase auth fallback:', signInError);
          // Not critical, still proceed with server data
        }
      }
    } else {
      console.warn('[Client] No session token received from server, trying direct Supabase auth');

      try {
        // Use direct Supabase auth as a fallback
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        });

        if (error) {
          console.warn('[Client] Direct Supabase auth failed:', error);
          // Not critical if we already have server user data
        } else {
          console.log('[Client] Direct Supabase auth successful');

          // Merge with login data
          return {
            ...loginData,
            supabaseData: data
          };
        }
      } catch (directAuthError) {
        console.error('[Client] Error in direct Supabase auth:', directAuthError);
        // Not critical, still proceed with server data
      }
    }

    return loginData;
  } catch (error) {
    console.error('[Client] Login error:', error);
    throw error;
  }
};

export const registerUser = async (userData: {
  email: string;
  password: string;
  fullName: string;
  role: 'athlete' | 'business' | 'compliance' | 'admin';
}) => {
  try {
    console.log('[Client] Registering new user via server endpoint');
    // Use our server endpoint for registration first
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include', // Important: include cookies in the request
    });

    // Safely handle the response - check content type before parsing as JSON
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // Handle HTML or other non-JSON responses
      const textResponse = await response.text();
      console.error('[Client] Received non-JSON response:', textResponse.substring(0, 150) + '...');
      throw new Error('Server returned an invalid response format. Please try again later.');
    }

    // Special case: If status is 200 but not 201, it means user exists but credentials are valid
    // - This is a case where the server found an existing account with matching credentials 
    if (response.status === 200 && responseData.user) {
      console.log('[Client] Account already exists but credentials are valid - treating as successful login');
      return {
        message: 'Account exists, logging in',
        user: responseData.user
      };
    }

    // Handle error responses
    if (!response.ok) {
      console.error('[Client] Registration failed:', responseData);

      // Enhanced error message if server provides one
      const errorMessage = responseData.message || 
                          (typeof responseData === 'string' ? responseData : 'Registration failed') ||
                          response.statusText;

      throw new Error(errorMessage);
    }

    console.log('[Client] Registration successful with server endpoint');

    // If server registration was successful but didn't return a session,
    // also register directly with Supabase to ensure a proper session
    if (!responseData.session) {
      try {
        console.log('[Client] No session from server, registering directly with Supabase');
        const { data, error } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              full_name: userData.fullName,
              user_type: userData.role
            }
          }
        });

        if (error) {
          console.warn('[Client] Supabase direct registration failed, but server registration successful:', error);
          // Not fatal, continue with server registration data
        } else {
          console.log('[Client] Supabase direct registration successful, merging data');
          // Merge the data from both sources
          return {
            ...responseData,
            supabaseData: data
          };
        }
      } catch (supabaseError) {
        console.warn('[Client] Error during Supabase direct registration, but server registration successful:', supabaseError);
        // Not fatal, continue with server registration data
      }
    }

    return responseData;
  } catch (serverError) {
    console.error('[Client] Server registration failed, trying direct Supabase registration:', serverError);

    // If server registration fails, try direct Supabase Auth
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            user_type: userData.role
          }
        }
      });

      if (error) {
        console.error('[Client] Supabase direct registration also failed:', error);
        throw error;
      }

      console.log('[Client] Supabase direct registration successful');

      // When using Supabase direct registration, also create a user record in our database
      try {
        console.log('[Client] Creating user record in database after Supabase registration');
        // We got a Supabase user but need to create a record in our database
        if (data?.user) {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session?.access_token || ''}`,
            },
            body: JSON.stringify({
              ...userData,
              auth_id: data.user.id // Link to Supabase Auth user
            }),
            credentials: 'include',
          });

          if (response.ok) {
            console.log('[Client] Successfully created user record in database');
            const serverData = await response.json();

            return {
              ...data,
              serverData
            };
          } else {
            console.warn('[Client] Failed to create user record in database, but Supabase registration successful');
          }
        }
      } catch (dbError) {
        console.warn('[Client] Error creating user record in database, but Supabase registration successful:', dbError);
      }

      return {
        message: 'Registration successful with Supabase',
        user: data.user,
        session: data.session
      };
    } catch (supabaseError) {
      console.error('[Client] Both server and Supabase registration failed:', supabaseError);
      throw supabaseError;
    }
  }
};

export const getCurrentUser = async () => {
  try {
    // First check local storage for recent cached user data
    if (typeof window !== 'undefined') {
      try {
        const cachedUserData = localStorage.getItem('contestedUserData');
        if (cachedUserData) {
          const parsedData = JSON.parse(cachedUserData);
          // Only use cached data if it's recent (less than 5 minutes old)
          const isCacheValid = parsedData.timestamp && 
                              (Date.now() - parsedData.timestamp < 5 * 60 * 1000);

          if (isCacheValid) {
            console.log('[Client] Using recent cached user data from localStorage');
            return parsedData;
          } else {
            console.log('[Client] Cached user data exists but expired, will refresh');
          }
        }
      } catch (cacheError) {
        console.warn('[Client] Error accessing cached user data:', cacheError);
        // Continue with normal flow if cache access fails
      }
    }

    // Check if we have a session in Supabase
    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      console.log('[Client] No active session found in Supabase');
      return null;
    }

    console.log('[Client] Active session found, fetching user data from server');
    // Try server endpoint for complete profile data
    const response = await fetch('/api/auth/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionData.session?.access_token || ''}`,
      },
      credentials: 'include', // Important: include cookies in the request
    });

    if (!response.ok) {
      // If server endpoint fails with auth error, return null (not authenticated)
      if (response.status === 401) {
        console.log('[Client] Server returned 401, user not authenticated');
        return null;
      }

      // For other errors, we'll try the direct Supabase approach
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorJson = await response.json();
          console.error('[Client] Server user fetch failed (JSON):', errorJson);
          throw new Error(errorJson.error || errorJson.message || 'Failed to fetch user data');
        } else {
          const errorText = await response.text();
          console.error('[Client] Server user fetch failed (text):', errorText.substring(0, 150) + '...');
          throw new Error('Failed to fetch user data. Please try again later.');
        }
      } catch (parseError) {
        console.error('[Client] Error parsing user fetch error response:', parseError);
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
      }
    }

    // Safely parse the successful response
    let userData;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        userData = await response.json();
      } else {
        const textResponse = await response.text();
        console.error('[Client] Received non-JSON user response:', textResponse.substring(0, 150) + '...');
        throw new Error('Server returned an invalid response format. Please try again later.');
      }
    } catch (jsonError) {
      console.error('[Client] Error parsing user response:', jsonError);
      throw new Error('Failed to process user data response. Please try again later.');
    }
    console.log('[Client] Successfully retrieved user data from server:', userData?.email);

    // Cache the data for next time
    if (typeof window !== 'undefined' && userData) {
      try {
        localStorage.setItem('contestedUserData', JSON.stringify({
          ...userData,
          timestamp: Date.now()
        }));
        console.log('[Client] Updated user data cache in localStorage');
      } catch (cacheError) {
        console.warn('[Client] Failed to cache user data:', cacheError);
        // Non-critical error, continue
      }
    }

    return userData;
  } catch (serverError) {
    console.error('[Client] Server user fetch failed, falling back to direct Supabase auth:', serverError);

    // Try getting user data from localStorage as fallback
    if (typeof window !== 'undefined') {
      try {
        const cachedUserData = localStorage.getItem('contestedUserData');
        if (cachedUserData) {
          const parsedData = JSON.parse(cachedUserData);
          console.log('[Client] Using cached user data as fallback after server error');
          return parsedData;
        }
      } catch (cacheError) {
        console.warn('[Client] Error accessing cached user data during fallback:', cacheError);
      }
    }

    // Final fallback to direct Supabase Auth
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      if (error.status === 401) {
        console.log('[Client] Supabase returned 401, user not authenticated');
        return null; // Not authenticated
      }
      console.error('[Client] Supabase getUser error:', error);
      throw new Error(error.message);
    }

    if (data.user) {
      console.log('[Client] Successfully retrieved user from Supabase:', data.user.email);

      // Try to enhance the basic user data with additional profile data
      try {
        // Check if we can find a user profile for this auth user
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', data.user.id)
          .maybeSingle();

        if (profileData) {
          console.log('[Client] Found matching profile record for Supabase user');
          // Cache the combined data for next time
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('contestedUserData', JSON.stringify({
                ...data.user,
                profile: profileData,
                timestamp: Date.now()
              }));
              console.log('[Client] Cached enhanced user data in localStorage');
            } catch (cacheError) {
              console.warn('[Client] Failed to cache enhanced user data:', cacheError);
            }
          }

          return {
            ...data.user,
            profile: profileData
          };
        }
      } catch (profileError) {
        console.warn('[Client] Error fetching additional profile data:', profileError);
        // Not critical, return the basic user data
      }
    }

    return data.user;
  }
};

export const logoutUser = async () => {
  try {
    console.log('[Client] Logging out user');

    // Get session first to include in logout request
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token || '';

    // Call server logout endpoint first
    console.log('[Client] Logging out from server endpoint');
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include', // Important: include cookies in the request
    });

    if (!response.ok) {
      console.warn('[Client] Server logout may have failed:', response.status);
    }

    // Then perform client-side logout with Supabase
    console.log('[Client] Signing out from Supabase Auth');
    await supabase.auth.signOut({ scope: 'global' }); // Ensure all sessions are removed

    // Clear any localStorage items that might contain auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('contested-auth');
      localStorage.removeItem('contestedUserData');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');

      // Clear any other potential Supabase tokens
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase') || key.includes('contested')) {
          localStorage.removeItem(key);
        }
      });
    }

    console.log('[Client] Logout complete');
    return true;
  } catch (error) {
    console.error('[Client] Logout error:', error);

    // Try direct Supabase logout as fallback
    try {
      console.log('[Client] Attempting direct Supabase signOut as fallback');
      await supabase.auth.signOut({ scope: 'global' });

      // Clear any localStorage items that might contain auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-auth-token');
        localStorage.removeItem('contested-auth');
        localStorage.removeItem('contestedUserData');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');

        // Clear any other potential Supabase tokens
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('contested')) {
            localStorage.removeItem(key);
          }
        });
      }

      return true;
    } catch (directError) {
      console.error('[Client] Direct Supabase logout failed:', directError);
      throw directError;
    }
  }
};

export const createAthleteProfile = async (profileData: any) => {
  const { data, error } = await supabase
    .from('athlete_profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error('Error creating athlete profile:', error);
    throw new Error(error.message);
  }

  return data;
};

export const createBusinessProfile = async (profileData: any) => {
  const { data, error } = await supabase
    .from('business_profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error('Error creating business profile:', error);
    throw new Error(error.message);
  }

  return data;
};

export const getAthleteProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('athlete_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is the "not found" error
    console.error('Error fetching athlete profile:', error);
    throw new Error(error.message);
  }

  return data;
};

export const getBusinessProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is the "not found" error
    console.error('Error fetching business profile:', error);
    throw new Error(error.message);
  }

  return data;
};

export const updateAthleteProfile = async (userId: string, profileData: any) => {
  const { data, error } = await supabase
    .from('athlete_profiles')
    .update(profileData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating athlete profile:', error);
    throw new Error(error.message);
  }

  return data;
};

export const updateBusinessProfile = async (userId: string, profileData: any) => {
  const { data, error } = await supabase
    .from('business_profiles')
    .update(profileData)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating business profile:', error);
    throw new Error(error.message);
  }

  return data;
};

export const checkUserProfile = async (userId: string, role: string) => {
  try {
    console.log(`Checking profile for user ${userId} with role ${role}`);

    if (role === 'athlete') {
      const profile = await getAthleteProfile(userId);
      console.log('Athlete profile check result:', !!profile);
      return !!profile;
    }

    if (role === 'business') {
      const profile = await getBusinessProfile(userId);
      console.log('Business profile check result:', !!profile);
      return !!profile;
    }

    // For admin and compliance roles, they don't have separate profiles
    if (role === 'admin' || role === 'compliance') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking user profile:', error);
    return false;
  }
};

// Test function to verify connection to Supabase
export const testSupabaseConnection = async () => {
  try {
    console.log('[Client] Testing Supabase connection...');
    const { data, error } = await supabase.from('sessions').select('count').limit(1);

    if (error) {
      console.error('[Client] Supabase connection test failed:', error.message);
      return false;
    }

    console.log('[Client] Supabase connection test successful:', data);
    return true;
  } catch (error) {
    console.error('[Client] Unexpected error during Supabase connection test:', error);
    return false;
  }
};