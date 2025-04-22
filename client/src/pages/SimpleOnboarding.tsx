import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign,
  MapPin,
  Building,
  Mail,
  Phone,
  User,
  CheckCircle,
  ChevronRight,
  Zap,
  Trophy,
  Target,
  BarChart,
  Info as InfoIcon,
  ChevronLeft,
  GraduationCap,
  Award,
  Gamepad2,
  Users,
  Dumbbell,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

// Import UI components
import SliderWithInput from "@/components/SliderWithInput";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { industries, restrictedIndustries } from "@shared/industries";

// Form field component
interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  errorMessage?: string;
  isTouched?: boolean;
  rows?: number;
  maxLength?: number;
  min?: string;
  max?: string;
  step?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  errorMessage,
  isTouched,
  rows,
  maxLength,
  min,
  max,
  step
}) => {
  return (
    <div>
      <div className="mb-2">
        <label htmlFor={name} className="block text-sm font-medium text-white">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows || 4}
          maxLength={maxLength}
          className={`w-full rounded-md bg-zinc-800 border ${isTouched && errorMessage ? 'border-red-500' : 'border-zinc-700'} py-2 px-3 text-white`}
          required={required}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-md bg-zinc-800 border ${isTouched && errorMessage ? 'border-red-500' : 'border-zinc-700'} py-2 px-3 text-white`}
          required={required}
          min={min}
          max={max}
          step={step}
        />
      )}
      
      {isTouched && errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

// RadioCardOption component for styled radio selection
interface RadioCardOptionProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const RadioCardOption: React.FC<RadioCardOptionProps> = ({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  icon
}) => {
  return (
    <label 
      className={`relative block cursor-pointer rounded-lg border p-4 ${
        checked 
          ? 'border-primary bg-primary bg-opacity-10' 
          : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className="flex items-center">
        {icon && <div className="flex items-center text-primary">{icon}</div>}
        <div className="ml-2">
          <h3 className={`text-base font-medium ${checked ? 'text-primary' : 'text-white'}`}>
            {title}
          </h3>
          <p className="text-sm text-zinc-400">{description}</p>
        </div>
      </div>
      <div 
        className={`absolute top-2 right-2 h-4 w-4 rounded-full flex items-center justify-center ${
          checked ? 'bg-primary' : 'bg-zinc-700'
        }`}
      >
        {checked && <CheckCircle className="h-3 w-3 text-white" />}
      </div>
    </label>
  );
};

// Step types
type OnboardingStep = 
  | "user-type"
  | "business-type"
  | "industry"
  | "goals"
  | "past-partnerships"
  | "budget"
  | "zip-code"
  | "operating-location"
  | "contact-info"
  | "business-size"
  | "create-password"
  // Athlete-specific steps
  | "athlete-category"
  | "athlete-basic-info"
  | "athlete-academic-info"
  | "athlete-sport-info"
  | "athlete-eligibility-check"
  | "athlete-social-media"
  | "athlete-content-style"
  | "athlete-compensation"
  | "athlete-brand-values";

// Form data type
interface BusinessFormData {
  // User type
  userType: "athlete" | "business" | "";
  
  // Type
  businessType: "product" | "service" | "hybrid" | "";
  
  // Athlete category type
  athleteCategory: "college" | "professional" | "semi_professional" | "esports" | "influencer" | "other" | "";
  
  // Industry
  industry: string;
  accessRestriction: "restricted" | "unrestricted" | "";
  
  // Goals
  goalIdentification: string[];
  
  // Past partnerships
  hasPastPartnership: boolean | null;
  
  // Budget
  budgetMin: number;
  budgetMax: number;
  
  // Location
  zipCode: string;
  
  // Operating locations (for service businesses)
  operatingLocation: string[];
  
  // Contact info
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  
  // Business size
  businessSize: "sole_proprietor" | "small_team" | "medium" | "enterprise" | "";
  
  // Password
  password: string;
  confirmPassword: string;
  
  // User info
  name: string;
  email: string;
  
  // Athlete-specific fields
  // Basic Information
  phone: string;
  birthdate: string;
  gender: string;
  bio: string;
  
  // Academic Information
  school: string;
  division: string;
  graduationYear: number | null;
  major: string;
  gpa: number | null;
  academicHonors: string;
  
  // Athletic Information
  sport: string;
  position: string;
  sportAchievements: string;
  stats: Record<string, any>;
  
  // Social Media
  socialHandles: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
    other?: string;
  };
  followerCount: number | null;
  averageEngagementRate: number | null;
  
  // Content Creation
  contentStyle: string;
  contentTypes: string[];
  
  // Brand Preferences
  compensationGoals: string;
  preferredProductCategories: string[];
  previousBrandDeals: any[];
  
  // Personal Brand
  personalValues: string[];
  causes: string[];
  
  // Availability & Requirements
  availabilityTimeframe: string;
  minimumCompensation: string;
  
  // Eligibility status (for verification)
  eligibilityStatus: "pending" | "verified" | "rejected" | "";
  eligibilityMessage: string;
}

// Initial form data
const initialFormData: BusinessFormData = {
  userType: "",
  businessType: "",
  athleteCategory: "",
  industry: "",
  accessRestriction: "",
  goalIdentification: [],
  hasPastPartnership: null,
  budgetMin: 500,
  budgetMax: 5000,
  zipCode: "",
  operatingLocation: [],
  contactName: "",
  contactTitle: "",
  contactEmail: "",
  contactPhone: "",
  businessSize: "",
  password: "",
  confirmPassword: "",
  name: "",
  email: "",
  
  // Athlete-specific fields with default values
  phone: "",
  birthdate: "",
  gender: "",
  bio: "",
  
  school: "",
  division: "",
  graduationYear: null,
  major: "",
  gpa: null,
  academicHonors: "",
  
  sport: "",
  position: "",
  sportAchievements: "",
  stats: {},
  
  socialHandles: {},
  followerCount: null,
  averageEngagementRate: null,
  
  contentStyle: "",
  contentTypes: [],
  
  compensationGoals: "",
  preferredProductCategories: [],
  previousBrandDeals: [],
  
  personalValues: [],
  causes: [],
  
  availabilityTimeframe: "",
  minimumCompensation: "",
  
  eligibilityStatus: "",
  eligibilityMessage: ""
};

