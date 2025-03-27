import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function Solutions() {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-black pt-20 pb-16">
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
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
              From discovering the perfect match to managing ongoing campaigns, Contested provides end-to-end solutions for NIL partnerships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {/* AI Matching */}
            <Card className="bg-zinc-900 shadow-lg hover:shadow-xl transition-shadow border-none">
              <CardContent className="p-6">
                <div className="h-16 w-16 mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">AI-Powered Matching</h3>
                <p className="text-zinc-400 mb-6">
                  Our proprietary AI algorithm analyzes dozens of data points to find the perfect partnerships between athletes and businesses that share values, aesthetics, and audience demographics.
                </p>
                <ul className="space-y-2 text-zinc-400">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span>Personality and values alignment</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span>Audience demographic analysis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span>Content style and quality assessment</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Campaign Management */}
            <Card className="bg-zinc-900 shadow-lg hover:shadow-xl transition-shadow border-none">
              <CardContent className="p-6">
                <div className="h-16 w-16 mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Campaign Management</h3>
                <p className="text-zinc-400 mb-6">
                  Simplify the entire campaign lifecycle with our comprehensive tools for planning, execution, tracking, and reporting on NIL partnerships.
                </p>
                <ul className="space-y-2 text-zinc-400">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span>Content calendar and deliverables tracking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span>Performance analytics dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span>Automated compliance documentation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Compliance Management */}
            <Card className="bg-zinc-900 shadow-lg hover:shadow-xl transition-shadow border-none">
              <CardContent className="p-6">
                <div className="h-16 w-16 mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">NIL Compliance</h3>
                <p className="text-zinc-400 mb-6">
                  Stay compliant with NCAA and university-specific NIL regulations with our dedicated compliance portal for athletes, businesses, and compliance officers.
                </p>
                <ul className="space-y-2 text-zinc-400">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span>School-specific policy integration</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span>Compliance officer approval workflow</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <span>Automated disclosure reporting</span>
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