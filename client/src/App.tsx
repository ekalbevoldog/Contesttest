import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import RegistrationWizard from "@/pages/RegistrationWizard";
import PersonalizedWizard from "@/pages/PersonalizedWizard";
import DynamicOnboarding from "@/pages/DynamicOnboarding";
import EnhancedOnboarding from "@/pages/EnhancedOnboarding";
import AuthPage from "@/pages/auth-page";
import AthleteDashboard from "@/pages/AthleteDashboard";
import BusinessDashboard from "@/pages/BusinessDashboard";
import MessageCenter from "@/pages/MessageCenter";
import N8nConfig from "@/pages/N8nConfig";
import ComplianceDashboard from "@/pages/ComplianceDashboard";
import Solutions from "@/pages/Solutions";
import Pricing from "@/pages/Pricing";
import CaseStudies from "@/pages/CaseStudies";
import Feedback from "@/pages/Feedback";
import AthleteProfileLink from "@/pages/AthleteProfileLink";
import AthleteProfileLinkConfig from "@/pages/AthleteProfileLinkConfig";
import MatchAlgorithmTest from "@/pages/MatchAlgorithmTest";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIAssistantDrawer from "@/components/AIAssistantDrawer";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/find-athlete-match" component={RegistrationWizard} />
          <Route path="/personalized-onboarding" component={PersonalizedWizard} />
          <Route path="/dynamic-onboarding" component={DynamicOnboarding} />
          <Route path="/enhanced-onboarding" component={EnhancedOnboarding} />

          {/* Marketing Pages */}
          <Route path="/solutions" component={Solutions} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/case-studies" component={CaseStudies} />
          <Route path="/feedback" component={Feedback} />

          {/* Protected Dashboard Routes */}
          <ProtectedRoute path="/athlete/dashboard" component={AthleteDashboard} requiredUserType="athlete" />
          <ProtectedRoute path="/business/dashboard" component={BusinessDashboard} requiredUserType="business" />
          <ProtectedRoute path="/compliance/dashboard" component={ComplianceDashboard} requiredUserType="compliance" />

          {/* Message Center - available to all logged in users */}
          <ProtectedRoute path="/messages" component={() => <MessageCenter />} />

          {/* Athlete Profile Configuration - only for athletes */}
          <ProtectedRoute path="/athlete/profile-link" component={AthleteProfileLinkConfig} requiredUserType="athlete" />

          {/* Public Athlete Profile Links */}
          <Route path="/p/:linkId" component={AthleteProfileLink} />

          {/* Admin and Integration Routes */}
          <Route path="/admin-login" component={AdminLogin} />
          <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} requiredUserType="admin" />
          <Route path="/admin/n8n-config" component={N8nConfig} />

          {/* Test Routes */}
          <Route path="/match-algorithm-test" component={MatchAlgorithmTest} />

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
      <AuthProvider>
        <Router />
        <AIAssistantDrawer />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;