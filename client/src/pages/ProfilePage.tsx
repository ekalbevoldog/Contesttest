import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, isLoading, profile, userType } = useAuth();
  const [, navigate] = useLocation();
  const [redirecting, setRedirecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Debug logging
    console.log('[ProfilePage] Component mounted');
    console.log('[ProfilePage] Auth state:', { 
      hasUser: !!user, 
      isLoading, 
      hasProfile: !!profile,
      userType
    });
    
    if (user) {
      console.log('[ProfilePage] User info:', {
        id: user.id,
        email: user.email,
        role: user.role
      });
    }
    
    if (profile) {
      console.log('[ProfilePage] Profile data available with keys:', Object.keys(profile));
    }
    
    // Function to handle redirection based on user role
    const redirectToCorrectDashboard = () => {
      // If still loading auth data, don't redirect yet
      if (isLoading) {
        console.log('[ProfilePage] Still loading auth data, waiting...');
        return;
      }
      
      // If no user is logged in, redirect to auth page
      if (!user) {
        console.log('[ProfilePage] No authenticated user found, redirecting to login');
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your profile",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      
      setRedirecting(true);
      
      // Get user role from multiple possible sources to handle different auth response formats
      const effectiveRole = userType || user.role || user.user_metadata?.role;
      console.log('[ProfilePage] Determined user role/type:', effectiveRole);
      
      // Redirect based on user role
      try {
        if (effectiveRole === 'athlete') {
          console.log('[ProfilePage] Redirecting to athlete dashboard');
          navigate('/athlete/dashboard');
        } else if (effectiveRole === 'business') {
          console.log('[ProfilePage] Redirecting to business dashboard');
          navigate('/business/dashboard');
        } else if (effectiveRole === 'compliance') {
          console.log('[ProfilePage] Redirecting to compliance dashboard');
          navigate('/compliance/dashboard');
        } else if (effectiveRole === 'admin') {
          console.log('[ProfilePage] Redirecting to admin dashboard');
          navigate('/admin/dashboard');
        } else {
          // No valid role found, redirect to home with a message
          console.log('[ProfilePage] Unknown user role, redirecting to home');
          toast({
            title: "Profile Not Found",
            description: "Could not determine your user type.",
            variant: "destructive"
          });
          navigate('/');
        }
      } catch (error) {
        console.error('[ProfilePage] Error during redirect:', error);
        toast({
          title: "Navigation Error",
          description: "There was a problem accessing your profile.",
          variant: "destructive"
        });
        navigate('/');
      }
    };
    
    // Use a delayed redirect to ensure auth state is fully loaded
    const timer = setTimeout(redirectToCorrectDashboard, 1000);
    return () => clearTimeout(timer);
    
  }, [user, isLoading, profile, userType, navigate, toast]);

  // Show a loading spinner while determining where to redirect
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">
          {isLoading 
            ? "Loading your profile information..." 
            : redirecting 
              ? "Redirecting to your dashboard..." 
              : "Preparing your profile..."}
        </p>
        
        {!isLoading && !redirecting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              This is taking longer than expected...
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => navigate('/business/dashboard')}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Go to Business Dashboard
              </button>
              <button 
                onClick={() => navigate('/athlete/dashboard')}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Go to Athlete Dashboard
              </button>
              <button 
                onClick={() => navigate('/auth')}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Go to Login Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}