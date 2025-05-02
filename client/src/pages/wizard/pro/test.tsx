import { ProWizardProvider } from '@/contexts/ProWizardProvider';

export default function ProWizardTest() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Pro Wizard Test Page</h1>
        
        <p className="mb-4">
          If you can see this page, the Pro Campaign Wizard route configuration is working.
        </p>
        
        <p className="mb-4">
          This is a simple test page outside the wizard flow to help diagnose routing issues.
        </p>
        
        <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-md">
          <h2 className="text-xl font-bold text-amber-500 mb-2">Next Steps</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Try accessing the <a href="/wizard/pro/start" className="text-amber-500 underline">Start</a> page directly</li>
            <li>Make sure the ProWizardProvider context is working properly</li>
            <li>Check browser console for any errors</li>
            <li>Verify that RoleProtectedRoute is detecting business roles correctly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}