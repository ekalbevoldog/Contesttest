import { Switch, Route, useLocation, RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import * as authService from "@/lib/auth-service";
import { Suspense, lazy, useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy load pages to improve initial load performance
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const AthleteInfo = lazy(() => import("@/pages/AthleteInfo"));
const BusinessInfo = lazy(() => import("@/pages/BusinessInfo"));
const AthleteDashboard = lazy(() => import("@/pages/AthleteDashboard"));
const BusinessDashboard = lazy(() => import("@/pages/BusinessDashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const ComplianceDashboard = lazy(() => import("@/pages/ComplianceDashboard"));

// Component to redirect based on user role
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return null;
};

// Error fallback
const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
    <p className="text-gray-700 mb-4">{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Try again
    </button>
  </div>
);

// Loading indicator
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Loading page...</span>
  </div>
);

function App() {
  // Check login state on app start
  useEffect(() => {
    const checkLoginState = async () => {
      try {
        await authService.getCurrentUser();
      } catch (error) {
        console.error("Error checking login state:", error);
      }
    };

    checkLoginState();
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Suspense fallback={<LoadingFallback />}>
              <ProtectedRoute path="/" component={Home} />
              <ProtectedRoute path="/profile" component={ProfilePage} />
              <ProtectedRoute path="/login" component={Login} />
              <ProtectedRoute path="/signin" component={SignIn} />
              <ProtectedRoute path="/onboarding" component={Onboarding} />
              <ProtectedRoute path="/athlete/info" component={AthleteInfo} requiredRole="athlete" />
              <ProtectedRoute path="/business/info" component={BusinessInfo} requiredRole="business" />
              <ProtectedRoute path="/athlete/dashboard" component={AthleteDashboard} requiredRole="athlete" />
              <ProtectedRoute path="/business/dashboard" component={BusinessDashboard} requiredRole="business" />
              <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} requiredRole="admin" />
              <ProtectedRoute path="/compliance/dashboard" component={ComplianceDashboard} requiredRole="compliance" />
              <RoleRedirect path="/dashboard" />
            </Suspense>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </ErrorBoundary>
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

function AppWrapper() {
  useEffect(() => {
    console.log('[App] Initializing unified auth');
    initializeAuth().then((success: boolean) => {
      console.log('[App] Auth initialization result:', success);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

export default AppWrapper;