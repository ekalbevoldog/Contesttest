import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

// Define a comprehensive profile data interface to type-check all possible profile fields
interface ProfileData {
  id?: string | number;
  name?: string;
  email?: string;
  phone?: string;
  joined?: string;
  lastActive?: string;
  position?: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  sport?: string;
  division?: string;
  school?: string;
  follower_count?: number;
  content_style?: string;
  compensation_goals?: string;
  industry?: string;
  company_size?: string;
  product_type?: string;
  campaign_vibe?: string;
  audience_goals?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  profile_image?: string;
  website?: string;
  linkedin_url?: string;
  linkedin?: string;
  twitter_url?: string;
  twitter?: string;
  instagram_url?: string;
  instagram?: string;
  [key: string]: any; // For any other fields that might be in the profile
}
import { Loader2, User, Mail, Phone, Link as LinkIcon, Calendar, Building, Edit, MapPin, ArrowLeft, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UnifiedProtectedRoute } from '@/lib/unified-protected-route';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ProfileContent = () => {
  const { user, isLoading, profile, userType } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get effective role from multiple sources
  const role = userType || user?.role || user?.user_metadata?.role;
  
  // Format date helper
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            Loading your profile information...
          </p>
        </div>
      </div>
    );
  }
  
  // Not authenticated - redirect to login
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center max-w-md mx-auto">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Not Available</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your profile information
          </p>
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }
  
  const getDashboardLink = () => {
    if (role === 'athlete') return '/athlete/dashboard';
    if (role === 'business') return '/business/dashboard';
    if (role === 'compliance') return '/compliance/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/';
  };

  // Extract social links
  const socialLinks = [
    { name: 'Website', url: profile?.website, icon: <LinkIcon className="h-4 w-4" /> },
    { name: 'LinkedIn', url: profile?.linkedin_url || profile?.linkedin, icon: <ExternalLink className="h-4 w-4" /> },
    { name: 'Twitter', url: profile?.twitter_url || profile?.twitter, icon: <ExternalLink className="h-4 w-4" /> },
    { name: 'Instagram', url: profile?.instagram_url || profile?.instagram, icon: <ExternalLink className="h-4 w-4" /> },
  ].filter(link => link.url);

  // Determine user profile data to display
  const profileData: ProfileData = {
    name: profile?.name || user?.user_metadata?.full_name || 'Anonymous User',
    email: profile?.email || user?.email,
    phone: profile?.phone || 'Not provided',
    joined: formatDate(user?.created_at || profile?.created_at),
    lastActive: formatDate(user?.last_sign_in_at || profile?.updated_at),
    ...(profile as ProfileData || {})
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(getDashboardLink())}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="border lg:col-span-1 shadow-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.profile_image} alt={profileData.name} />
                <AvatarFallback className="text-2xl">
                  {profileData.name?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl">{profileData.name}</CardTitle>
            <CardDescription>
              {profileData.position || profileData.title || 'Member'}
              {profileData.company && (
                <span> at {profileData.company}</span>
              )}
            </CardDescription>
            
            <div className="mt-2">
              <Badge variant="outline" className="capitalize">
                {role || 'User'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{profileData.email || 'No email provided'}</span>
              </div>
              
              {profileData.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{profileData.phone}</span>
                </div>
              )}
              
              {profileData.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{profileData.location}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Joined {profileData.joined}</span>
              </div>
            </div>
            
            {socialLinks.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Social Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((link, i) => (
                      <a 
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      >
                        {link.icon}
                        <span className="ml-1">{link.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => navigate('/edit-profile')}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardFooter>
        </Card>

        {/* Detailed Profile Information */}
        <Card className="border lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Your detailed profile information
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="about">
              <TabsList className="mb-4">
                <TabsTrigger value="about">About</TabsTrigger>
                {role === 'athlete' && (
                  <TabsTrigger value="athlete">Athletic Info</TabsTrigger>
                )}
                {role === 'business' && (
                  <TabsTrigger value="business">Business Info</TabsTrigger>
                )}
                <TabsTrigger value="account">Account</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-6">
                {profileData.bio && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Bio</h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {profileData.bio}
                    </p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{profileData.name}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{profileData.email}</p>
                    </div>
                    
                    {profileData.company && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Company/Organization</p>
                        <p className="font-medium">{profileData.company}</p>
                      </div>
                    )}
                    
                    {profileData.position && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Position/Title</p>
                        <p className="font-medium">{profileData.position}</p>
                      </div>
                    )}
                    
                    {profileData.phone && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{profileData.phone}</p>
                      </div>
                    )}
                    
                    {profileData.location && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{profileData.location}</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {role === 'athlete' && (
                <TabsContent value="athlete" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Athlete Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profileData.sport && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Sport</p>
                          <p className="font-medium">{profileData.sport}</p>
                        </div>
                      )}
                      
                      {profileData.division && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Division</p>
                          <p className="font-medium">{profileData.division}</p>
                        </div>
                      )}
                      
                      {profileData.school && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">School/University</p>
                          <p className="font-medium">{profileData.school}</p>
                        </div>
                      )}
                      
                      {profileData.follower_count && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Follower Count</p>
                          <p className="font-medium">{profileData.follower_count.toLocaleString()}</p>
                        </div>
                      )}
                      
                      {profileData.content_style && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Content Style</p>
                          <p className="font-medium">{profileData.content_style}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {profileData.compensation_goals && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Compensation Goals</h3>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {profileData.compensation_goals}
                      </p>
                    </div>
                  )}
                </TabsContent>
              )}
              
              {role === 'business' && (
                <TabsContent value="business" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Business Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profileData.industry && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Industry</p>
                          <p className="font-medium">{profileData.industry}</p>
                        </div>
                      )}
                      
                      {profileData.company_size && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Company Size</p>
                          <p className="font-medium">{profileData.company_size}</p>
                        </div>
                      )}
                      
                      {profileData.product_type && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Product Type</p>
                          <p className="font-medium">{profileData.product_type}</p>
                        </div>
                      )}
                      
                      {profileData.campaign_vibe && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Campaign Vibe</p>
                          <p className="font-medium">{profileData.campaign_vibe}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {profileData.audience_goals && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Audience Goals</h3>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {profileData.audience_goals}
                      </p>
                    </div>
                  )}
                </TabsContent>
              )}
              
              <TabsContent value="account" className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">User ID</p>
                      <p className="font-medium">{user.id}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium capitalize">{role || 'User'}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Account Created</p>
                      <p className="font-medium">{profileData.joined}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Last Active</p>
                      <p className="font-medium">{profileData.lastActive}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate(getDashboardLink())}>
              Back to Dashboard
            </Button>
            <Button onClick={() => navigate('/edit-profile')}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

// Protected route wrapper
export default function ProfilePage() {
  return (
    <UnifiedProtectedRoute path="/profile" component={ProfileContent} />
  );
}