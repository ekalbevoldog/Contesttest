import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Avatar,
  AvatarFallback,
  AvatarImage 
} from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  BarChart3, 
  LineChart, 
  Users, 
  TrendingUp, 
  Wallet, 
  ClipboardList, 
  CreditCard, 
  Building2, 
  Settings, 
  Bell, 
  MessageSquare,
  Plus,
  BarChart4,
  DollarSign,
  Target,
  Megaphone,
  PieChart,
  ArrowUpRight,
  ShoppingBag,
  Eye,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  Legend,
  PieChart as RechartsPieChart,
  Pie
} from "recharts";

export default function BusinessDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Define profile data type
  type ProfileData = {
    id?: number;
    name?: string;
    productType?: string;
    audienceGoals?: string;
    values?: string;
    email?: string;
    industry?: string;
    businessType?: string;
    companySize?: string;
    preferencesJson?: string;
  };
  
  // Get profile info using our enhanced auth context
  const { user, profile: authProfile, userType, hasProfile, isLoading: isLoadingAuth } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileSource, setProfileSource] = useState<string>('unknown');
  
  // Helper function to fetch business profile
  const fetchBusinessProfile = (userId: string) => {
    console.log(`Fetching business profile for user ${userId}`);
    
    // Try both endpoints, starting with the direct one
    console.log(`First trying direct endpoint: /api/business-profile/${userId}`);
    
    // Add a timestamp to avoid caching issues
    const directUrl = `/api/business-profile/${userId}?t=${new Date().getTime()}`;
    console.log(`Full direct URL with cache busting: ${directUrl}`);
    
    fetch(directUrl)
      .then(res => {
        if (!res.ok) {
          console.log(`Direct endpoint failed with status ${res.status}, falling back to Supabase endpoint`);
          throw new Error('Direct endpoint failed');
        }
        return res.json();
      })
      .then(data => {
        console.log('Successfully fetched business profile from direct endpoint:', data);
        
        // The profile might be directly in data or nested in a profile property
        const profileData = data?.profile || data;
        
        if (profileData) {
          console.log('Processing profile data with keys:', Object.keys(profileData));
          setProfileSource('direct_api');
          
          const profile: ProfileData = {
            // Handle ID which could be a string UUID or number
            id: typeof profileData.id === 'number' 
                ? profileData.id 
                : profileData.id 
                  ? parseInt(profileData.id as string, 10) || undefined
                  : undefined,
                  
            // Handle all the field names with both camelCase and snake_case variants
            name: profileData.name || profileData.business_name || '',
            email: profileData.email || user?.email || '',
            
            // Industry field
            industry: profileData.industry || '',
            
            // Business type field
            businessType: profileData.businessType || profileData.business_type || '',
            
            // Company size field
            companySize: profileData.companySize || profileData.company_size || '',
            
            // Product type field
            productType: profileData.productType || profileData.product_type || '',
            
            // Audience goals field
            audienceGoals: profileData.audienceGoals || profileData.audience_goals || '',
            
            // Values field
            values: profileData.values || '',
            
            // Preferences
            preferencesJson: profileData.preferences || profileData.preferencesJson || ''
          };
          
          console.log('Mapped profile data:', profile);
          setProfileData(profile);
          
          // Store in localStorage for next time
          localStorage.setItem('contestedUserData', JSON.stringify(profile));
          setIsLoadingProfile(false);
          setLoading(false);
        } else {
          console.log('No valid profile data found in response, falling back to Supabase endpoint');
          throw new Error('No valid profile data');
        }
      })
      .catch(err => {
        // Fall back to the original Supabase endpoint
        console.log(`Falling back to Supabase endpoint: /api/supabase/business-profile/${userId}`);
        const fallbackUrl = `/api/supabase/business-profile/${userId}?t=${new Date().getTime()}`;
        
        fetch(fallbackUrl)
          .then(res => {
            console.log('Response status:', res.status);
            console.log('Response headers:', JSON.stringify([...res.headers.entries()]));
            
            if (!res.ok) {
              throw new Error(`Failed to fetch business profile: ${res.status} ${res.statusText}`);
            }
            return res.json();
          })
          .then(data => {
            console.log('Successfully fetched business profile:', data);
            
            // The profile might be directly in data or nested in a profile property
            const profileData = data?.profile || data;
            
            if (profileData) {
              console.log('Processing profile data with keys:', Object.keys(profileData));
              setProfileSource('api_fetch');
              
              const profile: ProfileData = {
                // Handle ID which could be a string UUID or number
                id: typeof profileData.id === 'number' 
                    ? profileData.id 
                    : profileData.id 
                      ? parseInt(profileData.id as string, 10) || undefined
                      : undefined,
                      
                // Handle all the field names with both camelCase and snake_case variants
                name: profileData.name || profileData.business_name || '',
                email: profileData.email || user?.email || '',
                
                // Industry field
                industry: profileData.industry || '',
                
                // Business type field
                businessType: profileData.businessType || profileData.business_type || '',
                
                // Company size field
                companySize: profileData.companySize || profileData.company_size || '',
                
                // Product type field
                productType: profileData.productType || profileData.product_type || '',
                
                // Audience goals field
                audienceGoals: profileData.audienceGoals || profileData.audience_goals || '',
                
                // Values field
                values: profileData.values || '',
                
                // Preferences
                preferencesJson: profileData.preferences || profileData.preferencesJson || ''
              };
              
              console.log('Mapped profile data:', profile);
              setProfileData(profile);
              
              // Store in localStorage for next time
              localStorage.setItem('contestedUserData', JSON.stringify(profile));
            } else {
              console.log('No valid profile data found in response');
              
              // Create a minimal profile with user email
              const minimalProfile: ProfileData = {
                email: user?.email || '',
                name: 'Business Account'
              };
              
              setProfileData(minimalProfile);
            }
            setIsLoadingProfile(false);
            setLoading(false);
          })
          .catch(err => {
            console.error('Error fetching business profile:', err);
            
            // Set a default profile with basic user info if we at least have the user
            if (user) {
              const defaultProfile: ProfileData = {
                name: user.fullName || '',
                email: user.email || ''
              };
              setProfileData(defaultProfile);
            }
            
            setIsLoadingProfile(false);
            setLoading(false);
            
            // Show a toast with the error
            toast({
              title: "Profile Error",
              description: "We're having trouble loading your profile. Some features may be limited.",
              variant: "destructive"
            });
          });
      });
  };
  
  useEffect(() => {
    console.log("========== Business Dashboard useEffect executing ==========");
    
    // If we're still loading the auth state, wait
    if (isLoadingAuth) {
      console.log("Auth still loading, waiting for completion...");
      return;
    }
    
    console.log('BusinessDashboard DETAILED AUTH STATE:', { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email,
      userType,
      hasProfile,
      role: user?.role || user?.userType,
      effectiveRole: userType || user?.role || user?.userType,
      hasAuthProfile: !!authProfile,
      authProfileId: authProfile?.id,
      profileDataIsLoading: isLoadingProfile
    });
    
    // Check if user is authenticated
    if (!user) {
      console.error('CRITICAL: No authenticated user found, redirecting to login');
      setIsLoadingProfile(false);
      setLoading(false);
      
      toast({
        title: "Authentication Required",
        description: "Please log in to view your dashboard",
        variant: "destructive"
      });
      
      navigate("/auth");
      return;
    }
    
    console.log("User details:", {
      id: user.id,
      email: user.email,
      role: user.role,
      metadata: user.user_metadata
    });
    
    // Verify this is a business user
    const effectiveRole = userType || user.role || user.userType;
    if (effectiveRole !== 'business') {
      console.error(`ROLE MISMATCH: User has role ${effectiveRole}, not business. Redirecting to appropriate dashboard`);
      setIsLoadingProfile(false);
      setLoading(false);
      
      // Redirect based on role
      if (effectiveRole === 'athlete') {
        navigate('/athlete/dashboard');
      } else if (effectiveRole === 'compliance') {
        navigate('/compliance/dashboard');
      } else if (effectiveRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
      return;
    }
    
    console.log("Confirmed business role. Checking for profile...");
    console.log("Profile state:", { hasProfile, authProfile });
    
    // Check if profile data is directly embedded in the user object
    if (user.profile) {
      console.log('FOUND PROFILE DIRECTLY IN USER OBJECT:', user.profile);
      console.log('User profile has keys:', Object.keys(user.profile));
      setProfileSource('user.profile');
      
      const profileFromUser: ProfileData = {
        // Handle ID which could be a string UUID or number
        id: typeof user.profile.id === 'number' 
            ? user.profile.id 
            : user.profile.id 
              ? parseInt(user.profile.id as string, 10) || undefined
              : undefined,
              
        // Handle all the field names with both camelCase and snake_case variants
        name: user.profile.name || user.profile.business_name || '',
        email: user.profile.email || user?.email || '',
        
        // Industry field
        industry: user.profile.industry || '',
        
        // Business type field
        businessType: user.profile.businessType || user.profile.business_type || '',
        
        // Company size field
        companySize: user.profile.companySize || user.profile.company_size || '',
        
        // Product type field
        productType: user.profile.productType || user.profile.product_type || '',
        
        // Values field
        values: user.profile.values || '',
        
        // Preferences
        preferencesJson: user.profile.preferences || user.profile.preferencesJson || ''
      };
      
      console.log('Mapped user.profile data:', profileFromUser);
      setProfileData(profileFromUser);
      setIsLoadingProfile(false);
      setLoading(false);
      return;
    }
    
    // Second priority: use profile from auth context
    if (authProfile) {
      console.log('Using profile data from auth context:', authProfile);
      console.log('Auth profile has keys:', Object.keys(authProfile));
      setProfileSource('authProfile');
      
      const profileToUse: ProfileData = {
        // Handle ID which could be a string UUID or number
        id: typeof authProfile.id === 'number' 
            ? authProfile.id 
            : authProfile.id 
              ? parseInt(authProfile.id as string, 10) || undefined
              : undefined,
              
        // Handle all the field names with both camelCase and snake_case variants
        name: authProfile.name || authProfile.business_name || '',
        email: authProfile.email || user?.email || '',
        
        // Industry field
        industry: authProfile.industry || '',
        
        // Business type field
        businessType: authProfile.businessType || authProfile.business_type || '',
        
        // Company size field
        companySize: authProfile.companySize || authProfile.company_size || '',
        
        // Product type field
        productType: authProfile.productType || authProfile.product_type || '',
        
        // Audience goals field
        audienceGoals: authProfile.audienceGoals || authProfile.audience_goals || '',
        
        // Values field
        values: authProfile.values || '',
        
        // Preferences
        preferencesJson: authProfile.preferences || authProfile.preferencesJson || ''
      };
      
      console.log('Mapped auth profile data:', profileToUse);
      setProfileData(profileToUse);
      setIsLoadingProfile(false);
      setLoading(false);
      return;
    }
    
    // If user doesn't have a profile yet, try to create one
    if (!hasProfile) {
      console.log('Business user without profile, attempting to create one');
      
      // First attempt to create a profile
      fetch('/api/create-business-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to create business profile');
        }
        return res.json();
      })
      .then(data => {
        console.log('Successfully created business profile:', data);
        
        // The profile might be directly in data or nested in a profile property
        const profileData = data?.profile || data;
        
        if (profileData) {
          console.log('Processing created profile data with keys:', Object.keys(profileData));
          
          const profile: ProfileData = {
            // Handle ID which could be a string UUID or number
            id: typeof profileData.id === 'number' 
                ? profileData.id 
                : profileData.id 
                  ? parseInt(profileData.id as string, 10) || undefined
                  : undefined,
                  
            // Handle all the field names with both camelCase and snake_case variants
            name: profileData.name || profileData.business_name || '',
            email: profileData.email || user?.email || '',
            
            // Industry field
            industry: profileData.industry || '',
            
            // Business type field
            businessType: profileData.businessType || profileData.business_type || '',
            
            // Company size field
            companySize: profileData.companySize || profileData.company_size || '',
            
            // Product type field
            productType: profileData.productType || profileData.product_type || '',
            
            // Audience goals field
            audienceGoals: profileData.audienceGoals || profileData.audience_goals || '',
            
            // Values field
            values: profileData.values || '',
            
            // Preferences
            preferencesJson: profileData.preferences || profileData.preferencesJson || ''
          };
          
          console.log('Mapped created profile data:', profile);
          setProfileData(profile);
          
          // Store in localStorage for next time
          localStorage.setItem('contestedUserData', JSON.stringify(profile));
        } else {
          console.log('No valid profile data found in response');
          setProfileData({
            email: user?.email || '',
            name: 'Business Account'
          });
        }
        setIsLoadingProfile(false);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error creating business profile, falling back to fetch:', err);
        
        // Fall back to fetching profile directly
        fetchBusinessProfile(user.id);
      });
      
      return;
    }
    
    // If we have user but couldn't get profile from auth context, fetch it directly
    fetchBusinessProfile(user.id);
    
  }, [user, authProfile, userType, hasProfile, isLoadingAuth, navigate, toast]);
  
  // Sample data for charts
  const campaignData = [
    { month: 'Jan', impressions: 4000, engagement: 2400, conversion: 1200 },
    { month: 'Feb', impressions: 5000, engagement: 2800, conversion: 1500 },
    { month: 'Mar', impressions: 6000, engagement: 3200, conversion: 1800 },
    { month: 'Apr', impressions: 7000, engagement: 4000, conversion: 2100 },
    { month: 'May', impressions: 8000, engagement: 4800, conversion: 2400 },
    { month: 'Jun', impressions: 9000, engagement: 6000, conversion: 2800 },
  ];

  const audienceData = [
    { age: '18-24', male: 30, female: 40, other: 10 },
    { age: '25-34', male: 60, female: 70, other: 15 },
    { age: '35-44', male: 40, female: 50, other: 10 },
    { age: '45-54', male: 25, female: 30, other: 5 },
    { age: '55+', male: 15, female: 20, other: 5 },
  ];

  const spendingData = [
    { name: 'Content Creation', value: 40 },
    { name: 'Platform Fees', value: 15 },
    { name: 'Athlete Payments', value: 35 },
    { name: 'Analytics Tools', value: 10 },
  ];

  const COLORS = ['#FF8042', '#FFBB28', '#00C49F', '#0088FE'];

  if (loading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFBF0D]"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-24 max-w-7xl">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white font-heading">DASHBOARD</h1>
              <p className="text-gray-300 mt-1">Manage your campaigns, athlete partnerships, and ROI</p>
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mt-1">
                  Profile source: {profileSource} | ID: {profileData?.id}
                </div>
              )}
            </div>
            
            {/* Dashboard Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-black font-medium"
              >
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
              
              <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border border-zinc-700 bg-black/40 hover:bg-zinc-900/80 backdrop-blur-sm">
                    <Bell className="h-4 w-4 text-gray-300" />
                    <Badge className="bg-red-500 hover:bg-red-600">2</Badge>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Notifications</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Notification content would go here</p>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border border-zinc-700 bg-black/40 hover:bg-zinc-900/80 backdrop-blur-sm">
                    <MessageSquare className="h-4 w-4 text-gray-300" />
                    <Badge className="bg-red-500 hover:bg-red-600">3</Badge>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Messages</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Message content would go here</p>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 border border-zinc-700 bg-black/40 hover:bg-zinc-900/80 backdrop-blur-sm">
                    <Settings className="h-4 w-4 text-gray-300" />
                    <span className="text-gray-300">Settings</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Settings content would go here</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Dashboard Content */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Welcome Card */}
            <Card className="col-span-full bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-white font-heading">Welcome, {user?.email ? user.email.split('@')[0] : profileData?.name || 'Business Partner'}</CardTitle>
                <CardDescription className="text-gray-400">
                  Your business dashboard provides tools to manage athlete partnerships.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center p-4 border border-zinc-800 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 group">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center mr-4 group-hover:from-amber-500/30 group-hover:to-red-500/30 transition-all duration-300">
                      <BarChart3 className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Active Campaigns</p>
                      <p className="text-2xl font-bold text-white">3</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 border border-zinc-800 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 group">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center mr-4 group-hover:from-amber-500/30 group-hover:to-red-500/30 transition-all duration-300">
                      <Users className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Active Athletes</p>
                      <p className="text-2xl font-bold text-white">5</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 border border-zinc-800 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 group">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center mr-4 group-hover:from-amber-500/30 group-hover:to-red-500/30 transition-all duration-300">
                      <TrendingUp className="h-6 w-6 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Engagement</p>
                      <p className="text-2xl font-bold text-white">23.4K</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Campaign Performance Chart */}
            <Card className="md:col-span-8 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-heading">Campaign Performance</CardTitle>
                  <Button variant="outline" size="sm" className="h-8 border border-zinc-700 bg-black/40 hover:bg-zinc-900/80 backdrop-blur-sm text-gray-300">
                    <ChevronRight className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                </div>
                <CardDescription className="text-gray-400">Monitor your campaign metrics over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={campaignData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFBF0D" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FFBF0D" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF5E3A" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FF5E3A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444', color: 'white' }} />
                    <Legend />
                    <Area type="monotone" dataKey="impressions" stroke="#FFBF0D" fillOpacity={1} fill="url(#impressionsGradient)" />
                    <Area type="monotone" dataKey="engagement" stroke="#FF5E3A" fillOpacity={1} fill="url(#engagementGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Budget Allocation Chart */}
            <Card className="md:col-span-4 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white font-heading">Budget Allocation</CardTitle>
                <CardDescription className="text-gray-400">Campaign spending breakdown</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label
                    >
                      {spendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444', color: 'white' }} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Audience Demographics Chart */}
            <Card className="md:col-span-6 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-white font-heading">Audience Demographics</CardTitle>
                <CardDescription className="text-gray-400">Age and gender distribution of your audience</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={audienceData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="age" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444', color: 'white' }} />
                    <Legend />
                    <Bar dataKey="male" stackId="a" fill="#FFBF0D" />
                    <Bar dataKey="female" stackId="a" fill="#FF5E3A" />
                    <Bar dataKey="other" stackId="a" fill="#8884D8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Recent Campaigns */}
            <Card className="md:col-span-6 bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white font-heading">Recent Campaigns</CardTitle>
                  <Button variant="outline" size="sm" className="h-8 border border-zinc-700 bg-black/40 hover:bg-zinc-900/80 backdrop-blur-sm text-gray-300">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "Summer Collection Launch",
                      status: "Active",
                      athlete: "Marcus Johnson",
                      reach: "12.5K",
                      engagement: "3.2K",
                      icon: <ShoppingBag className="h-5 w-5 text-amber-500" />
                    },
                    {
                      name: "Brand Awareness Q2",
                      status: "Active",
                      athlete: "Sarah Williams",
                      reach: "8.7K",
                      engagement: "2.1K",
                      icon: <Megaphone className="h-5 w-5 text-amber-500" />
                    },
                    {
                      name: "Product Promotion",
                      status: "Scheduled",
                      athlete: "Jason Blake",
                      reach: "—",
                      engagement: "—",
                      icon: <Eye className="h-5 w-5 text-amber-500" />
                    }
                  ].map((campaign, i) => (
                    <div key={i} className="flex items-center p-3 border border-zinc-800 rounded-lg bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 group">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center mr-4 group-hover:from-amber-500/30 group-hover:to-red-500/30 transition-all duration-300">
                        {campaign.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">{campaign.name}</h4>
                            <p className="text-sm text-gray-400">with {campaign.athlete}</p>
                          </div>
                          <Badge className={
                            campaign.status === "Active" 
                              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                              : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                          }>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="flex mt-2 space-x-4 text-sm">
                          <span className="text-gray-400">Reach: <span className="text-white font-medium">{campaign.reach}</span></span>
                          <span className="text-gray-400">Engagement: <span className="text-white font-medium">{campaign.engagement}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t border-zinc-800 mt-2 flex justify-center">
                <Button variant="link" className="text-amber-500 hover:text-amber-400">
                  Create new campaign
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}