import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Star } from "lucide-react";

const feedbackSchema = z.object({
  feedbackType: z.enum(["general", "match", "feature", "bug", "other"], {
    required_error: "Please select a feedback type",
  }),
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Feedback must be at least 10 characters"),
  rating: z.number().min(1).max(5).optional(),
  matchId: z.number().optional(),
  isPublic: z.boolean().default(false),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  matchId?: number;
  onSuccess?: () => void;
}

export default function FeedbackForm({ matchId, onSuccess }: FeedbackFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedbackType: matchId ? "match" : "general",
      title: "",
      content: "",
      rating: undefined,
      matchId: matchId,
      isPublic: false,
    },
  });

  async function onSubmit(values: FeedbackFormValues) {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit feedback",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/feedback", values);
      const data = await response.json();

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });

      form.reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const showRating = form.watch("feedbackType") === "match";

  return (
    <div className="p-6 bg-background border rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
        Share Your Feedback
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="feedbackType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feedback Type</FormLabel>
                <Select
                  disabled={!!matchId}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type of feedback" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="general">General Feedback</SelectItem>
                    <SelectItem value="match">Match Feedback</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Brief summary of your feedback" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feedback</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please share your detailed feedback..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showRating && (
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Rate your match experience</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                      className="flex space-x-2"
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <FormItem
                          key={rating}
                          className="flex flex-col items-center space-y-1"
                        >
                          <FormControl>
                            <RadioGroupItem
                              value={rating.toString()}
                              className="sr-only"
                            />
                          </FormControl>
                          <Label
                            htmlFor={`rating-${rating}`}
                            className={`cursor-pointer p-2 rounded-full hover:bg-muted ${
                              field.value === rating
                                ? "text-amber-500"
                                : "text-muted-foreground"
                            }`}
                            onClick={() => field.onChange(rating)}
                          >
                            <Star
                              className={
                                field.value === rating || field.value > rating
                                  ? "fill-amber-500"
                                  : ""
                              }
                            />
                          </Label>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Share publicly
                  </FormLabel>
                  <FormDescription>
                    Allow your feedback to be displayed on our testimonials
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Feedback
          </Button>
        </form>
      </Form>
    </div>
  );
}