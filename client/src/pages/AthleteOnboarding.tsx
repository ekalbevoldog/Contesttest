import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FadeIn } from "@/components/animations/FadeIn";
import { AnimatedGradient } from "@/components/animations/AnimatedGradient";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerContainer";
import { AnimatedFormField } from "@/components/animations/AnimatedFormField";
import { AnimatedSelectionField } from "@/components/animations/AnimatedSelectionField";
import { AnimatedFormTransition, AnimatedProgressBar, StepIndicator } from "@/components/animations/AnimatedFormTransition";
import { ValidationFeedback, AnimatedInput, FormFieldTransition } from "@/components/animations/ValidationFeedback";
import { AnimeText, AnimeBlob, AnimeScrambleText } from "@/components/animations/AnimeEffects";
import { FloatingElement } from "@/components/animations/FloatingElement";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Medal, School, Calendar, Tag, MapPin, Mail, Phone, User, 
  CheckCircle, ChevronRight, Trophy, Target, BarChart, 
  Info, ChevronLeft, Music, Camera, Video, Instagram, Twitter
} from "lucide-react";
import SliderWithInput from "@/components/SliderWithInput";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Step types
type OnboardingStep = 
  | "user-type"
  | "basic-info"
  | "sport-info"
  | "school-info"
  | "social-media"
  | "content-style"
  | "brand-preferences"
  | "compensation-goals"
  | "create-password";

// Form data type
interface AthleteFormData {
  // User type
  userType: "athlete" | "business" | "";
  
  // Basic Info
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  
  // Sport Information
  sport: string;
  position: string;
  sportAchievements: string[];
  
  // School Information
  school: string;
  division: string;
  graduationYear: string;
  major: string;
  gpa: string;
  
  // Social Media Presence
  socialHandles: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
    other?: string;
  };
  followerCount: number;
  
  // Content Style
  contentStyle: string;
  contentTypes: string[];
  topPerformingContentThemes: string[];
  
  // Brand Preferences
  preferredProductCategories: string[];
  previousBrandDeals: boolean;
  personalValues: string[];
  causes: string[];
  availableForTravel: boolean;
  
  // Compensation Goals
  compensationGoals: string;
  minimumCompensation: string;
  
  // Password
  password: string;
  confirmPassword: string;
}

// Initial form data
const initialFormData: AthleteFormData = {
  userType: "athlete",
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  email: "",
  phone: "",
  sport: "",
  position: "",
  sportAchievements: [],
  school: "",
  division: "",
  graduationYear: "",
  major: "",
  gpa: "",
  socialHandles: {},
  followerCount: 0,
  contentStyle: "",
  contentTypes: [],
  topPerformingContentThemes: [],
  preferredProductCategories: [],
  previousBrandDeals: false,
  personalValues: [],
  causes: [],
  availableForTravel: false,
  compensationGoals: "",
  minimumCompensation: "",
  password: "",
  confirmPassword: ""
};

// Content style options
const contentStyleOptions = [
  { value: "authentic", label: "Authentic & Real" },
  { value: "polished", label: "Polished & Professional" },
  { value: "educational", label: "Educational & Informative" },
  { value: "inspirational", label: "Inspirational & Motivational" },
  { value: "humorous", label: "Humorous & Entertaining" }
];

// Content types options
const contentTypeOptions = [
  { value: "photos", label: "Photos", icon: <Camera className="h-4 w-4 mr-2" /> },
  { value: "videos", label: "Videos", icon: <Video className="h-4 w-4 mr-2" /> },
  { value: "reels", label: "Short-form Videos/Reels", icon: <Video className="h-4 w-4 mr-2" /> },
  { value: "tutorials", label: "Tutorials/How-to", icon: <Info className="h-4 w-4 mr-2" /> },
  { value: "stories", label: "Stories/24h Content", icon: <Camera className="h-4 w-4 mr-2" /> }
];

// Sport options
const sportOptions = [
  "Basketball", "Football", "Soccer", "Baseball", "Softball", 
  "Track & Field", "Swimming", "Volleyball", "Tennis", 
  "Gymnastics", "Golf", "Hockey", "Lacrosse", "Wrestling", "Other"
];

// Division options
const divisionOptions = [
  "NCAA Division I", "NCAA Division II", "NCAA Division III", 
  "NAIA", "NJCAA", "Other"
];

