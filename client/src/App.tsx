import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import SimpleOnboarding from "@/pages/SimpleOnboarding";
import Onboarding from "@/pages/Onboarding";
import SignIn from "@/pages/SignIn";
import BusinessDashboard from "@/pages/BusinessDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/hooks/use-auth";
import { SupabaseAuthProvider, useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Suspense, lazy } from "react";

// Define a ProtectedRoute component
const ProtectedRoute = ({ 
  component: Component, 
  path 
}: { 
  component: React.ComponentType; 
  path: string 
}) => {
  // Use the Supabase auth state
  const { user, isLoading } = useSupabaseAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <Route
        path={path}
        component={() => (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
          // Redirect to sign-in page
          navigate('/sign-in');
          return <div></div>;
        }}
      />
    );
  }

  return (
    <Route
      path={path}
      component={() => {
        return <Component />;
      }}
    />
  );
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
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/athlete-onboarding" component={Onboarding} />
            <Route path="/athlete/sign-up" component={Onboarding} />
            <Route path="/explore-matches" component={SimpleOnboarding} />
            <Route path="/business-onboarding" component={Onboarding} />
            <Route path="/business/sign-up" component={Onboarding} />
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