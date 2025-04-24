import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Default placeholder values
let supabaseUrl = '';
let supabaseKey = '';

// Create a reference to hold the Supabase client - will be properly initialized before use
export let supabase: SupabaseClient;

// We'll use a flag to track initialization state
let isInitialized = false;

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
    
    // Initialize the Supabase client WITHOUT real-time configuration
    // IMPORTANT: Disabling realtime to avoid WebSocket errors
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        // Explicitly tell Supabase to use the browser's localStorage
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
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
    // Try direct Supabase auth first
    console.log('[Client] Attempting direct Supabase login first...');
    const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });
    
    // If direct Supabase auth works
    if (!supabaseError && supabaseData.session) {
      console.log('[Client] Direct Supabase login successful');
      
      // Now call server endpoint to ensure proper user record and session
      try {
        console.log('[Client] Syncing login with server endpoint...');
        const serverResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseData.session.access_token}`,
          },
          body: JSON.stringify(credentials),
          credentials: 'include', // Important: include cookies in the request
        });
        
        if (serverResponse.ok) {
          const serverLoginData = await serverResponse.json();
          console.log('[Client] Server sync successful');
          
          // Merge server data with Supabase data
          return {
            ...supabaseData,
            server: serverLoginData
          };
        } else {
          console.log('[Client] Server sync returned non-OK status:', serverResponse.status);
          // Non-blocking error, still return Supabase data
        }
      } catch (syncError) {
        console.warn('[Client] Server sync failed, continuing with Supabase data:', syncError);
        // Non-blocking error, still return Supabase data
      }
      
      return supabaseData;
    }
    
    // If direct Supabase auth fails, fall back to server endpoint
    if (supabaseError) {
      console.log('[Client] Direct Supabase login failed, trying server endpoint:', supabaseError.message);
    }
    
    // Use our server endpoint for login
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
      const errorText = await response.text();
      console.error('[Client] Login failed:', errorText);
      throw new Error('Login failed: ' + (errorText || response.statusText));
    }
    
    const loginData = await response.json();
    console.log('[Client] Server login successful');
    
    // Store session in Supabase auth client to ensure persistence
    if (loginData.session && loginData.session.access_token) {
      console.log('[Client] Setting session from server login response');
      // Store the session received from server to Supabase's internal storage
      await supabase.auth.setSession({
        access_token: loginData.session.access_token,
        refresh_token: loginData.session.refresh_token
      });
    } else if (loginData.token) {
      // Handle older response format
      console.log('[Client] Setting session from token in older response format');
      try {
        const session = await supabase.auth.getSession();
        if (!session.data.session) {
          // If we have token but Supabase doesn't have active session
          console.log('[Client] No active Supabase session, falling back to signInWithPassword');
          // Re-authenticate with the credentials
          await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
          });
        }
      } catch (sessionError) {
        console.error('[Client] Error handling fallback session creation:', sessionError);
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
    
    const responseData = await response.json();
    
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
    // First check if we have a session in Supabase
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
      const errorText = await response.text();
      console.error('[Client] Server user fetch failed:', errorText);
      throw new Error('Failed to fetch user: ' + (errorText || response.statusText));
    }
    
    const userData = await response.json();
    console.log('[Client] Successfully retrieved user data from server:', userData?.email);
    return userData;
  } catch (serverError) {
    console.error('[Client] Server user fetch failed, falling back to direct Supabase auth:', serverError);
    
    // Fallback to direct Supabase Auth
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