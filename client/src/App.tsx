import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import BasicHome from "@/pages/BasicHome";
import SimpleOnboarding from "@/pages/SimpleOnboarding";
import EnhancedOnboarding from "@/pages/EnhancedOnboarding";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={BasicHome} />
          <Route path="/onboarding" component={SimpleOnboarding} />
          <Route path="/enhanced-onboarding" component={EnhancedOnboarding} />
          {/* All other routes temporarily point to our simple components */}
          <Route component={BasicHome} />
        </Switch>
      </main>
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
