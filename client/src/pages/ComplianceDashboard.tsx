import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';

// Define interface for the partnership data structure
interface SocialMedia {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
}

interface Athlete {
  name: string;
  sport: string;
  year: string;
  email: string;
  phone: string;
  socialMedia: SocialMedia;
  stats: string;
  academicStatus: string;
}

interface Business {
  name: string;
  type: string;
  contact: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  history: string;
}

interface PartnershipDetails {
  compensation: string;
  type: string;
  submittedDate: string;
  approvedDate?: string;
  deliverables: string[];
  duration: string;
  additionalNotes?: string;
}

interface Message {
  id: number;
  text: string;
  sender: string;
  timestamp: string;
}

interface Partnership {
  id: number;
  athlete: Athlete;
  business: Business;
  details: PartnershipDetails;
  status: string;
  messages: Message[];
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Shield, Check, X, Eye, AlertCircle, Calendar, Users, Sparkles, MessageSquare, ChevronDown, ChevronUp, Info, Send, Briefcase, CheckCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

// Mock data for pending approvals
const pendingPartnerships = [
  {
    id: 1,
    athlete: {
      name: 'Sarah Johnson',
      sport: 'Basketball',
      year: 'Junior',
      email: 'sarahjohnson@university.edu',
      phone: '(555) 123-4567',
      socialMedia: {
        instagram: '@sarahj_hoops',
        twitter: '@sarah_johnson21'
      },
      stats: 'Averaging 18.5 points and 7.2 rebounds per game',
      academicStatus: 'Good standing, 3.7 GPA'
    },
    business: {
      name: 'Local Sports Shop',
      type: 'Retail',
      contact: 'Mark Davis',
      email: 'mark@localsportsshop.com',
      phone: '(555) 987-6543',
      website: 'www.localsportsshop.com',
      address: '123 Main Street, Collegetown, USA',
      history: 'Family-owned business operating near campus since 2005'
    },
    details: {
      compensation: '$500',
      type: 'Social Media',
      submittedDate: '2025-03-20',
      deliverables: [
        '2 Instagram posts per month featuring products',
        '1 in-store appearance for autograph signing',
        'Store logo to be included in personal social media profile'
      ],
      duration: '3 months',
      additionalNotes: 'Athlete will receive 20% discount on all store merchandise during contract period'
    },
    status: 'pending',
    messages: []
  },
  {
    id: 2,
    athlete: {
      name: 'Michael Chen',
      sport: 'Soccer',
      year: 'Sophomore',
      email: 'mchen@university.edu',
      phone: '(555) 234-5678',
      socialMedia: {
        instagram: '@mikechen10',
        tiktok: '@michaelchen_soccer'
      },
      stats: 'Led team with 12 goals last season',
      academicStatus: 'Good standing, 3.5 GPA'
    },
    business: {
      name: 'City Cafe',
      type: 'Food & Beverage',
      contact: 'Jennifer Wong',
      email: 'jennifer@citycafe.com',
      phone: '(555) 345-6789',
      website: 'www.citycafe.com',
      address: '456 University Ave, Collegetown, USA',
      history: 'Popular local cafe frequented by students and faculty'
    },
    details: {
      compensation: '$300',
      type: 'In-person Appearance',
      submittedDate: '2025-03-22',
      deliverables: [
        'Monthly meet-and-greet with customers',
        'Autographed photos for cafe to display',
        'Mention of cafe in post-game interviews when appropriate'
      ],
      duration: '6 months (spring semester)',
      additionalNotes: 'Free meals provided during appearances'
    },
    status: 'pending',
    messages: []
  },
  {
    id: 3,
    athlete: {
      name: 'Aisha Williams',
      sport: 'Track & Field',
      year: 'Senior',
      email: 'awilliams@university.edu',
      phone: '(555) 456-7890',
      socialMedia: {
        instagram: '@aisha_runs',
        twitter: '@aishaW_track'
      },
      stats: 'School record holder in 400m hurdles',
      academicStatus: 'Dean\'s List, 3.9 GPA'
    },
    business: {
      name: 'Runner\'s World',
      type: 'Retail',
      contact: 'James Peterson',
      email: 'james@runnersworld.com',
      phone: '(555) 567-8901',
      website: 'www.runnersworld.com',
      address: '789 Athletic Drive, Collegetown, USA',
      history: 'Specialty running store with locations across the state'
    },
    details: {
      compensation: '$800',
      type: 'Product Endorsement',
      submittedDate: '2025-03-23',
      deliverables: [
        'Featured in store promotional materials',
        'Social media content wearing/using sponsored products',
        'Participation in store-sponsored community 5K race',
        'Testimonial for website and print materials'
      ],
      duration: '1 year contract',
      additionalNotes: 'Includes $300 product allowance per semester'
    },
    status: 'pending',
    messages: []
  },
];

// Mock data for approved partnerships
const approvedPartnerships = [
  {
    id: 4,
    athlete: {
      name: 'David Martinez',
      sport: 'Football',
      year: 'Senior',
      email: 'dmartinez@university.edu',
      phone: '(555) 678-9012',
      socialMedia: {
        instagram: '@dmartinez_QB',
        twitter: '@david_martinez12'
      },
      stats: 'Starting quarterback, 28 touchdowns last season',
      academicStatus: 'Good standing, 3.2 GPA'
    },
    business: {
      name: 'Athlete Nutrition',
      type: 'Health & Wellness',
      contact: 'Sarah Thompson',
      email: 'sarah@athletenutrition.com',
      phone: '(555) 789-0123',
      website: 'www.athletenutrition.com',
      address: '101 Fitness Blvd, Collegetown, USA',
      history: 'Nutrition supplement company founded by former collegiate athletes'
    },
    details: {
      compensation: '$1,200',
      type: 'Social Media Campaign',
      submittedDate: '2025-03-15',
      approvedDate: '2025-03-17',
      deliverables: [
        'Weekly social media posts featuring products',
        'Brand ambassador at local fitness expos',
        'Product reviews and testimonials',
        'Behind-the-scenes training content'
      ],
      duration: '6 months with option to renew',
      additionalNotes: 'Monthly supply of company products included'
    },
    status: 'approved',
    messages: []
  },
  {
    id: 5,
    athlete: {
      name: 'Emma Wilson',
      sport: 'Swimming',
      year: 'Junior',
      email: 'ewilson@university.edu',
      phone: '(555) 890-1234',
      socialMedia: {
        instagram: '@emma_swims',
        tiktok: '@emmawilson_swim'
      },
      stats: 'NCAA qualifier in 100m and 200m freestyle',
      academicStatus: 'Dean\'s List, 3.8 GPA'
    },
    business: {
      name: 'AquaTech Gear',
      type: 'Sporting Goods',
      contact: 'Robert Chen',
      email: 'robert@aquatechgear.com',
      phone: '(555) 901-2345',
      website: 'www.aquatechgear.com',
      address: '202 Swim Lane, Collegetown, USA',
      history: 'Innovative swimming equipment manufacturer with collegiate focus'
    },
    details: {
      compensation: '$650',
      type: 'Product Testing & Review',
      submittedDate: '2025-03-10',
      approvedDate: '2025-03-12',
      deliverables: [
        'Product testing and feedback for new swim gear',
        'Video demonstrations for company website',
        'Social media features of gear in training environment',
        'Appearance at local swim clinic sponsored by company'
      ],
      duration: '4 months (competitive season)',
      additionalNotes: 'Custom-branded equipment provided'
    },
    status: 'approved',
    messages: []
  }
];

export default function ComplianceDashboard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [userData, setUserData] = useState<any>(null);
  const [partnerships, setPartnerships] = useState<{
    pending: Partnership[];
    approved: Partnership[];
  }>({
    pending: pendingPartnerships as Partnership[],
    approved: approvedPartnerships as Partnership[]
  });
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    // Check if user is logged in as compliance officer
    const isLoggedIn = localStorage.getItem('contestedUserLoggedIn') === 'true';
    const userType = localStorage.getItem('contestedUserType');
    
