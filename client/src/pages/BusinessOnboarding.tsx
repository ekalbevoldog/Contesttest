import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FadeIn } from "@/components/animations/FadeIn";
import { AnimatedGradient } from "@/components/animations/AnimatedGradient";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerContainer";
import { AnimatedFormField } from "@/components/animations/AnimatedFormField";
import { AnimatedSelectionField } from "@/components/animations/AnimatedSelectionField";
import { AnimatedFormTransition, AnimatedProgressBar } from "@/components/animations/AnimatedFormTransition";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, MapPin, Building, Mail, Phone, User } from "lucide-react";

// Step types
type OnboardingStep = 
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

// Restricted industries list
const restrictedIndustries = [
  "Alcohol/Spirits",
  "Tobacco",
  "Vaping/E-cigarettes",
  "Adult Entertainment",
  "Gambling/Sports Betting",
  "Firearms/Weapons",
  "Pharmaceuticals (non-FDA approved)",
  "Controversial Political Organizations"
];

export default function BusinessOnboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("business-type");
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
        const isRestricted = restrictedIndustries.some(industry => 
          formData.industry.toLowerCase().includes(industry.toLowerCase())
        );
        
        setFormData(prev => ({
          ...prev,
          accessRestriction: isRestricted ? "restricted" : "unrestricted"
        }));
      }
      
      // Determine next step based on current step and business type
      let nextStep: OnboardingStep;
      
      switch (currentStep) {
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
          userType: "business"
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
        
        // Create business profile
        // Make sure to match the exact schema expected by the backend
        const businessData = {
          name: formData.name,
          userType: "business",
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
        
        // Submit business profile data
        const businessResponse = await apiRequest("POST", "/api/profile", businessData);
        
        if (!businessResponse.ok) {
          // Handle error response
          let errorMessage = "Failed to create business profile";
          try {
            const errorData = await businessResponse.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
            console.error("Business profile creation error:", errorData);
          } catch (e) {
            console.error("Error parsing business error response:", e);
          }
          throw new Error(errorMessage);
        }
        
        // Parse successful response
        let businessResponseData;
        try {
          businessResponseData = await businessResponse.json();
          console.log("Business profile created successfully:", businessResponseData);
        } catch (error) {
          console.error("Error parsing business success response:", error);
          // Don't throw here - the profile was created, we just couldn't parse response
        }
        
        toast({
          title: "Success!",
          description: "Your business account has been created successfully.",
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
      case "business-type":
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
                  What type of business are you?
                </motion.h2>
                
                <AnimatedSelectionField
                  type="radio"
                  name="businessType"
                  selectedValues={formData.businessType}
                  onChange={(e) => handleRadioChange(e, e.target.value)}
                  options={[
                    {
                      value: "product",
                      label: "Product Business",
                      description: "We sell physical or digital products to consumers"
                    },
                    {
                      value: "service",
                      label: "Service Business",
                      description: "We provide services to consumers or other businesses"
                    }
                  ]}
                  required={true}
                  errorMessage={errors.businessType}
                  isTouched={!!errors.businessType}
                />
              </StaggerItem>
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
                  <AnimatedFormField
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    placeholder="e.g., Apparel, Food & Beverage, Technology"
                    required={true}
                    errorMessage={errors.industry}
                    icon={<Building size={18} />}
                  />
                  
                  {restrictedIndustries.some(industry => 
                    formData.industry.toLowerCase().includes(industry.toLowerCase())
                  ) && (
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
          <div className="space-y-6">
            <StaggerItem>
              <h2 className="text-2xl font-bold mb-4">What is your estimated monthly budget?</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-1/2">
                    <label htmlFor="budgetMin" className="block text-sm font-medium text-gray-300 mb-2">
                      Minimum
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">$</span>
                      <input
                        type="number"
                        id="budgetMin"
                        name="budgetMin"
                        value={formData.budgetMin}
                        onChange={handleChange}
                        className="w-full pl-8 p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                  
                  <div className="w-1/2">
                    <label htmlFor="budgetMax" className="block text-sm font-medium text-gray-300 mb-2">
                      Maximum
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">$</span>
                      <input
                        type="number"
                        id="budgetMax"
                        name="budgetMax"
                        value={formData.budgetMax}
                        onChange={handleChange}
                        className="w-full pl-8 p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                        min="0"
                        step="100"
                      />
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-zinc-400 mt-1">
                  This helps us match you with athletes within your budget range.
                </p>
                
                {errors.budget && <p className="text-red-500 text-sm mt-2">{errors.budget}</p>}
              </div>
            </StaggerItem>
          </div>
        );
        
      case "zip-code":
        return (
          <div className="space-y-6">
            <StaggerItem>
              <h2 className="text-2xl font-bold mb-4">What is your business's zip code?</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="Enter your ZIP code"
                  className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                  maxLength={10}
                  required
                />
                <p className="text-sm text-zinc-400">
                  This helps us match you with athletes in your relevant geographic area.
                </p>
                {errors.zipCode && <p className="text-red-500 text-sm mt-2">{errors.zipCode}</p>}
              </div>
            </StaggerItem>
          </div>
        );
        
      case "operating-location":
        return (
          <div className="space-y-6">
            <StaggerItem>
              <h2 className="text-2xl font-bold mb-4">Where do you operate?</h2>
              <p className="text-zinc-400 mb-4">Select all that apply</p>
              <div className="space-y-3">
                {[
                  "Neighborhood / Zip",
                  "City",
                  "Region",
                  "Statewide",
                  "National",
                  "Remote / Online"
                ].map((location) => (
                  <label key={location} className="flex items-start p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                    <input
                      type="checkbox"
                      value={location}
                      checked={formData.operatingLocation.includes(location)}
                      onChange={(e) => handleCheckboxChange(e, "operatingLocation")}
                      className="mt-1 mr-3"
                    />
                    <span className="font-medium">{location}</span>
                  </label>
                ))}
              </div>
              {errors.operatingLocation && <p className="text-red-500 text-sm mt-2">{errors.operatingLocation}</p>}
            </StaggerItem>
          </div>
        );
        
      case "contact-info":
        return (
          <div className="space-y-6">
            <StaggerItem>
              <h2 className="text-2xl font-bold mb-4">Who is the primary contact?</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label htmlFor="contactTitle" className="block text-sm font-medium text-gray-300 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    id="contactTitle"
                    name="contactTitle"
                    value={formData.contactTitle}
                    onChange={handleChange}
                    className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                    required
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                    required
                  />
                  {errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>}
                </div>
              </div>
            </StaggerItem>
          </div>
        );
        
      case "business-size":
        return (
          <div className="space-y-6">
            <StaggerItem>
              <h2 className="text-2xl font-bold mb-4">What is your business size?</h2>
              <div className="space-y-4">
                <label className="block p-4 rounded-lg border border-zinc-700 bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input
                    type="radio"
                    name="businessSize"
                    value="sole_proprietor"
                    checked={formData.businessSize === "sole_proprietor"}
                    onChange={e => handleRadioChange(e, "sole_proprietor")}
                    className="mr-2"
                  />
                  <span className="font-medium">Sole Proprietor</span>
                  <p className="text-sm text-zinc-400 mt-1 ml-5">One-person business</p>
                </label>
                
                <label className="block p-4 rounded-lg border border-zinc-700 bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input
                    type="radio"
                    name="businessSize"
                    value="small_team"
                    checked={formData.businessSize === "small_team"}
                    onChange={e => handleRadioChange(e, "small_team")}
                    className="mr-2"
                  />
                  <span className="font-medium">Small Team</span>
                  <p className="text-sm text-zinc-400 mt-1 ml-5">2-10 employees</p>
                </label>
                
                <label className="block p-4 rounded-lg border border-zinc-700 bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input
                    type="radio"
                    name="businessSize"
                    value="medium"
                    checked={formData.businessSize === "medium"}
                    onChange={e => handleRadioChange(e, "medium")}
                    className="mr-2"
                  />
                  <span className="font-medium">Medium</span>
                  <p className="text-sm text-zinc-400 mt-1 ml-5">11-100 employees</p>
                </label>
                
                <label className="block p-4 rounded-lg border border-zinc-700 bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input
                    type="radio"
                    name="businessSize"
                    value="enterprise"
                    checked={formData.businessSize === "enterprise"}
                    onChange={e => handleRadioChange(e, "enterprise")}
                    className="mr-2"
                  />
                  <span className="font-medium">Enterprise</span>
                  <p className="text-sm text-zinc-400 mt-1 ml-5">100+ employees</p>
                </label>
              </div>
              {errors.businessSize && <p className="text-red-500 text-sm mt-2">{errors.businessSize}</p>}
            </StaggerItem>
          </div>
        );
        
      case "create-password":
        return (
          <div className="space-y-6">
            <StaggerItem>
              <h2 className="text-2xl font-bold mb-4">Create your password</h2>
              <p className="text-zinc-400 mb-6">Final step to complete your registration</p>
              
              <div className="space-y-4">
                {/* Enhanced Account Information Summary */}
                <div className="p-5 rounded-lg bg-zinc-800/50 border border-zinc-700 mb-4">
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
                </div>
              
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Create Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                    minLength={8}
                    required
                    placeholder="Minimum 8 characters"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  <p className="text-zinc-500 text-xs mt-1">Password must be at least 8 characters long</p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                    required
                    placeholder="Re-enter your password"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
                
                <div className="pt-2">
                  <p className="text-sm text-zinc-400">
                    By creating an account, you agree to our{" "}
                    <a href="/terms" className="text-red-400 hover:text-red-300">Terms of Service</a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-red-400 hover:text-red-300">Privacy Policy</a>
                  </p>
                </div>
              </div>
            </StaggerItem>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render progress indicator
  const renderProgress = () => {
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
                  Business Onboarding
                </span>
              </h1>
            </StaggerItem>
            
            {renderProgress()}
            
            <form onSubmit={handleSubmit}>
              {renderStepContent()}
              
              <div className="flex justify-between mt-8">
                {currentStep !== "business-type" && (
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