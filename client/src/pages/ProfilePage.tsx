import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, isLoading, userData } = useSupabaseAuth();
  const [, navigate] = useLocation();
  const [redirecting, setRedirecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('[ProfilePage] Loaded with user:', user);
    console.log('[ProfilePage] Loading status:', isLoading);
    console.log('[ProfilePage] User data:', userData);
    
    const redirectBasedOnRole = () => {
      if (isLoading) {
        console.log('[ProfilePage] Still loading, waiting...');
        return;
      }
      
      if (!user) {
        console.log('[ProfilePage] No user found, redirecting to auth page');
        toast({
          title: "Authentication required",
          description: "Please sign in to view your profile.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }
      
      setRedirecting(true);
      
      // Determine the role - try multiple sources to be sure
      // First check userType which is now consistently provided by our backend
      // Then fall back to other sources
      console.log('[ProfilePage] User data available:', {
        userDataType: userData?.userType,
        userDataRole: userData?.role,
        userRole: user?.role,
        userMetadataRole: user?.user_metadata?.role
      });
      
      // Use consistent role determination logic across the application
      const role = userData?.userType || userData?.role || user?.role || user?.user_metadata?.role || 'visitor';
      
      console.log('[ProfilePage] Final detected role/userType:', role);
      
      // Redirect based on user role
      try {
        if (role === 'athlete') {
          console.log('[ProfilePage] Redirecting to athlete dashboard');
          navigate('/athlete/dashboard');
        } else if (role === 'business') {
          console.log('[ProfilePage] Redirecting to business dashboard');
          navigate('/business/dashboard');
        } else if (role === 'compliance') {
          console.log('[ProfilePage] Redirecting to compliance dashboard');
          navigate('/compliance/dashboard');
        } else if (role === 'admin') {
          console.log('[ProfilePage] Redirecting to admin dashboard');
          navigate('/admin/dashboard');
        } else {
          // Default fallback
          console.log('[ProfilePage] Unknown role, redirecting to home');
          toast({
            title: "Profile not found",
            description: "Could not determine your profile type.",
            variant: "destructive",
          });
          navigate('/');
        }
      } catch (error) {
        console.error('[ProfilePage] Error during redirect:', error);
        toast({
          title: "Navigation error",
          description: "There was a problem accessing your profile. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    // Add a small delay to ensure auth state is properly loaded
    const timer = setTimeout(redirectBasedOnRole, 1000);
    return () => clearTimeout(timer);
  }, [user, isLoading, userData, navigate, toast]);

  const handleManualRedirect = (path: string) => {
    console.log(`[ProfilePage] Manual redirect to ${path}`);
    navigate(path);
  };

  // Show loading spinner while determining where to redirect
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">
          {isLoading 
            ? "Loading your profile information..." 
            : redirecting 
              ? "Redirecting to your dashboard..." 
              : "Preparing your profile..."}
        </p>
      </div>
    </div>
  );
}