import { createContext, ReactNode, useContext, useState, useEffect } from "react";
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
  
  const {
    data: userData,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const data = await getCurrentUser();
        return data;
      } catch (err) {
        console.error("Error fetching user:", err);
        return null;
      }
    },
    retry: false,
  });

  useEffect(() => {
    if (userData) {
      // Extract auth and profile data
      const authUser = userData.auth;
      const profileData = userData.profile;

      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          role: authUser.user_metadata?.role || 'user',
          ...authUser.user_metadata
        });

        if (profileData) {
          setProfile(profileData);
          
          // Store profile ID in localStorage for quick access
          localStorage.setItem('userId', authUser.id);
          
          // Store basic profile info in localStorage
          localStorage.setItem('contestedUserData', JSON.stringify({
            id: profileData.id,
            name: profileData.name,
            userType: authUser.user_metadata?.role || 'user',
            ...profileData
          }));
        }
      }
    } else {
      // Clear localStorage if no user data
      setUser(null);
      setProfile(null);
    }
  }, [userData]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const data = await loginWithEmail(credentials.email, credentials.password);
      return data;
    },
    onSuccess: (data) => {
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: data.user.user_metadata?.role || 'user',
          ...data.user.user_metadata
        });
        
        if (data.profile) {
          setProfile(data.profile);
          
          // Store user ID in localStorage
          localStorage.setItem('userId', data.user.id);
          
          // Store profile data in localStorage
          localStorage.setItem('contestedUserData', JSON.stringify({
            id: data.profile.id,
            name: data.profile.name,
            userType: data.user.user_metadata?.role || 'user',
            ...data.profile
          }));
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Login successful",
        description: `Welcome back!`,
      });
      
      // Redirect based on user role
      const role = data.user?.user_metadata?.role || data.profile?.role;
      if (role === 'athlete') {
        setLocation('/athlete/dashboard');
      } else if (role === 'business') {
        setLocation('/business/dashboard');
      } else if (role === 'compliance') {
        setLocation('/compliance/dashboard');
      } else if (role === 'admin') {
        setLocation('/admin/dashboard');
      } else {
        setLocation('/');
      }
      
      // Dispatch custom login event
      const loginEvent = new CustomEvent("contestedLogin", { 
        detail: { 
          id: data.user?.id,
          email: data.user?.email, 
          role: data.user?.user_metadata?.role || 'user'
        } 
      });
      window.dispatchEvent(loginEvent);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const data = await registerWithEmail(
        credentials.email, 
        credentials.password, 
        credentials.fullName, 
        credentials.role
      );
      return data;
    },
    onSuccess: (data) => {
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: data.user.role,
          ...data.user
        });
        
        // Store the user ID for profile creation
        localStorage.setItem('userId', data.user.id);
        
        // If a profile was created during registration
        if (data.profile) {
          setProfile(data.profile);
          localStorage.setItem('contestedUserData', JSON.stringify({
            id: data.profile.id,
            name: data.profile.name || data.user.fullName,
            userType: data.user.role,
            ...data.profile
          }));
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Registration successful",
        description: "Welcome to Contested!",
      });
      
      // Dispatch custom registration event
      const registrationEvent = new CustomEvent("contestedRegistration", { 
        detail: { 
          id: data.user?.id,
          email: data.user?.email, 
          role: data.user?.role
        } 
      });
      window.dispatchEvent(registrationEvent);
      
      // Redirect to onboarding or dashboard based on response
      if (data.redirectTo) {
        setLocation(data.redirectTo);
      } else if (data.needsProfile) {
        setLocation('/onboarding');
      } else {
        // Redirect based on user role
        const role = data.user?.role;
        if (role === 'athlete') {
          setLocation('/athlete/dashboard');
        } else if (role === 'business') {
          setLocation('/business/dashboard');
        } else {
          setLocation('/');
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
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
      
      // Clear localStorage
      localStorage.removeItem('contestedUserData');
      localStorage.removeItem('userId');
      
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
      localStorage.removeItem('contestedUserData');
      localStorage.removeItem('userId');
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
  
  // Add a convenience method for logout
  const logout = () => {
    if (context.logoutMutation) {
      context.logoutMutation.mutate();
    }
  };
  
  return {
    ...context,
    logout,
  };
}