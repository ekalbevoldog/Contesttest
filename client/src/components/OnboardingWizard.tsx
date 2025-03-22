import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AthleteProfileForm from "./AthleteProfileForm";
import BusinessProfileForm from "./BusinessProfileForm";

// Define the wizard steps
enum WizardStep {
  Welcome = 0,
  UserType = 1,
  BasicInfo = 2,
  Preferences = 3,
  Complete = 4,
}

// Define the user types
type UserType = "athlete" | "business" | null;

// Define the preference types for athletes
const athletePreferenceSchema = z.object({
  contentTypes: z.array(z.string()).min(1, "Select at least one content type"),
  partnershipTypes: z.array(z.string()).min(1, "Select at least one partnership type"),
  industryInterests: z.array(z.string()).min(1, "Select at least one industry"),
  minimumBudget: z.string().min(1, "Minimum budget is required"),
});

// Define the preference types for businesses
const businessPreferenceSchema = z.object({
  targetDemographics: z.array(z.string()).min(1, "Select at least one demographic"),
  audienceReach: z.string().min(1, "Audience reach is required"),
  campaignTypes: z.array(z.string()).min(1, "Select at least one campaign type"),
  platformPreferences: z.array(z.string()).min(1, "Select at least one platform"),
});

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.Welcome);
  const [userType, setUserType] = useState<UserType>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [basicInfo, setBasicInfo] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize session
  useEffect(() => {
    async function initSession() {
      try {
        const response = await fetch("/api/chat/session", {
          method: "POST",
          credentials: "include"
        });
        const data = await response.json();
        setSessionId(data.sessionId);
      } catch (error) {
        console.error("Failed to initialize session:", error);
        toast({
          title: "Connection Error",
          description: "Failed to start onboarding session. Please try again.",
          variant: "destructive"
        });
      }
    }
    
    initSession();
  }, [toast]);

  // Update progress based on current step
  useEffect(() => {
    // Calculate progress percentage
    const totalSteps = Object.keys(WizardStep).length / 2 - 1; // Divide by 2 because enum creates both numeric and string keys
    const currentProgress = ((currentStep) / totalSteps) * 100;
    setProgress(currentProgress);
  }, [currentStep]);

  // Handle profile submission
  const profileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return apiRequest("POST", "/api/profile", {
        ...profileData,
        sessionId
      });
    },
    onSuccess: async () => {
      // Move to the preferences step
      setCurrentStep(WizardStep.Preferences);
    },
    onError: (error) => {
      console.error("Error submitting profile:", error);
      toast({
        title: "Profile Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle preferences submission
  const preferencesMutation = useMutation({
    mutationFn: async (preferencesData: any) => {
      return apiRequest("POST", "/api/preferences", {
        ...preferencesData,
        userType,
        sessionId
      });
    },
    onSuccess: async () => {
      // Move to the completion step
      setCurrentStep(WizardStep.Complete);
    },
    onError: (error) => {
      console.error("Error submitting preferences:", error);
      toast({
        title: "Preferences Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handle form submissions
  const handleBasicInfoSubmit = (data: any) => {
    setBasicInfo(data);
    profileMutation.mutate({...data, userType});
  };

  const handlePreferencesSubmit = (data: any) => {
    setPreferences(data);
    preferencesMutation.mutate(data);
  };

  // Navigation functions
  const handleNext = () => {
    setCurrentStep((prev) => {
      const nextStep = prev + 1;
      return nextStep as WizardStep;
    });
  };

  const handleBack = () => {
    setCurrentStep((prev) => {
      const prevStep = prev - 1;
      return prevStep as WizardStep;
    });
  };

  const handleFinish = () => {
    // Navigate to dashboard
    setLocation("/dashboard");
  };

  // Handle user type selection
  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    handleNext();
  };

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.Welcome:
        return (
          <div className="text-center space-y-6">
            <div className="mb-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-r from-[#003366] to-[#0066cc] mx-auto flex items-center justify-center">
                <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#003366] to-[#0066cc]">
              Welcome to Contested!
            </h2>
            <p className="text-gray-500">
              Let's set up your profile to find the perfect partnership matches. This will only take a few minutes.
            </p>
            <Button 
              className="bg-gradient-to-r from-[#003366] to-[#0066cc] hover:from-[#002b55] hover:to-[#0055aa] text-white"
              onClick={handleNext}
            >
              Get Started
            </Button>
          </div>
        );

      case WizardStep.UserType:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">I am a...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                  userType === "athlete" ? "border-primary-600 ring-2 ring-primary-600 bg-primary-50" : "border-gray-200"
                }`}
                onClick={() => handleUserTypeSelect("athlete")}
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#ff9500] to-[#ff7200] flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium">Athlete</h3>
                <p className="text-sm text-gray-500 mt-2">
                  I'm looking for sponsorships, endorsements, or partnership opportunities
                </p>
              </div>
              <div 
                className={`border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                  userType === "business" ? "border-primary-600 ring-2 ring-primary-600 bg-primary-50" : "border-gray-200"
                }`}
                onClick={() => handleUserTypeSelect("business")}
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-[#0066cc] to-[#003366] flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium">Business</h3>
                <p className="text-sm text-gray-500 mt-2">
                  I'm looking to connect with athletes for marketing campaigns or partnerships
                </p>
              </div>
            </div>
          </div>
        );

      case WizardStep.BasicInfo:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Basic Information</h2>
            {userType === "athlete" ? (
              <AthleteProfileForm onSubmit={handleBasicInfoSubmit} isLoading={profileMutation.isPending} />
            ) : (
              <BusinessProfileForm onSubmit={handleBasicInfoSubmit} isLoading={profileMutation.isPending} />
            )}
          </div>
        );

      case WizardStep.Preferences:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Your Preferences</h2>
            {userType === "athlete" ? (
              <AthletePreferencesForm onSubmit={handlePreferencesSubmit} isLoading={preferencesMutation.isPending} />
            ) : (
              <BusinessPreferencesForm onSubmit={handlePreferencesSubmit} isLoading={preferencesMutation.isPending} />
            )}
          </div>
        );

      case WizardStep.Complete:
        return (
          <div className="text-center space-y-6">
            <div className="mb-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-r from-[#00cc88] to-[#00aa77] mx-auto flex items-center justify-center">
                <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold">Setup Complete!</h2>
            <p className="text-gray-500">
              Your profile is ready. We'll start finding perfect matches for you right away.
            </p>
            <Button 
              className="bg-gradient-to-r from-[#00cc88] to-[#00aa77] hover:from-[#00bb77] hover:to-[#009966] text-white"
              onClick={handleFinish}
            >
              Go to Dashboard
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  // Determine if the next button should be disabled
  const nextDisabled = currentStep === WizardStep.UserType && !userType;

  // Determine whether to show navigation buttons
  const showNavButtons = currentStep !== WizardStep.Welcome && 
                         currentStep !== WizardStep.Complete && 
                         currentStep !== WizardStep.BasicInfo &&
                         currentStep !== WizardStep.Preferences;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Contested Onboarding</CardTitle>
              <CardDescription>Step {currentStep + 1} of {Object.keys(WizardStep).length / 2}</CardDescription>
            </div>
            <div className="h-12 w-12">
              <img src="/contested-logo.svg" alt="Contested" className="h-full w-full" />
            </div>
          </div>
        </CardHeader>
        <Progress value={progress} className="w-full h-2" />
        <CardContent className="pt-6 pb-4">
          {renderStepContent()}
        </CardContent>
        {showNavButtons && (
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={nextDisabled}
              className="bg-gradient-to-r from-[#003366] to-[#0066cc] hover:from-[#002b55] hover:to-[#0055aa] text-white"
            >
              Next
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

// Athlete preferences form component
function AthletePreferencesForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void, isLoading: boolean }) {
  const [formData, setFormData] = useState({
    contentTypes: [] as string[],
    partnershipTypes: [] as string[],
    industryInterests: [] as string[],
    minimumBudget: "",
  });

  // Content type options
  const contentTypeOptions = [
    { id: "photos", label: "Photos" },
    { id: "videos", label: "Videos" },
    { id: "reels", label: "Reels/Short Videos" },
    { id: "stories", label: "Stories" },
    { id: "livestreams", label: "Livestreams" },
    { id: "written", label: "Written Content" },
  ];

  // Partnership type options
  const partnershipTypeOptions = [
    { id: "oneTime", label: "One-time Promotion" },
    { id: "ambassador", label: "Brand Ambassador" },
    { id: "affiliate", label: "Affiliate Marketing" },
    { id: "sponsored", label: "Sponsored Content" },
    { id: "eventAppearance", label: "Event Appearances" },
  ];

  // Industry interest options
  const industryOptions = [
    { id: "sports", label: "Sports Equipment/Apparel" },
    { id: "fitness", label: "Fitness/Nutrition" },
    { id: "tech", label: "Technology" },
    { id: "fashion", label: "Fashion" },
    { id: "food", label: "Food & Beverage" },
    { id: "travel", label: "Travel" },
    { id: "gaming", label: "Gaming" },
    { id: "finance", label: "Financial Services" },
  ];

  // Budget options
  const budgetOptions = [
    { id: "any", label: "Any Budget" },
    { id: "500", label: "$500+" },
    { id: "1000", label: "$1,000+" },
    { id: "2500", label: "$2,500+" },
    { id: "5000", label: "$5,000+" },
    { id: "10000", label: "$10,000+" },
  ];

  // Handle checkbox changes
  const handleCheckboxChange = (category: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const currentValues = prev[category] as string[];
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [category]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [category]: [...currentValues, value]
        };
      }
    });
  };

  // Handle radio button changes
  const handleRadioChange = (name: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate form data
      const validatedData = athletePreferenceSchema.parse(formData);
      onSubmit(validatedData);
    } catch (error) {
      console.error("Validation error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Content Types */}
      <div>
        <h3 className="text-lg font-medium mb-3">What type of content do you create?</h3>
        <div className="grid grid-cols-2 gap-3">
          {contentTypeOptions.map(option => (
            <label 
              key={option.id} 
              className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                formData.contentTypes.includes(option.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <input 
                type="checkbox" 
                checked={formData.contentTypes.includes(option.id)} 
                onChange={() => handleCheckboxChange('contentTypes', option.id)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Partnership Types */}
      <div>
        <h3 className="text-lg font-medium mb-3">What types of partnerships are you interested in?</h3>
        <div className="grid grid-cols-2 gap-3">
          {partnershipTypeOptions.map(option => (
            <label 
              key={option.id} 
              className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                formData.partnershipTypes.includes(option.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <input 
                type="checkbox" 
                checked={formData.partnershipTypes.includes(option.id)} 
                onChange={() => handleCheckboxChange('partnershipTypes', option.id)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Industry Interests */}
      <div>
        <h3 className="text-lg font-medium mb-3">Which industries are you most interested in?</h3>
        <div className="grid grid-cols-2 gap-3">
          {industryOptions.map(option => (
            <label 
              key={option.id} 
              className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                formData.industryInterests.includes(option.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <input 
                type="checkbox" 
                checked={formData.industryInterests.includes(option.id)} 
                onChange={() => handleCheckboxChange('industryInterests', option.id)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Minimum Budget */}
      <div>
        <h3 className="text-lg font-medium mb-3">What's your minimum budget requirement?</h3>
        <div className="grid grid-cols-3 gap-3">
          {budgetOptions.map(option => (
            <label 
              key={option.id} 
              className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                formData.minimumBudget === option.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <input 
                type="radio" 
                name="minimumBudget" 
                value={option.id} 
                checked={formData.minimumBudget === option.id} 
                onChange={() => handleRadioChange('minimumBudget', option.id)}
                className="h-4 w-4 text-primary-600 rounded-full"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-[#003366] to-[#0066cc] hover:from-[#002b55] hover:to-[#0055aa] text-white"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </form>
  );
}

// Business preferences form component
function BusinessPreferencesForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void, isLoading: boolean }) {
  const [formData, setFormData] = useState({
    targetDemographics: [] as string[],
    audienceReach: "",
    campaignTypes: [] as string[],
    platformPreferences: [] as string[],
  });

  // Demographic options
  const demographicOptions = [
    { id: "gen_z", label: "Gen Z (18-24)" },
    { id: "millennials", label: "Millennials (25-40)" },
    { id: "gen_x", label: "Gen X (41-56)" },
    { id: "boomers", label: "Baby Boomers (57-75)" },
    { id: "male", label: "Primarily Male" },
    { id: "female", label: "Primarily Female" },
    { id: "parents", label: "Parents" },
    { id: "students", label: "Students" },
  ];

  // Audience reach options
  const audienceOptions = [
    { id: "local", label: "Local (City/Region)" },
    { id: "regional", label: "Regional (Multiple States)" },
    { id: "national", label: "National" },
    { id: "international", label: "International" },
  ];

  // Campaign type options
  const campaignOptions = [
    { id: "product_launch", label: "Product Launch" },
    { id: "brand_awareness", label: "Brand Awareness" },
    { id: "seasonal", label: "Seasonal Campaign" },
    { id: "ongoing", label: "Ongoing Partnership" },
    { id: "event", label: "Event Promotion" },
    { id: "affiliate", label: "Affiliate Program" },
  ];

  // Platform options
  const platformOptions = [
    { id: "instagram", label: "Instagram" },
    { id: "tiktok", label: "TikTok" },
    { id: "youtube", label: "YouTube" },
    { id: "twitter", label: "Twitter" },
    { id: "facebook", label: "Facebook" },
    { id: "twitch", label: "Twitch" },
    { id: "blog", label: "Blog/Website" },
    { id: "in_person", label: "In-Person Events" },
  ];

  // Handle checkbox changes
  const handleCheckboxChange = (category: keyof typeof formData, value: string) => {
    setFormData(prev => {
      const currentValues = prev[category] as string[];
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [category]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [category]: [...currentValues, value]
        };
      }
    });
  };

  // Handle radio button changes
  const handleRadioChange = (name: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate form data
      const validatedData = businessPreferenceSchema.parse(formData);
      onSubmit(validatedData);
    } catch (error) {
      console.error("Validation error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Target Demographics */}
      <div>
        <h3 className="text-lg font-medium mb-3">Who is your target audience?</h3>
        <div className="grid grid-cols-2 gap-3">
          {demographicOptions.map(option => (
            <label 
              key={option.id} 
              className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                formData.targetDemographics.includes(option.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <input 
                type="checkbox" 
                checked={formData.targetDemographics.includes(option.id)} 
                onChange={() => handleCheckboxChange('targetDemographics', option.id)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Audience Reach */}
      <div>
        <h3 className="text-lg font-medium mb-3">What geographical reach are you looking for?</h3>
        <div className="grid grid-cols-2 gap-3">
          {audienceOptions.map(option => (
            <label 
              key={option.id} 
              className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                formData.audienceReach === option.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <input 
                type="radio" 
                name="audienceReach" 
                value={option.id} 
                checked={formData.audienceReach === option.id} 
                onChange={() => handleRadioChange('audienceReach', option.id)}
                className="h-4 w-4 text-primary-600 rounded-full"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Campaign Types */}
      <div>
        <h3 className="text-lg font-medium mb-3">What types of campaigns are you planning?</h3>
        <div className="grid grid-cols-2 gap-3">
          {campaignOptions.map(option => (
            <label 
              key={option.id} 
              className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                formData.campaignTypes.includes(option.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <input 
                type="checkbox" 
                checked={formData.campaignTypes.includes(option.id)} 
                onChange={() => handleCheckboxChange('campaignTypes', option.id)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Platform Preferences */}
      <div>
        <h3 className="text-lg font-medium mb-3">Which platforms do you prefer for partnerships?</h3>
        <div className="grid grid-cols-2 gap-3">
          {platformOptions.map(option => (
            <label 
              key={option.id} 
              className={`flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                formData.platformPreferences.includes(option.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <input 
                type="checkbox" 
                checked={formData.platformPreferences.includes(option.id)} 
                onChange={() => handleCheckboxChange('platformPreferences', option.id)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-[#003366] to-[#0066cc] hover:from-[#002b55] hover:to-[#0055aa] text-white"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </form>
  );
}