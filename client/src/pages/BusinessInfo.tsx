import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/FadeIn";
import { Link } from "wouter";
import { ArrowLeft, Check, BarChart, Target, Shield, ArrowRight, Briefcase, Users, TrendingUp } from "lucide-react";

export default function BusinessInfo() {
  // Benefits section data
  const benefits = [
    {
      icon: <Target className="h-6 w-6 text-primary" />,
      title: "Targeted Audience Reach",
      description: "Access a curated network of student-athletes whose audience demographics align perfectly with your target market."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: "Authentic Brand Advocacy",
      description: "Partner with athletes who genuinely connect with your brand, creating more authentic marketing that resonates with audiences."
    },
    {
      icon: <BarChart className="h-6 w-6 text-primary" />,
      title: "Performance Analytics",
      description: "Track engagement, conversion rates, and ROI for each athlete partnership through our comprehensive analytics dashboard."
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Compliance Assurance",
      description: "Our platform ensures all partnerships meet NCAA and state regulations, eliminating compliance concerns for your business."
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Local Market Penetration",
      description: "Connect with influential athletes in specific geographic markets to boost local brand awareness and community engagement."
    }
  ];

  // Case studies
  const caseStudies = [
    {
      title: "Regional Sports Apparel Brand",
      results: [
        "47% increase in e-commerce sales",
        "Partnership with 25 local college athletes",
        "Expanded to 3 new regional markets"
      ],
      category: "E-Commerce"
    },
    {
      title: "Local Restaurant Chain",
      results: [
        "152% increase in social media engagement",
        "35% growth in college-age customers",
        "Successful launch of athlete-inspired menu items"
      ],
      category: "Food & Beverage"
    },
    {
      title: "Financial Services Company",
      results: [
        "76% increase in student account signups",
        "Created financial literacy program with athletes",
        "Generated 1.2M impressions through campus ambassadors"
      ],
      category: "Financial Services"
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
                <span className="block">Connect Your Brand with</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">College Athletics' Rising Stars</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mb-8">
                Leverage the influence and authentic voice of student-athletes to reach engaged audiences and build meaningful brand connections.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/business/sign-up">
                  <Button size="lg" className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-medium min-w-[200px]">
                    Create Business Account
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
              <h2 className="text-3xl font-bold text-white mb-4">How Contested Works for Businesses</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                A streamlined process designed to connect your brand with the perfect student-athlete partners.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Create Your Business Profile</h3>
                <p className="text-gray-400 mb-4">
                  Define your brand, target audience, and partnership goals to help us match you with the right athletes.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Showcase your brand values</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Define target audience demographics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Set campaign objectives</span>
                  </li>
                </ul>
              </div>

              <div className="flex-1 bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Match with Student-Athletes</h3>
                <p className="text-gray-400 mb-4">
                  Our AI-powered system identifies athletes whose values, audience, and style align with your brand needs.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Browse AI-suggested athlete matches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">View detailed athlete profiles and metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Search by sport, location, or audience size</span>
                  </li>
                </ul>
              </div>

              <div className="flex-1 bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Manage and Measure Campaigns</h3>
                <p className="text-gray-400 mb-4">
                  Oversee all your athlete partnerships, contract terms, and performance metrics in one dashboard.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Streamlined contract management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Real-time performance analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-gray-300">Compliance documentation automation</span>
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
              <h2 className="text-3xl font-bold text-white mb-4">Why Businesses Choose Contested</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Partner with student-athletes to create authentic marketing that resonates with your target audience.
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

        {/* Case Studies Section */}
        <div className="bg-gray-950 py-20">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Success Stories</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                See how businesses like yours have achieved measurable results through athlete partnerships.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {caseStudies.map((study, i) => (
                <div key={i} className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-lg overflow-hidden border border-gray-800">
                  <div className="p-6">
                    <span className="text-xs font-medium bg-primary/20 text-primary px-2 py-1 rounded mb-4 inline-block">
                      {study.category}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-4">{study.title}</h3>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Key Results:</h4>
                      <ul className="space-y-1">
                        {study.results.map((result, j) => (
                          <li key={j} className="text-sm flex items-start">
                            <span className="text-primary mr-2">•</span>
                            <span className="text-gray-300">{result}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      Read full case study
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
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
              <h2 className="text-3xl font-bold text-white mb-4">Business Partnership Plans</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Flexible pricing options to match your business size and campaign needs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1">Starter</h3>
                  <p className="text-gray-400 mb-4">For small businesses just entering NIL marketing</p>
                  <p className="text-3xl font-bold text-white mb-6">$99<span className="text-lg text-gray-400">/month</span></p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Connect with up to 5 athletes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Basic analytics dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Standard contract templates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Email support</span>
                    </li>
                  </ul>
                  <Link href="/business/sign-up?plan=starter">
                    <Button variant="outline" className="w-full">Get Started</Button>
                  </Link>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg overflow-hidden border border-primary/50 shadow-lg shadow-primary/10 relative">
                <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                  Most Popular
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1">Growth</h3>
                  <p className="text-gray-400 mb-4">For businesses ready to scale NIL partnerships</p>
                  <p className="text-3xl font-bold text-white mb-6">$249<span className="text-lg text-gray-400">/month</span></p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Connect with up to 15 athletes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Advanced analytics and reporting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Customizable contract terms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Campaign content calendar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Priority email & chat support</span>
                    </li>
                  </ul>
                  <Link href="/business/sign-up?plan=growth">
                    <Button className="w-full bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600">Get Started</Button>
                  </Link>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1">Enterprise</h3>
                  <p className="text-gray-400 mb-4">For large brands with extensive NIL needs</p>
                  <p className="text-3xl font-bold text-white mb-6">Custom</p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Unlimited athlete connections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Premium analytics with API access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">White-labeled portal option</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Multi-campaign management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">Dedicated account manager</span>
                    </li>
                  </ul>
                  <Link href="/contact">
                    <Button variant="outline" className="w-full">Contact Sales</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-red-900/20 to-amber-900/20 py-20">
          <div className="container max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Connect with Student-Athletes?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join innovative businesses already leveraging the power of authentic athlete partnerships on Contested.
            </p>
            <Link href="/business/sign-up">
              <Button size="lg" className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-medium px-8">
                Create Your Business Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-black py-20">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Common questions from businesses exploring NIL partnerships.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-2">How do we ensure NCAA compliance in our partnerships?</h3>
                <p className="text-gray-400">
                  Contested handles the compliance aspects for you. Our platform includes built-in guardrails and documentation tools that ensure all partnerships meet current NCAA and state regulations. Every contract and agreement is automatically reviewed for compliance.
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-2">Can we target athletes at specific schools or conferences?</h3>
                <p className="text-gray-400">
                  Yes, you can filter athlete searches by school, conference, geographic location, sport, and many other criteria to find partners who perfectly align with your campaign goals and target markets.
                </p>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-2">How are partnership fees determined?</h3>
                <p className="text-gray-400">
                  Partnership fees are set by individual athletes based on market rates, their following size, engagement metrics, and the scope of work requested. Our platform provides transparency with suggested rate ranges based on comparable partnerships.
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