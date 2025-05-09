import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import ChatInterface from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/FadeIn";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Parallax } from "@/components/animations/Parallax";
import { AnimatedGradient } from "@/components/animations/AnimatedGradient";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerContainer";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { useWebSocketContext } from "@/contexts/WebSocketProvider";

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const { user } = useSupabaseAuth();
  const webSocket = useWebSocketContext();
  
  // Connect to WebSocket and subscribe to relevant channels
  useEffect(() => {
    // Connect if not already connected
    if (!webSocket.isConnected) {
      webSocket.connect();
    }
    
    // Subscribe to channels when connection is authenticated
    if (webSocket.isAuthenticated) {
      // Subscribe to global updates channel
      webSocket.subscribe('global');
      
      // Subscribe to user-specific channel if logged in
      if (user?.id) {
        webSocket.subscribe(`user:${user.id}`);
      }
    }
    
    // Process any incoming messages invisibly
    const messageHandler = (event: CustomEvent) => {
      const message = event.detail;
      console.log('WebSocket message received:', message);
    };
    
    // Listen for custom WebSocket message events
    window.addEventListener('ws-message', messageHandler as EventListener);
    
    // Cleanup function
    return () => {
      // Unsubscribe from channels
      webSocket.unsubscribe('global');
      if (user?.id) {
        webSocket.unsubscribe(`user:${user.id}`);
      }
      
      // Remove event listener
      window.removeEventListener('ws-message', messageHandler as EventListener);
    };
  }, [webSocket.isConnected, webSocket.isAuthenticated, user?.id]);
  
  // Listen for the custom event to toggle the AI assistant
  useEffect(() => {
    const handleToggleAssistant = () => {
      setShowChat(prev => !prev);
    };
    
    window.addEventListener('toggle-ai-assistant', handleToggleAssistant);
    
    return () => {
      window.removeEventListener('toggle-ai-assistant', handleToggleAssistant);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Hero Section - Above the Fold */}
      <section className="relative overflow-hidden bg-black">
        <AnimatedGradient 
          className="absolute inset-0" 
          colors={['hsl(45, 100%, 50%, 0.15)', 'hsl(35, 100%, 50%, 0.15)', 'hsl(235, 100%, 50%, 0.15)']} 
          blur={100}
          duration={15}
        />

        {/* Background glass elements */}
        <div className="absolute w-40 h-40 top-1/4 right-1/4 glass-panel opacity-30 rounded-full"></div>
        <div className="absolute w-64 h-64 bottom-1/4 left-1/3 glass-panel opacity-20 rounded-full"></div>
        <div className="absolute w-24 h-24 top-1/3 left-1/4 glass-panel opacity-30 rounded-full"></div>
        
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-6 py-24 md:py-32 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span>Fair‑Play Sponsorships,</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#FFBF0D] to-amber-500">
                  Powered by Data
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10">
                Our engine evaluates 224+ performance and audience signals to unite emerging athletes with growth‑hungry brands—fast, transparent, and on your terms.
              </p>
            </motion.div>
            
            {/* Dual CTAs */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 mb-16 w-full max-w-lg mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/athlete/sign-up" className="w-full sm:w-1/2">
                <motion.div 
                  className="glass-button bg-[#FFBF0D]/80 hover:bg-[#FFBF0D] text-black font-semibold w-full"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  I'm an Athlete <span className="block text-sm">→ Claim My Profile</span>
                </motion.div>
              </Link>
              <Link href="/business/sign-up" className="w-full sm:w-1/2">
                <motion.div 
                  className="glass-button border-white/20 bg-transparent w-full"
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  I'm a Business <span className="block text-sm">→ Start Free Trial</span>
                </motion.div>
              </Link>
            </motion.div>
            
            {/* Proof Strip */}
            <motion.div
              className="glass-card p-6 w-full max-w-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="font-bold text-[#FFBF0D] text-2xl md:text-3xl">17,000+</p>
                  <p className="text-gray-300">campaigns launched</p>
                </div>
                <div>
                  <p className="font-bold text-[#FFBF0D] text-2xl md:text-3xl">$12.3M</p>
                  <p className="text-gray-300">earned by athletes</p>
                </div>
                <div>
                  <p className="font-bold text-[#FFBF0D] text-2xl md:text-3xl">98%</p>
                  <p className="text-gray-300">contract‑completion rate</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FFBF0D] to-amber-500 opacity-70"></div>
      </section>
      
      {/* Why Contested Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        <AnimatedGradient 
          className="absolute inset-0" 
          colors={['hsl(45, 100%, 50%, 0.08)', 'hsl(235, 100%, 50%, 0.05)', 'hsl(345, 90%, 55%, 0.05)']} 
          blur={120}
          duration={20}
        />
        
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-3"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFBF0D] to-amber-400">Contested</span>
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <motion.div 
              className="glass-card p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(255, 191, 13, 0.3)" }}
            >
              <h3 className="text-xl font-bold mb-3 text-[#FFBF0D]">Hundreds of Data Points, One Perfect Match</h3>
              <p className="text-gray-300">We score alignment on reach, relevance, brand values, and predicted ROI—so no one wastes a pitch.</p>
            </motion.div>
            
            <motion.div 
              className="glass-card p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(255, 191, 13, 0.3)" }}
            >
              <h3 className="text-xl font-bold mb-3 text-[#FFBF0D]">Wizard‑Built Campaigns</h3>
              <p className="text-gray-300">Auto‑generate briefs, contracts, KPIs, and compliant payouts in under seven minutes.</p>
            </motion.div>
            
            <motion.div 
              className="glass-card p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(255, 191, 13, 0.3)" }}
            >
              <h3 className="text-xl font-bold mb-3 text-[#FFBF0D]">Transparent Economics</h3>
              <p className="text-gray-300">Athletes set the price; businesses see true costs up front. No hidden fees. Ever.</p>
            </motion.div>
            
            <motion.div 
              className="glass-card p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(255, 191, 13, 0.3)" }}
            >
              <h3 className="text-xl font-bold mb-3 text-[#FFBF0D]">Compliance at the Core</h3>
              <p className="text-gray-300">NCAA, NFHS, FTC, and tax guardrails are baked in, so every deal is headache‑free.</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-24 bg-black relative overflow-hidden">
        <AnimatedGradient 
          className="absolute inset-0" 
          colors={['hsl(235, 100%, 50%, 0.05)', 'hsl(45, 100%, 50%, 0.08)', 'hsl(345, 90%, 55%, 0.05)']} 
          blur={120}
          duration={20}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFBF0D] to-amber-400">Works</span>
            </h2>
          </motion.div>
          
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto" staggerChildren={0.1}>
            <StaggerItem className="glass-card p-8 relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-[#FFBF0D] flex items-center justify-center text-black font-bold text-xl">1</div>
              <h3 className="text-xl font-bold mb-3 text-white mt-4">Create Your Profile</h3>
              <p className="text-gray-300">Fill in the essentials; our AI enriches the rest with verified stats and social insights.</p>
            </StaggerItem>
            
            <StaggerItem className="glass-card p-8 relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-[#FFBF0D] flex items-center justify-center text-black font-bold text-xl">2</div>
              <h3 className="text-xl font-bold mb-3 text-white mt-4">Instant Match Score</h3>
              <p className="text-gray-300">Our algorithm calculates fit scores based on your history, audience, and brand requirements.</p>
            </StaggerItem>
            
            <StaggerItem className="glass-card p-8 relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-[#FFBF0D] flex items-center justify-center text-black font-bold text-xl">3</div>
              <h3 className="text-xl font-bold mb-3 text-white mt-4">Direct Contracts</h3>
              <p className="text-gray-300">Accept campaigns with one click—each with clear deliverables and transparent payment terms.</p>
            </StaggerItem>
            
            <StaggerItem className="glass-card p-8 relative">
              <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-[#FFBF0D] flex items-center justify-center text-black font-bold text-xl">4</div>
              <h3 className="text-xl font-bold mb-3 text-white mt-4">Instant Payments</h3>
              <p className="text-gray-300">Get paid within 48 hours of content approval—no invoicing or nagging required.</p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>
      
      {/* WebSocket connection is handled invisibly in the background */}

      {/* Closing Banner */}
      <section className="py-20 bg-gradient-to-br from-black to-zinc-900 relative overflow-hidden">
        <AnimatedGradient 
          className="absolute inset-0" 
          colors={['hsl(45, 100%, 50%, 0.15)', 'hsl(235, 100%, 50%, 0.08)', 'hsl(345, 90%, 55%, 0.08)']} 
          blur={120}
          duration={20}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Win on Your Own Terms?
              </h2>
              <p className="text-xl text-gray-300 mb-10">
                Spots for the next matching window close May 12.
              </p>
              
              <Link href="/auth">
                <motion.div
                  className="glass-button bg-[#FFBF0D]/80 hover:bg-[#FFBF0D] text-black font-semibold inline-block"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Join Contested Now
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Show chat interface is active */}
      {showChat && (
        <div className="fixed bottom-6 right-6 z-50">
          <ChatInterface />
        </div>
      )}
    </div>
  );
}