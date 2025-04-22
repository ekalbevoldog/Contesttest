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
import { useWebSocket } from "@/hooks/use-websocket";
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
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff
} from "lucide-react";

// Import UI components
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

// FormField component
// Fix Info reference for InfoIcon
const Info = InfoIcon;

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
import SliderWithInput from "@/components/SliderWithInput";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { industries, restrictedIndustries } from "@shared/industries";

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

// Using restrictedIndustries imported from shared/industries.ts

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("user-type");
  const [formData, setFormData] = useState<BusinessFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Temporarily disable WebSocket for debugging
  const connectionStatus = 'closed' as const;
  const lastMessage = null;
  const sendMessage = () => console.log("WebSocket disabled for debugging");

  // Function to manually sync form data through WebSocket
  const syncFormData = () => {
    if (!sessionId) return;
    
    setIsSyncing(true);
    
    try {
      sendMessage({
        type: 'profile_update',
        sessionId,
        data: formData
      });
      
      setTimeout(() => {
        setIsSyncing(false);
        toast({
          title: "Sync Successful",
          description: "Your form data has been synchronized",
        });
      }, 500);
    } catch (error) {
      console.error('Error syncing form data:', error);
      setIsSyncing(false);
      toast({
        title: "Sync Failed",
        description: "Could not synchronize your data. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Function to sync step changes
  const syncStepChange = (step: OnboardingStep) => {
    if (!sessionId) return;
    
    try {
      sendMessage({
        type: 'step_change',
        sessionId,
        step
      });
      console.log('Step change synchronized:', step);
    } catch (error) {
      console.error('Error syncing step change:', error);
    }
  };
  
  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      console.log('Received WebSocket message:', lastMessage);
      
      // Handle profile update messages
      if (lastMessage.type === 'profile_update' && lastMessage.data) {
        try {
          // Update form data with incoming data
          setFormData(prevData => ({
            ...prevData,
            ...lastMessage.data
          }));
          
          console.log('Form data updated from WebSocket message');
          
          // Show toast notification
          toast({
            title: "Profile Updated",
            description: "Your profile has been synchronized across devices",
          });
        } catch (error) {
          console.error('Error processing WebSocket profile update:', error);
        }
      }
      
      // Handle step change messages
      if (lastMessage.type === 'step_change' && lastMessage.step) {
        try {
          setCurrentStep(lastMessage.step as OnboardingStep);
          console.log('Step updated from WebSocket message to:', lastMessage.step);
        } catch (error) {
          console.error('Error processing WebSocket step change:', error);
        }
      }
    }
  }, [lastMessage, toast]);
  
  // Log WebSocket connection status changes
  useEffect(() => {
    console.log('WebSocket connection status changed to:', connectionStatus);
  }, [connectionStatus]);
  
  // Fetch a new session ID when component mounts
  useEffect(() => {
    const getSessionId = async () => {
      try {
        // First try to get a server session
        const response = await fetch('/api/session/new');
        const data = await response.json();
        if (data.success && data.sessionId) {
          setSessionId(data.sessionId);
          console.log("Server session created:", data.sessionId);
          
          // Try to restore saved form data from session
          const sessionResponse = await fetch(`/api/session/${data.sessionId}`);
          const sessionData = await sessionResponse.json();
          
          // Log the actual response for debugging
          console.log("Session data response:", sessionData);
          
          if (sessionData.exists && sessionData.session) {
            // Handle any saved data if we add it later
            console.log("Retrieved session:", sessionData.session);
          } else {
            console.log("No saved session data found, using default values");
          }
          
          // Continue regardless of whether we found saved data or not
          // Now that we have a sessionId, the loading state will resolve
        } else {
          console.error("Failed to create server session");
        }
      } catch (error) {
        console.error("Error setting up session:", error);
      }
    };
    
    getSessionId();
  }, []);
  
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
      
      // Sync step change via WebSocket
      syncStepChange(nextStep);
      
      // Sync form data too
      if (sessionId) {
        try {
          // Sync form data via WebSocket
          sendMessage({
            type: 'profile_update',
            sessionId,
            data: formData
          });
          
          // Attempt to update session data on server
          apiRequest('POST', `/api/session/${sessionId}/user-type`, {
            userType: formData.userType,
            formData,
            currentStep: nextStep
          }).catch(error => {
            console.error('Error updating session data:', error);
          });
        } catch (error) {
          console.error('Error updating session data:', error);
        }
      }
      
      window.scrollTo(0, 0);
    }
  };
  
  // Handle back navigation
  const handlePrevStep = () => {
    let prevStep: OnboardingStep;
    
    // Branch flow based on user type
    if (formData.userType === "athlete") {
      // Athlete-specific back navigation
      switch (currentStep) {
        case "athlete-category":
          prevStep = "user-type";
          break;
        case "athlete-basic-info":
          prevStep = "athlete-category";
          break;
        case "athlete-academic-info":
          prevStep = "athlete-basic-info";
          break;
        case "athlete-sport-info":
          // For professional, influencer, esports athletes, skip academic info
          if (formData.athleteCategory === "professional" || 
              formData.athleteCategory === "influencer" || 
              formData.athleteCategory === "esports") {
            prevStep = "athlete-basic-info";
          } else {
            prevStep = "athlete-academic-info";
          }
          break;
        case "athlete-eligibility-check":
          prevStep = "athlete-sport-info";
          break;
        case "athlete-social-media":
          // For non-college athletes, skip eligibility check
          if (formData.athleteCategory !== "college") {
            prevStep = "athlete-sport-info";
          } else {
            prevStep = "athlete-eligibility-check";
          }
          break;
        case "athlete-content-style":
          prevStep = "athlete-social-media";
          break;
        case "athlete-compensation":
          prevStep = "athlete-content-style";
          break;
        case "athlete-brand-values":
          prevStep = "athlete-compensation";
          break;
        case "create-password":
          prevStep = "athlete-brand-values";
          break;
        default:
          prevStep = "user-type";
      }
    } else {
      // Business flow (existing flow)
      switch (currentStep) {
        case "business-type":
          prevStep = "user-type";
          break;
        case "industry":
          prevStep = "business-type";
          break;
        case "goals":
          prevStep = "industry";
          break;
        case "past-partnerships":
          prevStep = "goals";
          break;
        case "budget":
          prevStep = "past-partnerships";
          break;
        case "zip-code":
          prevStep = "budget";
          break;
        case "operating-location":
          prevStep = "zip-code";
          break;
        case "contact-info":
          prevStep = formData.businessType === "service" ? "operating-location" : "zip-code";
          break;
        case "business-size":
          prevStep = "contact-info";
          break;
        case "create-password":
          prevStep = "business-size";
          break;
        default:
          prevStep = "business-type";
      }
    }
    
    setCurrentStep(prevStep);
    
    // Sync step change via WebSocket
    syncStepChange(prevStep);
    
    window.scrollTo(0, 0);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateCurrentStep()) {
      setIsSubmitting(true);
      
      try {
        // Log the complete form data for debugging
        console.log("==== ONBOARDING FORM DATA COLLECTED ====");
        console.log("Complete form data:", formData);
        
        // APPROACH CHANGE: Let's use direct API call instead of Supabase hook
        // This avoids WebSocket errors and circular dependencies
        const userData = {
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          role: formData.userType
        };
        
        console.log("Using direct API for registration to avoid WebSocket issues");
        
        // Call our server API directly 
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Registration API failed:', errorText);
          throw new Error('Registration failed: ' + (errorText || response.statusText));
        }
        
        const registrationData = await response.json();
        const newUser = registrationData.user;
        
        if (!newUser || !newUser.id) {
          throw new Error("Registration succeeded but no user data returned");
        }
        
        console.log("Registration successful:", newUser);
        
        // 2. Create profile based on user type
        // Prepare profile data based on user type
        let profileData;
        
        if (formData.userType === "athlete") {
          // Create athlete profile data
          profileData = {
            userId: newUser.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            school: formData.school,
            division: formData.division,
            sport: formData.sport,
            followerCount: formData.followerCount || 0,
            contentStyle: formData.contentStyle || "Authentic and engaging content that resonates with my audience",
            compensationGoals: formData.compensationGoals || "Fair compensation that reflects my value and engagement",
            
            // Additional athletic data
            birthdate: formData.birthdate,
            gender: formData.gender,
            bio: formData.bio,
            athleteCategory: formData.athleteCategory,
            graduationYear: formData.graduationYear,
            major: formData.major,
            gpa: formData.gpa,
            academicHonors: formData.academicHonors,
            position: formData.position,
            sportAchievements: formData.sportAchievements,
            
            // Convert objects to strings for database storage
            socialHandles: JSON.stringify(formData.socialHandles || {}),
            averageEngagementRate: formData.averageEngagementRate,
            contentTypes: JSON.stringify(formData.contentTypes || []),
            preferredProductCategories: JSON.stringify(formData.preferredProductCategories || []),
            personalValues: JSON.stringify(formData.personalValues || []),
            causes: JSON.stringify(formData.causes || []),
            minimumCompensation: formData.minimumCompensation,
            availabilityTimeframe: formData.availabilityTimeframe,
            
            // Eligibility status 
            eligibilityStatus: "pending" // Will be verified by admin/compliance officer
          };
        } else {
          // Create business profile data
          profileData = {
            userId: newUser.id,
            name: formData.name,
            email: formData.email,
            
            // Format required business fields
            productType: formData.businessType || "product",
            audienceGoals: formData.goalIdentification.length > 0 
              ? formData.goalIdentification.join(", ") 
              : "Increasing brand awareness and driving sales",
            campaignVibe: "Professional brand representation with authentic content",
            values: "Quality, authenticity, trust, and customer satisfaction",
            targetSchoolsSports: "All relevant sports programs that align with our brand",
            
            // Store detailed business preferences as needed by API
            budget: `$${formData.budgetMin} - $${formData.budgetMax}`,
            industry: formData.industry,
            preferences: JSON.stringify({
              accessRestriction: formData.accessRestriction,
              hasPastPartnership: formData.hasPastPartnership,
              budget: {
                min: formData.budgetMin,
                max: formData.budgetMax
              },
              zipCode: formData.zipCode,
              operatingLocation: formData.operatingLocation,
              companySize: formData.businessSize,
              contactInfo: {
                name: formData.name,
                title: formData.contactTitle,
                email: formData.email,
                phone: formData.contactPhone
              }
            })
          };
        }
        
        // Use direct API to create profile to avoid WebSocket issues
        console.log("Using direct API call for profile creation");
        const profileResponse = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        });
        
        if (!profileResponse.ok) {
          const errorText = await profileResponse.text();
          console.error('Profile creation failed:', errorText);
          throw new Error(`Failed to create ${formData.userType} profile: ` + (errorText || profileResponse.statusText));
        }
        
        const profileResult = await profileResponse.json();
        console.log("Profile created successfully:", profileResult);
        
        toast({
          title: "Success!",
          description: "Your account has been created successfully.",
          variant: "default",
        });
        
        // Manually reload the page to ensure fresh session data
        // This is simpler than trying to use refreshProfile which requires 
        // calling Supabase and can trigger the WebSocket error again
        
        // First set a user type cookie to ensure proper redirect after reload
        document.cookie = `user_type=${formData.userType};path=/;max-age=60`;
        
        // Redirect to the appropriate dashboard based on user type
        if (formData.userType === "athlete") {
          window.location.href = "/athlete/dashboard";
        } else if (formData.userType === "business") {
          window.location.href = "/business/dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      } catch (error) {
        console.error("Onboarding error:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  // Render the current step content
  const renderStepContent = () => {
    // Display loading indicator while session is being established
    if (!sessionId) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-zinc-400 mt-4">Initializing your session...</p>
        </div>
      );
    }
    
    switch (currentStep) {
      // Athlete-specific steps
      case "athlete-category":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 relative max-w-3xl mx-auto">
              <StaggerContainer>
                <StaggerItem>
                  <motion.h2 
                    className="text-2xl font-bold mb-4 text-white"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Athlete Category
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-400 mb-6"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    Select which category best describes you as an athlete.
                  </motion.p>
                </StaggerItem>
                
                <StaggerItem>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <RadioCardOption
                      name="athleteCategory"
                      value="college"
                      checked={formData.athleteCategory === "college"}
                      onChange={handleChange}
                      title="College Athlete"
                      description="Currently enrolled student competing at collegiate level"
                      icon={<GraduationCap className="h-5 w-5 mr-2" />}
                    />
                    
                    <RadioCardOption
                      name="athleteCategory"
                      value="professional"
                      checked={formData.athleteCategory === "professional"}
                      onChange={handleChange}
                      title="Professional Athlete"
                      description="Competing at the highest level in your sport"
                      icon={<Trophy className="h-5 w-5 mr-2" />}
                    />
                    
                    <RadioCardOption
                      name="athleteCategory"
                      value="semi_professional"
                      checked={formData.athleteCategory === "semi_professional"}
                      onChange={handleChange}
                      title="Semi-Professional"
                      description="Competing at developmental or minor league level"
                      icon={<Award className="h-5 w-5 mr-2" />}
                    />
                    
                    <RadioCardOption
                      name="athleteCategory"
                      value="esports"
                      checked={formData.athleteCategory === "esports"}
                      onChange={handleChange}
                      title="Esports Athlete"
                      description="Competitive gamer or esports professional"
                      icon={<Gamepad2 className="h-5 w-5 mr-2" />}
                    />
                    
                    <RadioCardOption
                      name="athleteCategory"
                      value="influencer"
                      checked={formData.athleteCategory === "influencer"}
                      onChange={handleChange}
                      title="Sports Influencer"
                      description="Content creator with sports focus"
                      icon={<Users className="h-5 w-5 mr-2" />}
                    />
                    
                    <RadioCardOption
                      name="athleteCategory"
                      value="other"
                      checked={formData.athleteCategory === "other"}
                      onChange={handleChange}
                      title="Other"
                      description="Doesn't fit in the categories above"
                      icon={<Dumbbell className="h-5 w-5 mr-2" />}
                    />
                  </div>
                  
                  {errors.athleteCategory && (
                    <p className="text-red-500 text-sm mt-1">{errors.athleteCategory}</p>
                  )}
                </StaggerItem>
              </StaggerContainer>
              
              <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-4 border-t border-zinc-800 gap-4">
                <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  
                  {/* Connection status indicator */}
                  <div className="flex items-center text-sm">
                    {connectionStatus === 'open' ? (
                      <div className="flex items-center text-green-500">
                        <Wifi className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Connected</span>
                      </div>
                    ) : connectionStatus === 'connecting' ? (
                      <div className="flex items-center text-yellow-500">
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        <span className="hidden sm:inline">Connecting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500">
                        <WifiOff className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Disconnected</span>
                      </div>
                    )}
                    
                    {/* Manual sync button */}
                    {sessionId && (
                      <button 
                        type="button" 
                        onClick={syncFormData}
                        disabled={isSyncing || connectionStatus !== 'open'}
                        className="ml-2 p-1 rounded-full hover:bg-zinc-800 disabled:opacity-50"
                        title="Manually sync your data"
                      >
                        {isSyncing ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isSubmitting || !formData.athleteCategory}
                  variant="default"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </AnimatedFormTransition>
        );
        
      case "athlete-basic-info":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 relative max-w-3xl mx-auto">
              <StaggerContainer>
                <StaggerItem>
                  <motion.h2 
                    className="text-2xl font-bold mb-4 text-white"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Basic Information
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-400 mb-6"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    Let's get to know you better. This information helps us create your profile and verify your eligibility.
                  </motion.p>
                </StaggerItem>
                
                <StaggerItem>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        required={true}
                        errorMessage={errors.name}
                        isTouched={!!errors.name}
                      />
                      
                      <FormField
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Your email address"
                        required={true}
                        errorMessage={errors.email}
                        isTouched={!!errors.email}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Your contact number"
                        required={true}
                        errorMessage={errors.phone}
                        isTouched={!!errors.phone}
                      />
                      
                      <FormField
                        label="Date of Birth"
                        name="birthdate"
                        type="date"
                        value={formData.birthdate}
                        onChange={handleChange}
                        required={true}
                        errorMessage={errors.birthdate}
                        isTouched={!!errors.birthdate}
                      />
                    </div>
                    
                    <div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-white">Gender</label>
                      </div>
                      <div className="flex space-x-4">
                        {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(gender => (
                          <div key={gender} className="flex items-center">
                            <input
                              type="radio"
                              id={`gender-${gender}`}
                              name="gender"
                              value={gender}
                              checked={formData.gender === gender}
                              onChange={handleChange}
                              className="mr-2"
                            />
                            <label htmlFor={`gender-${gender}`} className="text-white text-sm">{gender}</label>
                          </div>
                        ))}
                      </div>
                      {errors.gender && (
                        <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                      )}
                    </div>
                    
                    <div>
                      <FormField
                        label="Bio"
                        name="bio"
                        type="textarea"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us a bit about yourself (max 300 characters)"
                        rows={3}
                        maxLength={300}
                      />
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </AnimatedFormTransition>
        );
        
      case "athlete-academic-info":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 relative max-w-3xl mx-auto">
              <StaggerContainer>
                <StaggerItem>
                  <motion.h2 
                    className="text-2xl font-bold mb-4 text-white"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Academic Information
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-400 mb-6"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    This will help verify your eligibility as a collegiate athlete.
                  </motion.p>
                </StaggerItem>
                
                <StaggerItem>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="School"
                        name="school"
                        value={formData.school}
                        onChange={handleChange}
                        placeholder="Enter your college/university name"
                        required={true}
                        errorMessage={errors.school}
                        isTouched={!!errors.school}
                      />
                      
                      <div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-white">Division <span className="text-red-500">*</span></label>
                        </div>
                        <select 
                          name="division" 
                          value={formData.division} 
                          onChange={handleChange}
                          className="w-full rounded-md bg-zinc-800 border border-zinc-700 py-2 px-3 text-white"
                          required
                        >
                          <option value="">Select Division</option>
                          <option value="NCAA Division I">NCAA Division I</option>
                          <option value="NCAA Division II">NCAA Division II</option>
                          <option value="NCAA Division III">NCAA Division III</option>
                          <option value="NAIA">NAIA</option>
                          <option value="NJCAA">NJCAA</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.division && (
                          <p className="text-red-500 text-xs mt-1">{errors.division}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Major"
                        name="major"
                        value={formData.major}
                        onChange={handleChange}
                        placeholder="Your field of study"
                      />
                      
                      <FormField
                        label="Expected Graduation Year"
                        name="graduationYear"
                        type="number"
                        value={formData.graduationYear ? formData.graduationYear.toString() : ""}
                        onChange={(e) => {
                          if (e.target.value === "" || isNaN(Number(e.target.value))) {
                            setFormData(prev => ({ ...prev, graduationYear: null }));
                          } else {
                            setFormData(prev => ({ ...prev, graduationYear: Number(e.target.value) }));
                          }
                        }}
                        placeholder="YYYY"
                        min="2023"
                        max="2030"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="GPA (Optional)"
                        name="gpa"
                        type="number"
                        value={formData.gpa ? formData.gpa.toString() : ""}
                        onChange={(e) => {
                          if (e.target.value === "" || isNaN(Number(e.target.value))) {
                            setFormData(prev => ({ ...prev, gpa: null }));
                          } else {
                            setFormData(prev => ({ ...prev, gpa: Number(e.target.value) }));
                          }
                        }}
                        placeholder="0.0 - 4.0"
                        min="0"
                        max="4.0"
                        step="0.1"
                      />
                      
                      <FormField
                        label="Academic Honors (Optional)"
                        name="academicHonors"
                        value={formData.academicHonors}
                        onChange={handleChange}
                        placeholder="e.g., Dean's List, Honor Roll"
                      />
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </AnimatedFormTransition>
        );
      
      case "athlete-sport-info":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 relative max-w-3xl mx-auto">
              <StaggerContainer>
                <StaggerItem>
                  <motion.h2 
                    className="text-2xl font-bold mb-4 text-white"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Sport Information
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-400 mb-6"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    Tell us about your collegiate athletic career.
                  </motion.p>
                </StaggerItem>
                
                <StaggerItem>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="mb-2">
                          <label className="block text-sm font-medium text-white">Sport <span className="text-red-500">*</span></label>
                        </div>
                        <select 
                          name="sport" 
                          value={formData.sport} 
                          onChange={handleChange}
                          className="w-full rounded-md bg-zinc-800 border border-zinc-700 py-2 px-3 text-white"
                          required
                        >
                          <option value="">Select Sport</option>
                          <option value="Football">Football</option>
                          <option value="Basketball">Basketball</option>
                          <option value="Baseball">Baseball</option>
                          <option value="Softball">Softball</option>
                          <option value="Soccer">Soccer</option>
                          <option value="Volleyball">Volleyball</option>
                          <option value="Track & Field">Track & Field</option>
                          <option value="Swimming & Diving">Swimming & Diving</option>
                          <option value="Tennis">Tennis</option>
                          <option value="Golf">Golf</option>
                          <option value="Wrestling">Wrestling</option>
                          <option value="Gymnastics">Gymnastics</option>
                          <option value="Ice Hockey">Ice Hockey</option>
                          <option value="Lacrosse">Lacrosse</option>
                          <option value="Field Hockey">Field Hockey</option>
                          <option value="Rugby">Rugby</option>
                          <option value="Water Polo">Water Polo</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.sport && (
                          <p className="text-red-500 text-xs mt-1">{errors.sport}</p>
                        )}
                      </div>
                      
                      <FormField
                        label="Position"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        placeholder="Your position or specialty"
                        required={true}
                        errorMessage={errors.position}
                        isTouched={!!errors.position}
                      />
                    </div>
                    
                    <div>
                      <FormField
                        label="Athletic Achievements"
                        name="sportAchievements"
                        type="textarea"
                        value={formData.sportAchievements}
                        onChange={handleChange}
                        placeholder="List your key athletic achievements, awards, or recognition"
                        rows={3}
                      />
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </AnimatedFormTransition>
        );
        
      case "athlete-eligibility-check":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 relative max-w-3xl mx-auto">
              <StaggerContainer>
                <StaggerItem>
                  <motion.h2 
                    className="text-2xl font-bold mb-4 text-white"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Eligibility Verification
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-400 mb-6"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    We'll verify your eligibility based on your school, division, and sport.
                  </motion.p>
                </StaggerItem>
                
                <StaggerItem>
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-md p-5 mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-amber-500/20 p-2 rounded-full">
                        <InfoIcon className="h-6 w-6 text-amber-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Eligibility Information</h3>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-zinc-300">
                        Your eligibility will be verified before you can accept partnerships. We'll review:
                      </p>
                      <ul className="list-disc pl-5 text-zinc-300 space-y-1">
                        <li>Your status as a current student-athlete</li>
                        <li>Your school's specific NIL policies</li>
                        <li>Compliance with NCAA, NAIA, or other governing body regulations</li>
                      </ul>
                    </div>
                    
                    <div className="bg-zinc-900/50 p-4 rounded-md">
                      <div className="flex justify-between mb-2">
                        <span className="text-white font-medium">School</span>
                        <span className="text-zinc-300">{formData.school || '-'}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-white font-medium">Division</span>
                        <span className="text-zinc-300">{formData.division || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white font-medium">Sport</span>
                        <span className="text-zinc-300">{formData.sport || '-'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-md p-5">
                    <h3 className="text-lg font-semibold text-white mb-4">Confirmation</h3>
                    <div className="flex items-start mb-4">
                      <input 
                        type="checkbox" 
                        id="eligibility-confirmation" 
                        className="mt-1 mr-3"
                        checked={formData.eligibilityStatus === "pending"}
                        onChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            eligibilityStatus: prev.eligibilityStatus === "pending" ? "" : "pending"
                          }));
                        }}
                      />
                      <label htmlFor="eligibility-confirmation" className="text-zinc-300">
                        I confirm that I am currently enrolled and eligible to participate in collegiate athletics at the school I've indicated.
                      </label>
                    </div>
                    {errors.eligibility && (
                      <p className="text-red-500 text-xs">{errors.eligibility}</p>
                    )}
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </AnimatedFormTransition>
        );
        
      case "athlete-social-media":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 relative max-w-3xl mx-auto">
              <StaggerContainer>
                <StaggerItem>
                  <motion.h2 
                    className="text-2xl font-bold mb-4 text-white"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Social Media Presence
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-400 mb-6"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    Your social media accounts are crucial for businesses looking to partner with you.
                  </motion.p>
                </StaggerItem>
                
                <StaggerItem>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Instagram"
                        name="instagram"
                        value={formData.socialHandles?.instagram || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            socialHandles: {
                              ...prev.socialHandles,
                              instagram: e.target.value
                            }
                          }));
                        }}
                        placeholder="@username"
                      />
                      
                      <FormField
                        label="TikTok"
                        name="tiktok"
                        value={formData.socialHandles?.tiktok || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            socialHandles: {
                              ...prev.socialHandles,
                              tiktok: e.target.value
                            }
                          }));
                        }}
                        placeholder="@username"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Twitter/X"
                        name="twitter"
                        value={formData.socialHandles?.twitter || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            socialHandles: {
                              ...prev.socialHandles,
                              twitter: e.target.value
                            }
                          }));
                        }}
                        placeholder="@username"
                      />
                      
                      <FormField
                        label="YouTube"
                        name="youtube"
                        value={formData.socialHandles?.youtube || ""}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            socialHandles: {
                              ...prev.socialHandles,
                              youtube: e.target.value
                            }
                          }));
                        }}
                        placeholder="Channel name or URL"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Total Follower Count"
                        name="followerCount"
                        type="number"
                        value={formData.followerCount ? formData.followerCount.toString() : ""}
                        onChange={(e) => {
                          if (e.target.value === "" || isNaN(Number(e.target.value))) {
                            setFormData(prev => ({ ...prev, followerCount: null }));
                          } else {
                            setFormData(prev => ({ ...prev, followerCount: Number(e.target.value) }));
                          }
                        }}
                        placeholder="Approximate total across all platforms"
                        min="0"
                        required={true}
                        errorMessage={errors.followerCount}
                        isTouched={!!errors.followerCount}
                      />
                      
                      <FormField
                        label="Average Engagement Rate (%)"
                        name="averageEngagementRate"
                        type="number"
                        value={formData.averageEngagementRate ? formData.averageEngagementRate.toString() : ""}
                        onChange={(e) => {
                          if (e.target.value === "" || isNaN(Number(e.target.value))) {
                            setFormData(prev => ({ ...prev, averageEngagementRate: null }));
                          } else {
                            setFormData(prev => ({ ...prev, averageEngagementRate: Number(e.target.value) }));
                          }
                        }}
                        placeholder="e.g., 2.5"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    
                    {errors.socialHandles && (
                      <p className="text-red-500 text-xs">{errors.socialHandles}</p>
                    )}
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </AnimatedFormTransition>
        );
      
      case "athlete-content-style":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 relative max-w-3xl mx-auto">
              <StaggerContainer>
                <StaggerItem>
                  <motion.h2 
                    className="text-2xl font-bold mb-4 text-white"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Content Creation
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-400 mb-6"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    Describe your content style and the types of content you're comfortable creating.
                  </motion.p>
                </StaggerItem>
                
                <StaggerItem>
                  <div className="space-y-6">
                    <div>
                      <FormField
                        label="Your Content Style"
                        name="contentStyle"
                        type="textarea"
                        value={formData.contentStyle}
                        onChange={handleChange}
                        placeholder="Describe your aesthetic, tone, and style of content creation (e.g., energetic and vibrant, professional and polished, casual and authentic, etc.)"
                        rows={3}
                        required={true}
                        errorMessage={errors.contentStyle}
                        isTouched={!!errors.contentStyle}
                      />
                    </div>
                    
                    <div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-white">Content Types <span className="text-red-500">*</span></label>
                        <p className="text-zinc-400 text-xs">Select all types of content you're comfortable creating</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          'Photos', 'Videos', 'Reels/TikToks', 'Stories', 'Live Videos', 
                          'Product Reviews', 'Testimonials', 'Unboxing', 'Tutorials', 
                          'Behind-the-Scenes', 'Day-in-the-Life', 'Training Content'
                        ].map(type => (
                          <div key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`content-type-${type}`}
                              name="contentTypes"
                              value={type}
                              checked={formData.contentTypes.includes(type)}
                              onChange={(e) => handleCheckboxChange(e, 'contentTypes')}
                              className="mr-2"
                            />
                            <label htmlFor={`content-type-${type}`} className="text-white text-sm">{type}</label>
                          </div>
                        ))}
                      </div>
                      {errors.contentTypes && (
                        <p className="text-red-500 text-xs mt-1">{errors.contentTypes}</p>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </AnimatedFormTransition>
        );
      
      case "athlete-compensation":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 relative max-w-3xl mx-auto">
              <StaggerContainer>
                <StaggerItem>
                  <motion.h2 
                    className="text-2xl font-bold mb-4 text-white"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Compensation Expectations
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-400 mb-6"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    Let businesses know what you're looking for in terms of compensation.
                  </motion.p>
                </StaggerItem>
                
                <StaggerItem>
                  <div className="space-y-6">
                    <div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-white">Compensation Preferences <span className="text-red-500">*</span></label>
                      </div>
                      <select 
                        name="compensationGoals" 
                        value={formData.compensationGoals} 
                        onChange={handleChange}
                        className="w-full rounded-md bg-zinc-800 border border-zinc-700 py-2 px-3 text-white"
                        required
                      >
                        <option value="">Select Preference</option>
                        <option value="Money Only">Money Only</option>
                        <option value="Products/Services Only">Products/Services Only</option>
                        <option value="Combination of Money and Products">Combination of Money and Products</option>
                        <option value="Flexible (Depends on Brand)">Flexible (Depends on Brand)</option>
                      </select>
                      {errors.compensationGoals && (
                        <p className="text-red-500 text-xs mt-1">{errors.compensationGoals}</p>
                      )}
                    </div>
                    
                    <div>
                      <FormField
                        label="Minimum Compensation Expectation"
                        name="minimumCompensation"
                        value={formData.minimumCompensation}
                        onChange={handleChange}
                        placeholder="e.g., $300 per post, $500 minimum for partnerships"
                        required={true}
                        errorMessage={errors.minimumCompensation}
                        isTouched={!!errors.minimumCompensation}
                      />
                      <p className="text-zinc-400 text-xs mt-1">
                        This helps us match you with appropriate opportunities. You can always negotiate specific deals later.
                      </p>
                    </div>
                    
                    <div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-white">Preferred Product Categories</label>
                        <p className="text-zinc-400 text-xs">Select categories of products you'd be interested in promoting</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          'Athletic Apparel', 'Footwear', 'Equipment', 'Nutrition/Supplements', 
                          'Food & Beverage', 'Technology', 'Lifestyle Brands', 'Fashion', 
                          'Health & Wellness', 'Financial Services', 'Entertainment', 'Travel'
                        ].map(category => (
                          <div key={category} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`product-category-${category}`}
                              name="preferredProductCategories"
                              value={category}
                              checked={formData.preferredProductCategories.includes(category)}
                              onChange={(e) => handleCheckboxChange(e, 'preferredProductCategories')}
                              className="mr-2"
                            />
                            <label htmlFor={`product-category-${category}`} className="text-white text-sm">{category}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </AnimatedFormTransition>
        );
      
      case "athlete-brand-values":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 relative max-w-3xl mx-auto">
              <StaggerContainer>
                <StaggerItem>
                  <motion.h2 
                    className="text-2xl font-bold mb-4 text-white"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Personal Brand & Values
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-400 mb-6"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    Help us match you with brands that align with your values and personal brand.
                  </motion.p>
                </StaggerItem>
                
                <StaggerItem>
                  <div className="space-y-6">
                    <div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-white">Your Personal Values <span className="text-red-500">*</span></label>
                        <p className="text-zinc-400 text-xs">Select values that are most important to you</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          'Authenticity', 'Excellence', 'Innovation', 'Diversity & Inclusion', 
                          'Environmental Sustainability', 'Health & Wellbeing', 'Education', 
                          'Community Service', 'Leadership', 'Integrity', 'Teamwork', 'Perseverance'
                        ].map(value => (
                          <div key={value} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`value-${value}`}
                              name="personalValues"
                              value={value}
                              checked={formData.personalValues.includes(value)}
                              onChange={(e) => handleCheckboxChange(e, 'personalValues')}
                              className="mr-2"
                            />
                            <label htmlFor={`value-${value}`} className="text-white text-sm">{value}</label>
                          </div>
                        ))}
                      </div>
                      {errors.personalValues && (
                        <p className="text-red-500 text-xs mt-1">{errors.personalValues}</p>
                      )}
                    </div>
                    
                    <div>
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-white">Causes You Care About</label>
                        <p className="text-zinc-400 text-xs">Select causes that are important to you</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          'Youth Sports', 'Education', 'Health Research', 'Environmental Protection', 
                          'Social Justice', 'Mental Health', 'Poverty Relief', 'Animal Welfare', 
                          'Racial Equality', 'Women in Sports', 'LGBTQ+ Rights', 'Disability Rights'
                        ].map(cause => (
                          <div key={cause} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`cause-${cause}`}
                              name="causes"
                              value={cause}
                              checked={formData.causes.includes(cause)}
                              onChange={(e) => handleCheckboxChange(e, 'causes')}
                              className="mr-2"
                            />
                            <label htmlFor={`cause-${cause}`} className="text-white text-sm">{cause}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <FormField
                        label="Availability Timeframe"
                        name="availabilityTimeframe"
                        value={formData.availabilityTimeframe}
                        onChange={handleChange}
                        placeholder="e.g., Available year-round, Limited during season (Aug-Mar)"
                      />
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </AnimatedFormTransition>
        );

      // Common steps
      case "user-type":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-8 relative max-w-3xl mx-auto">
              
              <StaggerContainer>
                <StaggerItem>
                  <motion.h2 
                    className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    Welcome to Contested!
                  </motion.h2>
                  <motion.h3
                    className="text-xl font-medium mb-4 text-white"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                  >
                    I'm here to help you get started
                  </motion.h3>
                  <motion.p 
                    className="text-zinc-400 mb-8"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    Let me guide you through our platform based on your needs. First, tell me which best describes you:
                  </motion.p>
                </StaggerItem>
                
                <StaggerItem
                  customVariants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 24,
                        delay: 0.4,
                      },
                    },
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <AnimatedSelectionField
                      type="radio"
                      name="userType"
                      selectedValues={formData.userType}
                      onChange={(e) => handleRadioChange(e, e.target.value)}
                      options={[
                        {
                          value: "business",
                          label: "I'm a Business",
                          description: "Looking to partner with college athletes for marketing and promotion",
                          icon: <Building className="h-12 w-12 text-amber-500" />
                        },
                        {
                          value: "athlete",
                          label: "I'm an Athlete",
                          description: "Looking to monetize my brand and find business partnerships", 
                          icon: <Trophy className="h-12 w-12 text-red-500" />
                        }
                      ]}
                      cardStyle={true}
                      required={true}
                      errorMessage={errors.userType}
                      isTouched={!!errors.userType}
                    />
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </AnimatedFormTransition>
        );
        
      case "business-type":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 relative max-w-3xl mx-auto">
              <StaggerContainer>
                <StaggerItem>
                  <motion.h2 
                    className="text-2xl font-bold mb-4 text-white"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    What type of business are you?
                  </motion.h2>
                  <motion.p 
                    className="text-zinc-400 mb-6"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    This helps us tailor athlete matches that align with your specific business model.
                  </motion.p>
                </StaggerItem>
                
                <StaggerItem
                  customVariants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 24,
                        delay: 0.3,
                      },
                    },
                  }}
                >
                  <div className="relative z-10">
                    <AnimatedSelectionField
                      type="radio"
                      name="businessType"
                      selectedValues={formData.businessType}
                      onChange={(e) => handleRadioChange(e, e.target.value)}
                      options={[
                        {
                          value: "product",
                          label: "Product Business",
                          description: "We sell physical or digital products to consumers",
                          icon: <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
                        },
                        {
                          value: "service",
                          label: "Service Business",
                          description: "We provide services to consumers or other businesses",
                          icon: <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10"></circle><path d="m4.9 4.9 14.2 14.2"></path><path d="M12 2v20"></path><path d="M2 12h20"></path></svg>
                        }
                      ]}
                      required={true}
                      errorMessage={errors.businessType}
                      isTouched={!!errors.businessType}
                      cardStyle={true}
                    />
                  </div>
                </StaggerItem>
                
                <StaggerItem
                  customVariants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 24,
                        delay: 0.6,
                      },
                    },
                  }}
                >
                  <motion.div 
                    className="mt-8 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg"
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm text-zinc-400">
                        Your business type helps us match you with athletes who can best represent your products or services
                        to their audience in the most authentic way.
                      </p>
                    </div>
                  </motion.div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </AnimatedFormTransition>
        );
        
      case "industry":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6">
              <StaggerItem>
                <motion.h2 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  What industry are you in?
                </motion.h2>
                <div className="space-y-4">
                  <div className="relative mb-4">
                    <div className={`relative rounded-lg ${errors.industry ? 'ring-2 ring-red-500' : ''}`}>
                      <Select
                        onValueChange={(value) => {
                          setFormData(prev => ({ ...prev, industry: value }));
                          if (errors.industry) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.industry;
                              return newErrors;
                            });
                          }
                        }}
                        value={formData.industry}
                      >
                        <SelectTrigger className="w-full h-[52px] bg-zinc-800/90 border-none rounded-lg text-white">
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80 bg-zinc-800 text-white border-zinc-700">
                          {industries.map((industry) => (
                            <SelectItem key={industry.id} value={industry.id} className="focus:bg-zinc-700 focus:text-white">
                              {industry.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400">
                        <Building size={18} />
                      </div>
                    </div>
                    {errors.industry && (
                      <p className="text-red-500 text-sm mt-1">{errors.industry}</p>
                    )}
                  </div>
                  
                  {restrictedIndustries.includes(formData.industry) && (
                    <motion.div 
                      className="p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg mt-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-amber-300 font-medium">Note about your industry</p>
                      <p className="text-amber-200/80 text-sm mt-1">
                        Your industry may have additional compliance requirements. Our compliance team will review your account.
                      </p>
                    </motion.div>
                  )}
                </div>
              </StaggerItem>
            </div>
          </AnimatedFormTransition>
        );
        
      case "goals":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6">
              <StaggerItem>
                <motion.h2 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  What are your goals with athlete partnerships?
                </motion.h2>
                <motion.p 
                  className="text-zinc-400 mb-4"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  Select all that apply
                </motion.p>
                
                <AnimatedSelectionField
                  type="checkbox"
                  name="goalIdentification"
                  selectedValues={formData.goalIdentification}
                  onChange={(e) => handleCheckboxChange(e, "goalIdentification")}
                  options={[
                    {
                      value: "Awareness",
                      label: "Awareness",
                      description: "Increase brand visibility and recognition"
                    },
                    {
                      value: "Sales / Conversions",
                      label: "Sales / Conversions",
                      description: "Drive direct sales through athlete promotion"
                    },
                    {
                      value: "Launch new product",
                      label: "Launch new product",
                      description: "Use athletes to promote a new product release"
                    },
                    {
                      value: "Athlete ambassadors",
                      label: "Athlete ambassadors",
                      description: "Build long-term relationships with athletes as brand representatives"
                    },
                    {
                      value: "Other",
                      label: "Other"
                    }
                  ]}
                  required={true}
                  errorMessage={errors.goalIdentification}
                  isTouched={!!errors.goalIdentification}
                />
              </StaggerItem>
            </div>
          </AnimatedFormTransition>
        );
        
      case "past-partnerships":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6">
              <StaggerItem>
                <motion.h2 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Have you partnered with athletes before?
                </motion.h2>
                
                <AnimatedSelectionField
                  type="radio"
                  name="hasPastPartnership"
                  selectedValues={formData.hasPastPartnership === null ? "" : formData.hasPastPartnership.toString()}
                  onChange={(e) => handleRadioChange(e, e.target.value === "true")}
                  options={[
                    {
                      value: "true",
                      label: "Yes",
                      description: "We have worked with athletes in the past"
                    },
                    {
                      value: "false",
                      label: "No",
                      description: "This will be our first time working with athletes"
                    }
                  ]}
                  required={true}
                  errorMessage={errors.hasPastPartnership}
                  isTouched={!!errors.hasPastPartnership}
                />
              </StaggerItem>
            </div>
          </AnimatedFormTransition>
        );
        
      case "budget":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 max-w-3xl mx-auto">
              <StaggerItem>
                <motion.h2 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  What is your estimated monthly budget?
                </motion.h2>
                
                <div className="space-y-6">
                  <motion.div 
                    className="space-y-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    {/* Budget range display */}
                    <div className="text-center px-4 py-6 bg-zinc-800/40 rounded-lg border border-zinc-700">
                      <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
                        ${formData.budgetMin} - ${formData.budgetMax}
                      </h3>
                      <p className="text-zinc-400 text-sm">per month</p>
                    </div>
                    
                    {/* Budget Range Slider with two thumbs */}
                    <div className="px-4 py-6 space-y-6">
                      <div className="space-y-8">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <label className="text-sm text-zinc-400 mr-2">Min</label>
                            <div className="flex items-center px-2 py-1 bg-zinc-800 rounded border border-zinc-700">
                              <DollarSign className="h-3 w-3 text-zinc-400 mr-1" />
                              <input
                                type="number" 
                                value={formData.budgetMin}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (!isNaN(value) && value < formData.budgetMax) {
                                    setFormData(prev => ({
                                      ...prev,
                                      budgetMin: value
                                    }));
                                  }
                                }}
                                className="w-20 bg-transparent border-0 p-0 focus:outline-none text-right"
                                min={0}
                                max={formData.budgetMax - 100}
                                step={100}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <label className="text-sm text-zinc-400 mr-2">Max</label>
                            <div className="flex items-center px-2 py-1 bg-zinc-800 rounded border border-zinc-700">
                              <DollarSign className="h-3 w-3 text-zinc-400 mr-1" />
                              <input
                                type="number" 
                                value={formData.budgetMax}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (!isNaN(value) && value > formData.budgetMin) {
                                    setFormData(prev => ({
                                      ...prev,
                                      budgetMax: value
                                    }));
                                  }
                                }}
                                className="w-20 bg-transparent border-0 p-0 focus:outline-none text-right"
                                min={formData.budgetMin + 100}
                                max={20000}
                                step={100}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Single slider with two thumbs/handles */}
                        <div className="pt-6">
                          <Slider 
                            value={[formData.budgetMin, formData.budgetMax]}
                            min={0}
                            max={20000}
                            step={100}
                            minStepsBetweenThumbs={1}
                            onValueChange={(values) => {
                              const [min, max] = values;
                              setFormData(prev => ({
                                ...prev,
                                budgetMin: min,
                                budgetMax: max
                              }));
                            }}
                            className="my-6"
                          />
                          <div className="flex justify-between text-xs text-zinc-500 pt-2">
                            <span>$0</span>
                            <span>$5,000</span>
                            <span>$10,000</span>
                            <span>$15,000</span>
                            <span>$20,000</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.p 
                    className="text-sm text-zinc-400 mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    This helps us match you with athletes within your budget range.
                  </motion.p>
                  
                  {errors.budget && (
                    <motion.p 
                      className="text-red-500 text-sm mt-2"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {errors.budget}
                    </motion.p>
                  )}
                </div>
              </StaggerItem>
            </div>
          </AnimatedFormTransition>
        );
        
      case "zip-code":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 max-w-3xl mx-auto">
              <StaggerItem>
                <motion.h2 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  What is your business's zip code?
                </motion.h2>
                
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <AnimatedFormField
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      label="ZIP Code"
                      placeholder="Enter your 5-digit ZIP code"
                      required={true}
                      pattern="^\d{5}(-\d{4})?$"
                      errorMessage={errors.zipCode}
                      icon={<MapPin size={18} />}
                      className="w-full"
                    />
                    
                    <motion.p 
                      className="text-sm text-zinc-400 mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      This helps us match you with athletes in your relevant geographic area.
                    </motion.p>
                  </motion.div>
                  
                  {/* Map visualization placeholder that appears when ZIP is valid */}
                  {formData.zipCode && /^\d{5}(-\d{4})?$/.test(formData.zipCode) && (
                    <motion.div
                      className="mt-6 bg-zinc-800 rounded-lg overflow-hidden relative"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="p-4 flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="bg-zinc-900/80 backdrop-blur-sm p-3 rounded-lg flex items-center space-x-2 border border-zinc-700">
                            <MapPin size={16} className="text-red-500" />
                            <span className="text-white font-medium">{formData.zipCode}</span>
                          </div>
                          
                          <div className="text-green-400 flex items-center">
                            <CheckCircle size={16} className="mr-1" />
                            <span className="text-sm">Valid location</span>
                          </div>
                        </div>
                        
                        <div className="bg-zinc-900/90 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center space-x-2 border border-zinc-700 text-sm">
                          <Info size={14} className="text-blue-400 flex-shrink-0" />
                          <span className="text-zinc-300">Location confirmed - We'll use this area for local athlete matching</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </StaggerItem>
            </div>
          </AnimatedFormTransition>
        );
        
      case "operating-location":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 max-w-3xl mx-auto">
              <StaggerItem>
                <motion.h2 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Where do you operate?
                </motion.h2>
                
                <motion.p 
                  className="text-zinc-400 mb-4"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  Select all that apply
                </motion.p>
                
                <AnimatedSelectionField
                  type="checkbox"
                  name="operatingLocation"
                  selectedValues={formData.operatingLocation}
                  onChange={(e) => handleCheckboxChange(e, "operatingLocation")}
                  options={[
                    {
                      value: "Neighborhood / Zip",
                      label: "Neighborhood / Zip",
                      description: "Local area surrounding your business"
                    },
                    {
                      value: "City",
                      label: "City",
                      description: "Within city limits"
                    },
                    {
                      value: "Region",
                      label: "Region",
                      description: "Multiple cities or counties"
                    },
                    {
                      value: "Statewide",
                      label: "Statewide",
                      description: "Throughout your entire state"
                    },
                    {
                      value: "National",
                      label: "National",
                      description: "Multiple states across the country"
                    },
                    {
                      value: "Remote / Online",
                      label: "Remote / Online",
                      description: "Services delivered digitally or remotely"
                    }
                  ]}
                  required={true}
                  errorMessage={errors.operatingLocation}
                  isTouched={!!errors.operatingLocation}
                />
                
                {/* Visual representation of reach - shows when at least one is selected */}
                {formData.operatingLocation.length > 0 && (
                  <motion.div
                    className="mt-6 rounded-lg overflow-hidden"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="p-4 border border-zinc-700 rounded-lg bg-zinc-800/50">
                      <p className="font-medium text-zinc-200 mb-2">Your operating reach:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.operatingLocation.map(location => (
                          <motion.span
                            key={location}
                            className="inline-flex items-center px-3 py-1 rounded-full bg-red-600/20 text-red-200 border border-red-500/30 text-sm"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <MapPin size={14} className="mr-1" /> {location}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </StaggerItem>
            </div>
          </AnimatedFormTransition>
        );
        
      case "contact-info":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 max-w-3xl mx-auto">
              <StaggerItem>
                <motion.h2 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Who is the primary contact?
                </motion.h2>
                
                <div className="space-y-5">
                  <motion.div
                    className="space-y-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <AnimatedFormField
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      label="Full Name"
                      placeholder="Enter your full name"
                      required={true}
                      errorMessage={errors.name}
                      icon={<User size={18} />}
                    />
                    
                    <AnimatedFormField
                      type="text"
                      name="contactTitle"
                      value={formData.contactTitle}
                      onChange={handleChange}
                      label="Job Title"
                      placeholder="e.g., Marketing Manager, CEO"
                      icon={<Building size={18} />}
                    />
                    
                    <AnimatedFormField
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      label="Email Address"
                      placeholder="your.email@example.com"
                      required={true}
                      errorMessage={errors.email}
                      icon={<Mail size={18} />}
                    />
                    
                    <AnimatedFormField
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      label="Phone Number"
                      placeholder="(555) 555-5555"
                      required={true}
                      errorMessage={errors.contactPhone}
                      icon={<Phone size={18} />}
                    />
                  </motion.div>
                  
                  {/* Contact card preview - shows when fields are filled */}
                  {formData.name && formData.email && (
                    <motion.div
                      className="mt-6 p-4 border border-zinc-700 rounded-lg bg-zinc-800/70 backdrop-blur-sm"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <div className="flex items-start">
                        <div className="bg-gradient-to-br from-red-500 to-amber-500 h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold mr-4">
                          {formData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{formData.name}</h3>
                          {formData.contactTitle && (
                            <p className="text-zinc-400 text-sm">{formData.contactTitle}</p>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center mt-2 gap-2 sm:gap-4">
                            <div className="flex items-center text-sm text-zinc-300">
                              <Mail size={14} className="mr-1 text-red-400" />
                              {formData.email}
                            </div>
                            {formData.contactPhone && (
                              <div className="flex items-center text-sm text-zinc-300">
                                <Phone size={14} className="mr-1 text-amber-400" />
                                {formData.contactPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </StaggerItem>
            </div>
          </AnimatedFormTransition>
        );
        
      case "business-size":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 max-w-3xl mx-auto">
              <StaggerItem>
                <motion.h2 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  What is your business size?
                </motion.h2>
                
                <AnimatedSelectionField
                  type="radio"
                  name="businessSize"
                  selectedValues={formData.businessSize}
                  onChange={(e) => handleRadioChange(e, e.target.value)}
                  options={[
                    {
                      value: "sole_proprietor",
                      label: "Sole Proprietor",
                      description: "One-person business"
                    },
                    {
                      value: "small_team",
                      label: "Small Team",
                      description: "2-10 employees"
                    },
                    {
                      value: "medium",
                      label: "Medium",
                      description: "11-100 employees"
                    },
                    {
                      value: "enterprise",
                      label: "Enterprise",
                      description: "100+ employees"
                    }
                  ]}
                  required={true}
                  errorMessage={errors.businessSize}
                  isTouched={!!errors.businessSize}
                />
                
                {/* Business size visualization - appears when option is selected */}
                {formData.businessSize && (
                  <motion.div
                    className="mt-6 p-4 border border-zinc-700 rounded-lg bg-zinc-800/70 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <p className="font-medium text-zinc-200 mb-3">Employee Size Range:</p>
                    <div className="relative h-8 bg-zinc-900 rounded-lg overflow-hidden">
                      <motion.div 
                        className="absolute h-full bg-gradient-to-r from-red-600 to-amber-600"
                        initial={{ width: 0 }}
                        animate={{ 
                          width: formData.businessSize === "sole_proprietor" ? "10%" : 
                                 formData.businessSize === "small_team" ? "30%" :
                                 formData.businessSize === "medium" ? "60%" : "90%"
                        }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      />
                      <div className="absolute inset-0 flex items-center px-4">
                        <span className="text-white font-medium text-sm">
                          {formData.businessSize === "sole_proprietor" ? "1 employee" : 
                           formData.businessSize === "small_team" ? "2-10 employees" :
                           formData.businessSize === "medium" ? "11-100 employees" : "100+ employees"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 mt-3">
                      {formData.businessSize === "sole_proprietor" ? 
                        "As a sole proprietor, you'll get personalized athlete recommendations that fit your individual business needs." : 
                       formData.businessSize === "small_team" ? 
                        "Small teams often benefit from micro-influencers and local athletes to build community connections." :
                       formData.businessSize === "medium" ? 
                        "Medium-sized businesses typically work with a mix of emerging and established athlete talent." : 
                        "Enterprise organizations can leverage our platform for large-scale campaigns with multiple tiers of athlete partnerships."}
                    </p>
                  </motion.div>
                )}
              </StaggerItem>
            </div>
          </AnimatedFormTransition>
        );
        
      case "create-password":
        return (
          <AnimatedFormTransition step={currentStep} direction="forward">
            <div className="space-y-6 max-w-3xl mx-auto">
              <StaggerItem>
                <motion.h2 
                  className="text-2xl font-bold mb-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  Create your password
                </motion.h2>
                
                <motion.p 
                  className="text-zinc-400 mb-6"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  Final step to complete your registration
                </motion.p>
                
                <div className="space-y-5">
                  {/* Enhanced Account Information Summary */}
                  <motion.div 
                    className="p-5 rounded-lg bg-zinc-800/50 border border-zinc-700 mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <h3 className="font-semibold text-lg mb-3 text-red-400">Account Summary</h3>
                    
                    <div className="grid gap-3">
                      <div className="grid md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-zinc-400 text-sm">Name</p>
                          <p className="text-zinc-200 font-medium">{formData.name}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-sm">Email</p>
                          <p className="text-zinc-200 font-medium">{formData.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-zinc-400 text-sm">Business Type</p>
                          <p className="text-zinc-200 font-medium capitalize">{formData.businessType || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-sm">Industry</p>
                          <p className="text-zinc-200 font-medium">{formData.industry || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-zinc-400 text-sm">Budget Range</p>
                        <p className="text-zinc-200 font-medium">${formData.budgetMin} - ${formData.budgetMax} per month</p>
                      </div>
                      
                      <div>
                        <p className="text-zinc-400 text-sm">Marketing Goals</p>
                        <p className="text-zinc-200 font-medium">
                          {formData.goalIdentification.length > 0 
                            ? formData.goalIdentification.join(', ') 
                            : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                
                  <motion.div
                    className="space-y-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <AnimatedFormField
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      label="Create Password"
                      placeholder="Minimum 8 characters"
                      required={true}
                      minLength={8}
                      errorMessage={errors.password}
                    />
                    
                    <AnimatedFormField
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      label="Confirm Password"
                      placeholder="Re-enter your password"
                      required={true}
                      errorMessage={errors.confirmPassword}
                    />
                  </motion.div>
                  
                  {/* Password strength indicator */}
                  {formData.password && (
                    <motion.div
                      className="mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-sm text-zinc-400 mb-1">Password strength:</p>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${
                            formData.password.length < 6 ? 'bg-red-500' :
                            formData.password.length < 8 ? 'bg-amber-500' :
                            formData.password.length < 10 ? 'bg-green-500' :
                            'bg-emerald-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ 
                            width: 
                              formData.password.length === 0 ? '0%' :
                              formData.password.length < 6 ? '25%' :
                              formData.password.length < 8 ? '50%' :
                              formData.password.length < 10 ? '75%' : '100%'
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {formData.password.length === 0 ? 'Enter your password' :
                         formData.password.length < 6 ? 'Weak - Add more characters' :
                         formData.password.length < 8 ? 'Fair - Getting better' :
                         formData.password.length < 10 ? 'Good - Almost there' : 'Strong - Excellent choice'}
                      </p>
                    </motion.div>
                  )}
                  
                  {/* Password match indicator */}
                  {formData.password && formData.confirmPassword && (
                    <motion.div
                      className="flex items-center mt-4 text-sm"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {formData.password === formData.confirmPassword ? (
                        <p className="text-green-400">✓ Passwords match</p>
                      ) : (
                        <p className="text-red-400">✗ Passwords don't match</p>
                      )}
                    </motion.div>
                  )}
                  
                  <motion.div 
                    className="pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <p className="text-sm text-zinc-400">
                      By creating an account, you agree to our{" "}
                      <a href="/terms" className="text-red-400 hover:text-red-300">Terms of Service</a>{" "}
                      and{" "}
                      <a href="/privacy" className="text-red-400 hover:text-red-300">Privacy Policy</a>
                    </p>
                  </motion.div>
                </div>
              </StaggerItem>
            </div>
          </AnimatedFormTransition>
        );
        
      default:
        return null;
    }
  };
  
  // Render progress indicator
  const renderProgress = () => {
    // Don't show progress during loading or on first step
    if (!sessionId || currentStep === "user-type") {
      return null; // Don't show progress bar during loading or on the first step
    }
    
    // Different steps based on user type
    let steps: OnboardingStep[] = [];
    
    if (formData.userType === "athlete") {
      // Athlete-specific steps
      steps = [
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
    } else {
      // Business steps
      steps = [
        "business-type",
        "industry",
        "goals",
        "past-partnerships",
        "budget",
        "zip-code",
        ...(formData.businessType === "service" ? ["operating-location"] : []),
        "contact-info",
        "business-size",
        "create-password"
      ] as OnboardingStep[];
    }
    
    const currentIndex = steps.indexOf(currentStep as OnboardingStep);
    
    // If the current step is not found in the steps array, don't render a progress bar
    if (currentIndex === -1) {
      return null;
    }
    
    return (
      <AnimatedProgressBar
        currentStep={currentIndex}
        totalSteps={steps.length}
        className="mb-6"
      />
    );
  };
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <AnimatedGradient 
        className="absolute inset-0" 
        colors={['hsl(345, 90%, 55%, 0.1)', 'hsl(235, 100%, 50%, 0.1)', 'hsl(20, 100%, 50%, 0.1)']} 
        blur={150}
        duration={20}
      />
      
      <FadeIn delay={0.1} direction="up" className="z-10 w-full max-w-2xl">
        <div className="bg-zinc-900/80 backdrop-blur-md p-8 rounded-xl border border-zinc-800 shadow-xl">
          <StaggerContainer className="space-y-6">
            <StaggerItem>
              <h1 className="text-3xl font-bold mb-2 text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                  Onboarding
                </span>
              </h1>
            </StaggerItem>
            
            {renderProgress()}
            
            <form onSubmit={handleSubmit}>
              {renderStepContent()}
              
              {/* Only render these buttons if we're not loading and not already on a page with custom buttons */}
              {sessionId && !['athlete-category'].includes(currentStep) && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                  <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start gap-4">
                    {currentStep !== "user-type" && (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-6 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        <span className="flex items-center">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </span>
                      </button>
                    )}
                    
                    {/* Connection status indicator */}
                    <div className="flex items-center text-sm">
                      {connectionStatus === 'open' ? (
                        <div className="flex items-center text-green-500">
                          <Wifi className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Connected</span>
                        </div>
                      ) : connectionStatus === 'connecting' ? (
                        <div className="flex items-center text-yellow-500">
                          <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                          <span className="hidden sm:inline">Connecting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-500">
                          <WifiOff className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Disconnected</span>
                        </div>
                      )}
                      
                      {/* Manual sync button */}
                      {sessionId && (
                        <button 
                          type="button" 
                          onClick={syncFormData}
                          disabled={isSyncing || connectionStatus !== 'open'}
                          className="ml-2 p-1 rounded-full hover:bg-zinc-800 disabled:opacity-50"
                          title="Manually sync your data"
                        >
                          {isSyncing ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-primary" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {currentStep === "create-password" ? (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-amber-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Creating Account..." : "Create Account"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-amber-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span className="flex items-center justify-center">
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </span>
                    </button>
                  )}
                </div>
              )}
            </form>
          </StaggerContainer>
        </div>
        
        <p className="text-center text-zinc-500 text-sm mt-4">
          Already have an account? <a href="/auth" className="text-red-500 hover:text-red-400">Sign in</a>
        </p>
      </FadeIn>
    </div>
  );
}