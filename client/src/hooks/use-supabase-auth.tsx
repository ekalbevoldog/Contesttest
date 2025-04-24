import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { 
  supabase, 
  loginUser, 
  registerUser, 
  logoutUser, 
  getCurrentUser, 
  checkUserProfile,
  initializeSupabase,
  getSupabase
} from '@/lib/supabase-client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

interface EnhancedUser extends SupabaseUser {
  role?: string;
}

interface AuthContextType {
  user: EnhancedUser | null;
  session: any | null;
  isLoading: boolean;
  loadingProfile: boolean;
  userData: any; // Profile data
  hasCompletedProfile: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any, user?: EnhancedUser }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any, user: any }>;
  signOut: () => Promise<void>;
  setUserData: (data: any) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Loading component for Supabase initialization
const InitializationLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
    <p className="text-muted-foreground text-sm">Connecting to authentication service...</p>
  </div>
);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // 0) Initialize Supabase client first
  useEffect(() => {
    async function initializeAuth() {
      try {
        console.log('[Auth] Initializing Supabase client...');
        await initializeSupabase();
        console.log('[Auth] Supabase client initialized successfully');
        setIsInitializing(false);
      } catch (error) {
        console.error('[Auth] Failed to initialize Supabase client:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to the authentication service. Please try refreshing the page.',
          variant: 'destructive',
        });
        setIsInitializing(false);
        setIsLoading(false);
      }
    }
    
    initializeAuth();
  }, [toast]);

  // 1) Once Supabase is initialized, rehydrate session & user
  useEffect(() => {
    if (isInitializing) {
      return; // Wait until Supabase is initialized
    }
    
    console.log('[Auth] Initializing auth state...');
    
    // Properly handle potential errors with supabase.auth.getSession
    const getSessionAndUser = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data.session) {
          console.log('[Auth] Found existing session');
          setSession(data.session);
          setUser(data.session?.user ?? null);
        } else {
          console.log('[Auth] No session found');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[Auth] Error getting session:', error);
        setIsLoading(false);
      }
    };
    
    getSessionAndUser();
  }, [isInitializing]);

  // 2) Subscribe to future auth changes with improved error handling
  useEffect(() => {
    if (isInitializing) {
      return; // Don't set up the listener until Supabase is initialized
    }
    
    console.log('[Auth] Setting up auth state change listener');
    
    let subscription: any = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    // Helper function to set up the auth state change listener
    const setupAuthListener = () => {
      try {
        // First check if Supabase is initialized and get the instance
        if (!supabase) {
          console.error('[Auth] Supabase client not available yet');
          return null;
        }
        
        // Create the listener for auth state changes
        const subscription = supabase.auth.onAuthStateChange(
          async (event: string, newSession: any) => {
            console.log('[Auth] Auth state change event:', event);
            
            if (newSession) {
              console.log('[Auth] Auth state change - setting new session');
              setSession(newSession);
              setUser(newSession?.user ?? null);
            } else {
              console.log('[Auth] Auth state change - clearing session');
              setSession(null);
              setUser(null);
              setUserData(null);
              
              if (event === 'SIGNED_OUT') {
                // Add delay to make sure state is updated before redirection
                setTimeout(() => {
                  navigate('/');
                }, 100);
              }
            }
          }
        );
        
        console.log('[Auth] Auth state change listener successfully set up');
        return subscription.data.subscription;
      } catch (error) {
        console.error('[Auth] Error setting up auth state change listener:', error);
        
        // Retry logic with exponential backoff
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`[Auth] Retrying to set up auth listener (${retryCount}/${maxRetries})...`);
          
          // Wait a bit before retrying with increasing delay
          setTimeout(() => {
            subscription = setupAuthListener();
          }, 1000 * retryCount); // Increasing backoff
        }
        
        return null;
      }
    };
    
    // Initial setup
    subscription = setupAuthListener();
    
    return () => {
      if (subscription) {
        console.log('[Auth] Cleaning up auth state change listener');
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.warn('[Auth] Error unsubscribing from auth changes:', error);
        }
      }
    };
  }, [navigate, isInitializing]);

  // 3) Whenever `user` changes, fetch profile once
  useEffect(() => {
    if (!user) {
      console.log('[Auth] No user, clearing profile data');
      setUserData(null);
      setHasCompletedProfile(false);
      setIsLoading(false);
      return;
    }
    
    console.log('[Auth] User changed, fetching profile for:', user.email);
    let cancelled = false;
    setLoadingProfile(true);

    const fetchProfile = async () => {
      try {
        // Try our server API to get complete user data
        const serverData = await getCurrentUser();
        
        if (cancelled) return;
        
        if (serverData) {
          console.log('[Auth] Server returned user data');
          
          // Detect which response format we got
          let profileData = null;
          let roleValue = null;
          
          if (serverData.profile) {
            profileData = serverData.profile;
            roleValue = profileData.role || user?.user_metadata?.role || 'user';
          } else if (serverData.user) {
            // Might have profile data embedded in user object
            profileData = serverData.user;
            roleValue = profileData.role || user?.user_metadata?.role || 'user';
          }
          
          if (profileData) {
            console.log('[Auth] Setting profile data from server');
            setUserData(profileData);
            
            // Check if the profile is complete based on role
            if (roleValue) {
              console.log(`[Auth] Checking profile completion for role: ${roleValue}`);
              const hasProfile = await checkUserProfile(user.id, roleValue);
              setHasCompletedProfile(hasProfile);
            }
          } else {
            console.log('[Auth] No profile data in server response');
          }
        } else {
          console.log('[Auth] Server did not return user data, falling back to Supabase');
          
          // Fall back to direct Supabase query
          try {
            // First try by auth_id
            const { data: profileData } = await supabase
              .from('users')
              .select('*')
              .eq('auth_id', user.id)
              .maybeSingle();
              
            if (cancelled) return;
              
            if (profileData) {
              console.log('[Auth] Found user profile by auth_id');
              setUserData(profileData);
              
              // Check if profile is complete
              if (profileData.role) {
                const hasProfile = await checkUserProfile(user.id, profileData.role);
                setHasCompletedProfile(hasProfile);
              }
            } else {
              // Try by email as fallback
              const { data: emailProfileData } = await supabase
                .from('users')
                .select('*')
                .eq('email', user.email)
                .maybeSingle();
                
              if (cancelled) return;
                
              if (emailProfileData) {
                console.log('[Auth] Found user profile by email');
                setUserData(emailProfileData);
                
                // Check if profile is complete
                if (emailProfileData.role) {
                  const hasProfile = await checkUserProfile(user.id, emailProfileData.role);
                  setHasCompletedProfile(hasProfile);
                }
              } else {
                console.log('[Auth] No user profile found');
              }
            }
          } catch (error) {
            if (cancelled) return;
            console.error('[Auth] Error fetching profile from Supabase:', error);
          }
        }
      } catch (error) {
        if (cancelled) return;
        console.error('[Auth] Error in profile fetch effect:', error);
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => { 
      cancelled = true; 
    };
  }, [user]);

  // Function to refresh the user's profile data
  const refreshProfile = async () => {
    if (!user) {
      console.log('[Auth] Cannot refresh profile: no user');
      return;
    }
    
    console.log('[Auth] Manually refreshing profile...');
    setLoadingProfile(true);
    
    try {
      // Get the latest user data from server
      const serverData = await getCurrentUser();
      
      if (serverData) {
        console.log('[Auth] Received refreshed user data from server');
        
        // Detect which response format we got
        let profileData = null;
        let roleValue = null;
        
        if (serverData.profile) {
          profileData = serverData.profile;
          roleValue = profileData.role || user?.user_metadata?.role || 'user';
        } else if (serverData.user) {
          // Might have profile data embedded in user object
          profileData = serverData.user;
          roleValue = profileData.role || user?.user_metadata?.role || 'user';
        }
        
        if (profileData) {
          console.log('[Auth] Updating profile data from server refresh');
          setUserData(profileData);
          
          // Check if the profile is complete based on role
          if (roleValue) {
            console.log(`[Auth] Checking profile completion for role: ${roleValue}`);
            const hasProfile = await checkUserProfile(user.id, roleValue);
            setHasCompletedProfile(hasProfile);
          }
        }
      } else {
        console.log('[Auth] Server did not return user data on refresh');
      }
    } catch (error) {
      console.error('[Auth] Error refreshing profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] Attempting sign in for:', email);
    
    try {
      // Use our updated login function that handles both direct and server auth
      const loginData = await loginUser({ email, password });
      
      // Our custom method might return different structure based on success path
      if (loginData.error) {
        console.error('[Auth] Login error:', loginData.error);
        toast({
          title: 'Login failed',
          description: loginData.error.message || loginData.error,
          variant: 'destructive',
        });
        return { error: loginData.error };
      }
      
      console.log('[Auth] Login successful');
      toast({
        title: 'Login successful',
        description: 'You have been logged in successfully.',
      });
      
      // Extract user data from different possible response formats
      let userData = null;
      
      if (loginData.user) {
        userData = loginData.user;
      } else if (loginData.session?.user) {
        userData = loginData.session.user;
      } else if (loginData.data?.user) {
        userData = loginData.data.user;
      }
      
      return { error: null, user: userData as EnhancedUser };
    } catch (e: any) {
      console.error('[Auth] Login error:', e);
      toast({
        title: 'Login failed',
        description: e.message,
        variant: 'destructive',
      });
      return { error: e };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('[Auth] Attempting sign up for:', email);
    
    try {
      // Use our registerUser function that handles both auth and profile creation
      const registrationData = await registerUser({
        email,
        password,
        fullName: userData.fullName || email.split('@')[0], // Fallback to email username if no name provided
        role: userData.role || 'athlete' // Default to athlete if no role provided
      });
      
      console.log('[Auth] Registration successful');
      toast({
        title: 'Registration successful',
        description: 'Your account has been created successfully.',
      });
      
      return { error: null, user: registrationData.user };
    } catch (e: any) {
      console.error('[Auth] Registration error:', e);
      toast({
        title: 'Registration failed',
        description: e.message,
        variant: 'destructive',
      });
      return { error: e, user: null };
    }
  };

  const signOut = async () => {
    console.log('[Auth] Signing out...');
    
    try {
      // Use our logoutUser function that notifies the server
      await logoutUser();
      
      console.log('[Auth] Sign out successful');
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
      
      // The auth state change event will handle redirecting
    } catch (error) {
      console.error('[Auth] Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
      
      // Still attempt to clean up local state
      setUser(null);
      setSession(null);
      setUserData(null);
      
      // Manually clear localStorage as a fallback
      if (typeof window !== 'undefined') {
        console.log('[Auth] Manual localStorage cleanup during fallback logout');
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
      
      navigate('/');
    }
  };

  // Show initialization loader while Supabase client is being set up
  if (isInitializing) {
    return <InitializationLoader />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        loadingProfile,
        userData,
        signIn,
        signUp,
        signOut,
        setUserData,
        hasCompletedProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}