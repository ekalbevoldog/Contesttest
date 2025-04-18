import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FadeIn } from "@/components/animations/FadeIn";
import { AnimatedGradient } from "@/components/animations/AnimatedGradient";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerContainer";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
        if (!formData.contactName) {
          newErrors.contactName = "Please enter a contact name";
        }
        if (!formData.contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
          newErrors.contactEmail = "Please enter a valid email address";
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
        if (!formData.name) {
          newErrors.name = "Please enter your name";
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }
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
          userType: "business"
        };
        
        const userResponse = await apiRequest("POST", "/api/auth/register", userData);
        
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.message || "Failed to create account");
        }
        
        // Create business profile
        const businessData = {
          name: formData.name,
          email: formData.email,
          industry: formData.industry,
          productType: formData.businessType,
          companySize: formData.businessSize,
          audienceGoals: formData.goalIdentification.join(", "),
          campaignVibe: "standard", // Default value
          values: "standard", // Default value
          targetSchoolsSports: "all", // Default value
          sessionId: "temp-session-id", // Will be replaced by server
          
          // Additional fields from the flow
          preferences: {
            hasPastPartnership: formData.hasPastPartnership,
            budget: {
              min: formData.budgetMin,
              max: formData.budgetMax
            },
            zipCode: formData.zipCode,
            operatingLocation: formData.operatingLocation,
            contactInfo: {
              name: formData.contactName,
              title: formData.contactTitle,
              email: formData.contactEmail,
              phone: formData.contactPhone
            },
            accessRestriction: formData.accessRestriction
          }
        };
        
        const businessResponse = await apiRequest("POST", "/api/profile", businessData);
        
        if (!businessResponse.ok) {
          const errorData = await businessResponse.json();
          throw new Error(errorData.message || "Failed to create business profile");
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
          <div className="space-y-6">
            <StaggerItem>
              <h2 className="text-2xl font-bold mb-4">What type of business are you?</h2>
              <div className="space-y-4">
                <label className="block p-4 rounded-lg border border-zinc-700 bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input
                    type="radio"
                    name="businessType"
                    value="product"
                    checked={formData.businessType === "product"}
                    onChange={e => handleRadioChange(e, "product")}
                    className="mr-2"
                  />
                  <span className="font-medium">Product Business</span>
                  <p className="text-sm text-zinc-400 mt-1 ml-5">We sell physical or digital products to consumers</p>
                </label>
                
                <label className="block p-4 rounded-lg border border-zinc-700 bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input
                    type="radio"
                    name="businessType"
                    value="service"
                    checked={formData.businessType === "service"}
                    onChange={e => handleRadioChange(e, "service")}
                    className="mr-2"
                  />
                  <span className="font-medium">Service Business</span>
                  <p className="text-sm text-zinc-400 mt-1 ml-5">We provide services to consumers or other businesses</p>
                </label>
              </div>
              {errors.businessType && <p className="text-red-500 text-sm mt-2">{errors.businessType}</p>}
            </StaggerItem>
          </div>
        );
        
      case "industry":
        return (
          <div className="space-y-6">
            <StaggerItem>
              <h2 className="text-2xl font-bold mb-4">What industry are you in?</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  placeholder="e.g., Apparel, Food & Beverage, Technology"
                  className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                  required
                />
                {errors.industry && <p className="text-red-500 text-sm mt-2">{errors.industry}</p>}
                
                {restrictedIndustries.some(industry => 
                  formData.industry.toLowerCase().includes(industry.toLowerCase())
                ) && (
                  <div className="p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg mt-4">
                    <p className="text-amber-300 font-medium">Note about your industry</p>
                    <p className="text-amber-200/80 text-sm mt-1">
                      Your industry may have additional compliance requirements. Our compliance team will review your account.
                    </p>
                  </div>
                )}
              </div>
            </StaggerItem>
          </div>
        );
        
      case "goals":
        return (
          <div className="space-y-6">
            <StaggerItem>
              <h2 className="text-2xl font-bold mb-4">What are your goals with athlete partnerships?</h2>
              <p className="text-zinc-400 mb-4">Select all that apply</p>
              <div className="space-y-3">
                {["Awareness", "Sales / Conversions", "Launch new product", "Athlete ambassadors", "Other"].map((goal) => (
                  <label key={goal} className="flex items-start p-3 rounded-lg border border-zinc-700 bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                    <input
                      type="checkbox"
                      value={goal}
                      checked={formData.goalIdentification.includes(goal)}
                      onChange={(e) => handleCheckboxChange(e, "goalIdentification")}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <span className="font-medium">{goal}</span>
                      {goal === "Awareness" && (
                        <p className="text-sm text-zinc-400 mt-1">Increase brand visibility and recognition</p>
                      )}
                      {goal === "Sales / Conversions" && (
                        <p className="text-sm text-zinc-400 mt-1">Drive direct sales through athlete promotion</p>
                      )}
                      {goal === "Launch new product" && (
                        <p className="text-sm text-zinc-400 mt-1">Use athletes to promote a new product release</p>
                      )}
                      {goal === "Athlete ambassadors" && (
                        <p className="text-sm text-zinc-400 mt-1">Build long-term relationships with athletes as brand representatives</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {errors.goalIdentification && <p className="text-red-500 text-sm mt-2">{errors.goalIdentification}</p>}
            </StaggerItem>
          </div>
        );
        
      case "past-partnerships":
        return (
          <div className="space-y-6">
            <StaggerItem>
              <h2 className="text-2xl font-bold mb-4">Have you partnered with athletes before?</h2>
              <div className="space-y-4">
                <label className="block p-4 rounded-lg border border-zinc-700 bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input
                    type="radio"
                    name="hasPastPartnership"
                    checked={formData.hasPastPartnership === true}
                    onChange={e => handleRadioChange(e, true)}
                    className="mr-2"
                  />
                  <span className="font-medium">Yes</span>
                  <p className="text-sm text-zinc-400 mt-1 ml-5">We have worked with athletes in the past</p>
                </label>
                
                <label className="block p-4 rounded-lg border border-zinc-700 bg-zinc-800/50 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <input
                    type="radio"
                    name="hasPastPartnership"
                    checked={formData.hasPastPartnership === false}
                    onChange={e => handleRadioChange(e, false)}
                    className="mr-2"
                  />
                  <span className="font-medium">No</span>
                  <p className="text-sm text-zinc-400 mt-1 ml-5">This will be our first time working with athletes</p>
                </label>
              </div>
              {errors.hasPastPartnership && <p className="text-red-500 text-sm mt-2">{errors.hasPastPartnership}</p>}
            </StaggerItem>
          </div>
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
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                    required
                  />
                  {errors.contactName && <p className="text-red-500 text-sm mt-1">{errors.contactName}</p>}
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
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                    required
                  />
                  {errors.contactEmail && <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>}
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
              <h2 className="text-2xl font-bold mb-4">Create your account</h2>
              <p className="text-zinc-400 mb-6">Final step to complete your registration</p>
              
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
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
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
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
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
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
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
    const progress = Math.floor((currentIndex / (steps.length - 1)) * 100);
    
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-zinc-500 mb-2">
          <span>Step {currentIndex + 1} of {steps.length}</span>
          <span>{progress}% Complete</span>
        </div>
        <div className="w-full h-1 bg-zinc-800 rounded-full">
          <div 
            className="h-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
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