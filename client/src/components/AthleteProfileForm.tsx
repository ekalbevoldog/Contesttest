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

// Schema for athlete profile form
const athleteProfileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  sport: z.string().min(1, { message: "Please select a sport." }),
  division: z.string().min(1, { message: "Please select a division." }),
  school: z.string().min(2, { message: "School must be at least 2 characters." }),
  socialHandles: z.string().optional(),
  followerCount: z.string().refine((val) => !isNaN(Number(val)), {
    message: "Follower count must be a number."
  }),
  contentStyle: z.string().min(10, { message: "Please provide more details about your content style." }),
  compensationGoals: z.string().min(10, { message: "Please provide more details about your compensation goals." }),
  userType: z.literal("athlete")
});

type AthleteProfileFormProps = {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
};

export default function AthleteProfileForm({ onSubmit, isLoading = false }: AthleteProfileFormProps) {
  const form = useForm<z.infer<typeof athleteProfileSchema>>({
    resolver: zodResolver(athleteProfileSchema),
    defaultValues: {
      name: "",
      sport: "",
      division: "",
      school: "",
      socialHandles: "",
      followerCount: "",
      contentStyle: "",
      compensationGoals: "",
      userType: "athlete"
    },
  });

  const handleSubmit = async (values: z.infer<typeof athleteProfileSchema>) => {
    onSubmit(values);
  };


  return (
    <div className="bg-white rounded-md border border-gray-200 p-4">
      <h3 className="text-base font-medium text-gray-900 mb-3">Athlete Profile Information</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Alex Johnson" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sport" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="volleyball">Volleyball</SelectItem>
                      <SelectItem value="baseball">Baseball</SelectItem>
                      <SelectItem value="softball">Softball</SelectItem>
                      <SelectItem value="soccer">Soccer</SelectItem>
                      <SelectItem value="track">Track & Field</SelectItem>
                      <SelectItem value="swimming">Swimming</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select division" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="D1">Division I</SelectItem>
                      <SelectItem value="D2">Division II</SelectItem>
                      <SelectItem value="D3">Division III</SelectItem>
                      <SelectItem value="NAIA">NAIA</SelectItem>
                      <SelectItem value="JUCO">Junior College</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="school"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., University of California, Los Angeles" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialHandles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Social Media Handles (comma separated)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., @alexj_23 (Instagram), @alexjohnson (Twitter)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="followerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Follower Count</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 5000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contentStyle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content Style</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your content style, e.g., Training videos, lifestyle content, highlight reels" 
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
            name="compensationGoals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compensation Goals</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="What are you looking for in NIL deals? e.g., Product exchanges, paid promotions, long-term partnerships" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
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