import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { 
  supabase, 
  loginUser, 
  registerUser, 
  logoutUser, 
  getCurrentUser, 
  checkUserProfile
} from '@/lib/supabase-client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface EnhancedUser extends SupabaseUser {
  role?: string;
}

interface AuthContextType {
  user: EnhancedUser | null;
  session: any | null;
  isLoading: boolean;
  hasCompletedProfile: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any, user?: EnhancedUser }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any, user: any }>;
  signOut: () => Promise<void>;
  setUserData: (data: any) => void;
  userData: any;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [isSupabaseInitialized, setIsSupabaseInitialized] = useState(false);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Supabase is now initialized in main.tsx before the app renders
  useEffect(() => {
    // Mark as initialized since we know Supabase is already initialized
    setIsSupabaseInitialized(true);
  }, []);

  // Function to refresh the user's profile data
  const refreshProfile = async () => {
    if (!user || !user.id) return;
    
    try {
      setIsLoading(true);
      // Get the basic user information
      const userData = await getCurrentUser();
      
      if (!userData) return;
      
      // Set user session data
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setSession(data.session);
      }
      
      // Set user data based on what's available
      if (userData.auth) {
        setUser(userData.auth);
      } else if (userData.user) {
        setUser(userData.user);
      }
      
      // Set profile data if available
      if (userData.profile) {
        setUserData(userData.profile);
      }
      
      // Check if the user has completed their profile
      const userRole = userData.profile?.role || userData.user?.role || userData.auth?.role;
      if (userRole && user.id) {
        const hasProfile = await checkUserProfile(user.id, userRole);
        setHasCompletedProfile(hasProfile);
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial session check - only run after Supabase is initialized
  useEffect(() => {
    if (!isSupabaseInitialized || !supabase) return;
    
    const fetchSession = async () => {
      try {
        // Use our getCurrentUser function for a complete user profile
        const userData = await getCurrentUser();
        
        if (userData) {
          // If we get valid user data
          const { data } = await supabase.auth.getSession();
          
          if (data?.session) {
            setSession(data.session);
          }
          
          // Set up user data
          let currentUser = null;
          if (userData.auth) {
            currentUser = userData.auth;
            setUser(userData.auth);
          } else if (userData.user) {
            // Different response structure depending on which path succeeded
            currentUser = userData.user;
            setUser(userData.user);
          }
          
          if (userData.profile) {
            setUserData(userData.profile);
          }
          
          // Check if profile is complete
          if (currentUser && currentUser.id) {
            const userRole = userData.profile?.role || currentUser.role || 'visitor';
            console.log(`Checking profile completion for user ${currentUser.id} with role ${userRole}`);
            const hasProfile = await checkUserProfile(currentUser.id, userRole);
            console.log(`Profile completion check result: ${hasProfile}`);
            setHasCompletedProfile(hasProfile);
            
            // Store user info in localStorage for easier access
            localStorage.setItem('userId', currentUser.id);
            localStorage.setItem('userRole', userRole);
          }
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          try {
            // Fetch additional user data - use email as the key since auth_id doesn't exist
            const { data: profileData } = await supabase
              .from('users')
              .select('*')
              .eq('email', newSession.user.email)
              .single();
              
            if (profileData) {
              setUserData(profileData);
              
              // Redirect based on user type
              if (profileData?.role === 'athlete') {
                navigate('/athlete/dashboard');
              } else if (profileData?.role === 'business') {
                navigate('/business/dashboard');
              } else if (profileData?.role === 'compliance') {
                navigate('/compliance/dashboard');
              } else if (profileData?.role === 'admin') {
                navigate('/admin/dashboard');
              }
            }
          } catch (err) {
            console.error("Error fetching user profile:", err);
            // Don't redirect if we couldn't get profile data
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserData(null);
          navigate('/');
        }
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate, isSupabaseInitialized]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      toast({
        title: 'Connection Error',
        description: 'Supabase is not initialized. Please refresh the page and try again.',
        variant: 'destructive',
      });
      return { error: new Error('Supabase not initialized') };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        toast({
          title: 'Login failed',
          description: authError.message,
          variant: 'destructive',
        });
        return { error: authError };
      }

      toast({
        title: 'Login successful',
        description: 'You have been logged in successfully.',
      });

      return { error: null, user: authData.user as EnhancedUser };
    } catch (e: any) {
      toast({
        title: 'Login failed',
        description: e.message,
        variant: 'destructive',
      });
      return { error: e };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    if (!supabase) {
      toast({
        title: 'Connection Error',
        description: 'Supabase is not initialized. Please refresh the page and try again.',
        variant: 'destructive',
      });
      return { error: new Error('Supabase not initialized'), user: null };
    }

    try {
      // Use our registerUser function that handles both auth and profile creation
      const registrationData = await registerUser({
        email,
        password,
        fullName: userData.fullName || email.split('@')[0], // Fallback to email username if no name provided
        role: userData.role || 'athlete' // Default to athlete if no role provided
      });
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created successfully.',
      });
      
      return { error: null, user: registrationData.user };
    } catch (e: any) {
      toast({
        title: 'Registration failed',
        description: e.message,
        variant: 'destructive',
      });
      return { error: e, user: null };
    }
  };

  const signOut = async () => {
    if (!supabase) {
      toast({
        title: 'Connection Error',
        description: 'Supabase is not initialized. Please refresh the page and try again.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Use our logoutUser function that notifies the server
      await logoutUser();
      
      // Update UI state
      setUser(null);
      setSession(null);
      setUserData(null);
      
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        hasCompletedProfile,
        signIn,
        signUp,
        signOut,
        userData,
        setUserData,
        refreshProfile
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