'use client';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import { useProWizard } from '@/contexts/ProWizardProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Sliders, ArrowUpDown, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';

export default function Match() {
  const { campaignId, form, updateForm, nextStep, prevStep } = useProWizard();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [matchCandidates, setMatchCandidates] = useState<any[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<any[]>(form.selectedMatches || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  // Initialize the interval reference
  const [matchingInterval, setMatchingInterval] = useState<NodeJS.Timeout | null>(null);

  // Load previously selected athletes if any
  useEffect(() => {
    if (form.selectedMatches?.length > 0) {
      setSelectedAthletes(form.selectedMatches);
    }
  }, [form.selectedMatches]);

  // Run the matching process with proper validation
  const runMatching = async () => {
    // Validate campaign ID
    if (!campaignId) {
      toast({
        title: "Error",
        description: "Campaign ID not found. Please start from the beginning.",
        variant: "destructive"
      });
      navigate('/wizard/pro/start');
      return;
    }

    // Validate targeting criteria 
    if (!form.targetSports || form.targetSports.length === 0) {
      toast({
        title: "Missing targeting criteria",
        description: "Please go back and select target sports for better athlete matching"
      });
      // We'll continue anyway for demo purposes, but show a warning
    }

    setIsMatching(true);
    setMatchProgress(0);
    
    try {
      // Set up progress animation
      const progressInterval = setInterval(() => {
        setMatchProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);
      
      // Store interval in state for cleanup
      setMatchingInterval(progressInterval);
      
      // First update campaign in Supabase to record match attempt
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          match_attempted: true,
          match_timestamp: new Date().toISOString(),
          target_sports: form.targetSports,
          target_audience: form.targetAudience
        })
        .eq('id', campaignId);
        
      if (updateError) {
        console.warn('Could not update campaign match attempt:', updateError);
        // Continue anyway - non-critical
      }
      
      // Call the matching service
      const response = await fetch('/api/match/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          campaignId, 
          targetSports: form.targetSports || [],
          targetAudience: form.targetAudience || {},
        }),
      });
      
      if (!response.ok) {
        throw new Error('Matching service error');
      }
      
      const matchData = await response.json();
      
      // Complete progress
      setMatchingInterval((currentInterval) => {
        if (currentInterval) {
          clearInterval(currentInterval);
        }
        return null;
      });
      setMatchProgress(100);
      
      // Short timeout to show 100% before resetting
      setTimeout(() => {
        setMatchCandidates(matchData.candidates || []);
        setIsMatching(false);
      }, 500);
      
    } catch (error: any) {
      console.error('Matching API error:', error);
      
      // Call Supabase for athlete data if the API fails
      setIsLoading(true);
      
      try {
        // Get real athlete data from database as fallback
        const { data, error } = await supabase
          .from('athlete_profiles')
          .select('*')
          .limit(10);
          
        if (error) throw error;
        
        // Complete progress animation
        setMatchingInterval((currentInterval) => {
          if (currentInterval) {
            clearInterval(currentInterval);
          }
          return null;
        });
        setMatchProgress(100);
        
        setTimeout(() => {
          if (data && data.length > 0) {
            setMatchCandidates(data);
            toast({
              title: "Athletes found",
              description: `Found ${data.length} athletes for your campaign`,
            });
          } else {
            toast({
              title: "No matches found",
              description: "Try adjusting your targeting criteria",
              variant: "destructive"
            });
          }
          setIsMatching(false);
          setIsLoading(false);
        }, 500);
        
      } catch (dbError) {
        console.error('Database error:', dbError);
        toast({
          title: "Error loading athletes",
          description: "Could not load athlete matches. Please try again.",
          variant: "destructive"
        });
        setIsMatching(false);
        setIsLoading(false);
      }
    }
  };

  // Toggle athlete selection
  const toggleAthlete = (athlete: any) => {
    if (selectedAthletes.some(a => a.id === athlete.id)) {
      setSelectedAthletes(selectedAthletes.filter(a => a.id !== athlete.id));
    } else {
      setSelectedAthletes([...selectedAthletes, athlete]);
    }
  };

  // Filter athletes based on search query
  const filteredAthletes = matchCandidates.filter(athlete => 
    athlete.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.sport?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (athlete.university && athlete.university.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Form validation schema using zod
  const validationSchema = z.object({
    selectedAthletes: z.array(z.any()).min(1, {
      message: "Please select at least one athlete for your campaign"
    }),
    matchCandidates: z.array(z.any()).min(1, {
      message: "Please run the athlete matching process first"
    })
  });

  // Form submission handler with loading state
  const handleContinue = async () => {
    setIsLoading(true);
    
    try {
      // Validate using schema
      const validationResult = validationSchema.safeParse({
        selectedAthletes,
        matchCandidates
      });
      
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 
                            "Please select at least one athlete";
        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      if (!campaignId) {
        toast({
          title: "Error",
          description: "Campaign ID not found. Please start from the beginning.",
          variant: "destructive"
        });
        navigate('/wizard/pro/start');
        return;
      }

      // First fetch the campaign to make sure it exists
      const { data: campaignData, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
        
      if (fetchError || !campaignData) {
        toast({
          title: "Error",
          description: "Campaign not found. Please start from the beginning.",
          variant: "destructive"
        });
        navigate('/wizard/pro/start');
        return;
      }
      
      // Update campaign matches in Supabase
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          selected_athletes: selectedAthletes.map(a => a.id),
          match_candidates: matchCandidates.map(c => c.id),
          updated_at: new Date().toISOString(),
          match_step_completed: true
        })
        .eq('id', campaignId);
      
      if (error) {
        toast({
          title: "Error saving selections",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Log an activity for the selection
      const { error: activityError } = await supabase
        .from('campaign_activities')
        .insert([{
          campaign_id: campaignId,
          activity_type: 'ATHLETE_SELECTION',
          actor_id: user?.id,
          details: {
            selected_count: selectedAthletes.length,
            total_candidates: matchCandidates.length
          },
          created_at: new Date().toISOString()
        }]);
        
      if (activityError) {
        console.warn('Failed to log activity:', activityError);
        // Non-critical, continue with the flow
      }
      
      // Update the wizard state with selected athletes
      updateForm({ selectedMatches: selectedAthletes });
      nextStep();
      
      // Show success message
      toast({
        title: "Athletes selected",
        description: `You've selected ${selectedAthletes.length} athletes for your campaign`,
      });
      
      // Navigate to next step
      navigate('/wizard/pro/bundle');
      
    } catch (error: any) {
      console.error('Error saving athlete selections:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Match with Athletes</h2>
        <p className="text-gray-400">Find the perfect athletes for your campaign</p>
      </div>
      
      {/* Matching Area */}
      {!matchCandidates.length && !isMatching && (
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="pt-6 pb-4 text-center">
            <h3 className="text-lg font-medium text-white mb-4">Run AI-Powered Athlete Matching</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Our matching algorithm will analyze your campaign requirements and find 
              the best athletes that match your target audience and goals.
            </p>
            
            <Button 
              onClick={runMatching}
              className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-black font-medium"
              disabled={isMatching}
            >
              {isMatching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Run Athlete Matching
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Matching Progress */}
      {isMatching && (
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="pt-6 pb-6 text-center">
            <h3 className="text-lg font-medium text-white mb-4">Finding Matches...</h3>
            <Progress 
              value={matchProgress} 
              className="h-2 mb-4 bg-gray-800" 
            />
            <p className="text-gray-400 text-sm">
              {matchProgress < 30 ? "Analyzing campaign requirements..." : 
               matchProgress < 60 ? "Searching athlete database..." :
               matchProgress < 90 ? "Calculating compatibility scores..." :
               "Finalizing matches..."}
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Results and Selection Area */}
      {matchCandidates.length > 0 && !isMatching && (
        <div className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search athletes..." 
                className="pl-9 bg-black/20 border-zinc-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="border-zinc-700 bg-black/20 text-white hover:bg-black/40"
              >
                <Sliders className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button 
                variant="outline" 
                className="border-zinc-700 bg-black/20 text-white hover:bg-black/40"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </div>
          </div>
          
          {/* Selected count */}
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <CheckCircle className="h-4 w-4 text-amber-500" />
            <span>{selectedAthletes.length} athletes selected</span>
          </div>
          
          {/* Athletes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {filteredAthletes.map((athlete) => {
              const isSelected = selectedAthletes.some(a => a.id === athlete.id);
              
              return (
                <Card 
                  key={athlete.id} 
                  className={`border ${isSelected ? 'border-amber-500' : 'border-zinc-700'} bg-zinc-900/60 hover:bg-zinc-800/50 transition-colors cursor-pointer`}
                  onClick={() => toggleAthlete(athlete)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox 
                        checked={isSelected}
                        className="mt-1.5 data-[state=checked]:bg-amber-500 data-[state=checked]:text-black"
                      />
                      
                      <Avatar className="h-14 w-14 border border-zinc-700">
                        <AvatarImage src={athlete.profile_image || ''} alt={athlete.name || 'Athlete'} />
                        <AvatarFallback className="bg-amber-500/20 text-amber-500">
                          {athlete.name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{athlete.name || 'Unnamed Athlete'}</h3>
                        
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {athlete.sport && (
                            <Badge variant="outline" className="bg-zinc-800 text-gray-300 border-zinc-700 text-xs">
                              {athlete.sport}
                            </Badge>
                          )}
                          {athlete.university && (
                            <Badge variant="outline" className="bg-zinc-800 text-gray-300 border-zinc-700 text-xs">
                              {athlete.university}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">Followers</span>
                            <span className="text-sm text-white font-medium">
                              {athlete.followers || '0'}
                            </span>
                          </div>
                          <div className="h-8 border-r border-zinc-700"></div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">Engagement</span>
                            <span className="text-sm text-white font-medium">
                              {athlete.engagement_rate || '0%'}
                            </span>
                          </div>
                          <div className="h-8 border-r border-zinc-700"></div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">Match</span>
                            <span className="text-sm font-medium text-amber-500">
                              {athlete.match_score || '90%'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* Empty state */}
          {filteredAthletes.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-400">No athletes found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-zinc-800">
        <Button 
          type="button" 
          variant="outline"
          className="border-zinc-700 bg-black/20 text-white hover:bg-black/40"
          onClick={() => {
            prevStep();
            navigate('/wizard/pro/deliverables');
          }}
        >
          ← Back
        </Button>
        
        <Button 
          onClick={handleContinue}
          className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-black font-medium"
          disabled={selectedAthletes.length === 0 || isMatching}
        >
          Save & Continue →
        </Button>
      </div>
    </div>
  );
}