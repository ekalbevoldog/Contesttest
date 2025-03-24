import { Switch, Route } from "wouter";
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
import N8nConfig from "@/pages/N8nConfig";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/find-athlete-match" component={RegistrationWizard} />
          
          {/* Authentication Routes */}
          <Route path="/athlete/login" component={Login} />
          <Route path="/business/login" component={Login} />
          
          {/* Dashboard Routes */}
          <Route path="/athlete/dashboard" component={AthleteDashboard} />
          <Route path="/business/dashboard" component={BusinessDashboard} />
          
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
