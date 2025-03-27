
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


export default function Home() {
  const [budgetValue, setBudgetValue] = useState([30000]);
  const [singleCampaign, setSingleCampaign] = useState(true);
  // Removed video ref
  
  // Removed video-related state and effects
  
  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                  Connecting Athletes & Brands
                </span>
                <br /> 
                For Authentic Partnerships
              </h1>
              <p className="text-xl text-zinc-400 max-w-xl">
                Contested leverages cutting-edge AI to precisely match athletes and brands, unlocking powerful, data-driven marketing partnerships built for genuine impact and measurable results.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold hover:from-red-600 hover:to-amber-600 transition-all shadow-md"
                  asChild
                >
                  <Link to="/dynamic-onboarding">Get Started</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-amber-500 text-white hover:bg-amber-500/10"
                  onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-assistant'))}
                >
                  Chat with AI Assistant
                </Button>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="text-zinc-400 text-sm flex items-center">
                  <span className="text-xl font-bold text-red-500 mr-2">500+</span>
                  <span>successful partnerships created this year</span>
                </div>
              </div>
            </div>
            <div className="relative h-72 md:h-96 lg:block">
              {/* Background styling */}
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-r from-red-500/5 to-amber-500/2 rounded-lg transform rotate-3"></div>
              
              {/* Visual content area */}
              <div className="absolute top-0 right-0 w-full h-full overflow-hidden rounded-lg flex items-center justify-center bg-zinc-900 z-10">
                {/* Static image placeholder with gradient overlay */}
                <div className="relative w-full h-full bg-gradient-to-tr from-red-600/30 to-amber-400/20 flex items-center justify-center">
                  {/* Center content */}
                  <div className="text-center px-6 py-8 rounded-xl bg-black/40 backdrop-blur-sm">
                    <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-amber-300">
                        Discover Your Perfect Match
                      </span>
                    </h3>
                    <p className="text-zinc-300 mb-4">
                      Join 500+ successful partnerships on our platform
                    </p>
                    <Button 
                      className="bg-red-500 hover:bg-red-600 text-white"
                      asChild
                    >
                      <Link to="/dynamic-onboarding">Start Today</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500 opacity-70"></div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 bg-[#111]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                The Contested Advantage
              </span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Our AI-powered platform creates perfect matches between athletes and businesses, 
              delivering authentic partnerships that drive real results.
            </p>
          </div>
          
          <Tabs defaultValue="athletes" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-900">
              <TabsTrigger value="athletes" className="text-lg py-3 flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-amber-500 data-[state=active]:text-white">Athletes</TabsTrigger>
              <TabsTrigger value="businesses" className="text-lg py-3 flex items-center justify-center data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-amber-500 data-[state=active]:text-white">Businesses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="athletes" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow border-none">
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
                
                <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow border-none">
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
                
                <Card className="bg-zinc-900 shadow-md hover:shadow-lg transition-shadow border-none">
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
              </div>
              
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
                  
                  <div className="flex items-center justify-center">
                    <Button className="bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600 w-full" asChild>
                      <Link to="/dynamic-onboarding">Get Started</Link>
                    </Button>
                  </div>
                </div>
              </div>
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
                  
                  <div className="flex items-center justify-center">
                    <Button className="bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600 w-full" asChild>
                      <Link to="/dynamic-onboarding">Get Started</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
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
            
            <div className="flex justify-center mt-8">
              <Button className="bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600 px-8 py-6 text-lg" asChild>
                <Link to="/explore-matches">Explore Athlete Matches</Link>
              </Button>
            </div>
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
                <Button className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600" asChild>
                  <Link to="/dynamic-onboarding">Find Your Match</Link>
                </Button>
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
                <Button className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600" asChild>
                  <Link to="/dynamic-onboarding">Find Your Match</Link>
                </Button>
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
                <Button className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600" asChild>
                  <Link to="/dynamic-onboarding">Contact Sales</Link>
                </Button>
              </div>
            </Card>
          </div>
          
          <div className="text-center mt-8 text-gray-400">
            All plans include a 14-day free trial. No credit card required.
          </div>
        </div>
      </section>
      
      {/* Testimonials / Success Stories */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                Success Stories
              </span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              See how athletes and businesses are creating winning partnerships with Contested.
            </p>
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
          
          <div className="mt-12 text-center">
            <Button variant="outline" className="border-red-500 text-white hover:bg-red-500/10">
              View More Success Stories
            </Button>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-zinc-950 text-white relative overflow-hidden border-t border-zinc-800">
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to create winning partnerships?</h2>
            <p className="text-xl text-zinc-400 mb-8">
              Whether you're an athlete looking to monetize your influence or a business seeking authentic brand ambassadors, Contested makes it easy to find your perfect match.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold hover:from-red-600 hover:to-amber-600 transition-all shadow-md"
                asChild
              >
                <Link to="/dynamic-onboarding">Find Your Athlete Match Now</Link>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-red-500 text-white hover:bg-red-500/10"
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-assistant'))}
              >
                Chat with AI Assistant
              </Button>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}
