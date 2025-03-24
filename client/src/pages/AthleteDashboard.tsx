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
  BarChart3, 
  LineChart, 
  Users, 
  Trophy, 
  TrendingUp, 
  Wallet, 
  ClipboardList, 
  CreditCard, 
  User, 
  Settings, 
  Bell, 
  MessageSquare 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AthleteDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Check if user is authenticated
  useEffect(() => {
    const userType = localStorage.getItem('contestedUserType');
    if (userType !== 'athlete') {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to access the athlete dashboard",
      });
      navigate("/athlete/login");
    } else {
      setLoading(false);
    }
  }, [navigate, toast]);
  
  if (loading) {
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
            <h1 className="text-3xl font-bold">Athlete Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your profile, partnerships, and earnings</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <Badge className="bg-[#ff3366] hover:bg-[#e62e5c]">3</Badge>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <Badge className="bg-[#ff3366] hover:bg-[#e62e5c]">5</Badge>
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
              <CardTitle className="text-sm font-medium text-gray-500">Active Partnerships</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">4</div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#e0f2ff]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">New Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">12</div>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Pending</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-[#e0f2ff]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Earned This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold">$2,450</div>
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">+18%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="billing">Billing & Payments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card className="border-[#e0f2ff]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#0066cc]" />
                      Performance Overview
                    </CardTitle>
                    <CardDescription>Track your engagement metrics across platforms</CardDescription>
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
                      <Trophy className="h-5 w-5 text-[#0066cc]" />
                      Recent Partnerships
                    </CardTitle>
                    <CardDescription>Your active and recently completed partnerships</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { 
                          brand: "SportTech Inc", 
                          campaign: "Summer Athletic Wear", 
                          status: "active", 
                          value: "$1,200" 
                        },
                        { 
                          brand: "Energy Drinks Co", 
                          campaign: "Pre-Game Boost", 
                          status: "active", 
                          value: "$850" 
                        },
                        { 
                          brand: "Local Fitness Club", 
                          campaign: "Membership Drive", 
                          status: "completed", 
                          value: "$400" 
                        }
                      ].map((partnership, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-md bg-gray-50">
                          <div>
                            <div className="font-medium">{partnership.brand}</div>
                            <div className="text-sm text-gray-500">{partnership.campaign}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge 
                              className={partnership.status === "active" 
                                ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                              }
                            >
                              {partnership.status === "active" ? "Active" : "Completed"}
                            </Badge>
                            <div className="font-medium">{partnership.value}</div>
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
                      <User className="h-5 w-5 text-[#0066cc]" />
                      Profile Completion
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-[#0066cc] h-2.5 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                      <div className="text-sm text-gray-500">85% Complete</div>
                      <Button variant="outline" size="sm" className="mt-2 w-full">
                        Complete Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-[#e0f2ff]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#0066cc]" />
                      Match Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Match Quality</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Opportunities Viewed</span>
                        <span className="font-medium">37</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Partnerships Started</span>
                        <span className="font-medium">8</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Account Tier</span>
                        <Badge className="bg-[#0066cc]">Premium</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-[#e0f2ff]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#0066cc]" />
                      Top Matched Brands
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: "SportsTech Inc", match: "96%" },
                        { name: "Athletics Apparel", match: "93%" },
                        { name: "Local Fitness", match: "89%" }
                      ].map((brand, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-md bg-gray-50">
                          <span className="font-medium">{brand.name}</span>
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                            {brand.match} Match
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="earnings" className="space-y-6">
            <Card className="border-[#e0f2ff]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#0066cc]" />
                  Earnings Summary
                </CardTitle>
                <CardDescription>View your earnings across all partnerships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
                  <BarChart3 className="h-16 w-16 text-gray-300" />
                  <span className="ml-2 text-gray-400">Earnings chart will appear here</span>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-500">Total Earned</div>
                    <div className="text-2xl font-bold">$12,450</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-500">Pending Payments</div>
                    <div className="text-2xl font-bold">$1,850</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-500">Average Per Deal</div>
                    <div className="text-2xl font-bold">$950</div>
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
                      Add a payment method to receive payments from partnerships
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-[#e0f2ff]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#0066cc]" />
                  Payment History
                </CardTitle>
                <CardDescription>Your recent payments and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 border border-dashed border-gray-300 rounded-md text-center">
                  <div className="text-gray-400 mb-2">No payment history yet</div>
                  <div className="text-sm text-gray-500">
                    Your payment history will be displayed here once you receive payments
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="partnerships">
            <Card className="border-[#e0f2ff]">
              <CardHeader>
                <CardTitle>Active Partnerships</CardTitle>
                <CardDescription>View and manage your current partnerships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      brand: "SportTech Inc", 
                      campaign: "Summer Athletic Wear", 
                      status: "active", 
                      value: "$1,200", 
                      dueDate: "Aug 15, 2023",
                      deliverables: "2 Instagram posts, 1 TikTok"
                    },
                    { 
                      brand: "Energy Drinks Co", 
                      campaign: "Pre-Game Boost", 
                      status: "active", 
                      value: "$850",
                      dueDate: "Aug 22, 2023",
                      deliverables: "1 YouTube video, 3 Instagram stories"
                    }
                  ].map((partnership, idx) => (
                    <div key={idx} className="p-4 rounded-md border border-[#e0f2ff]">
                      <div className="flex flex-col md:flex-row justify-between mb-3">
                        <div>
                          <div className="text-xl font-medium">{partnership.brand}</div>
                          <div className="text-gray-500">{partnership.campaign}</div>
                        </div>
                        <div className="flex items-center mt-2 md:mt-0 gap-2">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
                          <div className="font-bold">{partnership.value}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Due Date</div>
                          <div>{partnership.dueDate}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Deliverables</div>
                          <div>{partnership.deliverables}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm" variant="outline">Message Brand</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card className="border-[#e0f2ff]">
              <CardHeader>
                <CardTitle>Athlete Profile</CardTitle>
                <CardDescription>Manage your public profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col items-center">
                      <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                        <User className="h-16 w-16 text-gray-400" />
                      </div>
                      <Button variant="outline" size="sm">Change Photo</Button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <div className="text-gray-500 text-sm">Profile Completion</div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-[#0066cc] h-2.5 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                      <div className="text-sm mt-1">85% Complete</div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500">Full Name</label>
                        <div className="font-medium">Michael Johnson</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Sport</label>
                        <div className="font-medium">Basketball</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">University/Team</label>
                        <div className="font-medium">State University</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Position</label>
                        <div className="font-medium">Point Guard</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Location</label>
                        <div className="font-medium">Chicago, IL</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Member Since</label>
                        <div className="font-medium">August 2023</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <label className="text-sm text-gray-500">About Me</label>
                      <div className="mt-1">
                        Point guard for State University with 5+ years of competitive experience. Specializing in game strategy and team leadership. Business management major with interest in sports marketing.
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <label className="text-sm text-gray-500">Social Media</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="flex items-center p-2 rounded-md bg-gray-50">
                          <span className="font-medium">Instagram</span>
                          <Badge className="ml-auto">24.5K Followers</Badge>
                        </div>
                        <div className="flex items-center p-2 rounded-md bg-gray-50">
                          <span className="font-medium">TikTok</span>
                          <Badge className="ml-auto">18.2K Followers</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="mt-4 bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]">
                      Edit Profile
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