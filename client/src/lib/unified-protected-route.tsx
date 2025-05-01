/**
 * Unified Protected Route Component
 * 
 * This combines both the Supabase auth-based protection and the simple-auth
 * system into a single component to eliminate redundancy.
 */
import { Route, RouteComponentProps, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { isAuthenticated, getStoredAuthData } from "./simple-auth";
import { useAuth } from "@/hooks/use-auth"; // Import the enhanced useAuth hook

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path: string;
  requiredRole?: string | string[];
  redirectPath?: string;
  requiresProfile?: boolean;
}

export function UnifiedProtectedRoute({ 
  component: Component, 
  path,
  requiredRole,
  redirectPath = '/auth',
  requiresProfile = false
}: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  // Use our enhanced auth hook which handles profile detection more reliably
  const { 
    user, 
    profile, 
    isLoading: isAuthLoading 
  } = useAuth();
  
  // Extract user type and profile status from available data
  const userType = user?.role || 'visitor';
  const userHasProfile = !!profile;
  
  // Also get Supabase auth for backwards compatibility
  const { user: supabaseUser, isLoading: isSupabaseLoading } = useSupabaseAuth();
  
  useEffect(() => {
    // Wait for both auth methods to complete loading
    if (isAuthLoading || isSupabaseLoading) return;
    
    console.log('[UnifiedProtectedRoute] Auth state:', {
      hasUser: !!user,
      userType,
      hasProfile: userHasProfile,
      requiredRole,
      requiresProfile
    });
    
    // First try our main auth hook which has enhanced profile detection
    if (user) {
      // Determine user role using the enhanced userType property
      const effectiveRole = userType || user.role || user.userType || 'visitor';
      
      // Check role requirement if specified
      if (requiredRole) {
        const hasRequiredRole = Array.isArray(requiredRole)
          ? requiredRole.includes(effectiveRole)
          : effectiveRole === requiredRole;
        
        if (!hasRequiredRole) {
          console.log('[UnifiedProtectedRoute] User does not have required role. Has:', effectiveRole, 'Required:', requiredRole);
          // User does not have the required role, redirect to appropriate dashboard
          redirectBasedOnRole(effectiveRole);
          setIsLoading(false);
          return;
        }
      }
      
      // Check profile requirement if specified
      if (requiresProfile && !userHasProfile) {
        console.log('[UnifiedProtectedRoute] Profile required but user has no profile');
        
        // Special handling for business users - attempt to auto-create their profile via API
        if (effectiveRole === 'business') {
          console.log('[UnifiedProtectedRoute] Business user without profile, triggering creation');
          
          // Create a minimal business profile automatically
          fetch('/api/create-business-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          })
          .then(response => {
            if (response.ok) {
              console.log('[UnifiedProtectedRoute] Created business profile successfully');
              // Set authorized after profile creation
              setIsAuthorized(true);
              setUserData(user);
              setIsLoading(false);
            } else {
              // If creation fails, redirect to onboarding
              console.error('[UnifiedProtectedRoute] Profile creation failed, redirecting');
              navigate(redirectPath);
              setIsLoading(false);
            }
          })
          .catch(err => {
            console.error('[UnifiedProtectedRoute] Error creating profile:', err);
            navigate(redirectPath);
            setIsLoading(false);
          });
          
          return;
        }
        
        // For other roles, just redirect to onboarding
        navigate(redirectPath);
        setIsLoading(false);
        return;
      }
      
      // User is authenticated and meets all requirements
      setIsAuthorized(true);
      setUserData(user);
      setIsLoading(false);
      return;
    }
    
    // Fallback to Supabase auth if our main hook doesn't have a user
    if (supabaseUser) {
      const userRole = supabaseUser.userType || supabaseUser.role || supabaseUser.user_metadata?.role || 'visitor';
      
      // Check role requirement if specified
      if (requiredRole) {
        const hasRequiredRole = Array.isArray(requiredRole)
          ? requiredRole.includes(userRole)
          : userRole === requiredRole;
        
        if (!hasRequiredRole) {
          // User does not have the required role, redirect to appropriate dashboard
          redirectBasedOnRole(userRole);
          setIsLoading(false);
          return;
        }
      }
      
      // Check profile requirement if specified
      if (requiresProfile) {
        const hasProfile = checkProfileCompletion(supabaseUser);
        if (!hasProfile) {
          // User does not have a complete profile, redirect
          navigate(redirectPath);
          setIsLoading(false);
          return;
        }
      }
      
      // User is authenticated and meets all requirements
      setIsAuthorized(true);
      setUserData(supabaseUser);
      setIsLoading(false);
      return;
    }
    
    // Fallback to simple-auth if not authenticated with other methods
    const simpleAuthUser = isAuthenticated() ? getStoredAuthData()?.user : null;
    if (simpleAuthUser) {
      const userRole = simpleAuthUser.role || 'visitor';
      
      // Check role requirement if specified
      if (requiredRole) {
        const hasRequiredRole = Array.isArray(requiredRole)
          ? requiredRole.includes(userRole)
          : userRole === requiredRole;
        
        if (!hasRequiredRole) {
          // User does not have the required role, redirect to appropriate dashboard
          redirectBasedOnRole(userRole);
          setIsLoading(false);
          return;
        }
      }
      
      // User is authenticated and meets role requirements
      setIsAuthorized(true);
      setUserData(simpleAuthUser);
      setIsLoading(false);
      return;
    }
    
    // Check localStorage as a last resort
    try {
      const cachedUserData = localStorage.getItem('contestedUserData');
      if (cachedUserData) {
        const parsedData = JSON.parse(cachedUserData);
        if (parsedData && parsedData.id) {
          console.log('[UnifiedProtectedRoute] Using cached user data as fallback');
          const cachedRole = parsedData.userType || parsedData.role || 'visitor';
          
          // Check role requirement if applicable
          if (requiredRole) {
            const hasRequiredRole = Array.isArray(requiredRole)
              ? requiredRole.includes(cachedRole)
              : cachedRole === requiredRole;
            
            if (!hasRequiredRole) {
              redirectBasedOnRole(cachedRole);
              setIsLoading(false);
              return;
            }
          }
          
          setIsAuthorized(true);
          setUserData(parsedData);
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('[UnifiedProtectedRoute] Error reading cached user data:', error);
    }
    
    console.log('[UnifiedProtectedRoute] No authenticated user found, redirecting to auth page');
    // Not authenticated with any method, redirect to auth page
    navigate(redirectPath || '/auth');
    setIsLoading(false);
  }, [user, userType, userHasProfile, supabaseUser, isAuthLoading, isSupabaseLoading, requiredRole, requiresProfile, redirectPath, navigate]);
  
  // Helper function to redirect based on user role
  function redirectBasedOnRole(role: string) {
    if (role === 'athlete') {
      navigate('/athlete/dashboard');
    } else if (role === 'business') {
      navigate('/business/dashboard');
    } else if (role === 'compliance') {
      navigate('/compliance/dashboard');
    } else if (role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
  }
  
  // Helper function to check if profile is complete
  function checkProfileCompletion(user: any): boolean {
    if (!user) return false;
    
    // User has profile data either directly or in userData property
    const profile = user.profile || user.userData;
    
    if (!profile) return false;
    
    // Different profile completion criteria based on role
    // Prioritize userType over role for consistency
    const role = user.userType || user.role || user.user_metadata?.role || 'visitor';
    
    if (role === 'athlete') {
      return !!profile.sport && !!profile.name;
    } else if (role === 'business') {
      // Accept more variations of business profile fields
      return !!(
        (profile.name || profile.businessName) && 
        (profile.industry || profile.productType || profile.values)
      );
    }
    
    return true; // Default to true for other roles
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Route
        path={path}
        component={() => (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      />
    );
  }
  
  // Unauthorized state - handled in the useEffect with redirects
  if (!isAuthorized) {
    return (
      <Route
        path={path}
        component={() => null}
      />
    );
  }
  
  // Authorized state - render the component
  const WrappedComponent = (props: RouteComponentProps) => (
    <Component {...props} user={userData} />
  );
  
  return <Route path={path} component={WrappedComponent} />;
}

// Convenience aliases for specific route use cases
export function ProfileRequiredRoute(props: Omit<ProtectedRouteProps, 'requiresProfile'>) {
  return (
    <UnifiedProtectedRoute
      {...props}
      requiresProfile={true}
    />
  );
}

export function RoleProtectedRoute({
  component,
  path,
  requiredRole,
  redirectPath = '/auth'
}: ProtectedRouteProps) {
  return (
    <UnifiedProtectedRoute
      component={component}
      path={path}
      requiredRole={requiredRole}
      redirectPath={redirectPath}
    />
  );
}