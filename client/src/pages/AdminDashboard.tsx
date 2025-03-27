import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, BarChart3, Calendar, MessageSquare, Info, ShieldAlert } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAthletes: 0,
    totalBusinesses: 0,
    totalMatches: 0,
    pendingMatches: 0,
    totalFeedbacks: 0,
    pendingFeedbacks: 0,
  });

  // Check if the user is an admin
  useEffect(() => {
    if (user && user.userType !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersResponse = await apiRequest("GET", "/api/admin/users");
        const usersData = await usersResponse.json();
        setUsers(usersData);
        setLoadingUsers(false);

        // Fetch athletes
        const athletesResponse = await apiRequest("GET", "/api/athletes");
        const athletesData = await athletesResponse.json();
        setAthletes(athletesData);
        setLoadingAthletes(false);

        // Fetch businesses
        const businessesResponse = await apiRequest("GET", "/api/businesses");
        const businessesData = await businessesResponse.json();
        setBusinesses(businessesData);
        setLoadingBusinesses(false);

        // Fetch matches
        const matchesResponse = await apiRequest("GET", "/api/matches");
        const matchesData = await matchesResponse.json();
        setMatches(matchesData);
        setLoadingMatches(false);

        // Fetch feedbacks
        const feedbacksResponse = await apiRequest("GET", "/api/feedback/public");
        const feedbacksData = await feedbacksResponse.json();
        setFeedbacks(feedbacksData);
        setLoadingFeedbacks(false);

        // Set stats
        setStats({
          totalUsers: usersData.length,
          totalAthletes: athletesData.length,
          totalBusinesses: businessesData.length,
          totalMatches: matchesData.length,
          pendingMatches: matchesData.filter((match: any) => match.status === "pending").length,
          totalFeedbacks: feedbacksData.length,
          pendingFeedbacks: feedbacksData.filter((feedback: any) => feedback.status === "pending").length,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again later.",
          variant: "destructive",
        });
      }
    };

    if (user && user.userType === "admin") {
      fetchData();
    }
  }, [user, toast]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user.userType !== "admin") {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="mt-2 text-muted-foreground">
            You don't have permission to access the admin dashboard.
          </p>
          <Link href="/">
            <Button className="mt-6">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, athletes, businesses, and monitor platform activity.
          </p>
        </div>
        <div className="flex items-center mt-4 md:mt-0 space-x-2">
          <Badge variant="outline" className="text-sm py-1">
            {user.email}
          </Badge>
          <Badge variant="default" className="bg-primary text-sm py-1">
            Admin
          </Badge>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalMatches}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.pendingMatches} pending
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Athletes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalAthletes}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalFeedbacks}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {stats.pendingFeedbacks} pending
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="athletes">Athletes</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all platform users.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>User Type</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.userType === "admin"
                                  ? "default"
                                  : "outline"
                              }
                              className={
                                user.userType === "admin" ? "" : "bg-secondary"
                              }
                            >
                              {user.userType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.verified ? "default" : "outline"}
                              className={
                                user.verified
                                  ? "bg-green-500 hover:bg-green-600"
                                  : ""
                              }
                            >
                              {user.verified ? "Verified" : "Unverified"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Athletes Tab */}
        <TabsContent value="athletes">
          <Card>
            <CardHeader>
              <CardTitle>Athlete Profiles</CardTitle>
              <CardDescription>Manage athlete profiles and information.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAthletes ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Sport</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Followers</TableHead>
                        <TableHead>Profile Link</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {athletes.map((athlete) => (
                        <TableRow key={athlete.id}>
                          <TableCell>{athlete.id}</TableCell>
                          <TableCell>{athlete.name}</TableCell>
                          <TableCell>{athlete.sport}</TableCell>
                          <TableCell>{athlete.school}</TableCell>
                          <TableCell>
                            {athlete.followerCount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={athlete.profileLinkEnabled ? "default" : "outline"}
                              className={athlete.profileLinkEnabled ? "bg-blue-500 hover:bg-blue-600" : ""}
                            >
                              {athlete.profileLinkEnabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                              {athlete.profileLinkEnabled && athlete.profileLinkId && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => {
                                    window.open(`/athlete-profile/${athlete.profileLinkId}`, '_blank');
                                  }}
                                >
                                  Profile
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Businesses Tab */}
        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>Business Profiles</CardTitle>
              <CardDescription>Manage business profiles and information.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBusinesses ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Product Type</TableHead>
                        <TableHead>Audience Goals</TableHead>
                        <TableHead>Campaign Vibe</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businesses.map((business) => (
                        <TableRow key={business.id}>
                          <TableCell>{business.id}</TableCell>
                          <TableCell>{business.name}</TableCell>
                          <TableCell>{business.productType}</TableCell>
                          <TableCell>{business.audienceGoals}</TableCell>
                          <TableCell>{business.campaignVibe}</TableCell>
                          <TableCell>{business.budget || "N/A"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matches Tab */}
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Match Management</CardTitle>
              <CardDescription>Monitor and manage athlete-business matches.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMatches ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Athlete</TableHead>
                        <TableHead>Business</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Compliance</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match) => (
                        <TableRow key={match.id}>
                          <TableCell>{match.id}</TableCell>
                          <TableCell>
                            {athletes.find(a => a.id === match.athleteId)?.name || `ID: ${match.athleteId}`}
                          </TableCell>
                          <TableCell>
                            {businesses.find(b => b.id === match.businessId)?.name || `ID: ${match.businessId}`}
                          </TableCell>
                          <TableCell className="font-medium">
                            {match.score}%
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                match.status === "pending"
                                  ? "outline"
                                  : match.status === "accepted"
                                  ? "default"
                                  : match.status === "declined"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {match.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                match.complianceStatus === "pending"
                                  ? "outline"
                                  : match.complianceStatus === "approved"
                                  ? "default"
                                  : "destructive"
                              }
                              className={
                                match.complianceStatus === "approved"
                                  ? "bg-green-500 hover:bg-green-600"
                                  : ""
                              }
                            >
                              {match.complianceStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(match.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Management</CardTitle>
              <CardDescription>Monitor and respond to user feedback.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFeedbacks ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>User Type</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Public</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbacks.map((feedback) => (
                        <TableRow key={feedback.id}>
                          <TableCell>{feedback.id}</TableCell>
                          <TableCell>{feedback.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {feedback.userType}
                            </Badge>
                          </TableCell>
                          <TableCell>{feedback.feedbackType}</TableCell>
                          <TableCell>
                            {feedback.rating ? `${feedback.rating}/5` : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                feedback.status === "pending"
                                  ? "outline"
                                  : feedback.status === "reviewed"
                                  ? "secondary"
                                  : feedback.status === "implemented"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {feedback.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={feedback.isPublic ? "default" : "outline"}
                              className={
                                feedback.isPublic
                                  ? "bg-green-500 hover:bg-green-600"
                                  : ""
                              }
                            >
                              {feedback.isPublic ? "Public" : "Private"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                              {!feedback.adminResponse && (
                                <Button variant="outline" size="sm">
                                  Respond
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}