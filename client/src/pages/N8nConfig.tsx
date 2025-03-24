import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const webhookSchema = z.object({
  webhook_url: z.string().url("Please enter a valid webhook URL"),
});

const testWebhookSchema = z.object({
  webhook_url: z.string().url("Please enter a valid webhook URL"),
  event_type: z.string().min(1, "Event type is required"),
  data: z.string().optional(),
});

export default function N8nConfig() {
  const { toast } = useToast();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState("configure");

  // Configure webhook form
  const configForm = useForm<z.infer<typeof webhookSchema>>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      webhook_url: "",
    },
  });

  // Test webhook form
  const testForm = useForm<z.infer<typeof testWebhookSchema>>({
    resolver: zodResolver(testWebhookSchema),
    defaultValues: {
      webhook_url: "",
      event_type: "test_event",
      data: JSON.stringify({ message: "Test webhook from Contested" }, null, 2),
    },
  });

  async function onConfigSubmit(values: z.infer<typeof webhookSchema>) {
    setIsConfiguring(true);
    try {
      const response = await apiRequest("POST", "/api/n8n/config", values);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Webhook Configured",
          description: "The n8n webhook URL has been configured successfully.",
        });
        
        // Update the test form with the configured URL
        testForm.setValue("webhook_url", values.webhook_url);
        
        // Switch to test tab
        setActiveTab("test");
      } else {
        toast({
          title: "Configuration Failed",
          description: data.message || "Failed to configure the webhook URL.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Configuration Error",
        description: "An error occurred while configuring the webhook.",
        variant: "destructive",
      });
      console.error("Error configuring webhook:", error);
    } finally {
      setIsConfiguring(false);
    }
  }

  async function onTestSubmit(values: z.infer<typeof testWebhookSchema>) {
    setIsTesting(true);
    try {
      // Parse the data JSON if provided
      let parsedData = {};
      if (values.data) {
        try {
          parsedData = JSON.parse(values.data);
        } catch (e) {
          toast({
            title: "Invalid JSON",
            description: "Please enter valid JSON data.",
            variant: "destructive",
          });
          setIsTesting(false);
          return;
        }
      }
      
      const payload = {
        webhook_url: values.webhook_url,
        event_type: values.event_type,
        data: parsedData,
      };
      
      const response = await apiRequest("POST", "/api/n8n/webhook", payload);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Webhook Test Successful",
          description: "The test data was sent to the n8n webhook successfully.",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.message || "Failed to send test data to the webhook.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: "An error occurred while testing the webhook.",
        variant: "destructive",
      });
      console.error("Error testing webhook:", error);
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">n8n Webhook Configuration</h1>
      <p className="text-gray-500 mb-6">
        Configure and test n8n webhook integration for the Contested platform. This allows you to create automated workflows
        that trigger when specific events occur in the platform, such as new chat messages or matches.
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configure" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configure n8n Webhook</CardTitle>
              <CardDescription>
                Set up the n8n webhook URL that will receive event data from the Contested platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...configForm}>
                <form onSubmit={configForm.handleSubmit(onConfigSubmit)} className="space-y-6">
                  <FormField
                    control={configForm.control}
                    name="webhook_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://your-n8n-instance.com/webhook/..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter the webhook URL from your n8n instance. This URL will receive event data from the platform.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isConfiguring}>
                    {isConfiguring ? "Configuring..." : "Save Configuration"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="test" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Webhook Integration</CardTitle>
              <CardDescription>
                Send a test event to your configured n8n webhook to verify it's working correctly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...testForm}>
                <form onSubmit={testForm.handleSubmit(onTestSubmit)} className="space-y-6">
                  <FormField
                    control={testForm.control}
                    name="webhook_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook URL</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          The n8n webhook URL to send the test event to.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={testForm.control}
                    name="event_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          The type of event to simulate (e.g., "test_event", "chat_message", "match_created").
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={testForm.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Data (JSON)</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Enter JSON data to send with the event"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          JSON data to include with the test event.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isTesting}>
                    {isTesting ? "Sending..." : "Send Test Event"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Separator className="my-10" />
      
      <div className="bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">n8n Integration Guide</h2>
        <p className="mb-4">
          Follow these steps to set up automation workflows with n8n:
        </p>
        <ol className="list-decimal ml-6 space-y-2">
          <li>Create a webhook node in your n8n workflow</li>
          <li>Copy the webhook URL from n8n</li>
          <li>Paste the URL in the configuration form above</li>
          <li>Test the integration with a sample event</li>
          <li>Configure your n8n workflow to process the events as needed</li>
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">
          Events are sent as JSON payloads with event_type, timestamp, and data properties. Configure your n8n workflow to process these events accordingly.
        </p>
      </div>
    </div>
  );
}