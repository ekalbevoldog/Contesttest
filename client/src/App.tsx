import { Switch, Route, useLocation, RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
// SimpleOnboarding and EnhancedOnboarding removed - consolidated to main onboarding
import Onboarding from "@/pages/Onboarding";
import SignIn from "@/pages/SignIn";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/ProfilePage";
import AthleteInfo from "@/pages/AthleteInfo";
import BusinessInfo from "@/pages/BusinessInfo";
import BusinessDashboard from "@/pages/BusinessDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AthleteDashboard from "@/pages/AthleteDashboard";
// SupabaseTest import removed

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SupabaseAuthProvider, useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { SimpleProtectedRoute } from "@/lib/simple-protected-route";
import { isAuthenticated, getStoredAuthData, initializeAuthFromStorage } from "@/lib/simple-auth";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SessionRefreshHandler } from "@/components/SessionRefreshHandler";

// Define a ProtectedRoute component
const ProtectedRoute = ({ 
  component: Component, 
  path,
  requiredRole
}: { 
  component: React.ComponentType<any>; 
  path: string;
  requiredRole?: string | string[];
}) => {
  // Use the auth state from Supabase auth hook
  const { user, isLoading } = useSupabaseAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    } else if (!isLoading && user && requiredRole) {
      // Check if user has the required role - look for both role and userType
      const userRole = user.role || user.userType || 'visitor';
      console.log('[ProtectedRoute] User role check - Found role/type:', userRole);

      if (Array.isArray(requiredRole)) {
        if (!requiredRole.includes(userRole)) {
          // Redirect based on actual role
          if (userRole === 'athlete') {
            navigate('/athlete/dashboard');
          } else if (userRole === 'business') {
            navigate('/business/dashboard');
          } else if (userRole === 'compliance') {
            navigate('/compliance/dashboard');
          } else if (userRole === 'admin') {
            navigate('/admin/dashboard');
          } else {
            // If role is unrecognized, try to determine from profile page
            navigate('/profile');
          }
        }
      } else if (userRole !== requiredRole) {
        // Redirect based on actual role
        if (userRole === 'athlete') {
          navigate('/athlete/dashboard');
        } else if (userRole === 'business') {
          navigate('/business/dashboard');
        } else if (userRole === 'compliance') {
          navigate('/compliance/dashboard');
        } else if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else {
          // If role is unrecognized, try to determine from profile page
          navigate('/profile');
        }
      }
    }
  }, [user, isLoading, navigate, requiredRole]);

  if (isLoading) {
    return (
      <Route
        path={path}
        component={() => (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        )}
      />
    );
  }

  if (!user) {
    return (
      <Route
        path={path}
        component={() => null} // The useEffect will handle the redirection
      />
    );
  }

  // Role-based check
  if (requiredRole) {
    const userRole = user.role || user.userType || 'visitor';
    console.log('[ProtectedRoute] Role check - Found role/type:', userRole);

    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRole)) {
        return (
          <Route
            path={path}
            component={() => null} // The useEffect will handle the redirection
          />
        );
      }
    } else if (userRole !== requiredRole) {
      return (
        <Route
          path={path}
          component={() => null} // The useEffect will handle the redirection
        />
      );
    }
  }

  // Use the RouteComponentProps wrapper to fix the type error
  const WrappedComponent = (props: RouteComponentProps) => <Component {...props} />; 
  return <Route path={path} component={WrappedComponent} />;
};

// Define a route that redirects based on user role
const RoleRedirect = ({ path }: { path: string }) => {
  const { user, isLoading } = useSupabaseAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/auth');
      } else {
        // Redirect based on role or userType
        const role = user.role || user.userType || 'visitor';
        console.log('[RoleRedirect] Redirecting based on role/userType:', role);
        
        if (role === 'athlete') {
          navigate('/athlete/dashboard');
        } else if (role === 'business') {
          navigate('/business/dashboard');
        } else if (role === 'compliance') {
          navigate('/compliance/dashboard');
        } else if (role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          // If we still can't determine the role, go to profile page
          navigate('/profile');
        }
      }
    }
  }, [user, isLoading, navigate]);

  return (
    <Route
      path={path}
      component={() => (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      )}
    />
  );
};

