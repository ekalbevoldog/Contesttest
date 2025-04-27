import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useLocation } from 'wouter';
import { useToast } from './use-toast';
import { User } from '@supabase/supabase-js';
import { clearAuthData } from '@/lib/simple-auth';

// Define user types
export type UserRole = 'athlete' | 'business' | 'compliance' | 'admin';

// Define the auth context type
interface AuthContextType {
  user: User | null;
  userData: any | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; user?: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any; user?: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (data.session) {
          // Session exists, set user
          setUser(data.session.user);

          // Fetch user profile
          await fetchUserProfile(data.session.user);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (session) {
          setUser(session.user);
          await fetchUserProfile(session.user);

          // Set auth status cookie for client-side detection
          document.cookie = "auth-status=authenticated; path=/; max-age=2592000; SameSite=Lax";
        } else {
          setUser(null);
          setUserData(null);

          // Clear auth status cookie
          document.cookie = "auth-status=; path=/; max-age=0";
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile from server
  const fetchUserProfile = async (user: User) => {
    try {
      if (!user) return;

      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.profile || data.user);
      } else {
        console.error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Refresh user profile
  const refreshProfile = async () => {
    if (!user) return;
    await fetchUserProfile(user);
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: 'Login failed',
          description: error.message,
          variant: 'destructive'
        });
        return { error };
      }

      // Update server-side session
      try {
        await fetch('/api/auth/refresh-session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.session?.access_token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
      } catch (refreshError) {
        console.warn('Error refreshing server session (non-critical):', refreshError);
      }

      toast({
        title: 'Login successful',
        description: 'You have been logged in successfully.'
      });

      return { user: data.user };
    } catch (error: any) {
      toast({
        title: 'Login error',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName || '',
            role: userData.role || 'athlete'
          }
        }
      });

      if (error) {
        toast({
          title: 'Registration failed',
          description: error.message,
          variant: 'destructive'
        });
        return { error };
      }

      toast({
        title: 'Registration successful',
        description: 'Your account has been created.'
      });

      return { user: data.user };
    } catch (error: any) {
      toast({
        title: 'Registration error',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);

      // First, perform server-side logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      // Then perform client-side logout
      await supabase.auth.signOut();

      // Clear any lingering auth data
      clearAuthData();

      // Clear user state
      setUser(null);
      setUserData(null);

      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.'
      });

      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);

      // Still clear user state
      setUser(null);
      setUserData(null);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}