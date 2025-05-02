'use client';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { useProWizard } from '@/contexts/ProWizardProvider';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Plus, Trash2, FileText, Image, Video, CalendarClock, Tag, X } from 'lucide-react';

// Define the deliverables schema
const DeliverablesSchema = z.object({
  deliverables: z.array(z.object({
    type: z.string(),
    description: z.string(),
    platform: z.string().optional(),
    quantity: z.number().min(1),
  })).min(1, "At least one deliverable is required"),
  contentRequirements: z.object({
    tone: z.string().optional(),
    guidelines: z.string().optional(),
    approvalProcess: z.string().optional(),
  }),
  brandMentionRequirements: z.string().optional(),
  hashtagRequirements: z.array(z.string()).optional(),
});

const platformOptions = [
  "Instagram", "TikTok", "YouTube", "Twitter/X", "Facebook", "LinkedIn", "Snapchat", "In-Person"
];

const deliverableTypes = [
  { value: "post", label: "Social Media Post", icon: FileText },
  { value: "story", label: "Story/Reel", icon: Image },
  { value: "video", label: "Video Content", icon: Video },
  { value: "appearance", label: "Personal Appearance", icon: CalendarClock },
];

export default function Deliverables() {
  const { campaignId, form, updateForm, nextStep, prevStep } = useProWizard();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deliverableList, setDeliverableList] = useState<any[]>(form.deliverables || []);
  const [newHashtag, setNewHashtag] = useState('');
  const [hashtags, setHashtags] = useState<string[]>(form.hashtagRequirements || []);
  
  // Initialize form with resolver and existing data
  const defaultValues = {
    deliverables: form.deliverables || [],
    contentRequirements: form.contentRequirements || {
      tone: '',
      guidelines: '',
      approvalProcess: '',
    },
    brandMentionRequirements: form.brandMentionRequirements || '',
    hashtagRequirements: form.hashtagRequirements || [],
  };
  
  const formMethods = useForm<z.infer<typeof DeliverablesSchema>>({
    resolver: zodResolver(DeliverablesSchema),
    defaultValues,
  });

  const [newDeliverable, setNewDeliverable] = useState({
    type: '',
    description: '',
    platform: '',
    quantity: 1,
  });

  // Add a new deliverable
  const addDeliverable = () => {
    if (!newDeliverable.type || !newDeliverable.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields for the deliverable",
        variant: "destructive"
      });
      return;
    }

    const updatedList = [...deliverableList, newDeliverable];
    setDeliverableList(updatedList);
    formMethods.setValue('deliverables', updatedList);
    
    // Reset form
    setNewDeliverable({
      type: '',
      description: '',
      platform: '',
      quantity: 1,
    });
  };

  // Remove a deliverable
  const removeDeliverable = (index: number) => {
    const updatedList = deliverableList.filter((_, i) => i !== index);
    setDeliverableList(updatedList);
    formMethods.setValue('deliverables', updatedList);
  };

  // Add a hashtag
  const addHashtag = () => {
    if (!newHashtag.trim()) return;
    
    const updatedTags = [...hashtags, newHashtag.trim()];
    setHashtags(updatedTags);
    formMethods.setValue('hashtagRequirements', updatedTags);
    setNewHashtag('');
  };

  // Remove a hashtag
  const removeHashtag = (index: number) => {
    const updatedTags = hashtags.filter((_, i) => i !== index);
    setHashtags(updatedTags);
    formMethods.setValue('hashtagRequirements', updatedTags);
  };
  
  // Form submission handler
  const onSubmit = async (data: z.infer<typeof DeliverablesSchema>) => {
    try {
      if (!campaignId) {
        toast({
          title: "Error",
          description: "Campaign ID not found. Please start from the beginning.",
          variant: "destructive"
        });
        navigate('/wizard/pro/start');
        return;
      }
      
      // Update campaign in Supabase
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          deliverables: data.deliverables,
          content_requirements: data.contentRequirements,
          brand_mention_requirements: data.brandMentionRequirements,
          hashtag_requirements: data.hashtagRequirements,
        })
        .eq('id', campaignId);
      
      if (error) {
        toast({
          title: "Error updating deliverables",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Update the wizard state with form data
      updateForm(data);
      nextStep();
      
      // Navigate to next step
      navigate('/wizard/pro/match');
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Campaign Deliverables</h2>
        <p className="text-gray-400">Define what you expect from athletes during this campaign</p>
      </div>
      
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
          {/* Deliverables Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Required Deliverables</h3>
            
            {/* Add New Deliverable UI */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Deliverable Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Type</label>
                    <Select 
                      value={newDeliverable.type}
                      onValueChange={(value) => setNewDeliverable({...newDeliverable, type: value})}
                    >
                      <SelectTrigger className="bg-black/30 border-zinc-700">
                        <SelectValue placeholder="Select deliverable type" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {deliverableTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Platform */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Platform</label>
                    <Select 
                      value={newDeliverable.platform}
                      onValueChange={(value) => setNewDeliverable({...newDeliverable, platform: value})}
                    >
                      <SelectTrigger className="bg-black/30 border-zinc-700">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {platformOptions.map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Description</label>
                  <Input
                    placeholder="Describe what you expect"
                    className="bg-black/30 border-zinc-700"
                    value={newDeliverable.description}
                    onChange={(e) => setNewDeliverable({...newDeliverable, description: e.target.value})}
                  />
                </div>
                
                {/* Quantity */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-gray-300">Quantity</label>
                    <span className="text-sm text-gray-400">{newDeliverable.quantity}</span>
                  </div>
                  <Slider
                    value={[newDeliverable.quantity]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => setNewDeliverable({...newDeliverable, quantity: value[0]})}
                    className="bg-black/30"
                  />
                </div>
                
                {/* Add Button */}
                <Button 
                  type="button" 
                  onClick={addDeliverable}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Deliverable
                </Button>
              </CardContent>
            </Card>
            
            {/* Deliverables List */}
            {deliverableList.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-md font-medium text-gray-300">Added Deliverables:</h4>
                {deliverableList.map((deliverable, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800 rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                          {deliverable.type}
                        </Badge>
                        {deliverable.platform && (
                          <Badge variant="outline" className="bg-zinc-800 text-gray-300 border-zinc-700">
                            {deliverable.platform}
                          </Badge>
                        )}
                        <span className="text-gray-300 text-sm">x{deliverable.quantity}</span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{deliverable.description}</p>
                    </div>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeliverable(index)}
                      className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            {deliverableList.length === 0 && (
              <div className="text-center py-4 text-gray-400">
                No deliverables added yet. Add at least one deliverable to continue.
              </div>
            )}
          </div>
          
          {/* Content Requirements */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="text-lg font-semibold text-white">Content Requirements</h3>
            
            {/* Tone of Voice */}
            <FormField
              control={formMethods.control}
              name="contentRequirements.tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Tone of Voice</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-black/20 border-zinc-700">
                        <SelectValue placeholder="Select tone of voice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="casual">Casual & Relaxed</SelectItem>
                      <SelectItem value="professional">Professional & Formal</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                      <SelectItem value="inspirational">Inspirational & Motivational</SelectItem>
                      <SelectItem value="educational">Educational & Informative</SelectItem>
                      <SelectItem value="humorous">Humorous & Playful</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define the tone athletes should use in content
                  </FormDescription>
                </FormItem>
              )}
            />
            
            {/* Content Guidelines */}
            <FormField
              control={formMethods.control}
              name="contentRequirements.guidelines"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Content Guidelines</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe any specific guidelines for content..."
                      className="bg-black/20 border-zinc-700 resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Specific instructions for content creation
                  </FormDescription>
                </FormItem>
              )}
            />
            
            {/* Approval Process */}
            <FormField
              control={formMethods.control}
              name="contentRequirements.approvalProcess"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Approval Process</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-black/20 border-zinc-700">
                        <SelectValue placeholder="Select approval process" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="required">Approval Required Before Posting</SelectItem>
                      <SelectItem value="notification">Notification Only (No Approval)</SelectItem>
                      <SelectItem value="autonomy">Full Creative Autonomy</SelectItem>
                      <SelectItem value="guidelines">Follow Guidelines, No Review Needed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Define how content will be approved
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
          
          {/* Brand Mention Requirements */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="text-lg font-semibold text-white">Brand Mentions & Tags</h3>
            
            {/* Brand Mention Requirements */}
            <FormField
              control={formMethods.control}
              name="brandMentionRequirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Brand Mention Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe how your brand should be mentioned..."
                      className="bg-black/20 border-zinc-700 resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Specify how and where your brand should be mentioned in content
                  </FormDescription>
                </FormItem>
              )}
            />
            
            {/* Hashtag Requirements */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Required Hashtags</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a hashtag (without #)"
                  className="bg-black/20 border-zinc-700 flex-1"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHashtag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addHashtag}
                  className="border-zinc-700 bg-black/20 text-white hover:bg-black/40"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {hashtags.map((tag, index) => (
                    <Badge
                      key={index}
                      className="bg-amber-500/20 text-amber-400 border-amber-500/30 flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      #{tag}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-red-400 ml-1"
                        onClick={() => removeHashtag(index)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Add hashtags that should be included in all content
              </p>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-zinc-800">
            <Button 
              type="button" 
              variant="outline"
              className="border-zinc-700 bg-black/20 text-white hover:bg-black/40"
              onClick={() => {
                prevStep();
                navigate('/wizard/pro/advanced');
              }}
            >
              ← Back
            </Button>
            
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-black font-medium"
              disabled={deliverableList.length === 0}
            >
              Save & Continue →
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}