import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  requiredUserType?: "athlete" | "business" | "compliance" | "admin" | null;
}

export function ProtectedRoute({
  path,
  component: Component,
  requiredUserType = null,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      </Route>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If requiredUserType is specified and user type doesn't match, redirect to the appropriate dashboard
  if (requiredUserType && user.userType !== requiredUserType) {
    let redirectPath = "/dashboard";
    
    // Redirect to the appropriate dashboard based on user type
    if (user.userType === 'athlete') {
      redirectPath = "/athlete/dashboard";
    } else if (user.userType === 'business') {
      redirectPath = "/business/dashboard";
    } else if (user.userType === 'compliance') {
      redirectPath = "/compliance/dashboard";
    } else if (user.userType === 'admin') {
      redirectPath = "/admin/dashboard";
    }
    
    return (
      <Route path={path}>
        <Redirect to={redirectPath} />
      </Route>
    );
  }

  // User is authenticated and type matches, render the component
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}