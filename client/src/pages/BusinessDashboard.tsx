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
  
  if (loading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0066cc]"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Business Dashboard</h1>
            <p className="text-gray-800 mt-1">Manage your campaigns, athlete partnerships, and ROI</p>
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-slate-500 mt-1">
                Profile source: {profileSource} | ID: {profileData?.id}
              </div>
            )}
          </div>
          
          {/* Dashboard Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
            
            <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Badge className="bg-[#ff3366] hover:bg-[#e62e5c]">2</Badge>
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <Badge className="bg-[#ff3366] hover:bg-[#e62e5c]">3</Badge>
                </Button>
              </DialogTrigger>
              <DialogContent>
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
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-full">
            <CardHeader className="pb-2">
              <CardTitle>Welcome, {profileData?.name || 'Business Partner'}</CardTitle>
              <CardDescription>
                Your business dashboard provides tools to manage athlete partnerships.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center p-4 border rounded-lg bg-muted/50">
                  <BarChart3 className="h-10 w-10 text-[#0066cc] mr-4" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Campaigns</p>
                    <p className="text-2xl font-bold">3</p>
                  </div>
                </div>
                <div className="flex items-center p-4 border rounded-lg bg-muted/50">
                  <Users className="h-10 w-10 text-[#0066cc] mr-4" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Athletes</p>
                    <p className="text-2xl font-bold">5</p>
                  </div>
                </div>
                <div className="flex items-center p-4 border rounded-lg bg-muted/50">
                  <TrendingUp className="h-10 w-10 text-[#0066cc] mr-4" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Engagement</p>
                    <p className="text-2xl font-bold">23.4K</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}