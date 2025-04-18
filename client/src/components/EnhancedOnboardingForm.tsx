import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { getOnboardingSteps, normalizeSteps, isRestrictedIndustry, OnboardingStep } from '@/lib/onboarding-service';

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
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ChevronRight, 
  UserCircle, 
  Building2, 
  Image, 
  Film, 
  Sparkles, 
  Zap, 
  PieChart,
  Users,
  Globe,
  Heart,
  DollarSign,
  Calendar,
  Palette,
  Award,
  Target,
  Clock,
  BookOpen,
  BarChart3,
  Briefcase,
  Info,
  CheckCircle
} from "lucide-react";

// Define wizard steps enum for more modularity
enum WizardStep {
  Welcome = 0,
  UserTypeSelection = 1,
  BasicProfile = 2,
  BusinessDetails = 3,
  AthleteDetails = 4,
  BrandValues = 5,
  Goals = 6,
  AudienceInfo = 7,
  Compensation = 8,
  ReviewSubmit = 9,
  Complete = 10
}

// Form data types
interface FormData {
  userType: 'athlete' | 'business' | null;
  basicProfile: Record<string, any>;
  athleteDetails?: Record<string, any>;
  businessDetails?: Record<string, any>;
  brandValues: Record<string, any>;
  goals: Record<string, any>;
  audienceInfo: Record<string, any>;
  compensation?: Record<string, any>;
}

// Import already added at the top of the file

// Field type definitions
type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'boolean' | 'slider' | 'multi_select' | 'date' | 'tel' | 'email' | 'password' | 'dropdown' | 'slider_float';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  options?: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    color?: string;
  }>;
  pattern?: string;
  min?: number;
  max?: number;
  defaultValue?: any;
  placeholder?: string;
  conditional?: {
    field: string;
    value: any;
  };
}

