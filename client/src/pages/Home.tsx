import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  FadeIn, 
  StaggerContainer, 
  StaggerItem,
  ScrollReveal, 
  Parallax, 
  FloatingElement,
  AnimatedGradient 
} from "@/components/animations";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { ChevronRight, ArrowRight, CheckCircle, Star, Trophy, DollarSign, PieChart, Users, Zap, ArrowUpRight } from "lucide-react";

export default function Home() {
  const [budgetValue, setBudgetValue] = useState([30000]);
  const [singleCampaign, setSingleCampaign] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Hero Section - Inspired by Landio */}
      <section ref={heroRef} className="relative overflow-hidden min-h-screen flex flex-col justify-center py-16 md:py-0">
        {/* Full height dark mesh grain background with subtle noise texture */}
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-10 z-0"></div>
          <AnimatedGradient 
            className="absolute inset-0 z-0 opacity-10" 
            colors={['hsl(345, 90%, 55%)', 'hsl(30, 90%, 55%)', 'hsl(235, 60%, 40%)']}
            blur={150}
            duration={30}
          />
        </div>
        
        {/* Orbiting blurred circles in background */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-red-500/20 blur-3xl animate-orbit-slow pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl animate-orbit-reverse-slow pointer-events-none"></div>
        <div className="absolute top-1/2 right-1/2 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl animate-pulse pointer-events-none"></div>
        
        {/* Top badges */}
        <div className="container mx-auto px-4 relative z-10 mb-8 md:mt-12">
          <div className="flex flex-wrap gap-2 justify-center">
            <FadeIn direction="up">
              <Badge className="py-1.5 px-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                <Star className="h-3.5 w-3.5 mr-1" /> New AI-Powered Matching Engine
              </Badge>
            </FadeIn>
            <FadeIn direction="up" delay={0.1}>
              <Badge className="py-1.5 px-4 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">
                <Trophy className="h-3.5 w-3.5 mr-1" /> 500+ Partnerships Created
              </Badge>
            </FadeIn>
          </div>
        </div>
        
        {/* Main hero content */}
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <FadeIn direction="up" duration={0.8}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-none tracking-tight max-w-5xl mx-auto mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-gradient-x">
                Connecting Elite Athletes & Brands
              </span>{" "}
              <span className="block mt-2 text-5xl md:text-6xl">
                Through AI-Powered Partnerships
              </span>
            </h1>
          </FadeIn>
          
          <FadeIn direction="up" delay={0.2} duration={0.8}>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-8">
              Our intelligent platform precisely matches college athletes with perfect brand opportunities, 
              unlocking powerful, data-driven marketing partnerships with measurable impact.
            </p>
          </FadeIn>
          
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <FadeIn direction="up" delay={0.3} duration={0.7}>
              <FloatingElement floatIntensity={5} hoverScale={1.05}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold hover:from-red-600 hover:to-amber-600 transition-all shadow-lg text-lg h-14 px-8"
                  asChild
                >
                  <Link to="/enhanced-onboarding">Get Started <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </FloatingElement>
            </FadeIn>
            <FadeIn direction="up" delay={0.4} duration={0.7}>
              <FloatingElement floatIntensity={3} duration={4} hoverScale={1.03}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-zinc-700 text-white hover:bg-zinc-800/50 backdrop-blur-sm bg-zinc-900/30 h-14 px-8 text-lg"
                  onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-assistant'))}
                >
                  Chat with AI Assistant <Zap className="ml-2 h-5 w-5 text-amber-500" />
                </Button>
              </FloatingElement>
            </FadeIn>
          </div>
          
          {/* Metrics banner with glass effect */}
          <FadeIn direction="up" delay={0.5} duration={0.8}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-4xl mx-auto w-full backdrop-blur-md bg-zinc-900/20 border border-zinc-800/50 rounded-xl overflow-hidden">
              <div className="p-4 md:p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">5.7x</div>
                <div className="text-zinc-400 text-sm">Average ROI</div>
              </div>
              <div className="p-4 md:p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">2.8M+</div>
                <div className="text-zinc-400 text-sm">Monthly Impressions</div>
              </div>
              <div className="p-4 md:p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">92%</div>
                <div className="text-zinc-400 text-sm">Match Success</div>
              </div>
              <div className="p-4 md:p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">3.4k</div>
                <div className="text-zinc-400 text-sm">Athletes Onboarded</div>
              </div>
            </div>
          </FadeIn>
        </div>
        
        {/* Video showcase */}
        <div className="container mx-auto px-4 relative z-10 mt-16 md:mt-20">
          <FadeIn direction="up" delay={0.6} duration={0.9}>
            <div className="relative max-w-5xl mx-auto">
              {/* Glow effects behind video */}
              <div className="absolute -inset-px bg-gradient-to-r from-red-500 to-amber-500 rounded-2xl blur-sm opacity-70"></div>
              
              {/* Video with floating animation */}
              <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl">
                <video
                  className="w-full aspect-[16/9] object-cover"
                  src="/videos/landing-video.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                  poster="/contested-logo.png"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/30"></div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-red-500 transition-all duration-300 shadow-lg">
                    <div className="ml-1 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent"></div>
                  </div>
                </div>
              </div>
              
              {/* Floating card badges */}
              <div className="absolute -bottom-6 -left-6 md:left-auto md:-right-6 p-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg flex items-center gap-2 shadow-lg">
                <span className="flex h-3 w-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-white text-sm font-medium">Live AI Matching</span>
              </div>
              
              <div className="absolute -top-6 -right-6 md:-left-6 md:right-auto p-3 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <Star className="h-4 w-4 text-amber-500" />
                  <Star className="h-4 w-4 text-amber-500" />
                  <Star className="h-4 w-4 text-amber-500" />
                  <Star className="h-4 w-4 text-amber-500" />
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
        
        {/* Down indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="h-10 w-6 rounded-full border-2 border-zinc-700 flex items-start justify-center p-1">
            <div className="h-2 w-2 bg-zinc-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Angled gradient divider */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#080808] to-transparent"></div>
      </section>

      {/* Features Section - Modern Bento Grid Layout */}
      <section className="py-24 md:py-32 bg-[#080808] relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5 z-0"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-red-500/5 blur-3xl animate-pulse pointer-events-none"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-16 max-w-3xl mx-auto">
            <Badge className="py-1.5 px-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 mb-6">
              The Contested Advantage
            </Badge>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-300 to-white">
                Your Gateway to Authentic
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500 block mt-2">
                Athlete-Brand Partnerships
              </span>
            </h2>
            
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Our AI-powered platform creates perfect matches that drive measurable results,
              with a unique approach tailored to both athletes and businesses.
            </p>
          </ScrollReveal>

          {/* Modern Tabs with Glowing Effect */}
          <div className="flex justify-center mb-16">
            <Tabs defaultValue="athletes" className="w-full max-w-4xl">
              <ScrollReveal threshold={0.1}>
                <div className="relative mx-auto max-w-md mb-12">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-full blur opacity-30"></div>
                  <TabsList className="relative grid w-full grid-cols-2 p-1 h-14 rounded-full backdrop-blur-sm bg-black/20 border border-zinc-800">
                    <TabsTrigger 
                      value="athletes" 
                      className="text-base md:text-lg rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                    >
                      For Athletes
                    </TabsTrigger>
                    <TabsTrigger 
                      value="businesses" 
                      className="text-base md:text-lg rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                    >
                      For Businesses
                    </TabsTrigger>
                  </TabsList>
                </div>
              </ScrollReveal>

              <TabsContent value="athletes" className="space-y-16">
                {/* Modern Bento-style Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Feature 1 */}
                  <ScrollReveal delay={0.1} threshold={0.1}>
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden group hover:border-red-500/50 transition-all duration-300">
                      {/* Icon header with glow effect */}
                      <div className="relative p-6">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-xl transform translate-x-8 -translate-y-8 group-hover:bg-red-500/20 group-hover:w-24 group-hover:h-24 transition-all duration-500"></div>
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transform transition-transform duration-300 border border-zinc-700/50">
                          <DollarSign className="h-6 w-6 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors duration-300">Monetize Your Influence</h3>
                        <p className="text-zinc-400">Convert your social media presence and athletic achievements into sustainable income with personalized brand partnerships.</p>
                      </div>
                      
                      {/* Footer with mini-stats */}
                      <div className="border-t border-zinc-800 p-4 bg-black/30">
                        <div className="flex items-center text-sm text-zinc-500">
                          <span className="font-medium text-amber-500 mr-1">$250</span> avg. compensation per campaign
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                  
                  {/* Feature 2 */}
                  <ScrollReveal delay={0.2} threshold={0.1}>
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
                      <div className="relative p-6">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl transform translate-x-8 -translate-y-8 group-hover:bg-amber-500/20 group-hover:w-24 group-hover:h-24 transition-all duration-500"></div>
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transform transition-transform duration-300 border border-zinc-700/50">
                          <CheckCircle className="h-6 w-6 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-500 transition-colors duration-300">Quality-Vetted Opportunities</h3>
                        <p className="text-zinc-400">Our AI matching system ensures you only connect with brands that align with your values, sport, and personal brand identity.</p>
                      </div>
                      <div className="border-t border-zinc-800 p-4 bg-black/30">
                        <div className="flex items-center text-sm text-zinc-500">
                          <span className="font-medium text-amber-500 mr-1">92%</span> match satisfaction rate
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                  
                  {/* Feature 3 */}
                  <ScrollReveal delay={0.3} threshold={0.1}>
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden group hover:border-red-500/50 transition-all duration-300">
                      <div className="relative p-6">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-xl transform translate-x-8 -translate-y-8 group-hover:bg-red-500/20 group-hover:w-24 group-hover:h-24 transition-all duration-500"></div>
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transform transition-transform duration-300 border border-zinc-700/50">
                          <Zap className="h-6 w-6 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors duration-300">Zero Upfront Cost</h3>
                        <p className="text-zinc-400">Risk-free onboarding and partnership matching. We only succeed when you do—fees are charged only when partnerships complete successfully.</p>
                      </div>
                      <div className="border-t border-zinc-800 p-4 bg-black/30">
                        <div className="flex items-center text-sm text-zinc-500">
                          <span className="font-medium text-amber-500 mr-1">3.5 hrs</span> average time to first match
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
                
                {/* Stats Banner with Animation */}
                <ScrollReveal threshold={0.1}>
                  <div className="relative group">
                    {/* Animated gradient border */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-300"></div>
                    
                    {/* Glass card */}
                    <div className="relative bg-zinc-900/70 backdrop-blur-md border border-zinc-800/60 rounded-xl p-6 overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-white">For College Athletes</h3>
                          <p className="text-zinc-400">Start earning through authentic partnerships while maintaining your eligibility.</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 md:gap-6 md:col-span-2 justify-between">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-red-500 to-amber-500 inline-block">$250</div>
                            <div className="text-sm text-zinc-400 mt-1">Average Campaign</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-red-500 to-amber-500 inline-block">92%</div>
                            <div className="text-sm text-zinc-400 mt-1">Match Rate</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-red-500 to-amber-500 inline-block">3.8k</div>
                            <div className="text-sm text-zinc-400 mt-1">Active Athletes</div>
                          </div>
                          
                          <Button className="bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600 min-w-[140px]" asChild>
                            <Link to="/enhanced-onboarding">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </TabsContent>

              <TabsContent value="businesses" className="space-y-16">
                {/* Modern Bento-style Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Feature 1 */}
                  <ScrollReveal delay={0.1} threshold={0.1}>
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
                      {/* Icon header with glow effect */}
                      <div className="relative p-6">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl transform translate-x-8 -translate-y-8 group-hover:bg-amber-500/20 group-hover:w-24 group-hover:h-24 transition-all duration-500"></div>
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transform transition-transform duration-300 border border-zinc-700/50">
                          <Users className="h-6 w-6 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-500 transition-colors duration-300">Authentic Brand Advocates</h3>
                        <p className="text-zinc-400">Connect your brand with college athletes who genuinely align with your values and can authentically represent your products.</p>
                      </div>
                      
                      {/* Footer with mini-stats */}
                      <div className="border-t border-zinc-800 p-4 bg-black/30">
                        <div className="flex items-center text-sm text-zinc-500">
                          <span className="font-medium text-amber-500 mr-1">2.8M+</span> combined social reach
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                  
                  {/* Feature 2 */}
                  <ScrollReveal delay={0.2} threshold={0.1}>
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden group hover:border-red-500/50 transition-all duration-300">
                      <div className="relative p-6">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-xl transform translate-x-8 -translate-y-8 group-hover:bg-red-500/20 group-hover:w-24 group-hover:h-24 transition-all duration-500"></div>
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transform transition-transform duration-300 border border-zinc-700/50">
                          <PieChart className="h-6 w-6 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-500 transition-colors duration-300">Measurable Performance</h3>
                        <p className="text-zinc-400">Track campaign results with detailed analytics on engagement, reach, conversions, and return on investment.</p>
                      </div>
                      <div className="border-t border-zinc-800 p-4 bg-black/30">
                        <div className="flex items-center text-sm text-zinc-500">
                          <span className="font-medium text-amber-500 mr-1">5.52%</span> average engagement rate
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                  
                  {/* Feature 3 */}
                  <ScrollReveal delay={0.3} threshold={0.1}>
                    <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
                      <div className="relative p-6">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl transform translate-x-8 -translate-y-8 group-hover:bg-amber-500/20 group-hover:w-24 group-hover:h-24 transition-all duration-500"></div>
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transform transition-transform duration-300 border border-zinc-700/50">
                          <DollarSign className="h-6 w-6 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-500 transition-colors duration-300">Cost-Effective Campaigns</h3>
                        <p className="text-zinc-400">Access quality influencer marketing at a fraction of the cost of traditional celebrity endorsements with flexible budget options.</p>
                      </div>
                      <div className="border-t border-zinc-800 p-4 bg-black/30">
                        <div className="flex items-center text-sm text-zinc-500">
                          <span className="font-medium text-amber-500 mr-1">3.37x</span> average return on investment
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                </div>
                
                {/* Stats Banner with Animation */}
                <ScrollReveal threshold={0.1}>
                  <div className="relative group">
                    {/* Animated gradient border */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-300"></div>
                    
                    {/* Glass card */}
                    <div className="relative bg-zinc-900/70 backdrop-blur-md border border-zinc-800/60 rounded-xl p-6 overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-white">For Innovative Brands</h3>
                          <p className="text-zinc-400">Connect with authentic athlete voices who resonate with your audience.</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 md:gap-6 md:col-span-2 justify-between">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-red-500 to-amber-500 inline-block">3.37x</div>
                            <div className="text-sm text-zinc-400 mt-1">Average ROI</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-red-500 to-amber-500 inline-block">5.52%</div>
                            <div className="text-sm text-zinc-400 mt-1">Engagement Rate</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-red-500 to-amber-500 inline-block">1.12M+</div>
                            <div className="text-sm text-zinc-400 mt-1">Monthly Impressions</div>
                          </div>
                          
                          <Button className="bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600 min-w-[140px]" asChild>
                            <Link to="/enhanced-onboarding">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Pricing Section - Modern & Edgy */}
      <section className="py-24 md:py-32 bg-[#060606] relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5 z-0"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-red-500/5 blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center mb-20 max-w-3xl mx-auto">
            <Badge className="py-1.5 px-4 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 mb-6">
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Flexible Pricing
            </Badge>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-300 to-white">
                Find the Perfect Partnership
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500 block mt-2">
                For Your Budget
              </span>
            </h2>
            
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Our intelligent platform offers personalized matching at any investment level, 
              with pricing options that scale with your business needs.
            </p>
          </ScrollReveal>

          {/* Interactive Budget Slider */}
          <div className="max-w-3xl mx-auto mb-20 bg-zinc-900/30 backdrop-blur-sm border border-zinc-800 rounded-xl p-8">
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl text-white font-semibold">Explore your options</h3>
                <div className="text-2xl font-bold text-gradient bg-gradient-to-r from-red-500 to-amber-500 inline-block">
                  ${budgetValue[0].toLocaleString()}
                </div>
              </div>
              <p className="text-zinc-400">Drag the slider to see what's possible at different investment levels</p>
            </div>
            
            <div className="flex flex-col space-y-10">
              <div className="space-y-4">
                <Slider 
                  className="py-4"
                  value={budgetValue} 
                  onValueChange={setBudgetValue}
                  max={60000}
                  step={1000}
                />
                
                <div className="flex justify-between text-zinc-500 text-sm">
                  <span>$1,000</span>
                  <span>$30,000</span>
                  <span>$60,000+</span>
                </div>
              </div>
              
              {/* Modern Switch Design */}
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <p className="text-zinc-300 font-medium">Campaign type:</p>
                <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-sm p-1 rounded-full border border-zinc-800 w-fit">
                  <div 
                    className={`px-4 py-2 rounded-full cursor-pointer transition-all duration-300 ${singleCampaign ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-100'}`}
                    onClick={() => setSingleCampaign(true)}
                  >
                    Single campaign
                  </div>
                  <div 
                    className={`px-4 py-2 rounded-full cursor-pointer transition-all duration-300 ${!singleCampaign ? 'bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-100'}`}
                    onClick={() => setSingleCampaign(false)}
                  >
                    Recurring campaigns
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pricing Cards */}
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Starter Plan */}
              <div className="group relative">
                <div className="absolute inset-0.5 bg-gradient-to-b from-zinc-600 to-zinc-900 rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-zinc-900/70 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden h-full">
                  <div className="p-8">
                    <div className="mb-6">
                      <Badge className="mb-3 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">STARTER</Badge>
                      <h3 className="text-2xl font-bold text-white mb-2">Explore</h3>
                      <div className="flex items-baseline mb-4">
                        <span className="text-4xl font-bold text-white">$1,000</span>
                        <span className="text-zinc-400 ml-2">- $5,000</span>
                      </div>
                      <p className="text-zinc-400">Perfect for businesses testing the NIL waters</p>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">2-3 athletes matched to your brand</div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">Content creation for 1 platform</div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">Up to 10,000 audience reach</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-8 pb-8 mt-auto">
                    <Button className="w-full bg-zinc-800 text-white hover:bg-zinc-700 h-12 group-hover:bg-gradient-to-r group-hover:from-red-500 group-hover:to-amber-500 transition-all duration-300" asChild>
                      <Link to="/enhanced-onboarding">Get Started <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Growth Plan - Highlighted */}
              <div className="group relative">
                <div className="absolute inset-0.5 bg-gradient-to-b from-red-500 to-amber-500 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-32 h-32">
                    <div className="absolute transform rotate-45 bg-gradient-to-r from-red-500 to-amber-500 text-white font-medium py-1 right-[-35px] top-[32px] w-[170px] text-center text-sm">
                      POPULAR
                    </div>
                  </div>
                
                  <div className="p-8">
                    <div className="mb-6">
                      <Badge className="mb-3 bg-gradient-to-r from-red-500/30 to-amber-500/30 text-white hover:from-red-500/40 hover:to-amber-500/40 transition-colors">GROWTH</Badge>
                      <h3 className="text-2xl font-bold text-white mb-2">Scale</h3>
                      <div className="flex items-baseline mb-4">
                        <span className="text-4xl font-bold text-white">$5,000</span>
                        <span className="text-zinc-400 ml-2">- $20,000</span>
                      </div>
                      <p className="text-zinc-400">Ideal for established brands seeking growth</p>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">5-10 athletes matched to your brand</div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">Content creation across 2-3 platforms</div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">Up to 100,000 audience reach</div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">Campaign performance analytics</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-8 pb-8 mt-auto">
                    <Button className="w-full bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600 h-12" asChild>
                      <Link to="/enhanced-onboarding">Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Enterprise Plan */}
              <div className="group relative">
                <div className="absolute inset-0.5 bg-gradient-to-b from-zinc-600 to-zinc-900 rounded-2xl blur opacity-20 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-zinc-900/70 backdrop-blur-sm border border-zinc-800 rounded-2xl overflow-hidden h-full">
                  <div className="p-8">
                    <div className="mb-6">
                      <Badge className="mb-3 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">ENTERPRISE</Badge>
                      <h3 className="text-2xl font-bold text-white mb-2">Dominate</h3>
                      <div className="flex items-baseline mb-4">
                        <span className="text-4xl font-bold text-white">$20,000</span>
                        <span className="text-zinc-400 ml-2">+</span>
                      </div>
                      <p className="text-zinc-400">For brands seeking maximum impact</p>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">10+ premium athletes partnerships</div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">Omni-channel content creation</div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">1M+ audience reach potential</div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">Dedicated account management</div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-amber-500 mr-3 mt-1"><CheckCircle className="h-5 w-5" /></div>
                        <div className="text-zinc-300">Advanced analytics & ROI reporting</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-8 pb-8 mt-auto">
                    <Button className="w-full bg-zinc-800 text-white hover:bg-zinc-700 h-12 group-hover:bg-gradient-to-r group-hover:from-red-500 group-hover:to-amber-500 transition-all duration-300" asChild>
                      <Link to="/enhanced-onboarding">Get Started <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
          
          <div className="mt-12 text-center text-zinc-500 max-w-2xl mx-auto">
            <p className="text-sm">
              All prices are estimates. Our AI matching engine provides precise recommendations based on your specific goals and target audience. 
              <span className="text-white ml-1 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-assistant'))}>
                Chat with our AI assistant
              </span> for personalized guidance.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Modern & Edgy */}
      <section className="py-24 md:py-32 bg-black relative overflow-hidden">
        {/* Abstract design elements */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5 z-0"></div>
        <div className="absolute top-40 left-10 w-72 h-72 rounded-full bg-red-500/5 blur-3xl"></div>
        <div className="absolute bottom-40 right-10 w-72 h-72 rounded-full bg-amber-500/5 blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="py-1.5 px-4 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 mb-6">
              <Star className="h-3.5 w-3.5 mr-1" /> Success Stories
            </Badge>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-300 to-white">
                Hear from Our Community
              </span>
            </h2>
            
            <p className="text-zinc-400 text-lg">
              Athletes and businesses are transforming their digital presence through authentic partnerships powered by Contested.
            </p>
          </ScrollReveal>
          
          {/* Modern Testimonial Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Testimonial 1 - Athlete */}
            <ScrollReveal delay={0.1}>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-xl opacity-0 group-hover:opacity-70 blur transition duration-300"></div>
                <div className="relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 h-full">
                  <div className="flex items-center mb-4 gap-4">
                    <div className="relative">
                      <div className="h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">DB</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-black">
                        <Star className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Derrick Brown</h4>
                      <div className="text-sm text-zinc-400 flex items-center">
                        <span>Basketball, UCLA</span>
                        <span className="mx-2">•</span>
                        <div className="flex text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <blockquote className="text-zinc-300 relative">
                    <div className="text-amber-500/20 text-5xl absolute -top-2 -left-2">"</div>
                    <p className="relative z-10">
                      Contested connected me with brands that actually align with my personal values. The process was seamless, and I made more from one partnership than all my previous deals combined.
                    </p>
                  </blockquote>
                  
                  <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-between items-center">
                    <div className="text-zinc-500 text-sm">Athlete since 2023</div>
                    <div className="flex gap-1">
                      <Badge className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">NIL</Badge>
                      <Badge className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">Sponsorship</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            
            {/* Testimonial 2 - Business */}
            <ScrollReveal delay={0.2}>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-xl opacity-0 group-hover:opacity-70 blur transition duration-300"></div>
                <div className="relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 h-full">
                  <div className="flex items-center mb-4 gap-4">
                    <div className="relative">
                      <div className="h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">JT</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-black">
                        <Star className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Jennifer Taylor</h4>
                      <div className="text-sm text-zinc-400 flex items-center">
                        <span>Marketing Director, SportFuel</span>
                        <span className="mx-2">•</span>
                        <div className="flex text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <blockquote className="text-zinc-300 relative">
                    <div className="text-amber-500/20 text-5xl absolute -top-2 -left-2">"</div>
                    <p className="relative z-10">
                      The AI matching technology at Contested is a game-changer. We found athletes who truly love our products, resulting in authentic endorsements that our audience resonates with.
                    </p>
                  </blockquote>
                  
                  <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-between items-center">
                    <div className="text-zinc-500 text-sm">Partner since 2022</div>
                    <div className="flex gap-1">
                      <Badge className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">ROI 4.2x</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
            
            {/* Testimonial 3 - Athlete */}
            <ScrollReveal delay={0.3}>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-xl opacity-0 group-hover:opacity-70 blur transition duration-300"></div>
                <div className="relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 h-full">
                  <div className="flex items-center mb-4 gap-4">
                    <div className="relative">
                      <div className="h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-red-500/20 to-amber-500/20 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">SM</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-black">
                        <Star className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">Sarah Miller</h4>
                      <div className="text-sm text-zinc-400 flex items-center">
                        <span>Soccer, Stanford</span>
                        <span className="mx-2">•</span>
                        <div className="flex text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <blockquote className="text-zinc-300 relative">
                    <div className="text-amber-500/20 text-5xl absolute -top-2 -left-2">"</div>
                    <p className="relative z-10">
                      I was hesitant at first, but Contested made it incredibly easy to navigate NIL opportunities while maintaining compliance with NCAA regulations. I've partnered with three brands I genuinely love.
                    </p>
                  </blockquote>
                  
                  <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-between items-center">
                    <div className="text-zinc-500 text-sm">Athlete since 2023</div>
                    <div className="flex gap-1">
                      <Badge className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">Social</Badge>
                      <Badge className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">Partnership</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
          
          {/* CTA Button */}
          <div className="mt-16 text-center">
            <div className="inline-block relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-amber-500 rounded-full opacity-70 group-hover:opacity-100 blur group-hover:blur-md transition duration-300"></div>
              <Button className="relative bg-zinc-900 border-0 text-white text-lg px-8 py-6 rounded-full hover:bg-black" onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-assistant'))}>
                Chat with AI Assistant <Zap className="ml-2 h-5 w-5 text-amber-500" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#080808] text-white relative overflow-hidden border-t border-zinc-900">
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                  Ready to Create Winning Partnerships?
                </span>
              </h2>
              <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                Whether you're an athlete looking to monetize your influence or a business seeking authentic brand ambassadors, Contested makes it easy to find your perfect match.
              </p>
              <div className="flex flex-wrap gap-6 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600 transition-all shadow-lg text-lg h-14 px-8"
                  asChild
                >
                  <Link to="/enhanced-onboarding">Get Started Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-zinc-700 text-white hover:bg-zinc-800/50 backdrop-blur-sm bg-zinc-900/30 h-14 px-8 text-lg"
                  onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-assistant'))}
                >
                  Chat with AI Assistant <Zap className="ml-2 h-5 w-5 text-amber-500" />
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-black py-8 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} Contested. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap gap-4 text-zinc-500 text-sm">
              <Link to="/privacy" className="hover:text-zinc-300">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-zinc-300">Terms of Service</Link>
              <Link to="/admin-login" className="hover:text-zinc-300">Admin Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}