import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import EnhancedOnboardingForm from "@/components/EnhancedOnboardingForm";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function EnhancedOnboarding() {
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

  // Handle completion of onboarding process
  const handleOnboardingComplete = (data: any) => {
    console.log("Onboarding completed with data:", data);
    
    // Determine where to redirect based on user type
    if (data.userType === 'athlete') {
      navigate('/athlete/dashboard');
    } else if (data.userType === 'business') {
      navigate('/business/dashboard');
    } else {
      navigate('/');
    }
  };

  // If user is logged in, use their user type as initial selection
  const initialUserType = user ? user.userType as 'athlete' | 'business' | null : null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 to-black py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold tracking-tight mb-3 text-white">
              Personalized Onboarding
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Tell us about yourself so we can create a tailored experience that 
              helps you find the perfect partnerships
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center"
        >
          <EnhancedOnboardingForm 
            initialUserType={initialUserType}
            onComplete={handleOnboardingComplete}
            sessionId={sessionId}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}