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
import { Shield, Check, X, Eye, AlertCircle, Calendar, Users, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';

// Mock data for pending approvals
const pendingPartnerships = [
  {
    id: 1,
    athlete: {
      name: 'Sarah Johnson',
      sport: 'Basketball',
      year: 'Junior'
    },
    business: {
      name: 'Local Sports Shop',
      type: 'Retail'
    },
    details: {
      compensation: '$500',
      type: 'Social Media',
      submittedDate: '2025-03-20'
    },
    status: 'pending'
  },
  {
    id: 2,
    athlete: {
      name: 'Michael Chen',
      sport: 'Soccer',
      year: 'Sophomore'
    },
    business: {
      name: 'City Cafe',
      type: 'Food & Beverage'
    },
    details: {
      compensation: '$300',
      type: 'In-person Appearance',
      submittedDate: '2025-03-22'
    },
    status: 'pending'
  },
  {
    id: 3,
    athlete: {
      name: 'Aisha Williams',
      sport: 'Track & Field',
      year: 'Senior'
    },
    business: {
      name: 'Runner\'s World',
      type: 'Retail'
    },
    details: {
      compensation: '$800',
      type: 'Product Endorsement',
      submittedDate: '2025-03-23'
    },
    status: 'pending'
  },
];

// Mock data for approved partnerships
const approvedPartnerships = [
  {
    id: 4,
    athlete: {
      name: 'David Martinez',
      sport: 'Football',
      year: 'Senior'
    },
    business: {
      name: 'Athlete Nutrition',
      type: 'Health & Wellness'
    },
    details: {
      compensation: '$1,200',
      type: 'Social Media Campaign',
      submittedDate: '2025-03-15',
      approvedDate: '2025-03-17'
    },
    status: 'approved'
  },
  {
    id: 5,
    athlete: {
      name: 'Emma Wilson',
      sport: 'Swimming',
      year: 'Junior'
    },
    business: {
      name: 'AquaTech Gear',
      type: 'Sporting Goods'
    },
    details: {
      compensation: '$650',
      type: 'Product Testing & Review',
      submittedDate: '2025-03-10',
      approvedDate: '2025-03-12'
    },
    status: 'approved'
  }
];

export default function ComplianceDashboard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [userData, setUserData] = useState<any>(null);
  const [partnerships, setPartnerships] = useState({
    pending: pendingPartnerships,
    approved: approvedPartnerships
  });
  
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
              <p className="text-gray-400">{userData.school} | {userData.name}</p>
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
              <p className="text-sm text-gray-300">Partnerships awaiting your review</p>
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
              <p className="text-sm text-gray-300">Athletes with active NIL deals</p>
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
              <p className="text-sm text-gray-300">Partnerships approved this year</p>
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
                              <div className="text-sm text-gray-400">{partnership.athlete.sport}, {partnership.athlete.year}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{partnership.business.name}</div>
                              <div className="text-sm text-gray-400">{partnership.business.type}</div>
                            </div>
                          </TableCell>
                          <TableCell>{partnership.details.type}</TableCell>
                          <TableCell>{partnership.details.compensation}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                              {partnership.details.submittedDate}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="hover:bg-[rgba(240,60,60,0.15)] text-white"
                              >
                                <Eye className="h-4 w-4 text-[#f03c3c]" />
                                <span className="ml-1">Details</span>
                              </Button>
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
                <CardDescription className="text-gray-400">
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerships.approved.length === 0 ? (
                      <TableRow className="border-[#333] hover:bg-[#222]">
                        <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                          No approved partnerships yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      partnerships.approved.map((partnership) => (
                        <TableRow key={partnership.id} className="border-[#333] hover:bg-[#222]">
                          <TableCell>
                            <div>
                              <div className="font-medium">{partnership.athlete.name}</div>
                              <div className="text-sm text-gray-400">{partnership.athlete.sport}, {partnership.athlete.year}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{partnership.business.name}</div>
                              <div className="text-sm text-gray-400">{partnership.business.type}</div>
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
                              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                              {partnership.details.approvedDate}
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
        </Tabs>
      </div>
    </div>
  );
}