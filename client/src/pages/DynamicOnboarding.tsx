import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import DynamicOnboardingForm from "@/components/DynamicOnboardingForm";
import { useToast } from "@/hooks/use-toast";

export default function DynamicOnboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize session if needed
  useEffect(() => {
    async function createSession() {
      try {
        const response = await fetch("/api/chat/session", {
          method: "POST",
          credentials: "include"
        });
        const data = await response.json();
        setSessionId(data.sessionId);
      } catch (error) {
        console.error("Failed to initialize session:", error);
        toast({
          title: "Connection Error",
          description: "Failed to start onboarding session. Please try again.",
          variant: "destructive"
        });
      }
    }
    
    if (!sessionId) {
      createSession();
    }
  }, [toast, sessionId]);

  // If user is logged in, use their user type as initial selection
  const initialUserType = user ? user.userType as 'athlete' | 'business' | null : null;

  const handleOnboardingComplete = (data: any) => {
    // Store any relevant data in local storage for dashboard display
    if (data.aiInsights) {
      localStorage.setItem('aiInsights', JSON.stringify(data.aiInsights));
    }
    
    if (data.recommendations) {
      localStorage.setItem('recommendations', JSON.stringify(data.recommendations));
    }
    
    // If there's a generated campaign for a business account, store it
    if (data.userType === 'business' && data.campaign) {
      localStorage.setItem('campaign', JSON.stringify(data.campaign));
    }

    // Show success message
    toast({
      title: "Profile Complete",
      description: "Your personalized profile has been created successfully!",
    });

    // Navigate to the dashboard based on user type
    setTimeout(() => {
      if (data.userType === 'athlete') {
        navigate("/athlete-dashboard");
      } else if (data.userType === 'business') {
        navigate("/business-dashboard");
      } else {
        navigate("/dashboard");
      }
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Personalized Onboarding
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tell us about yourself so we can create a tailored experience that 
            helps you find the perfect partnerships
          </p>
        </div>

        <div className="flex justify-center">
          <DynamicOnboardingForm 
            initialUserType={initialUserType}
            onComplete={handleOnboardingComplete}
            sessionId={sessionId}
          />
        </div>
      </div>
    </div>
  );
}