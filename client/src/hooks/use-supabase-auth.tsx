import { createContext, ReactNode, useContext, useState, useEffect, useCallback } from 'react';
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
import { storeAuthData, isAuthenticated, getStoredAuthData, clearAuthData } from '@/lib/simple-auth';
import { persistSession, recoverSession, clearSessionData } from '@/lib/session-persistence';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

interface EnhancedUser extends SupabaseUser {
  role?: string;
  userType?: string;  // Added userType property to match the API response
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
  refreshSession: () => Promise<void>; // Add the refreshSession function
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

  // Define signOut function with useCallback to avoid dependency issues
  const signOut = useCallback(async () => {
    console.log('[Auth] Signing out...');

    try {
      // Reset state first to prevent any UI issues during logout
      setUser(null);
      setSession(null);
      setUserData(null);
      setHasCompletedProfile(false);

      // Clear simple auth data first
      console.log('[Auth] Clearing simple auth data');
      clearAuthData();

      // Clear session data with our improved utility
      clearSessionData();
      console.log('[Auth] Cleared session data with session-persistence utility');

      // Use our enhanced logout helper that handles both server and direct logout
      await logoutUser();
      console.log('[Auth] Signed out successfully');

      // Use setTimeout to ensure cleanup completes before navigation
      setTimeout(() => {
        // Use the router navigation to maintain SPA experience
        navigate('/');
      }, 150);

      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error) {
      console.error('[Auth] Error during sign out:', error);

      // Even if there's an error, try to clear local data and state
      try {
        // Reset React state
        setUser(null);
        setSession(null);
        setUserData(null);
        setHasCompletedProfile(false);

        // Try to clear session data
        clearAuthData();
        clearSessionData();

        // Try direct Supabase signout
        supabase.auth.signOut({ scope: 'global' });

        // Clear auth cookies manually
        document.cookie.split(';').forEach(cookie => {
          const name = cookie.trim().split('=')[0];
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        });

        // Clear localStorage items
        localStorage.removeItem('contestedUserData');
        localStorage.removeItem('auth-status');
        localStorage.removeItem('supabase-auth');

        // Force hard reload to home page
        window.location.href = '/';
      } catch (fallbackError) {
        console.error('[Auth] Error in signout fallback:', fallbackError);
        // Last resort - hard redirect
        window.location.href = '/';
      }
    }
  }, [navigate, setUserData, toast]);

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