// Common product categories
const productCategories = [
  "Sports Equipment", "Athletic Apparel", "Nutrition/Supplements", 
  "Technology", "Food & Beverage", "Personal Care", "Fashion", 
  "Lifestyle", "Automotive", "Financial Services", "Entertainment", "Other"
];

// Personal values
const personalValueOptions = [
  "Authenticity", "Determination", "Leadership", "Community", 
  "Excellence", "Innovation", "Teamwork", "Resilience", "Inclusion", 
  "Sustainability"
];

// Social causes
const causeOptions = [
  "Education", "Environment", "Health & Wellness", "Mental Health", 
  "Social Justice", "Animal Welfare", "Poverty Alleviation", 
  "Youth Development", "Diversity & Inclusion"
];

export default function AthleteOnboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("basic-info");
  const [formData, setFormData] = useState<AthleteFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Handle form data changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties (for socialHandles)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof AthleteFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear any error on this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle checkbox changes for multi-select options
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof AthleteFormData) => {
    const { value, checked } = e.target;
    
    if (Array.isArray(formData[field])) {
      setFormData(prev => {
        const currentArray = [...(prev[field] as string[])];
        
        if (checked) {
          // Add to array if checked
          if (!currentArray.includes(value)) {
            return { ...prev, [field]: [...currentArray, value] };
          }
        } else {
          // Remove from array if unchecked
          return { ...prev, [field]: currentArray.filter(item => item !== value) };
        }
        
        return prev;
      });
    }
  };
  
  // Handle radio changes for boolean or single-select options
  const handleRadioChange = (field: keyof AthleteFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear any error on this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle select changes for dropdown options
  const handleSelectChange = (field: keyof AthleteFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear any error on this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Validate the current step
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case "basic-info":
        if (!formData.firstName) {
          newErrors.firstName = "Please enter your first name";
        }
        if (!formData.lastName) {
          newErrors.lastName = "Please enter your last name";
        }
        if (!formData.dob) {
          newErrors.dob = "Please enter your date of birth";
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }
        break;
        
      case "sport-info":
        if (!formData.sport) {
          newErrors.sport = "Please select your sport";
        }
        if (!formData.position) {
          newErrors.position = "Please enter your position/role";
        }
        break;
        
      case "school-info":
        if (!formData.school) {
          newErrors.school = "Please enter your school/university";
        }
        if (!formData.division) {
          newErrors.division = "Please select your division";
        }
        break;
        
      case "social-media":
        if (Object.values(formData.socialHandles).filter(Boolean).length === 0) {
          newErrors.socialHandles = "Please provide at least one social media handle";
        }
        if (!formData.followerCount || formData.followerCount <= 0) {
          newErrors.followerCount = "Please enter your total follower count";
        }
        break;
        
      case "content-style":
        if (!formData.contentStyle) {
          newErrors.contentStyle = "Please select your primary content style";
        }
        if (formData.contentTypes.length === 0) {
          newErrors.contentTypes = "Please select at least one content type";
        }
        break;
        
      case "brand-preferences":
        if (formData.preferredProductCategories.length === 0) {
          newErrors.preferredProductCategories = "Please select at least one product category";
        }
        if (formData.personalValues.length === 0) {
          newErrors.personalValues = "Please select at least one personal value";
        }
        break;
        
      case "compensation-goals":
        if (!formData.compensationGoals) {
          newErrors.compensationGoals = "Please select your compensation goal";
        }
        if (!formData.minimumCompensation) {
          newErrors.minimumCompensation = "Please enter your minimum compensation expectation";
        }
        break;
        
      case "create-password":
        if (!formData.password) {
          newErrors.password = "Please enter a password";
        } else if (formData.password.length < 8) {
          newErrors.password = "Password must be at least 8 characters";
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step navigation
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      let nextStep: OnboardingStep;
      
      switch (currentStep) {
        case "basic-info":
          nextStep = "sport-info";
          break;
        case "sport-info":
          nextStep = "school-info";
          break;
        case "school-info":
          nextStep = "social-media";
          break;
        case "social-media":
          nextStep = "content-style";
          break;
        case "content-style":
          nextStep = "brand-preferences";
          break;
        case "brand-preferences":
          nextStep = "compensation-goals";
          break;
        case "compensation-goals":
          nextStep = "create-password";
          break;
        default:
          nextStep = "create-password";
      }
      
      setCurrentStep(nextStep);
      window.scrollTo(0, 0);
    }
  };
  
  // Handle back navigation
  const handlePrevStep = () => {
    let prevStep: OnboardingStep;
    
    switch (currentStep) {
      case "sport-info":
        prevStep = "basic-info";
        break;
      case "school-info":
        prevStep = "sport-info";
        break;
      case "social-media":
        prevStep = "school-info";
        break;
      case "content-style":
        prevStep = "social-media";
        break;
      case "brand-preferences":
        prevStep = "content-style";
        break;
      case "compensation-goals":
        prevStep = "brand-preferences";
        break;
      case "create-password":
        prevStep = "compensation-goals";
        break;
      default:
        prevStep = "basic-info";
    }
    
    setCurrentStep(prevStep);
    window.scrollTo(0, 0);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateCurrentStep()) {
      setIsSubmitting(true);
      
      try {
        // Register user first
        const userData = {
          username: formData.email,
          email: formData.email,
          password: formData.password,
          fullName: `${formData.firstName} ${formData.lastName}`,
          userType: formData.userType // Always "athlete"
        };
        
        // Register user with the API
        const userResponse = await apiRequest("POST", "/api/auth/register", userData);
        
        if (!userResponse.ok) {
          // Handle error response
          let errorMessage = "Failed to create account";
          try {
            const errorData = await userResponse.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            console.error("Error parsing error response:", e);
          }
          throw new Error(errorMessage);
        }
        
        // Parse successful response
        let userResponseData;
        try {
          userResponseData = await userResponse.json();
          console.log("Registration successful:", userResponseData);
        } catch (error) {
          console.error("Error parsing success response:", error);
          throw new Error("Registration succeeded but unable to process server response");
        }
        
        // Extract the session ID from the response
        const sessionId = userResponseData?.sessionId;
        
        if (!sessionId) {
          console.error("Registration response missing sessionId:", userResponseData);
          throw new Error("No session ID returned from registration");
        }
        
        // Create athlete profile (matching the expected schema on the backend)
        const athleteProfileData = {
          name: `${formData.firstName} ${formData.lastName}`,
          userType: formData.userType,
          sessionId: sessionId,
          
          // Required fields from schema
          school: formData.school,
          division: formData.division,
          sport: formData.sport,
          followerCount: formData.followerCount,
          contentStyle: formData.contentStyle,
          compensationGoals: formData.compensationGoals,
          
          // Optional fields
          email: formData.email,
          phone: formData.phone,
          birthdate: formData.dob || null,
          gender: formData.gender || null,
          position: formData.position || null,
          graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null,
          major: formData.major || null,
          gpa: formData.gpa ? parseFloat(formData.gpa) : null,
          socialHandles: formData.socialHandles || {},
          contentTypes: formData.contentTypes,
          topPerformingContentThemes: formData.topPerformingContentThemes,
          preferredProductCategories: formData.preferredProductCategories,
          previousBrandDeals: formData.previousBrandDeals ? {
            hasPrevious: true,
            details: [] // We're not collecting detailed info at this step
          } : null,
          personalValues: formData.personalValues,
          causes: formData.causes,
          availableForTravel: formData.availableForTravel,
          minimumCompensation: formData.minimumCompensation,
        };
        
        // Submit profile data
        const profileResponse = await apiRequest("POST", "/api/personalized-onboarding", athleteProfileData);
        
        if (!profileResponse.ok) {
          // Handle error response
          let errorMessage = "Failed to create athlete profile";
          try {
            const errorData = await profileResponse.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            console.error("Profile creation error:", errorData);
          } catch (e) {
            console.error("Error parsing profile response:", e);
          }
          throw new Error(errorMessage);
        }
        
        // Parse successful response
        let profileResponseData;
        try {
          profileResponseData = await profileResponse.json();
          console.log("Profile created successfully:", profileResponseData);
        } catch (error) {
          console.error("Error parsing profile success response:", error);
          // Don't throw here - the profile was created, we just couldn't parse response
        }
        
        toast({
          title: "Success!",
          description: "Your athlete profile has been created successfully.",
          variant: "default",
        });
        
        // Redirect to athlete dashboard
        setLocation("/athlete/dashboard");
      } catch (error) {
        console.error("Onboarding error:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Calculate progress percentage
  const calculateProgress = (): number => {
    const totalSteps = 7; // Total number of steps excluding "create-password"
    
    switch (currentStep) {
      case "basic-info": return (1 / totalSteps) * 100;
      case "sport-info": return (2 / totalSteps) * 100;
      case "school-info": return (3 / totalSteps) * 100;
      case "social-media": return (4 / totalSteps) * 100;
      case "content-style": return (5 / totalSteps) * 100;
      case "brand-preferences": return (6 / totalSteps) * 100;
      case "compensation-goals": return (7 / totalSteps) * 100;
      case "create-password": return 100;
      default: return 0;
    }
  };
  
  // Get the step number for display purposes
  const getStepNumber = (): number => {
    switch (currentStep) {
      case "basic-info": return 1;
      case "sport-info": return 2;
      case "school-info": return 3;
      case "social-media": return 4;
      case "content-style": return 5;
      case "brand-preferences": return 6;
      case "compensation-goals": return 7;
      case "create-password": return 8;
      default: return 1;
    }
  };
  
  // Render form fields based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case "basic-info":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Tell Us About Yourself</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatedFormField 
                label="First Name" 
                error={errors.firstName}
              >
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Your first name"
                  className={`w-full p-2 border rounded-md ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                />
              </AnimatedFormField>
              
              <AnimatedFormField 
                label="Last Name" 
                error={errors.lastName}
              >
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Your last name"
                  className={`w-full p-2 border rounded-md ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                />
              </AnimatedFormField>
            </div>
            
            <AnimatedFormField 
              label="Date of Birth" 
              error={errors.dob}
            >
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.dob ? 'border-red-500' : 'border-gray-300'}`}
              />
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Gender (Optional)" 
              error={errors.gender}
            >
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select gender (optional)</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Email" 
              error={errors.email}
            >
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
                className={`w-full p-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              />
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Phone Number (Optional)" 
              error={errors.phone}
            >
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Your phone number"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </AnimatedFormField>
          </div>
        );
        
      case "sport-info":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Your Athletic Background</h2>
            
            <AnimatedFormField 
              label="Sport" 
              error={errors.sport}
            >
              <select
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.sport ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select your sport</option>
                {sportOptions.map((sport) => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Position/Role" 
              error={errors.position}
            >
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="Your position or role in the sport"
                className={`w-full p-2 border rounded-md ${errors.position ? 'border-red-500' : 'border-gray-300'}`}
              />
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Sport Achievements (Optional)" 
              error={errors.sportAchievements}
            >
              <textarea
                name="sportAchievements"
                value={formData.sportAchievements.join('\n')}
                onChange={(e) => {
                  const achievements = e.target.value
                    .split('\n')
                    .filter(a => a.trim().length > 0);
                  setFormData(prev => ({ ...prev, sportAchievements: achievements }));
                }}
                placeholder="List your key athletic achievements, one per line."
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={4}
              />
            </AnimatedFormField>
          </div>
        );
        
      case "school-info":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Your Academic Information</h2>
            
            <AnimatedFormField 
              label="School/University" 
              error={errors.school}
            >
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="Your school or university"
                className={`w-full p-2 border rounded-md ${errors.school ? 'border-red-500' : 'border-gray-300'}`}
              />
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Division" 
              error={errors.division}
            >
              <select
                name="division"
                value={formData.division}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.division ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select your division</option>
                {divisionOptions.map((division) => (
                  <option key={division} value={division}>{division}</option>
                ))}
              </select>
            </AnimatedFormField>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatedFormField 
                label="Expected Graduation Year" 
                error={errors.graduationYear}
              >
                <select
                  name="graduationYear"
                  value={formData.graduationYear}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select year</option>
                  {[...Array(8)].map((_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year.toString()}>{year}</option>
                    );
                  })}
                </select>
              </AnimatedFormField>
              
              <AnimatedFormField 
                label="Major (Optional)" 
                error={errors.major}
              >
                <input
                  type="text"
                  name="major"
                  value={formData.major}
                  onChange={handleChange}
                  placeholder="Your field of study"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </AnimatedFormField>
            </div>
            
            <AnimatedFormField 
              label="GPA (Optional)" 
              error={errors.gpa}
            >
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                name="gpa"
                value={formData.gpa}
                onChange={handleChange}
                placeholder="Your GPA (e.g., 3.5)"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </AnimatedFormField>
          </div>
        );
        
      case "social-media":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Your Social Media Presence</h2>
            
            {errors.socialHandles && (
              <div className="text-red-500 text-sm">{errors.socialHandles}</div>
            )}
            
            <AnimatedFormField 
              label="Instagram Handle (e.g., @username)" 
              error={undefined}
            >
              <div className="flex items-center">
                <Instagram className="mr-2 h-5 w-5 text-pink-500" />
                <input
                  type="text"
                  name="socialHandles.instagram"
                  value={formData.socialHandles.instagram || ''}
                  onChange={handleChange}
                  placeholder="@username"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="TikTok Handle (e.g., @username)" 
              error={undefined}
            >
              <div className="flex items-center">
                <Music className="mr-2 h-5 w-5 text-black" />
                <input
                  type="text"
                  name="socialHandles.tiktok"
                  value={formData.socialHandles.tiktok || ''}
                  onChange={handleChange}
                  placeholder="@username"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Twitter/X Handle (e.g., @username)" 
              error={undefined}
            >
              <div className="flex items-center">
                <Twitter className="mr-2 h-5 w-5 text-blue-400" />
                <input
                  type="text"
                  name="socialHandles.twitter"
                  value={formData.socialHandles.twitter || ''}
                  onChange={handleChange}
                  placeholder="@username"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Other Social Network (Optional)" 
              error={undefined}
            >
              <div className="flex items-center">
                <input
                  type="text"
                  name="socialHandles.other"
                  value={formData.socialHandles.other || ''}
                  onChange={handleChange}
                  placeholder="Other social media profile"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Total Follower Count (across all platforms)" 
              error={errors.followerCount}
            >
              <input
                type="number"
                name="followerCount"
                value={formData.followerCount || ''}
                onChange={handleChange}
                placeholder="Total number of followers"
                className={`w-full p-2 border rounded-md ${errors.followerCount ? 'border-red-500' : 'border-gray-300'}`}
              />
            </AnimatedFormField>
          </div>
        );
        
      case "content-style":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Your Content Style</h2>
            
            <AnimatedFormField 
              label="Primary Content Style" 
              error={errors.contentStyle}
            >
              <select
                name="contentStyle"
                value={formData.contentStyle}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.contentStyle ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select your primary content style</option>
                {contentStyleOptions.map((style) => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Content Types You Create" 
              error={errors.contentTypes}
            >
              <div className="space-y-2">
                {contentTypeOptions.map((type) => (
                  <label key={type.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={type.value}
                      checked={formData.contentTypes.includes(type.value)}
                      onChange={(e) => handleCheckboxChange(e, 'contentTypes')}
                      className="rounded"
                    />
                    <div className="flex items-center">
                      {type.icon}
                      <span>{type.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Top Performing Content Themes (Optional)" 
              error={undefined}
            >
              <textarea
                name="topPerformingContentThemes"
                value={formData.topPerformingContentThemes.join('\n')}
                onChange={(e) => {
                  const themes = e.target.value
                    .split('\n')
                    .filter(a => a.trim().length > 0);
                  setFormData(prev => ({ ...prev, topPerformingContentThemes: themes }));
                }}
                placeholder="What topics/themes get you the most engagement? (One per line)"
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </AnimatedFormField>
          </div>
        );
        
      case "brand-preferences":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Your Brand Preferences</h2>
            
            <AnimatedFormField 
              label="Product Categories You're Interested In" 
              error={errors.preferredProductCategories}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {productCategories.map((category) => (
                  <label key={category} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={category}
                      checked={formData.preferredProductCategories.includes(category)}
                      onChange={(e) => handleCheckboxChange(e, 'preferredProductCategories')}
                      className="rounded"
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Have you worked with brands before?" 
              error={errors.previousBrandDeals !== undefined ? 'Please answer this question' : undefined}
            >
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="previousBrandDeals"
                    checked={formData.previousBrandDeals === true}
                    onChange={() => handleRadioChange('previousBrandDeals', true)}
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="previousBrandDeals"
                    checked={formData.previousBrandDeals === false}
                    onChange={() => handleRadioChange('previousBrandDeals', false)}
                  />
                  <span>No</span>
                </label>
              </div>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Personal Values (Select all that apply)" 
              error={errors.personalValues}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {personalValueOptions.map((value) => (
                  <label key={value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={value}
                      checked={formData.personalValues.includes(value)}
                      onChange={(e) => handleCheckboxChange(e, 'personalValues')}
                      className="rounded"
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Causes You Care About (Optional)" 
              error={undefined}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {causeOptions.map((cause) => (
                  <label key={cause} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={cause}
                      checked={formData.causes.includes(cause)}
                      onChange={(e) => handleCheckboxChange(e, 'causes')}
                      className="rounded"
                    />
                    <span>{cause}</span>
                  </label>
                ))}
              </div>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Are you available for travel for brand partnerships?" 
              error={undefined}
            >
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="availableForTravel"
                    checked={formData.availableForTravel === true}
                    onChange={() => handleRadioChange('availableForTravel', true)}
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="availableForTravel"
                    checked={formData.availableForTravel === false}
                    onChange={() => handleRadioChange('availableForTravel', false)}
                  />
                  <span>No</span>
                </label>
              </div>
            </AnimatedFormField>
          </div>
        );
        
      case "compensation-goals":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Your Compensation Goals</h2>
            
            <AnimatedFormField 
              label="What are your compensation goals for brand partnerships?" 
              error={errors.compensationGoals}
            >
              <select
                name="compensationGoals"
                value={formData.compensationGoals}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.compensationGoals ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select your compensation goal</option>
                <option value="monetary">Primarily monetary compensation</option>
                <option value="product">Primarily product compensation</option>
                <option value="exposure">Primarily exposure and building portfolio</option>
                <option value="hybrid">Hybrid of money and products</option>
                <option value="flexible">Flexible, depends on the brand</option>
              </select>
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Minimum Compensation Expectation (Per Post)" 
              error={errors.minimumCompensation}
            >
              <select
                name="minimumCompensation"
                value={formData.minimumCompensation}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.minimumCompensation ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select minimum compensation</option>
                <option value="products">Products only</option>
                <option value="$0-$100">$0-$100 per post</option>
                <option value="$100-$250">$100-$250 per post</option>
                <option value="$250-$500">$250-$500 per post</option>
                <option value="$500-$1000">$500-$1000 per post</option>
                <option value="$1000-$2500">$1000-$2500 per post</option>
                <option value="$2500+">$2500+ per post</option>
              </select>
            </AnimatedFormField>
          </div>
        );
        
      case "create-password":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Create Your Password</h2>
            <p className="text-center text-gray-600">
              You're almost done! Just create a password to secure your account.
            </p>
            
            <AnimatedFormField 
              label="Create Password" 
              error={errors.password}
            >
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a secure password"
                className={`w-full p-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              />
            </AnimatedFormField>
            
            <AnimatedFormField 
              label="Confirm Password" 
              error={errors.confirmPassword}
            >
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={`w-full p-2 border rounded-md ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
              />
            </AnimatedFormField>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full p-2 bg-gradient-to-r from-red-500 to-amber-500 text-white font-semibold rounded-md hover:from-red-600 hover:to-amber-600 transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Your Account...
                  </span>
                ) : "Create Your Athlete Account"}
              </button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-black py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Athlete Registration</h1>
          <p className="text-gray-300">Join Contested and connect with brands that value your authentic voice</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-xl overflow-hidden"
        >
          <div className="p-2 bg-gradient-to-r from-red-500 to-amber-500">
            <div className="flex items-center justify-between px-4 py-1">
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-white mr-2" />
                <span className="text-white font-medium">Athlete Onboarding</span>
              </div>
              <div className="text-white text-sm">
                Step {getStepNumber()} of 8
              </div>
            </div>
          </div>
          
          <div className="p-1">
            <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-300 ease-in-out"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
          
          <form className="p-6">
            {renderStepContent()}
            
            {currentStep !== "create-password" && (
              <div className="flex justify-between mt-8">
                {currentStep !== "basic-info" ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-all"
                  >
                    <ChevronLeft className="h-4 w-4 inline mr-1" /> Back
                  </button>
                ) : (
                  <div></div> // Empty div to maintain flex spacing
                )}
                
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-amber-500 text-white rounded-md hover:from-red-600 hover:to-amber-600 transition-all"
                >
                  Next <ChevronRight className="h-4 w-4 inline ml-1" />
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}