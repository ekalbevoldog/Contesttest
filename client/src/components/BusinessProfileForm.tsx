import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

// Schema for business profile form
const businessProfileSchema = z.object({
  name: z.string().min(2, { message: "Brand name must be at least 2 characters." }),
  productType: z.string().min(2, { message: "Product type must be at least 2 characters." }),
  audienceGoals: z.string().min(10, { message: "Please provide more details about your audience goals." }),
  campaignVibe: z.string().min(10, { message: "Please provide more details about your campaign vibe." }),
  values: z.string().min(10, { message: "Please provide more details about your brand values." }),
  targetSchoolsSports: z.string().min(5, { message: "Please provide some targets." }),
  budget: z.string().optional(),
  userType: z.literal("business")
});

type BusinessProfileFormProps = {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
};

export default function BusinessProfileForm({ onSubmit, isLoading = false }: BusinessProfileFormProps) {
  const form = useForm<z.infer<typeof businessProfileSchema>>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: "",
      productType: "",
      audienceGoals: "",
      campaignVibe: "",
      values: "",
      targetSchoolsSports: "",
      budget: "",
      userType: "business"
    },
  });

  const loadSession = () => {
    // Replace this with your actual session loading logic
    // This is a placeholder, you'll need to implement this based on your authentication system
    const session = localStorage.getItem('session');
    try {
        return JSON.parse(session || '{}');
    } catch (error) {
        return null;
    }
  };

  const handleSubmit = async (values: z.infer<typeof businessProfileSchema>) => {
    onSubmit(values);
  };


  return (
    <div className="bg-white rounded-md border border-gray-200 p-4">
      <h3 className="text-base font-medium text-gray-900 mb-3">Business Profile Information</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., SportsFlex Apparel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product/Service Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Athletic apparel, sports equipment, energy drinks" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="audienceGoals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audience Goals</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your target audience and goals, e.g., Reaching Gen Z college students, increasing brand awareness" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="campaignVibe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign Vibe</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the vibe/tone of your campaign, e.g., Energetic and motivational, authentic day-in-the-life" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="values"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand Values</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="What values does your brand stand for? e.g., Sustainability, inclusivity, excellence" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="targetSchoolsSports"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Schools/Sports</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any specific schools, conferences, or sports you're targeting? e.g., Big Ten basketball players, West Coast volleyball teams" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Range (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="under-1k">Under $1,000</SelectItem>
                    <SelectItem value="1k-5k">$1,000 - $5,000</SelectItem>
                    <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25k-plus">$25,000+</SelectItem>
                    <SelectItem value="product-exchange">Product exchange only</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}