  // Function to refresh the session with the server
  const refreshSession = useCallback(async () => {
    try {
      console.log('[Auth] Refreshing session');
      
      // First try to get current session through Supabase
      const { data, error } = await supabase.auth.getSession();
      let currentSession = data?.session;
      let accessToken = currentSession?.access_token;
      let refreshToken = currentSession?.refresh_token;
      
      // If no session in Supabase, try to recover from storage
      if (error || !currentSession) {
        console.log('[Auth] No active Supabase session, attempting recovery');
        
        // Try to recover session from localStorage
        const recoveryResult = await recoverSession();
        
        if (recoveryResult) {
          console.log('[Auth] Successfully recovered session from storage');
          
          // Get the recovered session
          const { data: recoveredData } = await supabase.auth.getSession();
          if (recoveredData?.session) {
            currentSession = recoveredData.session;
            accessToken = currentSession.access_token;
            refreshToken = currentSession.refresh_token;
            console.log('[Auth] Using recovered session for refresh');
          }
        } else {
          // If still no session, try to get tokens from localStorage
          const storedSessionStr = localStorage.getItem('supabase-auth');
          if (storedSessionStr) {
            try {
              const storedSession = JSON.parse(storedSessionStr);
              if (storedSession.access_token) {
                accessToken = storedSession.access_token;
                refreshToken = storedSession.refresh_token;
                console.log('[Auth] Using stored tokens for refresh');
              }
            } catch (parseError) {
              console.error('[Auth] Error parsing stored session:', parseError);
            }
          }
          
          // Check for contested-auth as well (backup storage)
          if (!accessToken) {
            const contestedAuthStr = localStorage.getItem('contested-auth');
            if (contestedAuthStr) {
              try {
                const contestedAuth = JSON.parse(contestedAuthStr);
                if (contestedAuth.session?.access_token) {
                  accessToken = contestedAuth.session.access_token;
                  refreshToken = contestedAuth.session.refresh_token;
                  console.log('[Auth] Using contested-auth tokens for refresh');
                }
              } catch (parseError) {
                console.error('[Auth] Error parsing contested-auth:', parseError);
              }
            }
          }
        }
      }
      
      // If we don't have an access token after all attempts, we can't refresh
      if (!accessToken) {
        console.log('[Auth] No access token available for refresh, recovery failed');
        return;
      }
      
      // Call server refresh endpoint with our token
      console.log('[Auth] Calling server refresh endpoint');
      let refreshSuccessful = false;
      let userData = null;
      
      try {
        // First try with authorization header (modern approach)
        const response = await fetch('/api/auth/refresh-session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Important: send cookies along
        });
        
        if (response.ok) {
          console.log('[Auth] Session successfully refreshed with server (header method)');
          const refreshData = await response.json();
          
          // If we got updated session data back, use it
          if (refreshData.session?.access_token) {
            currentSession = refreshData.session;
            accessToken = currentSession.access_token;
            refreshToken = currentSession.refresh_token;
            
            // Update session in Supabase client
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            // Update user data if included
            if (refreshData.user) {
              userData = refreshData.user;
            }
            
            refreshSuccessful = true;
          }
        } else {
          console.log('[Auth] Authorization header refresh failed, trying with refresh token in body');
          
          // If header approach fails, try with refresh token in body
          if (refreshToken) {
            const refreshResponse = await fetch('/api/auth/refresh-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                refreshToken: refreshToken,
                useCookies: true
              }),
              credentials: 'include'
            });
            
            if (refreshResponse.ok) {
              console.log('[Auth] Refresh token approach succeeded');
              const refreshData = await refreshResponse.json();
              
              // Update session in Supabase client if we got a new one
              if (refreshData.session?.access_token) {
                currentSession = refreshData.session;
                accessToken = currentSession.access_token;
                refreshToken = currentSession.refresh_token;
                
                // Update session in Supabase client
                await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken
                });
                
                // Update user data if included
                if (refreshData.user) {
                  userData = refreshData.user;
                }
                
                refreshSuccessful = true;
              }
            } else {
              console.error('[Auth] Both refresh approaches failed');
            }
          }
        }
      } catch (fetchError) {
        console.error('[Auth] Error calling refresh endpoint:', fetchError);
      }
      
      // If we haven't got user data yet but refresh was successful, fetch it
      if (refreshSuccessful && !userData && accessToken) {
        try {
          const userResponse = await fetch('/api/auth/user', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (userResponse.ok) {
            const userResult = await userResponse.json();
            if (userResult.user) {
              userData = userResult.user;
            }
          }
        } catch (userError) {
          console.error('[Auth] Error fetching user after refresh:', userError);
        }
      }
      
      // Final step: update state and persistence
      if (refreshSuccessful) {
        // Update state
        setSession(currentSession);
        if (userData) {
          setUser(userData);
        }
        
        // Persist the refreshed session
        persistSession(currentSession, userData || user);
        console.log('[Auth] Session refresh completed and persisted');
      } else if (currentSession) {
        // Even if server refresh failed, persist what we have to prevent future auth failures
        persistSession(currentSession, user);
        console.log('[Auth] Used persistent storage utility for fallback');
      }
    } catch (error) {
      console.error('[Auth] Error during session refresh:', error);
      
      // Try to recover session from localStorage as a last resort
      try {
        const recoveryResult = await recoverSession();
        if (recoveryResult) {
          console.log('[Auth] Successfully recovered session after error');
        }
      } catch (recoveryError) {
        console.error('[Auth] Recovery attempt failed:', recoveryError);
      }
    }
  }, [session, user, setSession, setUser]);

  // Enhanced session refresh mechanism that also handles session recovery
  useEffect(() => {
    if (!isInitializing) {
      // Attempt to recover session initially if no active session
      if (!session && !user) {
        const attemptRecovery = async () => {
          try {
            const recovered = await recoverSession();
            if (recovered) {
              // Force refresh user data after recovery
              const userData = await getCurrentUser();
              if (userData?.user) {
                setUser(userData.user);
              }
              if (userData?.session) {
                setSession(userData.session);
              }
            }
          } catch (error) {
            // Silent recovery failure is acceptable
          }
        };

        attemptRecovery();
      }

      // Set up regular refresh interval when we have a session
      let refreshTimer: number | null = null;

      if (session && user) {
        // Calculate when to refresh - either at regular intervals or before expiry
        const calculateNextRefresh = () => {
          const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
          const REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // 5 minutes before expiry

          let timeUntilNextRefresh = REFRESH_INTERVAL;

          // If session has expiry info, ensure we refresh before it expires
          if (session.expires_at) {
            const expiryTime = session.expires_at * 1000; // Convert to milliseconds
            const timeUntilExpiry = expiryTime - Date.now();

            // If expiring soon, refresh earlier
            if (timeUntilExpiry < REFRESH_INTERVAL) {
              timeUntilNextRefresh = Math.max(timeUntilExpiry - REFRESH_BEFORE_EXPIRY, 10000);
            }
          }

          return timeUntilNextRefresh;
        };

        const scheduleNextRefresh = () => {
          const nextRefreshTime = calculateNextRefresh();
          refreshTimer = window.setTimeout(async () => {
            await refreshSession();
            scheduleNextRefresh(); // Schedule next refresh after current one completes
          }, nextRefreshTime);
        };

        // Start the refresh cycle
        scheduleNextRefresh();
      }

      return () => {
        if (refreshTimer !== null) {
          clearTimeout(refreshTimer);
        }
      };
    }
  }, [isInitializing, session, user, refreshSession]);

  // 1) Once Supabase is initialized, rehydrate session & user
  useEffect(() => {
    if (isInitializing) {
      return; // Wait until Supabase is initialized
    }

    console.log('[Auth] Initializing auth state...');

    // Properly handle potential errors with supabase.auth.getSession
    const getSessionAndUser = async () => {
      try {
        // Check both cookie and localStorage for auth status
        const hasAuthStatusCookie = document.cookie
          .split('; ')
          .some(cookie => cookie.startsWith('auth-status=authenticated'));

        const hasLocalAuthStatus = localStorage.getItem('auth-status') === 'authenticated';

        console.log('[Auth] Auth status - Cookie:', hasAuthStatusCookie, 'LocalStorage:', hasLocalAuthStatus);

        // If either is true, consider the user logged in
        if (hasAuthStatusCookie || hasLocalAuthStatus) {
          console.log('[Auth] Found auth indicator, user is logged in');

          // The auth status is set which means our auth is valid
          // We'll check with the server to get the full user data
          try {
            console.log('[Auth] Attempting to get user data from server');
            const userData = await getCurrentUser();

            if (userData && (userData.auth || userData.user)) {
              console.log('[Auth] Successfully retrieved user data from server');

              if (userData.auth) {
                setUser(userData.auth);
              } else if (userData.user) {
                setUser(userData.user);
              }

              if (userData.session) {
                setSession(userData.session);

                // Store session in localStorage as fallback
                if (typeof window !== 'undefined' && userData.session.access_token) {
                  localStorage.setItem('auth-status', 'authenticated');
                  localStorage.setItem('supabase-auth', JSON.stringify({
                    access_token: userData.session.access_token,
                    refresh_token: userData.session.refresh_token,
                    expires_at: userData.session.expires_at,
                    user_id: userData.auth?.id || userData.user?.id,
                    timestamp: Date.now()
                  }));
                  console.log('[Auth] Updated localStorage with session data');
                }

                // Set the session in Supabase client
                if (userData.session.access_token && userData.session.refresh_token) {
                  try {
                    await supabase.auth.setSession({
                      access_token: userData.session.access_token,
                      refresh_token: userData.session.refresh_token
                    });
                    console.log('[Auth] Set session in Supabase client');
                  } catch (setSessionError) {
                    console.error('[Auth] Error setting session in Supabase:', setSessionError);
                  }
                }

                // Immediately refresh the session to ensure cookies are up-to-date
                setTimeout(() => {
                  refreshSession();
                }, 500);
              }

              setIsLoading(false);
              return;
            } else {
              console.log('[Auth] Server did not return valid user data');
            }
          } catch (serverError) {
            console.error('[Auth] Error getting user data from server:', serverError);
          }
        }

        // Try to recover the session using our improved persistence utility
        try {
          console.log('[Auth] Attempting to recover session with persistence utility...');
          const recovered = await recoverSession();
          if (recovered) {
            console.log('[Auth] Successfully recovered session with persistence utility');

            // Get the recovered session from Supabase
            const { data: recoveredData } = await supabase.auth.getSession();
            if (recoveredData?.session) {
              console.log('[Auth] Obtained recovered session data from Supabase');
              setSession(recoveredData.session);
              setUser(recoveredData.session.user);

              // Also refresh the server-side session
              try {
                console.log('[Auth] Refreshing server-side session with recovered session');
                await fetch('/api/auth/refresh-session', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${recoveredData.session.access_token}`
                  },
                  credentials: 'include'
                });

                // Get latest user data
                const userData = await getCurrentUser();
                if (userData) {
                  console.log('[Auth] Retrieved user data for recovered session');
                  setIsLoading(false);
                  return;
                }
              } catch (refreshError) {
                console.warn('[Auth] Failed to refresh server-side session with recovered data:', refreshError);
              }
            }
          } else {
            console.log('[Auth] Session recovery attempt unsuccessful');
          }
        } catch (recoveryError) {
          console.error('[Auth] Error during session recovery:', recoveryError);
        }

        // Fallback to legacy method - check localStorage for existing session data
        let localSessionData = null;

        try {
          const storedData = localStorage.getItem('supabase-auth');
          if (storedData) {
            try {
              localSessionData = JSON.parse(storedData);
              console.log('[Auth] Found legacy session data in localStorage');
            } catch (e) {
              console.error('[Auth] Error parsing stored session data:', e);
            }
          }
        } catch (storageError) {
          console.warn('[Auth] Error accessing localStorage:', storageError);
        }

        // Try to get the session from Supabase
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth] Error from supabase.auth.getSession:', error);

          // If we have local data, try to use that as fallback
          if (localSessionData && (localSessionData.access_token || localSessionData.session?.access_token)) {
            console.log('[Auth] Attempting to restore session from localStorage');

            // Extract tokens from the structure based on format
            const accessToken = localSessionData.access_token || localSessionData.session?.access_token;
            const refreshToken = localSessionData.refresh_token || localSessionData.session?.refresh_token || '';

            // Log the token values for debugging (redacted form)
            console.log('[Auth] Token debug - Access:', accessToken?.substring(0, 10) + '...');
            console.log('[Auth] Token debug - Refresh:', refreshToken?.substring(0, 5) + '...');

            const { data: refreshData, error: refreshError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (!refreshError && refreshData.session) {
              console.log('[Auth] Successfully restored session from localStorage');
              setSession(refreshData.session);
              setUser(refreshData.session.user);

              // Now also update the auth cookies by calling our server endpoint
              try {
                console.log('[Auth] Refreshing server-side session state');
                await fetch('/api/auth/refresh-session', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                  },
                  credentials: 'include'
                });
              } catch (refreshServerError) {
                console.warn('[Auth] Error refreshing server session (non-critical):', refreshServerError);
              }

              return;
            } else {
              console.error('[Auth] Failed to restore session from localStorage:', refreshError);
            }
          }

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

              // Update localStorage for redundancy
              if (typeof window !== 'undefined' && newSession.access_token) {
                localStorage.setItem('auth-status', 'authenticated');
                localStorage.setItem('supabase-auth', JSON.stringify({
                  access_token: newSession.access_token,
                  refresh_token: newSession.refresh_token,
                  expires_at: newSession.expires_at,
                  user_id: newSession.user?.id,
                  timestamp: Date.now()
                }));
                console.log('[Auth] Updated localStorage with session data from auth state change');
              }

              setSession(newSession);
              setUser(newSession?.user ?? null);

              // If this was a SIGNED_IN event, call session refresh to ensure cookies are set
              if (event === 'SIGNED_IN' && newSession.access_token) {
                try {
                  console.log('[Auth] Refreshing session cookies after sign-in');
                  await fetch('/api/auth/refresh-session', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${newSession.access_token}`
                    },
                    credentials: 'include'
                  });
                } catch (refreshError) {
                  console.warn('[Auth] Error refreshing session after sign-in (non-critical):', refreshError);
                }
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('[Auth] Auth state change - user signed out');

              // Clear localStorage
              if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-status');
                localStorage.removeItem('supabase-auth');
                localStorage.removeItem('contestedUserData');
                console.log('[Auth] Cleared auth data from localStorage');
              }

              setSession(null);
              setUser(null);
              setUserData(null);

              // Add delay to make sure state is updated before redirection
              setTimeout(() => {
                navigate('/');
              }, 100);
            } else {
              console.log('[Auth] Auth state change - clearing session');
              setSession(null);
              setUser(null);
              setUserData(null);
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
                console.log('[Auth] No user record found in database');
                toast({
                  title: 'Profile not found',
                  description: 'Your account exists but no user profile was found. Please contact support.',
                  variant: 'destructive',
                });

                // Clear user state to force re-login
                setTimeout(() => {
                  signOut();
                }, 3000);
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
  }, [user, signOut, toast]);

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

      // Debug the returned data
      console.log('[Auth] Login response data:', loginData);

      // Our custom method might return different structure based on success path
      if (loginData.error) {
        console.error('[Auth] Login error:', loginData.error);
        toast({
          title: 'Login failed',
          description: typeof loginData.error === 'string' 
            ? loginData.error 
            : (loginData.error.message || 'Invalid credentials'),
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
      let sessionToken = null;

      if (loginData.user) {
        userData = loginData.user;
      } else if (loginData.session?.user) {
        userData = loginData.session.user;
      } else if (loginData.data?.user) {
        userData = loginData.data.user;
      }

      // Get session token for simple auth
      if (loginData.session?.access_token) {
        sessionToken = loginData.session.access_token;
      } else if (loginData.data?.session?.access_token) {
        sessionToken = loginData.data.session.access_token;
      }

      // Store auth data in simple-auth for persistence
      if (userData && sessionToken) {
        console.log('[Auth] Storing auth data in simple-auth');
        storeAuthData(sessionToken, userData);
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

      // Handle case where registration might return error object
      if (registrationData.error) {
        console.error('[Auth] Registration returned error:', registrationData.error);
        const errorMsg = typeof registrationData.error === 'string' 
          ? registrationData.error 
          : registrationData.error.message || 'Registration failed';

        toast({
          title: 'Registration failed',
          description: errorMsg,
          variant: 'destructive',
        });

        return { error: registrationData.error, user: null };
      }

      console.log('[Auth] Registration successful');
      toast({
        title: 'Registration successful',
        description: 'Your account has been created successfully.',
      });

      // Store data in simple auth if we have valid registration data
      if (registrationData.user) {
        // Try to get a session token
        let sessionToken = null;
        if (registrationData.session?.access_token) {
          sessionToken = registrationData.session.access_token;
        } else if (registrationData.data?.session?.access_token) {
          sessionToken = registrationData.data.session.access_token;
        }

        if (sessionToken) {
          console.log('[Auth] Storing registration data in simple-auth');
          storeAuthData(sessionToken, registrationData.user);
        } else {
          console.log('[Auth] No session token available for simple-auth storage');
        }
      }

      return { error: null, user: registrationData.user };
    } catch (e: any) {
      console.error('[Auth] Registration error:', e);

      // Format error message for better user experience
      let errorMessage = 'Registration failed';

      if (e.message && e.message.includes('<!DOCTYPE')) {
        errorMessage = 'Error communicating with the server. Please try again later.';
      } else if (e.message) {
        errorMessage = e.message;      }

      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive'
      });

      return { error: e, user: null };
    }
  };

  // signOut function was moved to the top of the component using useCallback
  const refreshToast = () => {
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully.',
    });
  };

  // This is an empty placeholder to maintain code structure
  const handleLogoutError = (error: any) => {
    console.error('[Auth] Error signing out:', error);
    toast({
      title: 'Error',
      description: 'Failed to sign out. Please try again.',
      variant: 'destructive'
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
        refreshSession,
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

// Note: recoverSession is imported from session-persistence.ts
// We are not declaring it here to avoid duplication