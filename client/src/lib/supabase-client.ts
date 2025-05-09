import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Declare supabase as a singleton to prevent multiple instances
let _supabaseInstance: SupabaseClient | null = null;

// Track initialization state
let isInitialized = false;

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

// Custom storage implementation with logging
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
  if (isInitialized && _supabaseInstance) {
    console.log('[Supabase] Already initialized');
    return true;
  }

  try {
    console.log('[Supabase] Fetching configuration from server...');

    // Get configuration from server
    const response = await fetch('/api/config/supabase', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Supabase configuration: ${response.statusText}`);
    }
    
    const config = await response.json();

    // Validate configuration
    if (!config || !config.url || !config.key) {
      throw new Error('Invalid Supabase configuration: Missing URL or API key');
    }

    console.log(`[Supabase] Configuration received successfully`);

    // Create the Supabase client instance
    _supabaseInstance = createClient(config.url, config.key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: customStorage,
        storageKey: 'contested-auth'
      },
      // Disable realtime to prevent WebSocket connection issues
      realtime: {
        params: {
          eventsPerSecond: 0
        }
      }
    });

    // Verify the connection works
    const { error } = await _supabaseInstance.from('users').select('count').limit(1);
    if (error) {
      console.error('[Supabase] Connection test failed:', error);
      throw new Error(`Supabase connection failed: ${error.message}`);
    }

    console.log('[Supabase] Initialized successfully');
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('[Supabase] Initialization error:', error);
    throw error;
  }
}

// Helper functions for authentication
export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    console.log('[Auth] Attempting login via server endpoint');
    
    // Call the server login endpoint
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // Include cookies in the request
    });

    // Handle error responses
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        return { error: errorData.error || errorData.message || 'Login failed' };
      } else {
        return { error: `Login failed: ${response.status} ${response.statusText}` };
      }
    }

    // Parse the successful response
    const loginData = await response.json();
    console.log('[Auth] Server login successful');

    // Store authentication data in localStorage
    if (loginData.user) {
      localStorage.setItem('contestedUserData', JSON.stringify({
        ...loginData.user,
        timestamp: Date.now()
      }));
    }

    // Store session data if available
    if (loginData.session) {
      localStorage.setItem('auth-status', 'authenticated');
      localStorage.setItem('supabase-auth', JSON.stringify({
        ...loginData.session,
        timestamp: Date.now()
      }));
    }

    // Sync with Supabase auth state if session token is available
    if (loginData.session?.access_token) {
      try {
        await supabase.auth.setSession({
          access_token: loginData.session.access_token,
          refresh_token: loginData.session.refresh_token
        });
        console.log('[Auth] Supabase session synchronized');
      } catch (error) {
        console.error('[Auth] Error syncing Supabase session:', error);
      }
    }

    return loginData;
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return { error: 'An unexpected error occurred during login. Please try again.' };
  }
};

export const registerUser = async (userData: {
  email: string;
  password: string;
  fullName: string;
  role: 'athlete' | 'business' | 'compliance' | 'admin';
}) => {
  try {
    console.log('[Auth] Registering new user via server endpoint');
    
    // Call server registration endpoint
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include',
    });

    // Handle response based on content type
    const contentType = response.headers.get('content-type');
    
    // Parse JSON response if available
    if (contentType && contentType.includes('application/json')) {
      const responseData = await response.json();
      
      // Handle error responses
      if (!response.ok) {
        const errorMessage = responseData.message || responseData.error || 'Registration failed';
        return { error: errorMessage };
      }
      
      // Special case: Account already exists but credentials are valid
      if (response.status === 200 && responseData.user) {
        return {
          message: 'Account exists, logging in',
          user: responseData.user,
          session: responseData.session
        };
      }
      
      console.log('[Auth] Registration successful');
      
      // Store session data if available
      if (responseData.session) {
        localStorage.setItem('auth-status', 'authenticated');
        localStorage.setItem('supabase-auth', JSON.stringify({
          ...responseData.session,
          timestamp: Date.now()
        }));
      }
      
      // Store user data if available
      if (responseData.user) {
        localStorage.setItem('contestedUserData', JSON.stringify({
          ...responseData.user,
          timestamp: Date.now()
        }));
      }
      
      return responseData;
    } else {
      // Handle non-JSON responses as errors
      return { 
        error: `Registration failed: Server returned invalid response format (${response.status} ${response.statusText})`
      };
    }
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    return { 
      error: 'An unexpected error occurred during registration. Please try again.' 
    };
  }
};

export const getCurrentUser = async () => {
  try {
    // Check local storage first for recent cached data (less than 5 min old)
    const cachedData = localStorage.getItem('contestedUserData');
    if (cachedData) {
      try {
        const parsedData = JSON.parse(cachedData);
        const isCacheValid = parsedData.timestamp && 
                           (Date.now() - parsedData.timestamp < 5 * 60 * 1000);
        
        if (isCacheValid) {
          console.log('[Auth] Using cached user data');
          return parsedData;
        }
      } catch (err) {
        console.warn('[Auth] Error parsing cached user data:', err);
      }
    }
    
    // Try to get user data from server first
    console.log('[Auth] Fetching user data from server');
    try {
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // Cache the data
        localStorage.setItem('contestedUserData', JSON.stringify({
          ...userData,
          timestamp: Date.now()
        }));
        
        return userData;
      }
      
      // If 401, user is not authenticated
      if (response.status === 401) {
        console.log('[Auth] User not authenticated');
        return null;
      }
    } catch (error) {
      console.error('[Auth] Error fetching user from server:', error);
    }
    
    // Fall back to Supabase auth
    console.log('[Auth] Falling back to Supabase auth');
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[Auth] Supabase auth error:', error);
      return null;
    }
    
    if (data.user) {
      // Try to get additional profile data
      try {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', data.user.id)
          .maybeSingle();
          
        if (profileData) {
          const enhancedUser = {
            ...data.user,
            profile: profileData
          };
          
          // Cache the enhanced data
          localStorage.setItem('contestedUserData', JSON.stringify({
            ...enhancedUser,
            timestamp: Date.now()
          }));
          
          return enhancedUser;
        }
      } catch (profileError) {
        console.warn('[Auth] Error fetching profile data:', profileError);
      }
      
      return data.user;
    }
    
    return null;
  } catch (error) {
    console.error('[Auth] Error in getCurrentUser:', error);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    console.log('[Auth] Logging out user');
    
    // Call server logout endpoint
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      console.log('[Auth] Server logout successful');
    } catch (error) {
      console.warn('[Auth] Server logout error:', error);
    }
    
    // Sign out from Supabase
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('[Auth] Supabase sign out successful');
    } catch (error) {
      console.warn('[Auth] Supabase sign out error:', error);
    }
    
    // Clear local storage auth data
    const authKeys = [
      'contestedUserData', 
      'auth-status', 
      'supabase-auth'
    ];
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`[Auth] Error removing ${key}:`, e);
      }
    });
    
    // Redirect to home page after logout
    window.location.href = '/?logout=complete';
    return true;
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    
    // Fallback cleanup
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch (e) {
      window.location.reload();
    }
    
    return false;
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

// The alternate logout method has been removed to avoid duplication
// Use the logoutUser method above for all logout operations