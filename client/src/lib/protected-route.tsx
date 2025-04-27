
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  requiredRole?: string | string[] | null;
}

export function ProtectedRoute({
  path,
  component: Component,
  requiredRole = null,
}: ProtectedRouteProps) {
  const { user, userData, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If user is not authenticated, redirect to login page
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  // If requiredRole is specified and user role doesn't match
  if (requiredRole) {
    // Get user role from userData
    const userRole = userData?.role || user?.user_metadata?.role || 'visitor';
    
    // Handle array of roles
    const hasRequiredRole = Array.isArray(requiredRole)
      ? requiredRole.includes(userRole)
      : userRole === requiredRole;
      
    // Admin can access all routes
    const isAdmin = userRole === 'admin';
    
    if (!hasRequiredRole && !isAdmin) {
      // Redirect to appropriate dashboard based on user role
      let redirectPath = "/";
      
      if (userRole === 'athlete') {
        redirectPath = "/athlete/dashboard";
      } else if (userRole === 'business') {
        redirectPath = "/business/dashboard";
      } else if (userRole === 'compliance') {
        redirectPath = "/compliance/dashboard";
      } else if (userRole === 'admin') {
        redirectPath = "/admin/dashboard";
      }
      
      return (
        <Route path={path}>
          <Redirect to={redirectPath} />
        </Route>
      );
    }
  }

  // User is authenticated and has required role, render the component
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
