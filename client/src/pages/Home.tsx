import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Star, Trophy, DollarSign, PieChart, Users } from "lucide-react";

export default function Home() {
  const [budgetValue, setBudgetValue] = useState([30000]);
  const [singleCampaign, setSingleCampaign] = useState(true);

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
                Contested is the premier platform connecting mid-tier athletes with small-to-medium businesses for powerful, authentic marketing partnerships.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold hover:from-red-600 hover:to-amber-600 transition-all shadow-md"
                  asChild
                >
                  <Link to="/enhanced-onboarding">Get Started</Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-red-500 text-white hover:bg-red-500/10"
                  asChild
                >
                  <Link to="/enhanced-onboarding">Personalized Onboarding</Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="text-zinc-400 text-sm flex items-center">
                  <span className="text-xl font-bold text-red-500 mr-2">500+</span>
                  <span>successful partnerships created this year</span>
                </div>
              </div>
            </div>
            <div className="relative h-72 md:h-96 hidden lg:block">
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-r from-red-500/5 to-amber-500/2 rounded-lg transform rotate-3"></div>
              <div className="absolute top-0 right-0 w-full h-full overflow-hidden rounded-lg flex items-center justify-center">
                <div className="w-full h-full bg-zinc-900 rounded-lg flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-r from-red-500 to-amber-500 rounded-full flex items-center justify-center mb-4">
                      <Trophy className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">AI-Powered Matching</h3>
                    <p className="text-zinc-400">Our intelligent algorithm creates perfect partnerships between athletes and brands.</p>
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
                      <DollarSign className="h-6 w-6" />
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
                      <CheckCircle className="h-6 w-6" />
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
                      <PieChart className="h-6 w-6" />
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
                      <Link to="/enhanced-onboarding">Find Your Perfect Match</Link>
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
                      <Users className="h-6 w-6" />
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
                      <PieChart className="h-6 w-6" />
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
                      <DollarSign className="h-6 w-6" />
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
                      <span>120k+</span>
                    </div>
                    <p className="text-xs text-zinc-500">per campaign</p>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <Button className="bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600 w-full" asChild>
                      <Link to="/enhanced-onboarding">Create Your Campaign</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 bg-black relative">
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 py-1.5 px-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
              Ready to Get Started?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                Join the Future of Athlete-Brand Partnerships
              </span>
            </h2>
            <p className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto">
              Whether you're an athlete looking to monetize your influence or a business seeking authentic brand advocates, Contested has the perfect match for you.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold hover:from-red-600 hover:to-amber-600 transition-all shadow-md px-8"
                asChild
              >
                <Link to="/enhanced-onboarding">Sign Up Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}