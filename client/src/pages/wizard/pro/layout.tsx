import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight } from 'lucide-react';
import { ProWizardProvider } from '@/contexts/ProWizardProvider';

// Ultra simplified version without dependencies on complex hooks
export default function ProWizardLayoutWrapper({ children }: { children: ReactNode }) {
  // Debug output to troubleshoot layout rendering
  console.log('ProWizardLayoutWrapper rendering');
  
  return (
    <ProWizardProvider>
      <SimplifiedWizardLayout>
        {children}
      </SimplifiedWizardLayout>
    </ProWizardProvider>
  );
}

// Completely simplified layout with minimal dependencies
const SimplifiedWizardLayout = ({ children }: { children: ReactNode }) => {
  const [, navigate] = useLocation();
  
  // Get current path
  const [currentPath] = useLocation();
  
  // Define steps
  const steps = [
    { path: '/wizard/pro/start', label: 'Start', value: 1 },
    { path: '/wizard/pro/advanced', label: 'Details', value: 2 },
    { path: '/wizard/pro/deliverables', label: 'Content', value: 3 },
    { path: '/wizard/pro/match', label: 'Athletes', value: 4 },
    { path: '/wizard/pro/bundle', label: 'Bundle', value: 5 },
    { path: '/wizard/pro/review', label: 'Review', value: 6 },
  ];
  
  // Hard-code current step based on path to avoid context issues
  const currentStepObj = steps.find(step => step.path === currentPath) || steps[0];
  const currentStep = currentStepObj.value;
  
  // Calculate progress percentage
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white font-heading">Pro Campaign Wizard (Simplified)</h1>
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
            navigate(path);
          }}
        >
          <TabsList className="grid grid-cols-6 bg-zinc-900/50 border border-zinc-800 p-1">
            {steps.map((step) => (
              <TabsTrigger
                key={step.path}
                value={step.path}
                className="text-xs px-1 sm:text-sm sm:px-2"
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