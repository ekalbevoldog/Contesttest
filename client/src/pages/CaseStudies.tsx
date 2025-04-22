import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/animations/FadeIn";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function CaseStudies() {
  const caseStudies = [
    {
      title: "Elite University Athletic Department",
      category: "University",
      summary: "How a top university athletic department used Contested to streamline NIL compliance for 500+ student athletes",
      results: [
        "92% reduction in compliance paperwork processing time",
        "85% increase in approved partnerships",
        "100% compliance with NCAA regulations"
      ],
      image: "/grid-pattern.png", // Placeholder image
      href: "/case-studies/elite-university"
    },
    {
      title: "All-American Basketball Star",
      category: "Athlete",
      summary: "How a rising basketball star tripled their NIL revenue by finding perfect brand matches",
      results: [
        "300% increase in partnership revenue",
        "12 new brand deals in 6 months",
        "Expanded social media presence by 200K followers"
      ],
      image: "/grid-pattern.png", // Placeholder image
      href: "/case-studies/basketball-star"
    },
    {
      title: "Regional Sports Apparel Brand",
      category: "Business",
      summary: "How a mid-size sports apparel company leveraged athlete partnerships to enter new markets",
      results: [
        "47% increase in e-commerce sales",
        "Partnership with 25 local college athletes",
        "Expanded to 3 new regional markets"
      ],
      image: "/grid-pattern.png", // Placeholder image
      href: "/case-studies/apparel-brand"
    },
    {
      title: "NCAA Division II Conference",
      category: "Compliance",
      summary: "How an entire athletic conference standardized NIL compliance across 12 member institutions",
      results: [
        "Implemented unified compliance protocols",
        "Reduced violation risks by 78%",
        "Provided equal NIL opportunities for all student-athletes"
      ],
      image: "/grid-pattern.png", // Placeholder image
      href: "/case-studies/division-ii-conference"
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
          <h1 className="text-4xl font-bold tracking-tight mb-4">Case Studies</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real success stories from athletes, businesses, and institutions using Contested
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {caseStudies.map((study, i) => (
            <div key={i} className="group rounded-lg border bg-card text-card-foreground shadow overflow-hidden flex flex-col">
              <div className="h-48 bg-muted relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                <span className="absolute top-3 left-3 text-xs font-medium bg-primary text-primary-foreground px-2 py-1 rounded">
                  {study.category}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{study.title}</h3>
                <p className="text-muted-foreground mb-4">{study.summary}</p>
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Key Results:</h4>
                  <ul className="space-y-1">
                    {study.results.map((result, j) => (
                      <li key={j} className="text-sm flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={study.href}>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 group-hover:text-primary transition-colors">
                    Read full case study
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to become our next success story?</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Join hundreds of athletes, businesses, and institutions who have transformed 
            their NIL partnerships with Contested's intelligent platform.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600">
              Get Started Today
            </Button>
          </Link>
        </div>
      </div>
    </FadeIn>
  );
}