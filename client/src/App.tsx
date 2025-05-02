import { Switch, Route, useLocation, RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
// SimpleOnboarding and EnhancedOnboarding removed - consolidated to main onboarding
import Onboarding from "@/pages/Onboarding";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/ProfilePage";
import EditProfilePage from "@/pages/EditProfilePage";
import AthleteInfo from "@/pages/AthleteInfo";
import BusinessInfo from "@/pages/BusinessInfo";
import BusinessDashboard from "@/pages/BusinessDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AthleteDashboard from "@/pages/AthleteDashboard";
// Import the subscription-related pages
import Subscribe from "@/pages/Subscribe";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SupabaseAuthProvider } from "@/hooks/use-supabase-auth";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
// Using unified protected route instead of separate components
import { UnifiedProtectedRoute, ProfileRequiredRoute as UnifiedProfileRequiredRoute, RoleProtectedRoute } from "@/lib/unified-protected-route";
import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define a fallback loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Simple redirect component
const RedirectToOnboarding = () => {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate('/onboarding');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

// Dashboard redirect component - redirects to the appropriate dashboard based on user role
const DashboardRedirect = () => {
  const [, navigate] = useLocation();
  const { userType } = useAuth();
  
  useEffect(() => {
    // Redirect to the appropriate dashboard based on user type
    if (userType === 'athlete') {
      navigate('/athlete/dashboard');
    } else if (userType === 'business') {
      navigate('/business/dashboard');
    } else if (userType === 'compliance') {
      navigate('/compliance/dashboard');
    } else if (userType === 'admin') {
      navigate('/admin/dashboard');
    } else {
      // Fallback to profile page if user type is unknown
      navigate('/profile');
    }
  }, [navigate, userType]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<LoadingFallback />}>
          <Switch>
            {/* Public routes accessible to everyone */}
            <Route path="/" component={Home} />
            <Route path="/onboarding" component={Onboarding} />
            {/* Combined auth route */}
            <Route path="/auth" component={AuthPage} />
            {/* Redirect /sign-in to /auth for consistency */}
            <Route path="/sign-in">
              {() => {
                window.location.href = "/auth";
                return null;
              }}
            </Route>

            {/* Onboarding routes - accessible after authentication */}
            <UnifiedProtectedRoute path="/onboarding" component={Onboarding} />

            {/* Role-specific onboarding routes */}
            <RoleProtectedRoute 
              path="/athlete-onboarding" 
              component={Onboarding} 
              requiredRole="athlete"
            />
            <RoleProtectedRoute 
              path="/business-onboarding" 
              component={Onboarding} 
              requiredRole="business"
            />

            {/* Alternate paths for onboarding */}
            <RoleProtectedRoute path="/athlete/sign-up" component={Onboarding} requiredRole="athlete" />
            <RoleProtectedRoute path="/business/sign-up" component={Onboarding} requiredRole="business" />

            {/* Public info pages */}
            <Route path="/athletes" component={AthleteInfo} />
            <Route path="/businesses" component={BusinessInfo} />

            {/* Redirect exploration path to main onboarding */}
            <Route path="/explore-matches" component={RedirectToOnboarding} />

            {/* Role-specific protected dashboard routes with profile completion check */}
            <UnifiedProfileRequiredRoute 
              path="/athlete/dashboard" 
              component={AthleteDashboard} 
              requiredRole="athlete"
              redirectPath="/athlete-onboarding"
            />
            <UnifiedProfileRequiredRoute 
              path="/business/dashboard" 
              component={BusinessDashboard} 
              requiredRole="business"
              redirectPath="/business-onboarding"
            />
            <RoleProtectedRoute 
              path="/admin/dashboard" 
              component={AdminDashboard} 
              requiredRole="admin"
            />

            {/* Profile routes */}
            <UnifiedProtectedRoute path="/profile" component={ProfilePage} />
            <UnifiedProtectedRoute path="/edit-profile" component={EditProfilePage} />

            {/* Main dashboard redirect - user will be redirected based on role */}
            <UnifiedProtectedRoute path="/dashboard" component={DashboardRedirect} />
            
            {/* Subscription routes */}
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/subscription/success" component={SubscriptionSuccess} />
            <UnifiedProtectedRoute path="/account/subscription" component={Subscribe} />

            {/* All other routes redirect to home */}
            <Route component={Home} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const { toast } = useToast();
  const [serverHealth, setServerHealth] = useState<'unknown' | 'ok' | 'error'>('unknown');

  // Check server health on startup
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health-check');
        if (response.ok) {
          const data = await response.json();
          console.log('Health check results:', data);

          if (data.supabase?.status === 'error') {
            toast({
              title: "Database Connection Issue",
              description: "There's a problem connecting to the database. Some features may not work properly.",
              variant: "destructive"
            });
            setServerHealth('error');
          } else {
            setServerHealth('ok');
          }
        } else {
          console.error('Health check failed:', await response.text());
          setServerHealth('error');
        }
      } catch (err) {
        console.error('Error checking server health:', err);
        setServerHealth('error');
      }
    };

    checkHealth();
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <AuthProvider>
          {/* Session refresh is handled internally by SupabaseAuthProvider */}
          <Router />
          <Toaster />
        </AuthProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;