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
      
      // Try to get user data from localStorage as fallback
      let userData = user;
      let effectiveRole = userType || user?.role || user?.user_metadata?.role;
      
      // If no user is logged in, check localStorage as fallback
      if (!userData) {
        try {
          const cachedUserData = localStorage.getItem('contestedUserData');
          if (cachedUserData) {
            const parsedData = JSON.parse(cachedUserData);
            if (parsedData && parsedData.id) {
              console.log('[ProfilePage] Using cached user data as fallback');
              userData = parsedData;
              effectiveRole = parsedData.userType || parsedData.role || null;
            }
          }
        } catch (error) {
          console.error('[ProfilePage] Error reading cached user data:', error);
        }
      }
      
      // If we still don't have user data, redirect to auth
      if (!userData) {
        console.log('[ProfilePage] No authenticated user found, redirecting to login');
        // Only show toast message once
        if (!redirecting) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to view your profile",
            variant: "destructive"
          });
        }
        navigate('/auth');
        return;
      }
      
      setRedirecting(true);
      
      // Redirect based on user role
      try {
        console.log('[ProfilePage] Determined user role/type:', effectiveRole);
        
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
    
    // Check if we've already tried to redirect
    if (redirecting) {
      console.log('[ProfilePage] Already attempting redirect, not starting new timer');
      return () => {}; // No cleanup needed
    }
    
    // Try immediate redirect if cached data is available
    const cachedUserData = localStorage.getItem('contestedUserData');
    if (cachedUserData && !isLoading) {
      try {
        const parsedData = JSON.parse(cachedUserData);
        if (parsedData && parsedData.id) {
          console.log('[ProfilePage] Found cached user data, attempting immediate redirect');
          redirectToCorrectDashboard();
          return () => {};
        }
      } catch (error) {
        console.error('[ProfilePage] Error reading cached user data:', error);
      }
    }
    
    // Use a longer delay to ensure auth state is fully loaded - 2 seconds should be sufficient
    console.log('[ProfilePage] Setting up delayed redirect');
    const timer = setTimeout(redirectToCorrectDashboard, 2000);
    return () => clearTimeout(timer);
    
  }, [user, isLoading, profile, userType, navigate, toast, redirecting]);

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