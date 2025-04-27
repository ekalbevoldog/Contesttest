// Simple protected route component using the simplified auth system
import { Route, RouteComponentProps, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { isAuthenticated, getStoredAuthData } from "./simple-auth";
import { Loader2 } from "lucide-react";

interface SimpleProtectedRouteProps {
  component: React.ComponentType<any>;
  path: string;
  requiredRole?: string | string[];
}

export function SimpleProtectedRoute({ 
  component: Component, 
  path,
  requiredRole
}: SimpleProtectedRouteProps) {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // Check authentication status using simple-auth
    const authenticated = isAuthenticated();
    console.log('[SimpleProtectedRoute] Auth check:', authenticated);
    
    if (!authenticated) {
      console.log('[SimpleProtectedRoute] Not authenticated, redirecting to /auth');
      navigate('/auth');
      setIsLoading(false);
      return;
    }
    
    // Get the stored user data
    const authData = getStoredAuthData();
    if (!authData || !authData.user) {
      console.log('[SimpleProtectedRoute] No stored user data, redirecting to /auth');
      navigate('/auth');
      setIsLoading(false);
      return;
    }
    
    // Set the user data
    setUser(authData.user);
    
    // Check role if required
    if (requiredRole && authData.user) {
      const userRole = authData.user.role || 'visitor';
      
      // Handle array of roles
      if (Array.isArray(requiredRole)) {
        if (!requiredRole.includes(userRole)) {
          console.log(`[SimpleProtectedRoute] User role '${userRole}' not in required roles:`, requiredRole);
          
          // Redirect based on actual role
          if (userRole === 'athlete') {
            navigate('/athlete/dashboard');
          } else if (userRole === 'business') {
            navigate('/business/dashboard');
          } else if (userRole === 'compliance') {
            navigate('/compliance/dashboard');
          } else if (userRole === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/');
          }
          setIsLoading(false);
          return;
        }
      } 
      // Handle single role
      else if (userRole !== requiredRole) {
        console.log(`[SimpleProtectedRoute] User role '${userRole}' does not match required role:`, requiredRole);
        
        // Redirect based on actual role
        if (userRole === 'athlete') {
          navigate('/athlete/dashboard');
        } else if (userRole === 'business') {
          navigate('/business/dashboard');
        } else if (userRole === 'compliance') {
          navigate('/compliance/dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
        setIsLoading(false);
        return;
      }
    }
    
    // Authentication and role check passed
    setIsLoading(false);
  }, [navigate, requiredRole]);
  
  if (isLoading) {
    return (
      <Route
        path={path}
        component={() => (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        )}
      />
    );
  }
  
  if (!user) {
    return (
      <Route
        path={path}
        component={() => null} // The useEffect will handle the redirection
      />
    );
  }
  
  // Use the RouteComponentProps wrapper to fix the type error
  const WrappedComponent = (props: RouteComponentProps) => <Component {...props} user={user} />; 
  return <Route path={path} component={WrappedComponent} />;
}