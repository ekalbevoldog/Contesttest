import { Switch, Route, useLocation, RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import Home from "./pages/Home";
// SimpleOnboarding and EnhancedOnboarding removed - consolidated to main onboarding
import Onboarding from "./pages/Onboarding";
import AuthPage from "./pages/auth-page";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import AthleteInfo from "./pages/AthleteInfo";
import BusinessInfo from "./pages/BusinessInfo";
import BusinessDashboard from "./pages/BusinessDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AthleteDashboard from "./pages/AthleteDashboard";
// Import the subscription-related pages
import Subscribe from "./pages/Subscribe";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";

import Header from "./components/Header";
import Footer from "./components/Footer";
import { SupabaseAuthProvider } from "./hooks/use-supabase-auth";
import { AuthProvider, useAuth } from "./hooks/use-auth";
// Using unified protected route instead of separate components
import { UnifiedProtectedRoute, ProfileRequiredRoute as UnifiedProfileRequiredRoute, RoleProtectedRoute } from "./lib/unified-protected-route";
import { Suspense, lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "./hooks/use-toast";

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
            
            {/* Direct Pro Campaign Wizard Routes - Flattened structure for better reliability */}
            {/* Each route imports its own components to avoid context nesting issues */}
            <Route path="/wizard/pro/start">
              {() => {
                const WizardLayout = require('./pages/wizard/pro/layout').default;
                const StartPage = require('./pages/wizard/pro/start').default;
                return (
                  <WizardLayout>
                    <StartPage />
                  </WizardLayout>
                );
              }}
            </Route>
            
            {/* Test version of start page that doesn't depend on Supabase */}
            <Route path="/wizard/pro/start-test">
              {() => {
                const WizardLayout = require('./pages/wizard/pro/layout').default;
                const StartTestPage = require('./pages/wizard/pro/start-test').default;
                return (
                  <WizardLayout>
                    <StartTestPage />
                  </WizardLayout>
                );
              }}
            </Route>

            <Route path="/wizard/pro/advanced">
              {() => {
                const WizardLayout = require('./pages/wizard/pro/layout').default;
                const AdvancedPage = require('./pages/wizard/pro/advanced').default;
                return (
                  <WizardLayout>
                    <AdvancedPage />
                  </WizardLayout>
                );
              }}
            </Route>

            <Route path="/wizard/pro/deliverables">
              {() => {
                const WizardLayout = require('./pages/wizard/pro/layout').default;
                const DeliverablesPage = require('./pages/wizard/pro/deliverables').default;
                return (
                  <WizardLayout>
                    <DeliverablesPage />
                  </WizardLayout>
                );
              }}
            </Route>

            <Route path="/wizard/pro/match">
              {() => {
                const WizardLayout = require('./pages/wizard/pro/layout').default;
                const MatchPage = require('./pages/wizard/pro/match').default;
                return (
                  <WizardLayout>
                    <MatchPage />
                  </WizardLayout>
                );
              }}
            </Route>

            <Route path="/wizard/pro/bundle">
              {() => {
                const WizardLayout = require('./pages/wizard/pro/layout').default;
                const BundlePage = require('./pages/wizard/pro/bundle').default;
                return (
                  <WizardLayout>
                    <BundlePage />
                  </WizardLayout>
                );
              }}
            </Route>

            <Route path="/wizard/pro/review">
              {() => {
                const WizardLayout = require('./pages/wizard/pro/layout').default;
                const ReviewPage = require('./pages/wizard/pro/review').default;
                return (
                  <WizardLayout>
                    <ReviewPage />
                  </WizardLayout>
                );
              }}
            </Route>

            {/* Default wizard pro route redirects to start */}
            <Route path="/wizard/pro">
              {() => {
                const { useEffect } = require('react');
                const { useLocation } = require('wouter');
                const [, navigate] = useLocation();
                
                useEffect(() => {
                  navigate('/wizard/pro/start');
                }, [navigate]);
                
                return <div>Redirecting to wizard start...</div>;
              }}
            </Route>
            
            {/* Simple test route without layout or auth protection */}
            <Route path="/wizard/pro/test">
              {() => {
                const TestPage = require('./pages/wizard/pro/test').default;
                return <TestPage />;
              }}
            </Route>
            
            {/* Direct access entry point to Pro Wizard */}
            <Route path="/wizard-entry">
              {() => {
                const { useState, useEffect } = require('react');
                const { useLocation } = require('wouter');
                const [redirecting, setRedirecting] = useState(true);
                const [, navigate] = useLocation();
                
                useEffect(() => {
                  console.log('Wizard entry point accessed, redirecting to wizard start');
                  // Allow a moment for the console log to be visible
                  const timer = setTimeout(() => {
                    navigate('/wizard/pro/start');
                    setRedirecting(false);
                  }, 1000);
                  
                  return () => clearTimeout(timer);
                }, [navigate]);
                
                return (
                  <div className="min-h-screen bg-black text-white p-8">
                    <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                      <h1 className="text-3xl font-bold mb-6">Pro Wizard Entry Point</h1>
                      {redirecting ? (
                        <p className="text-amber-500">Redirecting to Pro Campaign Wizard...</p>
                      ) : (
                        <p className="text-red-500">Redirect failed. Please try navigating to /wizard/pro/start directly.</p>
                      )}
                    </div>
                  </div>
                );
              }}
            </Route>
            
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