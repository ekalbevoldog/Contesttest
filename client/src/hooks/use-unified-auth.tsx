import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Define types
interface User {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function UnifiedAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Check for auth status cookie
        const isAuthenticated = document.cookie.includes('auth-status=authenticated');
        
        if (!isAuthenticated) {
          // Check localStorage as fallback
          const storedAuthStatus = localStorage.getItem('auth-status');
          
          if (storedAuthStatus !== 'authenticated') {
            // No authentication found
            setUser(null);
            setSession(null);
            setIsLoading(false);
            return;
          }
        }
        
        // Try to get session from localStorage (fallback)
        const storedSession = localStorage.getItem('supabase-auth');
        let sessionData = null;
        
        if (storedSession) {
          try {
            sessionData = JSON.parse(storedSession);
          } catch (e) {
            console.error('Failed to parse stored session:', e);
          }
        }
        
        // Get current user info
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': sessionData?.access_token 
              ? `Bearer ${sessionData.access_token}` 
              : ''
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          
          // If we have session data, store it
          if (sessionData) {
            setSession({
              access_token: sessionData.access_token,
              refresh_token: sessionData.refresh_token,
              expires_at: sessionData.expires_at
            });
          }
        } else {
          // Token might be expired, try to refresh
          if (sessionData?.refresh_token) {
            const refreshed = await refreshTokenInternal(sessionData.refresh_token);
            if (!refreshed) {
              // Clear auth state if refresh fails
              setUser(null);
              setSession(null);
              localStorage.removeItem('auth-status');
              localStorage.removeItem('supabase-auth');
            }
          } else {
            // No refresh token available
            setUser(null);
            setSession(null);
            localStorage.removeItem('auth-status');
            localStorage.removeItem('supabase-auth');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);
  
  // Internal refresh token function
  const refreshTokenInternal = async (refreshToken: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      
      if (!data.success || !data.session) {
        return false;
      }
      
      // Update local state
      setSession(data.session);
      
      // Update localStorage
      localStorage.setItem('auth-status', 'authenticated');
      localStorage.setItem('supabase-auth', JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user_id: user?.id,
        timestamp: Date.now()
      }));
      
      // Fetch user data with new token
      const userResponse = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }
      
      return true;
    } catch (err) {
      console.error('Token refresh error:', err);
      return false;
    }
  };
  
  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        setError(data.error || 'Login failed');
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: data.error || 'Invalid email or password'
        });
        return false;
      }
      
      // Set auth data
      setUser(data.user);
      
      if (data.session) {
        setSession(data.session);
        
        // Store in localStorage as fallback
        localStorage.setItem('auth-status', 'authenticated');
        localStorage.setItem('supabase-auth', JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user_id: data.user?.id,
          timestamp: Date.now()
        }));
      }
      
      // Handle redirects if needed
      if (data.needsProfile && data.redirectTo) {
        navigate(data.redirectTo);
      } else if (data.user?.role === 'athlete') {
        navigate('/athlete/dashboard');
      } else if (data.user?.role === 'business') {
        navigate('/business/dashboard');
      } else if (data.user?.role === 'admin') {
        navigate('/admin/dashboard');
      }
      
      toast({
        title: 'Login Successful',
        description: 'Welcome back!'
      });
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'An unexpected error occurred'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        setError(result.error || 'Registration failed');
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: result.error || 'Please check your information and try again'
        });
        return false;
      }
      
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created'
      });
      
      // If registration creates a session, use it
      if (result.session) {
        setUser(result.user);
        setSession(result.session);
        
        // Store in localStorage as fallback
        localStorage.setItem('auth-status', 'authenticated');
        localStorage.setItem('supabase-auth', JSON.stringify({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
          expires_at: result.session.expires_at,
          user_id: result.user?.id,
          timestamp: Date.now()
        }));
      }
      
      // Handle redirects if needed
      if (result.needsProfile && result.redirectTo) {
        navigate(result.redirectTo);
      }
      
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: 'An unexpected error occurred'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
      
      // Clear auth state
      setUser(null);
      setSession(null);
      
      // Clear localStorage
      localStorage.removeItem('auth-status');
      localStorage.removeItem('supabase-auth');
      
      navigate('/');
      
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out'
      });
    } catch (err) {
      console.error('Logout error:', err);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred during logout'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Public refresh token function
  const refreshToken = async (): Promise<boolean> => {
    if (!session?.refresh_token) {
      return false;
    }
    
    return refreshTokenInternal(session.refresh_token);
  };
  
  // Context value
  const contextValue: AuthContextType = {
    user,
    session,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth context
export function useUnifiedAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within an UnifiedAuthProvider');
  }
  
  return context;
}