// Profile Completion Route - checks if user has completed their profile
const ProfileRequiredRoute = ({ 
  component: Component, 
  path,
  redirectPath,
  requiredRole
}: { 
  component: React.ComponentType<any>; 
  path: string;
  redirectPath: string;
  requiredRole?: string | string[];
}) => {
  // Use the auth state from Supabase auth hook
  const { user, isLoading, hasCompletedProfile } = useSupabaseAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!hasCompletedProfile) {
        navigate(redirectPath);
      } else if (requiredRole) {
        // Check if user has the required role - check both role and userType
        const userRole = user.role || user.userType || 'visitor';
        console.log('[ProfileRequiredRoute] Role check - Found role/type:', userRole);

        if (Array.isArray(requiredRole)) {
          if (!requiredRole.includes(userRole)) {
            // Redirect based on actual role
            if (userRole === 'athlete') {
              navigate('/athlete/dashboard');
            } else if (userRole === 'business') {
              navigate('/business/dashboard');
            } else if (userRole === 'compliance') {
              navigate('/compliance/dashboard');
            } else if (userRole === 'admin') {
              navigate('/admin/dashboard');
            } else {
              // If role is unrecognized, try to determine from profile page
              navigate('/profile');
            }
          }
        } else if (userRole !== requiredRole) {
          // If role doesn't match required role, go to profile page to determine role
          navigate('/profile');
        }
      }
    }
  }, [user, isLoading, navigate, hasCompletedProfile, redirectPath, requiredRole]);

  if (isLoading || !user || !hasCompletedProfile) {
    return (
      <Route
        path={path}
        component={() => (
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        )}
      />
    );
  }

  // Use the RouteComponentProps wrapper to fix the type error
  const WrappedComponent = (props: RouteComponentProps) => <Component {...props} />; 
  return <Route path={path} component={WrappedComponent} />;
};

// Define a fallback loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const routes = {
  '/': Home,
  '/onboarding': Onboarding,
  '/auth': SignIn,
  // Add other routes as needed
};

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
            <SimpleProtectedRoute path="/onboarding" component={Onboarding} />

            {/* Role-specific onboarding routes */}
            <ProtectedRoute 
              path="/athlete-onboarding" 
              component={Onboarding} 
              requiredRole="athlete"
            />
            <ProtectedRoute 
              path="/business-onboarding" 
              component={Onboarding} 
              requiredRole="business"
            />

            {/* Alternate paths for onboarding */}
            <ProtectedRoute path="/athlete/sign-up" component={Onboarding} requiredRole="athlete" />
            <ProtectedRoute path="/business/sign-up" component={Onboarding} requiredRole="business" />

            {/* Public info pages */}
            <Route path="/athletes" component={AthleteInfo} />
            <Route path="/businesses" component={BusinessInfo} />

            {/* Redirect exploration path to main onboarding */}
            <Route path="/explore-matches" component={RedirectToOnboarding} />

            {/* Testing routes - disabled */}

            {/* Role-specific protected dashboard routes with profile completion check */}
            <ProfileRequiredRoute 
              path="/athlete/dashboard" 
              component={AthleteDashboard} 
              requiredRole="athlete"
              redirectPath="/athlete-onboarding"
            />
            <ProfileRequiredRoute 
              path="/business/dashboard" 
              component={BusinessDashboard} 
              requiredRole="business"
              redirectPath="/business-onboarding"
            />
            <ProtectedRoute 
              path="/admin/dashboard" 
              component={AdminDashboard} 
              requiredRole="admin"
            />

            {/* Profile routes - using simple auth */}
            <SimpleProtectedRoute path="/profile" component={ProfilePage} />
            
            {/* Main dashboard redirect */}
            <RoleRedirect path="/dashboard" />

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
  // No need for separate initialization - SupabaseAuthProvider handles it now
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        {/* Session refresh is handled internally by SupabaseAuthProvider */}
        <Router />
        <Toaster />
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;