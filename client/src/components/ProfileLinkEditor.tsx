import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PlusCircle, Trash2, Link2, ChevronRight, Instagram, Facebook, Twitter, Copy, ExternalLink } from "lucide-react";
import { SiTiktok } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

// Define a schema for the form
const profileLinkSchema = z.object({
  profileLinkEnabled: z.boolean().default(false),
  profileLinkId: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters"),
  profileLinkBio: z.string().max(150, "Bio must be less than 150 characters").optional(),
  profileLinkPhotoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  profileLinkTheme: z.string().default("default"),
  profileLinkBackgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color").default("#111111"),
  profileLinkTextColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color").default("#ffffff"),
  profileLinkAccentColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Please enter a valid hex color").default("#ff4500"),
  socialHandles: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    tiktok: z.string().optional()
  }).optional(),
  profileLinkButtons: z.array(
    z.object({
      id: z.string(),
      label: z.string().min(1, "Button label is required"),
      url: z.string().url("Please enter a valid URL")
    })
  ).optional()
});

type ProfileLinkFormValues = z.infer<typeof profileLinkSchema>;

interface ProfileLinkEditorProps {
  athleteId: number;
  onSave?: () => void;
  initialData?: any;
}

const defaultProfileLinkData = {
  profileLinkEnabled: false,
  profileLinkId: "",
  profileLinkBio: "",
  profileLinkPhotoUrl: "",
  profileLinkTheme: "default",
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
};