export default function SimpleOnboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("user-type");
  const [formData, setFormData] = useState<BusinessFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Fetch a new session ID when component mounts
  useEffect(() => {
    const getSessionId = async () => {
      try {
        // Generate a client-side unique ID that doesn't rely on server storage
        // This is more reliable than depending on WebSocket connections
        const localSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        setSessionId(localSessionId);
        console.log("New local session created:", localSessionId);
        
        // Also try the server approach as backup
        try {
          const response = await fetch('/api/session/new');
          const data = await response.json();
          if (data.success) {
            // Only update if we got a valid session ID
            setSessionId(data.sessionId);
            console.log("Server session created:", data.sessionId);
          }
        } catch (serverError) {
          // If server approach fails, we already have the local ID as fallback
          console.warn("Server session creation failed, using local ID instead:", serverError);
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
        toast({
          title: "Connection Issue",
          description: "There was a problem initializing your session. We'll continue with a local session.",
        });
        
        // Final fallback - set a simple random ID
        const fallbackId = `fallback_${Math.random().toString(36).substring(2, 9)}`;
        setSessionId(fallbackId);
      }
    };
    
    getSessionId();
  }, [toast]);
  
  // Handle form data changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof BusinessFormData) => {
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
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>, value: any) => {
    const { name } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear any error on this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validate the current step
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      // Common validation
      case "user-type":
        if (!formData.userType) {
          newErrors.userType = "Please select whether you're an athlete or a business";
        }
        break;
     
      // Business-specific validation   
      case "business-type":
        if (!formData.businessType) {
          newErrors.businessType = "Please select your business type";
        }
        break;
        
      case "industry":
        if (!formData.industry) {
          newErrors.industry = "Please enter your industry";
        }
        break;
        
      case "goals":
        if (formData.goalIdentification.length === 0) {
          newErrors.goalIdentification = "Please select at least one goal";
        }
        break;
        
      case "past-partnerships":
        if (formData.hasPastPartnership === null) {
          newErrors.hasPastPartnership = "Please indicate whether you've partnered with athletes before";
        }
        break;
        
      case "budget":
        if (formData.budgetMin > formData.budgetMax) {
          newErrors.budget = "Minimum budget cannot exceed maximum budget";
        }
        break;
        
      case "zip-code":
        if (!formData.zipCode || !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
          newErrors.zipCode = "Please enter a valid zip code";
        }
        break;
        
      case "operating-location":
        if (formData.businessType === "service" && formData.operatingLocation.length === 0) {
          newErrors.operatingLocation = "Please select at least one operating location";
        }
        break;
        
      case "contact-info":
        if (!formData.name) {
          newErrors.name = "Please enter your name";
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }
        if (!formData.contactPhone) {
          newErrors.contactPhone = "Please enter a contact phone number";
        }
        break;
        
      case "business-size":
        if (!formData.businessSize) {
          newErrors.businessSize = "Please select your business size";
        }
        break;
        
      // Athlete-specific validation
      case "athlete-category":
        if (!formData.athleteCategory) {
          newErrors.athleteCategory = "Please select your athlete category";
        }
        break;
        
      case "athlete-basic-info":
        if (!formData.name) {
          newErrors.name = "Please enter your full name";
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }
        if (!formData.phone) {
          newErrors.phone = "Please enter your phone number";
        }
        if (!formData.birthdate) {
          newErrors.birthdate = "Please enter your date of birth";
        }
        break;
      
      case "athlete-academic-info":
        if (!formData.school) {
          newErrors.school = "Please enter your school name";
        }
        if (!formData.division) {
          newErrors.division = "Please select your division";
        }
        break;
      
      case "athlete-sport-info":
        if (!formData.sport) {
          newErrors.sport = "Please select your primary sport";
        }
        if (!formData.position) {
          newErrors.position = "Please enter your position";
        }
        break;
      
      case "athlete-eligibility-check":
        // Eligibility check would typically query the database
        // For now, we'll just make sure we have the minimum required data
        if (!formData.school || !formData.sport || !formData.division) {
          newErrors.eligibility = "We need your school, sport, and division to verify eligibility";
        }
        break;
      
      case "athlete-social-media":
        if (!formData.followerCount || formData.followerCount <= 0) {
          newErrors.followerCount = "Please provide your total follower count";
        }
        if (Object.keys(formData.socialHandles).length === 0) {
          newErrors.socialHandles = "Please provide at least one social media handle";
        }
        break;
        
      case "athlete-content-style":
        if (!formData.contentStyle) {
          newErrors.contentStyle = "Please describe your content style";
        }
        if (formData.contentTypes.length === 0) {
          newErrors.contentTypes = "Please select at least one type of content you create";
        }
        break;
        
      case "athlete-compensation":
        if (!formData.compensationGoals) {
          newErrors.compensationGoals = "Please select your compensation preference";
        }
        if (!formData.minimumCompensation) {
          newErrors.minimumCompensation = "Please provide your minimum compensation expectation";
        }
        break;
        
      case "athlete-brand-values":
        if (formData.personalValues.length === 0) {
          newErrors.personalValues = "Please select at least one personal value";
        }
        break;
        
      // Common endpoint
      case "create-password":
        // We already have name and email at this point, just validate password
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
      // Update session userType when user type is selected
      if (currentStep === "user-type" && sessionId) {
        fetch(`/api/session/${sessionId}/user-type`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userType: formData.userType }),
        })
        .then(response => response.json())
        .then(data => {
          console.log("Session updated with user type:", data);
        })
        .catch(error => {
          console.error("Failed to update session user type:", error);
        });
      }
      
      // Set access restriction based on industry (Logic tree step)
      if (currentStep === "industry") {
        const isRestricted = restrictedIndustries.includes(formData.industry);
        
        setFormData(prev => ({
          ...prev,
          accessRestriction: isRestricted ? "restricted" : "unrestricted"
        }));
      }
      
      // Determine next step based on current step, user type, and business type
      let nextStep: OnboardingStep;
      
      // Branch flow based on user type
      if (formData.userType === "athlete") {
        // Athlete-specific flow
        switch (currentStep) {
          case "user-type":
            nextStep = "athlete-category";
            break;
            
          case "athlete-category":
            nextStep = "athlete-basic-info";
            break;
            
          case "athlete-basic-info":
            // Skip academic info for professional, influencer, esports athletes
            if (formData.athleteCategory === "professional" || 
                formData.athleteCategory === "influencer" || 
                formData.athleteCategory === "esports") {
              nextStep = "athlete-sport-info";
            } else {
              nextStep = "athlete-academic-info";
            }
            break;
            
          case "athlete-academic-info":
            nextStep = "athlete-sport-info";
            break;
            
          case "athlete-sport-info":
            // Skip eligibility check for non-college athletes
            if (formData.athleteCategory !== "college") {
              nextStep = "athlete-social-media";
            } else {
              nextStep = "athlete-eligibility-check";
            }
            break;
            
          case "athlete-eligibility-check":
            nextStep = "athlete-social-media";
            break;
            
          case "athlete-social-media":
            nextStep = "athlete-content-style";
            break;
            
          case "athlete-content-style":
            nextStep = "athlete-compensation";
            break;
            
          case "athlete-compensation":
            nextStep = "athlete-brand-values";
            break;
            
          case "athlete-brand-values":
            nextStep = "create-password";
            break;
            
          default:
            nextStep = "create-password";
        }
      } else {
        // Business flow (existing flow)
        switch (currentStep) {
          case "user-type":
            // For businesses, proceed to the business type selection step
            nextStep = "business-type";
            break;
          case "business-type":
            nextStep = "industry";
            break;
          case "industry":
            nextStep = "goals";
            break;
          case "goals":
            nextStep = "past-partnerships";
            break;
          case "past-partnerships":
            nextStep = "budget";
            break;
          case "budget":
            nextStep = "zip-code";
            break;
          case "zip-code":
            nextStep = formData.businessType === "service" ? "operating-location" : "contact-info";
            break;
          case "operating-location":
            nextStep = "contact-info";
            break;
          case "contact-info":
            nextStep = "business-size";
            break;
          case "business-size":
            nextStep = "create-password";
            break;
          default:
            nextStep = "create-password";
        }
      }
      
      setCurrentStep(nextStep);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (validateCurrentStep()) {
      setIsSubmitting(true);
      
      try {
        // Prepare profile data based on user type
        const profileData = {
          sessionId,
          userType: formData.userType,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          basicInfo: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            sport: formData.sport,
            division: formData.division,
            school: formData.school,
            followerCount: formData.followerCount,
            socialHandles: formData.socialHandles
          },
          visualPreferences: {
            contentStyle: formData.contentStyle,
            contentTypes: formData.contentTypes,
            audienceSize: formData.followerCount ? (
              formData.followerCount > 10000 ? "large" :
              formData.followerCount > 5000 ? "medium" : "small"
            ) : "small"
          },
          budgetValues: {
            budgetRange: {
              min: formData.budgetMin,
              max: formData.budgetMax
            },
            compensationGoals: formData.compensationGoals,
            minimumCompensation: formData.minimumCompensation
          }
        };
        
        // Submit profile data to API
        const response = await apiRequest("POST", "/api/personalized-onboarding", profileData);
        const result = await response.json();
        
        if (response.ok) {
          toast({
            title: "Profile Created",
            description: "Your profile has been created successfully!",
          });
          
          // Redirect based on user type
          setTimeout(() => {
            if (formData.userType === "athlete") {
              setLocation("/athlete-dashboard");
            } else {
              setLocation("/business-dashboard");
            }
          }, 1500);
        } else {
          throw new Error(result.message || "Failed to create profile");
        }
      } catch (error) {
        console.error("Error submitting profile:", error);
        toast({
          title: "Submission Error",
          description: error instanceof Error ? error.message : "Failed to submit profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Handle back button
  const handleBack = () => {
    if (currentStep === "user-type") {
      // If at first step, go back to home
      setLocation("/");
      return;
    }
    
    // Determine previous step based on current step and user type
    let previousStep: OnboardingStep;
    
    if (formData.userType === "athlete") {
      // Athlete flow backward navigation
      switch (currentStep) {
        case "athlete-category":
          previousStep = "user-type";
          break;
          
        case "athlete-basic-info":
          previousStep = "athlete-category";
          break;
          
        case "athlete-academic-info":
          previousStep = "athlete-basic-info";
          break;
          
        case "athlete-sport-info":
          // If coming from basic info (skipped academic)
          if (formData.athleteCategory === "professional" || 
              formData.athleteCategory === "influencer" || 
              formData.athleteCategory === "esports") {
            previousStep = "athlete-basic-info";
          } else {
            previousStep = "athlete-academic-info";
          }
          break;
          
        case "athlete-eligibility-check":
          previousStep = "athlete-sport-info";
          break;
          
        case "athlete-social-media":
          // If coming from sport info (skipped eligibility)
          if (formData.athleteCategory !== "college") {
            previousStep = "athlete-sport-info";
          } else {
            previousStep = "athlete-eligibility-check";
          }
          break;
          
        case "athlete-content-style":
          previousStep = "athlete-social-media";
          break;
          
        case "athlete-compensation":
          previousStep = "athlete-content-style";
          break;
          
        case "athlete-brand-values":
          previousStep = "athlete-compensation";
          break;
          
        case "create-password":
          previousStep = "athlete-brand-values";
          break;
          
        default:
          previousStep = "user-type";
      }
    } else {
      // Business flow backward navigation
      switch (currentStep) {
        case "business-type":
          previousStep = "user-type";
          break;
          
        case "industry":
          previousStep = "business-type";
          break;
          
        case "goals":
          previousStep = "industry";
          break;
          
        case "past-partnerships":
          previousStep = "goals";
          break;
          
        case "budget":
          previousStep = "past-partnerships";
          break;
          
        case "zip-code":
          previousStep = "budget";
          break;
          
        case "operating-location":
          previousStep = "zip-code";
          break;
          
        case "contact-info":
          previousStep = formData.businessType === "service" ? "operating-location" : "zip-code";
          break;
          
        case "business-size":
          previousStep = "contact-info";
          break;
          
        case "create-password":
          previousStep = formData.userType === "athlete" ? "athlete-brand-values" : "business-size";
          break;
          
        default:
          previousStep = "user-type";
      }
    }
    
    setCurrentStep(previousStep);
  };
  
  // Determine step title based on current step
  const getStepTitle = (): string => {
    switch (currentStep) {
      // Common steps
      case "user-type":
        return "Welcome to Contested";
        
      case "create-password":
        return "Create Account";
        
      // Business steps
      case "business-type":
        return "Business Type";
        
      case "industry":
        return "Industry";
        
      case "goals":
        return "Partnership Goals";
        
      case "past-partnerships":
        return "Past Partnerships";
        
      case "budget":
        return "Budget Range";
        
      case "zip-code":
        return "Business Location";
        
      case "operating-location":
        return "Operating Locations";
        
      case "contact-info":
        return "Contact Information";
        
      case "business-size":
        return "Business Size";
        
      // Athlete steps
      case "athlete-category":
        return "Athlete Type";
        
      case "athlete-basic-info":
        return "Basic Information";
        
      case "athlete-academic-info":
        return "Academic Information";
        
      case "athlete-sport-info":
        return "Athletic Information";
        
      case "athlete-eligibility-check":
        return "Eligibility Verification";
        
      case "athlete-social-media":
        return "Social Media Presence";
        
      case "athlete-content-style":
        return "Content Creation";
        
      case "athlete-compensation":
        return "Compensation Preferences";
        
      case "athlete-brand-values":
        return "Personal Brand Values";
        
      default:
        return "Onboarding";
    }
  };
  
  // Calculate progress percentage
  const calculateProgress = (): number => {
    const athleteSteps = [
      "user-type",
      "athlete-category",
      "athlete-basic-info",
      "athlete-academic-info",
      "athlete-sport-info",
      "athlete-eligibility-check",
      "athlete-social-media",
      "athlete-content-style",
      "athlete-compensation",
      "athlete-brand-values",
      "create-password"
    ];
    
    const businessSteps = [
      "user-type",
      "business-type",
      "industry",
      "goals",
      "past-partnerships",
      "budget",
      "zip-code",
      "operating-location",
      "contact-info",
      "business-size",
      "create-password"
    ];
    
    // Skip some steps based on athlete type
    let totalSteps: string[];
    if (formData.userType === "athlete") {
      if (formData.athleteCategory === "professional" || 
          formData.athleteCategory === "influencer" || 
          formData.athleteCategory === "esports") {
        // Skip academic info and eligibility check
        totalSteps = athleteSteps.filter(step => 
          step !== "athlete-academic-info" && step !== "athlete-eligibility-check"
        );
      } else if (formData.athleteCategory === "college") {
        // Include all steps
        totalSteps = athleteSteps;
      } else {
        // Default athlete flow
        totalSteps = athleteSteps;
      }
    } else if (formData.userType === "business") {
      // Skip operating location for non-service businesses
      if (formData.businessType !== "service") {
        totalSteps = businessSteps.filter(step => step !== "operating-location");
      } else {
        totalSteps = businessSteps;
      }
    } else {
      // Default to generic progress if user type not selected
      totalSteps = ["user-type"];
    }
    
    const currentIndex = totalSteps.indexOf(currentStep);
    if (currentIndex === -1) return 0;
    
    return Math.floor((currentIndex / (totalSteps.length - 1)) * 100);
  };
  
  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case "user-type":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">I am a...</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <RadioCardOption
                name="userType"
                value="athlete"
                checked={formData.userType === "athlete"}
                onChange={(e) => handleRadioChange(e, "athlete")}
                title="College Athlete"
                description="Connect with businesses for sponsorships & NIL deals"
                icon={<Trophy className="h-6 w-6 mr-2" />}
              />
              <RadioCardOption
                name="userType"
                value="business"
                checked={formData.userType === "business"}
                onChange={(e) => handleRadioChange(e, "business")}
                title="Business"
                description="Find and partner with college athletes for marketing opportunities"
                icon={<Building className="h-6 w-6 mr-2" />}
              />
            </div>
            {errors.userType && <p className="text-red-500 text-sm">{errors.userType}</p>}
          </div>
        );
        
      case "business-type":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">What type of business are you?</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <RadioCardOption
                name="businessType"
                value="product"
                checked={formData.businessType === "product"}
                onChange={(e) => handleRadioChange(e, "product")}
                title="Product-based"
                description="I sell physical or digital products"
                icon={<DollarSign className="h-6 w-6 mr-2" />}
              />
              <RadioCardOption
                name="businessType"
                value="service"
                checked={formData.businessType === "service"}
                onChange={(e) => handleRadioChange(e, "service")}
                title="Service-based"
                description="I provide services to clients"
                icon={<Zap className="h-6 w-6 mr-2" />}
              />
              <RadioCardOption
                name="businessType"
                value="hybrid"
                checked={formData.businessType === "hybrid"}
                onChange={(e) => handleRadioChange(e, "hybrid")}
                title="Hybrid"
                description="I offer both products and services"
                icon={<Target className="h-6 w-6 mr-2" />}
              />
            </div>
            {errors.businessType && <p className="text-red-500 text-sm">{errors.businessType}</p>}
          </div>
        );
        
      case "industry":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">What industry are you in?</h2>
            <div className="w-full">
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
              >
                <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
              
              {formData.industry && restrictedIndustries.includes(formData.industry) && (
                <div className="mt-4 p-4 bg-amber-900/20 border border-amber-700 rounded-md">
                  <h3 className="text-amber-400 font-bold flex items-center">
                    <InfoIcon className="h-4 w-4 mr-2" />
                    Restricted Industry Notice
                  </h3>
                  <p className="text-amber-200/90 text-sm mt-1">
                    Your industry may have restrictions for NIL partnerships with college athletes.
                    Our compliance team will review your campaigns for NCAA compliance.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
        
      case "goals":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">What are your goals for athlete partnerships?</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="goal-awareness"
                  value="brand_awareness"
                  checked={formData.goalIdentification.includes("brand_awareness")}
                  onChange={(e) => handleCheckboxChange(e, "goalIdentification")}
                  className="h-4 w-4 rounded border-zinc-700 text-primary"
                />
                <label htmlFor="goal-awareness" className="text-white">Brand awareness & reach</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="goal-content"
                  value="content_creation"
                  checked={formData.goalIdentification.includes("content_creation")}
                  onChange={(e) => handleCheckboxChange(e, "goalIdentification")}
                  className="h-4 w-4 rounded border-zinc-700 text-primary"
                />
                <label htmlFor="goal-content" className="text-white">Authentic content creation</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="goal-sales"
                  value="sales_conversions"
                  checked={formData.goalIdentification.includes("sales_conversions")}
                  onChange={(e) => handleCheckboxChange(e, "goalIdentification")}
                  className="h-4 w-4 rounded border-zinc-700 text-primary"
                />
                <label htmlFor="goal-sales" className="text-white">Drive sales & conversions</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="goal-community"
                  value="community_engagement"
                  checked={formData.goalIdentification.includes("community_engagement")}
                  onChange={(e) => handleCheckboxChange(e, "goalIdentification")}
                  className="h-4 w-4 rounded border-zinc-700 text-primary"
                />
                <label htmlFor="goal-community" className="text-white">Community engagement</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="goal-product"
                  value="product_validation"
                  checked={formData.goalIdentification.includes("product_validation")}
                  onChange={(e) => handleCheckboxChange(e, "goalIdentification")}
                  className="h-4 w-4 rounded border-zinc-700 text-primary"
                />
                <label htmlFor="goal-product" className="text-white">Product validation & feedback</label>
              </div>
            </div>
            {errors.goalIdentification && <p className="text-red-500 text-sm">{errors.goalIdentification}</p>}
          </div>
        );
        
      case "past-partnerships":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Have you worked with athletes before?</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <RadioCardOption
                name="hasPastPartnership"
                value="true"
                checked={formData.hasPastPartnership === true}
                onChange={(e) => handleRadioChange(e, true)}
                title="Yes"
                description="I have experience working with athletes"
              />
              <RadioCardOption
                name="hasPastPartnership"
                value="false"
                checked={formData.hasPastPartnership === false}
                onChange={(e) => handleRadioChange(e, false)}
                title="No"
                description="This will be my first athlete partnership"
              />
            </div>
            {errors.hasPastPartnership && <p className="text-red-500 text-sm">{errors.hasPastPartnership}</p>}
          </div>
        );
        
      case "budget":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">What's your budget range for athlete partnerships?</h2>
            <div className="space-y-8">
              <div>
                <label className="text-zinc-400 text-sm mb-2 block">
                  Minimum budget: ${formData.budgetMin}
                </label>
                <SliderWithInput
                  min={100}
                  max={10000}
                  step={100}
                  value={[formData.budgetMin]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, budgetMin: value[0] }))}
                />
              </div>
              
              <div>
                <label className="text-zinc-400 text-sm mb-2 block">
                  Maximum budget: ${formData.budgetMax}
                </label>
                <SliderWithInput
                  min={100}
                  max={20000}
                  step={100}
                  value={[formData.budgetMax]}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, budgetMax: value[0] }))}
                />
              </div>
            </div>
            {errors.budget && <p className="text-red-500 text-sm">{errors.budget}</p>}
          </div>
        );
        
      case "zip-code":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Where is your business located?</h2>
            <FormField
              label="ZIP Code"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="Enter your 5-digit ZIP code"
              required
              errorMessage={errors.zipCode}
              isTouched={true}
            />
          </div>
        );
        
      case "operating-location":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Where do you provide your services?</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="location-local"
                  value="local"
                  checked={formData.operatingLocation.includes("local")}
                  onChange={(e) => handleCheckboxChange(e, "operatingLocation")}
                  className="h-4 w-4 rounded border-zinc-700 text-primary"
                />
                <label htmlFor="location-local" className="text-white">Locally (within 50 miles)</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="location-state"
                  value="state"
                  checked={formData.operatingLocation.includes("state")}
                  onChange={(e) => handleCheckboxChange(e, "operatingLocation")}
                  className="h-4 w-4 rounded border-zinc-700 text-primary"
                />
                <label htmlFor="location-state" className="text-white">Statewide</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="location-regional"
                  value="regional"
                  checked={formData.operatingLocation.includes("regional")}
                  onChange={(e) => handleCheckboxChange(e, "operatingLocation")}
                  className="h-4 w-4 rounded border-zinc-700 text-primary"
                />
                <label htmlFor="location-regional" className="text-white">Regional (multiple states)</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="location-national"
                  value="national"
                  checked={formData.operatingLocation.includes("national")}
                  onChange={(e) => handleCheckboxChange(e, "operatingLocation")}
                  className="h-4 w-4 rounded border-zinc-700 text-primary"
                />
                <label htmlFor="location-national" className="text-white">National (USA-wide)</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="location-international"
                  value="international"
                  checked={formData.operatingLocation.includes("international")}
                  onChange={(e) => handleCheckboxChange(e, "operatingLocation")}
                  className="h-4 w-4 rounded border-zinc-700 text-primary"
                />
                <label htmlFor="location-international" className="text-white">International</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="location-remote"
                  value="remote"
                  checked={formData.operatingLocation.includes("remote")}
                  onChange={(e) => handleCheckboxChange(e, "operatingLocation")}
                  className="h-4 w-4 rounded border-zinc-700 text-primary"
                />
                <label htmlFor="location-remote" className="text-white">Remote/Virtual</label>
              </div>
            </div>
            {errors.operatingLocation && <p className="text-red-500 text-sm">{errors.operatingLocation}</p>}
          </div>
        );
        
      case "contact-info":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Your Contact Information</h2>
            <div className="space-y-4">
              <FormField
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                errorMessage={errors.name}
                isTouched={true}
              />
              
              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
                errorMessage={errors.email}
                isTouched={true}
              />
              
              <FormField
                label="Phone Number"
                name="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
                errorMessage={errors.contactPhone}
                isTouched={true}
              />
              
              <FormField
                label="Job Title"
                name="contactTitle"
                value={formData.contactTitle}
                onChange={handleChange}
                placeholder="Enter your job title"
              />
            </div>
          </div>
        );
        
      case "business-size":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">What's your business size?</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <RadioCardOption
                name="businessSize"
                value="sole_proprietor"
                checked={formData.businessSize === "sole_proprietor"}
                onChange={(e) => handleRadioChange(e, "sole_proprietor")}
                title="Sole Proprietor"
                description="1 employee (just you)"
              />
              <RadioCardOption
                name="businessSize"
                value="small_team"
                checked={formData.businessSize === "small_team"}
                onChange={(e) => handleRadioChange(e, "small_team")}
                title="Small Team"
                description="2-10 employees"
              />
              <RadioCardOption
                name="businessSize"
                value="medium"
                checked={formData.businessSize === "medium"}
                onChange={(e) => handleRadioChange(e, "medium")}
                title="Medium Business"
                description="11-50 employees"
              />
              <RadioCardOption
                name="businessSize"
                value="enterprise"
                checked={formData.businessSize === "enterprise"}
                onChange={(e) => handleRadioChange(e, "enterprise")}
                title="Enterprise"
                description="51+ employees"
              />
            </div>
            {errors.businessSize && <p className="text-red-500 text-sm">{errors.businessSize}</p>}
          </div>
        );
        
      case "athlete-category":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">What type of athlete are you?</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <RadioCardOption
                name="athleteCategory"
                value="college"
                checked={formData.athleteCategory === "college"}
                onChange={(e) => handleRadioChange(e, "college")}
                title="College Athlete"
                description="Currently enrolled and competing at a college or university"
                icon={<GraduationCap className="h-6 w-6 mr-2" />}
              />
              <RadioCardOption
                name="athleteCategory"
                value="professional"
                checked={formData.athleteCategory === "professional"}
                onChange={(e) => handleRadioChange(e, "professional")}
                title="Professional Athlete"
                description="Competing at the professional level in your sport"
                icon={<Award className="h-6 w-6 mr-2" />}
              />
              <RadioCardOption
                name="athleteCategory"
                value="esports"
                checked={formData.athleteCategory === "esports"}
                onChange={(e) => handleRadioChange(e, "esports")}
                title="Esports Athlete"
                description="Competing in organized video game competitions"
                icon={<Gamepad2 className="h-6 w-6 mr-2" />}
              />
              <RadioCardOption
                name="athleteCategory"
                value="influencer"
                checked={formData.athleteCategory === "influencer"}
                onChange={(e) => handleRadioChange(e, "influencer")}
                title="Sports Influencer"
                description="Content creator focused on sports or fitness"
                icon={<Users className="h-6 w-6 mr-2" />}
              />
              <RadioCardOption
                name="athleteCategory"
                value="semi_professional"
                checked={formData.athleteCategory === "semi_professional"}
                onChange={(e) => handleRadioChange(e, "semi_professional")}
                title="Semi-Professional"
                description="Competing at a high level but not as primary occupation"
                icon={<Dumbbell className="h-6 w-6 mr-2" />}
              />
              <RadioCardOption
                name="athleteCategory"
                value="other"
                checked={formData.athleteCategory === "other"}
                onChange={(e) => handleRadioChange(e, "other")}
                title="Other"
                description="Another type of athlete not listed here"
                icon={<User className="h-6 w-6 mr-2" />}
              />
            </div>
            {errors.athleteCategory && <p className="text-red-500 text-sm">{errors.athleteCategory}</p>}
          </div>
        );
        
      case "athlete-basic-info":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Your Basic Information</h2>
            <div className="space-y-4">
              <FormField
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                errorMessage={errors.name}
                isTouched={true}
              />
              
              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
                errorMessage={errors.email}
                isTouched={true}
              />
              
              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                required
                errorMessage={errors.phone}
                isTouched={true}
              />
              
              <FormField
                label="Date of Birth"
                name="birthdate"
                type="date"
                value={formData.birthdate}
                onChange={handleChange}
                required
                errorMessage={errors.birthdate}
                isTouched={true}
              />
              
              <div className="w-full">
                <label className="block text-sm font-medium text-white mb-2">
                  Gender <span className="text-zinc-500">(Optional)</span>
                </label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <FormField
                label="Bio (Optional)"
                name="bio"
                type="textarea"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us a little about yourself..."
                rows={3}
              />
            </div>
          </div>
        );
        
      case "athlete-academic-info":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Your Academic Information</h2>
            <div className="space-y-4">
              <FormField
                label="School / University"
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="Enter your school name"
                required
                errorMessage={errors.school}
                isTouched={true}
              />
              
              <div className="w-full">
                <label className="block text-sm font-medium text-white mb-2">
                  Division <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.division}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, division: value }))}
                >
                  <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select your division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Division I">Division I</SelectItem>
                    <SelectItem value="Division II">Division II</SelectItem>
                    <SelectItem value="Division III">Division III</SelectItem>
                    <SelectItem value="NAIA">NAIA</SelectItem>
                    <SelectItem value="NJCAA">NJCAA</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.division && <p className="text-red-500 text-xs mt-1">{errors.division}</p>}
              </div>
              
              <FormField
                label="Graduation Year"
                name="graduationYear"
                type="number"
                value={formData.graduationYear?.toString() || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: parseInt(e.target.value) || null }))}
                placeholder="Expected graduation year"
                min="2022"
                max="2030"
              />
              
              <FormField
                label="Major / Course of Study"
                name="major"
                value={formData.major}
                onChange={handleChange}
                placeholder="Your major or course of study"
              />
              
              <FormField
                label="GPA (Optional)"
                name="gpa"
                type="number"
                value={formData.gpa?.toString() || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, gpa: parseFloat(e.target.value) || null }))}
                placeholder="Your current GPA"
                min="0"
                max="4.0"
                step="0.1"
              />
              
              <FormField
                label="Academic Honors / Achievements (Optional)"
                name="academicHonors"
                type="textarea"
                value={formData.academicHonors}
                onChange={handleChange}
                placeholder="List any academic honors or achievements"
                rows={2}
              />
            </div>
          </div>
        );
        
      case "athlete-sport-info":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Your Athletic Information</h2>
            <div className="space-y-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-white mb-2">
                  Primary Sport <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.sport}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, sport: value }))}
                >
                  <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select your primary sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basketball">Basketball</SelectItem>
                    <SelectItem value="Football">Football</SelectItem>
                    <SelectItem value="Baseball">Baseball</SelectItem>
                    <SelectItem value="Soccer">Soccer</SelectItem>
                    <SelectItem value="Volleyball">Volleyball</SelectItem>
                    <SelectItem value="Track & Field">Track & Field</SelectItem>
                    <SelectItem value="Cross Country">Cross Country</SelectItem>
                    <SelectItem value="Swimming & Diving">Swimming & Diving</SelectItem>
                    <SelectItem value="Golf">Golf</SelectItem>
                    <SelectItem value="Tennis">Tennis</SelectItem>
                    <SelectItem value="Wrestling">Wrestling</SelectItem>
                    <SelectItem value="Lacrosse">Lacrosse</SelectItem>
                    <SelectItem value="Hockey">Hockey</SelectItem>
                    <SelectItem value="Softball">Softball</SelectItem>
                    <SelectItem value="Gymnastics">Gymnastics</SelectItem>
                    <SelectItem value="Rowing">Rowing</SelectItem>
                    <SelectItem value="Esports">Esports</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.sport && <p className="text-red-500 text-xs mt-1">{errors.sport}</p>}
              </div>
              
              <FormField
                label="Position / Event"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="Your position or event"
                required
                errorMessage={errors.position}
                isTouched={true}
              />
              
              <FormField
                label="Athletic Achievements (Optional)"
                name="sportAchievements"
                type="textarea"
                value={formData.sportAchievements}
                onChange={handleChange}
                placeholder="List any awards, records, or notable achievements"
                rows={3}
              />
            </div>
          </div>
        );
        
      case "athlete-eligibility-check":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Eligibility Verification</h2>
            <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <p className="text-zinc-300">
                We will use the information you provided to verify your student-athlete eligibility status.
                This helps ensure compliance with NCAA, NAIA, or other governing body regulations for NIL activities.
              </p>
              
              <div className="mt-4 flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">School: {formData.school}</span>
              </div>
              
              <div className="mt-2 flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Division: {formData.division}</span>
              </div>
              
              <div className="mt-2 flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Sport: {formData.sport}</span>
              </div>
              
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded">
                <p className="text-blue-300 text-sm">
                  <InfoIcon className="h-4 w-4 inline-block mr-1" />
                  Your eligibility status will be pending until verified. This process is automatic and usually 
                  takes less than 24 hours.
                </p>
              </div>
            </div>
            {errors.eligibility && <p className="text-red-500 text-sm">{errors.eligibility}</p>}
          </div>
        );
        
      case "athlete-social-media":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Your Social Media Presence</h2>
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <FormField
                  label="Instagram Handle"
                  name="instagram"
                  value={formData.socialHandles.instagram || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    socialHandles: {
                      ...prev.socialHandles,
                      instagram: e.target.value
                    }
                  }))}
                  placeholder="@username"
                />
                
                <FormField
                  label="TikTok Handle"
                  name="tiktok"
                  value={formData.socialHandles.tiktok || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    socialHandles: {
                      ...prev.socialHandles,
                      tiktok: e.target.value
                    }
                  }))}
                  placeholder="@username"
                />
                
                <FormField
                  label="Twitter Handle"
                  name="twitter"
                  value={formData.socialHandles.twitter || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    socialHandles: {
                      ...prev.socialHandles,
                      twitter: e.target.value
                    }
                  }))}
                  placeholder="@username"
                />
                
                <FormField
                  label="YouTube Channel"
                  name="youtube"
                  value={formData.socialHandles.youtube || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    socialHandles: {
                      ...prev.socialHandles,
                      youtube: e.target.value
                    }
                  }))}
                  placeholder="channel name or URL"
                />
                
                <FormField
                  label="Facebook Page"
                  name="facebook"
                  value={formData.socialHandles.facebook || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    socialHandles: {
                      ...prev.socialHandles,
                      facebook: e.target.value
                    }
                  }))}
                  placeholder="page name or URL"
                />
                
                <FormField
                  label="Other Platform"
                  name="other"
                  value={formData.socialHandles.other || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    socialHandles: {
                      ...prev.socialHandles,
                      other: e.target.value
                    }
                  }))}
                  placeholder="platform: username"
                />
              </div>
              
              {errors.socialHandles && <p className="text-red-500 text-sm">{errors.socialHandles}</p>}
              
              <FormField
                label="Total Follower Count (across all platforms)"
                name="followerCount"
                type="number"
                value={formData.followerCount?.toString() || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, followerCount: parseInt(e.target.value) || null }))}
                placeholder="Approximate total followers"
                required
                errorMessage={errors.followerCount}
                isTouched={true}
              />
              
              <FormField
                label="Average Engagement Rate % (Optional)"
                name="averageEngagementRate"
                type="number"
                value={formData.averageEngagementRate?.toString() || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, averageEngagementRate: parseFloat(e.target.value) || null }))}
                placeholder="Average engagement as a percentage"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        );
        
      case "athlete-content-style":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Your Content Style</h2>
            <div className="space-y-4">
              <FormField
                label="How would you describe your content style?"
                name="contentStyle"
                type="textarea"
                value={formData.contentStyle}
                onChange={handleChange}
                placeholder="Describe your content style and approach..."
                rows={3}
                required
                errorMessage={errors.contentStyle}
                isTouched={true}
              />
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  What types of content do you create? <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="content-photos"
                      value="photos"
                      checked={formData.contentTypes.includes("photos")}
                      onChange={(e) => handleCheckboxChange(e, "contentTypes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="content-photos" className="text-white">Photos & Images</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="content-videos"
                      value="videos"
                      checked={formData.contentTypes.includes("videos")}
                      onChange={(e) => handleCheckboxChange(e, "contentTypes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="content-videos" className="text-white">Videos</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="content-stories"
                      value="stories"
                      checked={formData.contentTypes.includes("stories")}
                      onChange={(e) => handleCheckboxChange(e, "contentTypes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="content-stories" className="text-white">Stories & Short-Form Content</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="content-livestreams"
                      value="livestreams"
                      checked={formData.contentTypes.includes("livestreams")}
                      onChange={(e) => handleCheckboxChange(e, "contentTypes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="content-livestreams" className="text-white">Livestreams</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="content-blogs"
                      value="blogs"
                      checked={formData.contentTypes.includes("blogs")}
                      onChange={(e) => handleCheckboxChange(e, "contentTypes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="content-blogs" className="text-white">Blogs & Articles</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="content-podcasts"
                      value="podcasts"
                      checked={formData.contentTypes.includes("podcasts")}
                      onChange={(e) => handleCheckboxChange(e, "contentTypes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="content-podcasts" className="text-white">Podcasts & Audio</label>
                  </div>
                </div>
                {errors.contentTypes && <p className="text-red-500 text-sm mt-1">{errors.contentTypes}</p>}
              </div>
            </div>
          </div>
        );
        
      case "athlete-compensation":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Compensation Preferences</h2>
            <div className="space-y-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-white mb-2">
                  What type of compensation are you most interested in? <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.compensationGoals}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, compensationGoals: value }))}
                >
                  <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select compensation preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Direct Cash Payment</SelectItem>
                    <SelectItem value="products">Free Products</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Cash + Products)</SelectItem>
                    <SelectItem value="commission">Commission/Revenue Share</SelectItem>
                    <SelectItem value="equity">Equity/Ownership</SelectItem>
                    <SelectItem value="flexible">Flexible (Open to Various Options)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.compensationGoals && <p className="text-red-500 text-xs mt-1">{errors.compensationGoals}</p>}
              </div>
              
              <FormField
                label="Minimum Compensation Expectation"
                name="minimumCompensation"
                value={formData.minimumCompensation}
                onChange={handleChange}
                placeholder="e.g. $500 per post, $1000 per month, etc."
                required
                errorMessage={errors.minimumCompensation}
                isTouched={true}
              />
              
              <div className="w-full">
                <label className="block text-sm font-medium text-white mb-2">
                  Preferred Timeframe for Partnerships <span className="text-zinc-500">(Optional)</span>
                </label>
                <Select
                  value={formData.availabilityTimeframe}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, availabilityTimeframe: value }))}
                >
                  <SelectTrigger className="w-full bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select preferred timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time Deals</SelectItem>
                    <SelectItem value="short-term">Short-term (1-3 months)</SelectItem>
                    <SelectItem value="medium-term">Medium-term (3-6 months)</SelectItem>
                    <SelectItem value="long-term">Long-term (6+ months)</SelectItem>
                    <SelectItem value="seasonal">Seasonal (during your sport season)</SelectItem>
                    <SelectItem value="off-season">Off-season Only</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        
      case "athlete-brand-values":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Your Personal Brand Values</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  What values are important to your personal brand? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="value-authenticity"
                      value="authenticity"
                      checked={formData.personalValues.includes("authenticity")}
                      onChange={(e) => handleCheckboxChange(e, "personalValues")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="value-authenticity" className="text-white">Authenticity</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="value-community"
                      value="community"
                      checked={formData.personalValues.includes("community")}
                      onChange={(e) => handleCheckboxChange(e, "personalValues")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="value-community" className="text-white">Community</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="value-education"
                      value="education"
                      checked={formData.personalValues.includes("education")}
                      onChange={(e) => handleCheckboxChange(e, "personalValues")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="value-education" className="text-white">Education</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="value-innovation"
                      value="innovation"
                      checked={formData.personalValues.includes("innovation")}
                      onChange={(e) => handleCheckboxChange(e, "personalValues")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="value-innovation" className="text-white">Innovation</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="value-health"
                      value="health"
                      checked={formData.personalValues.includes("health")}
                      onChange={(e) => handleCheckboxChange(e, "personalValues")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="value-health" className="text-white">Health & Wellness</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="value-inclusion"
                      value="inclusion"
                      checked={formData.personalValues.includes("inclusion")}
                      onChange={(e) => handleCheckboxChange(e, "personalValues")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="value-inclusion" className="text-white">Diversity & Inclusion</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="value-sustainability"
                      value="sustainability"
                      checked={formData.personalValues.includes("sustainability")}
                      onChange={(e) => handleCheckboxChange(e, "personalValues")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="value-sustainability" className="text-white">Sustainability</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="value-leadership"
                      value="leadership"
                      checked={formData.personalValues.includes("leadership")}
                      onChange={(e) => handleCheckboxChange(e, "personalValues")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="value-leadership" className="text-white">Leadership</label>
                  </div>
                </div>
                {errors.personalValues && <p className="text-red-500 text-sm mt-1">{errors.personalValues}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Causes you care about <span className="text-zinc-500">(Optional)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cause-education"
                      value="education"
                      checked={formData.causes.includes("education")}
                      onChange={(e) => handleCheckboxChange(e, "causes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="cause-education" className="text-white">Education</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cause-environment"
                      value="environment"
                      checked={formData.causes.includes("environment")}
                      onChange={(e) => handleCheckboxChange(e, "causes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="cause-environment" className="text-white">Environment</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cause-health"
                      value="health"
                      checked={formData.causes.includes("health")}
                      onChange={(e) => handleCheckboxChange(e, "causes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="cause-health" className="text-white">Healthcare</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cause-social"
                      value="social"
                      checked={formData.causes.includes("social")}
                      onChange={(e) => handleCheckboxChange(e, "causes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="cause-social" className="text-white">Social Justice</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cause-youth"
                      value="youth"
                      checked={formData.causes.includes("youth")}
                      onChange={(e) => handleCheckboxChange(e, "causes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="cause-youth" className="text-white">Youth Sports</label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="cause-mental"
                      value="mental"
                      checked={formData.causes.includes("mental")}
                      onChange={(e) => handleCheckboxChange(e, "causes")}
                      className="h-4 w-4 rounded border-zinc-700 text-primary"
                    />
                    <label htmlFor="cause-mental" className="text-white">Mental Health</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case "create-password":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Create Your Account</h2>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex items-center space-x-2 text-green-400 mt-1">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{formData.email}</span>
                </div>
              </div>
              
              <FormField
                label="Create Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                errorMessage={errors.password}
                isTouched={true}
              />
              
              <FormField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                errorMessage={errors.confirmPassword}
                isTouched={true}
              />
              
              <div className="p-3 bg-blue-900/20 border border-blue-800 rounded mt-4">
                <p className="text-blue-300 text-sm flex items-start">
                  <InfoIcon className="h-4 w-4 inline-block mr-1 mt-0.5 flex-shrink-0" />
                  <span>By creating an account, you agree to our Terms of Service and Privacy Policy. Your profile will be reviewed for compliance with NIL regulations.</span>
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center p-8">
            <h3 className="text-red-400">Unknown step: {currentStep}</h3>
            <p className="text-white">Please go back and try again</p>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-900 to-black">
      {/* Header bar with progress */}
      <div className="border-b border-zinc-800 bg-black/50 p-4 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {getStepTitle()}
            </h1>
          </div>
          <div className="hidden sm:block w-1/2 px-4">
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-3xl mx-auto">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-xl p-6 md:p-8"
          >
            {renderStepContent()}
            
            {/* Navigation buttons */}
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              {currentStep === "create-password" ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center"
                >
                  {isSubmitting ? (
                    <>Processing<span className="ml-2 animate-pulse">...</span></>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNextStep}
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}