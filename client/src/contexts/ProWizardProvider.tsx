import { createContext, useContext, ReactNode } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the form state interface
interface ProWizardState {
  // Campaign creation step tracking
  currentStep: number;
  campaignId: string | null;
  
  // Form data
  form: {
    // Basic info
    objective: string;
    title: string;
    description: string;
    channels: string[];
    
    // Timeline
    startDate: string;
    endDate: string;
    
    // Target information
    targetAudience: {
      ageRange: [number, number];
      gender: string;
      interests: string[];
      location: string;
    };
    targetSports: string[];
    
    // Budget and content
    budget: string;
    deliverables: Array<{
      type: string;
      platform: string;
      quantity: number;
      description: string;
    }>;
    hashtagRequirements: string[];
    
    // Matching and bundle selection
    selectedMatches: any[];
    bundleType: string;
    customBundle: {
      name: string;
      description: string;
      deliverables: string;
      compensation: string;
      timeline: string;
    } | null;
    selectedBundle: {
      name: string;
      description: string;
      deliverables: string;
      compensation: string;
      timeline: string;
    } | null;
  };
  
  // Actions
  reset: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setCampaignId: (id: string) => void;
  updateForm: (values: Partial<ProWizardState['form']>) => void;
}

// Create the Zustand store with persistence
const useProWizardStore = create<ProWizardState>()(
  persist(
    (set) => ({
      // Initial state
      currentStep: 1,
      campaignId: null,
      form: {
        // Basic info default values
        objective: '',
        title: '',
        description: '',
        channels: [],
        
        // Timeline default values
        startDate: '',
        endDate: '',
        
        // Target defaults
        targetAudience: {
          ageRange: [18, 34],
          gender: 'all',
          interests: [],
          location: '',
        },
        targetSports: [],
        
        // Content defaults
        budget: '',
        deliverables: [],
        hashtagRequirements: [],
        
        // Matching and bundle defaults
        selectedMatches: [],
        bundleType: 'standard',
        customBundle: null,
        selectedBundle: null,
      },
      
      // Actions
      reset: () => set({
        currentStep: 1,
        campaignId: null,
        form: {
          objective: '',
          title: '',
          description: '',
          channels: [],
          startDate: '',
          endDate: '',
          targetAudience: {
            ageRange: [18, 34],
            gender: 'all',
            interests: [],
            location: '',
          },
          targetSports: [],
          budget: '',
          deliverables: [],
          hashtagRequirements: [],
          selectedMatches: [],
          bundleType: 'standard',
          customBundle: null,
          selectedBundle: null,
        }
      }),
      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
      setCampaignId: (id) => set({ campaignId: id }),
      updateForm: (values) => set((state) => ({
        form: {
          ...state.form,
          ...values,
        }
      })),
    }),
    {
      name: 'pro-campaign-wizard',
      // Only store in localStorage, no need for cookies
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

// Create context with default values
const ProWizardContext = createContext<ProWizardState | null>(null);

// Provider component
export const ProWizardProvider = ({ children }: { children: ReactNode }) => {
  const store = useProWizardStore();
  
  return (
    <ProWizardContext.Provider value={store}>
      {children}
    </ProWizardContext.Provider>
  );
};

// Custom hook to access the context
export const useProWizard = () => {
  const context = useContext(ProWizardContext);
  
  if (!context) {
    throw new Error('useProWizard must be used within a ProWizardProvider');
  }
  
  return context;
};