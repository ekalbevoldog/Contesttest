import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Icons
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ChevronRight, 
  UserCircle, 
  Building2, 
  Camera, 
  Image, 
  Film, 
  Megaphone, 
  Sparkles, 
  Zap, 
  ArrowDown, 
  FileSearch,
  Instagram,
  Youtube,
  Twitter,
  PenTool,
  PieChart,
  Hash,
  BarChart,
  Users,
  Globe,
  Heart,
  DollarSign,
  Calendar,
  Palette,
  Mic,
  Award,
  Target,
  Clock
} from "lucide-react";

// Define the wizard steps - more granular for a better personalized experience
enum WizardStep {
  Welcome = 0,
  UserType = 1,
  BasicInfo = 2,
  VisualPreferences = 3,
  ContentPreferences = 4,
  TargetAudience = 5,
  BudgetValues = 6,
  StylePreferences = 7,
  GoalsExpectations = 8,
  ReviewConfirm = 9,
  Complete = 10
}

// Define the user types
type UserType = "athlete" | "business" | null;

// Define the schemas for each section with improved validation
const basicInfoSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }).optional(),
  phone: z.string().optional(),
});

const athleteBasicInfoSchema = basicInfoSchema.extend({
  sport: z.string().min(1, { message: "Please select a sport." }),
  division: z.string().min(1, { message: "Please select a division." }),
  school: z.string().min(2, { message: "School must be at least 2 characters." }),
  year: z.string().min(1, { message: "Please select your year." }),
  socialHandles: z.string().optional(),
});

const businessBasicInfoSchema = basicInfoSchema.extend({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  industry: z.string().min(1, { message: "Please select an industry." }),
  companySize: z.string().min(1, { message: "Please select company size." }),
  website: z.string().url({ message: "Please enter a valid URL." }).optional(),
});

const visualPreferencesSchema = z.object({
  preferredImageTypes: z.array(z.string()).min(1, { message: "Select at least one image type." }),
  aestheticStyle: z.array(z.string()).min(1, { message: "Select at least one aesthetic style." }),
  colorSchemes: z.array(z.string()).optional(),
});

const contentPreferencesSchema = z.object({
  contentTypes: z.array(z.string()).min(1, { message: "Select at least one content type." }),
  contentLength: z.string().min(1, { message: "Please select preferred content length." }),
  contentTone: z.array(z.string()).min(1, { message: "Select at least one content tone." }),
  contentFrequency: z.string().min(1, { message: "Please select content frequency." }),
});

const targetAudienceSchema = z.object({
  demographics: z.array(z.string()).min(1, { message: "Select at least one demographic." }),
  geographicReach: z.array(z.string()).min(1, { message: "Select at least one geographic region." }),
  interestCategories: z.array(z.string()).min(1, { message: "Select at least one interest category." }),
});

const budgetValuesSchema = z.object({
  budgetRange: z.object({
    min: z.number(),
    max: z.number()
  }),
  campaignDuration: z.string().min(1, { message: "Please select campaign duration." }),
  valueAlignment: z.array(z.string()).min(1, { message: "Select at least one value." }),
});

const stylePreferencesSchema = z.object({
  brandPersonality: z.array(z.string()).min(1, { message: "Select at least one personality trait." }),
  visualStyle: z.array(z.string()).min(1, { message: "Select at least one visual style." }),
  communicationStyle: z.string().min(1, { message: "Please select communication style." }),
});

const goalsExpectationsSchema = z.object({
  primaryGoals: z.array(z.string()).min(1, { message: "Select at least one primary goal." }),
  successMetrics: z.array(z.string()).min(1, { message: "Select at least one success metric." }),
  timeline: z.string().min(1, { message: "Please select a timeline." }),
  additionalRequirements: z.string().optional(),
});

