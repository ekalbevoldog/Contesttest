import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

// Initial default values that will be replaced with real data
const defaultSystemMetrics = {
  userCount: 0,
  activePartnerships: 0,
  pendingPartnerships: 0,
  matchSuccess: 0,
  totalRevenue: "$0"
};

const AdminDashboard = () => {
  const [, navigate] = useLocation();
  const { user, logoutUser } = useAuth();
  const { toast } = useToast();
  const [systemMetrics, setSystemMetrics] = useState(defaultSystemMetrics);
  
  // Fetch users from API
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.userType === 'admin',
  });
  
  // Fetch partnerships data
  const { data: matches = [], isLoading: isLoadingMatches } = useQuery({
    queryKey: ['/api/matches'],
    enabled: !!user && user.userType === 'admin',
  });
  
  // Fetch partnership offers data
  const { data: offers = [], isLoading: isLoadingOffers } = useQuery({
    queryKey: ['/api/partnership-offers'],
    enabled: !!user && user.userType === 'admin',
  });
  
  // Fetch feedback data
  const { data: feedbackResponse, isLoading: isLoadingFeedback } = useQuery({
    queryKey: ['/api/feedback/public'],
    enabled: !!user && user.userType === 'admin',
  });
  
  // Process feedback data to ensure it's an array
  const feedback = Array.isArray(feedbackResponse) ? feedbackResponse : [];
  
  // Process data to generate system metrics
  useEffect(() => {
    if (users.length && matches.length) {
      // Calculate metrics based on real data
      const activePartnerships = matches.filter(m => m.status === 'active').length;
      const pendingPartnerships = offers.filter(o => o.status === 'pending').length;
      const successfulMatches = matches.filter(m => m.status === 'completed' || m.status === 'active').length;
      const matchSuccess = users.length > 0 ? Math.floor((successfulMatches / matches.length) * 100) : 0;
      
      // Update system metrics
      setSystemMetrics({
        userCount: users.length,
        activePartnerships,
        pendingPartnerships,
        matchSuccess,
        totalRevenue: `$${(activePartnerships * 2500).toLocaleString()}` // Estimate based on active partnerships
      });
    }
  }, [users, matches, offers]);

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

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Stats cards data
  const statsCards = [
    { title: "Total Users", value: systemMetrics.userCount, icon: <Users className="h-6 w-6 text-primary" />, change: "Real-time data" },
    { title: "Active Partnerships", value: systemMetrics.activePartnerships, icon: <Handshake className="h-6 w-6 text-primary" />, change: "Real-time data" },
    { title: "Match Success Rate", value: `${systemMetrics.matchSuccess}%`, icon: <Zap className="h-6 w-6 text-primary" />, change: "Based on completed matches" },
    { title: "Platform Revenue", value: systemMetrics.totalRevenue, icon: <BarChart3 className="h-6 w-6 text-primary" />, change: "Estimated value" },
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
      
      {/* Role-specific Dashboard Access */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">View Role Dashboards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-blue-100 rounded-full mb-3">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-bold mb-2">Athlete Dashboard</h3>
                <p className="text-sm text-gray-500 mb-4">View the platform from an athlete's perspective</p>
                <Button onClick={() => navigate("/athlete/dashboard")}>Access Dashboard</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-green-100 rounded-full mb-3">
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold mb-2">Business Dashboard</h3>
                <p className="text-sm text-gray-500 mb-4">View the platform from a business's perspective</p>
                <Button onClick={() => navigate("/business/dashboard")}>Access Dashboard</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6 pb-4">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 bg-amber-100 rounded-full mb-3">
                  <ShieldCheck className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-bold mb-2">Compliance Dashboard</h3>
                <p className="text-sm text-gray-500 mb-4">View the platform from a compliance officer's perspective</p>
                <Button onClick={() => navigate("/compliance/dashboard")}>Access Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        </div>
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
                    <BarChart2 className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Interactive chart would display here</p>
                    <p className="text-xs text-gray-600">Showing metrics over the past 6 months</p>
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
                      <p className="text-xs text-gray-600">Today, 10:23 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Handshake className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">New Partnership</p>
                      <p className="text-xs text-gray-500">Jordan Mitchell & Emma's Sportswear</p>
                      <p className="text-xs text-gray-600">Yesterday, 4:45 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Compliance Alert</p>
                      <p className="text-xs text-gray-500">Partnership #103 requires review</p>
                      <p className="text-xs text-gray-600">Mar 27, 2:15 PM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">System Update</p>
                      <p className="text-xs text-gray-500">New matching algorithm deployed</p>
                      <p className="text-xs text-gray-600">Mar 25, 11:10 AM</p>
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
                  {isLoadingOffers ? (
                    <div className="text-center p-4">
                      <p className="text-sm text-gray-500">Loading upcoming partnerships...</p>
                    </div>
                  ) : offers.filter(o => o.status === "pending").slice(0, 3).map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium">Athlete #{offer.athleteId} + Business #{offer.businessId}</p>
                          <p className="text-xs text-gray-500">Campaign #{offer.campaignId} • {offer.compensation ? `$${offer.compensation}` : 'Varies'}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Pending
                      </Badge>
                    </div>
                  ))}
                  {offers && offers.filter(o => o.status === "pending").length === 0 && (
                    <div className="text-center p-4">
                      <p className="text-sm text-gray-500">No pending partnerships found</p>
                    </div>
                  )}
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
                  {isLoadingUsers ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">Loading users...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">No users found</p>
                    </div>
                  ) : users.map((user) => (
                    <div key={user.id} className="grid grid-cols-6 p-3 items-center">
                      <div className="col-span-2 flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{user.username ? user.username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.username || 'Unnamed User'}</p>
                          <p className="text-xs text-gray-500">Last active: {formatDate(user.updatedAt)}</p>
                        </div>
                      </div>
                      <div>
                        <Badge variant="outline" className={
                          user.userType === "athlete" ? "bg-blue-50 text-blue-700 border-blue-200" : 
                          user.userType === "business" ? "bg-purple-50 text-purple-700 border-purple-200" :
                          user.userType === "admin" ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        }>
                          {user.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'Unknown'}
                        </Badge>
                      </div>
                      <div>
                        <Badge variant={
                          user.status === "active" ? "default" : 
                          user.status === "pending" ? "outline" : 
                          "secondary"
                        }>
                          {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="text-sm">{formatDate(user.createdAt)}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/users/${user.id}`)}>View</Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">Edit</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>
                                Make changes to user information below.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="username" className="text-right">
                                  Username
                                </Label>
                                <Input id="username" defaultValue={user.username || ''} className="col-span-3" />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="userType" className="text-right">
                                  User Type
                                </Label>
                                <Select defaultValue={user.userType || 'user'}>
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select user type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="athlete">Athlete</SelectItem>
                                    <SelectItem value="business">Business</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="user">Regular User</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">
                                  Status
                                </Label>
                                <Select defaultValue={user.status || 'inactive'}>
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit">Save changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
                  {isLoadingOffers ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">Loading partnerships...</p>
                    </div>
                  ) : offers.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">No partnership offers found</p>
                    </div>
                  ) : offers.map((offer) => (
                    <div key={offer.id} className="grid grid-cols-6 p-3 items-center">
                      <div className="text-sm font-medium">#{offer.id}</div>
                      <div className="text-sm">Athlete ID: {offer.athleteId}</div>
                      <div className="text-sm">Business ID: {offer.businessId}</div>
                      <div>
                        <Badge variant={
                          offer.status === "accepted" ? "default" : 
                          offer.status === "pending" ? "outline" : 
                          offer.status === "declined" ? "secondary" :
                          "outline"
                        }>
                          {offer.status ? offer.status.charAt(0).toUpperCase() + offer.status.slice(1) : 'Unknown'}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">
                        {offer.compensation ? `$${offer.compensation}` : 'Varies'}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/admin/partnerships/${offer.id}`)}>Details</Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">Edit</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Partnership</DialogTitle>
                              <DialogDescription>
                                Update partnership status and details.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">
                                  Status
                                </Label>
                                <Select defaultValue={offer.status || 'pending'}>
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="accepted">Accepted</SelectItem>
                                    <SelectItem value="declined">Declined</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="complianceStatus" className="text-right">
                                  Compliance
                                </Label>
                                <Select defaultValue={offer.complianceStatus || 'pending'}>
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select compliance status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending Review</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button type="submit">Save changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
                  {isLoadingFeedback ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">Loading feedback...</p>
                    </div>
                  ) : feedback.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">No feedback found</p>
                    </div>
                  ) : feedback.map((item) => (
                    <div key={item.id} className="grid grid-cols-5 p-3 items-center">
                      <div className="text-sm font-medium">User #{item.userId}</div>
                      <div>
                        <Badge variant="outline" className={
                          item.feedbackType === "feature" ? "bg-green-50 text-green-700 border-green-200" : 
                          item.feedbackType === "bug" ? "bg-red-50 text-red-700 border-red-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        }>
                          {item.feedbackType.charAt(0).toUpperCase() + item.feedbackType.slice(1)}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-sm">{item.content}</div>
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