// Main component
export default function EnhancedOnboardingForm({ 
  initialUserType = null,
  onComplete,
  sessionId = null
}: { 
  initialUserType?: 'athlete' | 'business' | null;
  onComplete: (data: any) => void;
  sessionId?: string | null;
}) {
  // References
  const formContainerRef = useRef<HTMLDivElement>(null);
  
  // State management
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    initialUserType ? WizardStep.BasicProfile : WizardStep.Welcome
  );
  const [userType, setUserType] = useState<'athlete' | 'business' | null>(initialUserType);
  const [formData, setFormData] = useState<FormData>({
    userType: initialUserType,
    basicProfile: {},
    athleteDetails: {},
    businessDetails: {},
    brandValues: {},
    goals: {},
    audienceInfo: {},
    compensation: {}
  });
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();

  // Create a new session if needed
  useEffect(() => {
    if (!activeSessionId) {
      createSession();
    }
  }, [activeSessionId]);
  
  async function createSession() {
    try {
      const response = await fetch("/api/chat/session", {
        method: "POST",
        credentials: "include"
      });
      const data = await response.json();
      setActiveSessionId(data.sessionId);
    } catch (error) {
      console.error("Failed to create session:", error);
      toast({
        title: "Connection Error",
        description: "Unable to start a new session. Please try again.",
        variant: "destructive"
      });
    }
  }

  // Update progress based on current step
  useEffect(() => {
    // Calculate progress
    const totalSteps = Object.keys(WizardStep).length / 2 - 1; // -1 for Complete step
    const currentProgress = (currentStep / totalSteps) * 100;
    setProgress(currentProgress);
    
    // Scroll to top on step change
    if (formContainerRef.current) {
      formContainerRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  // Get fields for the current step
  const getFieldsForCurrentStep = (): FormField[] => {
    switch (currentStep) {
      case WizardStep.BasicProfile:
        return [
          {
            id: 'name',
            type: 'text',
            label: userType === 'athlete' ? 'Full Name' : 'Business Name',
            required: true,
            placeholder: userType === 'athlete' ? 'John Doe' : 'Acme Corporation',
            tooltip: userType === 'business' ? 'Enter your official business name as it appears on legal documents' : 'Enter your full legal name'
          },
          {
            id: 'email',
            type: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'email@example.com'
          },
          {
            id: 'phone',
            type: 'tel',
            label: 'Phone Number',
            placeholder: '(555) 123-4567',
            pattern: '[0-9]{3}-[0-9]{3}-[0-9]{4}'
          }
        ];

      case WizardStep.AthleteDetails:
        if (userType !== 'athlete') return [];
        return [
          {
            id: 'sport',
            type: 'select',
            label: 'Primary Sport',
            required: true,
            options: [
              { id: 'football', label: 'Football' },
              { id: 'basketball', label: 'Basketball' },
              { id: 'soccer', label: 'Soccer' },
              { id: 'baseball', label: 'Baseball' },
              { id: 'track', label: 'Track & Field' },
              { id: 'other', label: 'Other' }
            ]
          },
          {
            id: 'position',
            type: 'text',
            label: 'Position/Role',
            placeholder: 'Quarterback, Forward, etc.'
          },
          {
            id: 'university',
            type: 'text',
            label: 'University/Organization',
            required: true,
            placeholder: 'University of Example'
          },
          {
            id: 'eligibility_status',
            type: 'select',
            label: 'Eligibility Status',
            required: true,
            options: [
              { id: 'NCAA', label: 'NCAA' },
              { id: 'NAIA', label: 'NAIA' },
              { id: 'NJCAA', label: 'NJCAA' },
              { id: 'Other', label: 'Other' }
            ]
          },
          {
            id: 'dob',
            type: 'date',
            label: 'Date of Birth',
            required: true
          }
        ];

      case WizardStep.BusinessDetails:
        if (userType !== 'business') return [];
        return [
          {
            id: 'account_type',
            type: 'radio',
            label: 'Product or Service?',
            required: true,
            options: [
              { id: 'product', label: 'Product-based Business', description: 'We sell physical or digital products' },
              { id: 'service', label: 'Service-based Business', description: 'We provide services to customers' }
            ]
          },
          {
            id: 'industry',
            type: 'select',
            label: 'Industry',
            required: true,
            options: [
              { id: 'retail', label: 'Retail' },
              { id: 'food', label: 'Food & Beverage' },
              { id: 'tech', label: 'Technology' },
              { id: 'fitness', label: 'Fitness & Health' },
              { id: 'apparel', label: 'Apparel & Fashion' },
              { id: 'entertainment', label: 'Entertainment' },
              { id: 'cannabis', label: 'Cannabis', color: 'amber' },
              { id: 'gambling', label: 'Gambling', color: 'amber' },
              { id: 'alcohol', label: 'Alcohol', color: 'amber' },
              { id: 'tobacco', label: 'Tobacco', color: 'amber' },
              { id: 'adult', label: 'Adult Content', color: 'amber' },
              { id: 'other', label: 'Other' }
            ],
            tooltip: 'Some industries have special regulations for NIL partnerships'
          },
          {
            id: 'business_size',
            type: 'select',
            label: 'Business Size',
            required: true,
            options: [
              { id: '1-10', label: '1-10 employees' },
              { id: '11-50', label: '11-50 employees' },
              { id: '51-200', label: '51-200 employees' },
              { id: '201-500', label: '201-500 employees' },
              { id: '500+', label: '500+ employees' }
            ]
          },
          {
            id: 'zip_code',
            type: 'text',
            label: 'Zip Code',
            required: true,
            pattern: '\\d{5}',
            placeholder: '12345'
          }
        ];

      case WizardStep.BrandValues:
        return [
          {
            id: 'values',
            type: 'multi_select',
            label: userType === 'athlete' ? 'Personal Values' : 'Brand Values',
            description: 'Select values that align with you',
            required: true,
            options: [
              { id: 'authenticity', label: 'Authenticity' },
              { id: 'innovation', label: 'Innovation' },
              { id: 'community', label: 'Community' },
              { id: 'sustainability', label: 'Sustainability' },
              { id: 'diversity', label: 'Diversity & Inclusion' },
              { id: 'excellence', label: 'Excellence' },
              { id: 'education', label: 'Education' },
              { id: 'wellness', label: 'Health & Wellness' },
              { id: 'social_impact', label: 'Social Impact' }
            ]
          },
          {
            id: 'has_partnered_before',
            type: 'boolean',
            label: userType === 'athlete' ? 'Have you worked with brands before?' : 'Have you partnered with athletes before?',
            required: true
          }
        ];

      case WizardStep.Goals:
        if (userType === 'athlete') {
          return [
            {
              id: 'goals',
              type: 'multi_select',
              label: 'Partnership Goals',
              description: 'What do you hope to achieve?',
              required: true,
              options: [
                { id: 'income', label: 'Generate Income' },
                { id: 'exposure', label: 'Gain Exposure' },
                { id: 'career', label: 'Career Advancement' },
                { id: 'product', label: 'Access to Products/Services' },
                { id: 'community', label: 'Community Impact' },
                { id: 'network', label: 'Networking Opportunities' }
              ]
            },
            {
              id: 'preferred_industries',
              type: 'multi_select',
              label: 'Preferred Industries',
              options: [
                { id: 'fitness', label: 'Fitness' },
                { id: 'fashion', label: 'Fashion' },
                { id: 'food', label: 'Food & Beverage' },
                { id: 'tech', label: 'Tech' },
                { id: 'lifestyle', label: 'Lifestyle' },
                { id: 'education', label: 'Education' },
                { id: 'entertainment', label: 'Entertainment' },
                { id: 'sports', label: 'Sports Equipment' }
              ]
            }
          ];
        } else {
          return [
            {
              id: 'goals',
              type: 'multi_select',
              label: 'Campaign Goals',
              description: 'What do you hope to achieve?',
              required: true,
              options: [
                { id: 'awareness', label: 'Brand Awareness' },
                { id: 'content', label: 'Content Creation' },
                { id: 'activation', label: 'Local Activation' },
                { id: 'event', label: 'Event Presence' },
                { id: 'conversion', label: 'Conversion Performance' }
              ]
            },
            {
              id: 'target_schools_sports',
              type: 'textarea',
              label: 'Target Schools/Sports',
              description: 'Any specific schools, teams, or sports you want to target?',
              placeholder: 'e.g., University of Florida football, NCAA Division I basketball'
            }
          ];
        }

      case WizardStep.AudienceInfo:
        if (userType === 'athlete') {
          return [
            {
              id: 'audience_size',
              type: 'select',
              label: 'Audience Size',
              required: true,
              options: [
                { id: 'under1k', label: 'Under 1,000 followers' },
                { id: '1k-5k', label: '1,000 - 5,000 followers' },
                { id: '5k-10k', label: '5,000 - 10,000 followers' },
                { id: '10k-50k', label: '10,000 - 50,000 followers' },
                { id: '50k-100k', label: '50,000 - 100,000 followers' },
                { id: '100k-plus', label: 'Over 100,000 followers' }
              ]
            },
            {
              id: 'social_links',
              type: 'text',
              label: 'Social Media Handles',
              placeholder: '@yourhandle',
              description: 'Add your primary social media handle'
            }
          ];
        } else {
          return [
            {
              id: 'audience_goals',
              type: 'multi_select',
              label: 'Target Audience',
              description: 'Who do you want to reach?',
              required: true,
              options: [
                { id: 'gen_z', label: 'Gen Z (18-24)' },
                { id: 'millennials', label: 'Millennials (25-40)' },
                { id: 'gen_x', label: 'Gen X (41-56)' },
                { id: 'families', label: 'Families' },
                { id: 'students', label: 'College Students' },
                { id: 'sports_fans', label: 'Sports Fans' },
                { id: 'local', label: 'Local Community' }
              ]
            },
            {
              id: 'campaign_vibe',
              type: 'select',
              label: 'Campaign Vibe',
              required: true,
              options: [
                { id: 'fun', label: 'Fun & Energetic' },
                { id: 'authentic', label: 'Authentic & Relatable' },
                { id: 'professional', label: 'Professional & Polished' },
                { id: 'educational', label: 'Educational & Informative' },
                { id: 'inspirational', label: 'Inspirational' }
              ]
            }
          ];
        }

      case WizardStep.Compensation:
        if (userType === 'athlete') {
          return [
            {
              id: 'compensation_goals',
              type: 'select',
              label: 'Compensation Goals',
              required: true,
              options: [
                { id: 'paid', label: 'Paid partnerships only' },
                { id: 'product', label: 'Product/service exchanges acceptable' },
                { id: 'mixed', label: 'Mix of paid and product exchanges' },
                { id: 'flexible', label: 'Flexible, depends on opportunity' }
              ]
            }
          ];
        } else {
          return [
            {
              id: 'budget_range',
              type: 'slider',
              label: 'Budget Range',
              required: true,
              min: 0,
              max: 100000
            }
          ];
        }

      default:
        return [];
    }
  };

  // Get section title and description
  const getSectionInfo = () => {
    switch (currentStep) {
      case WizardStep.Welcome:
        return {
          title: "Welcome to Contested",
          description: "Let's personalize your experience to find the perfect partnerships",
          icon: <Sparkles className="h-8 w-8 text-primary" />
        };
      case WizardStep.UserTypeSelection:
        return {
          title: "Who are you?",
          description: "Select your account type to customize your experience",
          icon: <UserCircle className="h-8 w-8 text-primary" />
        };
      case WizardStep.BasicProfile:
        return {
          title: userType === 'athlete' ? "Athlete Profile" : "Business Profile",
          description: "Let's start with the basics",
          icon: userType === 'athlete' ? <UserCircle className="h-8 w-8 text-primary" /> : <Building2 className="h-8 w-8 text-primary" />
        };
      case WizardStep.AthleteDetails:
        return {
          title: "Sports Background",
          description: "Tell us about your athletic career",
          icon: <Award className="h-8 w-8 text-primary" />
        };
      case WizardStep.BusinessDetails:
        return {
          title: "Business Details",
          description: "Tell us more about your business",
          icon: <Briefcase className="h-8 w-8 text-primary" />
        };
      case WizardStep.BrandValues:
        return {
          title: "Values & Experience",
          description: "What values matter to you?",
          icon: <Heart className="h-8 w-8 text-primary" />
        };
      case WizardStep.Goals:
        return {
          title: "Partnership Goals",
          description: "What do you hope to achieve?",
          icon: <Target className="h-8 w-8 text-primary" />
        };
      case WizardStep.AudienceInfo:
        return {
          title: userType === 'athlete' ? "Audience & Reach" : "Target Audience",
          description: userType === 'athlete' ? "Tell us about your followers" : "Who do you want to reach?",
          icon: <Users className="h-8 w-8 text-primary" />
        };
      case WizardStep.Compensation:
        return {
          title: userType === 'athlete' ? "Compensation Expectations" : "Budget Information",
          description: userType === 'athlete' ? "What are your compensation goals?" : "What's your budget for athlete partnerships?",
          icon: <DollarSign className="h-8 w-8 text-primary" />
        };
      case WizardStep.ReviewSubmit:
        return {
          title: "Review & Submit",
          description: "Let's check everything before finalizing",
          icon: <CheckCircle className="h-8 w-8 text-primary" />
        };
      case WizardStep.Complete:
        return {
          title: "Profile Complete!",
          description: "Your personalized profile is ready",
          icon: <CheckCircle className="h-8 w-8 text-primary" />
        };
      default:
        return {
          title: "Onboarding",
          description: "",
          icon: null
        };
    }
  };

  // Handle field value changes
  const handleInputChange = (fieldId: string, value: any) => {
    const currentSection = getCurrentSection();
    
    setFormData(prev => {
      const sectionData = prev[currentSection] as Record<string, any> || {};
      return {
        ...prev,
        [currentSection]: {
          ...sectionData,
          [fieldId]: value
        }
      };
    });
    
    // Clear error for this field if it exists
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Get current form section based on step
  const getCurrentSection = (): keyof FormData => {
    switch (currentStep) {
      case WizardStep.BasicProfile:
        return 'basicProfile';
      case WizardStep.AthleteDetails:
        return 'athleteDetails';
      case WizardStep.BusinessDetails:
        return 'businessDetails';
      case WizardStep.BrandValues:
        return 'brandValues';
      case WizardStep.Goals:
        return 'goals';
      case WizardStep.AudienceInfo:
        return 'audienceInfo';
      case WizardStep.Compensation:
        return 'compensation';
      default:
        return 'basicProfile';
    }
  };

  // Validate current step fields
  const validateCurrentStep = (): boolean => {
    const fields = getFieldsForCurrentStep();
    const currentSection = getCurrentSection();
    const sectionData = formData[currentSection] as Record<string, any> || {};
    
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    fields.forEach(field => {
      if (field.required && !sectionData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
        isValid = false;
      }
      
      // Add pattern validation
      if (field.pattern && sectionData[field.id] && !new RegExp(field.pattern).test(sectionData[field.id])) {
        newErrors[field.id] = `Invalid format for ${field.label}`;
        isValid = false;
      }
    });
    
    setFieldErrors(newErrors);
    return isValid;
  };

  // Navigation functions
  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive"
      });
      return;
    }
    
    setAnimationDirection('forward');
    
    let nextStep: WizardStep;
    
    // Handle conditional flow based on user type
    if (currentStep === WizardStep.BasicProfile) {
      nextStep = userType === 'athlete' ? WizardStep.AthleteDetails : WizardStep.BusinessDetails;
    } else if (currentStep === WizardStep.AthleteDetails || currentStep === WizardStep.BusinessDetails) {
      nextStep = WizardStep.BrandValues;
    } else if (currentStep === WizardStep.AudienceInfo) {
      nextStep = WizardStep.Compensation;
    } else if (currentStep === WizardStep.Compensation) {
      nextStep = WizardStep.ReviewSubmit;
    } else {
      nextStep = currentStep + 1 as WizardStep;
    }
    
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    setAnimationDirection('backward');
    
    let prevStep: WizardStep;
    
    // Handle conditional flow for back navigation
    if (currentStep === WizardStep.BrandValues) {
      prevStep = userType === 'athlete' ? WizardStep.AthleteDetails : WizardStep.BusinessDetails;
    } else if (currentStep === WizardStep.Compensation) {
      prevStep = WizardStep.AudienceInfo;
    } else if (currentStep === WizardStep.ReviewSubmit) {
      prevStep = WizardStep.Compensation;
    } else {
      prevStep = Math.max(0, currentStep - 1) as WizardStep;
    }
    
    setCurrentStep(prevStep);
  };

  const handleUserTypeSelect = (type: 'athlete' | 'business') => {
    setAnimationDirection('forward');
    setUserType(type);
    setFormData(prev => ({
      ...prev,
      userType: type
    }));
    handleNext();
  };

  // Submit form data
  const handleSubmit = async () => {
    if (!activeSessionId || !userType) {
      toast({
        title: "Error",
        description: "Missing session ID or user type",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for submission based on user type
      const submissionData = {
        sessionId: activeSessionId,
        ...formData  // formData already contains userType
      };

      // Submit to personalized onboarding endpoint
      const response = await apiRequest("POST", "/api/personalized-onboarding", submissionData);
      const data = await response.json();

      // Set recommendations if available
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }

      // Move to complete step
      setCurrentStep(WizardStep.Complete);
      
      // Notify success
      toast({
        title: "Profile Submitted",
        description: "Your profile has been successfully created!",
        variant: "default"
      });
      
      // Call completion handler with the processed data
      onComplete(data);
    } catch (error) {
      console.error("Error submitting profile:", error);
      toast({
        title: "Submission Error",
        description: "Failed to submit your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render form field based on type
  const renderField = (field: FormField) => {
    const currentSection = getCurrentSection();
    const sectionData = formData[currentSection] as Record<string, any> || {};
    const value = sectionData[field.id];
    const error = fieldErrors[field.id];
    
    // Check if this field should be conditionally shown
    if (field.conditional) {
      const conditionField = field.conditional.field;
      const conditionValue = field.conditional.value;
      
      if (Array.isArray(conditionValue)) {
        if (!conditionValue.includes(sectionData[conditionField])) {
          return null;
        }
      } else if (sectionData[conditionField] !== conditionValue) {
        return null;
      }
    }
    
    // Create label with optional tooltip
    const fieldLabel = (
      <div className="flex items-center gap-1">
        <Label 
          htmlFor={field.id}
          className={`${field.required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}`}
        >
          {field.label}
        </Label>
        
        {field.tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{field.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div className="space-y-2">
            {fieldLabel}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.id}
              type={field.type}
              value={value || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'textarea':
        return (
          <div className="space-y-2">
            {fieldLabel}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Textarea
              id={field.id}
              value={value || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'select':
        return (
          <div className="space-y-2">
            {fieldLabel}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Select
              value={value || ''}
              onValueChange={(val) => handleInputChange(field.id, val)}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem 
                    key={option.id} 
                    value={option.id}
                    className={option.color ? `text-${option.color}-600` : ''}
                  >
                    <div className="flex items-center gap-2">
                      {option.icon && <span>{option.icon}</span>}
                      <span>{option.label}</span>
                      {option.color && (
                        <Badge variant="outline" className={`bg-${option.color}-100 text-${option.color}-800 border-${option.color}-200`}>
                          Restricted
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'radio':
        return (
          <div className="space-y-3">
            {fieldLabel}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <RadioGroup
              value={value || ''}
              onValueChange={(val) => handleInputChange(field.id, val)}
              className={error ? 'border-red-500 p-2 rounded-md border' : ''}
            >
              <div className="space-y-3">
                {field.options?.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-start space-x-3 rounded-md border p-3 hover:bg-accent cursor-pointer"
                    onClick={() => handleInputChange(field.id, option.id)}
                  >
                    <RadioGroupItem 
                      value={option.id} 
                      id={`${field.id}-${option.id}`} 
                      className="mt-1"
                    />
                    <div>
                      <Label 
                        htmlFor={`${field.id}-${option.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      {option.description && (
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'checkbox':
      case 'multi_select':
        const isMultiSelect = field.type === 'multi_select';
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {fieldLabel}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <div className={`space-y-2 ${error ? 'border-red-500 p-2 rounded-md border' : ''}`}>
              {isMultiSelect ? (
                <div className="flex flex-wrap gap-2">
                  {field.options?.map((option) => {
                    const isSelected = selectedValues.includes(option.id);
                    return (
                      <Badge
                        key={option.id}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer py-1.5 px-3 text-sm ${isSelected ? 'bg-primary' : 'hover:bg-primary/10'}`}
                        onClick={() => {
                          const newValues = isSelected
                            ? selectedValues.filter(v => v !== option.id)
                            : [...selectedValues, option.id];
                          handleInputChange(field.id, newValues);
                        }}
                      >
                        {isSelected && <Check className="mr-1 h-3.5 w-3.5" />}
                        {option.label}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {field.options?.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${field.id}-${option.id}`}
                        checked={selectedValues.includes(option.id)}
                        onCheckedChange={(checked) => {
                          const newValues = checked
                            ? [...selectedValues, option.id]
                            : selectedValues.filter(v => v !== option.id);
                          handleInputChange(field.id, newValues);
                        }}
                      />
                      <Label
                        htmlFor={`${field.id}-${option.id}`}
                        className="cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'boolean':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {fieldLabel}
              <Switch
                id={field.id}
                checked={!!value}
                onCheckedChange={(checked) => handleInputChange(field.id, checked)}
              />
            </div>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'date':
        return (
          <div className="space-y-2">
            {fieldLabel}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="date"
              value={value || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'slider':
        return (
          <div className="space-y-4">
            {fieldLabel}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  ${field.min?.toLocaleString() || '0'}
                </span>
                <span className="text-sm font-medium">
                  ${value?.toLocaleString() || '0'}
                </span>
                <span className="text-sm text-muted-foreground">
                  ${field.max?.toLocaleString() || '100,000'}
                </span>
              </div>
              <input
                type="range"
                min={field.min || 0}
                max={field.max || 100000}
                value={value || 0}
                onChange={(e) => handleInputChange(field.id, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
        
      case 'password':
        return (
          <div className="space-y-2">
            {fieldLabel}
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="password"
              value={value || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );
        
      default:
        return null;
    }
  };

  // Render welcome screen
  const renderWelcomeScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      className="space-y-8 text-center"
    >
      {/* Apple-like floating icon with gradient */}
      <motion.div 
        className="mx-auto w-28 h-28 relative"
        animate={{ 
          y: [0, -8, 0], 
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut"
        }}
      >
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-red-500/80 via-amber-500/80 to-red-500/80 blur-[20px] opacity-30 -z-10"></div>
        <div className="w-full h-full rounded-[32px] backdrop-blur-md bg-gradient-to-br from-red-500/20 via-amber-500/20 to-red-600/20 border border-white/10 flex items-center justify-center shadow-lg">
          <Sparkles className="h-12 w-12 text-white" />
        </div>
      </motion.div>
      
      <div className="space-y-3">
        <motion.h2 
          className="text-4xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Welcome to Contested
        </motion.h2>
        <motion.p 
          className="text-zinc-400 text-lg max-w-2xl mx-auto font-light leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Let's personalize your experience to help you find the perfect athlete-brand 
          partnerships that match your specific goals and values.
        </motion.p>
      </div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
      >
        <Button 
          onClick={() => {
            setAnimationDirection('forward');
            handleNext();
          }}
          className="mt-8 px-10 h-14 rounded-full text-lg font-medium bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
        >
          Get Started <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </motion.div>
  );

  // Render user type selection
  const renderUserTypeSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: animationDirection === 'forward' ? 20 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: animationDirection === 'forward' ? -20 : 20 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      className="space-y-8"
    >
      <motion.div 
        className="text-center space-y-3 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-3xl font-bold text-white tracking-tight">Who are you?</h2>
        <p className="text-zinc-400 text-lg">
          Select your account type to customize your experience
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          className={`relative overflow-hidden backdrop-blur-sm rounded-3xl cursor-pointer transition-all duration-300 
            ${userType === 'athlete' 
              ? 'ring-2 ring-red-500/70 shadow-lg shadow-red-500/10 bg-gradient-to-br from-zinc-900/90 to-zinc-800/90' 
              : 'bg-zinc-900/40 hover:bg-zinc-800/70 border border-white/5'}`}
          onClick={() => handleUserTypeSelect('athlete')}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Background gradient effect */}
          {userType === 'athlete' && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-amber-500/10 to-red-600/5 opacity-70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          <div className="flex flex-col items-center text-center space-y-6 p-8 relative z-10">
            <motion.div 
              className="w-24 h-24 relative"
              animate={{ 
                y: userType === 'athlete' ? [0, -5, 0] : 0,
              }}
              transition={{
                repeat: userType === 'athlete' ? Infinity : 0,
                duration: 3,
                ease: "easeInOut"
              }}
            >
              <div className={`absolute inset-0 rounded-2xl ${userType === 'athlete' ? 'bg-gradient-to-br from-red-500 to-amber-500 blur-[20px] opacity-30' : 'bg-zinc-700/30 blur-[10px] opacity-0'} -z-10`}></div>
              <div className={`w-full h-full rounded-2xl border backdrop-blur-md flex items-center justify-center 
                ${userType === 'athlete' 
                  ? 'bg-gradient-to-br from-red-500/20 to-amber-500/20 border-white/20 shadow-lg' 
                  : 'bg-zinc-800/50 border-white/5'}`}>
                <UserCircle className={`h-12 w-12 ${userType === 'athlete' ? 'text-white' : 'text-zinc-400'}`} />
              </div>
            </motion.div>
            
            <div className="space-y-3">
              <h3 className={`text-2xl font-bold ${userType === 'athlete' ? 'text-white' : 'text-zinc-200'}`}>I'm an Athlete</h3>
              <p className={`${userType === 'athlete' ? 'text-zinc-300' : 'text-zinc-400'} text-base`}>
                I'm a college athlete looking to partner with brands for NIL deals
              </p>
              
              <div className="pt-3 space-y-3">
                {[
                  "Find brand partnerships",
                  "Monetize your influence", 
                  "Stay NCAA compliant"
                ].map((feature, i) => (
                  <motion.div 
                    key={i}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (i * 0.1), duration: 0.5 }}
                  >
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full ${userType === 'athlete' ? 'bg-red-500/20 text-red-500' : 'bg-zinc-700/50 text-zinc-400'}`}>
                      <Check className="h-3 w-3" />
                    </div>
                    <span className={`text-left text-sm ${userType === 'athlete' ? 'text-zinc-300' : 'text-zinc-400'}`}>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
          className={`relative overflow-hidden backdrop-blur-sm rounded-3xl cursor-pointer transition-all duration-300
            ${userType === 'business' 
              ? 'ring-2 ring-amber-500/70 shadow-lg shadow-amber-500/10 bg-gradient-to-br from-zinc-900/90 to-zinc-800/90' 
              : 'bg-zinc-900/40 hover:bg-zinc-800/70 border border-white/5'}`}
          onClick={() => handleUserTypeSelect('business')}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Background gradient effect */}
          {userType === 'business' && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-red-500/10 to-amber-600/5 opacity-70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          <div className="flex flex-col items-center text-center space-y-6 p-8 relative z-10">
            <motion.div 
              className="w-24 h-24 relative"
              animate={{ 
                y: userType === 'business' ? [0, -5, 0] : 0,
              }}
              transition={{
                repeat: userType === 'business' ? Infinity : 0,
                duration: 3,
                ease: "easeInOut"
              }}
            >
              <div className={`absolute inset-0 rounded-2xl ${userType === 'business' ? 'bg-gradient-to-br from-amber-500 to-red-500 blur-[20px] opacity-30' : 'bg-zinc-700/30 blur-[10px] opacity-0'} -z-10`}></div>
              <div className={`w-full h-full rounded-2xl border backdrop-blur-md flex items-center justify-center 
                ${userType === 'business' 
                  ? 'bg-gradient-to-br from-amber-500/20 to-red-500/20 border-white/20 shadow-lg' 
                  : 'bg-zinc-800/50 border-white/5'}`}>
                <Building2 className={`h-12 w-12 ${userType === 'business' ? 'text-white' : 'text-zinc-400'}`} />
              </div>
            </motion.div>
            
            <div className="space-y-3">
              <h3 className={`text-2xl font-bold ${userType === 'business' ? 'text-white' : 'text-zinc-200'}`}>I'm a Business</h3>
              <p className={`${userType === 'business' ? 'text-zinc-300' : 'text-zinc-400'} text-base`}>
                I represent a brand looking to connect with college athletes
              </p>
              
              <div className="pt-3 space-y-3">
                {[
                  "Access athlete talent", 
                  "Create authentic campaigns", 
                  "Measure marketing ROI"
                ].map((feature, i) => (
                  <motion.div 
                    key={i}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (i * 0.1), duration: 0.5 }}
                  >
                    <div className={`flex items-center justify-center w-5 h-5 rounded-full ${userType === 'business' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-700/50 text-zinc-400'}`}>
                      <Check className="h-3 w-3" />
                    </div>
                    <span className={`text-left text-sm ${userType === 'business' ? 'text-zinc-300' : 'text-zinc-400'}`}>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Render form fields
  const renderFormFields = () => {
    const fields = getFieldsForCurrentStep();
    let stepTitle = ""; 
    
    // Determine step title based on current step
    switch (currentStep) {
      case WizardStep.BasicProfile:
        stepTitle = "Basic Profile";
        break;
      case WizardStep.AthleteDetails:
        stepTitle = "Your Athletic Profile";
        break;
      case WizardStep.BusinessDetails:
        stepTitle = "Business Details";
        break;
      case WizardStep.BrandValues:
        stepTitle = "Your Values";
        break;
      case WizardStep.Goals:
        stepTitle = "Partnership Goals";
        break; 
      case WizardStep.AudienceInfo:
        stepTitle = "Audience Information";
        break;
      case WizardStep.Compensation:
        stepTitle = "Compensation Preferences";
        break;
      default:
        stepTitle = "Profile Information";
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: animationDirection === 'forward' ? 20 : -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: animationDirection === 'forward' ? -20 : 20 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="space-y-8"
      >
        <motion.div 
          className="text-center mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-3xl font-bold text-white tracking-tight">{stepTitle}</h2>
          <p className="text-zinc-400 mt-2">
            {currentStep === WizardStep.BasicProfile && "Let's get to know you better"}
            {currentStep === WizardStep.AthleteDetails && "Tell us about your athletic journey"}
            {currentStep === WizardStep.BusinessDetails && "Tell us about your business"}
            {currentStep === WizardStep.BrandValues && "What matters most to you?"}
            {currentStep === WizardStep.Goals && "What do you hope to achieve?"}
            {currentStep === WizardStep.AudienceInfo && "Tell us about your audience"}
            {currentStep === WizardStep.Compensation && "Let's talk about compensation"}
          </p>
        </motion.div>
        
        <div className="space-y-6 backdrop-blur-sm bg-zinc-900/30 rounded-3xl border border-white/5 p-6">
          {fields.map((field, index) => (
            <motion.div 
              key={field.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (index * 0.08), duration: 0.5, type: "spring" }}
              className="space-y-4"
            >
              {renderField(field)}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  // Render review screen
  const renderReviewScreen = () => {
    // Format data for display
    const getSectionData = (section: keyof FormData, index: number) => {
      const data = formData[section];
      if (!data || Object.keys(data).length === 0) return null;
      
      // Get an icon based on section type
      const getSectionIcon = () => {
        switch(section) {
          case 'basicProfile': return <UserCircle className="h-5 w-5 text-white" />;
          case 'athleteDetails': return <Award className="h-5 w-5 text-white" />;
          case 'businessDetails': return <Building2 className="h-5 w-5 text-white" />;
          case 'brandValues': return <Heart className="h-5 w-5 text-white" />;
          case 'goals': return <Target className="h-5 w-5 text-white" />;
          case 'audienceInfo': return <Users className="h-5 w-5 text-white" />;
          case 'compensation': return <DollarSign className="h-5 w-5 text-white" />;
          default: return <Info className="h-5 w-5 text-white" />;
        }
      };
      
      return (
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 + (index * 0.1), type: "spring" }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-amber-500">
              {getSectionIcon()}
            </div>
            <h3 className="text-lg font-bold text-white capitalize">
              {section.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
          </div>
          
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-4 space-y-3">
            {Object.entries(data).map(([key, value], i) => (
              <motion.div 
                key={key} 
                className="flex justify-between items-start py-2 border-b border-white/5 last:border-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (i * 0.05), duration: 0.3 }}
              >
                <div className="text-zinc-400 capitalize text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="text-white font-medium text-right">
                  {Array.isArray(value) 
                    ? value.join(', ') 
                    : typeof value === 'boolean'
                      ? value ? 'Yes' : 'No'
                      : value || '-'}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      );
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: animationDirection === 'forward' ? 20 : -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: animationDirection === 'forward' ? -20 : 20 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="space-y-8"
      >
        <motion.div 
          className="text-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-red-500 to-amber-500">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Review Your Profile</h2>
          <p className="text-zinc-400 mt-2">
            Please check your information before submitting
          </p>
        </motion.div>
        
        <ScrollArea className="h-[480px] pr-4">
          <div className="space-y-6">
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-amber-500">
                  {userType === 'athlete' ? (
                    <UserCircle className="h-5 w-5 text-white" />
                  ) : (
                    <Building2 className="h-5 w-5 text-white" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-white">Account Type</h3>
              </div>
              
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-white/5 p-4">
                <div className="font-medium text-white capitalize flex items-center gap-2">
                  <motion.div 
                    className="h-3 w-3 rounded-full bg-gradient-to-br from-green-400 to-green-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                  {userType}
                </div>
              </div>
            </motion.div>
            
            {getSectionData('basicProfile', 0)}
            {userType === 'athlete' && getSectionData('athleteDetails', 1)}
            {userType === 'business' && getSectionData('businessDetails', 1)}
            {getSectionData('brandValues', 2)}
            {getSectionData('goals', 3)}
            {getSectionData('audienceInfo', 4)}
            {getSectionData('compensation', 5)}
          </div>
        </ScrollArea>
      </motion.div>
    );
  };

  // Render completed screen
  const renderCompletedScreen = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      className="space-y-10 text-center"
    >
      {/* Success icon with gradient animation */}
      <div className="relative mx-auto w-32 h-32">
        <motion.div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 blur-[30px] opacity-40"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3,
            ease: "easeInOut" 
          }}
        />
        
        <motion.div 
          className="absolute inset-0 rounded-full"
          initial={{ borderWidth: 0, borderColor: "rgba(255,255,255,0)" }}
          animate={{ 
            borderWidth: [0, 4, 0],
            borderColor: ["rgba(255,255,255,0)", "rgba(255,255,255,0.2)", "rgba(255,255,255,0)"],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 4,
            ease: "easeInOut" 
          }}
        />
        
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            delay: 0.2, 
            duration: 0.8 
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-600/20">
            <Check className="h-16 w-16 text-white" />
          </div>
        </motion.div>
      </div>
      
      <div className="space-y-4">
        <motion.h2 
          className="text-4xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Profile Complete!
        </motion.h2>
        <motion.p 
          className="text-xl text-zinc-400 font-light max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Thank you for completing your profile. We'll use this information to
          find the perfect partnerships that match your goals and values.
        </motion.p>
      </div>
      
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, type: "spring" }}
          className="mt-10 text-left"
        >
          <h3 className="font-semibold text-2xl mb-4 text-white">Personalized Recommendations</h3>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, type: "spring", delay: 0.6 + (index * 0.1) }}
                className="flex items-start gap-4 backdrop-blur-sm bg-zinc-900/30 p-5 rounded-xl border border-white/5"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-emerald-600/20">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-zinc-300">{rec}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7, type: "spring" }}
        className="pt-4"
      >
        <Button 
          onClick={() => onComplete(formData)}
          className="px-10 h-14 rounded-full text-lg font-medium bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-xl"
        >
          Go to Dashboard
        </Button>
      </motion.div>
    </motion.div>
  );

  // Determine which step to render
  const renderCurrentStep = () => {
    switch (currentStep) {
      case WizardStep.Welcome:
        return renderWelcomeScreen();
      case WizardStep.UserTypeSelection:
        return renderUserTypeSelection();
      case WizardStep.ReviewSubmit:
        return renderReviewScreen();
      case WizardStep.Complete:
        return renderCompletedScreen();
      default:
        return renderFormFields();
    }
  };

  // Get button actions based on current step
  const getButtonActions = () => {
    if (currentStep === WizardStep.Welcome || 
        currentStep === WizardStep.UserTypeSelection || 
        currentStep === WizardStep.Complete) {
      return null;
    }
    
    return (
      <div className="flex justify-between pt-6 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex items-center justify-center h-12 px-6 rounded-full backdrop-blur-sm bg-zinc-900/50 text-white border border-white/10 transition-all hover:bg-zinc-800/70 hover:border-white/20 disabled:opacity-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </button>
        </motion.div>
        
        {currentStep === WizardStep.ReviewSubmit ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-red-500 to-amber-500 opacity-70 blur-sm group-hover:opacity-100 animate-tilt"></div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="relative flex items-center justify-center h-12 px-8 rounded-full bg-gradient-to-r from-red-500 to-amber-500 text-white font-medium shadow-md transition-all hover:shadow-lg hover:from-red-600 hover:to-amber-600 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <LoadingSpinner className="mr-2 h-5 w-5 text-white" />
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span>Submit Profile</span>
                  <div className="ml-2 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-red-500 to-amber-500 opacity-0 blur-sm group-hover:opacity-70 transition-opacity"></div>
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="relative flex items-center justify-center h-12 px-8 rounded-full bg-gradient-to-r from-red-500 to-amber-500 text-white font-medium shadow-md transition-all hover:shadow-lg hover:from-red-600 hover:to-amber-600 disabled:opacity-50"
            >
              <span>Next</span>
              <div className="ml-2 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="h-3 w-3 text-white" />
              </div>
            </button>
          </motion.div>
        )}
      </div>
    );
  };

  const { title, description, icon } = getSectionInfo();

  return (
    <div className="w-full max-w-4xl">
      <div className="absolute inset-0 bg-gradient-to-b from-red-600/20 via-amber-600/10 to-transparent w-full h-[500px] blur-3xl opacity-20 -z-10"></div>
      
      <Card className="w-full overflow-hidden backdrop-blur-lg bg-zinc-900/70 border border-white/5 shadow-2xl rounded-3xl">
        {/* Header with step information */}
        <CardHeader className="pb-6 border-b border-white/5">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {icon && (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/20 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-md">
                  <div className="text-white">{icon}</div>
                </div>
              )}
              <div>
                <CardTitle className="text-2xl font-bold text-white tracking-tight">{title}</CardTitle>
                <CardDescription className="text-lg text-zinc-400 font-light mt-1">{description}</CardDescription>
              </div>
            </div>
            
            {/* Show user info if logged in */}
            {user && (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <div className="font-medium text-white">{user.username}</div>
                  <div className="text-xs text-zinc-400 capitalize">{user.userType}</div>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500/10 to-amber-500/10 backdrop-blur-md border border-white/10 text-white">
                  {user.userType === 'athlete' ? (
                    <UserCircle className="h-5 w-5" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        {/* Progress indicator */}
        {currentStep > 0 && currentStep < (Object.keys(WizardStep).length / 2 - 1) && (
          <div className="px-8 pt-6">
            <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                className="absolute h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                style={{ width: `${progress}%` }}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-zinc-400">
              <span>Step {currentStep} of {Math.floor(Object.keys(WizardStep).length / 2) - 2}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
          </div>
        )}
        
        {/* Main content area */}
        <CardContent className="pt-8 pb-4" ref={formContainerRef}>
          <AnimatePresence mode="wait">
            {renderCurrentStep()}
          </AnimatePresence>
        </CardContent>
        
        {/* Footer with navigation */}
        <CardFooter className="border-t border-white/5 mt-6 py-6">
          {getButtonActions()}
          
          {currentStep === WizardStep.Complete && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <button 
                onClick={() => onComplete(formData)}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium shadow-lg transition-all hover:shadow-xl hover:from-emerald-600 hover:to-green-600"
              >
                Continue to Dashboard
              </button>
            </motion.div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}