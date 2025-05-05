import { useEffect } from "react";
import { useLocation, Link } from "wouter";

export default function WizardEntry() {
  const [, navigate] = useLocation();

  useEffect(() => {
    console.log("WizardEntry component mounted, will redirect in 3 seconds");
    // We won't auto-redirect to give time to see any errors in the console
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Wizard Entry Portal</h1>
        
        <p className="mb-6 text-gray-300">
          This page doesn't use any complex routing or context providers and should always load.
        </p>
        
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-amber-500">Test Options:</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border border-zinc-700 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              <h3 className="font-medium text-white mb-2">Minimal Test Page</h3>
              <p className="text-gray-400 text-sm mb-4">
                A minimal page with no complex dependencies
              </p>
              <Link to="/wizard/pro/minimal">
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm">
                  Open Minimal Test
                </button>
              </Link>
            </div>
            
            <div className="p-4 border border-zinc-700 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              <h3 className="font-medium text-white mb-2">Basic Test Page</h3>
              <p className="text-gray-400 text-sm mb-4">
                A basic test page without the Pro Wizard Layout
              </p>
              <Link to="/wizard/pro/test">
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm">
                  Open Test Page
                </button>
              </Link>
            </div>
            
            <div className="p-4 border border-zinc-700 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              <h3 className="font-medium text-white mb-2">Test Start Page</h3>
              <p className="text-gray-400 text-sm mb-4">
                Simplified start page without Supabase dependency
              </p>
              <Link to="/wizard/pro/start-test">
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm">
                  Open Test Start
                </button>
              </Link>
            </div>
            
            <div className="p-4 border border-zinc-700 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              <h3 className="font-medium text-white mb-2">Ultra-Simple Start Page</h3>
              <p className="text-gray-400 text-sm mb-4">
                Bare minimum code implementation with no dependencies
              </p>
              <Link to="/wizard/pro/start-simple">
                <button className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded-md text-sm">
                  Open Ultra Simple
                </button>
              </Link>
            </div>
            
            <div className="p-4 border border-zinc-700 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              <h3 className="font-medium text-white mb-2">Actual Wizard Start</h3>
              <p className="text-gray-400 text-sm mb-4">
                The actual Pro Campaign Wizard start page
              </p>
              <Link to="/wizard/pro/start">
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-sm">
                  Open Pro Wizard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}