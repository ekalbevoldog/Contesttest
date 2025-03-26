import React, { useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

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
  Briefcase
} from "lucide-react";

// Define wizard steps enum - more modular for dynamic adaptation
enum WizardStep {
  Welcome = 0,
  UserTypeSelection = 1,
  BasicProfile = 2,
  ContentPreferences = 3,
  AudienceInfo = 4,
  BrandValues = 5,
  Goals = 6,
  ReviewSubmit = 7,
  Complete = 8
}

// Dynamic section configurations based on user type
interface SectionConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
}

// Form field types
type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'slider' | 'image-select';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  required?: boolean;
  options?: Array<{
    id: string;
    label: string;
    description?: string;
    icon?: ReactNode;
    imageSrc?: string;
  }>;
  condition?: {
    field: string;
    value: string | string[];
  };
  min?: number;
  max?: number;
}

interface StepSection {
  title: string;
  description?: string;
  fields: FormField[];
}

interface FormData {
  userType: 'athlete' | 'business' | null;
  basicProfile: Record<string, any>;
  contentPreferences: Record<string, any>;
  audienceInfo: Record<string, any>;
  brandValues: Record<string, any>;
  goals: Record<string, any>;
}

// Main component definition
export default function DynamicOnboardingForm({ 
  initialUserType = null,
  onComplete,
  sessionId = null
}: { 
  initialUserType?: 'athlete' | 'business' | null;
  onComplete: (data: any) => void;
  sessionId?: string | null;
}) {
  // Get user information if available
  const { user } = useAuth();
  
  // State management  
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    initialUserType ? WizardStep.BasicProfile : WizardStep.Welcome
  );
  const [userType, setUserType] = useState<'athlete' | 'business' | null>(initialUserType);
  const [formData, setFormData] = useState<FormData>({
    userType: initialUserType,
    basicProfile: {},
    contentPreferences: {},
    audienceInfo: {},
    brandValues: {},
    goals: {}
  });
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
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
    // Number of total steps
    const totalSteps = Object.keys(WizardStep).length / 2 - 1; // -1 for the Complete step
    const currentProgress = (currentStep / totalSteps) * 100;
    setProgress(currentProgress);
  }, [currentStep]);

  // Define dynamic section configurations based on user type
  const getSectionConfigs = (): Record<string, SectionConfig> => {
    const commonSections = {
      welcome: {
        id: 'welcome',
        title: 'Welcome to Contested',
        subtitle: 'Let\'s personalize your experience',
        icon: <Sparkles className="h-8 w-8 text-primary" />
      },
      userType: {
        id: 'userType',
        title: 'Who are you?',
        subtitle: 'Select your account type',
        icon: <UserCircle className="h-8 w-8 text-primary" />
      },
      complete: {
        id: 'complete',
        title: 'Onboarding Complete!',
        subtitle: 'Your personalized profile is ready',
        icon: <Check className="h-8 w-8 text-primary" />
      }
    };

    const athleteSections = {
      basicProfile: {
        id: 'basicProfile',
        title: 'Athlete Profile',
        subtitle: 'Tell us about yourself',
        icon: <UserCircle className="h-8 w-8 text-primary" />
      },
      contentPreferences: {
        id: 'contentPreferences',
        title: 'Content Creation',
        subtitle: 'Your content style and preferences',
        icon: <Image className="h-8 w-8 text-primary" />
      },
      audienceInfo: {
        id: 'audienceInfo',
        title: 'Audience & Reach',
        subtitle: 'Your followers and engagement',
        icon: <Users className="h-8 w-8 text-primary" />
      },
      brandValues: {
        id: 'brandValues',
        title: 'Values & Compensation',
        subtitle: 'What matters to you',
        icon: <Heart className="h-8 w-8 text-primary" />
      },
      goals: {
        id: 'goals',
        title: 'Partnership Goals',
        subtitle: 'What you want to achieve',
        icon: <Target className="h-8 w-8 text-primary" />
      },
      review: {
        id: 'review',
        title: 'Review & Submit',
        subtitle: 'Confirm your athlete profile',
        icon: <BookOpen className="h-8 w-8 text-primary" />
      }
    };

    const businessSections = {
      basicProfile: {
        id: 'basicProfile',
        title: 'Business Profile',
        subtitle: 'Tell us about your business',
        icon: <Building2 className="h-8 w-8 text-primary" />
      },
      contentPreferences: {
        id: 'contentPreferences',
        title: 'Content Expectations',
        subtitle: 'What content works for your brand',
        icon: <Film className="h-8 w-8 text-primary" />
      },
      audienceInfo: {
        id: 'audienceInfo',
        title: 'Target Audience',
        subtitle: 'Who you want to reach',
        icon: <Target className="h-8 w-8 text-primary" />
      },
      brandValues: {
        id: 'brandValues',
        title: 'Brand & Budget',
        subtitle: 'Your values and investment',
        icon: <DollarSign className="h-8 w-8 text-primary" />
      },
      goals: {
        id: 'goals',
        title: 'Campaign Goals',
        subtitle: 'What you want to achieve',
        icon: <BarChart3 className="h-8 w-8 text-primary" />
      },
      review: {
        id: 'review',
        title: 'Review & Submit',
        subtitle: 'Confirm your business profile',
        icon: <BookOpen className="h-8 w-8 text-primary" />
      }
    };

    return {
      ...commonSections,
      ...(userType === 'athlete' ? athleteSections : userType === 'business' ? businessSections : {})
    };
  };

  // Dynamic field configuration based on user type and progress
  const getStepFields = (): StepSection[] => {
    // Common fields across user types
    const commonBasicFields: FormField[] = [
      {
        id: 'name',
        type: 'text',
        label: 'Name',
        required: true
      },
      {
        id: 'email',
        type: 'text',
        label: 'Email',
        required: true
      }
    ];

    // Athlete-specific fields
    if (userType === 'athlete') {
      switch (currentStep) {
        case WizardStep.BasicProfile:
          return [{
            title: 'Athlete Information',
            description: 'Tell us about your sports background and achievements',
            fields: [
              ...commonBasicFields,
              {
                id: 'sport',
                type: 'select',
                label: 'Primary Sport',
                required: true,
                options: [
                  { id: 'basketball', label: 'Basketball' },
                  { id: 'football', label: 'Football' },
                  { id: 'baseball', label: 'Baseball' },
                  { id: 'soccer', label: 'Soccer' },
                  { id: 'track', label: 'Track & Field' },
                  { id: 'volleyball', label: 'Volleyball' },
                  { id: 'swimming', label: 'Swimming' },
                  { id: 'gymnastics', label: 'Gymnastics' },
                  { id: 'tennis', label: 'Tennis' },
                  { id: 'golf', label: 'Golf' },
                  { id: 'lacrosse', label: 'Lacrosse' },
                  { id: 'hockey', label: 'Hockey' },
                  { id: 'other', label: 'Other' }
                ]
              },
              {
                id: 'division',
                type: 'select',
                label: 'Division',
                required: true,
                options: [
                  { id: 'division-i', label: 'Division I' },
                  { id: 'division-ii', label: 'Division II' },
                  { id: 'division-iii', label: 'Division III' },
                  { id: 'naia', label: 'NAIA' },
                  { id: 'juco', label: 'JUCO' }
                ]
              },
              {
                id: 'school',
                type: 'text',
                label: 'School/University',
                required: true
              },
              {
                id: 'year',
                type: 'select',
                label: 'Year',
                options: [
                  { id: 'freshman', label: 'Freshman' },
                  { id: 'sophomore', label: 'Sophomore' },
                  { id: 'junior', label: 'Junior' },
                  { id: 'senior', label: 'Senior' },
                  { id: 'graduate', label: 'Graduate Student' }
                ]
              },
              {
                id: 'achievements',
                type: 'textarea',
                label: 'Notable Achievements',
                description: 'List any awards, honors, or achievements'
              }
            ]
          }];

        case WizardStep.ContentPreferences:
          return [{
            title: 'Content Creation',
            description: 'Tell us about the content you create and your style',
            fields: [
              {
                id: 'contentTypes',
                type: 'checkbox',
                label: 'Content Types',
                description: 'Select the types of content you create',
                required: true,
                options: [
                  { 
                    id: 'photos', 
                    label: 'Photos/Images',
                    icon: <Image className="h-5 w-5" /> 
                  },
                  { 
                    id: 'reels', 
                    label: 'Reels/Short Videos',
                    icon: <Film className="h-5 w-5" /> 
                  },
                  { 
                    id: 'stories', 
                    label: 'Stories/Ephemeral Content',
                    icon: <Zap className="h-5 w-5" /> 
                  },
                  { 
                    id: 'longform', 
                    label: 'Long-form Videos',
                    icon: <Film className="h-5 w-5" /> 
                  },
                  { 
                    id: 'tutorials', 
                    label: 'Tutorials/How-Tos',
                    icon: <BookOpen className="h-5 w-5" /> 
                  }
                ]
              },
              {
                id: 'contentStyle',
                type: 'select',
                label: 'Content Style',
                required: true,
                options: [
                  { id: 'authentic', label: 'Authentic/Candid' },
                  { id: 'polished', label: 'Polished/Professional' },
                  { id: 'educational', label: 'Educational/Informative' },
                  { id: 'entertaining', label: 'Entertaining/Humorous' },
                  { id: 'inspirational', label: 'Inspirational/Motivational' }
                ]
              },
              {
                id: 'contentFrequency',
                type: 'select',
                label: 'Posting Frequency',
                options: [
                  { id: 'daily', label: 'Daily' },
                  { id: 'several-times-week', label: 'Several times a week' },
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'biweekly', label: 'Bi-weekly' },
                  { id: 'monthly', label: 'Monthly' }
                ]
              },
              {
                id: 'socialPlatforms',
                type: 'checkbox',
                label: 'Social Platforms',
                description: 'Where do you post your content?',
                required: true,
                options: [
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'tiktok', label: 'TikTok' },
                  { id: 'youtube', label: 'YouTube' },
                  { id: 'twitter', label: 'Twitter/X' },
                  { id: 'facebook', label: 'Facebook' },
                  { id: 'linkedin', label: 'LinkedIn' },
                  { id: 'twitch', label: 'Twitch' },
                  { id: 'other', label: 'Other' }
                ]
              }
            ]
          }];

        case WizardStep.AudienceInfo:
          return [{
            title: 'Audience & Reach',
            description: 'Tell us about your followers and engagement',
            fields: [
              {
                id: 'followerCount',
                type: 'select',
                label: 'Total Followers (All Platforms)',
                required: true,
                options: [
                  { id: 'under-1k', label: 'Under 1,000' },
                  { id: '1k-5k', label: '1,000 - 5,000' },
                  { id: '5k-10k', label: '5,000 - 10,000' },
                  { id: '10k-25k', label: '10,000 - 25,000' },
                  { id: '25k-50k', label: '25,000 - 50,000' },
                  { id: '50k-100k', label: '50,000 - 100,000' },
                  { id: '100k-plus', label: 'Over 100,000' }
                ]
              },
              {
                id: 'engagementRate',
                type: 'select',
                label: 'Average Engagement Rate',
                options: [
                  { id: 'low', label: 'Low (0-2%)' },
                  { id: 'medium', label: 'Medium (2-5%)' },
                  { id: 'high', label: 'High (5-10%)' },
                  { id: 'very-high', label: 'Very High (10%+)' },
                  { id: 'unsure', label: 'Not sure' }
                ]
              },
              {
                id: 'audienceDemographics',
                type: 'checkbox',
                label: 'Audience Demographics',
                description: 'Select the primary demographic groups that follow you',
                options: [
                  { id: 'gen-z', label: 'Gen Z (Under 25)' },
                  { id: 'millennials', label: 'Millennials (25-40)' },
                  { id: 'gen-x', label: 'Gen X (41-56)' },
                  { id: 'boomers', label: 'Baby Boomers (57+)' },
                  { id: 'students', label: 'Students' },
                  { id: 'parents', label: 'Parents' },
                  { id: 'sports-fans', label: 'Sports Fans' },
                  { id: 'athletes', label: 'Fellow Athletes' }
                ]
              },
              {
                id: 'audienceLocation',
                type: 'checkbox',
                label: 'Audience Location',
                description: 'Where are most of your followers located?',
                options: [
                  { id: 'local', label: 'Local (Your college town/city)' },
                  { id: 'regional', label: 'Regional (Your state/nearby states)' },
                  { id: 'national', label: 'National (Across the country)' },
                  { id: 'international', label: 'International (Global audience)' }
                ]
              }
            ]
          }];

        case WizardStep.BrandValues:
          return [{
            title: 'Values & Compensation',
            description: 'Tell us about what matters to you in partnerships',
            fields: [
              {
                id: 'values',
                type: 'checkbox',
                label: 'Important Values',
                description: 'What values matter most to you in potential partnerships?',
                required: true,
                options: [
                  { id: 'authenticity', label: 'Authenticity' },
                  { id: 'sustainability', label: 'Sustainability/Environment' },
                  { id: 'diversity', label: 'Diversity & Inclusion' },
                  { id: 'innovation', label: 'Innovation/Creativity' },
                  { id: 'community', label: 'Community Impact' },
                  { id: 'quality', label: 'Quality/Excellence' },
                  { id: 'health', label: 'Health & Wellness' },
                  { id: 'education', label: 'Education/Learning' }
                ]
              },
              {
                id: 'compensationPreference',
                type: 'select',
                label: 'Compensation Preference',
                required: true,
                options: [
                  { id: 'monetary', label: 'Monetary payment' },
                  { id: 'product', label: 'Product/Services' },
                  { id: 'hybrid', label: 'Hybrid (Both money and product)' },
                  { id: 'flexible', label: 'Flexible (Open to discussion)' }
                ]
              },
              {
                id: 'minimumCompensation',
                type: 'select',
                label: 'Minimum Compensation Expectation',
                options: [
                  { id: 'under-250', label: 'Under $250' },
                  { id: '250-500', label: '$250 - $500' },
                  { id: '500-1000', label: '$500 - $1,000' },
                  { id: '1000-2500', label: '$1,000 - $2,500' },
                  { id: '2500-plus', label: 'Over $2,500' },
                  { id: 'case-by-case', label: 'Case by case basis' }
                ]
              },
              {
                id: 'avoidIndustries',
                type: 'checkbox',
                label: 'Industries to Avoid',
                description: 'Select any industries you would prefer NOT to work with',
                options: [
                  { id: 'alcohol', label: 'Alcohol' },
                  { id: 'tobacco', label: 'Tobacco/Nicotine' },
                  { id: 'gambling', label: 'Gambling' },
                  { id: 'political', label: 'Political Organizations' },
                  { id: 'fast-food', label: 'Fast Food' },
                  { id: 'none', label: 'No restrictions' }
                ]
              }
            ]
          }];

        case WizardStep.Goals:
          return [{
            title: 'Partnership Goals',
            description: 'What do you hope to achieve through brand partnerships?',
            fields: [
              {
                id: 'goals',
                type: 'checkbox',
                label: 'Partnership Goals',
                description: 'What do you want to accomplish?',
                required: true,
                options: [
                  { id: 'income', label: 'Generate Income' },
                  { id: 'exposure', label: 'Gain Exposure' },
                  { id: 'network', label: 'Build Professional Network' },
                  { id: 'career', label: 'Career Opportunities' },
                  { id: 'impact', label: 'Make an Impact' },
                  { id: 'experience', label: 'Gain Experience' },
                  { id: 'products', label: 'Access to Products/Services' }
                ]
              },
              {
                id: 'partnershipDuration',
                type: 'select',
                label: 'Preferred Partnership Duration',
                options: [
                  { id: 'one-time', label: 'One-time collaborations' },
                  { id: 'short-term', label: 'Short-term (1-3 months)' },
                  { id: 'medium-term', label: 'Medium-term (3-6 months)' },
                  { id: 'long-term', label: 'Long-term (6+ months)' },
                  { id: 'flexible', label: 'Flexible/Case-by-case' }
                ]
              },
              {
                id: 'availability',
                type: 'select',
                label: 'Availability for Partnerships',
                options: [
                  { id: 'very-limited', label: 'Very Limited (Off-season only)' },
                  { id: 'limited', label: 'Limited (1-2 brands at a time)' },
                  { id: 'moderate', label: 'Moderate (2-5 brands at a time)' },
                  { id: 'extensive', label: 'Extensive (5+ brands at a time)' }
                ]
              },
              {
                id: 'additionalInfo',
                type: 'textarea',
                label: 'Additional Information',
                description: 'Anything else brands should know about working with you?'
              }
            ]
          }];

        default:
          return [];
      }
    } 
    // Business-specific fields
    else if (userType === 'business') {
      switch (currentStep) {
        case WizardStep.BasicProfile:
          return [{
            title: 'Business Information',
            description: 'Tell us about your company and brand',
            fields: [
              ...commonBasicFields,
              {
                id: 'companyName',
                type: 'text',
                label: 'Company Name',
                required: true
              },
              {
                id: 'industry',
                type: 'select',
                label: 'Industry',
                required: true,
                options: [
                  { id: 'apparel', label: 'Apparel & Fashion' },
                  { id: 'sports-equipment', label: 'Sports Equipment' },
                  { id: 'food-beverage', label: 'Food & Beverage' },
                  { id: 'health-wellness', label: 'Health & Wellness' },
                  { id: 'technology', label: 'Technology' },
                  { id: 'entertainment', label: 'Entertainment & Media' },
                  { id: 'retail', label: 'Retail' },
                  { id: 'financial', label: 'Financial Services' },
                  { id: 'education', label: 'Education' },
                  { id: 'travel', label: 'Travel & Hospitality' },
                  { id: 'other', label: 'Other' }
                ]
              },
              {
                id: 'companySize',
                type: 'select',
                label: 'Company Size',
                options: [
                  { id: 'startup', label: 'Startup/Individual' },
                  { id: 'small', label: 'Small (1-50 employees)' },
                  { id: 'medium', label: 'Medium (51-500 employees)' },
                  { id: 'large', label: 'Large (500+ employees)' }
                ]
              },
              {
                id: 'website',
                type: 'text',
                label: 'Website'
              },
              {
                id: 'productDescription',
                type: 'textarea',
                label: 'Product/Service Description',
                description: 'Briefly describe what your company offers'
              }
            ]
          }];

        case WizardStep.ContentPreferences:
          return [{
            title: 'Content Expectations',
            description: 'What content would you like athletes to create?',
            fields: [
              {
                id: 'desiredContentTypes',
                type: 'checkbox',
                label: 'Desired Content Types',
                description: 'What type of content do you want athletes to create?',
                required: true,
                options: [
                  { 
                    id: 'product-showcase', 
                    label: 'Product Showcase/Reviews',
                    icon: <Image className="h-5 w-5" /> 
                  },
                  { 
                    id: 'testimonials', 
                    label: 'Testimonials',
                    icon: <Award className="h-5 w-5" /> 
                  },
                  { 
                    id: 'how-to', 
                    label: 'How-To/Tutorials',
                    icon: <BookOpen className="h-5 w-5" /> 
                  },
                  { 
                    id: 'day-in-life', 
                    label: 'Day-in-the-Life',
                    icon: <Calendar className="h-5 w-5" /> 
                  },
                  { 
                    id: 'behind-scenes', 
                    label: 'Behind-the-Scenes',
                    icon: <Film className="h-5 w-5" /> 
                  }
                ]
              },
              {
                id: 'contentVibe',
                type: 'select',
                label: 'Content Vibe',
                required: true,
                options: [
                  { id: 'authentic', label: 'Authentic/Candid' },
                  { id: 'polished', label: 'Polished/Professional' },
                  { id: 'educational', label: 'Educational/Informative' },
                  { id: 'entertaining', label: 'Entertaining/Humorous' },
                  { id: 'inspirational', label: 'Inspirational/Motivational' }
                ]
              },
              {
                id: 'contentPlatforms',
                type: 'checkbox',
                label: 'Target Platforms',
                description: 'Where do you want the content to appear?',
                required: true,
                options: [
                  { id: 'instagram', label: 'Instagram' },
                  { id: 'tiktok', label: 'TikTok' },
                  { id: 'youtube', label: 'YouTube' },
                  { id: 'twitter', label: 'Twitter/X' },
                  { id: 'facebook', label: 'Facebook' },
                  { id: 'linkedin', label: 'LinkedIn' },
                  { id: 'twitch', label: 'Twitch' },
                  { id: 'other', label: 'Other' }
                ]
              },
              {
                id: 'contentFrequency',
                type: 'select',
                label: 'Desired Posting Frequency',
                options: [
                  { id: 'one-time', label: 'One-time post' },
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'biweekly', label: 'Bi-weekly' },
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'custom', label: 'Custom schedule' }
                ]
              }
            ]
          }];

        case WizardStep.AudienceInfo:
          return [{
            title: 'Target Audience',
            description: 'Who do you want to reach through athlete partnerships?',
            fields: [
              {
                id: 'targetDemographics',
                type: 'checkbox',
                label: 'Target Demographics',
                description: 'Select all that apply',
                required: true,
                options: [
                  { id: 'gen-z', label: 'Gen Z (Under 25)' },
                  { id: 'millennials', label: 'Millennials (25-40)' },
                  { id: 'gen-x', label: 'Gen X (41-56)' },
                  { id: 'boomers', label: 'Baby Boomers (57+)' },
                  { id: 'students', label: 'Students' },
                  { id: 'parents', label: 'Parents' },
                  { id: 'sports-fans', label: 'Sports Fans' },
                  { id: 'athletes', label: 'Athletes' }
                ]
              },
              {
                id: 'locationFocus',
                type: 'checkbox',
                label: 'Location Focus',
                description: 'Where would you like to reach your audience?',
                options: [
                  { id: 'local', label: 'Local (Specific college/city)' },
                  { id: 'regional', label: 'Regional (State/nearby states)' },
                  { id: 'national', label: 'National (Country-wide)' },
                  { id: 'international', label: 'International (Global)' }
                ]
              },
              {
                id: 'targetSchools',
                type: 'select',
                label: 'Target Schools',
                options: [
                  { id: 'any', label: 'Any schools' },
                  { id: 'specific-schools', label: 'Specific schools/regions' },
                  { id: 'division-i', label: 'Division I only' },
                  { id: 'division-i-ii', label: 'Division I & II' },
                  { id: 'all-divisions', label: 'All divisions' }
                ]
              },
              {
                id: 'targetSports',
                type: 'checkbox',
                label: 'Target Sports',
                description: 'Which sports are most relevant to your brand?',
                options: [
                  { id: 'basketball', label: 'Basketball' },
                  { id: 'football', label: 'Football' },
                  { id: 'baseball', label: 'Baseball' },
                  { id: 'soccer', label: 'Soccer' },
                  { id: 'track', label: 'Track & Field' },
                  { id: 'volleyball', label: 'Volleyball' },
                  { id: 'swimming', label: 'Swimming' },
                  { id: 'gymnastics', label: 'Gymnastics' },
                  { id: 'tennis', label: 'Tennis' },
                  { id: 'golf', label: 'Golf' },
                  { id: 'lacrosse', label: 'Lacrosse' },
                  { id: 'hockey', label: 'Hockey' },
                  { id: 'any', label: 'Any sport' }
                ]
              }
            ]
          }];

        case WizardStep.BrandValues:
          return [{
            title: 'Brand & Budget',
            description: 'Your brand values and partnership budget',
            fields: [
              {
                id: 'brandValues',
                type: 'checkbox',
                label: 'Brand Values',
                description: 'What values are important to your brand?',
                required: true,
                options: [
                  { id: 'authenticity', label: 'Authenticity' },
                  { id: 'sustainability', label: 'Sustainability/Environment' },
                  { id: 'diversity', label: 'Diversity & Inclusion' },
                  { id: 'innovation', label: 'Innovation/Creativity' },
                  { id: 'community', label: 'Community Impact' },
                  { id: 'quality', label: 'Quality/Excellence' },
                  { id: 'health', label: 'Health & Wellness' },
                  { id: 'education', label: 'Education/Learning' }
                ]
              },
              {
                id: 'budgetRange',
                type: 'slider',
                label: 'Campaign Budget Range',
                description: 'Select your budget range for athlete partnerships',
                min: 500,
                max: 30000
              },
              {
                id: 'compensationType',
                type: 'select',
                label: 'Compensation Type',
                options: [
                  { id: 'monetary', label: 'Monetary payment' },
                  { id: 'product', label: 'Product/Services' },
                  { id: 'hybrid', label: 'Hybrid (Both money and product)' },
                  { id: 'flexible', label: 'Flexible (Open to discussion)' }
                ]
              },
              {
                id: 'campaignDuration',
                type: 'select',
                label: 'Campaign Duration',
                options: [
                  { id: 'one-time', label: 'One-time collaboration' },
                  { id: 'short-term', label: 'Short-term (1-3 months)' },
                  { id: 'medium-term', label: 'Medium-term (3-6 months)' },
                  { id: 'long-term', label: 'Long-term (6+ months)' },
                  { id: 'flexible', label: 'Flexible/Case-by-case' }
                ]
              }
            ]
          }];

        case WizardStep.Goals:
          return [{
            title: 'Campaign Goals',
            description: 'What do you hope to achieve with athlete partnerships?',
            fields: [
              {
                id: 'campaignGoals',
                type: 'checkbox',
                label: 'Primary Campaign Goals',
                description: 'What do you want to accomplish?',
                required: true,
                options: [
                  { id: 'awareness', label: 'Brand Awareness' },
                  { id: 'engagement', label: 'Audience Engagement' },
                  { id: 'sales', label: 'Drive Sales' },
                  { id: 'leads', label: 'Generate Leads' },
                  { id: 'loyalty', label: 'Build Brand Loyalty' },
                  { id: 'credibility', label: 'Enhance Credibility' },
                  { id: 'reach', label: 'Reach New Audiences' },
                  { id: 'content', label: 'Generate Content' }
                ]
              },
              {
                id: 'successMetrics',
                type: 'checkbox',
                label: 'Success Metrics',
                description: 'How will you measure success?',
                options: [
                  { id: 'impressions', label: 'Impressions/Reach' },
                  { id: 'engagement', label: 'Engagement Rate' },
                  { id: 'clicks', label: 'Click-throughs' },
                  { id: 'conversions', label: 'Conversions' },
                  { id: 'sales', label: 'Sales Increase' },
                  { id: 'followers', label: 'Follower Growth' },
                  { id: 'sentiment', label: 'Brand Sentiment' }
                ]
              },
              {
                id: 'athleteTraits',
                type: 'checkbox',
                label: 'Desired Athlete Traits',
                description: 'What qualities are you looking for in athlete partners?',
                options: [
                  { id: 'influence', label: 'High Influence/Following' },
                  { id: 'engagement', label: 'Strong Engagement' },
                  { id: 'authenticity', label: 'Authenticity' },
                  { id: 'alignment', label: 'Brand Alignment' },
                  { id: 'storytelling', label: 'Good Storyteller' },
                  { id: 'professional', label: 'Professionalism' },
                  { id: 'creative', label: 'Creativity' }
                ]
              },
              {
                id: 'additionalRequirements',
                type: 'textarea',
                label: 'Additional Requirements',
                description: 'Any other details about your campaign or requirements for athletes?'
              }
            ]
          }];

        default:
          return [];
      }
    }
    // If no user type selected
    else {
      return [];
    }
  };

  // Handle input changes
  const handleInputChange = (section: keyof FormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (section: keyof FormData, field: string, value: string) => {
    setFormData(prev => {
      const currentSection = prev[section] as Record<string, any>;
      const currentValues = currentSection[field] as string[] || [];
      
      // Toggle value in array
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [section]: {
          ...currentSection,
          [field]: newValues
        }
      };
    });
  };

  // Handle slider changes
  const handleSliderChange = (section: keyof FormData, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
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
      // Prepare data for submission
      const submissionData = {
        sessionId: activeSessionId,
        userType,
        basicInfo: formData.basicProfile,
        contentPreferences: formData.contentPreferences,
        targetAudience: formData.audienceInfo,
        budgetValues: formData.brandValues,
        goalsExpectations: formData.goals
      };

      // Submit to personalized onboarding endpoint
      const response = await apiRequest("POST", "/api/personalized-onboarding", submissionData);
      const data = await response.json();

      // Set recommendations for display
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }

      // Move to complete step
      setCurrentStep(WizardStep.Complete);
      
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

  // Navigation functions
  const handleNext = () => {
    // Validate before moving to next step
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep as WizardStep);
  };

  const handleBack = () => {
    const prevStep = Math.max(0, currentStep - 1);
    setCurrentStep(prevStep as WizardStep);
  };

  const handleUserTypeSelect = (type: 'athlete' | 'business') => {
    setUserType(type);
    setFormData(prev => ({
      ...prev,
      userType: type
    }));
    handleNext();
  };

  // Render form fields based on field type
  const renderField = (field: FormField, section: keyof FormData) => {
    const fieldValue = (formData[section] as any)[field.id];
    
    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id} className="font-medium">
              {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.id}
              value={fieldValue || ''}
              onChange={(e) => handleInputChange(section, field.id, e.target.value)}
              className="w-full"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        );
        
      case 'textarea':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id} className="font-medium">
              {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Textarea
              id={field.id}
              value={fieldValue || ''}
              onChange={(e) => handleInputChange(section, field.id, e.target.value)}
              className="w-full min-h-[100px]"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        );
        
      case 'select':
        return (
          <div className="space-y-2" key={field.id}>
            <Label htmlFor={field.id} className="font-medium">
              {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Select
              value={fieldValue || ''}
              onValueChange={(value) => handleInputChange(section, field.id, value)}
            >
              <SelectTrigger id={field.id} className="w-full">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="space-y-3" key={field.id}>
            <div>
              <Label className="font-medium">
                {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.description && (
                <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {field.options?.map(option => {
                const values = (formData[section] as any)[field.id] as string[] || [];
                const isChecked = values.includes(option.id);
                
                return (
                  <div 
                    key={option.id}
                    className={`flex items-start space-x-3 border rounded-lg p-3 transition-all cursor-pointer 
                      ${isChecked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                    onClick={() => handleCheckboxChange(section, field.id, option.id)}
                  >
                    <Checkbox 
                      id={`${field.id}-${option.id}`}
                      checked={isChecked}
                      onCheckedChange={() => handleCheckboxChange(section, field.id, option.id)}
                      className="mt-1"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-start">
                        <Label 
                          htmlFor={`${field.id}-${option.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {option.label}
                        </Label>
                        {option.icon && 
                          <div className="text-primary">{option.icon}</div>
                        }
                      </div>
                      {option.description && (
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
        
      case 'radio':
        return (
          <div className="space-y-2" key={field.id}>
            <Label className="font-medium">
              {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <RadioGroup
              value={fieldValue || ''}
              onValueChange={(value) => handleInputChange(section, field.id, value)}
              className="grid grid-cols-1 md:grid-cols-2 gap-2"
            >
              {field.options?.map(option => (
                <div
                  key={option.id}
                  className={`flex items-start space-x-2 border rounded-lg p-3 transition-all cursor-pointer 
                    ${fieldValue === option.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <RadioGroupItem value={option.id} id={`${field.id}-${option.id}`} className="mt-1" />
                  <div className="space-y-1">
                    <Label htmlFor={`${field.id}-${option.id}`} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
        
      case 'slider':
        return (
          <div className="space-y-4" key={field.id}>
            <div className="space-y-2">
              <Label className="font-medium">
                {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
            </div>
            
            <div className="space-y-6 pt-2">
              <Slider
                defaultValue={[field.min || 0]}
                max={field.max || 100}
                min={field.min || 0}
                step={100}
                onValueChange={(values) => handleSliderChange(section, field.id, values[0])}
                className="w-full"
              />
              
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="font-normal text-sm">
                  ${fieldValue || field.min || 0}
                </Badge>
                
                <div className="text-sm font-medium">
                  Budget Range: ${fieldValue || field.min || 0} 
                  {fieldValue >= (field.max || 100) ? '+' : ''}
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Render section based on current step
  const renderCurrentStep = () => {
    const sectionConfigs = getSectionConfigs();
    
    switch(currentStep) {
      case WizardStep.Welcome:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to Contested</h2>
              <p className="text-muted-foreground">
                Let's personalize your experience to help you find the perfect partnerships.
                This wizard will guide you through a few quick steps to set up your profile.
              </p>
            </div>
            <Button 
              className="mt-4 w-full sm:w-auto"
              onClick={handleNext}
            >
              Get Started <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
        
      case WizardStep.UserTypeSelection:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Who are you?</h2>
              <p className="text-muted-foreground">
                Select your account type to customize your experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div 
                className={`border rounded-xl p-6 cursor-pointer transition-all hover:border-primary hover:shadow-sm
                  ${userType === 'athlete' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'}`}
                onClick={() => handleUserTypeSelect('athlete')}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Athlete</h3>
                    <p className="text-muted-foreground">
                      I'm a college athlete looking for brand partnerships
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`border rounded-xl p-6 cursor-pointer transition-all hover:border-primary hover:shadow-sm
                  ${userType === 'business' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'}`}
                onClick={() => handleUserTypeSelect('business')}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Business</h3>
                    <p className="text-muted-foreground">
                      I represent a brand looking to partner with athletes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case WizardStep.ReviewSubmit:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Review & Submit</h2>
              <p className="text-muted-foreground">
                Please review your information before submitting
              </p>
            </div>
            
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-xl">Profile Details</h3>
                  <Separator className="my-2" />
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-muted-foreground">User Type:</div>
                      <div className="font-medium capitalize">{userType}</div>
                      
                      {/* Basic Profile section */}
                      {Object.entries(formData.basicProfile).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <div className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</div>
                          <div className="font-medium">{value || '-'}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Additional profile sections */}
                {['contentPreferences', 'audienceInfo', 'brandValues', 'goals'].map(sectionKey => {
                  const sectionData = formData[sectionKey as keyof FormData] as Record<string, any>;
                  if (Object.keys(sectionData).length === 0) return null;
                  
                  return (
                    <div key={sectionKey}>
                      <h3 className="font-semibold text-xl capitalize">
                        {sectionKey.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <Separator className="my-2" />
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(sectionData).map(([key, value]) => (
                            <React.Fragment key={key}>
                              <div className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</div>
                              <div className="font-medium">
                                {Array.isArray(value) 
                                  ? value.join(', ') 
                                  : typeof value === 'object' 
                                    ? JSON.stringify(value)
                                    : value || '-'}
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        );
        
      case WizardStep.Complete:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Profile Complete!</h2>
              <p className="text-muted-foreground">
                Thank you for completing your profile. We'll use this information to find the best partnerships for you.
              </p>
            </div>
            
            {recommendations.length > 0 && (
              <div className="mt-6 text-left">
                <h3 className="font-semibold text-lg mb-2">Personalized Recommendations</h3>
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <p>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      // For all other steps, render form fields
      default:
        const sections = getStepFields();
        if (sections.length === 0) return null;
        
        // Determine which section key to use based on current step
        let sectionKey: keyof FormData;
        switch (currentStep) {
          case WizardStep.BasicProfile:
            sectionKey = 'basicProfile';
            break;
          case WizardStep.ContentPreferences:
            sectionKey = 'contentPreferences';
            break;
          case WizardStep.AudienceInfo:
            sectionKey = 'audienceInfo';
            break;
          case WizardStep.BrandValues:
            sectionKey = 'brandValues';
            break;
          case WizardStep.Goals:
            sectionKey = 'goals';
            break;
          default:
            sectionKey = 'basicProfile';
        }
        
        return (
          <div className="space-y-6">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-4">
                {(section.title || section.description) && (
                  <div className="space-y-1">
                    {section.title && <h3 className="text-lg font-semibold">{section.title}</h3>}
                    {section.description && <p className="text-muted-foreground text-sm">{section.description}</p>}
                  </div>
                )}
                
                <div className="space-y-6">
                  {section.fields.map(field => renderField(field, sectionKey))}
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  // Helper to determine if next button should be disabled
  const isNextDisabled = () => {
    // Logic to determine if current step is valid
    return false; // Simplified for now
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>
              {currentStep > 0 && currentStep < Object.keys(WizardStep).length / 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="mr-2"
                  disabled={currentStep === WizardStep.Welcome || isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              {getSectionConfigs()[Object.keys(WizardStep)[currentStep * 2]?.toLowerCase()]?.title || 'Onboarding'}
            </CardTitle>
            <CardDescription className="mt-1">
              {getSectionConfigs()[Object.keys(WizardStep)[currentStep * 2]?.toLowerCase()]?.subtitle || ''}
            </CardDescription>
          </div>
          
          {/* User info if logged in */}
          {user && (
            <div className="flex items-center space-x-2">
              <div className="text-sm text-right">
                <div className="font-medium">{user.username}</div>
                <div className="text-xs text-muted-foreground">{user.userType}</div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      {/* Progress bar */}
      {currentStep > 0 && currentStep < (Object.keys(WizardStep).length / 2 - 1) && (
        <div className="px-6">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            Step {currentStep} of {Math.floor(Object.keys(WizardStep).length / 2) - 1}
          </p>
        </div>
      )}
      
      <CardContent className="pt-6">
        {renderCurrentStep()}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-6">
        {currentStep !== WizardStep.Welcome && 
         currentStep !== WizardStep.UserTypeSelection && 
         currentStep !== WizardStep.Complete && (
          <>
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
            
            {currentStep === WizardStep.ReviewSubmit ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                {isSubmitting ? "Submitting..." : "Submit Profile"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isNextDisabled() || isSubmitting}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </>
        )}
        
        {currentStep === WizardStep.Complete && (
          <Button 
            onClick={() => onComplete(formData)}
            className="w-full"
          >
            Continue to Dashboard
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}