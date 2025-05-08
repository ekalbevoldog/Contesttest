/**
 * Consolidated Protected Route Component
 * 
 * This is the single, definitive protected route implementation that handles:
 * 1. Authentication verification
 * 2. Role-based access control
 * 3. Profile completion requirements
 * 4. Consistent routing and navigation
 */
import { Route, RouteComponentProps, useLocation } from "wouter";
import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/use-auth"; // Single source of truth for authentication
import { useToast } from "../hooks/use-toast";

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  path: string;
  requiredRole?: string | string[];
  redirectPath?: string;
  requiresProfile?: boolean;
  onMount?: () => void;
}

export function UnifiedProtectedRoute({ 
  component: Component, 
  path,
  requiredRole,
  redirectPath = '/auth',
  requiresProfile = false,
  onMount
}: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { toast } = useToast();
  
  // Use our enhanced auth hook which handles profile detection more reliably
  const { 
    user, 
    profile, 
    isLoading: isAuthLoading,
    refetchProfile
  } = useAuth();
  
  // Extract user type and profile status from available data - with multiple fallbacks
  const userType = user?.role || user?.userType || (user?.user_metadata?.role) || 'visitor';
  const userHasProfile = !!profile;
  
  // Helper function to redirect based on user role - made with useCallback for efficiency
  const redirectBasedOnRole = useCallback((role: string) => {
    console.log('[UnifiedProtectedRoute] Redirecting based on role:', role);
    
    let redirectTarget = '/';
    
    if (role === 'athlete') {
      redirectTarget = '/athlete/dashboard';
    } else if (role === 'business') {
      redirectTarget = '/business/dashboard';
    } else if (role === 'compliance') {
      redirectTarget = '/compliance/dashboard';
    } else if (role === 'admin') {
      redirectTarget = '/admin/dashboard';
    }
    
    // Always use router navigation rather than window.location for consistent behavior
    navigate(redirectTarget);
  }, [navigate]);
  
  // Enhanced profile completion check that handles multiple data formats
  const checkProfileCompletion = useCallback((user: any): boolean => {
    if (!user) return false;
    
    // User has profile data either directly or in userData property
    const profileData = user.profile || user.userData;
    
    if (!profileData) return false;
    
    // Different profile completion criteria based on role
    // Prioritize userType over role for consistency
    const role = user.userType || user.role || user.user_metadata?.role || 'visitor';
    
    if (role === 'athlete') {
      return !!profileData.sport && !!profileData.name;
    } else if (role === 'business') {
      // Accept more variations of business profile fields
      return !!(
        (profileData.name || profileData.businessName) && 
        (profileData.industry || profileData.productType || profileData.values)
      );
    }
    
    return true; // Default to true for other roles
  }, []);
  
  useEffect(() => {
    if (onMount) {
      onMount();
    }
  }, [onMount]);
  
  useEffect(() => {
    // Wait for auth to complete loading
    if (isAuthLoading) return;
    
    console.log('[UnifiedProtectedRoute] Auth state:', {
      hasUser: !!user,
      userType,
      hasProfile: userHasProfile,
      requiredRole,
      requiresProfile,
      path
    });
    
    // Use the useAuth() hook as the single source of truth
    if (user) {
      // Determine user role using the enhanced userType property with multiple fallbacks
      const effectiveRole = userType || user.role || user.userType || 
                           user.user_metadata?.role || 'visitor';
      
      // Enhanced role check with fallbacks and improved logging
      if (requiredRole) {
        let hasRequiredRole = false;
        
        // Special handling for business role - check multiple ways the role could be stored
        if (requiredRole === 'business' || (Array.isArray(requiredRole) && requiredRole.includes('business'))) {
          // More flexible check for business users
          const isBusinessUser = 
            effectiveRole === 'business' || 
            user.role === 'business' || 
            user.userType === 'business' ||
            (user.user_metadata?.role === 'business') ||
            (typeof user.email === 'string' && (
              user.email.includes('@business') || 
              user.email.includes('business@') ||
              user.email.includes('biz')
            ));
            
          console.log('[UnifiedProtectedRoute] Business role check:', { 
            isBusinessUser, 
            effectiveRole, 
            userRole: user.role, 
            userMetaRole: user.user_metadata?.role 
          });
            
          hasRequiredRole = isBusinessUser;
        } else {
          // Standard role check for other roles
          hasRequiredRole = Array.isArray(requiredRole)
            ? requiredRole.includes(effectiveRole)
            : effectiveRole === requiredRole;
        }
        
        if (!hasRequiredRole) {
          console.log('[UnifiedProtectedRoute] User does not have required role. Has:', effectiveRole, 'Required:', requiredRole);
          
          // Show toast notification for better user experience
          toast({
            title: "Access Restricted",
            description: `This area requires ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole} permissions.`,
            variant: "destructive"
          });
          
          // User does not have the required role, redirect to appropriate dashboard
          redirectBasedOnRole(effectiveRole);
          setIsLoading(false);
          return;
        }
      }
      
      // Enhanced profile check that first tries to refresh the profile
      if (requiresProfile && !userHasProfile) {
        console.log('[UnifiedProtectedRoute] Profile required but user has no profile. Attempting profile refresh.');
        
        // Try to refresh profile first before redirecting
        refetchProfile().then(() => {
          // If we still don't have a profile after refresh
          if (!profile) {
            // Special handling for business users - attempt to auto-create profile
            if (effectiveRole === 'business') {
              console.log('[UnifiedProtectedRoute] Business user without profile, attempting auto-creation');
              
              fetch('/api/create-business-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id })
              })
              .then(response => {
                if (response.ok) {
                  console.log('[UnifiedProtectedRoute] Created business profile successfully');
                  // Refresh profile data and set authorized
                  refetchProfile().then(() => {
                    setIsAuthorized(true);
                    setUserData(user);
                    setIsLoading(false);
                  });
                } else {
                  // If creation fails, redirect to onboarding with toast
                  console.error('[UnifiedProtectedRoute] Profile creation failed, redirecting to onboarding');
                  toast({
                    title: "Profile Setup Required",
                    description: "Please complete your profile to continue.",
                  });
                  navigate(redirectPath);
                  setIsLoading(false);
                }
              })
              .catch(err => {
                console.error('[UnifiedProtectedRoute] Error creating profile:', err);
                navigate(redirectPath);
                setIsLoading(false);
              });
              
              return; // Exit early while fetch completes
            }
            
            // For other roles, redirect to appropriate onboarding path
            console.log('[UnifiedProtectedRoute] User needs profile, redirecting to:', redirectPath);
            toast({
              title: "Profile Setup Required",
              description: "Please complete your profile to access this area.",
            });
            navigate(redirectPath);
            setIsLoading(false);
            return;
          } else {
            // We found a profile after refresh, proceed normally
            setIsAuthorized(true);
            setUserData(user);
            setIsLoading(false);
          }
        }).catch(err => {
          console.error('[UnifiedProtectedRoute] Error refreshing profile:', err);
          navigate(redirectPath);
          setIsLoading(false);
        });
        
        return; // Exit early while async operations complete
      }
      
      // User is authenticated and meets all requirements
      setIsAuthorized(true);
      setUserData(user);
      setIsLoading(false);
      return;
    }
    
    console.log('[UnifiedProtectedRoute] No authenticated user found, redirecting to auth page');
    
    // Not authenticated with any method, redirect to auth page
    navigate(redirectPath || '/auth');
    setIsLoading(false);
  }, [
    user, userType, userHasProfile, isAuthLoading, requiredRole, 
    requiresProfile, redirectPath, navigate, redirectBasedOnRole, 
    profile, refetchProfile, toast, path
  ]);
  
  // Loading state with improved indicator
  if (isLoading) {
    return (
      <Route
        path={path}
        component={() => (
          <div className="flex flex-col items-center justify-center h-screen">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-sm text-gray-500">Verifying access...</p>
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
  
  // Authorized state - render the component with user data
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