import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function Solutions() {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black pt-20 pb-16">
        {/* Background patterns and effects */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black/90 to-black"></div>
        
        {/* Diagonal line accent */}
        <div className="absolute top-0 left-0 right-0 h-24 w-full bg-gradient-to-r from-red-500 to-amber-500 transform -rotate-1 -translate-y-16 opacity-40"></div>
        
        {/* Animated red circles */}
        <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-red-500/10 animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 h-32 w-32 rounded-full bg-amber-500/10 animate-pulse delay-700"></div>
        
        {/* Background athlete silhouette */}
        <div className="absolute right-0 bottom-0 w-1/3 h-3/4 bg-[url('/athlete-silhouette.png')] bg-contain bg-no-repeat bg-right-bottom opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-4 rounded-full bg-red-500/10 px-4 py-1 border border-red-500/20">
              <span className="text-red-400 font-semibold">Next Generation NIL Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                Solutions for Next-Gen Athlete Partnerships
              </span>
            </h1>
            <p className="text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
              Contested provides cutting-edge tools and services to connect athletes and businesses for authentic marketing partnerships that drive measurable results.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
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
                className="border-red-500 text-white hover:bg-red-500/10"
                asChild
              >
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
          
          {/* Logo partners strip */}
          <div className="mt-16 max-w-5xl mx-auto">
            <p className="text-center text-zinc-500 mb-6 text-sm uppercase tracking-wider">Trusted by leading brands and universities</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              <div className="w-24 h-12 bg-white/5 rounded-md flex items-center justify-center">
                <div className="text-zinc-400 font-bold">BRAND 1</div>
              </div>
              <div className="w-24 h-12 bg-white/5 rounded-md flex items-center justify-center">
                <div className="text-zinc-400 font-bold">BRAND 2</div>
              </div>
              <div className="w-24 h-12 bg-white/5 rounded-md flex items-center justify-center">
                <div className="text-zinc-400 font-bold">BRAND 3</div>
              </div>
              <div className="w-24 h-12 bg-white/5 rounded-md flex items-center justify-center">
                <div className="text-zinc-400 font-bold">BRAND 4</div>
              </div>
              <div className="w-24 h-12 bg-white/5 rounded-md flex items-center justify-center">
                <div className="text-zinc-400 font-bold">BRAND 5</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500 opacity-70"></div>
      </section>

      {/* Solutions Features */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                Comprehensive Partnership Solutions
              </span>
            </h2>
            <p className="text-xl text-zinc-400">
              Contested streamlines the entire NIL partnership process—from precise athlete-brand matching to campaign management and compliance—ensuring seamless collaborations and measurable results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {/* AI Matching */}
            <Card className="bg-zinc-900 shadow-lg hover:shadow-xl transition-shadow border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/30 to-transparent rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-tr-full"></div>
              
              <CardContent className="p-6 relative z-10">
                <div className="h-20 w-20 mb-6 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-red-500">
                  <div className="h-12 w-12 text-red-500 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.3 8.8L9 4.5L4.5 9L8.8 13.3M15.1 10.6L10.6 15.1L15.4 19.9L19.9 15.4L15.1 10.6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9.5 4.5L14.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14.5 14.5L9.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19.5 9.5L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4.5 14.5L9.5 9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">AI-Powered Matching</h3>
                <p className="text-zinc-400 mb-6 text-lg">
                  Our proprietary AI algorithm analyzes dozens of data points to find the perfect partnerships between athletes and businesses that share values, aesthetics, and audience demographics.
                </p>
                
                <ul className="space-y-3 text-zinc-400">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-zinc-300">Personality and values alignment</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-zinc-300">Audience demographic analysis</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-zinc-300">Content style and quality assessment</span>
                  </li>
                </ul>
                
                <div className="mt-8 pt-6 border-t border-zinc-800">
                  <div className="flex items-center">
                    <div className="text-zinc-500 text-sm">Powered by</div>
                    <div className="ml-2 text-white font-semibold">Google Gemini AI</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Management */}
            <Card className="bg-zinc-900 shadow-lg hover:shadow-xl transition-shadow border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/30 to-transparent rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-tr-full"></div>
              
              <CardContent className="p-6 relative z-10">
                <div className="h-20 w-20 mb-6 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-red-500">
                  <div className="h-12 w-12 text-red-500 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">Campaign Management</h3>
                <p className="text-zinc-400 mb-6 text-lg">
                  Simplify the entire campaign lifecycle with our comprehensive tools for planning, execution, tracking, and reporting on NIL partnerships.
                </p>
                
                <ul className="space-y-3 text-zinc-400">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-zinc-300">Content calendar and deliverables tracking</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-zinc-300">Performance analytics dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-zinc-300">Automated compliance documentation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Compliance Management */}
            <Card className="bg-zinc-900 shadow-lg hover:shadow-xl transition-shadow border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/30 to-transparent rounded-bl-full"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-tr-full"></div>
              
              <CardContent className="p-6 relative z-10">
                <div className="h-20 w-20 mb-6 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-red-500">
                  <div className="h-12 w-12 text-red-500 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">NIL Compliance</h3>
                <p className="text-zinc-400 mb-6 text-lg">
                  Stay compliant with NCAA and university-specific NIL regulations with our dedicated compliance portal for athletes, businesses, and compliance officers.
                </p>
                
                <ul className="space-y-3 text-zinc-400">
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-zinc-300">School-specific policy integration</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-zinc-300">Compliance officer approval workflow</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <span className="text-zinc-300">Automated disclosure reporting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold hover:from-red-600 hover:to-amber-600 transition-all shadow-md"
              asChild
            >
              <Link to="/dynamic-onboarding">Start Your Partnership Journey</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Visual Showcase */}
      <section className="py-16 bg-black overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10"></div>
        <div className="container mx-auto px-4 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                  Real Results Through Strategic Partnerships
                </span>
              </h2>
              <p className="text-xl text-zinc-400 mb-6">
                Our platform has facilitated partnerships that drive measurable engagement, revenue, and brand growth for both athletes and businesses.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900 p-4 rounded-lg">
                  <div className="text-red-500 text-3xl font-bold">$3.2M+</div>
                  <div className="text-zinc-400">Revenue generated</div>
                </div>
                <div className="bg-zinc-900 p-4 rounded-lg">
                  <div className="text-red-500 text-3xl font-bold">1,200+</div>
                  <div className="text-zinc-400">Partnerships formed</div>
                </div>
                <div className="bg-zinc-900 p-4 rounded-lg">
                  <div className="text-red-500 text-3xl font-bold">48%</div>
                  <div className="text-zinc-400">Avg. engagement increase</div>
                </div>
                <div className="bg-zinc-900 p-4 rounded-lg">
                  <div className="text-red-500 text-3xl font-bold">3.8x</div>
                  <div className="text-zinc-400">Average ROI</div>
                </div>
              </div>
            </div>
            <div className="relative h-96 md:h-[500px] rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
              <div className="absolute inset-0 bg-[url('/athlete-partnership.jpg')] bg-cover bg-center transform hover:scale-105 transition-transform duration-700"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
                Who We Serve
              </span>
            </h2>
            <p className="text-xl text-zinc-400">
              Contested provides tailored solutions for everyone in the NIL ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* For Athletes */}
            <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
              <h3 className="text-2xl font-bold mb-4 text-white">For Athletes</h3>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Personal Brand Development</h4>
                    <p className="text-zinc-400">Build your personal brand with partnerships that align with your values and goals.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">NIL Income Opportunities</h4>
                    <p className="text-zinc-400">Access diverse monetization opportunities from local businesses to national brands.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Compliance Peace of Mind</h4>
                    <p className="text-zinc-400">Stay eligible with automated compliance tracking and documentation.</p>
                  </div>
                </li>
              </ul>
              <Button variant="outline" className="border-red-500 text-white hover:bg-red-500/10" asChild>
                <Link to="/dynamic-onboarding">Athlete Sign Up</Link>
              </Button>
            </div>

            {/* For Businesses */}
            <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800">
              <h3 className="text-2xl font-bold mb-4 text-white">For Businesses</h3>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Authentic Marketing</h4>
                    <p className="text-zinc-400">Connect with athletes who genuinely love your products and share your brand values.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Targeted Reach</h4>
                    <p className="text-zinc-400">Access niche audiences through athletes with engaged, relevant followers.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mr-3 mt-0.5">
                    <span className="font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">ROI Measurement</h4>
                    <p className="text-zinc-400">Track campaign performance with detailed analytics and reporting.</p>
                  </div>
                </li>
              </ul>
              <Button variant="outline" className="border-red-500 text-white hover:bg-red-500/10" asChild>
                <Link to="/dynamic-onboarding">Business Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Image Strip */}
      <section className="py-12 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black z-10"></div>
        <div className="container mx-auto px-4 relative z-20">
          <div className="flex flex-wrap -mx-2 overflow-hidden">
            {/* Image Strip - These would be actual image paths in production */}
            <div className="w-1/2 md:w-1/4 px-2 mb-4">
              <div className="h-64 rounded-lg overflow-hidden transform hover:scale-105 transition-all">
                <div className="h-full w-full bg-[url('/basketball-player.jpg')] bg-cover bg-center"></div>
              </div>
            </div>
            <div className="w-1/2 md:w-1/4 px-2 mb-4">
              <div className="h-64 rounded-lg overflow-hidden transform hover:scale-105 transition-all">
                <div className="h-full w-full bg-[url('/volleyball-player.jpg')] bg-cover bg-center"></div>
              </div>
            </div>
            <div className="w-1/2 md:w-1/4 px-2 mb-4">
              <div className="h-64 rounded-lg overflow-hidden transform hover:scale-105 transition-all">
                <div className="h-full w-full bg-[url('/local-cafe.jpg')] bg-cover bg-center"></div>
              </div>
            </div>
            <div className="w-1/2 md:w-1/4 px-2 mb-4">
              <div className="h-64 rounded-lg overflow-hidden transform hover:scale-105 transition-all">
                <div className="h-full w-full bg-[url('/outdoor-brand.jpg')] bg-cover bg-center"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Red diagonal line */}
        <div className="absolute -bottom-10 left-0 right-0 h-20 bg-red-500 transform -rotate-1 z-0"></div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-zinc-950 text-white relative">
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your NIL strategy?</h2>
            <p className="text-xl text-zinc-400 mb-8">
              Join thousands of athletes and businesses creating authentic partnerships that drive real results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-500 to-amber-500 text-white font-bold hover:from-red-600 hover:to-amber-600 transition-all shadow-md"
                asChild
              >
                <Link to="/dynamic-onboarding">Get Started Now</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-red-500 text-white hover:bg-red-500/10"
                asChild
              >
                <Link to="/case-studies">View Success Stories</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}