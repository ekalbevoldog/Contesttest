import React, { useState } from "react";
import { FadeIn } from "@/components/animations/FadeIn";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AnimatedGradient } from "@/components/animations/AnimatedGradient";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerContainer";
import { useLocation } from "wouter";

export default function SimpleOnboarding() {
  const [userType, setUserType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would submit this data to the server
    console.log({ userType, name, email });
    // Redirect to home for now
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <AnimatedGradient 
        className="absolute inset-0" 
        colors={['hsl(345, 90%, 55%, 0.1)', 'hsl(235, 100%, 50%, 0.1)', 'hsl(20, 100%, 50%, 0.1)']} 
        blur={150}
        duration={20}
      />
      
      <FadeIn delay={0.2} direction="up" className="z-10">
        <div className="max-w-md w-full bg-zinc-900/80 backdrop-blur-md p-8 rounded-xl border border-zinc-800 shadow-xl">
          <StaggerContainer className="space-y-6">
            <StaggerItem>
              <h1 className="text-3xl font-bold mb-2 text-center">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                  Join Contested
                </span>
              </h1>
              <p className="text-zinc-400 text-center mb-6">
                Connect with the perfect partnerships for your brand or athletic career
              </p>
            </StaggerItem>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <StaggerItem>
                <div className="space-y-2">
                  <label htmlFor="userType" className="block text-sm font-medium text-gray-300">
                    I am a:
                  </label>
                  <select 
                    id="userType" 
                    className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    required
                  >
                    <option value="">Please select...</option>
                    <option value="athlete">College Athlete</option>
                    <option value="business">Business/Brand</option>
                  </select>
                </div>
              </StaggerItem>
              
              <StaggerItem>
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </StaggerItem>
              
              <StaggerItem>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full p-3 bg-zinc-800/90 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-500 transition-colors"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </StaggerItem>
              
              <StaggerItem>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-amber-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                >
                  Continue
                </button>
              </StaggerItem>
              
              <StaggerItem>
                <p className="text-sm text-center text-gray-400 mt-4">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </StaggerItem>
            </form>
          </StaggerContainer>
        </div>
      </FadeIn>
    </div>
  );
}