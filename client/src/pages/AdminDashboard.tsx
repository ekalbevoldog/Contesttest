import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  BarChart3, 
  Users, 
  Building2, 
  ShieldCheck, 
  MessagesSquare, 
  Bell, 
  Settings, 
  Zap, 
  Handshake, 
  AlertCircle,
  FileText,
  ChevronUp,
  ChevronDown,
  Maximize2,
  BarChart2,
  Calendar
} from "lucide-react";

// Mock data - would be replaced with API calls in production
const mockUsers = [
  { id: 1, name: "Jordan Mitchell", type: "athlete", status: "active", created: "2023-08-12", lastActive: "2024-03-28" },
  { id: 2, name: "Emma's Sportswear", type: "business", status: "active", created: "2023-09-05", lastActive: "2024-03-27" },
  { id: 3, name: "Marcus Johnson", type: "athlete", status: "pending", created: "2024-02-20", lastActive: "2024-03-25" },
  { id: 4, name: "Power Nutrition Co", type: "business", status: "active", created: "2023-10-15", lastActive: "2024-03-26" },
  { id: 5, name: "Sarah Thompson", type: "athlete", status: "inactive", created: "2023-11-30", lastActive: "2024-02-14" }
];

const mockPartnerships = [
  { id: 101, athlete: "Jordan Mitchell", business: "Emma's Sportswear", status: "active", value: "$2,500", created: "2024-01-15" },
  { id: 102, athlete: "Marcus Johnson", business: "Power Nutrition Co", status: "pending", value: "$1,800", created: "2024-03-10" },
  { id: 103, athlete: "Sarah Thompson", business: "Fitness First", status: "completed", value: "$3,200", created: "2023-12-05" }
];

const mockSystemMetrics = {
  userCount: 214,
  activePartnerships: 42,
  pendingPartnerships: 18,
  matchSuccess: 76,
  totalRevenue: "$187,500"
};

const mockFeedback = [
  { id: 201, user: "Jordan Mitchell", type: "feature", text: "Would love to see integration with Instagram", status: "new", date: "2024-03-25" },
  { id: 202, user: "Emma's Sportswear", type: "bug", text: "Profile page showing errors when uploading new photos", status: "in-progress", date: "2024-03-22" },
  { id: 203, user: "Sarah Thompson", type: "general", text: "The overall experience has been excellent!", status: "closed", date: "2024-03-18" },
];

