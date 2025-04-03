import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: "Basic",
      description: "Perfect for individuals just getting started with NIL",
      monthlyPrice: 49,
      yearlyPrice: 490,
      savings: "Save $98",
      platformFee: "5%",
      features: [
        "5% platform fee on successful partnerships",
        "Up to 3 active campaigns",
        "10 athlete matches per month",
        "Basic analytics dashboard",
        "Email support",
        "Standard compliance tools"
      ],
      isPopular: false,
      buttonText: "Get Started",
      buttonVariant: "outline" as const
    },
    {
      name: "Professional",
      description: "For growing NIL programs and businesses",
      monthlyPrice: 149,
      yearlyPrice: 1490,
      savings: "Save $298",
      platformFee: "3%",
      features: [
        "3% platform fee on successful partnerships",
        "Up to 10 active campaigns",
        "Unlimited athlete matches",
        "Advanced analytics dashboard",
        "Priority matching algorithm",
        "Enhanced compliance tools",
        "Priority support",
        "Campaign performance reports"
      ],
      isPopular: true,
      buttonText: "Get Started",
      buttonVariant: "default" as const
    },
    {
      name: "Enterprise",
      description: "For large organizations and agencies",
      monthlyPrice: 499,
      yearlyPrice: 4990,
      savings: "Save $998",
      platformFee: "Custom",
      features: [
        "Custom platform fee on successful partnerships",
        "Unlimited campaigns",
        "Unlimited athlete matches",
        "Custom analytics & API access",
        "Dedicated account manager",
        "Strategic campaign consulting",
        "Advanced compliance tools",
        "Custom integration options",
        "White label solution"
      ],
      isPopular: false,
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const
    }
  ];

  return (
    <div className="bg-[#121212] text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 bg-[#121212]">
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c]">
                Simple, Transparent Pricing
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Choose the plan that's right for you, with no hidden fees or long-term commitments.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-[#2A2A2A] p-1 rounded-lg mb-12">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-[#f03c3c] text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={() => setBillingPeriod('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'yearly'
                    ? 'bg-[#f03c3c] text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
                onClick={() => setBillingPeriod('yearly')}
              >
                Yearly <span className="text-xs opacity-80">Save 20%</span>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] opacity-70"></div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-[#1E1E1E]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`bg-[#2A2A2A] border-none shadow-md relative overflow-hidden ${
                  plan.isPopular ? 'ring-2 ring-[#f03c3c]' : ''
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -right-12 top-8 bg-[#f03c3c] text-white py-1 px-12 transform rotate-45">
                    <span className="text-xs font-bold">POPULAR</span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                  
                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-white">
                        ${billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                      </span>
                      <span className="text-gray-400 ml-2">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <div className="mt-2 text-[#f03c3c] text-sm font-medium">{plan.savings}</div>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mb-8 text-gray-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-[#f03c3c] mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant={plan.buttonVariant}
                    className={`w-full ${
                      plan.buttonVariant === 'default' 
                      ? 'bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] text-white hover:from-[#d42e2e] hover:to-[#e34c4c]' 
                      : 'border-[#f03c3c] text-white hover:bg-[rgba(240,60,60,0.1)]'
                    }`}
                    asChild
                  >
                    <Link to="/dynamic-onboarding">{plan.buttonText}</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8 text-gray-400">
            All plans include a 14-day free trial. No credit card required.
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c]">
                Frequently Asked Questions
              </span>
            </h2>
            <p className="text-xl text-gray-300">
              Everything you need to know about Contested's pricing and features.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-8 bg-[#2A2A2A]">
                <TabsTrigger value="general" className="data-[state=active]:bg-[#f03c3c] data-[state=active]:text-white">
                  General
                </TabsTrigger>
                <TabsTrigger value="billing" className="data-[state=active]:bg-[#f03c3c] data-[state=active]:text-white">
                  Billing
                </TabsTrigger>
                <TabsTrigger value="features" className="data-[state=active]:bg-[#f03c3c] data-[state=active]:text-white">
                  Features
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="bg-[#2A2A2A] p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-white">What is Contested?</h3>
                  <p className="text-gray-300">
                    Contested is an AI-powered platform that connects college athletes with businesses for authentic NIL partnerships. We handle everything from athlete-brand matching to campaign management and compliance.
                  </p>
                </div>
                <div className="bg-[#2A2A2A] p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-white">Do I need a subscription?</h3>
                  <p className="text-gray-300">
                    Yes, Contested operates on a subscription model to provide continuous access to our matching algorithm, campaign management tools, and compliance features. We offer monthly and yearly billing options.
                  </p>
                </div>
                <div className="bg-[#2A2A2A] p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-white">Can I change plans later?</h3>
                  <p className="text-gray-300">
                    Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be prorated for the remainder of your billing cycle. When downgrading, changes take effect at the start of your next billing cycle.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="billing" className="space-y-4">
                <div className="bg-[#2A2A2A] p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-white">How does billing work?</h3>
                  <p className="text-gray-300">
                    We offer both monthly and annual billing cycles. Annual plans come with a 20% discount compared to monthly billing. You can cancel your subscription at any time.
                  </p>
                </div>
                <div className="bg-[#2A2A2A] p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-white">What payment methods do you accept?</h3>
                  <p className="text-gray-300">
                    We accept all major credit cards (Visa, Mastercard, American Express, Discover) as well as PayPal. For Enterprise plans, we can also accommodate purchase orders and ACH transfers.
                  </p>
                </div>
                <div className="bg-[#2A2A2A] p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-white">What happens when I upgrade or downgrade?</h3>
                  <p className="text-gray-300">
                    When upgrading, you'll be charged the prorated difference immediately and gain instant access to the new features. When downgrading, your plan will change at the end of your current billing cycle.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="features" className="space-y-4">
                <div className="bg-[#2A2A2A] p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-white">What does "athlete match" mean?</h3>
                  <p className="text-gray-300">
                    An athlete match is when our AI algorithm identifies a potential partnership between your business and an athlete. Each match includes a compatibility score, detailed rationale, and suggested partnership opportunities.
                  </p>
                </div>
                <div className="bg-[#2A2A2A] p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-white">What analytics are included?</h3>
                  <p className="text-gray-300">
                    Basic plans include engagement metrics and simple ROI calculations. Professional and Enterprise plans offer advanced analytics including audience demographics, sentiment analysis, conversion tracking, and customizable reporting.
                  </p>
                </div>
                <div className="bg-[#2A2A2A] p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-2 text-white">What compliance tools are included?</h3>
                  <p className="text-gray-300">
                    All plans include basic compliance documentation. Professional plans add school-specific policy integration and streamlined approval workflows. Enterprise plans offer custom compliance solutions and direct integration with university compliance systems.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Compare Plans */}
      <section className="py-20 bg-[#1E1E1E]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c]">
                Plan Comparison
              </span>
            </h2>
            <p className="text-xl text-gray-300">
              Find the perfect plan for your NIL strategy.
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="bg-[#2A2A2A] rounded-lg overflow-hidden">
                {/* Feature Categories */}
                <div className="grid grid-cols-4 gap-4 p-6 border-b border-[#333]">
                  <div className="font-bold text-xl text-white">Feature</div>
                  <div className="font-bold text-lg text-center text-white">Basic</div>
                  <div className="font-bold text-lg text-center text-white">Professional</div>
                  <div className="font-bold text-lg text-center text-white">Enterprise</div>
                </div>

                {/* Platform Features */}
                <div className="grid grid-cols-1 divide-y divide-[#333]">
                  <div className="p-6 bg-[#252525]">
                    <h3 className="font-bold text-lg text-white mb-2">Platform Features</h3>
                  </div>
                  
                  <FeatureRow 
                    feature="Active Campaigns" 
                    tooltip="The number of concurrent partnership campaigns you can run"
                    basic="Up to 3"
                    pro="Up to 10"
                    enterprise="Unlimited"
                  />
                  
                  <FeatureRow 
                    feature="Monthly Athlete Matches" 
                    tooltip="Number of AI-generated athlete partnership suggestions per month"
                    basic="10"
                    pro="Unlimited"
                    enterprise="Unlimited"
                  />
                  
                  <FeatureRow 
                    feature="Matching Algorithm Priority" 
                    tooltip="Priority level in the matching queue for faster results"
                    basic="Standard"
                    pro="Priority"
                    enterprise="Custom"
                  />
                  
                  <FeatureRow 
                    feature="User Accounts" 
                    tooltip="Number of team members who can access your dashboard"
                    basic="1"
                    pro="5"
                    enterprise="Unlimited"
                  />
                  
                  {/* Analytics */}
                  <div className="p-6 bg-[#252525]">
                    <h3 className="font-bold text-lg text-white mb-2">Analytics & Reporting</h3>
                  </div>
                  
                  <FeatureRow 
                    feature="Performance Dashboard" 
                    tooltip="Real-time metrics on campaign performance"
                    basic="Basic"
                    pro="Advanced"
                    enterprise="Custom"
                  />
                  
                  <FeatureRow 
                    feature="Audience Demographics" 
                    tooltip="Detailed breakdown of audience reached through partnerships"
                    basic="✓"
                    pro="✓"
                    enterprise="✓"
                  />
                  
                  <FeatureRow 
                    feature="ROI Calculations" 
                    tooltip="Tools to measure return on investment"
                    basic="Basic"
                    pro="Advanced"
                    enterprise="Custom"
                  />
                  
                  <FeatureRow 
                    feature="Custom Reports" 
                    tooltip="Generate custom reports for campaign analysis"
                    basic="—"
                    pro="✓"
                    enterprise="✓"
                  />
                  
                  <FeatureRow 
                    feature="API Access" 
                    tooltip="Access to Contested's API for custom integrations"
                    basic="—"
                    pro="—"
                    enterprise="✓"
                  />
                  
                  {/* Support */}
                  <div className="p-6 bg-[#252525]">
                    <h3 className="font-bold text-lg text-white mb-2">Support & Services</h3>
                  </div>
                  
                  <FeatureRow 
                    feature="Support Response Time" 
                    tooltip="Typical time to first response"
                    basic="48 hours"
                    pro="24 hours"
                    enterprise="4 hours"
                  />
                  
                  <FeatureRow 
                    feature="Dedicated Account Manager" 
                    tooltip="A personal point of contact for your account"
                    basic="—"
                    pro="—"
                    enterprise="✓"
                  />
                  
                  <FeatureRow 
                    feature="Campaign Strategy Consulting" 
                    tooltip="Expert assistance with campaign planning and execution"
                    basic="—"
                    pro="—"
                    enterprise="✓"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] text-white font-bold hover:from-[#d42e2e] hover:to-[#e34c4c] transition-all shadow-md"
              asChild
            >
              <Link to="/dynamic-onboarding">Get Started Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureRow({ 
  feature, 
  tooltip, 
  basic, 
  pro, 
  enterprise 
}: { 
  feature: string, 
  tooltip: string, 
  basic: string, 
  pro: string, 
  enterprise: string 
}) {
  return (
    <div className="grid grid-cols-4 gap-4 p-4 items-center">
      <div className="text-white flex items-center">
        {feature}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 ml-1 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="text-center text-gray-300">{basic}</div>
      <div className="text-center text-gray-300">{pro}</div>
      <div className="text-center text-gray-300">{enterprise}</div>
    </div>
  );
}