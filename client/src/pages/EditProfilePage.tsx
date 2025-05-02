import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedProtectedRoute } from "@/lib/unified-protected-route";
import { Loader2, Upload, User as UserIcon, Mail, Phone, MapPin, Briefcase, Calendar, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Profile schema for validation
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  
  // Business-specific fields
  company: z.string().optional(),
  position: z.string().optional(),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  
  // Athlete-specific fields
  sport: z.string().optional(),
  division: z.string().optional(),
  school: z.string().optional(),
  content_style: z.string().optional(),
  compensation_goals: z.string().optional(),
  follower_count: z.string().optional().transform(val => val ? parseInt(val) : undefined)
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const EditProfilePage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("basic");
  
  const { user, userType, profile, isLoading, error, refetchProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      bio: "",
      company: "",
      position: "",
      industry: "",
      company_size: "",
      sport: "",
      division: "",
      school: "",
      content_style: "",
      compensation_goals: "",
      follower_count: ""
    }
  });

  // Update form values when profile data is loaded
  useEffect(() => {
    if (!isLoading && profile) {
      // Set preview URL if profile image exists
      if (profile.profile_image) {
        setPreviewUrl(profile.profile_image);
      }
      
      // Populate form with existing data
      form.reset({
        name: profile.name || user?.name || '',
        email: profile.email || user?.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        
        // Business fields
        company: profile.company || '',
        position: profile.position || '',
        industry: profile.industry || '',
        company_size: profile.company_size || '',
        
        // Athlete fields
        sport: profile.sport || '',
        division: profile.division || '',
        school: profile.school || '',
        content_style: profile.content_style || '',
        compensation_goals: profile.compensation_goals || '',
        follower_count: profile.follower_count ? profile.follower_count.toString() : ''
      });
    }
  }, [isLoading, profile, user, form]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest("PATCH", "/api/profile", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      if (refetchProfile) {
        refetchProfile();
      }
    },
    onError: (error) => {
      toast({
        title: "Error updating profile",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profile_image", file);
      
      const response = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setPreviewUrl(data.imageUrl);
      toast({
        title: "Image uploaded",
        description: "Your profile image has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      if (refetchProfile) {
        refetchProfile();
      }
    },
    onError: (error) => {
      toast({
        title: "Error uploading image",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Image removal mutation
  const removeImageMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/profile/remove-image");
      return await response.json();
    },
    onSuccess: () => {
      setPreviewUrl(null);
      toast({
        title: "Image removed",
        description: "Your profile image has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      if (refetchProfile) {
        refetchProfile();
      }
    },
    onError: (error) => {
      toast({
        title: "Error removing image",
        description: error.message || "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle image selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Upload image
    setIsUploading(true);
    uploadImageMutation.mutate(file, {
      onSettled: () => {
        setIsUploading(false);
      }
    });
  };

  // Handle form submission
  const onSubmit = async (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  // Handle image removal
  const handleRemoveImage = () => {
    removeImageMutation.mutate();
  };
  
  // Return to profile page
  const handleCancel = () => {
    navigate("/profile");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4 md:px-6">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <Button variant="outline" onClick={handleCancel}>
            Back to Profile
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Image</CardTitle>
            <CardDescription>
              Upload a profile image to personalize your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {previewUrl ? (
                    <AvatarImage src={previewUrl} alt="Profile" />
                  ) : (
                    <AvatarFallback>
                      <UserIcon className="h-12 w-12" />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                {previewUrl && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-white"
                    disabled={removeImageMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-image" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-secondary">
                    <Upload className="h-5 w-5" />
                    {isUploading ? "Uploading..." : "Upload new image"}
                  </div>
                  <Input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isUploading}
                  />
                </Label>
                <p className="text-sm text-muted-foreground">
                  JPEG, PNG, GIF or WebP, max 5MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your profile details
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                {userType === 'business' && (
                  <TabsTrigger value="business">Business Details</TabsTrigger>
                )}
                {userType === 'athlete' && (
                  <TabsTrigger value="athlete">Athlete Details</TabsTrigger>
                )}
              </TabsList>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <TabsContent value="basic" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Enter your full name" {...field} />
                              <UserIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Enter your email" {...field} />
                              <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Enter your phone number" {...field} />
                              <Phone className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="City, State, Country" {...field} />
                              <MapPin className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tell us about yourself" 
                              className="min-h-[120px] resize-y"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description about yourself that will appear on your profile
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  {userType === 'business' && (
                    <TabsContent value="business" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input placeholder="Enter company name" {...field} />
                                <Briefcase className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your job title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your industry" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="company_size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Size</FormLabel>
                            <FormControl>
                              <Input placeholder="Number of employees" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  )}
                  
                  {userType === 'athlete' && (
                    <TabsContent value="athlete" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="sport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sport</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your sport" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="division"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Division</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your division" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="school"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your school" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="follower_count"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Social Media Followers</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Total follower count" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="content_style"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content Style</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your content style" 
                                className="min-h-[80px] resize-y"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="compensation_goals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Compensation Goals</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your compensation expectations" 
                                className="min-h-[80px] resize-y"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  )}
                  
                  <Separator />
                  
                  <CardFooter className="flex justify-between px-0">
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Protect this route
export default function ProtectedEditProfilePage() {
  return (
    <UnifiedProtectedRoute path="/edit-profile" component={EditProfilePage} />
  );
}