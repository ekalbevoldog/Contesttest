/**
 * Unified Authentication Provider
 * 
 * This component provides a consolidated authentication approach:
 * - Uses Supabase Auth as the primary authentication mechanism
 * - Falls back to simple-auth only when necessary
 * - Manages session state consistently across the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as authService from '@/lib/auth-service';
import { EnhancedUser } from '@/lib/auth-service';

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
  refreshAuthSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const { toast } = useToast();

  // Function to fetch the user's profile data
  const fetchUserProfile = async (userId: string, role: string | null) => {
    if (!userId) return null;
    
    setLoadingProfile(true);
    try {
      // Determine the endpoint based on the user's role
      let endpoint = `/api/users/${userId}`;
      
      if (role === 'athlete') {
        endpoint = `/api/athletes/${userId}`;
      } else if (role === 'business') {
        endpoint = `/api/businesses/${userId}`;
      } else if (role === 'compliance') {
        endpoint = `/api/compliance-officers/${userId}`;
      } else if (role === 'admin') {
        endpoint = `/api/admins/${userId}`;
      }

      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      console.error(`[Auth] Failed to fetch user profile from ${endpoint}:`, response.status);
      return null;
    } catch (error) {
      console.error('[Auth] Error fetching user profile:', error);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  };
  
  // Initialize auth state
  useEffect(() => {
    async function setupAuth() {
      setIsLoading(true);
      try {
        // Check if the user is authenticated
        const isAuthed = await authService.isAuthenticated();
        
        if (isAuthed) {
          // Get the current user data
          const currentUser = await authService.getCurrentUser();
          
          if (currentUser) {
            setUser(currentUser);
            
            // Try to get profile data
            const profileData = await fetchUserProfile(
              currentUser.id,
              currentUser.role || null
            );
            
            if (profileData) {
              setUserData(profileData);
              setHasCompletedProfile(profileData.profile_completed || false);
            }
          }
        }
      } catch (error) {
        console.error('[Auth] Error setting up auth:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    setupAuth();
  }, []);

  // Set up session refresh interval
  useEffect(() => {
    // Function to refresh the session
    const refreshSession = async () => {
      try {
        if (user) {
          await authService.refreshSession();
        }
      } catch (error) {
        console.error('[Auth] Error refreshing session:', error);
      }
    };
    
    // Set up interval to refresh session (default: every 10 minutes)
    const intervalId = setInterval(refreshSession, 10 * 60 * 1000);
    
    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [user]);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await authService.login(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        setSession(result.session);
        
        // Try to get profile data
        const profileData = await fetchUserProfile(
          result.user.id,
          result.user.role || null
        );
        
        if (profileData) {
          setUserData(profileData);
          setHasCompletedProfile(profileData.profile_completed || false);
        }
        
        return { error: null, user: result.user };
      } else {
        toast({
          title: "Login failed",
          description: result.error || "Invalid email or password. Please try again.",
          variant: "destructive",
        });
        
        return { error: result.error || "Login failed" };
      }
    } catch (error) {
      console.error('[Auth] Sign in error:', error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      
      return { error: error instanceof Error ? error.message : "Login failed" };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userInfo: any) => {
    try {
      setIsLoading(true);
      const result = await authService.register({
        email,
        password,
        fullName: userInfo.fullName,
        role: userInfo.role,
        ...userInfo
      });
      
      if (result.success && result.user) {
        setUser(result.user);
        setSession(result.session);
        
        toast({
          title: "Registration successful",
          description: "Your account has been created.",
        });
        
        return { error: null, user: result.user };
      } else {
        toast({
          title: "Registration failed",
          description: result.error || "Could not create account. Please try again.",
          variant: "destructive",
        });
        
        return { error: result.error || "Registration failed", user: null };
      }
    } catch (error) {
      console.error('[Auth] Sign up error:', error);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      
      return { error: error instanceof Error ? error.message : "Registration failed", user: null };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      
      // Clear state
      setUser(null);
      setSession(null);
      setUserData(null);
      setHasCompletedProfile(false);
      
      // Show toast if user was logged in
      if (user) {
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
      }
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh user profile
  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const profileData = await fetchUserProfile(
        user.id,
        user.role || null
      );
      
      if (profileData) {
        setUserData(profileData);
        setHasCompletedProfile(profileData.profile_completed || false);
      }
    } catch (error) {
      console.error('[Auth] Error refreshing profile:', error);
    }
  };

  // Function to manually refresh auth session
  const refreshAuthSession = async () => {
    try {
      await authService.refreshSession();
    } catch (error) {
      console.error('[Auth] Error refreshing auth session:', error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    loadingProfile,
    userData,
    hasCompletedProfile,
    signIn,
    signUp,
    signOut,
    setUserData,
    refreshProfile,
    refreshAuthSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}