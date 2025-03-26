import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import FeedbackForm from "@/components/FeedbackForm";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Star,
  CalendarClock,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
} from "lucide-react";

interface Feedback {
  id: number;
  userId: number;
  userType: string;
  feedbackType: string;
  matchId: number | null;
  rating: number | null;
  title: string;
  content: string;
  sentiment: string | null;
  status: string;
  isPublic: boolean;
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

const feedbackTypeIcons = {
  general: <MessageSquare className="h-4 w-4" />,
  match: <Star className="h-4 w-4" />,
  feature: <Lightbulb className="h-4 w-4" />,
  bug: <AlertTriangle className="h-4 w-4" />,
  other: <HelpCircle className="h-4 w-4" />,
};

const feedbackTypeColors = {
  general: "bg-blue-100 text-blue-800",
  match: "bg-amber-100 text-amber-800",
  feature: "bg-green-100 text-green-800",
  bug: "bg-red-100 text-red-800",
  other: "bg-purple-100 text-purple-800",
};

export default function FeedbackPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("submit");
  
  const {
    data: publicFeedbacks,
    isLoading: isLoadingPublic,
    refetch: refetchPublic
  } = useQuery({
    queryKey: ['/api/feedback/public'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/feedback/public');
      const data = await res.json();
      return data.feedbacks as Feedback[];
    },
    enabled: activeTab === "public"
  });

  const {
    data: userFeedbacks,
    isLoading: isLoadingUser,
    refetch: refetchUser
  } = useQuery({
    queryKey: ['/api/feedback/user'],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest('GET', '/api/feedback/user');
      const data = await res.json();
      return data.feedbacks as Feedback[];
    },
    enabled: !!user && activeTab === "your"
  });

  const handleRefresh = () => {
    if (activeTab === "public") {
      refetchPublic();
    } else if (activeTab === "your" && user) {
      refetchUser();
    }
    
    toast({
      title: "Success",
      description: "Your feedback has been submitted!"
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderFeedbackList = (feedbacks: Feedback[] | undefined, isLoading: boolean) => {
    if (isLoading) return <div className="py-10 text-center">Loading feedbacks...</div>;
    
    if (!feedbacks || feedbacks.length === 0) {
      return (
        <div className="py-10 text-center text-muted-foreground">
          No feedback available at this time
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <Card key={feedback.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold mr-2">{feedback.title}</CardTitle>
                <Badge className={feedbackTypeColors[feedback.feedbackType as keyof typeof feedbackTypeColors]}>
                  <span className="mr-1">{feedbackTypeIcons[feedback.feedbackType as keyof typeof feedbackTypeIcons]}</span>
                  {feedback.feedbackType.charAt(0).toUpperCase() + feedback.feedbackType.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5 mr-1" />
                <span>{formatDate(feedback.createdAt)}</span>
                {feedback.sentiment && (
                  <Badge 
                    variant="outline" 
                    className={`ml-2 ${
                      feedback.sentiment === 'positive' 
                        ? 'border-green-500 text-green-600' 
                        : feedback.sentiment === 'negative' 
                          ? 'border-red-500 text-red-600' 
                          : 'border-gray-500 text-gray-600'
                    }`}
                  >
                    {feedback.sentiment === 'positive' && <ThumbsUp className="h-3 w-3 mr-1" />}
                    {feedback.sentiment}
                  </Badge>
                )}
                {feedback.rating && (
                  <div className="ml-2 flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3.5 w-3.5 ${i < feedback.rating! ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{feedback.content}</p>
              
              {feedback.adminResponse && (
                <>
                  <Separator className="my-4" />
                  <div className="pl-4 border-l-2 border-primary">
                    <p className="text-xs font-medium text-primary mb-1">Official Response:</p>
                    <p className="text-sm">{feedback.adminResponse}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-6xl py-8">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">
        Feedback Center
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
              {user && <TabsTrigger value="your">Your Feedback</TabsTrigger>}
              <TabsTrigger value="public">Public Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="submit">
              {user ? (
                <FeedbackForm onSuccess={handleRefresh} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Login Required</CardTitle>
                    <CardDescription>
                      Please log in to submit feedback
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
            
            {user && (
              <TabsContent value="your">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">Your Feedback</h2>
                  <p className="text-muted-foreground">
                    Review the feedback you've submitted
                  </p>
                </div>
                {renderFeedbackList(userFeedbacks, isLoadingUser)}
              </TabsContent>
            )}
            
            <TabsContent value="public">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Community Feedback</h2>
                <p className="text-muted-foreground">
                  See what others are saying about Contested
                </p>
              </div>
              {renderFeedbackList(publicFeedbacks, isLoadingPublic)}
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Why Your Feedback Matters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                At Contested, we're committed to creating the best platform for athletes and businesses to connect. Your feedback helps us improve and evolve.
              </p>
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="mr-2 mt-1 rounded-full bg-amber-100 p-1">
                    <Star className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Rate your matches</span> to help us improve our matching algorithm
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="mr-2 mt-1 rounded-full bg-green-100 p-1">
                    <Lightbulb className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Suggest features</span> to help shape the future of Contested
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="mr-2 mt-1 rounded-full bg-red-100 p-1">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Report issues</span> so we can fix them promptly
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Our Commitment</h3>
                <p className="text-sm text-muted-foreground">
                  We review all feedback and use it to prioritize improvements. Public feedback helps the community make informed decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}