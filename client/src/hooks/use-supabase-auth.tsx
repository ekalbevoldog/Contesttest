import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
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
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Initial session check
  useEffect(() => {
    const fetchSession = async () => {
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
      setIsLoading(false);
    };

    fetchSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Fetch additional user data
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', newSession.user.id)
            .single();
            
          if (profileData) {
            setUserData(profileData);
          }
          
          // Redirect based on user type
          if (profileData?.user_type === 'athlete') {
            navigate('/athlete/dashboard');
          } else if (profileData?.user_type === 'business') {
            navigate('/business/dashboard');
          } else if (profileData?.user_type === 'compliance') {
            navigate('/compliance/dashboard');
          } else if (profileData?.user_type === 'admin') {
            navigate('/admin/dashboard');
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
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
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
            user_type: userData.user_type,
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserData(null);
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
    navigate('/');
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