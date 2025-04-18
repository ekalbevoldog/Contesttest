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
import { DollarSign, MapPin, Building, Mail, Phone, User, CheckCircle, ChevronRight, Zap, Trophy, Target, BarChart, Info, ChevronLeft } from "lucide-react";
import SliderWithInput from "@/components/SliderWithInput";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { industries, restrictedIndustries } from "../../../shared/industries";

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
  | "create-password";

// Form data type
interface BusinessFormData {
  // User type
  userType: "athlete" | "business" | "";
  
  // Type
  businessType: "product" | "service" | "hybrid" | "";
  
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
}

// Initial form data
const initialFormData: BusinessFormData = {
  userType: "",
  businessType: "",
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
  email: ""
};

// Using restrictedIndustries imported from shared/industries.ts

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("user-type");
  const [formData, setFormData] = useState<BusinessFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
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
      case "user-type":
        if (!formData.userType) {
          newErrors.userType = "Please select whether you're an athlete or a business";
        }
        break;
        
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
      
      // Determine next step based on current step and business type
      let nextStep: OnboardingStep;
      
      switch (currentStep) {
        case "user-type":
          // For both user types, proceed to the business type selection step
          // The user type is stored in formData for later use
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
      
      setCurrentStep(nextStep);
      window.scrollTo(0, 0);
    }
  };
  
  // Handle back navigation
  const handlePrevStep = () => {
    let prevStep: OnboardingStep;
    
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
          fullName: formData.name, // Backend expects fullName, not name
          userType: formData.userType // Use the selected user type
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
        
        // Create profile based on selected user type
        // Make sure to match the exact schema expected by the backend
        const profileData = {
          name: formData.name,
          userType: formData.userType, // Use the selected user type from form
          sessionId: sessionId, // Use the session ID from registration
          
          // Required by the business schema with minimum length requirements
          productType: formData.businessType || "product",
          audienceGoals: formData.goalIdentification.length > 0 
            ? formData.goalIdentification.join(", ") 
            : "Increasing brand awareness and driving sales through authentic athlete partnerships",
          campaignVibe: "Premium professional brand representation with authentic content creation",
          values: "Quality, authenticity, trust, and exceptional customer satisfaction for all partnerships",
          targetSchoolsSports: "All relevant college sports programs that align with our brand values",
          
          // Optional fields that still need to be present
          budget: `$${formData.budgetMin} - $${formData.budgetMax} per month`,
          industry: formData.industry,
          email: formData.email,
          
          // Store detailed preferences as JSON
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
        
        // Submit profile data
        const profileResponse = await apiRequest("POST", "/api/profile", profileData);
        
        if (!profileResponse.ok) {
          // Handle error response
          let errorMessage = `Failed to create ${formData.userType} profile`;
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
          description: "Your account has been created successfully.",
          variant: "default",
        });
        
        // Redirect to dashboard
        setLocation("/dashboard");
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
    switch (currentStep) {
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
    // Only show progress bar after user-type step
    if (currentStep === "user-type") {
      return null; // Don't show progress bar on the first step
    }
    
    const steps = [
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
    ];
    
    const currentIndex = steps.indexOf(currentStep);
    
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
              
              <div className="flex justify-between mt-8">
                {currentStep !== "user-type" && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-6 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    Back
                  </button>
                )}
                
                {currentStep === "create-password" ? (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-amber-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ml-auto"
                  >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-amber-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] ml-auto"
                  >
                    Continue
                  </button>
                )}
              </div>
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