const AdminDashboard = () => {
  const [, navigate] = useLocation();
  const { user, logoutUser } = useAuth();
  const { toast } = useToast();

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!user || user.userType !== "admin") {
      toast({
        title: "Unauthorized Access",
        description: "You must be an admin to view this page.",
        variant: "destructive",
      });
      navigate("/admin-login");
    }
  }, [user, navigate, toast]);

  // Stats cards data
  const statsCards = [
    { title: "Total Users", value: mockSystemMetrics.userCount, icon: <Users className="h-6 w-6 text-primary" />, change: "+12% from last month" },
    { title: "Active Partnerships", value: mockSystemMetrics.activePartnerships, icon: <Handshake className="h-6 w-6 text-primary" />, change: "+8% from last month" },
    { title: "Match Success Rate", value: `${mockSystemMetrics.matchSuccess}%`, icon: <Zap className="h-6 w-6 text-primary" />, change: "+3% from last month" },
    { title: "Platform Revenue", value: mockSystemMetrics.totalRevenue, icon: <BarChart3 className="h-6 w-6 text-primary" />, change: "+15% from last month" },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <Badge variant="secondary">3</Badge>
          </div>
          <Button variant="outline" onClick={() => logoutUser()}>Logout</Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
                  <p className="text-xs text-green-600 mt-1">{card.change}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="partnerships">Partnerships</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Dashboard Overview */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Performance Metrics</span>
                  <Button variant="ghost" size="sm">
                    <Maximize2 className="h-4 w-4 mr-1" /> Expand
                  </Button>
                </CardTitle>
                <CardDescription>Partnership and user growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border rounded-md p-4">
                  <div className="text-center">
                    <BarChart2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Interactive chart would display here</p>
                    <p className="text-xs text-gray-400">Showing metrics over the past 6 months</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New User Registration</p>
                      <p className="text-xs text-gray-500">Marcus Johnson joined as an athlete</p>
                      <p className="text-xs text-gray-400">Today, 10:23 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Handshake className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New Partnership</p>
                      <p className="text-xs text-gray-500">Jordan Mitchell & Emma's Sportswear</p>
                      <p className="text-xs text-gray-400">Yesterday, 4:45 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Compliance Alert</p>
                      <p className="text-xs text-gray-500">Partnership #103 requires review</p>
                      <p className="text-xs text-gray-400">Mar 27, 2:15 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">System Update</p>
                      <p className="text-xs text-gray-500">New matching algorithm deployed</p>
                      <p className="text-xs text-gray-400">Mar 25, 11:10 AM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Upcoming Partnerships</span>
                  <span className="text-sm font-normal text-gray-500">View All</span>
                </CardTitle>
                <CardDescription>Partnerships scheduled to start soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPartnerships.filter(p => p.status === "pending").map((partnership) => (
                    <div key={partnership.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{partnership.athlete} + {partnership.business}</p>
                          <p className="text-xs text-gray-500">Starting soon • {partnership.value}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Pending
                      </Badge>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Alex Rivera + Sport Tech</p>
                        <p className="text-xs text-gray-500">Starting Apr 5 • $1,200</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Pending
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Platform Health</span>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-1" /> Configure
                  </Button>
                </CardTitle>
                <CardDescription>Status of system components</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">API Response Time</span>
                      <span className="text-sm text-green-600">Excellent</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Database Performance</span>
                      <span className="text-sm text-green-600">Good</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Matching Algorithm</span>
                      <span className="text-sm text-green-600">Excellent</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Storage Capacity</span>
                      <span className="text-sm text-amber-600">Moderate</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>User Management</span>
                <Button size="sm">Add New User</Button>
              </CardTitle>
              <CardDescription>Complete list of platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <div className="grid grid-cols-6 bg-gray-50 p-3 rounded-t-md">
                  <div className="col-span-2 font-medium text-sm">User</div>
                  <div className="font-medium text-sm">Type</div>
                  <div className="font-medium text-sm">Status</div>
                  <div className="font-medium text-sm">Created</div>
                  <div className="font-medium text-sm">Actions</div>
                </div>
                <div className="divide-y">
                  {mockUsers.map((user) => (
                    <div key={user.id} className="grid grid-cols-6 p-3 items-center">
                      <div className="col-span-2 flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">Last active: {user.lastActive}</p>
                        </div>
                      </div>
                      <div>
                        <Badge variant="outline" className={
                          user.type === "athlete" ? "bg-blue-50 text-blue-700 border-blue-200" : 
                          user.type === "business" ? "bg-purple-50 text-purple-700 border-purple-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        }>
                          {user.type.charAt(0).toUpperCase() + user.type.slice(1)}
                        </Badge>
                      </div>
                      <div>
                        <Badge variant={
                          user.status === "active" ? "default" : 
                          user.status === "pending" ? "outline" : 
                          "secondary"
                        }>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm">{user.created}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Partnerships Tab */}
        <TabsContent value="partnerships">
          <Card>
            <CardHeader>
              <CardTitle>Partnership Management</CardTitle>
              <CardDescription>All business-athlete partnerships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <div className="grid grid-cols-6 bg-gray-50 p-3 rounded-t-md">
                  <div className="font-medium text-sm">ID</div>
                  <div className="font-medium text-sm">Athlete</div>
                  <div className="font-medium text-sm">Business</div>
                  <div className="font-medium text-sm">Status</div>
                  <div className="font-medium text-sm">Value</div>
                  <div className="font-medium text-sm">Actions</div>
                </div>
                <div className="divide-y">
                  {mockPartnerships.map((partnership) => (
                    <div key={partnership.id} className="grid grid-cols-6 p-3 items-center">
                      <div className="text-sm font-medium">#{partnership.id}</div>
                      <div className="text-sm">{partnership.athlete}</div>
                      <div className="text-sm">{partnership.business}</div>
                      <div>
                        <Badge variant={
                          partnership.status === "active" ? "default" : 
                          partnership.status === "pending" ? "outline" : 
                          "secondary"
                        }>
                          {partnership.status.charAt(0).toUpperCase() + partnership.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">{partnership.value}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Details</Button>
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>User Feedback</CardTitle>
              <CardDescription>User suggestions and issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <div className="grid grid-cols-5 bg-gray-50 p-3 rounded-t-md">
                  <div className="font-medium text-sm">User</div>
                  <div className="font-medium text-sm">Type</div>
                  <div className="col-span-2 font-medium text-sm">Feedback</div>
                  <div className="font-medium text-sm">Status</div>
                </div>
                <div className="divide-y">
                  {mockFeedback.map((item) => (
                    <div key={item.id} className="grid grid-cols-5 p-3 items-center">
                      <div className="text-sm font-medium">{item.user}</div>
                      <div>
                        <Badge variant="outline" className={
                          item.type === "feature" ? "bg-green-50 text-green-700 border-green-200" : 
                          item.type === "bug" ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        }>
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-sm">{item.text}</div>
                      <div>
                        <Badge variant={
                          item.status === "new" ? "default" : 
                          item.status === "in-progress" ? "outline" : 
                          "secondary"
                        }>
                          {item.status === "in-progress" ? "In Progress" : 
                           item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure platform parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="text-sm font-medium">Matching Algorithm Sensitivity</p>
                      <p className="text-xs text-gray-500">Controls how strict matching criteria are applied</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Medium</span>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="text-sm font-medium">Notification Settings</p>
                      <p className="text-xs text-gray-500">Email and push notification preferences</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="text-sm font-medium">API Rate Limiting</p>
                      <p className="text-xs text-gray-500">Set maximum request rates for API endpoints</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">100/min</span>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="text-sm font-medium">Session Timeout</p>
                      <p className="text-xs text-gray-500">Maximum inactive session duration</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">24 hours</span>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Access Controls</CardTitle>
                <CardDescription>Admin privileges and security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="text-sm font-medium">Two-Factor Authentication</p>
                      <p className="text-xs text-gray-500">Require 2FA for admin accounts</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Enabled</span>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="text-sm font-medium">Admin Roles</p>
                      <p className="text-xs text-gray-500">Configure access levels for admin users</p>
                    </div>
                    <Button variant="outline" size="sm">Manage Roles</Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="text-sm font-medium">Password Policy</p>
                      <p className="text-xs text-gray-500">Requirements for password complexity</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Strong</span>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="text-sm font-medium">Login Restrictions</p>
                      <p className="text-xs text-gray-500">IP and device-based restrictions</p>
                    </div>
                    <Button variant="outline" size="sm">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;