
import { Switch, Route, useLocation } from "wouter";
import { Suspense, lazy, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { SupabaseAuthProvider } from "./hooks/use-supabase-auth";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { UnifiedProtectedRoute, ProfileRequiredRoute as UnifiedProfileRequiredRoute, RoleProtectedRoute } from "./lib/unified-protected-route";
import { useToast } from "./hooks/use-toast";
import { WebSocketProvider } from "./contexts/WebSocketProvider";
import Header from "./components/Header";
import Footer from "./components/Footer";
// WebSocketStatus component removed for cleaner UI
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import AuthPage from "./pages/auth-page";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import AthleteInfo from "./pages/AthleteInfo";
import BusinessInfo from "./pages/BusinessInfo";
import BusinessDashboard from "./pages/BusinessDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AthleteDashboard from "./pages/AthleteDashboard";
import Subscribe from "./pages/Subscribe";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import { Loader2 } from "lucide-react";

// Wizard Pages
const WizardLayout = lazy(() => import('./pages/wizard/pro/layout'));
const StartPage = lazy(() => import('./pages/wizard/pro/start'));
const AdvancedPage = lazy(() => import('./pages/wizard/pro/advanced'));
const DeliverablesPage = lazy(() => import('./pages/wizard/pro/deliverables'));
const MatchPage = lazy(() => import('./pages/wizard/pro/match'));
const BundlePage = lazy(() => import('./pages/wizard/pro/bundle'));
const ReviewPage = lazy(() => import('./pages/wizard/pro/review'));
const TestPage = lazy(() => import('./pages/wizard/pro/test'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const DashboardRedirect = () => {
  const [, navigate] = useLocation();
  const { userType } = useAuth();

  useEffect(() => {
    if (userType === 'athlete') navigate('/athlete/dashboard');
    else if (userType === 'business') navigate('/business/dashboard');
    else if (userType === 'compliance') navigate('/compliance/dashboard');
    else if (userType === 'admin') navigate('/admin/dashboard');
    else navigate('/profile');
  }, [navigate, userType]);

  return <LoadingFallback />;
};

const WizardRedirect = () => {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate('/wizard/pro/start');
  }, [navigate]);
  return <div>Redirecting to wizard start...</div>;
};

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Suspense fallback={<LoadingFallback />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/sign-in">{() => { 
              const [, navigate] = useLocation();
              useEffect(() => { navigate("/auth"); }, [navigate]);
              return <LoadingFallback />;
            }}</Route>
            <Route path="/onboarding" component={Onboarding} />
            <UnifiedProtectedRoute path="/onboarding" component={Onboarding} />
            <RoleProtectedRoute path="/athlete-onboarding" component={Onboarding} requiredRole="athlete" />
            <RoleProtectedRoute path="/business-onboarding" component={Onboarding} requiredRole="business" />
            <RoleProtectedRoute path="/athlete/sign-up" component={Onboarding} requiredRole="athlete" />
            <RoleProtectedRoute path="/business/sign-up" component={Onboarding} requiredRole="business" />
            <Route path="/athletes" component={AthleteInfo} />
            <Route path="/businesses" component={BusinessInfo} />
            <Route path="/explore-matches">{() => <WizardRedirect />}</Route>
            <UnifiedProfileRequiredRoute path="/athlete/dashboard" component={AthleteDashboard} requiredRole="athlete" redirectPath="/athlete-onboarding" />
            <UnifiedProfileRequiredRoute path="/business/dashboard" component={BusinessDashboard} requiredRole="business" redirectPath="/business-onboarding" />
            <RoleProtectedRoute path="/admin/dashboard" component={AdminDashboard} requiredRole="admin" />
            <UnifiedProtectedRoute path="/profile" component={ProfilePage} />
            <UnifiedProtectedRoute path="/edit-profile" component={EditProfilePage} />
            <UnifiedProtectedRoute path="/dashboard" component={DashboardRedirect} />
            <Route path="/wizard/pro/start">{() => <WizardLayout><StartPage /></WizardLayout>}</Route>
            <Route path="/wizard/pro/advanced">{() => <WizardLayout><AdvancedPage /></WizardLayout>}</Route>
            <Route path="/wizard/pro/deliverables">{() => <WizardLayout><DeliverablesPage /></WizardLayout>}</Route>
            <Route path="/wizard/pro/match">{() => <WizardLayout><MatchPage /></WizardLayout>}</Route>
            <Route path="/wizard/pro/bundle">{() => <WizardLayout><BundlePage /></WizardLayout>}</Route>
            <Route path="/wizard/pro/review">{() => <WizardLayout><ReviewPage /></WizardLayout>}</Route>
            <Route path="/wizard/pro/test">{() => <TestPage />}</Route>
            <Route path="/wizard/pro" component={WizardRedirect} />
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/subscription/success" component={SubscriptionSuccess} />
            <UnifiedProtectedRoute path="/account/subscription" component={Subscribe} />
            {/* WebSocket test route removed as it's no longer needed */}
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

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/health');
        if (response.ok) {
          const data = await response.json();
          if (data.supabase?.status === 'error') {
            toast({ title: "Database Connection Issue", description: "There’s a problem connecting to the database.", variant: "destructive" });
            setServerHealth('error');
          } else {
            setServerHealth('ok');
          }
        } else {
          setServerHealth('error');
        }
      } catch (err) {
        setServerHealth('error');
      }
    };
    checkHealth();
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <AuthProvider>
          <WebSocketProvider>
            <Router />
            {/* WebSocket connection is maintained invisibly */}
            <Toaster />
          </WebSocketProvider>
        </AuthProvider>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
