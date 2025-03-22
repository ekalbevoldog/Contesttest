import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import MatchResults from "@/components/MatchResults";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState<string>("matches");
  const [userType, setUserType] = useState<string | null>(null);
  
  // Get profile info 
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/profile'],
  });
  
  // Get matches
  const { data: matchesData, isLoading: isLoadingMatches } = useQuery({
    queryKey: ['/api/matches'],
  });
  
  useEffect(() => {
    if (profileData) {
      setUserType(profileData.userType);
    }
  }, [profileData]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
                Contested Dashboard
              </span>
            </h1>
            <p className="text-gray-500">Connect, collaborate, and grow your brand partnerships</p>
          </div>
          
          <Tabs defaultValue="matches" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="matches">Matches</TabsTrigger>
              <TabsTrigger value="profile">My Profile</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="matches" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Match Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingMatches ? (
                        <div className="space-y-4">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : (
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-4">
                            {matchesData?.matches?.map((match: any) => (
                              <div key={match.id} className="p-3 rounded-md border hover:bg-gray-50 cursor-pointer">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">{userType === 'athlete' ? match.business.name : match.athlete.name}</p>
                                    <p className="text-sm text-gray-500">{match.campaign?.title}</p>
                                  </div>
                                  <Badge>{match.score}%</Badge>
                                </div>
                              </div>
                            ))}
                            {matchesData?.matches?.length === 0 && (
                              <div className="text-center p-4">
                                <p className="text-gray-500">No matches found yet.</p>
                                <Button className="mt-2" variant="outline" size="sm">Start a new chat</Button>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <div className="md:col-span-2">
                  {isLoadingMatches ? (
                    <Card>
                      <CardContent className="pt-6">
                        <Skeleton className="h-8 w-1/3 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                        <Separator className="my-6" />
                        <Skeleton className="h-32 w-full" />
                      </CardContent>
                    </Card>
                  ) : matchesData?.matches?.length > 0 ? (
                    <MatchResults match={matchesData.matches[0]} userType={userType} />
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <h3 className="text-xl font-semibold mb-2">No Matches Yet</h3>
                        <p className="text-gray-500 mb-4">Complete your profile to get matched with {userType === 'athlete' ? 'businesses' : 'athletes'}.</p>
                        <Button>Complete Your Profile</Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="profile" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingProfile ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-medium">{profileData?.name || 'Your Profile'}</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Type: {userType === 'athlete' ? 'Mid-Tier Athlete' : 'Small/Medium Business'}
                      </p>
                      
                      <div className="space-y-4">
                        {userType === 'athlete' && (
                          <>
                            <div>
                              <p className="text-sm font-medium">Sport</p>
                              <p>{profileData?.sport || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">School</p>
                              <p>{profileData?.school || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Follower Count</p>
                              <p>{profileData?.followerCount || 'Not specified'}</p>
                            </div>
                          </>
                        )}
                        
                        {userType === 'business' && (
                          <>
                            <div>
                              <p className="text-sm font-medium">Product Type</p>
                              <p>{profileData?.productType || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Target Audience</p>
                              <p>{profileData?.audienceGoals || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Brand Values</p>
                              <p>{profileData?.values || 'Not specified'}</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <Button className="mt-6">Edit Profile</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">Analytics coming soon. Check back later for insights about your profile and matches.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
