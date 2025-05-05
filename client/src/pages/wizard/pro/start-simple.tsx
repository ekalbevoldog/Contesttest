import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Ultra simplified version with no dependencies on any complex components or hooks
export default function StartSimplePage() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleContinue = () => {
    setIsLoading(true);
    
    // Simulate a delay then navigate
    setTimeout(() => {
      navigate('/wizard/pro/advanced');
      setIsLoading(false);
    }, 500);
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Ultra Simple Start Page</h2>
        <p className="text-gray-400">This page has the bare minimum code required to function</p>
      </div>
      
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
        <p className="text-white mb-4">
          If you can see this page, we've successfully resolved the routing issue.
        </p>
        
        <p className="text-gray-400 mb-8">
          This page contains no complex form handling or dependencies. It simply tests
          navigation between wizard steps.
        </p>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleContinue}
            className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-black font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue to Next Step'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}