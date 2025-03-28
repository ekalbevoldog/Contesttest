import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Avatar,
  AvatarFallback,
  AvatarImage 
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertCircle,
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
  MessageSquare,
  FileText,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  Share2,
  Gift,
  ArrowRight,
  Download,
  Target,
  Heart,
  Link,
  Shield,
  Trash2
} from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import ProfileLinkEditor from "@/components/ProfileLinkEditor";

export default function AthleteDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("thisMonth");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

  // Mock notifications data
  const notifications = [
    {
      id: "n1",
      title: "New Partnership Offer",
      message: "SportTech Inc has sent you a new partnership offer.",
      time: "2h ago",
      read: false,
      type: "offer"
    },
    {
      id: "n2",
      title: "Deliverable Due Soon",
      message: "Your 'Training Session Post' for Athletic Wear Co is due in 3 days.",
      time: "5h ago",
      read: false,
      type: "deliverable"
    },
    {
      id: "n3",
      title: "Payment Received",
      message: "You've received a payment of $1,250 from Sports Nutrition.",
      time: "1d ago",
      read: true,
      type: "payment"
    }
  ];

  // Mock messages data
  const messages = [
    {
      id: "m1",
      from: "SportTech Inc",
      message: "Hi Jordan, just following up on our partnership offer. Let us know if you have any questions!",
      time: "1h ago",
      read: false,
      avatar: ""
    },
    {
      id: "m2",
      from: "Athletic Wear Co",
      message: "The photos from your last post look amazing! Could you share the raw files for our design team?",
      time: "3h ago",
      read: false,
      avatar: ""
    },
    {
      id: "m3",
      from: "Energy Drinks Co",
      message: "We'd like to discuss increasing the scope of our partnership. Are you available for a call next week?",
      time: "6h ago",
      read: false,
      avatar: ""
    },
    {
      id: "m4",
      from: "Sports Nutrition",
      message: "Your payment for the March deliverables has been processed. Thank you for the great content!",
      time: "1d ago",
      read: true,
      avatar: ""
    },
    {
      id: "m5",
      from: "Fitness App Pro",
      message: "We've added your suggested features to our app. Would you be interested in being featured in our launch campaign?",
      time: "2d ago",
      read: true,
      avatar: ""
    }
  ];

  // Set loading state to false - authentication is handled by the protected route
  useEffect(() => {
    setLoading(false);
  }, []);

  // Define profile data type
  type ProfileData = {
    id?: string;
    name?: string;
    sport?: string;
    school?: string;
    email?: string;
    phone?: string;
    socialMedia?: {
      instagram?: string;
      twitter?: string;
      tiktok?: string;
    };
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

  // Mock partnership offers data - would be replaced with actual API call
  // Fetch all businesses
  const { data: businesses = [] } = useQuery({
    queryKey: ['/api/businesses'],
    queryFn: async () => {
      const response = await fetch('/api/businesses');
      if (!response.ok) {
        throw new Error('Failed to fetch businesses');
      }
      const data = await response.json();
      return data.businesses || [];
    }
  });

  // Fetch all campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ['/api/campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns');
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      const data = await response.json();
      return data.campaigns || [];
    }
  });

  // Fetch all matches
  const { data: matches = [] } = useQuery({
    queryKey: ['/api/matches'],
    queryFn: async () => {
      const response = await fetch('/api/matches');
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await response.json();
      return data.matches || [];
    }
  });

  // Fetch partnership offers for the athlete
  const { data: partnershipOffersData = [] } = useQuery({
    queryKey: ['/api/partnership-offers/athlete', profileData?.id],
    queryFn: async () => {
      if (!profileData?.id) return [];
      const response = await fetch(`/api/partnership-offers/athlete/${profileData.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch partnership offers');
      }
      return response.json();
    },
    enabled: !!profileData?.id,
  });

  // Format the partnership offers for display with business and campaign info
  const partnershipOffers = partnershipOffersData.map((offer: any) => {
    // Find the matching business and campaign
    const matchingBusiness = businesses.find((b: any) => b.id === offer.businessId);
    const matchingCampaign = campaigns.find((c: any) => c.id === offer.campaignId);
    const matchingMatch = matches.find((m: any) => m.id === offer.matchId);

    return {
      id: offer.id,
      brand: matchingBusiness?.name || 'Unknown Business',
      logoUrl: '',
      campaign: matchingCampaign?.title || 'Unknown Campaign',
      matchScore: matchingMatch?.score || 0,
      offerAmount: offer.offerAmount,
      deadline: offer.expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Default 14 days
      deliverables: Array.isArray(offer.deliverables) 
        ? offer.deliverables 
        : typeof offer.deliverables === 'string' 
          ? offer.deliverables.split(',').map((d: string) => d.trim()) 
          : [],
      status: offer.status || 'pending',
      compensationType: offer.compensationType,
      usageRights: offer.usageRights,
      term: offer.term,
      paymentSchedule: offer.paymentSchedule,
      exclusivity: offer.exclusivity
    };
  }) || [];

  // Mock active partnerships data - would be replaced with actual API call
  const activePartnerships = [
    {
      id: "ap1",
      brand: "Athletic Wear Co",
      logoUrl: "",
      campaign: "Spring Collection Showcase",
      startDate: "2025-03-01",
      endDate: "2025-04-30",
      deliverables: [
        { task: "Product Unboxing", deadline: "2025-03-15", status: "completed" },
        { task: "Training Session Post", deadline: "2025-04-05", status: "pending" },
        { task: "Review Video", deadline: "2025-04-25", status: "pending" }
      ],
      totalValue: 2200
    },
    {
      id: "ap2",
      brand: "Sports Nutrition",
      logoUrl: "",
      campaign: "Supplement Line Promotion",
      startDate: "2025-02-15",
      endDate: "2025-05-15",
      deliverables: [
        { task: "Nutrition Plan Post", deadline: "2025-03-01", status: "completed" },
        { task: "Workout Supplement Story", deadline: "2025-04-01", status: "completed" },
        { task: "Results Documentation", deadline: "2025-05-01", status: "pending" }
      ],
      totalValue: 1850
    }
  ];

  // Mock educational resources
  const educationalResources = [
    {
      id: "er1",
      title: "Maximizing Your NIL Value",
      type: "Guide",
      author: "Contested Team",
      timeToRead: "15 min",
      thumbnail: "",
      description: "Learn strategies to increase your value as an athlete partner"
    },
    {
      id: "er2",
      title: "Content Creation Best Practices",
      type: "Video",
      author: "Media Pro",
      timeToRead: "22 min",
      thumbnail: "",
      description: "Professional tips for creating high-quality promotional content"
    },
    {
      id: "er3",
      title: "Understanding Partnership Contracts",
      type: "Webinar",
      author: "Legal Expert",
      timeToRead: "45 min",
      thumbnail: "",
      description: "Key terms and conditions to understand in your partnership agreements"
    },
    {
      id: "er4",
      title: "Tax Considerations for Athletes",
      type: "Guide",
      author: "Financial Advisor",
      timeToRead: "18 min",
      thumbnail: "",
      description: "Important tax information for managing your partnership income"
    }
  ];

  // Mock earnings data
  const getEarningsData = (timeFrame: string) => {
    switch(timeFrame) {
      case "thisWeek":
        return {
          total: 850,
          pending: 350,
          completed: 500,
          campaigns: 2,
          change: "+12%"
        };
      case "thisMonth":
        return {
          total: 2450,
          pending: 1200,
          completed: 1250,
          campaigns: 4,
          change: "+18%"
        };
      case "lastMonth":
        return {
          total: 2100,
          pending: 0,
          completed: 2100,
          campaigns: 3,
          change: "+5%"
        };
      case "thisYear":
        return {
          total: 12450,
          pending: 1850,
          completed: 10600,
          campaigns: 14,
          change: "+65%"
        };
      default:
        return {
          total: 2450,
          pending: 1200,
          completed: 1250,
          campaigns: 4,
          change: "+18%"
        };
    }
  };

  const earningsData = getEarningsData(selectedTimeFrame);

  // Calculate days remaining for deliverables
  const calculateDaysRemaining = (deadline: string) => {
    const today = new Date();
    const dueDate = new Date(deadline);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-full py-8 px-4 md:px-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
                Athlete Dashboard
              </span>
            </h1>
            <p className="text-gray-700 mt-1">Manage your partnerships, track deliverables, and grow your personal brand</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Badge className="bg-blue-700 text-white hover:bg-blue-800">3</Badge>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                  <DialogDescription>
                    Stay updated with your partnerships and deliverables
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4 mt-2">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 rounded-lg border ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-2 rounded-full ${
                            notification.type === 'offer' 
                              ? 'bg-blue-100 text-blue-700' 
                              : notification.type === 'deliverable' 
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                          }`}>
                            {notification.type === 'offer' 
                              ? <Trophy className="h-4 w-4" /> 
                              : notification.type === 'deliverable' 
                                ? <Clock className="h-4 w-4" />
                                : <CreditCard className="h-4 w-4" />
                            }
                          </div>
                          <div>
                            <div className="font-medium">{notification.title}</div>
                            <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                            <div className="text-xs text-gray-700 mt-1">{notification.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={() => setNotificationOpen(false)}>Close</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <Badge className="bg-blue-700 text-white hover:bg-blue-800">5</Badge>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Messages</DialogTitle>
                  <DialogDescription>
                    Communication with your brand partners
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4 mt-2">
                    {messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`p-3 rounded-lg border ${message.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {message.from.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{message.from}</div>
                            <div className="text-sm text-gray-600 mt-1">{message.message}</div>
                            <div className="text-xs text-gray-700 mt-1">{message.time}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => {
                    toast({
                      title: "Messages feature coming soon",
                      description: "Full messaging functionality will be available in the next update.",
                    });
                  }}>View All Messages</Button>
                  <Button variant="outline" onClick={() => setMessageOpen(false)}>Close</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => {
              // Navigate to the settings tab
              document.querySelector('[data-value="account"]')?.dispatchEvent(
                new MouseEvent('click', { bubbles: true })
              );
              toast({
                title: "Account settings opened",
                description: "You can now update your profile and settings.",
              });
            }}>
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-blue-700/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#ffebec]">Active Partnerships</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-[#ffebec]">{activePartnerships.length}</div>
                <Badge className="bg-green-600 text-white hover:bg-green-700">Active</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-700/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#ffebec]">New Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-[#ffebec]">{partnershipOffers.length}</div>
                <Badge className="bg-blue-700 text-white hover:bg-blue-800">Pending</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-700/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#ffebec]">Upcoming Deliverables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-[#ffebec]">5</div>
                <Badge className="bg-amber-600 text-white hover:bg-amber-700">Due Soon</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-700/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#ffebec]">Earned This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-3xl font-bold text-[#ffebec]">${earningsData.total}</div>
                <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">{earningsData.change}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="offers" className="w-full">
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="offers">Partnership Offers</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="education">Education Center</TabsTrigger>
            <TabsTrigger value="documents">Contracts & Forms</TabsTrigger>
            <TabsTrigger value="account">Account Settings</TabsTrigger>
          </TabsList>

          {/* PARTNERSHIP OFFERS TAB */}
          <TabsContent value="offers" className="space-y-6">
            <Card className="border-blue-700/20 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-blue-700" />
                  Current Partnership Offers
                </CardTitle>
                <CardDescription>
                  Review and respond to partnership opportunities matched to your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partnershipOffers.length > 0 ? (
                    partnershipOffers.map((offer: any) => (
                      <Card key={offer.id} className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {offer.brand.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{offer.brand}</CardTitle>
                                <CardDescription>{offer.campaign}</CardDescription>
                              </div>
                            </div>
                            <Badge className="bg-blue-700 text-white">
                              {offer.matchScore}% Match
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-gray-700">Offer Amount</span>
                              <span className="font-semibold">${offer.offerAmount}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-gray-700">Response Deadline</span>
                              <span className="font-semibold">{new Date(offer.deadline).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-gray-700">Deliverables</span>
                              <span className="font-semibold">{offer.deliverables.length} Items</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span className="text-sm text-gray-700 block mb-1">Required Deliverables:</span>
                            <div className="flex flex-wrap gap-2">
                              {offer.deliverables.map((deliverable: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="bg-primary/5">
                                  {deliverable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-0">
                          <Button variant="outline">View Details</Button>
                          <Button>Accept Offer</Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <div className="text-gray-600 mb-2">No partnership offers available</div>
                      <div className="text-sm text-gray-700 mb-4">
                        Complete your profile to receive more partnership matches
                      </div>
                      <Button variant="outline">Update Your Profile</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary/80" />
                  Active Partnerships
                </CardTitle>
                <CardDescription>
                  Manage your current brand partnerships and track progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {activePartnerships.length > 0 ? (
                    activePartnerships.map((partnership: any) => (
                      <Card key={partnership.id} className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-green-100 text-green-800">
                                  {partnership.brand.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">{partnership.brand}</CardTitle>
                                <CardDescription>{partnership.campaign}</CardDescription>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-gray-700">Start Date</span>
                              <span className="font-semibold">{new Date(partnership.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-gray-700">End Date</span>
                              <span className="font-semibold">{new Date(partnership.endDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-gray-700">Total Value</span>
                              <span className="font-semibold">${partnership.totalValue}</span>
                            </div>
                          </div>

                          <span className="text-sm text-gray-700 block mb-2">Deliverable Progress:</span>
                          <div className="space-y-3">
                            {partnership.deliverables.map((deliverable: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {deliverable.status === "completed" ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                  )}
                                  <span className={deliverable.status === "completed" ? "line-through text-gray-500" : ""}>
                                    {deliverable.task}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-700">
                                    Due: {new Date(deliverable.deadline).toLocaleDateString()}
                                  </span>
                                  <Badge 
                                    className={deliverable.status === "completed" 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-yellow-100 text-yellow-800"
                                    }
                                  >
                                    {deliverable.status === "completed" ? "Completed" : "Pending"}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2">
                          <Button variant="outline">Message Brand</Button>
                          <Button>Track Progress</Button>
                        </CardFooter>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <div className="text-gray-600 mb-2">No active partnerships</div>
                      <div className="text-sm text-gray-700 mb-4">
                        Accept partnership offers to see them here
                      </div>
                      <Button variant="outline">Explore Offers</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DELIVERABLES TAB */}
          <TabsContent value="deliverables" className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary/80" />
                  Upcoming Deliverables
                </CardTitle>
                <CardDescription>
                  Track and manage your content deliverables for all active partnerships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activePartnerships.flatMap(partnership => 
                    partnership.deliverables
                      .filter(d => d.status === "pending")
                      .map((deliverable, idx) => {
                        const daysRemaining = calculateDaysRemaining(deliverable.deadline);
                        const isUrgent = daysRemaining <= 3;

                        return (
                          <Card key={`${partnership.id}-${idx}`} className="bg-muted/50">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarFallback className="bg-primary/10">
                                      {partnership.brand.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <CardTitle className="text-lg">{deliverable.task}</CardTitle>
                                    <CardDescription>{partnership.brand} - {partnership.campaign}</CardDescription>
                                  </div>
                                </div>
                                {isUrgent ? (
                                  <Badge className="bg-red-100 text-red-800">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Urgent
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    Pending
                                  </Badge>
                                )}                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-sm text-gray-700">Due Date</span>
                                    <span className="font-semibold">{new Date(deliverable.deadline).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <span className="text-sm text-gray-700">Time Remaining</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`font-semibold ${isUrgent ? "text-red-600" : ""}`}>
                                        {daysRemaining} days
                                      </span>
                                      <Progress 
                                        value={Math.max(0, (daysRemaining / 30) * 100)} 
                                        className={`h-2 ${isUrgent ? "bg-red-200" : "bg-yellow-100"}`} 
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm text-gray-700">Deliverable Requirements</span>
                                  <ul className="list-disc list-inside text-sm">
                                    <li>Create content featuring the product in authentic use</li>
                                    <li>Include required hashtags and brand mentions</li>
                                    <li>Submit content for brand approval before posting</li>
                                  </ul>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                              <Button variant="outline">View Guidelines</Button>
                              <Button>Mark as Completed</Button>
                            </CardFooter>
                          </Card>
                        );
                      })
                  )}

                  {activePartnerships.flatMap(p => p.deliverables).filter(d => d.status === "pending").length === 0 && (
                    <div className="text-center py-10">
                      <div className="text-gray-600 mb-2">No pending deliverables</div>
                      <div className="text-sm text-gray-700 mb-4">
                        You're all caught up! Look for new partnership opportunities.
                      </div>
                      <Button variant="outline">Find New Partnerships</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary/80" />
                  Completed Deliverables
                </CardTitle>
                <CardDescription>
                  Review your completed partnership deliverables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activePartnerships.flatMap(partnership => 
                    partnership.deliverables
                      .filter(d => d.status === "completed")
                      .map((deliverable, idx) => (
                        <div key={`${partnership.id}-${idx}`} className="flex items-center justify-between p-3 rounded-md bg-gray-50">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-medium">{deliverable.task}</div>
                              <div className="text-sm text-gray-700">{partnership.brand} - {partnership.campaign}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                              Completed on {new Date().toLocaleDateString()}
                            </span>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </div>
                        </div>
                      ))
                  )}

                  {activePartnerships.flatMap(p => p.deliverables).filter(d => d.status === "completed").length === 0 && (
                    <div className="text-center py-10">
                      <div className="text-gray-600 mb-2">No completed deliverables yet</div>
                      <div className="text-sm text-gray-700 mb-4">
                        Complete your pending tasks to see them here
                      </div>
                      <Button variant="outline">View Pending Tasks</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PERFORMANCE METRICS TAB */}
          <TabsContent value="performance" className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary/80" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators across all your partnerships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-gray-700 font-medium text-sm">Total Followers</div>
                    <div className="text-2xl font-bold">125.7K</div>
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-200">+8.3%</Badge>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-gray-700 font-medium text-sm">Avg. Engagement</div>
                    <div className="text-2xl font-bold">5.52%</div>
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-200">+0.9%</Badge>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-gray-700 font-medium text-sm">Audience Reached</div>
                    <div className="text-2xl font-bold">1.12M+</div>
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-200">+12.5%</Badge>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <div className="text-gray-700 font-medium text-sm">Content Deliverables</div>
                    <div className="text-2xl font-bold">42</div>
                    <Badge className="mt-1 bg-green-100 text-green-800 hover:bg-green-200">+5 this month</Badge>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Platform Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Instagram</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 font-medium">Followers</span>
                            <span className="font-medium">78.5K</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 font-medium">Engagement Rate</span>
                            <span className="font-medium">6.2%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 font-medium">Avg. Reach per Post</span>
                            <span className="font-medium">35.4K</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">TikTok</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 font-medium">Followers</span>
                            <span className="font-medium">42.3K</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 font-medium">Engagement Rate</span>
                            <span className="font-medium">8.7%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 font-medium">Avg. Views per Video</span>
                            <span className="font-medium">56K</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Twitter</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 font-medium">Followers</span>
                            <span className="font-medium">15.9K</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 font-medium">Engagement Rate</span>
                            <span className="font-medium">3.8%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 font-medium">Avg. Impressions</span>
                            <span className="font-medium">21.2K</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Campaign Impact</h3>
                  <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md mb-6">
                    <BarChart3 className="h-16 w-16 text-gray-600" />
                    <span className="ml-2 text-gray-700 font-medium">Campaign performance visualization</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-md">
                      <div className="text-gray-700 font-medium text-sm">Top Performing</div>
                      <div className="mt-1 font-medium">Athletic Wear Co</div>
                      <div className="text-sm text-gray-700">87K impressions</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <div className="text-gray-700 font-medium text-sm">Most Engaging</div>
                      <div className="mt-1 font-medium">Energy Drinks Co</div>
                      <div className="text-sm text-gray-700">9.2% engagement</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-md">
                      <div className="text-gray-700 font-medium text-sm">Audience Growth</div>
                      <div className="mt-1 font-medium">+12.5K followers</div>
                      <div className="text-sm text-gray-700">Since first campaign</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EARNINGS TAB */}
          <TabsContent value="earnings" className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Wallet className="h-5 w-5 text-primary/80" />
                      Earnings Summary
                    </CardTitle>
                    <CardDescription>
                      View your earnings across all partnerships
                    </CardDescription>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <Select value={selectedTimeFrame} onValueChange={setSelectedTimeFrame}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Time Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Time Period</SelectLabel>
                          <SelectItem value="thisWeek">This Week</SelectItem>
                          <SelectItem value="thisMonth">This Month</SelectItem>
                          <SelectItem value="lastMonth">Last Month</SelectItem>
                          <SelectItem value="thisYear">This Year</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md mb-6">
                  <BarChart3 className="h-16 w-16 text-gray-600" />
                  <span className="ml-2 text-gray-700 font-medium">Earnings chart for selected period</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Total Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${earningsData.total}</div>
                      <p className="text-sm text-gray-700">From {earningsData.campaigns} campaigns</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${earningsData.pending}</div>
                      <p className="text-sm text-gray-700">To be received</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Received</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">${earningsData.completed}</div>
                      <p className="text-sm text-gray-700">Payments received</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-700">Growth Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{earningsData.change}</div>
                      <p className="text-sm text-gray-700">From previous period</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary/80" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>
                  Your recent payments from brand partnerships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      brand: "SportTech Inc",
                      campaign: "Summer Athletic Wear",
                      amount: 850,
                      date: "2025-03-15",
                      status: "completed"
                    },
                    {
                      brand: "Energy Drinks Co",
                      campaign: "Pre-Game Boost",
                      amount: 400,
                      date: "2025-03-01",
                      status: "completed"
                    },
                    {
                      brand: "Local Fitness Club",
                      campaign: "Membership Drive",
                      amount: 400,
                      date: "2025-02-20",
                      status: "completed"
                    },
                    {
                      brand: "Athletic Wear Co",
                      campaign: "Spring Collection",
                      amount: 1200,
                      date: "2025-04-30",
                      status: "pending"
                    }
                  ].map((transaction, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-md bg-gray-50">
                      <div>
                        <div className="font-medium">{transaction.brand}</div>
                        <div className="text-sm text-gray-700">{transaction.campaign}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">${transaction.amount}</div>
                          <div className="text-sm text-gray-700">{new Date(transaction.date).toLocaleDateString()}</div>
                        </div>
                        <Badge 
                          className={transaction.status === "completed" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {transaction.status === "completed" ? "Paid" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="outline">
                  View All Transactions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* EDUCATION CENTER TAB */}
          <TabsContent value="education" className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary/80" />
                  Education Center
                </CardTitle>
                <CardDescription>
                  Resources and guides to help you maximize your partnerships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {educationalResources.map((resource) => (
                    <Card key={resource.id} className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                            <CardDescription>{resource.description}</CardDescription>
                          </div>
                          <Badge 
                            className={
                              resource.type === "Guide" ? "bg-blue-100 text-blue-800" :
                              resource.type === "Video" ? "bg-purple-100 text-purple-800" :
                              "bg-green-100 text-green-800"
                            }
                          >
                            {resource.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            By {resource.author}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {resource.timeToRead} read
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full">View Resource</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="outline">
                  Browse All Resources
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary/80" />
                  Best Practices
                </CardTitle>
                <CardDescription>
                  Tips to optimize your partnerships and grow your value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-muted/50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary/80" />
                      Content Creation Tips
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 min-w-5 text-green-600" />
                        <span>Create authentic content that reflects your personal brand and values</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 min-w-5 text-green-600" />
                        <span>Consider lighting, composition, and audio quality in your content</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 min-w-5 text-green-600" />
                        <span>Showcase the product in realistic, everyday usage scenarios</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 min-w-5 text-green-600" />
                        <span>Schedule posts during peak engagement times for your audience</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-5">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary/80" />
                      Communication Best Practices
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 min-w-5 text-green-600" />
                        <span>Respond to brand communications within 24-48 hours</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 min-w-5 text-green-600" />
                        <span>Set clear expectations about deliverables and timelines</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 min-w-5 text-green-600" />
                        <span>Provide regular updates on content creation progress</span>
                      </li>
                      <li className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 min-w-5 text-green-600" />
                        <span>Be professional, courteous, and open to feedback</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary/80" />
                  Partnership Contracts
                </CardTitle>
                <CardDescription>
                  Access and manage your partnership agreements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activePartnerships.map((partnership) => (
                    <div key={partnership.id} className="flex items-center justify-between p-4 rounded-md bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary/80" />
                        <div>
                          <div className="font-medium">{partnership.brand} Contract</div>
                          <div className="text-sm text-gray-700">{partnership.campaign}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm">View</Button>
                      </div>
                    </div>
                  ))}

                  {activePartnerships.length === 0 && (
                    <div className="text-center py-10">
                      <div className="text-gray-600 mb-2">No contracts available</div>
                      <div className="text-sm text-gray-700 mb-4">
                        Active partnerships will have contracts displayed here
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary/80" />
                  Tax Documents
                </CardTitle>
                <CardDescription>
                  Access your 1099 forms and tax-related documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { year: "2024", type: "1099-MISC", date: "2025-01-31" },
                    { year: "2023", type: "1099-MISC", date: "2024-01-31" }
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-md bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary/80" />
                        <div>
                          <div className="font-medium">{doc.type} - Tax Year {doc.year}</div>
                          <div className="text-sm text-gray-700">Issued on: {new Date(doc.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACCOUNT SETTINGS TAB */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-primary/20 md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary/80" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Manage your account details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Full Name</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md">
                            {profileData?.name || "Jordan Mitchell"}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email Address</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md">
                            athlete@contested.com
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Phone Number</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md">
                            (555) 123-4567
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Sport</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md">
                            {profileData?.sport || "Basketball"}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">School</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md">
                            {profileData?.school || "State University"}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Account Type</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md flex items-center justify-between">
                            <span>Athlete</span>
                            <Badge className="bg-primary">Premium</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <Button>Edit Profile</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary/80" />
                    Refer a Friend
                  </CardTitle>
                  <CardDescription>
                    Invite fellow athletes to join Contested
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-center">
                    <div className="bg-primary/10 p-6 rounded-md">
                      <Gift className="h-12 w-12 text-primary/80 mx-auto mb-3" />
                      <p className="font-medium mb-1">Your Referral Code</p>
                      <div className="bg-white p-3 rounded-md font-bold tracking-wider text-lg mb-3">
                        ATHLETE25
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        Share this code with friends to give them a 25% discount on their first month
                      </p>
                      <Button className="w-full">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Referral Code
                      </Button>
                    </div>
                    <div>
                      <p className="font-medium">Referral Benefits</p>
                      <p className="text-sm text-gray-700 mt-1">
                        For each friend who joins using your code, you'll receive a $50 bonus after their first partnership
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="font-medium">Your Referrals</p>
                      <p className="text-2xl font-bold mt-1">3</p>
                      <p className="text-sm text-gray-700">Total referrals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary/80" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "New Partnership Offers", email: true, push: true },
                    { type: "Deliverable Reminders", email: true, push: true },
                    { type: "Payment Notifications", email: true, push: true },
                    { type: "Educational Resources", email: true, push: false },
                    { type: "Platform Updates", email: false, push: false }
                  ].map((notification, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-md bg-gray-50">
                      <span className="font-medium">{notification.type}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Email</label>
                          <input type="checkbox" checked={notification.email} className="rounded-md" onChange={() => {}} />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-700">Push</label>
                          <input type="checkbox" checked={notification.push} className="rounded-md" onChange={() => {}} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>

            {/* Shareable Profile Link */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5 text-primary/80" />
                  Shareable Profile Link
                </CardTitle>
                <CardDescription>
                  Create your personal shareable profile page that connects to all your social media accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileLinkEditor 
                  athleteId={1} // This would come from the authenticated user's athlete profile
                  initialData={profileData}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}