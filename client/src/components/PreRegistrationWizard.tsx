import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// SVG Icons
const MegaphoneIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
  </svg>
);

const CartIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
  </svg>
);

const CameraIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
  </svg>
);

const PeopleIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
  </svg>
);

const RocketIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
  </svg>
);

type MarketingObjective = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  successMetric: string;
  selected: boolean;
  isPrimary: boolean;
};

type ContentType = {
  id: string;
  name: string;
  description: string;
  avgEngagement: string;
  selected: boolean;
  icon: string;
};

type SportCategory = {
  id: string;
  name: string;
  type: "team" | "individual" | "olympic" | "esport";
  selected: boolean;
  icon: string;
};

type BrandPersonality = {
  id: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
};

type AthletePreview = {
  id: string;
  partialName: string;
  image: string;
  sport: string;
  affiliation: string;
  matchPercentage: number;
  followerCount: string;
  engagementRate: string;
};

const PreRegistrationWizard = () => {
  // State for wizard step
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showRegistration, setShowRegistration] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [processingMessage, setProcessingMessage] = useState<string>("Analyzing your preferences...");
  
  // State for Step 1 (Marketing Objectives)
  const [marketingObjectives, setMarketingObjectives] = useState<MarketingObjective[]>([
    {
      id: "awareness",
      name: "Brand awareness & recognition",
      icon: <MegaphoneIcon />,
      description: "Increase your brand's visibility and recognition in your target market.",
      successMetric: "Businesses selecting this goal see an average 24% increase in brand mentions",
      selected: false,
      isPrimary: false
    },
    {
      id: "sales",
      name: "Direct sales & conversions",
      icon: <CartIcon />,
      description: "Drive immediate sales and conversions through athlete promotions.",
      successMetric: "Average 32% increase in conversion rates for promoted products",
      selected: false,
      isPrimary: false
    },
    {
      id: "content",
      name: "Content creation for social channels",
      icon: <CameraIcon />,
      description: "Get authentic, athlete-generated content for your marketing channels.",
      successMetric: "7x higher engagement than branded content alone",
      selected: false,
      isPrimary: false
    },
    {
      id: "community",
      name: "Community engagement & loyalty",
      icon: <PeopleIcon />,
      description: "Build stronger connections with your existing customers and community.",
      successMetric: "42% increase in repeat purchase rates",
      selected: false,
      isPrimary: false
    },
    {
      id: "launches",
      name: "Product launches & promotions",
      icon: <RocketIcon />,
      description: "Amplify your new product launches and promotional campaigns.",
      successMetric: "3.5x more reach for new product announcements",
      selected: false,
      isPrimary: false
    }
  ]);
  
  // State for Step 2 (Budget & Deliverables)
  const [budget, setBudget] = useState<number>(1000);
  const [isMonthlyBudget, setIsMonthlyBudget] = useState<boolean>(true);
  const [athletesInRange, setAthletesInRange] = useState<number>(186);
  const [potentialReach, setPotentialReach] = useState<string>("45,000+");
  const [contentTypes, setContentTypes] = useState<ContentType[]>([
    {
      id: "instagram",
      name: "Instagram Post/Story",
      description: "Photos and stories on Instagram",
      avgEngagement: "4.2%",
      selected: false,
      icon: "instagram"
    },
    {
      id: "tiktok",
      name: "TikTok Video",
      description: "Short-form videos on TikTok",
      avgEngagement: "5.8%",
      selected: false,
      icon: "tiktok"
    },
    {
      id: "youtube",
      name: "YouTube Content",
      description: "Long-form videos on YouTube",
      avgEngagement: "3.1%",
      selected: false,
      icon: "youtube"
    },
    {
      id: "twitter",
      name: "Twitter/X Posts",
      description: "Text and image posts on Twitter/X",
      avgEngagement: "2.7%",
      selected: false,
      icon: "twitter"
    },
    {
      id: "appearances",
      name: "In-Person Appearances",
      description: "Live events and appearances",
      avgEngagement: "N/A (in-person)",
      selected: false,
      icon: "calendar"
    },
    {
      id: "livestreams",
      name: "Live Streams",
      description: "Live broadcasts across platforms",
      avgEngagement: "6.3%",
      selected: false,
      icon: "video"
    }
  ]);
  const [contentFrequency, setContentFrequency] = useState<string>("monthly");
  
  // State for Step 3 (Targeting & Preferences)
  const [location, setLocation] = useState<string>("");
  const [radius, setRadius] = useState<number>(50);
  const [locationType, setLocationType] = useState<string>("local");
  const [athletesInLocation, setAthletesInLocation] = useState<number>(73);
  const [sportCategories, setSportCategories] = useState<SportCategory[]>([
    // Team sports
    { id: "basketball", name: "Basketball", type: "team", selected: false, icon: "basketball" },
    { id: "football", name: "Football", type: "team", selected: false, icon: "football" },
    { id: "baseball", name: "Baseball", type: "team", selected: false, icon: "baseball" },
    { id: "hockey", name: "Hockey", type: "team", selected: false, icon: "hockey" },
    { id: "soccer", name: "Soccer", type: "team", selected: false, icon: "soccer" },
    { id: "volleyball", name: "Volleyball", type: "team", selected: false, icon: "volleyball" },
    // Individual sports
    { id: "tennis", name: "Tennis", type: "individual", selected: false, icon: "tennis" },
    { id: "golf", name: "Golf", type: "individual", selected: false, icon: "golf" },
    { id: "swimming", name: "Swimming", type: "individual", selected: false, icon: "swimming" },
    // Olympic sports
    { id: "gymnastics", name: "Gymnastics", type: "olympic", selected: false, icon: "gymnastics" },
    { id: "track", name: "Track & Field", type: "olympic", selected: false, icon: "running" },
    // Esports
    { id: "lol", name: "League of Legends", type: "esport", selected: false, icon: "gamepad" },
    { id: "fortnite", name: "Fortnite", type: "esport", selected: false, icon: "gamepad" },
    { id: "valorant", name: "Valorant", type: "esport", selected: false, icon: "gamepad" }
  ]);
  
  const [brandPersonality, setBrandPersonality] = useState<BrandPersonality[]>([
    { id: "professionalism", leftLabel: "Professional", rightLabel: "Casual", value: 50 },
    { id: "innovation", leftLabel: "Traditional", rightLabel: "Innovative", value: 50 },
    { id: "tone", leftLabel: "Serious", rightLabel: "Playful", value: 50 },
    { id: "exclusivity", leftLabel: "Exclusive", rightLabel: "Accessible", value: 50 }
  ]);
  
  const [brandValues, setBrandValues] = useState<string[]>([]);
  const availableBrandValues = [
    "Authenticity", "Sustainability", "Innovation", "Diversity", "Quality", 
    "Community", "Transparency", "Excellence", "Inclusivity", "Creativity"
  ];
  
  // State for Step 4 (Results Preview)
  const [athleteMatches, setAthleteMatches] = useState<AthletePreview[]>([
    {
      id: "1",
      partialName: "Jessica W.",
      image: "https://images.unsplash.com/photo-1539794830467-1f18503767a1?q=80&w=1974&auto=format&fit=crop",
      sport: "Volleyball",
      affiliation: "University of Michigan",
      matchPercentage: 87,
      followerCount: "45K",
      engagementRate: "7.2%"
    },
    {
      id: "2",
      partialName: "Michael T.",
      image: "https://images.unsplash.com/photo-1569517282132-25d22f4573e6?q=80&w=1974&auto=format&fit=crop",
      sport: "Basketball",
      affiliation: "Ohio State University",
      matchPercentage: 85,
      followerCount: "38K",
      engagementRate: "6.5%"
    },
    {
      id: "3",
      partialName: "Sarah L.",
      image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=1974&auto=format&fit=crop",
      sport: "Soccer",
      affiliation: "UCLA",
      matchPercentage: 82,
      followerCount: "56K",
      engagementRate: "5.9%"
    },
    {
      id: "4",
      partialName: "David R.",
      image: "https://images.unsplash.com/photo-1519766304817-3450282dfa3e?q=80&w=1974&auto=format&fit=crop",
      sport: "Track & Field",
      affiliation: "University of Oregon",
      matchPercentage: 79,
      followerCount: "29K",
      engagementRate: "8.1%"
    },
    {
      id: "5",
      partialName: "Emma C.",
      image: "https://images.unsplash.com/photo-1593164842264-854604db2260?q=80&w=1974&auto=format&fit=crop",
      sport: "Swimming",
      affiliation: "Stanford University",
      matchPercentage: 78,
      followerCount: "32K",
      engagementRate: "6.8%"
    },
    {
      id: "6",
      partialName: "James H.",
      image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=2000&auto=format&fit=crop",
      sport: "Baseball",
      affiliation: "University of Texas",
      matchPercentage: 76,
      followerCount: "41K",
      engagementRate: "5.3%"
    }
  ]);
  
  // Registration form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    businessName: "",
    fullName: "",
    industry: "",
    phone: "",
    acceptTerms: false
  });
  
  // Effects to simulate dynamic calculations
  useEffect(() => {
    // Update athletes in range based on budget
    setAthletesInRange(Math.floor(budget / 5 + 50));
    
    // Update potential reach based on budget and selected content types
    const selectedContentCount = contentTypes.filter(ct => ct.selected).length;
    const baseReach = budget * 30;
    const contentMultiplier = selectedContentCount > 0 ? selectedContentCount * 1.5 : 1;
    setPotentialReach(`${Math.floor(baseReach * contentMultiplier).toLocaleString()}+`);
  }, [budget, contentTypes]);
  
  // Handlers for Step 1 (Marketing Objectives)
  const handleObjectiveClick = (id: string) => {
    setMarketingObjectives(marketingObjectives.map(obj => 
      obj.id === id ? { ...obj, selected: !obj.selected } : obj
    ));
  };
  
  const handlePrimaryObjective = (id: string) => {
    setMarketingObjectives(marketingObjectives.map(obj => 
      obj.id === id ? { ...obj, isPrimary: true } : { ...obj, isPrimary: false }
    ));
  };
  
  const getSelectedObjectivesCount = () => {
    return marketingObjectives.filter(obj => obj.selected).length;
  };
  
  // Handlers for Step 2 (Budget & Deliverables)
  const handleBudgetChange = (value: number[]) => {
    setBudget(value[0]);
  };
  
  const handleContentTypeClick = (id: string) => {
    setContentTypes(contentTypes.map(ct => 
      ct.id === id ? { ...ct, selected: !ct.selected } : ct
    ));
  };
  
  // Handlers for Step 3 (Targeting & Preferences)
  const handleSportCategoryClick = (id: string) => {
    setSportCategories(sportCategories.map(sc => 
      sc.id === id ? { ...sc, selected: !sc.selected } : sc
    ));
  };
  
  const handleBrandPersonalityChange = (id: string, value: number[]) => {
    setBrandPersonality(brandPersonality.map(bp => 
      bp.id === id ? { ...bp, value: value[0] } : bp
    ));
  };
  
  const handleBrandValueToggle = (value: string) => {
    if (brandValues.includes(value)) {
      setBrandValues(brandValues.filter(v => v !== value));
    } else {
      setBrandValues([...brandValues, value]);
    }
  };
  
  // Handler for form inputs
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };
  
  // Navigation handlers
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      // Start processing animation
      setIsProcessing(true);
      simulateProcessing();
    }
  };
  
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Simulate AI processing animation
  const simulateProcessing = () => {
    const messages = [
      "AI analyzing 15,000+ athlete profiles...",
      "Calculating compatibility scores...",
      "Finding personality matches...",
      "Identifying optimal partnerships..."
    ];
    
    let step = 0;
    const interval = setInterval(() => {
      setProgressPercent(prev => Math.min(prev + 25, 100));
      setProcessingMessage(messages[step]);
      step += 1;
      
      if (step >= messages.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsProcessing(false);
          setShowRegistration(true);
        }, 1000);
      }
    }, 1200);
  };

  // Determine if continue button should be enabled
  const isContinueEnabled = () => {
    switch (currentStep) {
      case 1:
        return getSelectedObjectivesCount() > 0;
      case 2:
        return contentTypes.some(ct => ct.selected);
      case 3:
        return sportCategories.some(sc => sc.selected);
      default:
        return true;
    }
  };

  // Render main content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderMarketingObjectives();
      case 2:
        return renderBudgetDeliverables();
      case 3:
        return renderTargetingPreferences();
      default:
        return null;
    }
  };
  
  // Render for Step 1: Marketing Objectives
  const renderMarketingObjectives = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketingObjectives.map(objective => (
            <Card 
              key={objective.id}
              className={`cursor-pointer transition-all ${
                objective.selected 
                  ? 'border-primary border-2 shadow-md' 
                  : 'border hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => handleObjectiveClick(objective.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${
                    objective.selected ? 'bg-primary-100 text-primary' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {objective.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{objective.name}</h3>
                    <p className="text-sm text-gray-500">{objective.description}</p>
                  </div>
                </div>
                
                {objective.selected && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-primary-600">{objective.successMetric}</p>
                    
                    <div className="mt-3 flex items-center">
                      <Button 
                        variant={objective.isPrimary ? "default" : "outline"} 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrimaryObjective(objective.id);
                        }}
                      >
                        {objective.isPrimary ? "Primary Objective" : "Make Primary"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {getSelectedObjectivesCount() > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">
              <span className="font-semibold">{getSelectedObjectivesCount()}</span> objective{getSelectedObjectivesCount() !== 1 && 's'} selected
              {marketingObjectives.some(o => o.isPrimary) && ' with primary focus identified'}
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // Render for Step 2: Budget & Deliverables
  const renderBudgetDeliverables = () => {
    return (
      <div className="space-y-10">
        {/* Budget Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Marketing Budget</h3>
          
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary-700">
              ${budget.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="budget-toggle" className={`text-sm ${isMonthlyBudget ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                Monthly
              </Label>
              <Switch
                id="budget-toggle"
                checked={!isMonthlyBudget}
                onCheckedChange={() => setIsMonthlyBudget(!isMonthlyBudget)}
              />
              <Label htmlFor="budget-toggle" className={`text-sm ${!isMonthlyBudget ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                Campaign Total
              </Label>
            </div>
          </div>
          
          <div className="py-6">
            <Slider
              min={500}
              max={5000}
              step={100}
              value={[budget]}
              onValueChange={handleBudgetChange}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$500</span>
              <span>$1,000</span>
              <span>$2,500</span>
              <span>$5,000+</span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-blue-700 text-sm">
              <span className="font-semibold">{athletesInRange}</span> athletes available in this budget range
            </p>
          </div>
        </div>
        
        {/* Content Type Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Content Types</h3>
          <p className="text-sm text-gray-500">Select the types of content you want athletes to create</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {contentTypes.map(contentType => (
              <Card 
                key={contentType.id}
                className={`cursor-pointer transition-all ${
                  contentType.selected 
                    ? 'border-primary border-2 shadow-md' 
                    : 'border hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => handleContentTypeClick(contentType.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{contentType.name}</h4>
                    {contentType.selected && (
                      <Badge className="bg-primary text-white">Selected</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{contentType.description}</p>
                  <div className="text-xs text-gray-600">
                    Avg. Engagement: <span className="font-semibold">{contentType.avgEngagement}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Frequency Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Content Frequency</h3>
          
          <RadioGroup 
            value={contentFrequency} 
            onValueChange={setContentFrequency}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly">Weekly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="biweekly" id="biweekly" />
              <Label htmlFor="biweekly">Bi-Weekly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly">Monthly</Label>
            </div>
          </RadioGroup>
          
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <p className="text-gray-700">
              Your selected plan can reach approximately <span className="font-bold text-primary-600">{potentialReach}</span> potential customers
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Render for Step 3: Targeting & Preferences
  const renderTargetingPreferences = () => {
    return (
      <div className="space-y-10">
        {/* Geographic Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Geographic Targeting</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="location" className="text-sm font-medium mb-1 block">Location</Label>
              <Input 
                id="location" 
                placeholder="Enter city, state, or zip code" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mb-4"
              />
              
              <div className="bg-gray-100 h-40 rounded-lg flex items-center justify-center text-gray-500">
                Interactive map would display here
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="radius" className="text-sm font-medium mb-1 block">
                  Radius: {radius} miles
                </Label>
                <Slider
                  id="radius"
                  min={25}
                  max={100}
                  step={25}
                  value={[radius]}
                  onValueChange={(value) => setRadius(value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>25mi</span>
                  <span>50mi</span>
                  <span>75mi</span>
                  <span>100mi</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium block">Coverage</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={locationType === "local" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationType("local")}
                    className="w-full"
                  >
                    Local
                  </Button>
                  <Button 
                    variant={locationType === "regional" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationType("regional")}
                    className="w-full"
                  >
                    Regional
                  </Button>
                  <Button 
                    variant={locationType === "national" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocationType("national")}
                    className="w-full"
                  >
                    National
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-blue-700 text-sm">
                  <span className="font-semibold">{athletesInLocation}</span> athletes have significant following in your area
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sports Category Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sports Categories</h3>
          <p className="text-sm text-gray-500">Select the sports that align with your brand</p>
          
          <Tabs defaultValue="team" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="team">Team Sports</TabsTrigger>
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="olympic">Olympic</TabsTrigger>
              <TabsTrigger value="esport">Esports</TabsTrigger>
            </TabsList>
            
            <TabsContent value="team" className="mt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sportCategories
                  .filter(sport => sport.type === "team")
                  .map(sport => (
                    <Card 
                      key={sport.id}
                      className={`cursor-pointer transition-all ${
                        sport.selected 
                          ? 'border-primary border-2 shadow-md' 
                          : 'border hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => handleSportCategoryClick(sport.id)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="h-10 w-10 mx-auto mb-2 flex items-center justify-center">
                          {/* Placeholder for sport icon */}
                          <div className={`h-8 w-8 rounded-full ${sport.selected ? 'bg-primary-100' : 'bg-gray-100'} flex items-center justify-center`}>
                            <span className="text-xs">{sport.name.charAt(0)}</span>
                          </div>
                        </div>
                        <p className={`text-sm ${sport.selected ? 'font-medium text-primary-700' : 'text-gray-600'}`}>
                          {sport.name}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="individual" className="mt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sportCategories
                  .filter(sport => sport.type === "individual")
                  .map(sport => (
                    <Card 
                      key={sport.id}
                      className={`cursor-pointer transition-all ${
                        sport.selected 
                          ? 'border-primary border-2 shadow-md' 
                          : 'border hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => handleSportCategoryClick(sport.id)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="h-10 w-10 mx-auto mb-2 flex items-center justify-center">
                          {/* Placeholder for sport icon */}
                          <div className={`h-8 w-8 rounded-full ${sport.selected ? 'bg-primary-100' : 'bg-gray-100'} flex items-center justify-center`}>
                            <span className="text-xs">{sport.name.charAt(0)}</span>
                          </div>
                        </div>
                        <p className={`text-sm ${sport.selected ? 'font-medium text-primary-700' : 'text-gray-600'}`}>
                          {sport.name}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="olympic" className="mt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sportCategories
                  .filter(sport => sport.type === "olympic")
                  .map(sport => (
                    <Card 
                      key={sport.id}
                      className={`cursor-pointer transition-all ${
                        sport.selected 
                          ? 'border-primary border-2 shadow-md' 
                          : 'border hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => handleSportCategoryClick(sport.id)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="h-10 w-10 mx-auto mb-2 flex items-center justify-center">
                          {/* Placeholder for sport icon */}
                          <div className={`h-8 w-8 rounded-full ${sport.selected ? 'bg-primary-100' : 'bg-gray-100'} flex items-center justify-center`}>
                            <span className="text-xs">{sport.name.charAt(0)}</span>
                          </div>
                        </div>
                        <p className={`text-sm ${sport.selected ? 'font-medium text-primary-700' : 'text-gray-600'}`}>
                          {sport.name}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="esport" className="mt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sportCategories
                  .filter(sport => sport.type === "esport")
                  .map(sport => (
                    <Card 
                      key={sport.id}
                      className={`cursor-pointer transition-all ${
                        sport.selected 
                          ? 'border-primary border-2 shadow-md' 
                          : 'border hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => handleSportCategoryClick(sport.id)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="h-10 w-10 mx-auto mb-2 flex items-center justify-center">
                          {/* Placeholder for sport icon */}
                          <div className={`h-8 w-8 rounded-full ${sport.selected ? 'bg-primary-100' : 'bg-gray-100'} flex items-center justify-center`}>
                            <span className="text-xs">{sport.name.charAt(0)}</span>
                          </div>
                        </div>
                        <p className={`text-sm ${sport.selected ? 'font-medium text-primary-700' : 'text-gray-600'}`}>
                          {sport.name}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Brand Alignment Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Brand Alignment</h3>
          <p className="text-sm text-gray-500">Help us understand your brand personality</p>
          
          <div className="space-y-6">
            {brandPersonality.map(personality => (
              <div key={personality.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{personality.leftLabel}</span>
                  <span className="text-gray-600">{personality.rightLabel}</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[personality.value]}
                  onValueChange={(value) => handleBrandPersonalityChange(personality.id, value)}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-medium">Brand Values (select up to 5)</h4>
            <div className="flex flex-wrap gap-2">
              {availableBrandValues.map(value => (
                <Badge
                  key={value}
                  variant={brandValues.includes(value) ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1 px-3"
                  onClick={() => handleBrandValueToggle(value)}
                >
                  {value}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-blue-700">
            <span className="font-semibold">2,483</span> businesses found their perfect athlete matches
          </p>
        </div>
      </div>
    );
  };
  
  // Render for Processing Animation
  const renderProcessingAnimation = () => {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#001d3d] to-[#003566] flex items-center justify-center z-50">
        <div className="max-w-md w-full mx-auto text-center px-4">
          <img 
            src="/contested-logo.svg" 
            alt="Contested" 
            className="w-24 h-24 mx-auto mb-8"
          />
          
          <h2 className="text-2xl font-bold text-white mb-4">Finding Your Perfect Matches</h2>
          <p className="text-blue-200 mb-6">{processingMessage}</p>
          
          <Progress value={progressPercent} className="h-2 mb-2" />
          
          <p className="text-xs text-blue-300 mt-1">{progressPercent}% complete</p>
        </div>
      </div>
    );
  };
  
  // Render for Results Preview & Registration
  const renderResultsPreview = () => {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
              We've Found Your Ideal Athlete Matches
            </span>
          </h1>
          <p className="text-lg text-gray-600">
            Create your free account to see full profiles and connect
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Results Preview */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {athleteMatches.map(athlete => (
                <Card key={athlete.id} className="overflow-hidden transition-all hover:shadow-md cursor-pointer">
                  <div className="aspect-video relative">
                    <img 
                      src={athlete.image}
                      alt={athlete.partialName} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={`${
                        athlete.matchPercentage >= 85 ? 'bg-green-500' : 
                        athlete.matchPercentage >= 75 ? 'bg-blue-500' : 'bg-amber-500'
                      } text-white`}>
                        {athlete.matchPercentage}% Match
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold">{athlete.partialName}</h3>
                        <p className="text-sm text-gray-600">{athlete.sport}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{athlete.followerCount}</div>
                        <div className="text-xs text-gray-500">followers</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{athlete.affiliation}</span>
                      <span className="text-xs text-gray-500">{athlete.engagementRate} engagement</span>
                    </div>
                    
                    <div className="mt-4 pt-2 border-t border-gray-100 relative">
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Full profile details</span>
                        <span>Contact info</span>
                      </div>
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center">
                        <Button size="sm" variant="ghost" className="text-primary">
                          Create account to view
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="text-amber-500 mr-3">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-amber-800">Your matches are reserved for 24 hours</h3>
                  <p className="text-sm text-amber-700">
                    23 more athletes match your criteria. Top match has 45K followers with 7.2% engagement rate.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Registration Form */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">Create Your Free Account</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Business Email</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email" 
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      placeholder="your@business.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <Input 
                      id="password" 
                      name="password"
                      type="password" 
                      value={formData.password}
                      onChange={handleFormChange}
                      required
                      placeholder="Create a secure password"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="businessName" className="text-sm font-medium">Business Name</Label>
                    <Input 
                      id="businessName" 
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleFormChange}
                      required
                      placeholder="Your company name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                    <Input 
                      id="fullName" 
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      required
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industry" className="text-sm font-medium">Industry (Optional)</Label>
                      <Input 
                        id="industry" 
                        name="industry"
                        value={formData.industry}
                        onChange={handleFormChange}
                        placeholder="e.g. Retail"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium">Phone (Optional)</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder="(123) 456-7890"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="terms" 
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => 
                        setFormData({...formData, acceptTerms: checked as boolean})
                      }
                    />
                    <Label htmlFor="terms" className="text-xs text-gray-600">
                      I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                    </Label>
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  <Button className="w-full bg-gradient-to-r from-primary-600 to-primary-500">
                    Create Account & View Full Profiles
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" size="sm">
                      Google
                    </Button>
                    <Button variant="outline" size="sm">
                      LinkedIn
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="h-5 w-5 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                    <span className="text-sm text-gray-600 font-medium">Your data is secure</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Free to explore, no commitment required. <br />
                    2,500+ businesses joined last month.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
      </div>
    );
  };

  // Main render
  return (
    <div className="min-h-screen bg-white">
      {isProcessing && renderProcessingAnimation()}
      
      {showRegistration ? (
        renderResultsPreview()
      ) : (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header with progress indicator */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500 font-medium">
                  Step {currentStep} of 3
                </p>
                <div className="flex space-x-1 w-32">
                  {[1, 2, 3].map(step => (
                    <div 
                      key={step}
                      className={`h-1 rounded-full flex-1 ${
                        step <= currentStep ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold">
                {currentStep === 1 && "Which of these game-changing results would most transform your business right now?"}
                {currentStep === 2 && "Let's find athletes that match your marketing budget and content needs."}
                {currentStep === 3 && "Help us match you with the right athletes"}
              </h1>
              
              {currentStep === 2 && (
                <p className="text-gray-600 mt-2">
                  We'll show you options that deliver maximum value within your range
                </p>
              )}
              
              {currentStep === 3 && (
                <p className="text-gray-600 mt-2">
                  Fine-tune your preferences for your perfect brand ambassadors
                </p>
              )}
            </div>
            
            {/* Main content */}
            <div className="mb-8">
              {renderStepContent()}
            </div>
            
            {/* Footer with navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
              {currentStep > 1 ? (
                <Button 
                  variant="outline" 
                  onClick={handlePrevStep}
                >
                  Back
                </Button>
              ) : (
                <div>
                  <Button variant="link" className="text-gray-500">
                    Skip for now
                  </Button>
                </div>
              )}
              
              <Button 
                onClick={handleNextStep}
                disabled={!isContinueEnabled()}
                className={`
                  ${currentStep < 3 ? '' : 'bg-gradient-to-r from-primary-600 to-primary-500'}
                `}
              >
                {currentStep < 3 ? 'Continue' : 'Generate Matches'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreRegistrationWizard;