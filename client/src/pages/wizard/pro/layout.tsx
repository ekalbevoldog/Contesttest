import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProWizardProvider, useProWizard } from '@/contexts/ProWizardProvider';
import { ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Component for the actual layout with navigation
const WizardLayout = ({ children }: { children: ReactNode }) => {
  const [, navigate] = useLocation();
  const { currentStep, campaignId } = useProWizard();
  const { toast } = useToast();
  
  // Get current path
  const [currentPath] = useLocation();
  
  // Verify campaign ID exists - only check after start page
  useEffect(() => {
    if (!campaignId && currentPath !== '/wizard/pro/start') {
      toast({
        title: "Campaign ID Missing",
        description: "Redirecting to start step to create a new campaign",
        variant: "destructive"
      });
      
      navigate('/wizard/pro/start');
    }
  }, [campaignId, currentPath, navigate, toast]);
  
  // Define steps
  const steps = [
    { path: '/wizard/pro/start', label: 'Start', value: 1 },
    { path: '/wizard/pro/advanced', label: 'Details', value: 2 },
    { path: '/wizard/pro/deliverables', label: 'Content', value: 3 },
    { path: '/wizard/pro/match', label: 'Athletes', value: 4 },
    { path: '/wizard/pro/bundle', label: 'Bundle', value: 5 },
    { path: '/wizard/pro/review', label: 'Review', value: 6 },
  ];
  
  // Calculate progress percentage
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white font-heading">Pro Campaign Wizard</h1>
          <p className="text-gray-400 mt-2">Create professionally managed athlete partnerships</p>
        </div>
        
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Step {currentStep} of {steps.length}</span>
            <span className="text-sm text-amber-500">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <Tabs 
          defaultValue={currentPath} 
          value={currentPath}
          className="mb-8"
          onValueChange={(path) => {
            // Prevent navigating ahead of current progress
            const targetStep = steps.find(step => step.path === path)?.value || 1;
            if (targetStep <= currentStep) {
              navigate(path);
            }
          }}
        >
          <TabsList className="grid grid-cols-6 bg-zinc-900/50 border border-zinc-800 p-1">
            {steps.map((step) => (
              <TabsTrigger
                key={step.path}
                value={step.path}
                // Disable steps ahead of current progress
                disabled={step.value > currentStep}
                className={`text-xs px-1 sm:text-sm sm:px-2 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-500 ${
                  // Custom styling for completed, active, and future steps
                  step.value < currentStep 
                    ? 'text-gray-400'
                    : step.value === currentStep
                      ? 'font-medium text-white'
                      : 'text-gray-600'
                }`}
              >
                {step.value < currentStep && <ChevronRight className="h-3 w-3 inline mr-1" />}
                {step.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        {/* Main Content */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Wrapper component that provides the context
export default function ProWizardLayoutWrapper({ children }: { children: ReactNode }) {
  // Debug output to troubleshoot layout rendering
  console.log('ProWizardLayoutWrapper rendering');
  
  return (
    <ProWizardProvider>
      <WizardLayout>
        {children}
      </WizardLayout>
    </ProWizardProvider>
  );
}