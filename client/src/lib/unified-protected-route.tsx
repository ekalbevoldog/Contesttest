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
  
  // Try both auth methods - Supabase is primary, simple-auth is fallback
  const { user: supabaseUser, isLoading: isSupabaseLoading } = useSupabaseAuth();
  
  useEffect(() => {
    // Wait for Supabase auth to complete loading
    if (isSupabaseLoading) return;
    
    // Check if authenticated with Supabase
    if (supabaseUser) {
      // User is authenticated in Supabase
      // Prioritize userType which should be consistently set by our endpoint
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
          if (redirectPath) {
            navigate(redirectPath);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // User is authenticated and meets all requirements
      setIsAuthorized(true);
      setUserData(supabaseUser);
      setIsLoading(false);
      return;
    }
    
    // Fallback to simple-auth if not authenticated with Supabase
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
    
    // Not authenticated with either method, redirect to auth page
    navigate(redirectPath || '/auth');
    setIsLoading(false);
  }, [supabaseUser, isSupabaseLoading, requiredRole, requiresProfile, redirectPath, navigate]);
  
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
      return !!profile.businessName && !!profile.industry;
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