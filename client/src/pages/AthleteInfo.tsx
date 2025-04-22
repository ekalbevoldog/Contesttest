import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/FadeIn";
import { Link } from "wouter";
import { ArrowLeft, Check, Trophy, Clock, ArrowRight, Zap, Instagram, Shield } from "lucide-react";

export default function AthleteInfo() {
  // Benefits section data
  const benefits = [
    {
      icon: <Trophy className="h-6 w-6 text-primary" />,
      title: "Build Your Personal Brand",
      description: "Create a professional profile that showcases your athletic achievements, academic background, and brand preferences to attract the right business partnerships."
    },
    {
      icon: <Instagram className="h-6 w-6 text-primary" />,
      title: "Showcase Your Social Reach",
      description: "Connect your social media accounts to automatically display your following and engagement metrics, making it easy for businesses to see your influence."
    },
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "AI-Powered Matching",
      description: "Our intelligent algorithm matches you with businesses that align with your personal brand, values, and career goals for more meaningful partnerships."
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "NCAA Compliance Support",
      description: "Built-in tools to help ensure all your NIL deals meet NCAA and institutional requirements, with direct connection to your compliance office."
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "Manage Your Time Efficiently",
      description: "Streamlined communication tools and deal management features help you balance NIL activities with your academic and athletic commitments."
    }
  ];

  // Testimonials
  const testimonials = [
    {
      quote: "Contested helped me find partnerships that actually align with who I am as both an athlete and a person. I've been able to build relationships with brands I genuinely believe in.",
      name: "Marcus Johnson",
      role: "Basketball Guard, State University"
    },
    {
      quote: "The platform made it easy to connect with local businesses while staying compliant with NCAA rules. My compliance officer loves that everything is documented in one place.",
      name: "Sophia Williams",
      role: "Soccer Forward, Tech College"
    },
    {
      quote: "As a student-athlete with a busy schedule, I appreciate how simple Contested makes managing my NIL deals. The AI matches have been spot-on with brands that fit my personal values.",
      name: "Tyler Rodriguez",
      role: "Football Linebacker, City University"
    }
  ];

  return (
    <FadeIn>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-black to-gray-900 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="container max-w-6xl mx-auto px-4 py-24">
            <div className="flex flex-col items-center text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                <span className="block">Your Athletic Success,</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">Your Brand, Your Future</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mb-8">
                Turn your collegiate athletic career into valuable brand partnerships with NIL opportunities that match your personal values and career goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/athlete/sign-up">
                  <Button size="lg" className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-medium min-w-[200px]">
                    Get Started
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 min-w-[200px]">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gray-950 py-20">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">How Contested Works for Athletes</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                A simple process designed to help you find authentic brand partnerships while maintaining compliance with NCAA regulations.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Create Your Profile</h3>
                <p className="text-gray-400 mb-4">
                  Build your athletic profile highlighting your achievements, social media presence, and brand preferences.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Connect social media accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Showcase athletic achievements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Set your brand preferences</span>
                  </li>
                </ul>
              </div>

              <div className="flex-1 bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Get Matched with Businesses</h3>
                <p className="text-gray-400 mb-4">
                  Our AI-powered system matches you with businesses looking for athlete partners who align with their brand.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Receive personalized match suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Review business profiles and offers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Connect only with brands you like</span>
                  </li>
                </ul>
              </div>

              <div className="flex-1 bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Manage Partnerships</h3>
                <p className="text-gray-400 mb-4">
                  Negotiate terms, maintain NCAA compliance, and track your partnerships all in one platform.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Automated compliance checks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Contract management tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Performance tracking dashboard</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-black py-20">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Why Athletes Choose Contested</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Built specifically for collegiate athletes, our platform helps you navigate the NIL landscape with confidence.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, i) => (
                <div key={i} className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 border border-gray-800">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="bg-gray-950 py-20">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">What Athletes Say</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Hear from student-athletes who have found success through the Contested platform.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, i) => (
                <div key={i} className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-lg p-6 border border-gray-800 relative">
                  <div className="absolute -top-3 -left-3 text-4xl text-primary opacity-20">"</div>
                  <p className="text-gray-300 mb-6 relative z-10">{testimonial.quote}</p>
                  <div className="mt-auto">
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-black py-20">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Simple Pricing for Athletes</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Get started for free and upgrade as your NIL opportunities grow.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-gradient-to-b from-gray-900 to-gray-950 rounded-lg overflow-hidden border border-gray-800">
              <div className="p-6 border-b border-gray-800">
                <h3 className="text-2xl font-bold text-white mb-2">Free Student-Athlete Plan</h3>
                <p className="text-gray-400 mb-4">Everything you need to start your NIL journey</p>
                <p className="text-4xl font-bold text-white mb-6">$0</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Complete athlete profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Basic match suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Message up to 5 businesses per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">Standard compliance tools</span>
                  </li>
                </ul>
                <Link href="/athlete/sign-up">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
              <div className="p-6 bg-gray-900/30">
                <p className="text-sm text-gray-400 mb-4">Premium features available through school subscriptions:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Advanced AI matching</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Unlimited business messaging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">Performance analytics</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-red-900/20 to-amber-900/20 py-20">
          <div className="container max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your NIL Journey?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join thousands of student-athletes already building their personal brands and making valuable connections on Contested.
            </p>
            <Link href="/athlete/sign-up">
              <Button size="lg" className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-medium px-8">
                Create Your Athlete Profile
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-black py-20">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Common Questions from Athletes</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Find answers to frequently asked questions about using Contested as a student-athlete.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-2">Is Contested compliant with NCAA regulations?</h3>
                <p className="text-gray-400">
                  Yes, Contested is built with NCAA compliance in mind. Our platform includes tools that help ensure all NIL activities meet current regulations, including documentation features that streamline reporting to your compliance office.
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-2">How much time will I need to commit to NIL activities?</h3>
                <p className="text-gray-400">
                  That's entirely up to you. Contested allows you to set your availability and preferences, ensuring that brands understand your academic and athletic priorities. Most athletes spend 1-3 hours per week on their NIL partnerships.
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-2">Can freshmen and international student-athletes use Contested?</h3>
                <p className="text-gray-400">
                  Absolutely. While NIL rules vary by state and institution, Contested is available to all NCAA student-athletes. Our compliance tools will help guide you through your specific eligibility requirements.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="bg-black py-8">
          <div className="container max-w-6xl mx-auto px-4">
            <Link href="/">
              <Button variant="ghost" className="text-gray-400 hover:text-white flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}