import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useProWizard } from '@/contexts/ProWizardProvider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const formSchema = z.object({
  objective: z.string().min(10, { message: 'Please provide a campaign objective (min 10 characters)' }),
  channels: z.array(z.string()).min(1, { message: 'Select at least one channel' }),
});

// Channel options
const channelOptions = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'twitter', label: 'Twitter' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'blog', label: 'Blog' },
  { id: 'podcast', label: 'Podcast' },
  { id: 'in_person', label: 'In-Person' },
];

export default function StartTest() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Access wizard context
  const { campaignId, setCampaignId, updateForm, nextStep } = useProWizard();
  
  // Initialize form
  const formMethods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objective: '',
      channels: [],
    },
  });
  
  // Create temporary campaign ID if needed
  if (!campaignId) {
    const tempId = 'temp-' + Math.random().toString(36).substring(2, 15);
    console.log('Creating temporary campaign ID:', tempId);
    setCampaignId(tempId);
    toast({
      title: 'Test Mode Active',
      description: 'Using temporary campaign ID for testing',
    });
  }
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Update the wizard state
      updateForm({
        objective: values.objective,
        channels: values.channels,
      });
      
      // Simulate database operation delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Success message
      toast({
        title: 'Form submitted successfully',
        description: 'Moving to the next step',
      });
      
      // Move to the next step
      nextStep();
      navigate('/wizard/pro/advanced');
      
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'An error occurred',
        description: 'But we can continue anyway in test mode',
        variant: 'destructive',
      });
      
      // Move to next step anyway for testing
      nextStep();
      navigate('/wizard/pro/advanced');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Start Your Pro Campaign (Test Version)</h2>
        <p className="text-gray-400">This is a test version that doesn't require authentication or database</p>
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