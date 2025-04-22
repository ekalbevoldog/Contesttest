import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { supabase, initializeSupabase } from '@/lib/supabase-client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface AuthContextType {
  user: SupabaseUser | null;
  session: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any, user: any }>;
  signOut: () => Promise<void>;
  setUserData: (data: any) => void;
  userData: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [isSupabaseInitialized, setIsSupabaseInitialized] = useState(false);
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Supabase is now initialized in main.tsx before the app renders
  useEffect(() => {
    // Mark as initialized since we know Supabase is already initialized
    setIsSupabaseInitialized(true);
  }, []);

  // Initial session check - only run after Supabase is initialized
  useEffect(() => {
    if (!isSupabaseInitialized || !supabase) return;
    
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Fetch additional user data if needed
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', data.session.user.id)
            .single();
            
          if (profileData) {
            setUserData(profileData);
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
            // Fetch additional user data
            const { data: profileData } = await supabase
              .from('users')
              .select('*')
              .eq('auth_id', newSession.user.id)
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }
      
      toast({
        title: 'Login successful',
        description: 'You have been logged in successfully.',
      });
      
      return { error: null };
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        toast({
          title: 'Registration failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error, user: null };
      }
      
      toast({
        title: 'Registration successful',
        description: 'Your account has been created. Please check your email for verification.',
      });
      
      // For Supabase, we'd proceed to create a record in our users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            auth_id: data.user.id,
            email: data.user.email,
            role: userData.role,
            created_at: new Date()
          });
          
        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }
      
      return { error: null, user: data.user };
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
      await supabase.auth.signOut();
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
        signIn,
        signUp,
        signOut,
        userData,
        setUserData
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