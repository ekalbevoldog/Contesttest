import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading } = useSupabaseAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Redirect to auth page if not logged in
        navigate('/auth');
        return;
      }

      // Redirect based on user role
      const role = user.role || 'visitor';
      
      if (role === 'athlete') {
        navigate('/athlete/dashboard');
      } else if (role === 'business') {
        navigate('/business/dashboard');
      } else if (role === 'compliance') {
        navigate('/compliance/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        // Default fallback
        navigate('/');
      }
    }
  }, [user, isLoading, navigate]);

  // Show loading spinner while determining where to redirect
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    </div>
  );
}