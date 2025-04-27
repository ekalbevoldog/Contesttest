
import { useState, useEffect } from "react";
import { Link } from "wouter";
import ChatInterface from "@/components/ChatInterface";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/animations/FadeIn";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Parallax } from "@/components/animations/Parallax";
import { AnimatedGradient } from "@/components/animations/AnimatedGradient";
import { StaggerContainer, StaggerItem } from "@/components/animations/StaggerContainer";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [budgetValue, setBudgetValue] = useState([30000]);
  const [singleCampaign, setSingleCampaign] = useState(true);
  const { user } = useSupabaseAuth();
  
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
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black">
        <AnimatedGradient 
          className="absolute inset-0" 
          colors={['hsl(345, 90%, 55%, 0.15)', 'hsl(35, 100%, 50%, 0.15)', 'hsl(235, 100%, 50%, 0.15)']} 
          blur={100}
          duration={15}
        />
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <StaggerContainer className="space-y-6">
              <StaggerItem>
                <FadeIn delay={0.2} direction="up">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                      Connecting Athletes & Brands
                    </span>
                    <br /> 
                    For Authentic Partnerships
                  </h1>
                </FadeIn>
              </StaggerItem>
              
              <StaggerItem>
                <FadeIn delay={0.4} direction="up">
                  <p className="text-xl text-zinc-400 max-w-xl">
                    Contested is the premier platform connecting mid-tier athletes with small-to-medium businesses for powerful, authentic marketing partnerships.
                  </p>
                </FadeIn>
              </StaggerItem>
              
              <StaggerItem>
                <FadeIn delay={0.6} direction="up">
                  {/* Buttons have been removed */}
                </FadeIn>
              </StaggerItem>
              
              <StaggerItem>
                <FadeIn delay={0.8} direction="up">
                  <div className="flex items-center gap-4 pt-4">
                    <div className="text-zinc-400 text-sm flex items-center">
                      <span className="text-xl font-bold text-red-500 mr-2">500+</span>
                      <span>successful partnerships created this year</span>
                    </div>
                  </div>
                </FadeIn>
              </StaggerItem>
            </StaggerContainer>
            
            <FadeIn delay={0.5} direction="left" className="relative h-72 md:h-96 hidden lg:block">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-r from-red-500/5 to-amber-500/2 rounded-lg transform rotate-3"></div>
              <div className="absolute top-0 right-0 w-full h-full overflow-hidden rounded-lg flex items-center justify-center">
                <video 
                  className="w-full h-full object-cover rounded-lg"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src="/videos/landing-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </FadeIn>
          </div>
        </div>
        
        {/* Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500 opacity-70"></div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 bg-[#111] relative overflow-hidden">
        <AnimatedGradient 
          className="absolute inset-0" 
          colors={['hsl(235, 100%, 50%, 0.05)', 'hsl(345, 90%, 55%, 0.05)']} 
          blur={120}
          duration={20}
        />
        <div className="container mx-auto px-4">
          <ScrollReveal className="text-center mb-16" threshold={0.2}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                The Contested Advantage
              </span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Our AI-powered platform creates perfect matches between athletes and businesses, 
              delivering authentic partnerships that drive real results.
            </p>
          </ScrollReveal>
          
          <Tabs defaultValue="athletes" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-900">
              <TabsTrigger value="athletes" className="text-lg py-3 flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-amber-500 data-[state=active]:text-white">Athletes</TabsTrigger>
              <TabsTrigger value="businesses" className="text-lg py-3 flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-amber-500 data-[state=active]:text-white">Businesses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="athletes" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <ScrollReveal delay={0.1} direction="up" distance={20}>
                  <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow border-none h-full">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-white">Monetize Your Influence</h3>
                      <p className="text-zinc-400">
                        Turn your social media presence and athletic achievements into income with partnerships that respect your personal brand.
                      </p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
                
                <ScrollReveal delay={0.2} direction="up" distance={20}>
                  <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow border-none h-full">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-white">Vetted Opportunities</h3>
                      <p className="text-zinc-400">
                        Access quality partnership opportunities specifically matched to your sport, values, content style, and audience.
                      </p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
                
                <ScrollReveal delay={0.3} direction="up" distance={20}>
                  <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow border-none h-full">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-white">Career Growth</h3>
                      <p className="text-zinc-400">
                        Build a portfolio of professional collaborations that can lead to bigger opportunities throughout your career.
                      </p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </div>
              
              <ScrollReveal delay={0.4} direction="up" distance={20} className="w-full">
                <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 shadow-lg mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-black p-5 rounded-lg shadow-md">
                      <h4 className="text-base font-semibold text-zinc-400 mb-1">Average<br />Compensation</h4>
                      <div className="text-3xl font-bold text-red-500 flex items-center">
                        <span>$250</span>
                      </div>
                      <p className="text-xs text-zinc-500">per campaign</p>
                    </div>
                    
                    <div className="bg-black p-5 rounded-lg shadow-md">
                      <h4 className="text-base font-semibold text-zinc-400 mb-1">Match Rate</h4>
                      <div className="text-3xl font-bold text-red-500 flex items-center">
                        <span>92%</span>
                      </div>
                      <p className="text-xs text-zinc-500">of athletes find matches</p>
                    </div>
                    
                    <div className="bg-black p-5 rounded-lg shadow-md">
                      <h4 className="text-base font-semibold text-zinc-400 mb-1">Time to First<br />Match</h4>
                      <div className="text-3xl font-bold text-red-500 flex items-center">
                        <span>48hrs</span>
                      </div>
                      <p className="text-xs text-zinc-500">average timeframe</p>
                    </div>
                    
                    <div className="bg-black p-5 rounded-lg shadow-md">
                      <h4 className="text-base font-semibold text-zinc-400 mb-1">Athletes</h4>
                      <div className="text-3xl font-bold text-red-500 flex items-center">
                        <span>300+</span>
                      </div>
                      <p className="text-xs text-zinc-500">active on platform</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </TabsContent>
            
            <TabsContent value="businesses" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow border-none">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">Authentic Influencers</h3>
                    <p className="text-zinc-400">
                      Connect with college athletes who genuinely align with your brand values and can authentically represent your products.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow border-none">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">Measurable Results</h3>
                    <p className="text-zinc-400">
                      Get detailed analytics on campaign performance and engagement to track your return on investment.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow border-none">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">Cost-Effective</h3>
                    <p className="text-zinc-400">
                      Access quality influencer marketing at a fraction of the cost of traditional celebrity endorsements.
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 shadow-lg mt-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-black p-5 rounded-lg shadow-md">
                    <h4 className="text-base font-semibold text-zinc-400 mb-1">Average ROI</h4>
                    <div className="text-3xl font-bold text-red-500 flex items-center">
                      <span>3.37x</span>
                    </div>
                    <p className="text-xs text-zinc-500">return on investment</p>
                  </div>
                  
                  <div className="bg-black p-5 rounded-lg shadow-md">
                    <h4 className="text-base font-semibold text-zinc-400 mb-1">Engagement Rate</h4>
                    <div className="text-3xl font-bold text-red-500 flex items-center">
                      <span>5.52%</span>
                    </div>
                    <p className="text-xs text-zinc-500">avg. across platforms</p>
                  </div>
                  
                  <div className="bg-black p-5 rounded-lg shadow-md">
                    <h4 className="text-base font-semibold text-zinc-400 mb-1">Audience Reached</h4>
                    <div className="text-3xl font-bold text-red-500 flex items-center">
                      <span>1.12M+</span>
                    </div>
                    <p className="text-xs text-zinc-500">monthly impressions</p>
                  </div>
                  
                  <div className="bg-black p-5 rounded-lg shadow-md">
                    <h4 className="text-base font-semibold text-zinc-400 mb-1">Businesses</h4>
                    <div className="text-3xl font-bold text-red-500 flex items-center">
                      <span>150+</span>
                    </div>
                    <p className="text-xs text-zinc-500">active on platform</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-24 bg-[#080808] relative overflow-hidden">
        <AnimatedGradient 
          className="absolute inset-0 opacity-30" 
          colors={['hsl(345, 90%, 55%, 0.05)', 'hsl(235, 100%, 50%, 0.05)']} 
          blur={150}
          duration={25}
        />
        <Parallax direction="up" speed={0.1} className="relative z-10">
          <div className="container mx-auto px-4">
            <ScrollReveal className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                  How Contested Works
                </span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Our intelligent platform makes the connection process seamless for both athletes and businesses
              </p>
            </ScrollReveal>
            
            <BentoGrid className="max-w-6xl mx-auto mb-16">
              <BentoGridItem
                title="Create Your Profile"
                description="Athletes and businesses build detailed profiles highlighting unique strengths, preferences, and campaign goals."
                className="col-span-1 row-span-1 border border-zinc-800"
                header={
                  <div className="bg-gradient-to-br from-red-600/20 to-amber-500/20 w-full h-40 rounded-t-lg flex items-center justify-center">
                    <svg className="h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                }
                delay={0.1}
              />
              
              <BentoGridItem
                title="AI-Powered Matching"
                description="Our intelligent algorithm analyzes profiles to suggest perfect partnerships that align with values, goals, and audience demographics."
                className="col-span-2 row-span-1 border border-zinc-800"
                header={
                  <div className="bg-gradient-to-br from-indigo-600/20 to-purple-500/20 w-full h-40 rounded-t-lg flex items-center justify-center">
                    <svg className="h-16 w-16 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"></path>
                    </svg>
                  </div>
                }
                delay={0.2}
              />
              
              <BentoGridItem
                title="Review & Connect"
                description="Browse partnership opportunities, review detailed matches, and initiate conversations with potential partners."
                className="col-span-2 row-span-1 border border-zinc-800"
                header={
                  <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 w-full h-40 rounded-t-lg flex items-center justify-center">
                    <svg className="h-16 w-16 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"></path>
                    </svg>
                  </div>
                }
                delay={0.3}
              />
              
              <BentoGridItem
                title="Campaign Collaboration"
                description="Design and execute campaigns with all tools needed for successful partnerships, from content planning to performance tracking."
                className="col-span-1 row-span-1 border border-zinc-800"
                header={
                  <div className="bg-gradient-to-br from-green-600/20 to-teal-500/20 w-full h-40 rounded-t-lg flex items-center justify-center">
                    <svg className="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"></path>
                    </svg>
                  </div>
                }
                delay={0.4}
              />
              
              <BentoGridItem
                title="Payment & Compliance"
                description="Secure, transparent payment processing and built-in compliance assistance to navigate NIL regulations with confidence."
                className="col-span-3 row-span-1 border border-zinc-800"
                header={
                  <div className="bg-gradient-to-br from-blue-600/20 to-cyan-500/20 w-full h-40 rounded-t-lg flex items-center justify-center">
                    <svg className="h-16 w-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"></path>
                    </svg>
                  </div>
                }
                delay={0.5}
              />
            </BentoGrid>
            
            {/* Button removed */}
          </div>
        </Parallax>
      </section>
      
      {/* Budget Exploration Section */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                Discover the right athlete partnership for your budget
              </span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Explore what's possible at different investment levels before you commit
            </p>
          </div>
          
          <div className="mb-8">
            <label className="block text-zinc-400 text-lg mb-2">Explore Budget Ranges</label>
            <div className="flex items-center mb-4">
              <span className="text-4xl md:text-5xl font-bold text-red-500">
                ${budgetValue[0]}
              </span>
            </div>
            
            <div className="py-6">
              <Slider
                defaultValue={[30000]}
                max={30000}
                min={500}
                step={100}
                value={budgetValue}
                onValueChange={setBudgetValue}
              />
              
              {/* Tick marks */}
              <div className="flex justify-between text-zinc-500 text-sm mt-4">
                <span>$500</span>
                <span>$10,000</span>
                <span>$20,000</span>
                <span>$30,000+</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 p-6 rounded-lg border border-blue-800/40 text-white mb-10">
              <div className="flex items-start mb-2">
                <span className="text-3xl font-bold text-blue-300 mr-2">
                  {budgetValue[0] <= 1000 ? "350+" : 
                   budgetValue[0] <= 3000 ? "750+" : 
                   budgetValue[0] <= 10000 ? "1050+" : 
                   budgetValue[0] <= 20000 ? "1500+" : "2000+"}
                </span>
                <span className="text-lg mt-1">potential athlete matches in this range</span>
              </div>
              <p className="text-blue-200/90 text-sm">
                {budgetValue[0] <= 3000 ? 
                  "Perfect for testing the waters with micro-influencers who have highly engaged niche followers." : 
                  budgetValue[0] <= 10000 ? 
                  "Great for medium-influence athletes who can create dedicated content across multiple platforms." : 
                  "Ideal for high-profile athletes featuring multiple deliverables and long-term partnerships."}
              </p>
            </div>
            
            {/* Button removed */}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-20 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                Simple, Transparent Pricing
              </span>
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Choose the plan that's right for you, with no hidden fees or long-term commitments.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <Card id="basic-plan" className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden border-none">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1 text-white">Basic</h3>
                <p className="text-zinc-400 text-sm mb-4">Perfect for getting started</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">$99</span>
                  <span className="text-zinc-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8 text-zinc-400">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Up to 3 active campaigns</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>10 athlete matches per month</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Basic analytics</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Email support</span>
                  </li>
                </ul>
                {/* Basic Plan Button Removed */}
              </div>
            </Card>
            
            {/* Pro Plan */}
            <Card className="bg-zinc-900 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden border-red-500 border-2">
              <div className="absolute -right-12 top-8 bg-red-500 text-white py-1 px-12 transform rotate-45">
                <span className="text-xs font-bold">POPULAR</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1 text-white">Professional</h3>
                <p className="text-zinc-400 text-sm mb-4">For growing businesses</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">$249</span>
                  <span className="text-zinc-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8 text-zinc-400">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Up to 10 active campaigns</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Unlimited athlete matches</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Advanced analytics dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Priority matching algorithm</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Priority support</span>
                  </li>
                </ul>
                {/* Professional Plan Button Removed */}
              </div>
            </Card>
            
            {/* Enterprise Plan */}
            <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden border-none">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1 text-white">Enterprise</h3>
                <p className="text-zinc-400 text-sm mb-4">For larger organizations</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">$749</span>
                  <span className="text-zinc-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8 text-zinc-400">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Unlimited campaigns</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Unlimited athlete matches</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Custom reporting & API access</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Strategic campaign consulting</span>
                  </li>
                </ul>
                {/* Enterprise Plan Button Removed */}
              </div>
            </Card>
          </div>
          
          <div className="text-center mt-8 text-gray-400">
            All plans include a 14-day free trial. No credit card required.
          </div>
        </div>
      </section>
      
      {/* Testimonials / Success Stories */}
      <section className="py-20 bg-black relative overflow-hidden">
        <AnimatedGradient 
          className="absolute inset-0 opacity-20" 
          colors={['hsl(345, 90%, 55%, 0.05)', 'hsl(35, 100%, 50%, 0.05)', 'hsl(235, 100%, 50%, 0.05)']} 
          blur={120}
          duration={20}
        />
        <Parallax direction="up" speed={0.15} className="relative z-10">
          <div className="container mx-auto px-4">
            <ScrollReveal className="text-center mb-16" threshold={0.1}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                  Success Stories
                </span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                See how athletes and businesses are creating winning partnerships with Contested.
              </p>
            </ScrollReveal>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow overflow-hidden border-none">
              <div className="flex flex-col h-full">
                <div className="bg-gradient-to-r from-red-500 to-amber-500 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">Sarah Johnson</h3>
                      <p className="text-white/80">Division I Volleyball Player</p>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <p className="text-zinc-400 italic mb-4">
                    "Contested has completely changed how I approach NIL opportunities. Within my first month, I secured partnerships with three local businesses that perfectly aligned with my personal values. The AI matching technology is incredible!"
                  </p>
                  <div className="flex items-center">
                    <div className="text-red-500 font-bold">Results:</div>
                    <div className="ml-2 text-zinc-400">3 partnerships, $3,500 in revenue</div>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow overflow-hidden border-none">
              <div className="flex flex-col h-full">
                <div className="bg-gradient-to-r from-red-500 to-amber-500 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">Mountain Outfitters</h3>
                      <p className="text-white/80">Outdoor Apparel Brand</p>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <p className="text-zinc-400 italic mb-4">
                    "As a growing outdoor brand, we wanted to connect with authentic voices who love nature and adventure. Contested matched us with hikers, climbers, and trail runners who genuinely use and love our products. The ROI has been incredible."
                  </p>
                  <div className="flex items-center">
                    <div className="text-red-500 font-bold">Results:</div>
                    <div className="ml-2 text-zinc-400">4.2x ROI, 230% increase in social engagement</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          {/* View More Success Stories button removed */}
        </Parallax>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-zinc-950 text-white relative overflow-hidden border-t border-zinc-800">
        <AnimatedGradient 
          className="absolute inset-0 opacity-20" 
          colors={['hsl(345, 90%, 55%, 0.1)', 'hsl(235, 100%, 50%, 0.1)']} 
          blur={120}
          duration={15}
        />
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <Parallax direction="up" speed={0.05} className="relative z-10">
          <div className="container mx-auto px-4">
            <ScrollReveal className="max-w-3xl mx-auto text-center" threshold={0.1}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to create winning partnerships?</h2>
              <p className="text-xl text-zinc-400 mb-8">
                Whether you're an athlete looking to monetize your influence or a business seeking authentic brand ambassadors, Contested makes it easy to find your perfect match.
              </p>
              {/* CTA buttons removed */}
            </ScrollReveal>
          </div>
        </Parallax>
      </section>
      
      {/* Chat Interface */}
      {showChat && (
        <div className="fixed bottom-8 right-8 z-50 max-w-md w-full shadow-2xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-amber-500 text-white p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Contested Assistant</h3>
            <button 
              onClick={() => setShowChat(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="bg-zinc-950 p-2">
            <ChatInterface />
          </div>
        </div>
      )}
      
    </div>
  );
}
