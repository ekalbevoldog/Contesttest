import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/FadeIn";
import { Link } from "wouter";
import { ArrowLeft, Check } from "lucide-react";

export default function Pricing() {
  const tiers = [
    {
      name: "Starter",
      price: "$0",
      description: "For athletes and businesses just getting started with NIL partnerships",
      features: [
        "Basic profile creation",
        "Limited AI matching suggestions",
        "Public profile page",
        "Message up to 5 potential partners",
        "Standard compliance tools"
      ],
      cta: "Get Started",
      href: "/onboarding",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$29/month",
      description: "Everything you need for professional NIL management",
      features: [
        "Enhanced profile with media gallery",
        "Priority AI matching engine",
        "Custom branding options",
        "Unlimited messaging",
        "Analytics dashboard",
        "Priority support",
        "Contract templates"
      ],
      cta: "Upgrade to Pro",
      href: "/onboarding?plan=pro",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For schools, agencies and organizations managing multiple athletes",
      features: [
        "All Pro features",
        "Bulk athlete management",
        "Team dashboard",
        "API access",
        "Custom reporting",
        "Dedicated account manager",
        "White-label options"
      ],
      cta: "Contact Sales",
      href: "/contact",
      highlighted: false
    }
  ];

  return (
    <FadeIn>
      <div className="container max-w-6xl mx-auto px-4 py-16 mt-12">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that works best for your NIL partnership needs
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, i) => (
            <div 
              key={i} 
              className={`rounded-lg border ${tier.highlighted ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'} bg-card text-card-foreground p-6 relative flex flex-col`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-5">
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <div className="mt-2 flex items-baseline text-gray-900 dark:text-gray-100">
                  <span className="text-3xl font-bold tracking-tight">{tier.price}</span>
                  {tier.price !== "Custom" && <span className="ml-1 text-sm text-muted-foreground">/month</span>}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>
              </div>
              
              <ul className="space-y-3 flex-grow mb-6">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link href={tier.href}>
                <Button 
                  className={`w-full ${tier.highlighted ? 'bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white' : ''}`}
                  variant={tier.highlighted ? 'default' : 'outline'}
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        
        <div className="bg-muted rounded-lg p-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">How does the free tier work?</h3>
                <p className="text-muted-foreground">
                  Our free tier provides all the essential tools for athletes and businesses to start exploring NIL partnerships. 
                  You can create a basic profile, receive match suggestions, and message up to 5 potential partners per month.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Can I upgrade or downgrade my plan later?</h3>
                <p className="text-muted-foreground">
                  Yes, you can change your plan at any time. When you upgrade, you'll be charged the prorated amount for the 
                  remainder of your billing cycle. If you downgrade, the changes will take effect at the start of your next billing cycle.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Do you offer discounts for educational institutions?</h3>
                <p className="text-muted-foreground">
                  Yes, we offer special pricing for colleges, universities, and athletic departments. Please contact our 
                  sales team to learn more about our educational institution programs.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">How do I get started?</h3>
                <p className="text-muted-foreground">
                  Simply create an account, complete your profile, and you'll immediately have access to all the 
                  features available in your chosen plan. Our onboarding process will guide you through each step.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}