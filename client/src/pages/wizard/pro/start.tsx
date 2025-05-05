import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useToast } from '@/hooks/use-toast';
import { useProWizard } from '@/contexts/ProWizardProvider';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  objective: z.string()
    .min(10, 'Please provide a more detailed objective')
    .max(500, 'Objective is too long'),
  channels: z.array(z.string())
    .min(1, 'Select at least one channel'),
});

// Channel options
const channelOptions = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'X / Twitter' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'in-person', label: 'In-Person Events' },
  { id: 'other', label: 'Other Channels' },
];

export default function Start() {
  const [, navigate] = useLocation();
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { form, updateForm, nextStep, setCampaignId, campaignId } = useProWizard();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form with react-hook-form
  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objective: form.objective || '',
      channels: form.channels || [],
    },
  });
  
  // Function to create a new campaign in the database
  const createNewCampaign = useCallback(async () => {
    try {
      setIsSubmitting(true);
      
      // If user is not logged in, create a temporary campaign without a business_id
      // This allows exploration of the wizard without authentication
      if (!user?.id) {
        console.log('Creating temporary campaign without authentication');
        // Generate a temporary ID
        const tempId = 'temp-' + Math.random().toString(36).substring(2, 15);
        setCampaignId(tempId);
        setIsSubmitting(false);
        return;
      }
      
      // Create a basic campaign record for authenticated users
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          business_id: user.id,
          status: 'DRAFT',
          created_at: new Date().toISOString(),
          title: 'Pro Campaign',
          type: 'pro',
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Save the campaign ID to the wizard state
      if (data?.id) {
        setCampaignId(data.id);
        toast({
          title: 'Campaign created',
          description: 'Your campaign draft has been saved',
        });
      }
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      // Still create a campaign ID even if there's an error
      const tempId = 'temp-' + Math.random().toString(36).substring(2, 15);
      setCampaignId(tempId);
      
      toast({
        title: 'Using temporary campaign',
        description: 'Your progress won\'t be saved to your account',
        variant: 'default',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, supabase, setCampaignId, toast, setIsSubmitting]);
  
  // Check for existing campaign on mount
  useEffect(() => {
    // Always create a campaign ID to ensure the wizard works
    if (!campaignId) {
      console.log('No campaign ID found, creating one');
      createNewCampaign();
    } else {
      console.log('Using existing campaign ID:', campaignId);
    }
  }, [campaignId, createNewCampaign]);
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!campaignId) {
      toast({
        title: 'Campaign not created',
        description: 'Please try again in a moment',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Update the wizard state regardless of authentication
      updateForm({
        objective: values.objective,
        channels: values.channels,
      });
      
      // If this is a temporary campaign, don't try to update Supabase
      if (campaignId.startsWith('temp-')) {
        // Just move to the next step without trying to save to the database
        console.log('Using temporary campaign - skipping database update');
      } else {
        // For real campaigns, update the database
        const { error } = await supabase
          .from('campaigns')
          .update({
            objective: values.objective,
            channels: values.channels,
            updated_at: new Date().toISOString(),
          })
          .eq('id', campaignId);
        
        if (error) {
          console.warn('Database update failed, but continuing with local state:', error);
        }
      }
      
      // Move to the next step
      nextStep();
      navigate('/wizard/pro/advanced');
      
    } catch (error: any) {
      console.error('Error during form submission:', error);
      // Continue anyway since we're being lenient with auth requirements
      updateForm({
        objective: values.objective,
        channels: values.channels,
      });
      nextStep();
      navigate('/wizard/pro/advanced');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Start Your Pro Campaign</h2>
        <p className="text-gray-400">Define the basic parameters for your athlete partnership campaign</p>
      </div>
      
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-6">
          {/* Campaign Objective */}
          <FormField
            control={formMethods.control}
            name="objective"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Campaign Objective</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the main goal of your campaign..."
                    className="bg-black/20 border-zinc-700 resize-none h-24"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Be specific about what you want to achieve with athlete partnerships
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Channels */}
          <FormField
            control={formMethods.control}
            name="channels"
            render={() => (
              <FormItem>
                <FormLabel className="text-white">Campaign Channels</FormLabel>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {channelOptions.map((option) => (
                    <FormField
                      key={option.id}
                      control={formMethods.control}
                      name="channels"
                      render={({ field }) => {
                        return (
                          <FormItem 
                            key={option.id} 
                            className="flex items-center space-x-3 space-y-0 rounded-md border border-zinc-800 p-3 bg-black/20 hover:bg-black/30 transition-colors"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(option.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, option.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== option.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-gray-300 font-normal cursor-pointer">
                              {option.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormDescription>
                  Select all platforms where you want athlete content to appear
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Navigation */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-black font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}