export default function PersonalizedWizard() {
  // State management
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.Welcome);
  const [userType, setUserType] = useState<UserType>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completionMessage, setCompletionMessage] = useState<string>("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Form data state management - more structured and comprehensive
  const [formData, setFormData] = useState({
    // Basic info
    basicInfo: {
      name: "",
      email: "",
      phone: "",
      // Athlete specific
      sport: "",
      division: "",
      school: "",
      year: "",
      socialHandles: "",
      // Business specific
      companyName: "",
      industry: "",
      companySize: "",
      website: "",
    },
    // Visual preferences
    visualPreferences: {
      preferredImageTypes: [] as string[],
      aestheticStyle: [] as string[],
      colorSchemes: [] as string[],
    },
    // Content preferences
    contentPreferences: {
      contentTypes: [] as string[],
      contentLength: "",
      contentTone: [] as string[],
      contentFrequency: "",
    },
    // Target audience
    targetAudience: {
      demographics: [] as string[],
      geographicReach: [] as string[],
      interestCategories: [] as string[],
    },
    // Budget and values
    budgetValues: {
      budgetRange: { min: 1000, max: 30000 },
      campaignDuration: "",
      valueAlignment: [] as string[],
    },
    // Style preferences
    stylePreferences: {
      brandPersonality: [] as string[],
      visualStyle: [] as string[],
      communicationStyle: "",
    },
    // Goals and expectations
    goalsExpectations: {
      primaryGoals: [] as string[],
      successMetrics: [] as string[],
      timeline: "",
      additionalRequirements: "",
    },
  });

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

  // Profile submission mutation - now connects to the AI-enhanced personalized onboarding endpoint
  const profileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return apiRequest("POST", "/api/personalized-onboarding", {
        ...profileData,
        sessionId,
        userType
      });
    },
    onSuccess: async (response) => {
      try {
        // Parse the response for AI insights and personalized confirmation
        const data = await response.json();
        
        // Store AI insights and recommendations in local storage for dashboard display
        if (data.aiInsights) {
          localStorage.setItem('aiInsights', JSON.stringify(data.aiInsights));
        }
        
        if (data.recommendations) {
          localStorage.setItem('recommendations', JSON.stringify(data.recommendations));
        }
        
        // If there's a campaign generated for a business account, store it
        if (userType === 'business' && data.campaign) {
          localStorage.setItem('campaign', JSON.stringify(data.campaign));
        }
        
        // Store the confirmation message to display on completion page
        if (data.confirmation) {
          setCompletionMessage(data.confirmation);
        }
        
        // Move to final step
        setCurrentStep(WizardStep.Complete);
      } catch (error) {
        console.error("Error processing profile submission response:", error);
        // Still advance to completion step even if parsing the response fails
        setCurrentStep(WizardStep.Complete);
      }
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

  // Generic update function for form data sections
  const updateFormData = (section: keyof typeof formData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  // Handle checkbox array updates
  const handleCheckboxChange = (section: keyof typeof formData, field: string, value: string) => {
    setFormData(prev => {
      const currentSection = prev[section] as any;
      const currentValues = currentSection[field] as string[];
      
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [field]: currentValues.filter(v => v !== value)
          }
        };
      } else {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [field]: [...currentValues, value]
          }
        };
      }
    });
  };

  // Navigation functions
  const handleNext = () => {
    // Validate current step data before proceeding
    if (validateCurrentStep()) {
      setCurrentStep((prev) => {
        const nextStep = prev + 1;
        return nextStep as WizardStep;
      });
    } else {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before continuing.",
        variant: "destructive"
      });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => {
      const prevStep = prev - 1;
      return prevStep as WizardStep;
    });
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    handleNext();
  };

  const handleFinish = () => {
    // Submit the completed profile data
    const completeProfile = {
      ...formData,
      userType
    };
    
    profileMutation.mutate(completeProfile);
  };

  const handleFinishAndDashboard = () => {
    // Navigate to dashboard
    setLocation("/dashboard");
  };

  // Step validation logic
  const validateCurrentStep = (): boolean => {
    try {
      switch (currentStep) {
        case WizardStep.Welcome:
          return true;
          
        case WizardStep.UserType:
          return userType !== null;
          
        case WizardStep.BasicInfo:
          if (userType === "athlete") {
            athleteBasicInfoSchema.parse({
              name: formData.basicInfo.name,
              email: formData.basicInfo.email,
              phone: formData.basicInfo.phone,
              sport: formData.basicInfo.sport,
              division: formData.basicInfo.division,
              school: formData.basicInfo.school,
              year: formData.basicInfo.year,
              socialHandles: formData.basicInfo.socialHandles
            });
          } else {
            businessBasicInfoSchema.parse({
              name: formData.basicInfo.name,
              email: formData.basicInfo.email,
              phone: formData.basicInfo.phone,
              companyName: formData.basicInfo.companyName,
              industry: formData.basicInfo.industry,
              companySize: formData.basicInfo.companySize,
              website: formData.basicInfo.website
            });
          }
          return true;
          
        case WizardStep.VisualPreferences:
          visualPreferencesSchema.parse(formData.visualPreferences);
          return true;
          
        case WizardStep.ContentPreferences:
          contentPreferencesSchema.parse(formData.contentPreferences);
          return true;
          
        case WizardStep.TargetAudience:
          targetAudienceSchema.parse(formData.targetAudience);
          return true;
          
        case WizardStep.BudgetValues:
          budgetValuesSchema.parse(formData.budgetValues);
          return true;
          
        case WizardStep.StylePreferences:
          stylePreferencesSchema.parse(formData.stylePreferences);
          return true;
          
        case WizardStep.GoalsExpectations:
          goalsExpectationsSchema.parse(formData.goalsExpectations);
          return true;
          
        case WizardStep.ReviewConfirm:
          return true;
          
        default:
          return true;
      }
    } catch (error) {
      console.error("Validation error:", error);
      return false;
    }
  };

  // Custom component for checkbox options
  const CheckboxOption = ({ 
    id, 
    label, 
    section, 
    field, 
    description, 
    icon
  }: { 
    id: string; 
    label: string; 
    section: keyof typeof formData; 
    field: string; 
    description?: string;
    icon?: React.ReactNode;
  }) => {
    const values = (formData[section] as any)[field] as string[];
    const isChecked = values.includes(id);
    
    return (
      <div className={`flex items-start space-x-3 border rounded-lg p-4 transition-all cursor-pointer 
        ${isChecked ? 'border-primary bg-primary/5 shadow-sm' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}`}
        onClick={() => handleCheckboxChange(section, field, id)}
      >
        <Checkbox 
          id={`${field}-${id}`} 
          checked={isChecked}
          onCheckedChange={() => handleCheckboxChange(section, field, id)}
          className="mt-1"
        />
        <div className="space-y-1 w-full">
          <div className="flex items-center justify-between">
            <Label 
              htmlFor={`${field}-${id}`}
              className="text-base font-medium cursor-pointer"
            >
              {label}
            </Label>
            {icon && <div className="text-primary">{icon}</div>}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    );
  };

  // Render content based on the current step
  // Component for visual preference selection cards with dynamic feedback
  const VisualPreferenceCard = ({ 
    id, 
    title, 
    description, 
    icon, 
    section,
    field,
    imageSrc 
  }: { 
    id: string; 
    title: string; 
    description: string; 
    icon: React.ReactNode;
    section: keyof typeof formData;
    field: string;
    imageSrc?: string;
  }) => {
    const values = (formData[section] as any)[field] as string[];
    const isSelected = values.includes(id);
    
    return (
      <div 
        className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer
        ${isSelected 
          ? 'border-red-500 shadow-md' 
          : 'border-zinc-200 hover:border-zinc-300'
        }`}
        onClick={() => handleCheckboxChange(section, field, id)}
      >
        {imageSrc ? (
          <div className="h-32 bg-zinc-100 flex items-center justify-center">
            <div className="text-4xl text-zinc-400">{icon}</div>
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-red-500/10 to-amber-500/10 flex items-center justify-center">
            <div className="text-4xl text-red-500">{icon}</div>
          </div>
        )}
        
        <div className="p-4">
          <div className="flex items-start mb-2">
            <div className="mr-2 mt-0.5">
              <Checkbox
                id={`${field}-${id}`}
                checked={isSelected}
                onCheckedChange={() => handleCheckboxChange(section, field, id)}
                className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
              />
            </div>
            <Label 
              htmlFor={`${field}-${id}`}
              className="text-base font-medium cursor-pointer"
            >
              {title}
            </Label>
          </div>
          <p className="text-sm text-zinc-500 ml-6">{description}</p>
        </div>
        
        {isSelected && (
          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case WizardStep.Welcome:
        return (
          <div className="text-center space-y-6 p-4">
            <div className="mb-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-r from-red-500 to-amber-500 mx-auto flex items-center justify-center shadow-lg">
                <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-zinc-900">
              Welcome to Your Personalized Experience
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Let's create a tailored experience just for you. This enhanced onboarding will help us understand your unique preferences, style, and goals to match you with the perfect partnerships.
            </p>
            <Button 
              className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white px-8 py-6 text-lg shadow-md"
              onClick={handleNext}
            >
              Begin Your Personalized Journey
            </Button>
          </div>
        );

      case WizardStep.UserType:
        return (
          <div className="space-y-8 p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">Who are you?</h2>
              <p className="text-zinc-500 mt-2">Choose the option that best represents you</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className={`rounded-xl p-6 cursor-pointer transition-all hover:shadow-md border-2 
                  ${userType === "athlete" 
                    ? "border-red-500 bg-gradient-to-br from-red-50 to-amber-50" 
                    : "border-zinc-200 hover:border-zinc-300"
                  }`}
                onClick={() => handleUserTypeSelect("athlete")}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-r from-red-500 to-amber-500 flex items-center justify-center shadow-md">
                    <UserCircle className="h-8 w-8 text-white" />
                  </div>
                  {userType === "athlete" && (
                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">I'm an Athlete</h3>
                <p className="text-zinc-500">
                  I want to showcase my talent, connect with brands, and build partnerships that align with my personal brand.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm text-zinc-600">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Access to exclusive brand partnerships
                  </li>
                  <li className="flex items-center text-sm text-zinc-600">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Build your personal brand value
                  </li>
                  <li className="flex items-center text-sm text-zinc-600">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Turn your talent into earnings opportunities
                  </li>
                </ul>
              </div>
              
              <div 
                className={`rounded-xl p-6 cursor-pointer transition-all hover:shadow-md border-2 
                  ${userType === "business" 
                    ? "border-red-500 bg-gradient-to-br from-red-50 to-amber-50" 
                    : "border-zinc-200 hover:border-zinc-300"
                  }`}
                onClick={() => handleUserTypeSelect("business")}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-r from-red-500 to-amber-500 flex items-center justify-center shadow-md">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  {userType === "business" && (
                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">I'm a Business</h3>
                <p className="text-zinc-500">
                  I'm looking to connect with authentic athletes who can represent my brand and help us reach new audiences.
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center text-sm text-zinc-600">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Find perfectly matched athletes for your campaigns
                  </li>
                  <li className="flex items-center text-sm text-zinc-600">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Streamlined NIL partnership setup
                  </li>
                  <li className="flex items-center text-sm text-zinc-600">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    All compliance handled within the platform
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );

      case WizardStep.BasicInfo:
        return (
          <div className="space-y-6 p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">Tell us about yourself</h2>
              <p className="text-zinc-500 mt-2">This information helps us create your personalized profile</p>
            </div>
            
            <div className="space-y-4">
              {/* Common fields for both user types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name" 
                    placeholder="Your full name"
                    value={formData.basicInfo.name}
                    onChange={(e) => updateFormData('basicInfo', 'name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="you@example.com"
                    value={formData.basicInfo.email}
                    onChange={(e) => updateFormData('basicInfo', 'email', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="(123) 456-7890"
                  value={formData.basicInfo.phone}
                  onChange={(e) => updateFormData('basicInfo', 'phone', e.target.value)}
                />
              </div>
              
              <Separator className="my-6" />
              
              {/* Conditional fields based on user type */}
              {userType === "athlete" ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Athlete Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sport">Sport <span className="text-red-500">*</span></Label>
                      <Select 
                        value={formData.basicInfo.sport}
                        onValueChange={(value) => updateFormData('basicInfo', 'sport', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your sport" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basketball">Basketball</SelectItem>
                          <SelectItem value="football">Football</SelectItem>
                          <SelectItem value="volleyball">Volleyball</SelectItem>
                          <SelectItem value="baseball">Baseball</SelectItem>
                          <SelectItem value="softball">Softball</SelectItem>
                          <SelectItem value="soccer">Soccer</SelectItem>
                          <SelectItem value="track">Track & Field</SelectItem>
                          <SelectItem value="swimming">Swimming</SelectItem>
                          <SelectItem value="tennis">Tennis</SelectItem>
                          <SelectItem value="golf">Golf</SelectItem>
                          <SelectItem value="lacrosse">Lacrosse</SelectItem>
                          <SelectItem value="hockey">Hockey</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="division">Division <span className="text-red-500">*</span></Label>
                      <Select 
                        value={formData.basicInfo.division}
                        onValueChange={(value) => updateFormData('basicInfo', 'division', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your division" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="D1">Division I</SelectItem>
                          <SelectItem value="D2">Division II</SelectItem>
                          <SelectItem value="D3">Division III</SelectItem>
                          <SelectItem value="NAIA">NAIA</SelectItem>
                          <SelectItem value="JUCO">Junior College</SelectItem>
                          <SelectItem value="HS">High School</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="school">School/University <span className="text-red-500">*</span></Label>
                      <Input 
                        id="school" 
                        placeholder="University of Michigan"
                        value={formData.basicInfo.school}
                        onChange={(e) => updateFormData('basicInfo', 'school', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="year">Year <span className="text-red-500">*</span></Label>
                      <Select 
                        value={formData.basicInfo.year}
                        onValueChange={(value) => updateFormData('basicInfo', 'year', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="freshman">Freshman</SelectItem>
                          <SelectItem value="sophomore">Sophomore</SelectItem>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="graduate">Graduate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="socialHandles">Social Media Handles</Label>
                    <div className="text-xs text-zinc-500 mb-1">
                      For example: @username (Instagram), @username (TikTok)
                    </div>
                    <Input 
                      id="socialHandles" 
                      placeholder="@yourusername (Instagram), @yourusername (TikTok)"
                      value={formData.basicInfo.socialHandles}
                      onChange={(e) => updateFormData('basicInfo', 'socialHandles', e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Business Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company/Brand Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="companyName" 
                        placeholder="Acme Inc."
                        value={formData.basicInfo.companyName}
                        onChange={(e) => updateFormData('basicInfo', 'companyName', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry <span className="text-red-500">*</span></Label>
                      <Select 
                        value={formData.basicInfo.industry}
                        onValueChange={(value) => updateFormData('basicInfo', 'industry', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apparel">Apparel & Fashion</SelectItem>
                          <SelectItem value="sports_equipment">Sports Equipment</SelectItem>
                          <SelectItem value="food_beverage">Food & Beverage</SelectItem>
                          <SelectItem value="health_wellness">Health & Wellness</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="financial">Financial Services</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companySize">Company Size <span className="text-red-500">*</span></Label>
                      <Select 
                        value={formData.basicInfo.companySize}
                        onValueChange={(value) => updateFormData('basicInfo', 'companySize', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        placeholder="https://example.com"
                        value={formData.basicInfo.website}
                        onChange={(e) => updateFormData('basicInfo', 'website', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case WizardStep.VisualPreferences:
        return (
          <div className="space-y-6 p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">Visual Preferences</h2>
              <p className="text-zinc-500 mt-2">
                {userType === "athlete" 
                  ? "Help us understand your visual style to match you with compatible brands" 
                  : "Tell us about the visual content you're looking for in athlete partnerships"}
              </p>
            </div>
            
            <Tabs defaultValue="imageTypes" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="imageTypes" className="text-sm">Content Types</TabsTrigger>
                <TabsTrigger value="aesthetics" className="text-sm">Aesthetic Style</TabsTrigger>
                <TabsTrigger value="colors" className="text-sm">Color Schemes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="imageTypes" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Preferred Image Types <span className="text-red-500">*</span></h3>
                    <p className="text-sm text-zinc-500">Select the types of images you prefer to create or receive</p>
                  </div>
                  {formData.visualPreferences.preferredImageTypes.length > 0 && (
                    <Badge variant="outline" className="bg-zinc-100">
                      {formData.visualPreferences.preferredImageTypes.length} selected
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <VisualPreferenceCard
                    id="lifestyle"
                    title="Lifestyle/Candid"
                    description="Natural, authentic moments from daily life"
                    icon={<Camera />}
                    section="visualPreferences"
                    field="preferredImageTypes"
                  />
                  <VisualPreferenceCard
                    id="studio"
                    title="Professional/Studio"
                    description="High-quality, polished studio shots"
                    icon={<Image />}
                    section="visualPreferences"
                    field="preferredImageTypes"
                  />
                  <VisualPreferenceCard
                    id="action"
                    title="Action/Performance"
                    description="Dynamic shots showing skills in action"
                    icon={<Zap />}
                    section="visualPreferences"
                    field="preferredImageTypes"
                  />
                  <VisualPreferenceCard
                    id="product"
                    title="Product Integration"
                    description="Content featuring products naturally"
                    icon={<FileSearch />}
                    section="visualPreferences"
                    field="preferredImageTypes"
                  />
                </div>
                
                <div className="py-4">
                  <h4 className="text-base font-medium mb-2">Do you prefer to include your face in content?</h4>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Show face in content</p>
                      <p className="text-xs text-zinc-500">This helps set expectations for brand partnerships</p>
                    </div>
                    <Switch
                      checked={formData.visualPreferences.preferredImageTypes.includes('face')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleCheckboxChange('visualPreferences', 'preferredImageTypes', 'face');
                        } else {
                          handleCheckboxChange('visualPreferences', 'preferredImageTypes', 'face');
                        }
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="aesthetics" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Aesthetic Style <span className="text-red-500">*</span></h3>
                    <p className="text-sm text-zinc-500">What visual aesthetic resonates most with you?</p>
                  </div>
                  {formData.visualPreferences.aestheticStyle.length > 0 && (
                    <Badge variant="outline" className="bg-zinc-100">
                      {formData.visualPreferences.aestheticStyle.length} selected
                    </Badge>
                  )}
                </div>
                
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    <VisualPreferenceCard
                      id="bold"
                      title="Bold & Vibrant"
                      description="High-energy, colorful, attention-grabbing"
                      icon={<Sparkles />}
                      section="visualPreferences"
                      field="aestheticStyle"
                    />
                    <VisualPreferenceCard
                      id="minimal"
                      title="Clean & Minimal"
                      description="Simple, uncluttered, modern aesthetics"
                      icon={<PenTool />}
                      section="visualPreferences"
                      field="aestheticStyle"
                    />
                    <VisualPreferenceCard
                      id="authentic"
                      title="Raw & Authentic"
                      description="Genuine, unfiltered, documentary style"
                      icon={<Camera />}
                      section="visualPreferences"
                      field="aestheticStyle"
                    />
                    <VisualPreferenceCard
                      id="luxury"
                      title="Premium & Polished"
                      description="Sophisticated, high-end, perfectly composed"
                      icon={<Award />}
                      section="visualPreferences"
                      field="aestheticStyle"
                    />
                    <VisualPreferenceCard
                      id="retro"
                      title="Vintage & Retro"
                      description="Nostalgic, throwback vibes, film-inspired"
                      icon={<Film />}
                      section="visualPreferences"
                      field="aestheticStyle"
                    />
                    <VisualPreferenceCard
                      id="edgy"
                      title="Edgy & Urban"
                      description="Street style, bold, trendsetting"
                      icon={<Hash />}
                      section="visualPreferences"
                      field="aestheticStyle"
                    />
                    <VisualPreferenceCard
                      id="sporty"
                      title="Athletic & Dynamic"
                      description="Performance-focused, high-energy active style"
                      icon={<Zap />}
                      section="visualPreferences"
                      field="aestheticStyle"
                    />
                    <VisualPreferenceCard
                      id="natural"
                      title="Natural & Organic"
                      description="Environmentally conscious, earthy aesthetic"
                      icon={<Globe />}
                      section="visualPreferences"
                      field="aestheticStyle"
                    />
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="colors" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Color Preferences</h3>
                  <p className="text-sm text-zinc-500">What color schemes would best represent your brand identity?</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm flex flex-col items-center
                      ${formData.visualPreferences.colorSchemes.includes('vibrant') ? 'border-red-500' : 'border-zinc-200'}`}
                    onClick={() => handleCheckboxChange('visualPreferences', 'colorSchemes', 'vibrant')}
                  >
                    <div className="flex space-x-1 mb-3">
                      <div className="w-6 h-6 rounded-full bg-red-500"></div>
                      <div className="w-6 h-6 rounded-full bg-yellow-500"></div>
                      <div className="w-6 h-6 rounded-full bg-blue-500"></div>
                      <div className="w-6 h-6 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-sm font-medium">Vibrant</span>
                    <p className="text-xs text-zinc-500 text-center mt-1">Energetic, youthful, bold</p>
                  </div>
                  
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm flex flex-col items-center
                      ${formData.visualPreferences.colorSchemes.includes('monochrome') ? 'border-red-500' : 'border-zinc-200'}`}
                    onClick={() => handleCheckboxChange('visualPreferences', 'colorSchemes', 'monochrome')}
                  >
                    <div className="flex space-x-1 mb-3">
                      <div className="w-6 h-6 rounded-full bg-black"></div>
                      <div className="w-6 h-6 rounded-full bg-zinc-700"></div>
                      <div className="w-6 h-6 rounded-full bg-zinc-400"></div>
                      <div className="w-6 h-6 rounded-full bg-white border border-zinc-300"></div>
                    </div>
                    <span className="text-sm font-medium">Monochrome</span>
                    <p className="text-xs text-zinc-500 text-center mt-1">Timeless, sleek, modern</p>
                  </div>
                  
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm flex flex-col items-center
                      ${formData.visualPreferences.colorSchemes.includes('earth') ? 'border-red-500' : 'border-zinc-200'}`}
                    onClick={() => handleCheckboxChange('visualPreferences', 'colorSchemes', 'earth')}
                  >
                    <div className="flex space-x-1 mb-3">
                      <div className="w-6 h-6 rounded-full bg-amber-700"></div>
                      <div className="w-6 h-6 rounded-full bg-green-800"></div>
                      <div className="w-6 h-6 rounded-full bg-stone-500"></div>
                      <div className="w-6 h-6 rounded-full bg-amber-200"></div>
                    </div>
                    <span className="text-sm font-medium">Earth Tones</span>
                    <p className="text-xs text-zinc-500 text-center mt-1">Natural, warm, authentic</p>
                  </div>
                  
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm flex flex-col items-center
                      ${formData.visualPreferences.colorSchemes.includes('pastel') ? 'border-red-500' : 'border-zinc-200'}`}
                    onClick={() => handleCheckboxChange('visualPreferences', 'colorSchemes', 'pastel')}
                  >
                    <div className="flex space-x-1 mb-3">
                      <div className="w-6 h-6 rounded-full bg-pink-200"></div>
                      <div className="w-6 h-6 rounded-full bg-blue-200"></div>
                      <div className="w-6 h-6 rounded-full bg-green-200"></div>
                      <div className="w-6 h-6 rounded-full bg-yellow-200"></div>
                    </div>
                    <span className="text-sm font-medium">Pastels</span>
                    <p className="text-xs text-zinc-500 text-center mt-1">Soft, friendly, approachable</p>
                  </div>
                </div>
                
                <div className="mt-6 p-4 border rounded-lg bg-zinc-50">
                  <h4 className="text-base font-medium mb-2 flex items-center">
                    <Palette className="h-5 w-5 mr-2 text-zinc-500" />
                    Color Harmony Tip
                  </h4>
                  <p className="text-sm text-zinc-600">
                    Your color preferences help us match you with brands or athletes that share complementary visual styles.
                    Consistent color schemes increase brand recognition by up to 80% and can make your content more memorable.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      case WizardStep.ContentPreferences:
        return (
          <div className="space-y-6 p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">Content Preferences</h2>
              <p className="text-zinc-500 mt-2">Tell us about the types of content you prefer</p>
            </div>
            
            <Tabs defaultValue="contentTypes" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="contentTypes" className="text-sm">Content Types</TabsTrigger>
                <TabsTrigger value="contentTone" className="text-sm">Tone & Voice</TabsTrigger>
                <TabsTrigger value="contentFrequency" className="text-sm">Frequency & Length</TabsTrigger>
              </TabsList>
              
              <TabsContent value="contentTypes" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Content Types <span className="text-red-500">*</span></h3>
                    <p className="text-sm text-zinc-500">Select the types of content you're most interested in</p>
                  </div>
                  {formData.contentPreferences.contentTypes.length > 0 && (
                    <Badge variant="outline" className="bg-zinc-100">
                      {formData.contentPreferences.contentTypes.length} selected
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  <VisualPreferenceCard 
                    id="photos" 
                    title="Photos/Images" 
                    section="contentPreferences" 
                    field="contentTypes"
                    description="Still images for social media or websites"
                    icon={<Image />}
                  />
                  <VisualPreferenceCard 
                    id="reels" 
                    title="Short-form Videos" 
                    section="contentPreferences" 
                    field="contentTypes"
                    description="Brief, engaging video clips (15-60 seconds)"
                    icon={<Film />}
                  />
                  <VisualPreferenceCard 
                    id="longVideos" 
                    title="Long-form Videos" 
                    section="contentPreferences" 
                    field="contentTypes"
                    description="In-depth video content (1+ minutes)"
                    icon={<Film />}
                  />
                  <VisualPreferenceCard 
                    id="stories" 
                    title="Stories/Ephemeral" 
                    section="contentPreferences" 
                    field="contentTypes"
                    description="24-hour content for Instagram, Snapchat, etc."
                    icon={<Sparkles />}
                  />
                  <VisualPreferenceCard 
                    id="lives" 
                    title="Livestreams" 
                    section="contentPreferences" 
                    field="contentTypes"
                    description="Real-time streaming content"
                    icon={<Zap />}
                  />
                  <VisualPreferenceCard 
                    id="ugc" 
                    title="User-Generated Content" 
                    section="contentPreferences" 
                    field="contentTypes"
                    description="Authentic content created in personal style"
                    icon={<UserCircle />}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="contentTone" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Content Tone <span className="text-red-500">*</span></h3>
                    <p className="text-sm text-zinc-500">What tone resonates most with your brand or personal style?</p>
                  </div>
                  {formData.contentPreferences.contentTone.length > 0 && (
                    <Badge variant="outline" className="bg-zinc-100">
                      {formData.contentPreferences.contentTone.length} selected
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  <VisualPreferenceCard 
                    id="informative" 
                    title="Informative & Educational" 
                    section="contentPreferences" 
                    field="contentTone"
                    description="Teaching new skills or sharing knowledge"
                    icon={<Mic />}
                  />
                  <VisualPreferenceCard 
                    id="entertaining" 
                    title="Fun & Entertaining" 
                    section="contentPreferences" 
                    field="contentTone"
                    description="Engaging and enjoyable to consume"
                    icon={<Sparkles />}
                  />
                  <VisualPreferenceCard 
                    id="inspirational" 
                    title="Inspirational & Motivational" 
                    section="contentPreferences" 
                    field="contentTone"
                    description="Uplifting and encouraging"
                    icon={<Award />}
                  />
                  <VisualPreferenceCard 
                    id="authentic" 
                    title="Authentic & Personal" 
                    section="contentPreferences" 
                    field="contentTone"
                    description="Genuine, unfiltered, real-life content"
                    icon={<Heart />}
                  />
                  <VisualPreferenceCard 
                    id="professional" 
                    title="Professional & Polished" 
                    section="contentPreferences" 
                    field="contentTone"
                    description="Refined, high-quality production"
                    icon={<Globe />}
                  />
                  <VisualPreferenceCard 
                    id="humorous" 
                    title="Humorous & Light-hearted" 
                    section="contentPreferences" 
                    field="contentTone"
                    description="Funny, witty, entertaining content"
                    icon={<Image />}
                  />
                </div>
                
                <div className="mt-6 p-4 border rounded-lg bg-zinc-50">
                  <h4 className="text-base font-medium mb-2 flex items-center">
                    <PenTool className="h-5 w-5 mr-2 text-zinc-500" />
                    Tone Matching Insight
                  </h4>
                  <p className="text-sm text-zinc-600">
                    Selecting content tones that align with both your personal style and brand values leads to more authentic partnerships.
                    Our AI matching system will prioritize partnerships where tone preferences are compatible between athletes and businesses.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="contentFrequency" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Content Length <span className="text-red-500">*</span></h3>
                    <p className="text-sm text-zinc-500">What content length do you prefer working with?</p>
                  </div>
                  
                  <RadioGroup 
                    value={formData.contentPreferences.contentLength}
                    onValueChange={(value) => updateFormData('contentPreferences', 'contentLength', value)}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2"
                  >
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                      ${formData.contentPreferences.contentLength === 'short' ? 'border-red-500 bg-red-50' : 'border-zinc-200'}`}>
                      <RadioGroupItem value="short" id="length-short" className="sr-only" />
                      <Label htmlFor="length-short" className="flex flex-col cursor-pointer">
                        <div className="flex justify-center mb-3">
                          <Clock className="h-8 w-8 text-red-500 opacity-80" />
                        </div>
                        <span className="font-medium text-center">Micro Content</span>
                        <span className="text-sm text-zinc-500 mt-1 text-center">15-30 seconds or single images</span>
                      </Label>
                    </div>
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                      ${formData.contentPreferences.contentLength === 'medium' ? 'border-red-500 bg-red-50' : 'border-zinc-200'}`}>
                      <RadioGroupItem value="medium" id="length-medium" className="sr-only" />
                      <Label htmlFor="length-medium" className="flex flex-col cursor-pointer">
                        <div className="flex justify-center mb-3">
                          <Clock className="h-8 w-8 text-amber-500 opacity-80" />
                        </div>
                        <span className="font-medium text-center">Medium Content</span>
                        <span className="text-sm text-zinc-500 mt-1 text-center">30-90 seconds or carousel posts</span>
                      </Label>
                    </div>
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                      ${formData.contentPreferences.contentLength === 'long' ? 'border-red-500 bg-red-50' : 'border-zinc-200'}`}>
                      <RadioGroupItem value="long" id="length-long" className="sr-only" />
                      <Label htmlFor="length-long" className="flex flex-col cursor-pointer">
                        <div className="flex justify-center mb-3">
                          <Clock className="h-8 w-8 text-green-500 opacity-80" />
                        </div>
                        <span className="font-medium text-center">Long-form Content</span>
                        <span className="text-sm text-zinc-500 mt-1 text-center">1+ minutes or in-depth series</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold">Content Frequency <span className="text-red-500">*</span></h3>
                    <p className="text-sm text-zinc-500">How frequently do you prefer to create or receive content?</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-zinc-50 mb-4">
                    <p className="text-sm text-zinc-600">
                      This helps set expectations for partnership deliverables. Select what best fits your schedule or campaign needs.
                    </p>
                  </div>
                  
                  <RadioGroup 
                    value={formData.contentPreferences.contentFrequency}
                    onValueChange={(value) => updateFormData('contentPreferences', 'contentFrequency', value)}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2"
                  >
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                      ${formData.contentPreferences.contentFrequency === 'daily' ? 'border-red-500 bg-red-50' : 'border-zinc-200'}`}>
                      <RadioGroupItem value="daily" id="freq-daily" className="sr-only" />
                      <Label htmlFor="freq-daily" className="cursor-pointer font-medium flex flex-col items-center">
                        <Calendar className="h-6 w-6 mb-2 text-zinc-700" />
                        <span>Daily</span>
                      </Label>
                    </div>
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                      ${formData.contentPreferences.contentFrequency === 'weekly' ? 'border-red-500 bg-red-50' : 'border-zinc-200'}`}>
                      <RadioGroupItem value="weekly" id="freq-weekly" className="sr-only" />
                      <Label htmlFor="freq-weekly" className="cursor-pointer font-medium flex flex-col items-center">
                        <Calendar className="h-6 w-6 mb-2 text-zinc-700" />
                        <span>Weekly</span>
                      </Label>
                    </div>
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                      ${formData.contentPreferences.contentFrequency === 'biweekly' ? 'border-red-500 bg-red-50' : 'border-zinc-200'}`}>
                      <RadioGroupItem value="biweekly" id="freq-biweekly" className="sr-only" />
                      <Label htmlFor="freq-biweekly" className="cursor-pointer font-medium flex flex-col items-center">
                        <Calendar className="h-6 w-6 mb-2 text-zinc-700" />
                        <span>Bi-weekly</span>
                      </Label>
                    </div>
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                      ${formData.contentPreferences.contentFrequency === 'monthly' ? 'border-red-500 bg-red-50' : 'border-zinc-200'}`}>
                      <RadioGroupItem value="monthly" id="freq-monthly" className="sr-only" />
                      <Label htmlFor="freq-monthly" className="cursor-pointer font-medium flex flex-col items-center">
                        <Calendar className="h-6 w-6 mb-2 text-zinc-700" />
                        <span>Monthly</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      // Additional steps would be implemented similarly
      // For brevity, I'll just show placeholders for the remaining steps
      case WizardStep.TargetAudience:
        return (
          <div className="space-y-6 p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">Target Audience</h2>
              <p className="text-zinc-500 mt-2">
                {userType === "athlete" 
                  ? "What audience do you connect with best?" 
                  : "Who are you trying to reach through athlete partnerships?"}
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Demographics <span className="text-red-500">*</span></h3>
                <p className="text-sm text-zinc-500">Select all relevant demographics you want to reach</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  <CheckboxOption 
                    id="gen_z" 
                    label="Gen Z (18-24)" 
                    section="targetAudience" 
                    field="demographics"
                  />
                  <CheckboxOption 
                    id="millennials" 
                    label="Millennials (25-40)" 
                    section="targetAudience" 
                    field="demographics"
                  />
                  <CheckboxOption 
                    id="gen_x" 
                    label="Gen X (41-56)" 
                    section="targetAudience" 
                    field="demographics"
                  />
                  <CheckboxOption 
                    id="boomers" 
                    label="Baby Boomers (57-75)" 
                    section="targetAudience" 
                    field="demographics"
                  />
                  <CheckboxOption 
                    id="male" 
                    label="Primarily Male" 
                    section="targetAudience" 
                    field="demographics"
                  />
                  <CheckboxOption 
                    id="female" 
                    label="Primarily Female" 
                    section="targetAudience" 
                    field="demographics"
                  />
                  <CheckboxOption 
                    id="parents" 
                    label="Parents" 
                    section="targetAudience" 
                    field="demographics"
                  />
                  <CheckboxOption 
                    id="students" 
                    label="Students" 
                    section="targetAudience" 
                    field="demographics"
                  />
                  <CheckboxOption 
                    id="professionals" 
                    label="Young Professionals" 
                    section="targetAudience" 
                    field="demographics"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Geographic Reach <span className="text-red-500">*</span></h3>
                <p className="text-sm text-zinc-500">Where is your audience located?</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <CheckboxOption 
                    id="local" 
                    label="Local (City/Region)" 
                    section="targetAudience" 
                    field="geographicReach"
                  />
                  <CheckboxOption 
                    id="state" 
                    label="State-wide" 
                    section="targetAudience" 
                    field="geographicReach"
                  />
                  <CheckboxOption 
                    id="regional" 
                    label="Regional (Multiple States)" 
                    section="targetAudience" 
                    field="geographicReach"
                  />
                  <CheckboxOption 
                    id="national" 
                    label="National" 
                    section="targetAudience" 
                    field="geographicReach"
                  />
                  <CheckboxOption 
                    id="international" 
                    label="International" 
                    section="targetAudience" 
                    field="geographicReach"
                  />
                  <CheckboxOption 
                    id="global" 
                    label="Global" 
                    section="targetAudience" 
                    field="geographicReach"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Interest Categories <span className="text-red-500">*</span></h3>
                <p className="text-sm text-zinc-500">What interests does your audience have?</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  <CheckboxOption 
                    id="fitness" 
                    label="Fitness & Health" 
                    section="targetAudience" 
                    field="interestCategories"
                  />
                  <CheckboxOption 
                    id="sports" 
                    label="Sports & Athletics" 
                    section="targetAudience" 
                    field="interestCategories"
                  />
                  <CheckboxOption 
                    id="fashion" 
                    label="Fashion & Style" 
                    section="targetAudience" 
                    field="interestCategories"
                  />
                  <CheckboxOption 
                    id="tech" 
                    label="Technology & Gadgets" 
                    section="targetAudience" 
                    field="interestCategories"
                  />
                  <CheckboxOption 
                    id="food" 
                    label="Food & Nutrition" 
                    section="targetAudience" 
                    field="interestCategories"
                  />
                  <CheckboxOption 
                    id="entertainment" 
                    label="Entertainment & Media" 
                    section="targetAudience" 
                    field="interestCategories"
                  />
                  <CheckboxOption 
                    id="education" 
                    label="Education & Learning" 
                    section="targetAudience" 
                    field="interestCategories"
                  />
                  <CheckboxOption 
                    id="travel" 
                    label="Travel & Adventure" 
                    section="targetAudience" 
                    field="interestCategories"
                  />
                  <CheckboxOption 
                    id="gaming" 
                    label="Gaming & Esports" 
                    section="targetAudience" 
                    field="interestCategories"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case WizardStep.BudgetValues:
        return (
          <div className="space-y-6 p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">Budget & Values</h2>
              <p className="text-zinc-500 mt-2">Tell us about your budget expectations and core values</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Budget Range <span className="text-red-500">*</span></h3>
                <p className="text-sm text-zinc-500">
                  {userType === "athlete" 
                    ? "What partnership budget range are you looking for?" 
                    : "What budget range are you considering for athlete partnerships?"}
                </p>
                
                <div className="bg-zinc-50 p-6 rounded-lg space-y-6 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">${formData.budgetValues.budgetRange.min}</span>
                    <span className="text-lg font-medium">${formData.budgetValues.budgetRange.max}</span>
                  </div>
                  
                  {/* Use two separate sliders for min and max budget */}
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-zinc-600 mb-2">Minimum Budget: ${formData.budgetValues.budgetRange.min}</p>
                      <Slider
                        defaultValue={[formData.budgetValues.budgetRange.min]}
                        max={30000}
                        min={500}
                        step={500}
                        className="w-full"
                        onValueChange={([value]) => 
                          updateFormData('budgetValues', 'budgetRange', { 
                            min: value, 
                            max: Math.max(value, formData.budgetValues.budgetRange.max) 
                          })
                        }
                      />
                    </div>
                    
                    <div>
                      <p className="text-sm text-zinc-600 mb-2">Maximum Budget: ${formData.budgetValues.budgetRange.max}</p>
                      <Slider
                        defaultValue={[formData.budgetValues.budgetRange.max]}
                        max={30000}
                        min={500}
                        step={500}
                        className="w-full"
                        onValueChange={([value]) => 
                          updateFormData('budgetValues', 'budgetRange', { 
                            min: Math.min(formData.budgetValues.budgetRange.min, value),
                            max: value 
                          })
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-zinc-500">
                    <span>$500</span>
                    <span>$10,000</span>
                    <span>$20,000</span>
                    <span>$30,000+</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Campaign Duration <span className="text-red-500">*</span></h3>
                <p className="text-sm text-zinc-500">What partnership duration are you most interested in?</p>
                
                <RadioGroup 
                  value={formData.budgetValues.campaignDuration}
                  onValueChange={(value) => updateFormData('budgetValues', 'campaignDuration', value)}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2"
                >
                  <div className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                    ${formData.budgetValues.campaignDuration === 'oneTime' ? 'border-primary bg-primary/5' : 'border-zinc-200'}`}>
                    <RadioGroupItem value="oneTime" id="duration-one" className="sr-only" />
                    <Label htmlFor="duration-one" className="flex flex-col cursor-pointer">
                      <span className="font-medium">One-time</span>
                      <span className="text-sm text-zinc-500 mt-1">Single post or campaign</span>
                    </Label>
                  </div>
                  <div className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                    ${formData.budgetValues.campaignDuration === 'shortTerm' ? 'border-primary bg-primary/5' : 'border-zinc-200'}`}>
                    <RadioGroupItem value="shortTerm" id="duration-short" className="sr-only" />
                    <Label htmlFor="duration-short" className="flex flex-col cursor-pointer">
                      <span className="font-medium">Short-term</span>
                      <span className="text-sm text-zinc-500 mt-1">1-3 month partnership</span>
                    </Label>
                  </div>
                  <div className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                    ${formData.budgetValues.campaignDuration === 'longTerm' ? 'border-primary bg-primary/5' : 'border-zinc-200'}`}>
                    <RadioGroupItem value="longTerm" id="duration-long" className="sr-only" />
                    <Label htmlFor="duration-long" className="flex flex-col cursor-pointer">
                      <span className="font-medium">Long-term</span>
                      <span className="text-sm text-zinc-500 mt-1">6+ month relationship</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Value Alignment <span className="text-red-500">*</span></h3>
                <p className="text-sm text-zinc-500">Which values are most important to you in partnerships?</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  <CheckboxOption 
                    id="authenticity" 
                    label="Authenticity" 
                    section="budgetValues" 
                    field="valueAlignment"
                  />
                  <CheckboxOption 
                    id="diversity" 
                    label="Diversity & Inclusion" 
                    section="budgetValues" 
                    field="valueAlignment"
                  />
                  <CheckboxOption 
                    id="sustainability" 
                    label="Sustainability" 
                    section="budgetValues" 
                    field="valueAlignment"
                  />
                  <CheckboxOption 
                    id="innovation" 
                    label="Innovation" 
                    section="budgetValues" 
                    field="valueAlignment"
                  />
                  <CheckboxOption 
                    id="community" 
                    label="Community Impact" 
                    section="budgetValues" 
                    field="valueAlignment"
                  />
                  <CheckboxOption 
                    id="quality" 
                    label="Quality & Excellence" 
                    section="budgetValues" 
                    field="valueAlignment"
                  />
                  <CheckboxOption 
                    id="education" 
                    label="Education & Development" 
                    section="budgetValues" 
                    field="valueAlignment"
                  />
                  <CheckboxOption 
                    id="wellness" 
                    label="Health & Wellness" 
                    section="budgetValues" 
                    field="valueAlignment"
                  />
                  <CheckboxOption 
                    id="trust" 
                    label="Trust & Transparency" 
                    section="budgetValues" 
                    field="valueAlignment"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      
      case WizardStep.StylePreferences:
        return (
          <div className="space-y-6 p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">Style Preferences</h2>
              <p className="text-zinc-500 mt-2">Let's understand your personal style and brand personality</p>
            </div>
            
            {/* Full implementation would go here */}
            <div className="text-center p-8 border border-dashed rounded-lg">
              <p>Style preferences form fields would appear here with brand personality traits, visual style options, and communication preferences</p>
            </div>
          </div>
        );
        
      case WizardStep.GoalsExpectations:
        return (
          <div className="space-y-6 p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">Goals & Expectations</h2>
              <p className="text-zinc-500 mt-2">Define what success looks like for your partnerships</p>
            </div>
            
            {/* Full implementation would go here */}
            <div className="text-center p-8 border border-dashed rounded-lg">
              <p>Goals and expectations form fields would appear here with primary objectives, success metrics, and timeline preferences</p>
            </div>
          </div>
        );
        
      case WizardStep.ReviewConfirm:
        return (
          <div className="space-y-6 p-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">Review & Confirm</h2>
              <p className="text-zinc-500 mt-2">Please review your information before finalizing</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-zinc-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold border-b pb-2 mb-3">Profile Summary</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="text-sm">
                        <span className="text-zinc-500">Name:</span> {formData.basicInfo.name}
                      </div>
                      {userType === "athlete" ? (
                        <>
                          <div className="text-sm">
                            <span className="text-zinc-500">Sport:</span> {formData.basicInfo.sport}
                          </div>
                          <div className="text-sm">
                            <span className="text-zinc-500">School:</span> {formData.basicInfo.school}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm">
                            <span className="text-zinc-500">Company:</span> {formData.basicInfo.companyName}
                          </div>
                          <div className="text-sm">
                            <span className="text-zinc-500">Industry:</span> {formData.basicInfo.industry}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Content & Style</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.contentPreferences.contentTypes.map(type => (
                        <Badge key={type} variant="outline" className="bg-zinc-100">{type}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Budget Range</h4>
                    <div className="text-sm mt-1">
                      ${formData.budgetValues.budgetRange.min} - ${formData.budgetValues.budgetRange.max}
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-zinc-500 italic">
                By submitting this profile, you agree to our terms of service and privacy policy. Your information will be used to create better matches.
              </p>
              
              <div className="flex justify-center pt-4">
                <Button 
                  className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white px-8 py-2 shadow-md"
                  onClick={handleFinish}
                  disabled={profileMutation.isPending}
                >
                  {profileMutation.isPending ? "Submitting..." : "Submit Profile"}
                </Button>
              </div>
            </div>
          </div>
        );

      case WizardStep.Complete:
        return (
          <div className="text-center space-y-6 p-4">
            <div className="mb-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto flex items-center justify-center shadow-lg">
                <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-zinc-900">Setup Complete!</h2>
            <div className="max-w-lg mx-auto">
              {completionMessage ? (
                <div className="text-lg text-zinc-600 mb-4 p-6 border rounded-lg bg-zinc-50">
                  {completionMessage}
                </div>
              ) : (
                <>
                  <p className="text-lg text-zinc-600 mb-4">
                    Your personalized profile has been created successfully. We'll use your preferences to find the perfect matches for you.
                  </p>
                  <p className="text-zinc-500 mb-8">
                    Our AI-powered matching algorithm is already working to connect you with {userType === "athlete" ? "brands" : "athletes"} that align with your preferences and values.
                  </p>
                </>
              )}
            </div>
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 text-lg shadow-md"
              onClick={handleFinishAndDashboard}
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
  const showNavButtons = ![
    WizardStep.Welcome,
    WizardStep.Complete,
    WizardStep.ReviewConfirm
  ].includes(currentStep);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-zinc-50 to-zinc-100">
      <Card className="w-full max-w-4xl shadow-lg border-zinc-200/80">
        <CardHeader className="border-b pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center space-x-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                  Contested
                </span>
                <span className="text-lg text-zinc-600">
                  Personalized Onboarding
                </span>
              </CardTitle>
              <CardDescription className="text-zinc-500">
                Step {currentStep + 1} of {Object.keys(WizardStep).length / 2}
              </CardDescription>
            </div>
            <div className="h-12 w-12">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-amber-500"></div>
            </div>
          </div>
        </CardHeader>
        <Progress value={progress} className="w-full h-1" />
        <CardContent className="pt-6 pb-4">
          {renderStepContent()}
        </CardContent>
        {showNavButtons && (
          <CardFooter className="flex justify-between border-t pt-4">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={nextDisabled}
              className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white flex items-center"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}