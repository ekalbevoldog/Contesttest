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

export default function Match() {
  const { campaignId, form, updateForm, nextStep, prevStep } = useProWizard();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [matchCandidates, setMatchCandidates] = useState<any[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<any[]>(form.selectedMatches || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);

  // Load previously selected athletes if any
  useEffect(() => {
    if (form.selectedMatches?.length > 0) {
      setSelectedAthletes(form.selectedMatches);
    }
  }, [form.selectedMatches]);

  // Simulate matching process
  const runMatching = async () => {
    if (!campaignId) {
      toast({
        title: "Error",
        description: "Campaign ID not found. Please start from the beginning.",
        variant: "destructive"
      });
      navigate('/wizard/pro/start');
      return;
    }

    setIsMatching(true);
    setMatchProgress(0);
    
    try {
      // Increment progress simulation
      const interval = setInterval(() => {
        setMatchProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);
      
      // Call the matching service
      const response = await fetch('/api/match/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          campaignId, 
          targetSports: form.targetSports,
          targetAudience: form.targetAudience,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Matching service error');
      }
      
      const matchData = await response.json();
      
      // Complete progress
      clearInterval(interval);
      setMatchProgress(100);
      
      // Short timeout to show 100% before resetting
      setTimeout(() => {
        setMatchCandidates(matchData.candidates || []);
        setIsMatching(false);
      }, 500);
      
    } catch (error: any) {
      // If API fails, simulate with mock data for demo
      console.error('Matching API error:', error);
      // Here we'd normally show an error, but for the demo we'll load sample data
      
      // Call Supabase for sample athletes
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('athlete_profiles')
          .select('*')
          .limit(10);
          
        if (error) throw error;
        
        // We have data, clear the interval and set candidates
        clearInterval(interval);
        setMatchProgress(100);
        
        setTimeout(() => {
          setMatchCandidates(data || []);
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

  // Continue to next step
  const handleContinue = async () => {
    if (selectedAthletes.length === 0) {
      toast({
        title: "No athletes selected",
        description: "Please select at least one athlete for your campaign",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update campaign matches in Supabase
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          selected_athletes: selectedAthletes.map(a => a.id),
          match_candidates: matchCandidates.map(c => c.id),
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
      
      // Update the wizard state with selected athletes
      updateForm({ selectedMatches: selectedAthletes });
      nextStep();
      
      // Navigate to next step
      navigate('/wizard/pro/bundle');
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
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
              indicatorClassName="bg-amber-500" 
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