
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatInterface from "@/components/ChatInterface";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#001d3d] to-[#003566] text-white">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm font-medium">New Platform</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                  Connecting Athletes & Brands
                </span>
                <br /> 
                For Authentic Partnerships
              </h1>
              <p className="text-xl text-blue-100 max-w-xl">
                Contested is the premier platform connecting mid-tier athletes with small-to-medium businesses for powerful, authentic marketing partnerships.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-[#ffd60a] to-[#ffc300] text-[#001d3d] font-bold hover:from-[#ffc300] hover:to-[#ffc300] transition-all shadow-md"
                  asChild
                >
                  <Link to="/find-athlete-match">Find Your Perfect Athlete Match</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-blue-300 text-blue-100 hover:bg-blue-900/30"
                  onClick={() => setShowChat(true)}
                >
                  Chat with AI Assistant
                </Button>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 border-2 border-[#001d3d] flex items-center justify-center text-xs font-bold">
                      {i}
                    </div>
                  ))}
                </div>
                <p className="text-blue-200 text-sm">
                  <span className="font-bold">500+</span> successful partnerships created this year
                </p>
              </div>
            </div>
            <div className="relative h-72 md:h-96 hidden lg:block">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-r from-blue-600/30 to-cyan-400/40 rounded-lg transform rotate-3 opacity-70"></div>
              <div className="absolute top-0 right-0 w-full h-full overflow-hidden rounded-lg shadow-2xl flex items-center justify-center">
                <img 
                  src="/contested-logo.svg" 
                  alt="Contested" 
                  className="w-48 h-48 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="h-full w-full">
            <path fill="#f9fafb" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,122.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#003566] to-[#0466c8]">
                The Contested Advantage
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI-powered platform creates perfect matches between athletes and businesses, 
              delivering authentic partnerships that drive real results.
            </p>
          </div>
          
          <Tabs defaultValue="athletes" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="athletes" className="text-lg py-3">For Athletes</TabsTrigger>
              <TabsTrigger value="businesses" className="text-lg py-3">For Businesses</TabsTrigger>
            </TabsList>
            
            <TabsContent value="athletes" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Monetize Your Influence</h3>
                    <p className="text-gray-600">
                      Turn your social media presence and athletic achievements into income with partnerships that respect your personal brand.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Vetted Opportunities</h3>
                    <p className="text-gray-600">
                      Access quality partnership opportunities specifically matched to your sport, values, content style, and audience.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Career Growth</h3>
                    <p className="text-gray-600">
                      Build a portfolio of professional collaborations that can lead to bigger opportunities throughout your career.
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg shadow-inner">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h4 className="text-lg font-bold text-blue-900 mb-2">Average Compensation</h4>
                    <div className="text-3xl font-bold text-blue-600">$2,500</div>
                    <p className="text-sm text-gray-500">per campaign</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h4 className="text-lg font-bold text-blue-900 mb-2">Match Rate</h4>
                    <div className="text-3xl font-bold text-blue-600">92%</div>
                    <p className="text-sm text-gray-500">of athletes find matches</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h4 className="text-lg font-bold text-blue-900 mb-2">Time to First Match</h4>
                    <div className="text-3xl font-bold text-blue-600">48 hrs</div>
                    <p className="text-sm text-gray-500">average timeframe</p>
                  </div>
                  
                  <div className="ml-auto flex items-center">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white" asChild>
                      <Link to="/find-athlete-match">Find Your Perfect Match</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="businesses" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Authentic Influencers</h3>
                    <p className="text-gray-600">
                      Connect with college athletes who genuinely align with your brand values and can authentically represent your products.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Measurable Results</h3>
                    <p className="text-gray-600">
                      Get detailed analytics on campaign performance and engagement to track your return on investment.
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Cost-Effective</h3>
                    <p className="text-gray-600">
                      Access quality influencer marketing at a fraction of the cost of traditional celebrity endorsements.
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg shadow-inner">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h4 className="text-lg font-bold text-blue-900 mb-2">Average ROI</h4>
                    <div className="text-3xl font-bold text-blue-600">3.7x</div>
                    <p className="text-sm text-gray-500">return on investment</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h4 className="text-lg font-bold text-blue-900 mb-2">Engagement Rate</h4>
                    <div className="text-3xl font-bold text-blue-600">5.2%</div>
                    <p className="text-sm text-gray-500">avg. across platforms</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h4 className="text-lg font-bold text-blue-900 mb-2">Audience Reached</h4>
                    <div className="text-3xl font-bold text-blue-600">1.2M+</div>
                    <p className="text-sm text-gray-500">monthly impressions</p>
                  </div>
                  
                  <div className="ml-auto flex items-center">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white" asChild>
                      <Link to="/find-athlete-match">Find Your Perfect Match</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#003566] to-[#0466c8]">
                Simple, Transparent Pricing
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the plan that's right for you, with no hidden fees or long-term commitments.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <Card id="basic-plan" className="bg-white shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">Basic</h3>
                <p className="text-gray-500 text-sm mb-4">Perfect for getting started</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Up to 3 active campaigns</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>10 athlete matches per month</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Basic analytics</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Email support</span>
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white" asChild>
                  <Link to="/find-athlete-match">Find Your Match</Link>
                </Button>
              </div>
            </Card>
            
            {/* Pro Plan */}
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden border-blue-500 border-2">
              <div className="absolute -right-12 top-8 bg-blue-600 text-white py-1 px-12 transform rotate-45">
                <span className="text-xs font-bold">POPULAR</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">Professional</h3>
                <p className="text-gray-500 text-sm mb-4">For growing businesses</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$249</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Up to 10 active campaigns</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Unlimited athlete matches</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Advanced analytics dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Priority matching algorithm</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white" asChild>
                  <Link to="/find-athlete-match">Find Your Match</Link>
                </Button>
              </div>
            </Card>
            
            {/* Enterprise Plan */}
            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">Enterprise</h3>
                <p className="text-gray-500 text-sm mb-4">For larger organizations</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$749</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Unlimited campaigns</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Unlimited athlete matches</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Custom reporting & API access</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Dedicated account manager</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Strategic campaign consulting</span>
                  </li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white" asChild>
                  <Link to="/find-athlete-match">Contact Sales</Link>
                </Button>
              </div>
            </Card>
          </div>
          
          <div className="text-center mt-8 text-gray-500">
            All plans include a 14-day free trial. No credit card required.
          </div>
        </div>
      </section>
      
      {/* Testimonials / Success Stories */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#003566] to-[#0466c8]">
                Success Stories
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See how athletes and businesses are creating winning partnerships with Contested.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">Sarah Johnson</h3>
                      <p className="text-blue-100">Division I Volleyball Player</p>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <p className="text-gray-600 italic mb-4">
                    "Contested has completely changed how I approach NIL opportunities. Within my first month, I secured partnerships with three local businesses that perfectly aligned with my personal values. The AI matching technology is incredible!"
                  </p>
                  <div className="flex items-center">
                    <div className="text-blue-600 font-bold">Results:</div>
                    <div className="ml-2">3 partnerships, $3,500 in revenue</div>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex flex-col h-full">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">Mountain Outfitters</h3>
                      <p className="text-blue-100">Outdoor Apparel Brand</p>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <p className="text-gray-600 italic mb-4">
                    "As a growing outdoor brand, we wanted to connect with authentic voices who love nature and adventure. Contested matched us with hikers, climbers, and trail runners who genuinely use and love our products. The ROI has been incredible."
                  </p>
                  <div className="flex items-center">
                    <div className="text-blue-600 font-bold">Results:</div>
                    <div className="ml-2">4.2x ROI, 230% increase in social engagement</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              View More Success Stories
            </Button>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#001d3d] to-[#003566] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/pattern-dots.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to create winning partnerships?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Whether you're an athlete looking to monetize your influence or a business seeking authentic brand ambassadors, Contested makes it easy to find your perfect match.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-[#ffd60a] to-[#ffc300] text-[#001d3d] font-bold hover:from-[#ffc300] hover:to-[#ffc300] transition-all shadow-md"
                asChild
              >
                <Link to="/find-athlete-match">Find Your Athlete Match Now</Link>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="border-blue-300 text-blue-100 hover:bg-blue-900/30"
                onClick={() => setShowChat(true)}
              >
                Chat with AI Assistant
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Chat Interface */}
      {showChat && (
        <div className="fixed bottom-8 right-8 z-50 max-w-md w-full shadow-2xl rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#003566] to-[#0466c8] text-white p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Contested Assistant</h3>
            <button 
              onClick={() => setShowChat(false)}
              className="text-blue-100 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div className="bg-white p-2">
            <ChatInterface />
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}
