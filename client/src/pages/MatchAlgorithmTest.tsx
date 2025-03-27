import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  CheckCircleIcon
} from "lucide-react";

export default function MatchAlgorithmTest() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [matchData, setMatchData] = useState<any>(null);

  // Generate a random session ID for testing
  useEffect(() => {
    const randomSessionId = Math.random().toString(36).substring(2, 15);
    setSessionId(randomSessionId);
  }, []);

  // Simulate a match with enhanced data
  const simulateMatch = async () => {
    setLoading(true);
    try {
      const mockBusinessData = {
        id: 101,
        name: "Urban Athletics Co.",
        productType: "Sports Apparel",
        audienceGoals: "Gen Z college students interested in fitness and streetwear",
        campaignVibe: "Urban, authentic, energetic",
        values: "Sustainability, diversity, authenticity",
        targetSchoolsSports: "Division I basketball, volleyball, track & field"
      };

      const mockAthleteData = {
        id: 201,
        name: "Jordan Mitchell",
        sport: "Basketball",
        school: "State University",
        division: "Division I",
        followerCount: 45000,
        contentStyle: "Behind-the-scenes training, lifestyle content, motivational posts",
        compensationGoals: "$1,000-3,000 per campaign",
        socialMediaMetrics: {
          instagram: {
            followers: 32000,
            engagement: 3.8,
            postFrequency: "3-4 times per week"
          },
          tiktok: {
            followers: 15000,
            engagement: 5.2,
            postFrequency: "daily"
          }
        }
      };

      const mockCampaignData = {
        id: 301,
        title: "Spring Launch Instagram Partnership",
        description: "Looking for authentic athletes to showcase our new spring collection through Instagram content",
        deliverables: ["3 Instagram feed posts", "5 Instagram stories", "1 Reels video"],
        budget: 2500,
        duration: "4 weeks"
      };

      // Simulate calling the backend matching algorithm
      const enhancedMatchData = {
        id: Date.now().toString(),
        score: 87,
        reason: "Jordan Mitchell's authentic content style and basketball-focused audience aligns excellently with Urban Athletics' campaign goals. The brand's values and target demographic match well with Jordan's follower base.",
        audienceFitScore: 92,
        contentStyleFitScore: 85,
        brandValueAlignmentScore: 88,
        engagementPotentialScore: 90,
        compensationFitScore: 80,
        strengthAreas: [
          "Strong audience demographic overlap",
          "Authentic content style matches brand voice",
          "High engagement rates on Instagram",
          "Previous success with similar partnerships"
        ],
        weaknessAreas: [
          "Budget is at lower end of athlete's compensation goals",
          "Limited experience with Reels content"
        ],
        improvementSuggestions: [
          "Consider increasing budget by 10-15% to better align with athlete's expectations",
          "Provide creative direction for Reels content",
          "Focus campaign on Instagram Stories where engagement is highest"
        ],
        campaign: mockCampaignData,
        business: mockBusinessData,
        athlete: mockAthleteData
      };

      setMatchData(enhancedMatchData);

      toast({
        title: "Match Simulation Complete",
        description: "Enhanced match data generated successfully",
      });
    } catch (error) {
      console.error("Error simulating match:", error);
      toast({
        title: "Error",
        description: "Failed to simulate match",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderScoreCard = (score: number, title: string, description: string) => (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-2">
          {score}
          <span className="text-sm font-normal text-muted-foreground">/100</span>
        </div>
        <Progress value={score} className="h-2" />
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-amber-500 to-red-500 bg-clip-text text-transparent mb-2">
          Contested AI Match Algorithm Test
        </h1>
        <p className="text-lg text-muted-foreground">
          Test the enhanced multi-dimensional matching algorithm with simulated data
        </p>
      </div>

      {!matchData ? (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Generate Test Match</CardTitle>
            <CardDescription>
              Click the button below to simulate a match with our enhanced algorithm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              This will generate a simulated match between an athlete and business 
              using our new multi-dimensional scoring system.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Algorithm Dimensions:</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Audience Fit
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Content Style Fit
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Brand Value Alignment
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Engagement Potential
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Compensation Fit
                  </li>
                </ul>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Enhanced Features:</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Partnership Strength Analysis
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Weakness Identification
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Actionable Improvement Suggestions
                  </li>
                  <li className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                    Social Media Metrics Integration
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={simulateMatch} disabled={loading} size="lg" className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700">
              {loading ? "Generating Match..." : "Generate Enhanced Match"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="shadow-lg border-t-4 border-t-amber-500">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className="mb-2 bg-gradient-to-r from-red-600 to-amber-600">Match Score: {matchData.score}/100</Badge>
                  <CardTitle className="text-2xl">
                    {matchData.athlete.name} + {matchData.business.name}
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    {matchData.reason}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Avatar className="h-16 w-16 border-2 border-muted">
                    <AvatarFallback className="bg-gradient-to-br from-red-600 to-amber-600 text-white text-xl">
                      {matchData.athlete.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Avatar className="h-16 w-16 border-2 border-muted">
                    <AvatarFallback className="bg-gradient-to-br from-amber-600 to-red-600 text-white text-xl">
                      {matchData.business.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="scores">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="scores">Match Scores</TabsTrigger>
                  <TabsTrigger value="analysis">Strength & Weakness Analysis</TabsTrigger>
                  <TabsTrigger value="profiles">Profile Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="scores" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderScoreCard(
                      matchData.audienceFitScore,
                      "Audience Fit",
                      "How well the athlete's audience matches the business's target"
                    )}
                    {renderScoreCard(
                      matchData.contentStyleFitScore,
                      "Content Style",
                      "Compatibility of athlete's content with campaign needs"
                    )}
                    {renderScoreCard(
                      matchData.brandValueAlignmentScore,
                      "Brand Values",
                      "Alignment between athlete's personal brand and business values"
                    )}
                    {renderScoreCard(
                      matchData.engagementPotentialScore,
                      "Engagement",
                      "Predicted engagement rates for partnership content"
                    )}
                    {renderScoreCard(
                      matchData.compensationFitScore,
                      "Budget Match",
                      "How well the campaign budget meets athlete's expectations"
                    )}
                    <Card className="shadow-sm col-span-1 md:col-span-2 lg:col-span-3 border-t-2 border-t-amber-500">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold">Overall Match Score</CardTitle>
                        <CardDescription className="text-xs">Weighted average of all dimensions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold mb-2 text-center">
                          {matchData.score}
                          <span className="text-sm font-normal text-muted-foreground">/100</span>
                        </div>
                        <Progress value={matchData.score} className="h-3" />
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="analysis" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-lg font-semibold flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          Partnership Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-3">
                          {matchData.strengthAreas.map((strength: string, index: number) => (
                            <li key={`strength-${index}`} className="flex items-start">
                              <Badge className="mr-2 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200">+</Badge>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-lg font-semibold flex items-center">
                          <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                          Areas for Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-3">
                          {matchData.weaknessAreas.map((weakness: string, index: number) => (
                            <li key={`weakness-${index}`} className="flex items-start">
                              <Badge className="mr-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200">!</Badge>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm md:col-span-2 border-t-2 border-t-amber-500">
                      <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-lg font-semibold">
                          Improvement Suggestions
                        </CardTitle>
                        <CardDescription>
                          Actionable recommendations to enhance partnership quality
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-3">
                          {matchData.improvementSuggestions.map((suggestion: string, index: number) => (
                            <li key={`suggestion-${index}`} className="flex items-start bg-muted/50 p-3 rounded-md">
                              <ArrowUpRight className="h-5 w-5 text-amber-600 mr-2 shrink-0 mt-0.5" />
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="profiles" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2 border-b">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-red-500 to-amber-500 text-white">
                              {matchData.athlete.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{matchData.athlete.name}</CardTitle>
                            <CardDescription>{matchData.athlete.sport}, {matchData.athlete.school}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Sport Details</h4>
                            <p className="text-sm text-muted-foreground">{matchData.athlete.division} | {matchData.athlete.sport}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1">Content Style</h4>
                            <p className="text-sm text-muted-foreground">{matchData.athlete.contentStyle}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1">Compensation Goals</h4>
                            <p className="text-sm text-muted-foreground">{matchData.athlete.compensationGoals}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1">Social Media Metrics</h4>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <div className="bg-muted/50 p-3 rounded-md">
                                <div className="text-xs font-medium uppercase">Instagram</div>
                                <div className="text-sm mt-1">
                                  <div>{matchData.athlete.socialMediaMetrics.instagram.followers.toLocaleString()} followers</div>
                                  <div>{matchData.athlete.socialMediaMetrics.instagram.engagement}% engagement</div>
                                  <div className="text-xs text-muted-foreground">{matchData.athlete.socialMediaMetrics.instagram.postFrequency}</div>
                                </div>
                              </div>
                              <div className="bg-muted/50 p-3 rounded-md">
                                <div className="text-xs font-medium uppercase">TikTok</div>
                                <div className="text-sm mt-1">
                                  <div>{matchData.athlete.socialMediaMetrics.tiktok.followers.toLocaleString()} followers</div>
                                  <div>{matchData.athlete.socialMediaMetrics.tiktok.engagement}% engagement</div>
                                  <div className="text-xs text-muted-foreground">{matchData.athlete.socialMediaMetrics.tiktok.postFrequency}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-sm">
                      <CardHeader className="pb-2 border-b">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-red-500 text-white">
                              {matchData.business.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{matchData.business.name}</CardTitle>
                            <CardDescription>{matchData.business.productType}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-1">Brand Values</h4>
                            <p className="text-sm text-muted-foreground">{matchData.business.values}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1">Audience Goals</h4>
                            <p className="text-sm text-muted-foreground">{matchData.business.audienceGoals}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1">Campaign Vibe</h4>
                            <p className="text-sm text-muted-foreground">{matchData.business.campaignVibe}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1">Target Schools/Sports</h4>
                            <p className="text-sm text-muted-foreground">{matchData.business.targetSchoolsSports}</p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-1">Campaign Details</h4>
                            <div className="bg-muted/50 p-3 rounded-md mt-1">
                              <div className="font-medium">{matchData.campaign.title}</div>
                              <div className="text-sm mt-1">{matchData.campaign.description}</div>
                              <Separator className="my-2 opacity-30" />
                              <div className="text-sm">
                                <div className="font-medium mb-1">Deliverables:</div>
                                <ul className="list-disc list-inside text-xs text-muted-foreground">
                                  {matchData.campaign.deliverables.map((d: string, i: number) => (
                                    <li key={i}>{d}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="text-sm mt-2">
                                <span className="font-medium">Budget:</span> ${matchData.campaign.budget.toLocaleString()}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Duration:</span> {matchData.campaign.duration}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between gap-4">
              <Button variant="outline" onClick={() => setMatchData(null)} className="flex-1">
                Generate New Match
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700">
                View Real Matches
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}