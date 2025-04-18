import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import SimpleOnboarding from "@/pages/SimpleOnboarding";
import Onboarding from "@/pages/Onboarding";
import AthleteOnboarding from "@/pages/AthleteOnboarding";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/athlete-onboarding" component={AthleteOnboarding} />
          <Route path="/athlete/sign-up" component={AthleteOnboarding} />
          <Route path="/explore-matches" component={SimpleOnboarding} />
          <Route path="/business-onboarding" component={Onboarding} />
          <Route path="/business/sign-up" component={Onboarding} />
          {/* All other routes temporarily point to our simple components */}
          <Route component={Home} />
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
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;