    if (!isLoggedIn || userType !== 'compliance') {
      navigate('/compliance/login');
      return;
    }
    
    // Get user data
    const storedUserData = localStorage.getItem('contestedUserData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
    
    // For a real app, we would fetch partnerships from the API here
  }, [navigate]);

  const handleApprove = (id: number) => {
    // Move partnership from pending to approved
    const partnership = partnerships.pending.find(p => p.id === id);
    
    if (partnership) {
      const updatedPending = partnerships.pending.filter(p => p.id !== id);
      const updatedPartnership = {
        ...partnership,
        status: 'approved',
        details: {
          ...partnership.details,
          approvedDate: new Date().toISOString().split('T')[0]
        }
      };
      
      setPartnerships({
        pending: updatedPending,
        approved: [...partnerships.approved, updatedPartnership]
      });
      
      toast({
        title: "Partnership Approved",
        description: `You have approved the partnership between ${partnership.athlete.name} and ${partnership.business.name}`,
      });
    }
  };

  const handleReject = (id: number) => {
    // Remove partnership from pending list
    const partnership = partnerships.pending.find(p => p.id === id);
    
    if (partnership) {
      setPartnerships({
        ...partnerships,
        pending: partnerships.pending.filter(p => p.id !== id)
      });
      
      toast({
        title: "Partnership Rejected",
        description: `You have rejected the partnership between ${partnership.athlete.name} and ${partnership.business.name}`,
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (partnership: Partnership) => {
    setSelectedPartnership(partnership);
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedPartnership) return;

    // Find the partnership in either pending or approved list
    const isInPending = partnerships.pending.some(p => p.id === selectedPartnership.id);
    const updatedMessage = {
      id: Date.now(),
      text: message,
      sender: 'compliance',
      timestamp: new Date().toISOString()
    };

    if (isInPending) {
      const updatedPending = partnerships.pending.map(p => {
        if (p.id === selectedPartnership.id) {
          return {
            ...p,
            messages: [...p.messages, updatedMessage]
          };
        }
        return p;
      });
      
      setPartnerships({
        ...partnerships,
        pending: updatedPending
      });
    } else {
      const updatedApproved = partnerships.approved.map(p => {
        if (p.id === selectedPartnership.id) {
          return {
            ...p,
            messages: [...p.messages, updatedMessage]
          };
        }
        return p;
      });
      
      setPartnerships({
        ...partnerships,
        approved: updatedApproved
      });
    }
    
    // Update selected partnership with new message
    setSelectedPartnership({
      ...selectedPartnership,
      messages: [...selectedPartnership.messages, updatedMessage]
    });
    
    setMessage('');
    
    toast({
      title: "Message Sent",
      description: `Your message has been sent regarding the partnership between ${selectedPartnership.athlete.name} and ${selectedPartnership.business.name}`,
    });
  };

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#121212]">
        <div className="animate-spin w-8 h-8 border-4 border-[#f03c3c] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-12">
      <div className="bg-[#1a1a1a] border-b border-[#333] px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center">
            <div className="bg-[rgba(240,60,60,0.15)] p-2 rounded-full mr-4">
              <Shield className="h-6 w-6 text-[#f03c3c]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">NIL Compliance Dashboard</h1>
              <p className="text-gray-800">{userData.school} | {userData.name}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1a1a1a] border-[#333] text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Pending Approvals</CardDescription>
              <CardTitle className="text-3xl flex items-center">
                {partnerships.pending.length}
                <AlertCircle className="ml-2 h-5 w-5 text-[#f03c3c]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">Partnerships awaiting your review</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a1a1a] border-[#333] text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Active Athletes</CardDescription>
              <CardTitle className="text-3xl flex items-center">
                24
                <Users className="ml-2 h-5 w-5 text-[#f03c3c]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">Athletes with active NIL deals</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a1a1a] border-[#333] text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Total Approved</CardDescription>
              <CardTitle className="text-3xl flex items-center">
                {partnerships.approved.length}
                <Sparkles className="ml-2 h-5 w-5 text-[#f03c3c]" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400">Partnerships approved this year</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Partnership tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-[#222] border border-[#333] mb-4 w-full grid grid-cols-2 max-w-md">
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-[rgba(240,60,60,0.15)] data-[state=active]:text-white"
            >
              Pending Review
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              className="data-[state=active]:bg-[rgba(240,60,60,0.15)] data-[state=active]:text-white"
            >
              Approved
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card className="bg-[#1a1a1a] border-[#333] text-white">
              <CardHeader>
                <CardTitle>Pending Partnership Approvals</CardTitle>
                <CardDescription className="text-gray-400">
                  Review and approve NIL partnerships for your student athletes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#333] hover:bg-[#222]">
                      <TableHead>Athlete</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Compensation</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerships.pending.length === 0 ? (
                      <TableRow className="border-[#333] hover:bg-[#222]">
                        <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                          No pending partnerships to review
                        </TableCell>
                      </TableRow>
                    ) : (
                      partnerships.pending.map((partnership) => (
                        <TableRow key={partnership.id} className="border-[#333] hover:bg-[#222]">
                          <TableCell>
                            <div>
                              <div className="font-medium">{partnership.athlete.name}</div>
                              <div className="text-sm text-gray-600">{partnership.athlete.sport}, {partnership.athlete.year}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{partnership.business.name}</div>
                              <div className="text-sm text-gray-600">{partnership.business.type}</div>
                            </div>
                          </TableCell>
                          <TableCell>{partnership.details.type}</TableCell>
                          <TableCell>{partnership.details.compensation}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-gray-600" />
                              {partnership.details.submittedDate}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="hover:bg-[rgba(240,60,60,0.15)] text-white"
                                    onClick={() => handleViewDetails(partnership)}
                                  >
                                    <Eye className="h-4 w-4 text-[#f03c3c]" />
                                    <span className="ml-1">Details</span>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[700px] bg-[#1a1a1a] border-[#333] text-white">
                                  <DialogHeader>
                                    <DialogTitle>Partnership Details</DialogTitle>
                                    <DialogDescription className="text-gray-400">
                                      Review all details of the partnership between {partnership.athlete.name} and {partnership.business.name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="grid gap-6 py-4">
                                    <Accordion type="single" collapsible className="w-full">
                                      <AccordionItem value="athlete" className="border-[#333]">
                                        <AccordionTrigger className="text-white hover:text-white hover:bg-[rgba(240,60,60,0.1)] px-4 py-2 rounded-md">
                                          <div className="flex items-center">
                                            <div className="mr-2 h-5 w-5 rounded-full bg-[rgba(240,60,60,0.15)] flex items-center justify-center">
                                              <Users className="h-3 w-3 text-[#f03c3c]" />
                                            </div>
                                            <span>Athlete Information</span>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pt-2 pb-4 bg-[#222] rounded-md mb-2">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Name:</p>
                                              <p>{partnership.athlete.name}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Sport:</p>
                                              <p>{partnership.athlete.sport}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Year:</p>
                                              <p>{partnership.athlete.year}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Academic Status:</p>
                                              <p>{partnership.athlete.academicStatus}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Contact Email:</p>
                                              <p>{partnership.athlete.email}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Phone:</p>
                                              <p>{partnership.athlete.phone}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Stats:</p>
                                              <p>{partnership.athlete.stats}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Social Media:</p>
                                              <p>
                                                {partnership.athlete.socialMedia?.instagram || 'N/A'} 
                                                {partnership.athlete.socialMedia?.twitter ? ` / ${partnership.athlete.socialMedia.twitter}` : ''} 
                                                {partnership.athlete.socialMedia?.tiktok ? ` / ${partnership.athlete.socialMedia.tiktok}` : ''}
                                              </p>
                                            </div>
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>

                                      <AccordionItem value="business" className="border-[#333]">
                                        <AccordionTrigger className="text-white hover:text-white hover:bg-[rgba(240,60,60,0.1)] px-4 py-2 rounded-md">
                                          <div className="flex items-center">
                                            <div className="mr-2 h-5 w-5 rounded-full bg-[rgba(240,60,60,0.15)] flex items-center justify-center">
                                              <Briefcase className="h-3 w-3 text-[#f03c3c]" />
                                            </div>
                                            <span>Business Information</span>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pt-2 pb-4 bg-[#222] rounded-md mb-2">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Name:</p>
                                              <p>{partnership.business.name}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Type:</p>
                                              <p>{partnership.business.type}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Contact Person:</p>
                                              <p>{partnership.business.contact}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Email:</p>
                                              <p>{partnership.business.email}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Phone:</p>
                                              <p>{partnership.business.phone}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Website:</p>
                                              <p>{partnership.business.website}</p>
                                            </div>
                                            <div className="col-span-2">
                                              <p className="text-sm font-medium text-gray-600">Address:</p>
                                              <p>{partnership.business.address}</p>
                                            </div>
                                            <div className="col-span-2">
                                              <p className="text-sm font-medium text-gray-600">Company History:</p>
                                              <p>{partnership.business.history}</p>
                                            </div>
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>

                                      <AccordionItem value="deliverables" className="border-[#333]">
                                        <AccordionTrigger className="text-white hover:text-white hover:bg-[rgba(240,60,60,0.1)] px-4 py-2 rounded-md">
                                          <div className="flex items-center">
                                            <div className="mr-2 h-5 w-5 rounded-full bg-[rgba(240,60,60,0.15)] flex items-center justify-center">
                                              <CheckCheck className="h-3 w-3 text-[#f03c3c]" />
                                            </div>
                                            <span>Deliverables & Compensation</span>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pt-2 pb-4 bg-[#222] rounded-md mb-2">
                                          <div className="space-y-4">
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Partnership Type:</p>
                                              <p className="font-medium text-white">{partnership.details.type}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Compensation:</p>
                                              <p className="font-medium text-white">{partnership.details.compensation}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Duration:</p>
                                              <p>{partnership.details.duration}</p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Deliverables:</p>
                                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                                {partnership.details.deliverables.map((item: string, idx: number) => (
                                                  <li key={idx}>{item}</li>
                                                ))}
                                              </ul>
                                            </div>
                                            {partnership.details.additionalNotes && (
                                              <div>
                                                <p className="text-sm font-medium text-gray-600">Additional Notes:</p>
                                                <p>{partnership.details.additionalNotes}</p>
                                              </div>
                                            )}
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>

                                      <AccordionItem value="messages" className="border-[#333]">
                                        <AccordionTrigger className="text-white hover:text-white hover:bg-[rgba(240,60,60,0.1)] px-4 py-2 rounded-md">
                                          <div className="flex items-center">
                                            <div className="mr-2 h-5 w-5 rounded-full bg-[rgba(240,60,60,0.15)] flex items-center justify-center">
                                              <MessageSquare className="h-3 w-3 text-[#f03c3c]" />
                                            </div>
                                            <span>Messages</span>
                                            {partnership.messages.length > 0 && (
                                              <Badge className="ml-2 bg-[rgba(240,60,60,0.2)] text-[#f03c3c] border-none">
                                                {partnership.messages.length}
                                              </Badge>
                                            )}
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-4 pt-2 pb-4 bg-[#222] rounded-md mb-2">
                                          <div className="space-y-4">
                                            <div className="h-48 overflow-y-auto border border-[#333] rounded-md p-3 bg-[#1a1a1a]">
                                              {partnership.messages.length === 0 ? (
                                                <p className="text-gray-400 text-center py-4">No messages yet</p>
                                              ) : (
                                                <div className="space-y-3">
                                                  {partnership.messages.map((msg: any) => (
                                                    <div 
                                                      key={msg.id} 
                                                      className={`p-3 rounded-md ${msg.sender === 'compliance' ? 'bg-[rgba(240,60,60,0.15)] ml-6' : 'bg-[#333] mr-6'}`}
                                                    >
                                                      <p className="text-sm font-medium">{msg.sender === 'compliance' ? 'You' : 'Athlete/Business'}</p>
                                                      <p>{msg.text}</p>
                                                      <p className="text-xs text-gray-600 mt-1">
                                                        {new Date(msg.timestamp).toLocaleString()}
                                                      </p>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Textarea 
                                                placeholder="Type your message here..."
                                                className="bg-[#222] border-[#333] resize-none min-h-[80px]"
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                              />
                                            </div>
                                            <Button 
                                              className="w-full bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] hover:from-[#d42e2e] hover:to-[#e34c4c]"
                                              onClick={handleSendMessage}
                                              disabled={!message.trim()}
                                            >
                                              <Send className="h-4 w-4 mr-2" />
                                              Send Message
                                            </Button>
                                          </div>
                                        </AccordionContent>
                                      </AccordionItem>
                                    </Accordion>
                                  </div>

                                  <DialogFooter className="flex justify-between">
                                    <div className="flex items-center">
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleReject(partnership.id)}
                                        className="mr-2"
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        Reject
                                      </Button>
                                      <Button
                                        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                                        onClick={() => handleApprove(partnership.id)}
                                      >
                                        <Check className="h-4 w-4 mr-2" />
                                        Approve
                                      </Button>
                                    </div>
                                    <DialogClose asChild>
                                      <Button variant="outline" className="bg-transparent border-[#333] text-white hover:bg-[#222] hover:text-white">
                                        Close
                                      </Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button 
                                size="sm" 
                                onClick={() => handleApprove(partnership.id)}
                                className="bg-[rgba(0,180,0,0.2)] text-green-400 hover:bg-[rgba(0,180,0,0.3)]"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleReject(partnership.id)}
                                className="bg-[rgba(240,60,60,0.2)] text-[#f03c3c] hover:bg-[rgba(240,60,60,0.3)]"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="approved">
            <Card className="bg-[#1a1a1a] border-[#333] text-white">
              <CardHeader>
                <CardTitle>Approved Partnerships</CardTitle>
                <CardDescription className="text-gray-600">
                  All NIL partnerships that have been approved
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#333] hover:bg-[#222]">
                      <TableHead>Athlete</TableHead>
                      <TableHead>Business</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Compensation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerships.approved.length === 0 ? (
                      <TableRow className="border-[#333] hover:bg-[#222]">
                        <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                          No approved partnerships yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      partnerships.approved.map((partnership) => (
                        <TableRow key={partnership.id} className="border-[#333] hover:bg-[#222]">
                          <TableCell>
                            <div>
                              <div className="font-medium">{partnership.athlete.name}</div>
                              <div className="text-sm text-gray-600">{partnership.athlete.sport}, {partnership.athlete.year}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{partnership.business.name}</div>
                              <div className="text-sm text-gray-600">{partnership.business.type}</div>
                            </div>
                          </TableCell>
                          <TableCell>{partnership.details.type}</TableCell>
                          <TableCell>{partnership.details.compensation}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                              Approved
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-gray-600" />
                              {partnership.details.approvedDate}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="hover:bg-[rgba(240,60,60,0.15)] text-white"
                                  onClick={() => handleViewDetails(partnership)}
                                >
                                  <Eye className="h-4 w-4 text-[#f03c3c]" />
                                  <span className="ml-1">Details</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[700px] bg-[#1a1a1a] border-[#333] text-white">
                                <DialogHeader>
                                  <DialogTitle>Partnership Details</DialogTitle>
                                  <DialogDescription className="text-gray-600">
                                    Review all details of the partnership between {partnership.athlete.name} and {partnership.business.name}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="grid gap-6 py-4">
                                  <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="athlete" className="border-[#333]">
                                      <AccordionTrigger className="text-white hover:text-white hover:bg-[rgba(240,60,60,0.1)] px-4 py-2 rounded-md">
                                        <div className="flex items-center">
                                          <div className="mr-2 h-5 w-5 rounded-full bg-[rgba(240,60,60,0.15)] flex items-center justify-center">
                                            <Users className="h-3 w-3 text-[#f03c3c]" />
                                          </div>
                                          <span>Athlete Information</span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pt-2 pb-4 bg-[#222] rounded-md mb-2">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Name:</p>
                                            <p>{partnership.athlete.name}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Sport:</p>
                                            <p>{partnership.athlete.sport}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Year:</p>
                                            <p>{partnership.athlete.year}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Academic Status:</p>
                                            <p>{partnership.athlete.academicStatus}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Contact Email:</p>
                                            <p>{partnership.athlete.email}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Phone:</p>
                                            <p>{partnership.athlete.phone}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Stats:</p>
                                            <p>{partnership.athlete.stats}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Social Media:</p>
                                            <p>{partnership.athlete.socialMedia.instagram || 'N/A'} {partnership.athlete.socialMedia.twitter ? `/ ${partnership.athlete.socialMedia.twitter}` : ''} {partnership.athlete.socialMedia.tiktok ? `/ ${partnership.athlete.socialMedia.tiktok}` : ''}</p>
                                          </div>
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="business" className="border-[#333]">
                                      <AccordionTrigger className="text-white hover:text-white hover:bg-[rgba(240,60,60,0.1)] px-4 py-2 rounded-md">
                                        <div className="flex items-center">
                                          <div className="mr-2 h-5 w-5 rounded-full bg-[rgba(240,60,60,0.15)] flex items-center justify-center">
                                            <Briefcase className="h-3 w-3 text-[#f03c3c]" />
                                          </div>
                                          <span>Business Information</span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pt-2 pb-4 bg-[#222] rounded-md mb-2">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Name:</p>
                                            <p>{partnership.business.name}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Type:</p>
                                            <p>{partnership.business.type}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Contact Person:</p>
                                            <p>{partnership.business.contact}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Email:</p>
                                            <p>{partnership.business.email}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Phone:</p>
                                            <p>{partnership.business.phone}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Website:</p>
                                            <p>{partnership.business.website}</p>
                                          </div>
                                          <div className="col-span-2">
                                            <p className="text-sm font-medium text-gray-600">Address:</p>
                                            <p>{partnership.business.address}</p>
                                          </div>
                                          <div className="col-span-2">
                                            <p className="text-sm font-medium text-gray-600">Company History:</p>
                                            <p>{partnership.business.history}</p>
                                          </div>
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="deliverables" className="border-[#333]">
                                      <AccordionTrigger className="text-white hover:text-white hover:bg-[rgba(240,60,60,0.1)] px-4 py-2 rounded-md">
                                        <div className="flex items-center">
                                          <div className="mr-2 h-5 w-5 rounded-full bg-[rgba(240,60,60,0.15)] flex items-center justify-center">
                                            <CheckCheck className="h-3 w-3 text-[#f03c3c]" />
                                          </div>
                                          <span>Deliverables & Compensation</span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pt-2 pb-4 bg-[#222] rounded-md mb-2">
                                        <div className="space-y-4">
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Partnership Type:</p>
                                            <p className="font-medium text-white">{partnership.details.type}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Compensation:</p>
                                            <p className="font-medium text-white">{partnership.details.compensation}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Duration:</p>
                                            <p>{partnership.details.duration}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Approved Date:</p>
                                            <p>{partnership.details.approvedDate}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-600">Deliverables:</p>
                                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                              {partnership.details.deliverables.map((item: string, idx: number) => (
                                                <li key={idx}>{item}</li>
                                              ))}
                                            </ul>
                                          </div>
                                          {partnership.details.additionalNotes && (
                                            <div>
                                              <p className="text-sm font-medium text-gray-600">Additional Notes:</p>
                                              <p>{partnership.details.additionalNotes}</p>
                                            </div>
                                          )}
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>

                                    <AccordionItem value="messages" className="border-[#333]">
                                      <AccordionTrigger className="text-white hover:text-white hover:bg-[rgba(240,60,60,0.1)] px-4 py-2 rounded-md">
                                        <div className="flex items-center">
                                          <div className="mr-2 h-5 w-5 rounded-full bg-[rgba(240,60,60,0.15)] flex items-center justify-center">
                                            <MessageSquare className="h-3 w-3 text-[#f03c3c]" />
                                          </div>
                                          <span>Messages</span>
                                          {partnership.messages.length > 0 && (
                                            <Badge className="ml-2 bg-[rgba(240,60,60,0.2)] text-[#f03c3c] border-none">
                                              {partnership.messages.length}
                                            </Badge>
                                          )}
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pt-2 pb-4 bg-[#222] rounded-md mb-2">
                                        <div className="space-y-4">
                                          <div className="h-48 overflow-y-auto border border-[#333] rounded-md p-3 bg-[#1a1a1a]">
                                            {partnership.messages.length === 0 ? (
                                              <p className="text-gray-600 text-center py-4">No messages yet</p>
                                            ) : (
                                              <div className="space-y-3">
                                                {partnership.messages.map((msg: any) => (
                                                  <div 
                                                    key={msg.id} 
                                                    className={`p-3 rounded-md ${msg.sender === 'compliance' ? 'bg-[rgba(240,60,60,0.15)] ml-6' : 'bg-[#333] mr-6'}`}
                                                  >
                                                    <p className="text-sm font-medium">{msg.sender === 'compliance' ? 'You' : 'Athlete/Business'}</p>
                                                    <p>{msg.text}</p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                      {new Date(msg.timestamp).toLocaleString()}
                                                    </p>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Textarea 
                                              placeholder="Type your message here..."
                                              className="bg-[#222] border-[#333] resize-none min-h-[80px]"
                                              value={message}
                                              onChange={(e) => setMessage(e.target.value)}
                                            />
                                          </div>
                                          <Button 
                                            className="w-full bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] hover:from-[#d42e2e] hover:to-[#e34c4c]"
                                            onClick={handleSendMessage}
                                            disabled={!message.trim()}
                                          >
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Message
                                          </Button>
                                        </div>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                </div>

                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline" className="bg-transparent border-[#333] text-white hover:bg-[#222] hover:text-white">
                                      Close
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}