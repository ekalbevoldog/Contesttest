import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/FadeIn";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Solutions() {
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
          <h1 className="text-4xl font-bold tracking-tight mb-4">Our NIL Solutions</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connecting athletes and businesses through intelligent matching and compliance management.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-xl font-bold mb-2">For Athletes</h3>
            <p className="text-muted-foreground mb-4">
              Build your personal brand, showcase your talents, and connect with businesses that align with your values.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>AI-powered brand matching</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Public profile page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Direct messaging with businesses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Partnership management</span>
              </li>
            </ul>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💼</span>
            </div>
            <h3 className="text-xl font-bold mb-2">For Businesses</h3>
            <p className="text-muted-foreground mb-4">
              Find and partner with the perfect athlete ambassadors to represent your brand authentically.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Advanced athlete matching</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Campaign management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Performance analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Compliance assistance</span>
              </li>
            </ul>
          </div>
          
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-bold mb-2">For Compliance Officers</h3>
            <p className="text-muted-foreground mb-4">
              Streamline NIL compliance oversight and ensure all partnerships meet institutional requirements.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Partnership approval workflow</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Compliance dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Documentation management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Audit trail and reporting</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Join the Contested platform today and transform your NIL opportunities
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600">
              Create Your Account
            </Button>
          </Link>
        </div>
      </div>
    </FadeIn>
  );
}