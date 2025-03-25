import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function CaseStudies() {
  return (
    <div className="bg-[#121212] text-white min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#121212] pt-20 pb-16">
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c]">
                Success Stories
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Discover how athletes and businesses create meaningful partnerships and achieve exceptional results with Contested.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] opacity-70"></div>
      </section>

      {/* Filter Tabs */}
      <section className="py-12 bg-[#1E1E1E]">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="all" className="max-w-4xl mx-auto">
            <TabsList className="w-full grid grid-cols-4 mb-8 bg-[#2A2A2A]">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#f03c3c] data-[state=active]:text-white">
                All Stories
              </TabsTrigger>
              <TabsTrigger value="athletes" className="data-[state=active]:bg-[#f03c3c] data-[state=active]:text-white">
                Athletes
              </TabsTrigger>
              <TabsTrigger value="businesses" className="data-[state=active]:bg-[#f03c3c] data-[state=active]:text-white">
                Businesses
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-[#f03c3c] data-[state=active]:text-white">
                Campaigns
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <CaseStudyCard 
                  category="Athlete Success"
                  title="Sarah Johnson: From College Volleyball to Brand Partnerships"
                  description="How a D1 volleyball player created a sustainable NIL income stream through authentic partnerships."
                  metrics={["3 brand partnerships", "$3,500 in revenue", "12% follower growth"]}
                  image="/volleyball-player.jpg"
                />
                
                <CaseStudyCard 
                  category="Business Impact"
                  title="Mountain Outfitters: Connecting with Outdoor Athletes"
                  description="How an outdoor apparel brand found the perfect athlete partnerships to reach new audiences."
                  metrics={["4.2X ROI", "230% engagement increase", "16% sales lift"]}
                  image="/outdoor-brand.jpg"
                />
                
                <CaseStudyCard 
                  category="Multi-Channel Campaign"
                  title="TechFit Wearables: Performance Focused Partnerships"
                  description="How a fitness wearable company built authentic relationships with college athletes."
                  metrics={["8 athlete partnerships", "12,500 website visitors", "315 product sales"]}
                  image="/wearable-tech.jpg"
                />
                
                <CaseStudyCard 
                  category="Local Business"
                  title="City Cafe: Building Community Connections"
                  description="How a local cafe partnered with university athletes to become a campus favorite."
                  metrics={["22% foot traffic increase", "5 campus athletes", "3 successful events"]}
                  image="/local-cafe.jpg"
                />
                
                <CaseStudyCard 
                  category="Nation-Wide Campaign"
                  title="SportsDrink: Regional Ambassador Program"
                  description="How a sports beverage created a nation-wide ambassador program with diverse athletes."
                  metrics={["28 campus representatives", "450K social impressions", "17% market share growth"]}
                  image="/sports-drink.jpg"
                />
                
                <CaseStudyCard 
                  category="Athlete Growth"
                  title="Marcus Williams: Basketball Star to Entrepreneur"
                  description="How a college basketball player built a personal brand that transcended his sport."
                  metrics={["8 brand partnerships", "$12,000 in NIL revenue", "Launched personal brand"]}
                  image="/basketball-player.jpg"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="athletes">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <CaseStudyCard 
                  category="Athlete Success"
                  title="Sarah Johnson: From College Volleyball to Brand Partnerships"
                  description="How a D1 volleyball player created a sustainable NIL income stream through authentic partnerships."
                  metrics={["3 brand partnerships", "$3,500 in revenue", "12% follower growth"]}
                  image="/volleyball-player.jpg"
                />
                
                <CaseStudyCard 
                  category="Athlete Growth"
                  title="Marcus Williams: Basketball Star to Entrepreneur"
                  description="How a college basketball player built a personal brand that transcended his sport."
                  metrics={["8 brand partnerships", "$12,000 in NIL revenue", "Launched personal brand"]}
                  image="/basketball-player.jpg"
                />
                
                <CaseStudyCard 
                  category="Athlete Strategy"
                  title="Emma Chen: Building a Personal Brand in Swimming"
                  description="How a college swimmer leveraged her unique story to attract authentic partnerships."
                  metrics={["5 long-term partners", "Created content series", "3X social growth"]}
                  image="/swimmer.jpg"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="businesses">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <CaseStudyCard 
                  category="Business Impact"
                  title="Mountain Outfitters: Connecting with Outdoor Athletes"
                  description="How an outdoor apparel brand found the perfect athlete partnerships to reach new audiences."
                  metrics={["4.2X ROI", "230% engagement increase", "16% sales lift"]}
                  image="/outdoor-brand.jpg"
                />
                
                <CaseStudyCard 
                  category="Local Business"
                  title="City Cafe: Building Community Connections"
                  description="How a local cafe partnered with university athletes to become a campus favorite."
                  metrics={["22% foot traffic increase", "5 campus athletes", "3 successful events"]}
                  image="/local-cafe.jpg"
                />
                
                <CaseStudyCard 
                  category="Product Launch"
                  title="TechGear: Launching Through Athlete Voices"
                  description="How a tech accessories brand used athlete partnerships to successfully launch a new product line."
                  metrics={["28 day sell-out", "35% from athlete referrals", "6 campus reps"]}
                  image="/tech-product.jpg"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="campaigns">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <CaseStudyCard 
                  category="Multi-Channel Campaign"
                  title="TechFit Wearables: Performance Focused Partnerships"
                  description="How a fitness wearable company built authentic relationships with college athletes."
                  metrics={["8 athlete partnerships", "12,500 website visitors", "315 product sales"]}
                  image="/wearable-tech.jpg"
                />
                
                <CaseStudyCard 
                  category="Nation-Wide Campaign"
                  title="SportsDrink: Regional Ambassador Program"
                  description="How a sports beverage created a nation-wide ambassador program with diverse athletes."
                  metrics={["28 campus representatives", "450K social impressions", "17% market share growth"]}
                  image="/sports-drink.jpg"
                />
                
                <CaseStudyCard 
                  category="Seasonal Campaign"
                  title="CampusWear: Back to School Campaign"
                  description="How a clothing brand created buzz around their fall collection with strategic athlete partnerships."
                  metrics={["15 campus influencers", "45K in revenue", "78% engagement rate"]}
                  image="/campus-clothes.jpg"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Featured Case Study */}
      <section className="py-20 bg-[#121212]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-[#2A2A2A] rounded-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <Badge className="bg-[rgba(240,60,60,0.15)] text-[#f03c3c] mb-4 self-start">Featured Success Story</Badge>
                  <h2 className="text-3xl font-bold mb-4 text-white">Coastal Brewery & Volleyball Team: A Community Partnership</h2>
                  <p className="text-gray-300 mb-6">
                    When Coastal Brewery wanted to strengthen their ties to the local community, they turned to Contested to connect with the university's volleyball team. What started as a simple sponsorship evolved into a comprehensive partnership program.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-lg">
                      <div className="text-[#f03c3c] text-3xl font-bold">32%</div>
                      <div className="text-gray-400">Increase in local sales</div>
                    </div>
                    <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-lg">
                      <div className="text-[#f03c3c] text-3xl font-bold">12</div>
                      <div className="text-gray-400">Athletes partnered</div>
                    </div>
                    <div className="bg-[rgba(255,255,255,0.05)] p-4 rounded-lg">
                      <div className="text-[#f03c3c] text-3xl font-bold">5.4x</div>
                      <div className="text-gray-400">Marketing ROI</div>
                    </div>
                  </div>
                  
                  <Button 
                    className="bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] text-white hover:from-[#d42e2e] hover:to-[#e34c4c] self-start"
                  >
                    Read Full Case Study
                  </Button>
                </div>
                <div className="bg-[url('/brewery-case-study.jpg')] bg-cover bg-center min-h-[300px] lg:min-h-0"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-[#1E1E1E]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c]">
                What Our Customers Say
              </span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="bg-[#2A2A2A] shadow-md hover:shadow-lg transition-shadow overflow-hidden border-none">
              <div className="flex flex-col h-full">
                <div className="bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">Sarah Johnson</h3>
                      <p className="text-white/80">Division I Volleyball Player</p>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <p className="text-gray-300 italic mb-4">
                    "Contested has completely changed how I approach NIL opportunities. Within my first month, I secured partnerships with three local businesses that perfectly aligned with my personal values. The AI matching technology is incredible!"
                  </p>
                  <div className="flex items-center">
                    <div className="text-[#f03c3c] font-bold">Results:</div>
                    <div className="ml-2 text-gray-300">3 partnerships, $3,500 in revenue</div>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="bg-[#2A2A2A] shadow-md hover:shadow-lg transition-shadow overflow-hidden border-none">
              <div className="flex flex-col h-full">
                <div className="bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">Mountain Outfitters</h3>
                      <p className="text-white/80">Outdoor Apparel Brand</p>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-grow">
                  <p className="text-gray-300 italic mb-4">
                    "As a growing outdoor brand, we wanted to connect with authentic voices who love nature and adventure. Contested matched us with hikers, climbers, and trail runners who genuinely use and love our products. The ROI has been incredible."
                  </p>
                  <div className="flex items-center">
                    <div className="text-[#f03c3c] font-bold">Results:</div>
                    <div className="ml-2 text-gray-300">4.2x ROI, 230% increase in social engagement</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#121212] text-white relative">
        <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to create your own success story?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Join Contested today and discover the perfect partnerships for your brand or athletic career.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] text-white font-bold hover:from-[#d42e2e] hover:to-[#e34c4c] transition-all shadow-md"
                asChild
              >
                <Link to="/find-athlete-match">Get Started Now</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-[#f03c3c] text-white hover:bg-[rgba(240,60,60,0.1)]"
                asChild
              >
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CaseStudyCard({ 
  category, 
  title, 
  description, 
  metrics, 
  image 
}: { 
  category: string, 
  title: string, 
  description: string, 
  metrics: string[], 
  image: string 
}) {
  return (
    <Card className="bg-[#2A2A2A] shadow-md hover:shadow-xl transition-all border-none overflow-hidden hover:translate-y-[-4px]">
      <div className="h-48 bg-[#333] bg-opacity-50 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#2A2A2A] to-transparent opacity-60"></div>
        <Badge className="absolute top-4 left-4 bg-[rgba(240,60,60,0.8)] text-white border-none">
          {category}
        </Badge>
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
        <p className="text-gray-300 mb-4">{description}</p>
        <div className="border-t border-[#444] pt-4 mt-4">
          <p className="text-[#f03c3c] font-medium mb-2">Key Results:</p>
          <ul className="space-y-1">
            {metrics.map((metric, index) => (
              <li key={index} className="text-gray-300 text-sm flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-[#f03c3c] mr-2"></div>
                {metric}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full border-[#f03c3c] text-white hover:bg-[rgba(240,60,60,0.1)]"
          >
            Read Full Case Study
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}