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

  // Debug output for AuthGuard
  console.log('AuthGuard Check:', { 
    user: user ? `${user.id} (${user.email})` : 'No user',
    userType,
    requiredRole,
    isLoading
  });

  useEffect(() => {
    // If auth is still loading, wait
    if (isLoading) return;

    // If no user is logged in, redirect to login
    if (!user) {
      console.log('AuthGuard: No user logged in, redirecting to /auth');
      navigate('/auth');
      return;
    }

    // More flexible role checking for business users
    if (requiredRole === 'business') {
      const isBusinessUser = 
        userType === 'business' || 
        user.role === 'business' || 
        user.user_metadata?.role === 'business' ||
        (user.email && (user.email.includes('@business') || user.email.includes('business@')));

      console.log('AuthGuard business check:', { isBusinessUser, userType, userRole: user.role });
        
      if (!isBusinessUser) {
        console.log('AuthGuard: User is not a business user, redirecting to dashboard');
        navigate('/dashboard');
        return;
      }
    }
    // General role checking for other roles
    else if (requiredRole && userType !== requiredRole) {
      console.log(`AuthGuard: User doesn't have required role (${requiredRole}), redirecting to dashboard`);
      navigate('/dashboard');
      return;
    }

    // If we make it here, authentication check is complete
    console.log('AuthGuard: Authentication check passed, rendering protected content');
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