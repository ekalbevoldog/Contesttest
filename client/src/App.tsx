import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import SimpleOnboarding from "@/pages/SimpleOnboarding";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/onboarding" component={SimpleOnboarding} />
          <Route path="/enhanced-onboarding" component={SimpleOnboarding} />
          {/* All other routes temporarily point to our simple components */}
          <Route component={Home} />
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
