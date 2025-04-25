import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Simple placeholder components
const HomePage = () => (
  <div className="container mx-auto p-8">
    <h1 className="text-3xl font-bold mb-6">Welcome to Contested</h1>
    <p className="mb-4">The platform for connecting athletes and businesses.</p>
    <div className="flex space-x-4 mt-6">
      <a 
        href="/auth" 
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Log In / Register
      </a>
      <a 
        href="/api/config/supabase" 
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
      >
        Check API Status
      </a>
    </div>
  </div>
);

const AuthPage = () => (
  <div className="container mx-auto p-8">
    <h1 className="text-3xl font-bold mb-6">Authentication</h1>
    <p className="mb-4">Please log in or create an account to continue.</p>
    
    <div className="mt-8 max-w-md">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input 
            type="email" 
            className="w-full p-2 border rounded" 
            placeholder="your@email.com" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" 
            className="w-full p-2 border rounded" 
            placeholder="••••••••" 
          />
        </div>
        <button 
          type="button" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => window.location.href = '/api/auth/login'}
        >
          Login
        </button>
      </form>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="container mx-auto p-8 text-center">
    <h1 className="text-3xl font-bold mb-6">Page Not Found</h1>
    <p className="mb-6">The page you're looking for doesn't exist.</p>
    <a 
      href="/" 
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Return Home
    </a>
  </div>
);

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <a href="/" className="text-xl font-bold">Contested</a>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="/" className="hover:text-blue-300">Home</a></li>
              <li><a href="/auth" className="hover:text-blue-300">Login</a></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </main>
      
      <footer className="bg-gray-800 text-white p-4 mt-auto">
        <div className="container mx-auto text-center">
          <p>© 2025 Contested. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function AppSimple() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default AppSimple;