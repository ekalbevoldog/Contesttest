import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Megaphone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BusinessDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Set loading state to false - authentication is handled by the protected route
  useEffect(() => {
    setLoading(false);
  }, []);
  
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
    
    // First priority: use profile from auth context if available
    if (authProfile) {
      console.log('Using profile data from auth context:', authProfile);
      
      const profileToUse: ProfileData = {
        id: typeof authProfile.id === 'number' ? authProfile.id : 
            authProfile.id ? parseInt(authProfile.id as string, 10) : undefined,
        name: authProfile.name || authProfile.business_name || '',
        productType: authProfile.productType || authProfile.product_type || '',
        audienceGoals: authProfile.audienceGoals || authProfile.audience_goals || '',
        values: authProfile.values || '',
        email: authProfile.email || user?.email || '',
        industry: authProfile.industry || '',
        businessType: authProfile.businessType || authProfile.business_type || '',
        companySize: authProfile.companySize || authProfile.company_size || '',
        preferencesJson: authProfile.preferences || authProfile.preferencesJson || ''
      };
      
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
        if (data?.profile) {
          const profile: ProfileData = {
            id: data.profile.id,
            name: data.profile.name || '',
            industry: data.profile.industry || '',
            businessType: data.profile.business_type || '',
            companySize: data.profile.company_size || '',
            email: data.profile.email || '',
            preferencesJson: data.profile.preferences || ''
          };
          setProfileData(profile);
          
          // Store in localStorage for next time
          localStorage.setItem('contestedUserData', JSON.stringify(profile));
        } else {
          setProfileData(data);
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
  
  // Helper function to fetch business profile
  const fetchBusinessProfile = (userId: string) => {
    console.log(`Fetching business profile for user ${userId}`);
    console.log(`Request URL: /api/supabase/business-profile/${userId}`);
    
    // Add a timestamp to avoid caching issues
    const url = `/api/supabase/business-profile/${userId}?t=${new Date().getTime()}`;
    console.log(`Full URL with cache busting: ${url}`);
    
    fetch(url)
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
        if (data?.profile) {
          // Important: business_profiles does not have an id field,
          // it uses user_id as its primary key
          const profile: ProfileData = {
            // Use user_id as the id since there's no separate id field
            id: parseInt(data.profile.user_id) || undefined,
            name: data.profile.name || '',
            industry: data.profile.industry || '',
            businessType: data.profile.business_type || '',
            companySize: data.profile.company_size || '',
            email: data.profile.email || '',
            preferencesJson: data.profile.preferences || '',
            // Include other fields to ensure display
            audienceGoals: data.profile.audience_goals || '',
            productType: data.profile.product_type || '',
            values: data.profile.values || ''
          };
          console.log('Setting profile data:', profile);
          setProfileData(profile);
          
          // Store in localStorage for next time
          localStorage.setItem('contestedUserData', JSON.stringify(profile));
          
          // Broadcast profile was successfully loaded
          if (window.parent) {
            try {
              window.parent.postMessage({ type: 'PROFILE_LOADED', profileType: 'business' }, '*');
            } catch (e) {
              console.error('Error posting profile message:', e);
            }
          }
        } else {
          console.log('No profile property in data, using data directly:', data);
          setProfileData(data);
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
        
        // Try one more time to auto-create the profile
        fetch('/api/create-business-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId: user?.id })
        })
        .then(res => {
          if (res.ok) {
            console.log('Auto-recovery successful. Profile created.');
            setTimeout(() => {
              // Reload the page after a short delay
              window.location.reload();
            }, 1500);
          }
        })
        .catch(() => {
          console.error('Auto-recovery failed.');
        });
      });
  };
  
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
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Badge className="bg-[#ff3366] hover:bg-[#e62e5c]">2</Badge>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                  <DialogDescription>
                    Your latest notifications and updates
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4 mt-2">
                    {[
                      {
                        title: "Campaign Match",
                        message: "New athlete match for 'Summer Product Launch' campaign",
                        time: "10 minutes ago",
                        unread: true
                      },
                      {
                        title: "Content Approval",
                        message: "Sarah J. submitted a new content piece for your review",
                        time: "2 hours ago",
                        unread: true
                      },
                      {
                        title: "System Update",
                        message: "Contested platform has been updated with new features",
                        time: "Yesterday",
                        unread: false
                      },
                      {
                        title: "Campaign Performance",
                        message: "Your 'Back-to-School' campaign is performing above average",
                        time: "2 days ago",
                        unread: false
                      }
                    ].map((notification, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${notification.unread ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-xs text-gray-800">{notification.time}</div>
                        </div>
                        <div className="text-sm mt-1">{notification.message}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm">Mark All Read</Button>
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
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Messages</DialogTitle>
                  <DialogDescription>
                    Your conversations with athletes and the Contested team
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4 mt-2">
                    {[
                      {
                        name: "Sarah J.",
                        message: "Can you provide more details about the content requirements?",
                        time: "5 minutes ago",
                        unread: true,
                        avatar: "SJ"
                      },
                      {
                        name: "Marcus T.",
                        message: "Thanks for approving the content! When should I post it?",
                        time: "30 minutes ago",
                        unread: true,
                        avatar: "MT"
                      },
                      {
                        name: "Emily R.",
                        message: "Just sent over the metrics from our last collaboration",
                        time: "1 hour ago",
                        unread: true,
                        avatar: "ER"
                      },
                      {
                        name: "Contested Support",
                        message: "Here are some tips to improve your campaign performance",
                        time: "Yesterday",
                        unread: false,
                        avatar: "CS"
                      }
                    ].map((message, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${message.unread ? 'bg-blue-50' : 'bg-gray-50'}`}>
                        <div className="flex gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-gradient-to-r from-[#0066cc] to-[#00a3ff] text-white">
                              {message.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div className="font-medium">{message.name}</div>
                              <div className="text-xs text-gray-800">{message.time}</div>
                            </div>
                            <div className="text-sm mt-1">{message.message}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" className="mr-2">View All</Button>
                  <Button size="sm" className="bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]">New Message</Button>
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
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Account Settings</DialogTitle>
                  <DialogDescription>
                    Manage your account preferences and settings
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Tabs defaultValue="account" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="account">Account</TabsTrigger>
                      <TabsTrigger value="notifications">Notifications</TabsTrigger>
                      <TabsTrigger value="billing">Billing</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account" className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Profile Information</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Business Name</span>
                            <span className="font-medium">{profileData?.name || "Your Business"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Email</span>
                            <span className="font-medium">{profileData?.email || "email@example.com"}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Account Type</span>
                            <Badge className="bg-[#0066cc]">Business Pro</Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-4">
                          Edit Profile
                        </Button>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-2">Password & Security</h4>
                        <Button variant="outline" size="sm" className="w-full">
                          Change Password
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="notifications" className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Email Notifications</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">New matches</span>
                            <Button variant="outline" size="sm">
                              On
                            </Button>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Content approval requests</span>
                            <Button variant="outline" size="sm">
                              On
                            </Button>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Campaign updates</span>
                            <Button variant="outline" size="sm">
                              On
                            </Button>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Platform announcements</span>
                            <Button variant="outline" size="sm">
                              Off
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="billing" className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Current Plan</h4>
                        <div className="p-3 rounded-lg bg-blue-50">
                          <div className="font-medium">Business Pro</div>
                          <div className="text-sm text-gray-700 mt-1">$199/month, billed annually</div>
                          <div className="flex items-center mt-3">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
                            <span className="text-xs text-gray-700 ml-2">Renews on October 15, 2023</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm" className="flex-1">
                            Change Plan
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Billing History
                          </Button>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium mb-2">Payment Method</h4>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="font-medium">Visa ending in 4242</div>
                              <div className="text-xs text-gray-700">Expires 12/25</div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                <DialogClose asChild>
                  <Button variant="outline" className="w-full">Done</Button>
                </DialogClose>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-[#e0f2ff]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Active Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">3</div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Running</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#e0f2ff]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Athlete Partnerships</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">8</div>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Active</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#e0f2ff]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Campaign Budget Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">$4,850</div>
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">65%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="athletes">Athletes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="billing">Billing & Payments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card className="border-[#e0f2ff]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#0066cc]" />
                      Campaign Performance
                    </CardTitle>
                    <CardDescription>Track your campaign metrics and ROI</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] flex items-center justify-center bg-gray-50 rounded-md">
                      <LineChart className="h-16 w-16 text-gray-500" />
                      <span className="ml-2 text-gray-600">Performance chart will appear here</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-[#e0f2ff]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-[#0066cc]" />
                      Active Campaigns
                    </CardTitle>
                    <CardDescription>Your running marketing campaigns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { 
                          name: "Summer Product Launch", 
                          athletes: 3, 
                          status: "active", 
                          budget: "$2,500",
                          progress: "65%",
                          endDate: "Aug 30, 2023"
                        },
                        { 
                          name: "Back-to-School Promotion", 
                          athletes: 2, 
                          status: "active", 
                          budget: "$1,850",
                          progress: "40%",
                          endDate: "Sep 15, 2023"
                        },
                        { 
                          name: "Local Store Grand Opening", 
                          athletes: 3, 
                          status: "active", 
                          budget: "$1,200",
                          progress: "20%",
                          endDate: "Oct 5, 2023"
                        }
                      ].map((campaign, idx) => (
                        <div key={idx} className="p-4 rounded-md bg-gray-50">
                          <div className="flex flex-col md:flex-row justify-between mb-2">
                            <div className="font-medium">{campaign.name}</div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
                              <div className="text-sm font-medium">{campaign.budget}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <div className="text-gray-500">Athletes</div>
                              <div className="font-medium">{campaign.athletes}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Progress</div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className="bg-[#0066cc] h-2 rounded-full" 
                                  style={{ width: campaign.progress }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">End Date</div>
                              <div className="font-medium">{campaign.endDate}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card className="border-[#e0f2ff]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#0066cc]" />
                      Business Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col items-center mb-4">
                        <div className="h-16 w-16 rounded bg-gray-200 flex items-center justify-center mb-2">
                          <Building2 className="h-8 w-8 text-gray-600" />
                        </div>
                        <div className="font-medium">{profileData?.name || "Your Business"}</div>
                        <div className="text-sm text-gray-500">{profileData?.productType || "Product Category"}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">Profile Completion</div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-[#0066cc] h-2.5 rounded-full" style={{ width: "90%" }}></div>
                        </div>
                        <div className="text-sm text-gray-500">90% Complete</div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="w-full">
                        Edit Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-[#e0f2ff]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#0066cc]" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Average Engagement</span>
                        <span className="font-medium">6.8%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Content Pieces</span>
                        <span className="font-medium">24</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Total Reach</span>
                        <span className="font-medium">285.4K</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Account Tier</span>
                        <Badge className="bg-[#0066cc]">Business Pro</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-[#e0f2ff]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-[#0066cc]" />
                      Top Athlete Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: "Sarah J.", sport: "Soccer", match: "97%" },
                        { name: "Marcus T.", sport: "Basketball", match: "94%" },
                        { name: "Emily R.", sport: "Volleyball", match: "91%" }
                      ].map((athlete, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-md bg-gray-50">
                          <div>
                            <div className="font-medium">{athlete.name}</div>
                            <div className="text-xs text-gray-500">{athlete.sport}</div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            {athlete.match} Match
                          </Badge>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full">
                        View All Matches
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Campaign Management</h2>
              <Button className="bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]">
                <Plus className="mr-2 h-4 w-4" />
                Create New Campaign
              </Button>
            </div>
            
            <Card className="border-[#e0f2ff]">
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>Manage and track your ongoing marketing campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { 
                      name: "Summer Product Launch", 
                      description: "Promote new outdoor equipment line with summer activities focus",
                      athletes: 3, 
                      status: "active", 
                      budget: "$2,500",
                      spent: "$1,625",
                      progress: "65%",
                      startDate: "Jul 15, 2023",
                      endDate: "Aug 30, 2023",
                      metrics: {
                        reach: "125K",
                        engagement: "7.2%",
                        clicks: "3.4K"
                      }
                    },
                    { 
                      name: "Back-to-School Promotion", 
                      description: "Target college students with back-to-school sporting equipment deals",
                      athletes: 2, 
                      status: "active", 
                      budget: "$1,850",
                      spent: "$740",
                      progress: "40%",
                      startDate: "Aug 1, 2023",
                      endDate: "Sep 15, 2023",
                      metrics: {
                        reach: "84K",
                        engagement: "5.9%",
                        clicks: "2.1K"
                      }
                    }
                  ].map((campaign, idx) => (
                    <div key={idx} className="p-6 rounded-md border border-[#e0f2ff]">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div>
                          <div className="text-xl font-medium">{campaign.name}</div>
                          <div className="text-gray-500">{campaign.description}</div>
                        </div>
                        <div className="flex items-center mt-2 md:mt-0 gap-2">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-1">Campaign Progress</div>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-[#0066cc] h-2.5 rounded-full" 
                              style={{ width: campaign.progress }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{campaign.progress}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm mb-4">
                        <div>
                          <div className="text-gray-500">Budget</div>
                          <div className="font-medium">{campaign.budget}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Spent</div>
                          <div className="font-medium">{campaign.spent}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Athletes</div>
                          <div className="font-medium">{campaign.athletes}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Start Date</div>
                          <div className="font-medium">{campaign.startDate}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">End Date</div>
                          <div className="font-medium">{campaign.endDate}</div>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2">Performance Metrics</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 bg-gray-50 rounded-md text-center">
                            <div className="text-gray-500 text-xs">Total Reach</div>
                            <div className="text-xl font-bold">{campaign.metrics.reach}</div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-md text-center">
                            <div className="text-gray-500 text-xs">Engagement Rate</div>
                            <div className="text-xl font-bold">{campaign.metrics.engagement}</div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-md text-center">
                            <div className="text-gray-500 text-xs">Link Clicks</div>
                            <div className="text-xl font-bold">{campaign.metrics.clicks}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm" variant="outline">Manage Athletes</Button>
                        <Button size="sm" variant="outline">Edit Campaign</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="athletes" className="space-y-6">
            <Card className="border-[#e0f2ff]">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Partnered Athletes</span>
                  <Button size="sm" variant="outline">Find New Athletes</Button>
                </CardTitle>
                <CardDescription>Manage your athlete partnerships and collaborations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      name: "Sarah Johnson", 
                      sport: "Soccer",
                      team: "State University",
                      followers: "45.2K",
                      engagementRate: "7.8%",
                      campaigns: ["Summer Product Launch"],
                      status: "active"
                    },
                    { 
                      name: "Marcus Thompson", 
                      sport: "Basketball",
                      team: "City College",
                      followers: "38.5K",
                      engagementRate: "6.5%",
                      campaigns: ["Summer Product Launch", "Back-to-School Promotion"],
                      status: "active"
                    },
                    { 
                      name: "Emily Rodriguez", 
                      sport: "Volleyball",
                      team: "Western University",
                      followers: "29.7K",
                      engagementRate: "8.1%",
                      campaigns: ["Back-to-School Promotion"],
                      status: "active"
                    }
                  ].map((athlete, idx) => (
                    <div key={idx} className="p-4 rounded-md border border-[#e0f2ff]">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-6 w-6 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-medium">{athlete.name}</div>
                            <div className="text-sm text-gray-500">{athlete.sport} | {athlete.team}</div>
                          </div>
                        </div>
                        <Badge className="mt-2 md:mt-0 bg-green-100 text-green-800 hover:bg-green-200">
                          Active
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm mb-3">
                        <div>
                          <div className="text-gray-500">Followers</div>
                          <div className="font-medium">{athlete.followers}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Engagement</div>
                          <div className="font-medium">{athlete.engagementRate}</div>
                        </div>
                        <div className="md:col-span-2">
                          <div className="text-gray-500">Campaigns</div>
                          <div className="font-medium">
                            {athlete.campaigns.join(", ")}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button size="sm" variant="outline">View Profile</Button>
                        <Button size="sm" variant="outline">Message</Button>
                        <Button size="sm" variant="outline">View Content</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-[#e0f2ff]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart4 className="h-5 w-5 text-[#0066cc]" />
                    Campaign Performance
                  </CardTitle>
                  <CardDescription>Compare performance across all campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                    <BarChart3 className="h-16 w-16 text-gray-500" />
                    <span className="ml-2 text-gray-600">Performance chart will appear here</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-[#e0f2ff]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#0066cc]" />
                    ROI Analysis
                  </CardTitle>
                  <CardDescription>Track your return on investment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                    <LineChart className="h-16 w-16 text-gray-500" />
                    <span className="ml-2 text-gray-600">ROI chart will appear here</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-[#e0f2ff]">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators across all campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-gray-500 text-sm">Total Reach</div>
                    <div className="text-2xl font-bold">285.4K</div>
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-200">+12.5%</Badge>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-gray-500 text-sm">Avg. Engagement</div>
                    <div className="text-2xl font-bold">6.8%</div>
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-200">+1.2%</Badge>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-gray-500 text-sm">Link Clicks</div>
                    <div className="text-2xl font-bold">12.3K</div>
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-200">+8.7%</Badge>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-gray-500 text-sm">Conversion Rate</div>
                    <div className="text-2xl font-bold">3.2%</div>
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-200">+0.5%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="billing" className="space-y-6">
            <Card className="border-[#e0f2ff]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#0066cc]" />
                  Payment Methods
                </CardTitle>
                <CardDescription>Manage your payment methods and billing information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]"
                    onClick={() => {
                      toast({
                        title: "Stripe integration required",
                        description: "This feature will be available once Stripe is integrated with valid API keys.",
                      });
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </Button>
                  
                  <div className="p-6 border border-dashed border-gray-300 rounded-md text-center">
                    <div className="text-gray-600 mb-2">No payment methods added yet</div>
                    <div className="text-sm text-gray-500">
                      Add a payment method to fund your campaigns and partnerships
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-[#e0f2ff]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#0066cc]" />
                  Billing History
                </CardTitle>
                <CardDescription>Your recent payments and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 border border-dashed border-gray-300 rounded-md text-center">
                  <div className="text-gray-600 mb-2">No billing history yet</div>
                  <div className="text-sm text-gray-500">
                    Your payment history will be displayed here once you make payments
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-[#e0f2ff]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#0066cc]" />
                  Subscription Plan
                </CardTitle>
                <CardDescription>Manage your subscription and billing cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 border border-[#e0f2ff] rounded-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xl font-bold">Business Pro</div>
                      <div className="text-gray-500">Monthly subscription</div>
                    </div>
                    <Badge className="bg-[#0066cc]">Current Plan</Badge>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-3xl font-bold">$199<span className="text-sm text-gray-500 font-normal">/month</span></div>
                    <div className="text-sm text-gray-500">Next billing date: August 15, 2023</div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <div className="text-[#0066cc] mt-1">✓</div>
                      <div>Up to 10 active campaigns</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-[#0066cc] mt-1">✓</div>
                      <div>Up to 25 athlete partnerships</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-[#0066cc] mt-1">✓</div>
                      <div>Advanced analytics dashboard</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-[#0066cc] mt-1">✓</div>
                      <div>AI-powered athlete matching</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-[#0066cc] mt-1">✓</div>
                      <div>Dedicated account manager</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        toast({
                          title: "Stripe integration required",
                          description: "This feature will be available once Stripe is integrated with valid API keys.",
                        });
                      }}
                    >
                      Change Plan
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        toast({
                          title: "Stripe integration required",
                          description: "This feature will be available once Stripe is integrated with valid API keys.",
                        });
                      }}
                    >
                      Manage Billing
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}