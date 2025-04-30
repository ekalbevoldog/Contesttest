import { createContext, ReactNode, useContext, useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  loginWithEmail, 
  registerWithEmail, 
  logout as logoutUser, 
  getCurrentUser 
} from "@/lib/auth-utils";
import { useLocation } from "wouter";

interface User {
  id: string;
  email: string;
  role: "athlete" | "business" | "compliance" | "admin";
  [key: string]: any;
}

interface Profile {
  id: string | number;
  name: string;
  email?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: "athlete" | "business" | "compliance" | "admin";
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Check for any existing data to provide immediate UI feedback
  useEffect(() => {
    try {
      // Check local storage for any cached user data to show immediately
      const cachedUserData = localStorage.getItem('contestedUserData');
      if (cachedUserData) {
        const parsedData = JSON.parse(cachedUserData);
        if (parsedData && parsedData.id) {
          console.log('[Auth Provider] Found cached user data, using as initial state');
          // This temporary data will be overwritten by the query results
          setProfile(parsedData);
        }
      }
    } catch (error) {
      console.error('[Auth Provider] Error reading cached user data:', error);
    }
  }, []);

  const {
    data: userData,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      console.log('[Auth Provider] Fetching current user data');
      try {
        const data = await getCurrentUser();
        console.log('[Auth Provider] User data result:', data ? 'User found' : 'No user data');
        return data;
      } catch (err) {
        console.error("[Auth Provider] Error fetching user:", err);
        return null;
      }
    },
    retry: 1,
    retryDelay: 1000,
    // We want to refresh data when the component mounts to ensure we have the latest
    refetchOnMount: true,
    // Refresh when window gains focus to keep session state updated
    refetchOnWindowFocus: true,
    // Don't refetch on reconnect to avoid unnecessary requests
    refetchOnReconnect: false,
    // Handle stale time to prevent too frequent refetches
    staleTime: 60 * 1000, // 1 minute
  });

  useEffect(() => {
    console.log('[Auth Provider] User data changed:', userData ? 'Data available' : 'No data');

    if (userData) {
      // Extract auth and profile data, handle different response formats
      let authUser, profileData;

      // Handle different response structures from API
      if (userData.auth) {
        // New response format with separate auth and profile
        authUser = userData.auth;
        profileData = userData.profile;
      } else if (userData.user) {
        // Alternative format with user object
        authUser = userData.user;
        profileData = userData.profile || userData.user_profile || userData.profile_data;
      } else if (userData.id && userData.email) {
        // User data directly in response
        authUser = userData;
        profileData = userData.profile_data || null;
      }

      if (authUser) {
        console.log('[Auth Provider] Setting user data from auth user');

        // Extract role from metadata or direct property
        const role = authUser.user_metadata?.role || 
                    authUser.role || 
                    authUser.user_type || 
                    'user';

        setUser({
          id: authUser.id,
          email: authUser.email || '',
          role: role,
          ...authUser.user_metadata
        });

        if (profileData) {
          console.log('[Auth Provider] Setting profile data');
          setProfile(profileData);

          // Store user ID in localStorage for quick access
          localStorage.setItem('userId', authUser.id);

          // Store basic profile info in localStorage
          localStorage.setItem('contestedUserData', JSON.stringify({
            id: profileData.id,
            name: profileData.name || profileData.fullName || authUser.name || '',
            userType: role,
            ...profileData
          }));
        } else {
          console.log('[Auth Provider] No profile data available');
          // Store minimal user data even without a profile
          localStorage.setItem('userId', authUser.id);
          localStorage.setItem('contestedUserData', JSON.stringify({
            id: authUser.id,
            email: authUser.email,
            userType: role
          }));
        }
      }
    } else {
      console.log('[Auth Provider] No user data, clearing state');
      // Clear localStorage if no user data
      setUser(null);
      setProfile(null);
    }
  }, [userData]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('[Auth Provider] Login mutation: Attempting login');
      const data = await loginWithEmail(credentials.email, credentials.password);
      console.log('[Auth Provider] Login mutation: Login successful');
      return data;
    },
    onSuccess: (data) => {
      console.log('[Auth Provider] Login mutation: Processing successful login');
      // Extract relevant data, handling different response formats
      let userData = null;
      let profileData = null;
      let roleValue = null;

      // Handle different response structures from the API
      if (data.user) {
        userData = data.user;
        profileData = data.profile;
        // Role could be in different places depending on response format
        roleValue = userData.user_metadata?.role || 
                   userData.role || 
                   userData.user_metadata?.user_type || 
                   profileData?.role || 
                   'user';
      } else if (data.auth) {
        // Alternative format
        userData = data.auth;
        profileData = data.profile;
        roleValue = userData.user_metadata?.role || 
                   userData.role || 
                   profileData?.role || 
                   'user';
      } else if (data.session && data.data?.user) {
        // Direct Supabase response format
        userData = data.data.user;
        profileData = data.profile || data.server?.profile;
        roleValue = userData.user_metadata?.role || 
                   userData.role || 
                   profileData?.role || 
                   'user';
      }

      console.log('[Auth Provider] Login mutation: User role identified as', roleValue);

      if (userData) {
        // Set user data
        setUser({
          id: userData.id,
          email: userData.email || '',
          role: roleValue,
          ...userData.user_metadata
        });

        // If we have profile data, set it
        if (profileData) {
          console.log('[Auth Provider] Login mutation: Setting profile data');
          setProfile(profileData);

          // Store user ID in localStorage
          localStorage.setItem('userId', userData.id);

          // Store profile data in localStorage
          localStorage.setItem('contestedUserData', JSON.stringify({
            id: profileData.id,
            name: profileData.name || profileData.fullName || userData.name || '',
            userType: roleValue,
            ...profileData
          }));
        } else {
          // Store minimal user data even without a profile
          console.log('[Auth Provider] Login mutation: No profile data, storing minimal user data');
          localStorage.setItem('userId', userData.id);
          localStorage.setItem('contestedUserData', JSON.stringify({
            id: userData.id,
            email: userData.email,
            userType: roleValue
          }));
        }
      }

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });

      // Redirect based on user role - handle custom redirect if present in response
      if (data.redirectTo) {
        console.log('[Auth Provider] Login mutation: Using custom redirect path:', data.redirectTo);
        setLocation(data.redirectTo);
      } else {
        console.log('[Auth Provider] Login mutation: Using role-based redirect for role:', roleValue);
        // Standard role-based redirects
        if (roleValue === 'athlete') {
          setLocation('/athlete/dashboard');
        } else if (roleValue === 'business') {
          setLocation('/business/dashboard');
        } else if (roleValue === 'compliance') {
          setLocation('/compliance/dashboard');
        } else if (roleValue === 'admin') {
          setLocation('/admin/dashboard');
        } else {
          setLocation('/');
        }
      }

      // Dispatch custom login event
      const loginEvent = new CustomEvent("contestedLogin", { 
        detail: { 
          id: userData?.id,
          email: userData?.email, 
          role: roleValue
        } 
      });
      window.dispatchEvent(loginEvent);
    },
    onError: (error: Error) => {
      console.error('[Auth Provider] Login mutation: Error during login:', error);
      toast({
        title: "Login failed",
        description: error.message || "Unable to log in. Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      console.log('[Auth Provider] Register mutation: Attempting registration');
      const data = await registerWithEmail(
        credentials.email, 
        credentials.password, 
        credentials.fullName, 
        credentials.role
      );
      console.log('[Auth Provider] Register mutation: Registration successful');
      return data;
    },
    onSuccess: (data) => {
      console.log('[Auth Provider] Register mutation: Processing successful registration');

      // Extract relevant data, handling different response formats
      let userData = null;
      let profileData = null;
      let roleValue = null;

      // Handle different response structures from the API
      if (data.user) {
        userData = data.user;
        profileData = data.profile;
        // Role could be in different places depending on response format
        roleValue = userData.user_metadata?.role || 
                   userData.role || 
                   'user';
      } else if (data.auth) {
        // Alternative format
        userData = data.auth;
        profileData = data.profile;
        roleValue = userData.user_metadata?.role || 
                   userData.role || 
                   'user';
      } else if (data.session && data.data?.user) {
        // Direct Supabase response format
        userData = data.data.user;
        profileData = data.profile || data.serverData?.profile;
        roleValue = userData.user_metadata?.role || 
                   userData.role || 
                   profileData?.role || 
                   'user';
      }

      if (userData) {
        console.log('[Auth Provider] Register mutation: Setting user with role', roleValue);
        setUser({
          id: userData.id,
          email: userData.email || '',
          role: roleValue,
          ...userData.user_metadata
        });

        // Store the user ID for profile creation
        localStorage.setItem('userId', userData.id);

        // If a profile was created during registration
        if (profileData) {
          console.log('[Auth Provider] Register mutation: Setting profile data');
          setProfile(profileData);
          localStorage.setItem('contestedUserData', JSON.stringify({
            id: profileData.id,
            name: profileData.name || profileData.fullName || userData.fullName || '',
            userType: roleValue,
            ...profileData
          }));
        } else {
          // Store minimal user data even without a profile
          console.log('[Auth Provider] Register mutation: No profile data, storing minimal user data');
          localStorage.setItem('contestedUserData', JSON.stringify({
            id: userData.id,
            email: userData.email,
            userType: roleValue
          }));
        }
      }

      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

      toast({
        title: "Registration successful",
        description: "Welcome to Contested!",
      });

      // Dispatch custom registration event
      const registrationEvent = new CustomEvent("contestedRegistration", { 
        detail: { 
          id: userData?.id,
          email: userData?.email, 
          role: roleValue
        } 
      });
      window.dispatchEvent(registrationEvent);

      // Redirect to onboarding or dashboard based on response
      if (data.redirectTo) {
        console.log('[Auth Provider] Register mutation: Using custom redirect path:', data.redirectTo);
        setLocation(data.redirectTo);
      } else if (data.needsProfile) {
        console.log('[Auth Provider] Register mutation: User needs profile, redirecting to onboarding');
        setLocation('/onboarding');
      } else {
        console.log('[Auth Provider] Register mutation: Using role-based redirect for role:', roleValue);
        // Redirect based on user role
        if (roleValue === 'athlete') {
          setLocation('/athlete/dashboard');
        } else if (roleValue === 'business') {
          setLocation('/business/dashboard');
        } else if (roleValue === 'compliance') {
          setLocation('/compliance/dashboard');
        } else if (roleValue === 'admin') {
          setLocation('/admin/dashboard');
        } else {
          setLocation('/');
        }
      }
    },
    onError: (error: Error) => {
      console.error('[Auth Provider] Register mutation: Error during registration:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Unable to register. Please try again with a different email.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logoutUser();
    },
    onSuccess: () => {
      // Clear user state
      setUser(null);
      setProfile(null);

      // Clear localStorage completely
      if (typeof window !== 'undefined') {
        localStorage.removeItem('contestedUserData');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('contested-auth');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-auth-token');
      }

      // Clear query cache
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries();

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });

      // Dispatch custom logout event
      const logoutEvent = new CustomEvent("contestedLogout");
      window.dispatchEvent(logoutEvent);

      // Redirect to home
      setLocation('/');
    },
    onError: (error: Error) => {
      console.error("Logout error:", error);

      // Even if logout fails, clear state locally
      setUser(null);
      setProfile(null);

      // Clear localStorage completely
      if (typeof window !== 'undefined') {
        localStorage.removeItem('contestedUserData');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('contested-auth');
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-auth-token');
      }
      queryClient.setQueryData(["/api/auth/user"], null);

      toast({
        title: "Logged out",
        description: "Your session has been cleared locally.",
      });

      setLocation('/');
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  // Extract user type from user data with a reliable priority order
  const userType = useMemo(() => {
    if (!context.user) return null;
    
    // Priority order for determining user type:
    // 1. Explicit userType property
    // 2. role property 
    // 3. user_metadata.role
    return context.user.userType || 
           context.user.role || 
           (context.user.user_metadata && context.user.user_metadata.role) || 
           null;
  }, [context.user]);

  // Add a convenience method for logout
  const logout = () => {
    if (context.logoutMutation) {
      context.logoutMutation.mutate();
    }
  };

  // Enhanced profile check that works more reliably
  const hasProfile = useMemo(() => {
    // If no user or profile explicitly set to null, definitely no profile
    if (!context.user || context.profile === null) return false;
    
    // If profile exists in the context, user has a profile
    if (context.profile) return true;
    
    // For business users, check if they have business profile fields
    if (userType === 'business' && context.user.businessProfile) return true;
    
    // For athlete users, check if they have athlete profile fields
    if (userType === 'athlete' && context.user.athleteProfile) return true;
    
    // Default assumption based on roles that don't require profiles
    if (userType === 'admin' || userType === 'compliance') return true;
    
    // No profile detected through any means
    return false;
  }, [context.user, context.profile, userType]);

  return {
    ...context,
    logout,
    userType,
    hasProfile
  };
}