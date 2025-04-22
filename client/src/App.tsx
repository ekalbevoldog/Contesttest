import { Switch, Route, useLocation, RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import SimpleOnboarding from "@/pages/SimpleOnboarding";
import Onboarding from "@/pages/Onboarding";
import SignIn from "@/pages/SignIn";
import AuthPage from "@/pages/auth-page";
import BusinessDashboard from "@/pages/BusinessDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AthleteDashboard from "@/pages/AthleteDashboard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { SupabaseAuthProvider } from "@/hooks/use-supabase-auth";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Define a ProtectedRoute component
const ProtectedRoute = ({ 
  component: Component, 
  path 
}: { 
  component: React.ComponentType<any>; 
  path: string 
}) => {
  // Use the auth state from use-auth hook
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

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
        component={() => {
          // Redirect to auth page following the blueprint
          navigate('/auth');
          return null;
        }}
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

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<LoadingFallback />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/sign-in" component={SignIn} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/athlete-onboarding" component={Onboarding} />
            <Route path="/athlete/sign-up" component={Onboarding} />
            <Route path="/explore-matches" component={SimpleOnboarding} />
            <Route path="/business-onboarding" component={Onboarding} />
            <Route path="/business/sign-up" component={Onboarding} />
            <ProtectedRoute path="/athlete/dashboard" component={AthleteDashboard} />
            <ProtectedRoute path="/business/dashboard" component={BusinessDashboard} />
            <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
            {/* All other routes temporarily point to our simple components */}
            <Route component={Home} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SupabaseAuthProvider>
          <Router />
          <Toaster />
        </SupabaseAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;