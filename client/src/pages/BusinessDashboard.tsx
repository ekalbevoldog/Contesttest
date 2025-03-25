import { useEffect, useState } from "react";
import { useLocation } from "wouter";
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
  };
  
  // Get profile info from localStorage if available or fallback to API
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  useEffect(() => {
    if (loading) return;
    
    // Try to get profile data from localStorage first
    const storedUserData = localStorage.getItem('contestedUserData');
    if (storedUserData) {
      setProfileData(JSON.parse(storedUserData));
      setIsLoadingProfile(false);
    } else {
      // Fallback to API call if no localStorage data
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          setProfileData(data);
          setIsLoadingProfile(false);
        })
        .catch(err => {
          console.error('Error fetching profile:', err);
          setIsLoadingProfile(false);
        });
    }
  }, [loading]);
  
  if (loading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0066cc]"></div>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Business Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your campaigns, athlete partnerships, and ROI</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <Badge className="bg-[#ff3366] hover:bg-[#e62e5c]">2</Badge>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <Badge className="bg-[#ff3366] hover:bg-[#e62e5c]">3</Badge>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-[#e0f2ff]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Active Campaigns</CardTitle>
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
              <CardTitle className="text-sm font-medium text-gray-500">Athlete Partnerships</CardTitle>
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
              <CardTitle className="text-sm font-medium text-gray-500">Campaign Budget Used</CardTitle>
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
                      <LineChart className="h-16 w-16 text-gray-300" />
                      <span className="ml-2 text-gray-400">Performance chart will appear here</span>
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
                          <Building2 className="h-8 w-8 text-gray-400" />
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
                            <Users className="h-6 w-6 text-gray-400" />
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
                    <BarChart3 className="h-16 w-16 text-gray-300" />
                    <span className="ml-2 text-gray-400">Performance chart will appear here</span>
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
                    <LineChart className="h-16 w-16 text-gray-300" />
                    <span className="ml-2 text-gray-400">ROI chart will appear here</span>
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
                    <div className="text-gray-400 mb-2">No payment methods added yet</div>
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
                  <div className="text-gray-400 mb-2">No billing history yet</div>
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