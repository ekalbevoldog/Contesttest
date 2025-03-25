import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import RegistrationWizard from "@/pages/RegistrationWizard";
import Login from "@/pages/Login";
import AthleteDashboard from "@/pages/AthleteDashboard";
import BusinessDashboard from "@/pages/BusinessDashboard";
import MessageCenter from "@/pages/MessageCenter";
import N8nConfig from "@/pages/N8nConfig";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Protected route component to handle authentication and user type checks
function ProtectedRoute({ component: Component, requiredUserType = null, ...rest }: 
  { component: React.ComponentType<any>, requiredUserType?: string | null, path: string }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Check if user is authenticated and user type matches
  const isAuthenticated = localStorage.getItem('contestedUserLoggedIn') === 'true';
  const userType = localStorage.getItem('contestedUserType');
  
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to access this page",
      });
      
      if (requiredUserType === 'athlete') {
        navigate("/athlete/login");
      } else if (requiredUserType === 'business') {
        navigate("/business/login");
      } else {
        navigate("/");
      }
    } else if (requiredUserType && userType !== requiredUserType) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: `This page is for ${requiredUserType}s only.`,
      });
      
      // Redirect to appropriate dashboard
      if (userType === 'athlete') {
        navigate("/athlete/dashboard");
      } else if (userType === 'business') {
        navigate("/business/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [isAuthenticated, userType, requiredUserType, navigate, toast]);
  
  // If authenticated and user type matches, render the component
  if (isAuthenticated && (!requiredUserType || userType === requiredUserType)) {
    return <Component {...rest} />;
  }
  
  // Return null while redirecting
  return null;
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/find-athlete-match" component={RegistrationWizard} />
          
          {/* Authentication Routes */}
          <Route path="/athlete/login" component={Login} />
          <Route path="/business/login" component={Login} />
          
          {/* Protected Dashboard Routes */}
          <Route path="/dashboard">
            {(params) => <ProtectedRoute component={Dashboard} path="/dashboard" />}
          </Route>
          <Route path="/athlete/dashboard">
            {(params) => <ProtectedRoute component={AthleteDashboard} path="/athlete/dashboard" requiredUserType="athlete" />}
          </Route>
          <Route path="/business/dashboard">
            {(params) => <ProtectedRoute component={BusinessDashboard} path="/business/dashboard" requiredUserType="business" />}
          </Route>
          
          {/* Message Center - available to all logged in users */}
          <Route path="/messages">
            {(params) => <ProtectedRoute component={MessageCenter} path="/messages" />}
          </Route>
          
          {/* Admin and Integration Routes */}
          <Route path="/admin/n8n-config" component={N8nConfig} />
          
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
