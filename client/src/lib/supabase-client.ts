import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Default placeholder values
let supabaseUrl = '';
let supabaseKey = '';

// Create the Supabase client with placeholder values first - will be updated after initialization
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
        storageKey: 'nil-connect-auth'
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
    // First, try to use our server endpoint for more complete data
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login failed:', errorText);
      throw new Error('Login failed: ' + (errorText || response.statusText));
    }
    
    const loginData = await response.json();
    return loginData;
  } catch (serverError) {
    console.error('Server login failed, falling back to direct Supabase auth:', serverError);
    
    // Fallback to direct Supabase Auth if server endpoint fails
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });
    
    if (error) {
      console.error('Supabase login error:', error);
      throw new Error(error.message);
    }
    
    return data;
  }
};

export const registerUser = async (userData: {
  email: string;
  password: string;
  fullName: string;
  role: 'athlete' | 'business' | 'compliance' | 'admin';
}) => {
  try {
    // Use our server endpoint for registration
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const responseData = await response.json();
    
    // Special case: If status is 200 but not 201, it means user exists but credentials are valid
    // - This is a case where the server found an existing account with matching credentials 
    if (response.status === 200 && responseData.user) {
      console.log('Account already exists but credentials are valid - treating as successful login');
      return {
        message: 'Account exists, logging in',
        user: responseData.user
      };
    }
    
    // Handle error responses
    if (!response.ok) {
      console.error('Registration failed:', responseData);
      
      // Enhanced error message if server provides one
      const errorMessage = responseData.message || 
                          (typeof responseData === 'string' ? responseData : 'Registration failed') ||
                          response.statusText;
                          
      throw new Error(errorMessage);
    }
    
    return responseData;
  } catch (serverError) {
    console.error('Server registration failed:', serverError);
    throw serverError;
  }
};

export const getCurrentUser = async () => {
  try {
    // Try server endpoint first for complete profile data
    const response = await fetch('/api/auth/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
      },
    });
    
    if (!response.ok) {
      // If server endpoint fails with auth error, return null (not authenticated)
      if (response.status === 401) {
        return null;
      }
      
      // For other errors, we'll try the direct Supabase approach
      const errorText = await response.text();
      console.error('Server user fetch failed:', errorText);
      throw new Error('Failed to fetch user: ' + (errorText || response.statusText));
    }
    
    const userData = await response.json();
    return userData;
  } catch (serverError) {
    console.error('Server user fetch failed, falling back to direct Supabase auth:', serverError);
    
    // Fallback to direct Supabase Auth
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      if (error.status === 401) {
        return null; // Not authenticated
      }
      console.error('Supabase getUser error:', error);
      throw new Error(error.message);
    }
    
    return data.user;
  }
};

export const logoutUser = async () => {
  try {
    // Call server logout endpoint
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
      },
    });
    
    // Also perform client-side logout with Supabase
    await supabase.auth.signOut();
    
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
    if (role === 'athlete') {
      const profile = await getAthleteProfile(userId);
      return !!profile;
    }
    
    if (role === 'business') {
      const profile = await getBusinessProfile(userId);
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