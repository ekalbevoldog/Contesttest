import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'athlete' | 'business' | 'compliance' | 'admin';
}

const AuthGuard = ({ children, requiredRole }: AuthGuardProps) => {
  const [, navigate] = useLocation();
  const { user, userType, isLoading, hasProfile } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // If auth is still loading, wait
    if (isLoading) return;

    // If no user is logged in, redirect to login
    if (!user) {
      navigate('/auth');
      return;
    }

    // If a specific role is required, check it
    if (requiredRole && userType !== requiredRole) {
      // If user doesn't have the required role, redirect to dashboard
      navigate('/dashboard');
      return;
    }

    // If we make it here, authentication check is complete
    setIsChecking(false);
  }, [user, userType, isLoading, requiredRole, navigate, hasProfile]);

  // Show loading state while checking auth
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
          <p className="text-white">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // If checks pass, render the children
  return <>{children}</>;
};

export default AuthGuard;