export default function ProfileLinkEditor({ athleteId, onSave, initialData }: ProfileLinkEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const { toast } = useToast();
  
  const form = useForm<ProfileLinkFormValues>({
    resolver: zodResolver(profileLinkSchema),
    defaultValues: initialData || defaultProfileLinkData
  });
  
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);
  
  const profileLinkButtons = form.watch("profileLinkButtons") || [];
  const profileLinkEnabled = form.watch("profileLinkEnabled");
  const profileLinkId = form.watch("profileLinkId");
  const accentColor = form.watch("profileLinkAccentColor");
  const textColor = form.watch("profileLinkTextColor");
  const backgroundColor = form.watch("profileLinkBackgroundColor");
  
  const socialHandles = form.watch("socialHandles") || {
    instagram: "",
    facebook: "",
    twitter: "",
    tiktok: ""
  };

  const profileUrl = `${window.location.origin}/p/${profileLinkId}`;
  
  const addButton = () => {
    if (!buttonLabel || !buttonUrl) {
      toast({
        title: "Missing information",
        description: "Please enter both a label and URL for the button",
        variant: "destructive"
      });
      return;
    }
    
    // Validate URL format
    try {
      new URL(buttonUrl);
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL including http:// or https://",
        variant: "destructive"
      });
      return;
    }
    
    if (editingButtonId) {
      // Edit existing button
      const updatedButtons = profileLinkButtons.map(btn => 
        btn.id === editingButtonId 
          ? { ...btn, label: buttonLabel, url: buttonUrl } 
          : btn
      );
      form.setValue("profileLinkButtons", updatedButtons);
    } else {
      // Add new button
      const newButton = {
        id: Date.now().toString(),
        label: buttonLabel,
        url: buttonUrl
      };
      
      form.setValue("profileLinkButtons", [...profileLinkButtons, newButton]);
    }
    
    // Reset form
    setButtonLabel("");
    setButtonUrl("");
    setEditingButtonId(null);
  };
  
  const editButton = (id: string) => {
    const button = profileLinkButtons.find(btn => btn.id === id);
    if (button) {
      setButtonLabel(button.label);
      setButtonUrl(button.url);
      setEditingButtonId(id);
    }
  };
  
  const removeButton = (id: string) => {
    form.setValue(
      "profileLinkButtons", 
      profileLinkButtons.filter(btn => btn.id !== id)
    );
    
    if (editingButtonId === id) {
      setButtonLabel("");
      setButtonUrl("");
      setEditingButtonId(null);
    }
  };
  
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: "Link copied",
      description: "Profile link copied to clipboard"
    });
  };
  
  const onSubmit = async (data: ProfileLinkFormValues) => {
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", `/api/athlete-profile/${athleteId}/profile-link`, data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile link");
      }
      
      toast({
        title: "Profile link updated",
        description: "Your shareable profile has been updated successfully",
      });
      
      if (onSave) onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate a username suggestion based on name
  const suggestUsername = () => {
    if (initialData?.name) {
      const suggestion = initialData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      
      form.setValue("profileLinkId", suggestion);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="border p-4 rounded-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Enable Profile Link */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Public Profile Link</h3>
              <p className="text-sm text-muted-foreground">
                Create a shareable link to showcase your social media profiles and important links
              </p>
            </div>
            <Switch
              checked={profileLinkEnabled}
              onCheckedChange={value => form.setValue("profileLinkEnabled", value)}
            />
          </div>
          
          {profileLinkEnabled && (
            <>
              {/* Profile Username & Link */}
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="profileLinkId">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="profileLinkId"
                      placeholder="your-username"
                      {...form.register("profileLinkId")}
                    />
                    {form.formState.errors.profileLinkId && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.profileLinkId.message}
                      </p>
                    )}
                  </div>
                  <Button type="button" variant="outline" onClick={suggestUsername}>
                    Suggest
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium overflow-hidden overflow-ellipsis">
                    {profileUrl}
                  </span>
                  <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={copyLinkToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Profile Preview */}
              <Card className="overflow-hidden">
                <div 
                  className="p-4 text-center" 
                  style={{ backgroundColor: backgroundColor, color: textColor }}
                >
                  <div className="flex flex-col items-center">
                    <Avatar className="h-16 w-16 mb-2 border-2" style={{ borderColor: accentColor }}>
                      <AvatarImage src={form.watch("profileLinkPhotoUrl")} />
                      <AvatarFallback style={{ backgroundColor: accentColor }}>
                        {initialData?.name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold">{initialData?.name || "Your Name"}</h3>
                    <p className="text-sm">{initialData?.sport || "Sport"}, {initialData?.school || "School"}</p>
                    {form.watch("profileLinkBio") && (
                      <p className="text-xs mt-1 max-w-[200px] truncate">{form.watch("profileLinkBio")}</p>
                    )}
                    
                    {/* Social preview */}
                    <div className="flex gap-2 mt-2">
                      {Object.entries(socialHandles).map(([platform, handle]) => 
                        handle ? (
                          <div 
                            key={platform} 
                            className="p-1 rounded-full"
                            style={{ backgroundColor: accentColor }}
                          >
                            {platform === 'instagram' && <Instagram className="h-3 w-3" />}
                            {platform === 'facebook' && <Facebook className="h-3 w-3" />}
                            {platform === 'twitter' && <Twitter className="h-3 w-3" />}
                            {platform === 'tiktok' && <SiTiktok className="h-3 w-3" />}
                          </div>
                        ) : null
                      )}
                    </div>
                    
                    {/* Button preview */}
                    <div className="mt-3 w-full space-y-1">
                      {profileLinkButtons.slice(0, 2).map((button, index) => (
                        <div
                          key={index}
                          className="text-xs p-1 rounded flex items-center justify-between"
                          style={{ 
                            backgroundColor: `${accentColor}20`, 
                            border: `1px solid ${accentColor}`
                          }}
                        >
                          <span className="truncate max-w-[120px] pl-1">{button.label}</span>
                          <ExternalLink className="h-2 w-2 opacity-70 mr-1" />
                        </div>
                      ))}
                      {profileLinkButtons.length > 2 && (
                        <div className="text-xs text-center opacity-60">+{profileLinkButtons.length - 2} more</div>
                      )}
                    </div>
                  </div>
                </div>
                <CardContent className="p-3 bg-muted text-center text-xs text-muted-foreground">
                  This is how your profile will appear to visitors
                </CardContent>
              </Card>
              
              {/* Bio & Photo */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="profileLinkBio">Bio</Label>
                  <Textarea
                    id="profileLinkBio"
                    placeholder="Tell the world about yourself (max 150 characters)"
                    {...form.register("profileLinkBio")}
                    maxLength={150}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {form.watch("profileLinkBio")?.length || 0}/150
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="profileLinkPhotoUrl">Profile Photo URL</Label>
                  <Input
                    id="profileLinkPhotoUrl"
                    placeholder="https://example.com/your-photo.jpg"
                    {...form.register("profileLinkPhotoUrl")}
                  />
                </div>
              </div>
              
              {/* Appearance */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Appearance</h3>
                
                <div className="space-y-1">
                  <Label htmlFor="profileLinkBackgroundColor">Background Color</Label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      id="profileLinkBackgroundColor"
                      value={backgroundColor}
                      onChange={(e) => form.setValue("profileLinkBackgroundColor", e.target.value)}
                      className="w-10 h-10 rounded overflow-hidden"
                    />
                    <Input
                      value={backgroundColor}
                      onChange={(e) => form.setValue("profileLinkBackgroundColor", e.target.value)}
                      className="font-mono uppercase"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="profileLinkTextColor">Text Color</Label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      id="profileLinkTextColor"
                      value={textColor}
                      onChange={(e) => form.setValue("profileLinkTextColor", e.target.value)}
                      className="w-10 h-10 rounded overflow-hidden"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => form.setValue("profileLinkTextColor", e.target.value)}
                      className="font-mono uppercase"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="profileLinkAccentColor">Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      id="profileLinkAccentColor"
                      value={accentColor}
                      onChange={(e) => form.setValue("profileLinkAccentColor", e.target.value)}
                      className="w-10 h-10 rounded overflow-hidden"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => form.setValue("profileLinkAccentColor", e.target.value)}
                      className="font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
              
              {/* Social Media Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Social Media Links</h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1.5" htmlFor="instagram">
                      <Instagram className="h-4 w-4" /> Instagram
                    </Label>
                    <Input
                      id="instagram"
                      placeholder="@yourusername"
                      value={socialHandles.instagram || ""}
                      onChange={(e) => {
                        const updatedHandles = { ...socialHandles, instagram: e.target.value };
                        form.setValue("socialHandles", updatedHandles);
                      }}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1.5" htmlFor="tiktok">
                      <SiTiktok className="h-4 w-4" /> TikTok
                    </Label>
                    <Input
                      id="tiktok"
                      placeholder="@yourusername"
                      value={socialHandles.tiktok || ""}
                      onChange={(e) => {
                        const updatedHandles = { ...socialHandles, tiktok: e.target.value };
                        form.setValue("socialHandles", updatedHandles);
                      }}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1.5" htmlFor="twitter">
                      <Twitter className="h-4 w-4" /> Twitter
                    </Label>
                    <Input
                      id="twitter"
                      placeholder="@yourusername"
                      value={socialHandles.twitter || ""}
                      onChange={(e) => {
                        const updatedHandles = { ...socialHandles, twitter: e.target.value };
                        form.setValue("socialHandles", updatedHandles);
                      }}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1.5" htmlFor="facebook">
                      <Facebook className="h-4 w-4" /> Facebook
                    </Label>
                    <Input
                      id="facebook"
                      placeholder="yourusername or page-name"
                      value={socialHandles.facebook || ""}
                      onChange={(e) => {
                        const updatedHandles = { ...socialHandles, facebook: e.target.value };
                        form.setValue("socialHandles", updatedHandles);
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Custom Buttons */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Custom Links</h3>
                <p className="text-sm text-muted-foreground">
                  Add custom buttons to link to your highlights, portfolio, store, or other content
                </p>
                
                {/* Add new button form */}
                <div className="space-y-3 p-4 border rounded-md">
                  <div className="space-y-1">
                    <Label htmlFor="buttonLabel">Button Label</Label>
                    <Input
                      id="buttonLabel"
                      placeholder="e.g., Game Highlights"
                      value={buttonLabel}
                      onChange={(e) => setButtonLabel(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="buttonUrl">Button URL</Label>
                    <Input
                      id="buttonUrl"
                      placeholder="https://example.com/your-content"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    type="button" 
                    onClick={addButton}
                    className="w-full"
                  >
                    {editingButtonId ? "Update Button" : "Add Button"}
                  </Button>
                </div>
                
                {/* Button list */}
                {profileLinkButtons.length > 0 ? (
                  <div className="space-y-2">
                    {profileLinkButtons.map((button) => (
                      <div 
                        key={button.id}
                        className="flex items-center justify-between p-3 border rounded-md bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{button.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{button.url}</p>
                        </div>
                        <div className="flex items-center">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => editButton(button.id)}
                          >
                            Edit
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeButton(button.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 border border-dashed rounded-md">
                    <p className="text-muted-foreground">No custom links added yet</p>
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Save button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}