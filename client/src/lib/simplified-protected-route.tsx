/**
 * Simplified Protected Route Component
 * 
 * A wrapper around UnifiedProtectedRoute that allows for simpler usage with children prop pattern
 */
import { useCallback } from "react";
import { useLocation } from "wouter";
import { UnifiedProtectedRoute } from "./unified-protected-route";

export function SimpleProtectedRoute({ 
  children, 
  requiredRole,
  redirectPath = '/auth',
  requiresProfile = false
}: {
  children: React.ReactNode;
  requiredRole?: string | string[];
  redirectPath?: string;
  requiresProfile?: boolean;
}) {
  const [location] = useLocation();
  
  // Create a component that renders the children
  const ChildrenRenderer = useCallback(() => <>{children}</>, [children]);
  
  return (
    <UnifiedProtectedRoute
      component={ChildrenRenderer}
      path={location}
      requiredRole={requiredRole}
      redirectPath={redirectPath}
      requiresProfile={requiresProfile}
    />
  );
}