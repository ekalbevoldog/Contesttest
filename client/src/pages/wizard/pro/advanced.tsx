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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

// Define the advanced settings schema
const AdvancedSchema = z.object({
  title: z.string().min(1, "Campaign title is required"),
  description: z.string().min(1, "Campaign description is required"),
  budget: z.string().min(1, "Budget is required"),
  targetAudience: z.object({
    ageRange: z.array(z.number()).length(2),
    gender: z.string().optional(),
    interests: z.array(z.string()).optional(),
  }),
  targetSports: z.array(z.string()).min(1, "Select at least one sport"),
});

// Sport options
const sportOptions = [
  "Basketball", "Football", "Soccer", "Baseball", "Track & Field", 
  "Swimming", "Volleyball", "Tennis", "Golf", "Gymnastics",
  "Hockey", "Lacrosse", "Wrestling", "Rugby", "Softball"
];

// Interest options
const interestOptions = [
  "Fitness", "Health", "Fashion", "Technology", "Gaming", 
  "Outdoors", "Music", "Travel", "Food", "Education"
];

export default function Advanced() {
  const { campaignId, form, updateForm, nextStep, prevStep } = useProWizard();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(form.targetAudience?.interests || []);
  
  // Initialize form with resolver and existing data
  const defaultValues = {
    title: form.title || '',
    description: form.description || '',
    budget: form.budget || '',
    targetAudience: {
      ageRange: form.targetAudience?.ageRange || [18, 34],
      gender: form.targetAudience?.gender || 'all',
      interests: form.targetAudience?.interests || [],
    },
    targetSports: form.targetSports || [],
  };
  
  const formMethods = useForm<z.infer<typeof AdvancedSchema>>({
    resolver: zodResolver(AdvancedSchema),
    defaultValues,
  });

  // Add or remove interest
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
    
    // Update the form value
    const currentValues = formMethods.getValues();
    formMethods.setValue('targetAudience', {
      ...currentValues.targetAudience,
      interests: selectedInterests.includes(interest) 
        ? selectedInterests.filter(i => i !== interest) 
        : [...selectedInterests, interest]
    });
  };
  
  // Form submission handler
  const onSubmit = async (data: z.infer<typeof AdvancedSchema>) => {
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
          title: data.title,
          description: data.description,
          budget: data.budget,
          target_audience: data.targetAudience,
          target_sports: data.targetSports,
        })
        .eq('id', campaignId);
      
      if (error) {
        toast({
          title: "Error updating campaign",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Update the wizard state with form data
      updateForm(data);
      nextStep();
      
      // Navigate to next step
      navigate('/wizard/pro/deliverables');
      
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
        <h2 className="text-2xl font-bold text-white mb-2">Advanced Campaign Settings</h2>
        <p className="text-gray-400">Define detailed parameters for your athlete partnership campaign</p>
      </div>
      
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-6">
          {/* Campaign Title */}
          <FormField
            control={formMethods.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Campaign Title</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="E.g., Summer Collection Launch 2025"
                    className="bg-black/20 border-zinc-700"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A concise name for your campaign
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Campaign Description */}
          <FormField
            control={formMethods.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Campaign Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your campaign in detail..."
                    className="bg-black/20 border-zinc-700 resize-none h-24"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide context about the campaign's purpose and goals
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Budget */}
          <FormField
            control={formMethods.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Campaign Budget</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="E.g., $5,000 - $10,000"
                    className="bg-black/20 border-zinc-700"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Specify the budget range for this campaign
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Target Age Range */}
          <FormField
            control={formMethods.control}
            name="targetAudience.ageRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Target Age Range</FormLabel>
                <div className="pt-6 pb-2">
                  <Slider
                    value={field.value}
                    min={13}
                    max={65}
                    step={1}
                    onValueChange={field.onChange}
                    className="bg-black/20"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">{field.value[0]} years</span>
                  <span className="text-sm text-gray-400">{field.value[1]} years</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Target Gender */}
          <FormField
            control={formMethods.control}
            name="targetAudience.gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Target Gender</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-black/20 border-zinc-700">
                      <SelectValue placeholder="Select target gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="all">All genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="nonbinary">Non-binary/Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the primary gender demographic for your campaign
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Target Interests */}
          <FormField
            control={formMethods.control}
            name="targetAudience.interests"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Target Interests</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {interestOptions.map((interest) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? "default" : "outline"}
                      className={`cursor-pointer ${
                        selectedInterests.includes(interest)
                          ? "bg-amber-500 hover:bg-amber-600 text-black"
                          : "bg-black/20 hover:bg-black/30 text-gray-300 border-zinc-700"
                      }`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
                <FormDescription>
                  Select interests relevant to your target audience
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Target Sports */}
          <FormField
            control={formMethods.control}
            name="targetSports"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Target Sports</FormLabel>
                <div className="space-y-2 mt-2">
                  <Select 
                    onValueChange={(value) => {
                      // Add to the array if not already present
                      if (!field.value.includes(value)) {
                        field.onChange([...field.value, value]);
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-black/20 border-zinc-700">
                        <SelectValue placeholder="Add a sport" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {sportOptions.map((sport) => (
                        <SelectItem 
                          key={sport} 
                          value={sport}
                          disabled={field.value.includes(sport)}
                        >
                          {sport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {field.value.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {field.value.map((sport) => (
                        <Badge
                          key={sport}
                          variant="secondary"
                          className="bg-zinc-800 text-white flex items-center gap-1"
                        >
                          {sport}
                          <span
                            className="ml-1 cursor-pointer hover:text-red-400"
                            onClick={() => {
                              field.onChange(field.value.filter((s) => s !== sport));
                            }}
                          >
                            ×
                          </span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <FormDescription>
                  Select sports relevant to your campaign
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline"
              className="border-zinc-700 bg-black/20 text-white hover:bg-black/40"
              onClick={() => {
                prevStep();
                navigate('/wizard/pro/start');
              }}
            >
              ← Back
            </Button>
            
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-black font-medium"
            >
              Save & Continue →
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}