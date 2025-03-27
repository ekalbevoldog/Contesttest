import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SiInstagram, SiTiktok, SiFacebook } from "react-icons/si";
import { RefreshCw, Trash2, ExternalLink, PlusCircle, Save, Paintbrush, Globe, Link2, UserCircle, Share2, Smartphone, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SocialHandle {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  [key: string]: string | undefined;
}

interface ProfileButton {
  id: string;
  label: string;
  url: string;
  type?: string;
}

interface ProfileFormData {
  profileLinkEnabled: boolean;
  profileLinkId: string;
  profileLinkBio: string;
  profileLinkPhotoUrl: string;
  profileLinkTheme: string;
  profileLinkBackgroundColor: string;
  profileLinkTextColor: string;
  profileLinkAccentColor: string;
  socialHandles: SocialHandle;
  profileLinkButtons: ProfileButton[];
}

export default function AthleteProfileLinkConfig() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [refreshingMetrics, setRefreshingMetrics] = useState(false);
  
  // Form setup
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: {
      profileLinkEnabled: false,
      profileLinkId: "",
      profileLinkBio: "",
      profileLinkPhotoUrl: "",
      profileLinkTheme: "athletic",
      profileLinkBackgroundColor: "#111111",
      profileLinkTextColor: "#ffffff",
      profileLinkAccentColor: "#ff4500",
      socialHandles: {
        instagram: "",
        facebook: "",
        twitter: "",
        tiktok: ""
      },
      profileLinkButtons: []
    }
  });

  // Watch values for live preview
  const formValues = watch();
  
  // Load athlete profile data
  useEffect(() => {
    async function loadProfileData() {
      try {
        setIsLoading(true);
        const res = await apiRequest("GET", "/api/profile");
        const data = await res.json();
        
        if (data && !data.error) {
          // Set form values from data
          setValue("profileLinkEnabled", data.profileLinkEnabled || false);
          setValue("profileLinkId", data.profileLinkId || generateProfileId(data.name));
          setValue("profileLinkBio", data.profileLinkBio || "");
          setValue("profileLinkPhotoUrl", data.profileLinkPhotoUrl || "");
          setValue("profileLinkTheme", data.profileLinkTheme || "athletic");
          setValue("profileLinkBackgroundColor", data.profileLinkBackgroundColor || "#111111");
          setValue("profileLinkTextColor", data.profileLinkTextColor || "#ffffff");
          setValue("profileLinkAccentColor", data.profileLinkAccentColor || "#ff4500");
          setValue("socialHandles", data.socialHandles || {});
          setValue("profileLinkButtons", data.profileLinkButtons || []);
          
          // Set preview URL
          if (data.profileLinkId) {
            setPreviewUrl(`/p/${data.profileLinkId}`);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load profile data", err);
        toast({
          title: "Error loading profile",
          description: "Could not load your profile data. Please try again later.",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    }
    
    loadProfileData();
  }, [setValue, toast]);
  
  // Generate a URL-friendly profile ID based on name
  function generateProfileId(name: string) {
    if (!name) return "";
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${base}${randomSuffix}`;
  }
  
  // Save profile data
  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      const res = await apiRequest("POST", "/api/athlete-profile/profile-link", data);
      const responseData = await res.json();
      
      if (responseData.error) {
        throw new Error(responseData.error);
      }
      
      toast({
        title: "Profile saved",
        description: "Your public profile has been updated successfully.",
      });
      
      // Update preview URL if ID changed
      if (data.profileLinkId) {
        setPreviewUrl(`/p/${data.profileLinkId}`);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to save profile", err);
      toast({
        title: "Error saving profile",
        description: "Could not save your profile. Please try again later.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  // Add new profile button
  const addProfileButton = () => {
    const buttons = formValues.profileLinkButtons || [];
    setValue("profileLinkButtons", [
      ...buttons, 
      { 
        id: `btn-${Date.now()}`, 
        label: "New Link", 
        url: "https://",
        type: "link"
      }
    ]);
  };
  
  // Remove profile button
  const removeProfileButton = (id: string) => {
    const buttons = formValues.profileLinkButtons || [];
    setValue("profileLinkButtons", buttons.filter(btn => btn.id !== id));
  };
  
  // Update a button property
  const updateButton = (id: string, field: string, value: string) => {
    const buttons = formValues.profileLinkButtons || [];
    const updatedButtons = buttons.map(btn => 
      btn.id === id ? { ...btn, [field]: value } : btn
    );
    setValue("profileLinkButtons", updatedButtons);
  };
  
  // Refresh metrics
  const refreshMetrics = async () => {
    try {
      setRefreshingMetrics(true);
      const res = await apiRequest("GET", `/api/athlete-profile/${formValues.profileLinkId}/refresh-metrics`);
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      toast({
        title: "Metrics refreshed",
        description: "Your social media metrics have been updated.",
      });
      
      setRefreshingMetrics(false);
    } catch (err) {
      console.error("Failed to refresh metrics", err);
      toast({
        title: "Error refreshing metrics",
        description: "Could not refresh your metrics. Please try again later.",
        variant: "destructive"
      });
      setRefreshingMetrics(false);
    }
  };
  
  // Update social handle
  const updateSocialHandle = (platform: string, value: string) => {
    const handles = { ...formValues.socialHandles } || {};
    handles[platform] = value;
    setValue("socialHandles", handles);
  };

  return (
    <div className="pb-10">
      {/* Hero section with gradient */}
      <div className="relative bg-gradient-to-br from-black to-zinc-900 mb-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-amber-500"></div>
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-red-500 rounded-full filter blur-3xl"></div>
          <div className="absolute -top-1/4 -right-1/4 w-72 h-72 bg-amber-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="container relative z-10 py-16">
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-8 w-1 bg-gradient-to-b from-red-600 to-amber-500"></div>
            <h2 className="text-white text-sm font-bold uppercase tracking-widest">Profile Manager</h2>
          </div>
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
            CREATE YOUR <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">ATHLETE HUB</span>
          </h1>
          <p className="mt-4 text-xl text-zinc-400 max-w-2xl">
            Design your personal brand page to showcase your achievements, connect with sponsors, and grow your influence
          </p>
        </div>
      </div>
      
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Configuration Panel */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)}>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-8 w-full justify-start gap-1 border-b-0 bg-transparent p-0">
                  <TabsTrigger 
                    value="general" 
                    className="relative data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none rounded-md data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-gradient-to-r data-[state=active]:after:from-red-600 data-[state=active]:after:to-amber-500"
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger 
                    value="social" 
                    className="relative data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none rounded-md data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-gradient-to-r data-[state=active]:after:from-red-600 data-[state=active]:after:to-amber-500"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Social Media
                  </TabsTrigger>
                  <TabsTrigger 
                    value="content" 
                    className="relative data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none rounded-md data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-gradient-to-r data-[state=active]:after:from-red-600 data-[state=active]:after:to-amber-500"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Content & Links
                  </TabsTrigger>
                  <TabsTrigger 
                    value="appearance" 
                    className="relative data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none rounded-md data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-gradient-to-r data-[state=active]:after:from-red-600 data-[state=active]:after:to-amber-500"
                  >
                    <Paintbrush className="mr-2 h-4 w-4" />
                    Appearance
                  </TabsTrigger>
                </TabsList>
                
                {/* GENERAL TAB */}
                <TabsContent value="general" className="space-y-6">
                  <Card className="border-0 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 to-amber-500"></div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl font-black"><UserCircle className="h-5 w-5 text-red-500" />PROFILE SETTINGS</CardTitle>
                      <CardDescription>
                        Configure your public athlete profile settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="profileLinkEnabled" 
                          checked={formValues.profileLinkEnabled}
                          onCheckedChange={(checked) => setValue("profileLinkEnabled", checked)}
                        />
                        <Label htmlFor="profileLinkEnabled">Enable public profile page</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profileLinkId">Profile URL</Label>
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                              contested.app/p/
                            </div>
                            <Input
                              id="profileLinkId"
                              placeholder="your-unique-id"
                              {...register("profileLinkId", { required: "Profile ID is required" })}
                              className="flex-1"
                            />
                          </div>
                          {errors.profileLinkId && (
                            <p className="text-sm text-red-500">{errors.profileLinkId.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="profileLinkBio">Bio</Label>
                          <Textarea
                            id="profileLinkBio"
                            placeholder="Tell fans and sponsors about yourself"
                            {...register("profileLinkBio")}
                            className="min-h-24"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="profileLinkPhotoUrl">Profile Photo URL</Label>
                          <Input
                            id="profileLinkPhotoUrl"
                            placeholder="https://example.com/your-photo.jpg"
                            {...register("profileLinkPhotoUrl")}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button type="submit" className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold uppercase tracking-wide text-sm shadow-lg hover:opacity-90 transition-opacity">
                        <Save className="mr-2 h-4 w-4" />
                        SAVE SETTINGS
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* SOCIAL MEDIA TAB */}
                <TabsContent value="social" className="space-y-6">
                  <Card className="border-0 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 to-amber-500"></div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl font-black"><Globe className="h-5 w-5 text-red-500" />SOCIAL MEDIA ACCOUNTS</CardTitle>
                      <CardDescription>
                        Connect your social media accounts to showcase your online presence
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <SiInstagram className="text-white h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="instagram">Instagram Username</Label>
                            <Input
                              id="instagram"
                              placeholder="username"
                              value={formValues.socialHandles?.instagram || ""}
                              onChange={(e) => updateSocialHandle("instagram", e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-black to-zinc-800 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="twitter">X Username</Label>
                            <Input
                              id="twitter"
                              placeholder="username"
                              value={formValues.socialHandles?.twitter || ""}
                              onChange={(e) => updateSocialHandle("twitter", e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-black to-gray-800 flex items-center justify-center">
                            <SiTiktok className="text-white h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="tiktok">TikTok Username</Label>
                            <Input
                              id="tiktok"
                              placeholder="username"
                              value={formValues.socialHandles?.tiktok || ""}
                              onChange={(e) => updateSocialHandle("tiktok", e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                            <SiFacebook className="text-white h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="facebook">Facebook Username</Label>
                            <Input
                              id="facebook"
                              placeholder="username"
                              value={formValues.socialHandles?.facebook || ""}
                              onChange={(e) => updateSocialHandle("facebook", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="mt-4 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30 text-red-500 font-semibold"
                          onClick={refreshMetrics}
                          disabled={refreshingMetrics}
                        >
                          {refreshingMetrics ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          REFRESH METRICS
                        </Button>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                          Refreshing metrics will fetch the latest follower counts and engagement rates from your connected social accounts.
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button type="submit" className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold uppercase tracking-wide text-sm shadow-lg hover:opacity-90 transition-opacity">
                        <Save className="mr-2 h-4 w-4" />
                        SAVE SETTINGS
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* CONTENT & LINKS TAB */}
                <TabsContent value="content" className="space-y-6">
                  <Card className="border-0 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 to-amber-500"></div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl font-black"><Link2 className="h-5 w-5 text-red-500" />CONTENT & LINKS</CardTitle>
                      <CardDescription>
                        Add custom links to your profile to showcase content, sponsorships, and more
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        {formValues.profileLinkButtons?.map((button, index) => (
                          <div key={button.id} className="flex items-center space-x-3 p-3 border border-zinc-200 dark:border-zinc-800 rounded-md">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor={`button-${index}-label`}>Link Text</Label>
                                  <Input
                                    id={`button-${index}-label`}
                                    value={button.label}
                                    onChange={(e) => updateButton(button.id, "label", e.target.value)}
                                    placeholder="Button Text"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`button-${index}-url`}>URL</Label>
                                  <Input
                                    id={`button-${index}-url`}
                                    value={button.url}
                                    onChange={(e) => updateButton(button.id, "url", e.target.value)}
                                    placeholder="https://example.com"
                                  />
                                </div>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeProfileButton(button.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-100/20"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        ))}
                        
                        <Button
                          type="button" 
                          variant="outline" 
                          onClick={addProfileButton}
                          className="w-full border-dashed flex items-center justify-center py-6 bg-black/5 hover:bg-gradient-to-r hover:from-red-600/10 hover:to-amber-500/10 transition-all"
                        >
                          <PlusCircle className="mr-2 h-4 w-4 text-red-500" />
                          <span className="font-semibold">ADD LINK</span>
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button type="submit" className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold uppercase tracking-wide text-sm shadow-lg hover:opacity-90 transition-opacity">
                        <Save className="mr-2 h-4 w-4" />
                        SAVE SETTINGS
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* APPEARANCE TAB */}
                <TabsContent value="appearance" className="space-y-6">
                  <Card className="border-0 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 to-amber-500"></div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl font-black"><Paintbrush className="h-5 w-5 text-red-500" />APPEARANCE</CardTitle>
                      <CardDescription>
                        Customize the look and feel of your public profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="profileLinkTheme">Theme</Label>
                          <Select 
                            value={formValues.profileLinkTheme}
                            onValueChange={(value) => setValue("profileLinkTheme", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="athletic">Athletic (Dark with red accents)</SelectItem>
                              <SelectItem value="modern">Modern (Clean, minimalist)</SelectItem>
                              <SelectItem value="vibrant">Vibrant (Bold colors)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="profileLinkBackgroundColor">Background Color</Label>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700" 
                              style={{ backgroundColor: formValues.profileLinkBackgroundColor }}
                            />
                            <Input
                              id="profileLinkBackgroundColor"
                              type="text"
                              {...register("profileLinkBackgroundColor")}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="profileLinkTextColor">Text Color</Label>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700" 
                              style={{ backgroundColor: formValues.profileLinkTextColor }}
                            />
                            <Input
                              id="profileLinkTextColor"
                              type="text"
                              {...register("profileLinkTextColor")}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="profileLinkAccentColor">Accent Color</Label>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700" 
                              style={{ backgroundColor: formValues.profileLinkAccentColor }}
                            />
                            <Input
                              id="profileLinkAccentColor"
                              type="text"
                              {...register("profileLinkAccentColor")}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button type="submit" className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold uppercase tracking-wide text-sm shadow-lg hover:opacity-90 transition-opacity">
                        <Save className="mr-2 h-4 w-4" />
                        SAVE SETTINGS
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </div>
          
          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card className="border-0 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 to-amber-500"></div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-black"><Eye className="h-5 w-5 text-red-500" />PROFILE PREVIEW</CardTitle>
                  <CardDescription>
                    See how your profile will look to visitors
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96 overflow-hidden relative">
                  {previewUrl ? (
                    <div 
                      className="absolute inset-0 border rounded-md overflow-hidden"
                      style={{ 
                        backgroundColor: formValues.profileLinkBackgroundColor,
                        color: formValues.profileLinkTextColor
                      }}
                    >
                      {/* Header banner */}
                      <div className="w-full relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-amber-500"></div>
                        <div className="w-full h-20 bg-gradient-to-r from-black to-zinc-900 pt-4 px-3">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-3 bg-gradient-to-b from-red-600 to-amber-500"></div>
                            <h2 className="uppercase text-[10px] font-bold tracking-widest">Athlete Profile</h2>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center -mt-5">
                        <div 
                          className="h-14 w-14 rounded-full overflow-hidden"
                          style={{
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            border: `2px solid ${formValues.profileLinkAccentColor}`,
                          }}
                        >
                          {formValues.profileLinkPhotoUrl ? (
                            <img 
                              src={formValues.profileLinkPhotoUrl}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center" 
                              style={{ 
                                background: `linear-gradient(135deg, ${formValues.profileLinkAccentColor} 0%, #111 150%)` 
                              }}
                            >
                              <span className="text-white font-bold">ME</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-center p-2">
                          <p className="text-xs mt-1 px-5 text-zinc-400">
                            {formValues.profileLinkBio || "Your bio will appear here"}
                          </p>
                        </div>
                        
                        {/* Social icons preview */}
                        {Object.values(formValues.socialHandles || {}).some(value => !!value) && (
                          <div className="flex justify-center mt-2 gap-2">
                            {formValues.socialHandles?.instagram && (
                              <div 
                                className="w-7 h-7 rounded-full flex items-center justify-center" 
                                style={{ 
                                  background: `linear-gradient(135deg, ${formValues.profileLinkAccentColor} 0%, rgba(0,0,0,0.5) 150%)` 
                                }}
                              >
                                <SiInstagram className="text-white h-3 w-3" />
                              </div>
                            )}
                            {formValues.socialHandles?.twitter && (
                              <div 
                                className="w-7 h-7 rounded-full flex items-center justify-center" 
                                style={{ 
                                  background: `linear-gradient(135deg, ${formValues.profileLinkAccentColor} 0%, rgba(0,0,0,0.5) 150%)` 
                                }}
                              >
                                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                              </div>
                            )}
                            {formValues.socialHandles?.tiktok && (
                              <div 
                                className="w-7 h-7 rounded-full flex items-center justify-center" 
                                style={{ 
                                  background: `linear-gradient(135deg, ${formValues.profileLinkAccentColor} 0%, rgba(0,0,0,0.5) 150%)` 
                                }}
                              >
                                <SiTiktok className="text-white h-3 w-3" />
                              </div>
                            )}
                            {formValues.socialHandles?.facebook && (
                              <div 
                                className="w-7 h-7 rounded-full flex items-center justify-center" 
                                style={{ 
                                  background: `linear-gradient(135deg, ${formValues.profileLinkAccentColor} 0%, rgba(0,0,0,0.5) 150%)` 
                                }}
                              >
                                <SiFacebook className="text-white h-3 w-3" />
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Links preview */}
                        <div className="w-full px-3 mt-3 space-y-2">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">
                            {formValues.profileLinkButtons?.length > 0 ? "Featured Content" : ""}
                          </p>
                          
                          {formValues.profileLinkButtons?.slice(0, 3).map((button) => (
                            <div
                              key={button.id}
                              className="flex items-center justify-between w-full p-2 rounded-md text-xs"
                              style={{ 
                                background: `linear-gradient(to right, rgba(0,0,0,0.3), ${formValues.profileLinkAccentColor}10)`,
                                borderLeft: `2px solid ${formValues.profileLinkAccentColor}`,
                                color: formValues.profileLinkTextColor,
                              }}
                            >
                              <span>{button.label || "Link"}</span>
                              <ExternalLink className="h-3 w-3 opacity-70" />
                            </div>
                          ))}
                          
                          {formValues.profileLinkButtons?.length > 3 && (
                            <div className="text-center text-[10px] text-zinc-500">
                              +{formValues.profileLinkButtons.length - 3} more links
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-zinc-500">Save your profile to see a preview</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {previewUrl && (
                    <>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 w-full">
                        Your public profile URL:
                      </p>
                      <div className="flex items-center w-full space-x-2">
                        <code className="text-xs bg-muted p-2 rounded flex-1 overflow-x-auto">
                          contested.app{previewUrl}
                        </code>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(`https://contested.app${previewUrl}`);
                            toast({ title: "URL copied", description: "Profile URL copied to clipboard" });
                          }}
                        >
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </Button>
                      </div>
                      <Button 
                        type="button" 
                        className="w-full mt-2 bg-gradient-to-r from-red-600 to-amber-500 text-white font-bold uppercase tracking-wide text-sm shadow-lg hover:opacity-90 transition-opacity"
                        onClick={() => window.open(previewUrl, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        VIEW LIVE PROFILE
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get social URLs from handles
function getSocialUrl(platform: string, handle: string): string {
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'twitter':
      return `https://x.com/${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'tiktok':
      return `https://tiktok.com/@${handle}`;
    default:
      return `https://${platform}.com/${handle}`;
  }
}