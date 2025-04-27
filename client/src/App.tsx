import { Switch, Route, useLocation, RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Onboarding from "@/pages/Onboarding";
import Login from "@/pages/Login";
import ProfilePage from "@/pages/ProfilePage";
import AthleteInfo from "@/pages/AthleteInfo";
import BusinessInfo from "@/pages/BusinessInfo";
import BusinessDashboard from "@/pages/BusinessDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AthleteDashboard from "@/pages/AthleteDashboard";
import ComplianceDashboard from "@/pages/ComplianceDashboard"; // Added based on changes

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route"; 
import * as authService from "@/lib/auth-service";
import { Suspense, lazy, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// The remaining part of this component was broken during the fix
// Let's restore the proper structure with the RoleRedirect component

const RoleRedirect = ({ path }: { path: string }) => {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/login');
      } else {
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
          navigate('/');
        }
      }
    }
  }, [user, isLoading, navigate]);

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
        component={() => null} 
      />
    );
  }

  if (requiredRole) {
    const userRole = user.role || 'visitor';

    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRole)) {
        return (
          <Route
            path={path}
            component={() => null} 
          />
        );
      }
    } else if (userRole !== requiredRole) {
      return (
        <Route
          path={path}
          component={() => null} 
        />
      );
    }
  }

  const WrappedComponent = (props: RouteComponentProps) => <Component {...props} />; 
  return <Route path={path} component={WrappedComponent} />;
};

const RoleRedirect = ({ path }: { path: string }) => {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/login');
      } else {
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
          navigate('/');
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
  const { user, isLoading, hasCompletedProfile } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/login');
      } else if (!hasCompletedProfile) {
        navigate(redirectPath);
      } else if (requiredRole) {
        const userRole = user.role || 'visitor';

        if (Array.isArray(requiredRole)) {
          if (!requiredRole.includes(userRole)) {
            if (userRole === 'athlete') {
              navigate('/athlete/dashboard');
            } else if (userRole === 'business') {
              navigate('/business/dashboard');
            } else if (userRole === 'compliance') {
              navigate('/compliance/dashboard');
            } else if (userRole === 'admin') {
              navigate('/admin/dashboard');
            } else {
              navigate('/');
            }
          }
        } else if (userRole !== requiredRole) {
          navigate('/');
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

  const WrappedComponent = (props: RouteComponentProps) => <Component {...props} />; 
  return <Route path={path} component={WrappedComponent} />;
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const routes = {
  '/': Home,
  '/onboarding': Onboarding,
  // Add other routes as needed
};

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
            <Route path="/" component={Home} />
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/login" component={Login} />
            <ProtectedRoute path="/onboarding" component={Onboarding} />
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
            <ProtectedRoute path="/athlete/sign-up" component={Onboarding} requiredRole="athlete" />
            <ProtectedRoute path="/business/sign-up" component={Onboarding} requiredRole="business" />
            <Route path="/athletes" component={AthleteInfo} />
            <Route path="/businesses" component={BusinessInfo} />
            <Route path="/explore-matches" component={RedirectToOnboarding} />
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
            <ProtectedRoute path="/profile" component={ProfilePage} />
            <RoleRedirect path="/dashboard" />
            <Route component={Home} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export async function initializeAuth(): Promise<boolean> {
  try {
    console.log('[App] Initializing auth service');
    return await authService.initializeAuth();
  } catch (error) {
    console.error('[App] Auth initialization error:', error);
    return false;
  }
}

function App() {
  useEffect(() => {
    console.log('[App] Initializing unified auth');
    initializeAuth().then((success: boolean) => {
      console.log('[App] Auth initialization result:', success);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <Toaster />
          <Header />
          <Router />
          <Footer />
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;