/**
 * Simplified Protected Route Component
 * 
 * A wrapper around UnifiedProtectedRoute that allows for simpler usage with children prop pattern.
 * This provides an easier way to use the protection without specifying a separate component.
 */
import { useCallback } from "react";
import { useLocation } from "wouter";
import { UnifiedProtectedRoute } from "./unified-protected-route";
import { useToast } from "../hooks/use-toast";

interface SimpleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  redirectPath?: string;
  requiresProfile?: boolean;
  onMount?: () => void;
}

export function SimpleProtectedRoute({ 
  children, 
  requiredRole,
  redirectPath = '/auth',
  requiresProfile = false,
  onMount
}: SimpleProtectedRouteProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  
  // Create a component that renders the children with memoization for performance
  const ChildrenRenderer = useCallback(() => <>{children}</>, [children]);
  
  return (
    <UnifiedProtectedRoute
      component={ChildrenRenderer}
      path={location}
      requiredRole={requiredRole}
      redirectPath={redirectPath}
      requiresProfile={requiresProfile}
      onMount={onMount}
    />
  );
}

// Export the original component under a new name for backward compatibility
export { SimpleProtectedRoute as ChildrenProtectedRoute };