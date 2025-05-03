'use client';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { useProWizard } from '@/contexts/ProWizardProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, ShieldCheck, Users, Calendar, FileText, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function Bundle() {
  const { campaignId, form, updateForm, nextStep, prevStep } = useProWizard();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [bundleType, setBundleType] = useState<string>(form.bundleType || 'standard');
  const [customBundle, setCustomBundle] = useState<any>(form.customBundle || {
    name: '',
    description: '',
    deliverables: '',
    compensation: '',
    timeline: '',
  });
  const [selectedAthletes] = useState<any[]>(form.selectedMatches || []);
  
  // Form validation function
  const validateCustomBundle = () => {
    if (bundleType !== 'custom') return true;
    
    // Required fields for custom bundle
    if (!customBundle.name) {
      toast({
        title: "Missing bundle name",
        description: "Please provide a name for your custom bundle",
        variant: "destructive"
      });
      return false;
    }
    
    if (!customBundle.deliverables) {
      toast({
        title: "Missing deliverables",
        description: "Please specify the content deliverables for your bundle",
        variant: "destructive"
      });
      return false;
    }
    
    if (!customBundle.compensation) {
      toast({
        title: "Missing compensation",
        description: "Please specify the compensation terms for athletes",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // Create bundle with enhanced validation and error handling
  const createBundle = async () => {
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
    
    // Validate athlete selection
    if (selectedAthletes.length === 0) {
      toast({
        title: "No athletes selected",
        description: "Please go back and select athletes for your campaign",
        variant: "destructive"
      });
      return;
    }
    
    // Validate custom bundle fields if applicable
    if (!validateCustomBundle()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare bundle data with campaign and athlete info
      const bundleData = {
        campaign_id: campaignId,
        type: bundleType,
        custom_details: bundleType === 'custom' ? customBundle : null,
        athlete_ids: selectedAthletes.map(a => a.id),
        created_at: new Date().toISOString(),
        status: 'DRAFT'
      };
      
      // First, save bundle to Supabase directly
      const { data: bundleRecord, error: bundleError } = await supabase
        .from('bundles')
        .insert([{
          campaign_id: campaignId,
          type: bundleType,
          details: bundleType === 'custom' ? customBundle : getPresetBundleDetails(bundleType),
          created_at: new Date().toISOString(),
          status: 'DRAFT'
        }])
        .select()
        .single();
      
      if (bundleError) {
        console.error('Supabase bundle creation error:', bundleError);
        throw new Error('Failed to create bundle in database');
      }
      
      // Then try calling API to register bundle members
      try {
        const response = await fetch('/api/bundle/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bundle_id: bundleRecord.id,
            athlete_ids: selectedAthletes.map(a => a.id),
          }),
        });
        
        if (!response.ok) {
          console.warn('API bundle creation warning - will continue anyway');
        }
      } catch (apiError) {
        console.warn('API bundle creation error - will continue anyway:', apiError);
        // Non-critical, continue with the flow
      }
      
      // Update campaign in Supabase with bundle reference
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ 
          bundle_id: bundleRecord.id,
          bundle_type: bundleType,
          bundle_details: bundleType === 'custom' ? customBundle : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);
      
      if (campaignError) {
        console.error('Campaign update error:', campaignError);
        toast({
          title: "Warning",
          description: "Bundle created but campaign update failed"
        });
        // Continue anyway - we have the bundle ID
      }
      
      // Update the wizard state with bundle data
      updateForm({ 
        bundleType, 
        customBundle: bundleType === 'custom' ? customBundle : null,
        selectedBundle: {
          id: bundleRecord.id,
          type: bundleType,
          ...getPresetBundleDetails(bundleType),
          ...(bundleType === 'custom' ? customBundle : {})
        },
      });
      
      toast({
        title: "Bundle created",
        description: `Created a ${bundleType} bundle for ${selectedAthletes.length} athletes`,
      });
      
      nextStep();
      navigate('/wizard/pro/review');
      
    } catch (error: any) {
      console.error('Bundle creation error:', error);
      toast({
        title: "Bundle creation error",
        description: error.message || "Failed to create bundle",
        variant: "destructive"
      });
      
      // Allow retry
      setIsLoading(false);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Get preset bundle details based on type
  const getPresetBundleDetails = (type: string) => {
    switch (type) {
      case 'standard':
        return {
          name: 'Standard Package',
          description: 'Our standard athlete partnership package with balanced deliverables',
          deliverables: '3 social media posts, 2 stories, 1 product showcase',
          compensation: '$500-$1,500 per athlete',
          timeline: '30 days from acceptance',
        };
      case 'premium':
        return {
          name: 'Premium Package',
          description: 'Enhanced partnership package with premium content deliverables',
          deliverables: '5 social media posts, 4 stories, 2 video content pieces, 1 event appearance',
          compensation: '$1,500-$3,000 per athlete',
          timeline: '45 days from acceptance',
        };
      case 'basic':
        return {
          name: 'Basic Package',
          description: 'Simple partnership package for quick campaigns',
          deliverables: '2 social media posts, 1 story',
          compensation: '$200-$500 per athlete',
          timeline: '15 days from acceptance',
        };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Create Partnership Bundle</h2>
        <p className="text-gray-400">Define how you'll work with your selected athletes</p>
      </div>
      
      {/* Bundle Type Selection */}
      <div className="space-y-4">
        <Label className="text-white text-lg">Select Bundle Type</Label>
        <RadioGroup 
          value={bundleType} 
          onValueChange={setBundleType}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="col-span-1">
            <div className={`border rounded-lg p-4 h-full ${bundleType === 'standard' ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 bg-black/20'}`}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="standard" id="standard" className="mt-1 data-[state=checked]:bg-amber-500 data-[state=checked]:text-black" />
                <div className="space-y-2">
                  <Label htmlFor="standard" className="text-white font-medium">Standard Package</Label>
                  <p className="text-gray-400 text-sm">
                    Balanced partnership with essential content deliverables
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-gray-300">3 posts, 2 stories</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-gray-300">$500-$1.5K per athlete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-gray-300">30 day timeline</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-1">
            <div className={`border rounded-lg p-4 h-full ${bundleType === 'premium' ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 bg-black/20'}`}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="premium" id="premium" className="mt-1 data-[state=checked]:bg-amber-500 data-[state=checked]:text-black" />
                <div className="space-y-2">
                  <Label htmlFor="premium" className="text-white font-medium">Premium Package</Label>
                  <p className="text-gray-400 text-sm">
                    Enhanced partnership with premium content and appearances
                  </p>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-gray-300">5 posts, 4 stories, 2 videos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-gray-300">$1.5K-$3K per athlete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-gray-300">45 day timeline</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-1">
            <div className={`border rounded-lg p-4 h-full ${bundleType === 'custom' ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 bg-black/20'}`}>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="custom" id="custom" className="mt-1 data-[state=checked]:bg-amber-500 data-[state=checked]:text-black" />
                <div className="space-y-2">
                  <Label htmlFor="custom" className="text-white font-medium">Custom Package</Label>
                  <p className="text-gray-400 text-sm">
                    Create your own custom partnership bundle
                  </p>
                </div>
              </div>
            </div>
          </div>
        </RadioGroup>
      </div>
      
      {/* Custom Bundle Form */}
      {bundleType === 'custom' && (
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Custom Bundle Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Bundle Name</Label>
              <Input 
                id="name" 
                value={customBundle.name} 
                onChange={(e) => setCustomBundle({...customBundle, name: e.target.value})}
                placeholder="E.g., Summer Collection Partnership" 
                className="bg-black/20 border-zinc-700" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Textarea 
                id="description" 
                value={customBundle.description} 
                onChange={(e) => setCustomBundle({...customBundle, description: e.target.value})}
                placeholder="Describe your custom partnership bundle..." 
                className="bg-black/20 border-zinc-700 resize-none h-20" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deliverables" className="text-gray-300">Deliverables</Label>
              <Textarea 
                id="deliverables" 
                value={customBundle.deliverables} 
                onChange={(e) => setCustomBundle({...customBundle, deliverables: e.target.value})}
                placeholder="List the content deliverables expected from athletes..." 
                className="bg-black/20 border-zinc-700 resize-none h-20" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="compensation" className="text-gray-300">Compensation</Label>
              <Input 
                id="compensation" 
                value={customBundle.compensation} 
                onChange={(e) => setCustomBundle({...customBundle, compensation: e.target.value})}
                placeholder="E.g., $1,000-$2,000 per athlete based on follower count" 
                className="bg-black/20 border-zinc-700" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeline" className="text-gray-300">Timeline</Label>
              <Input 
                id="timeline" 
                value={customBundle.timeline} 
                onChange={(e) => setCustomBundle({...customBundle, timeline: e.target.value})}
                placeholder="E.g., 30 days from offer acceptance" 
                className="bg-black/20 border-zinc-700" 
              />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Selected Athletes Summary */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Selected Athletes</CardTitle>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              {selectedAthletes.length} Selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {selectedAthletes.map((athlete) => (
              <div key={athlete.id} className="flex items-center gap-2 bg-black/30 rounded-full pl-1 pr-3 py-1 border border-zinc-700">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={athlete.profile_image || ''} alt={athlete.name} />
                  <AvatarFallback className="text-xs bg-amber-500/20 text-amber-500">
                    {athlete.name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-300">{athlete.name}</span>
              </div>
            ))}
            
            {selectedAthletes.length === 0 && (
              <p className="text-gray-400 text-sm">No athletes selected. Go back to select athletes.</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Success Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-white font-medium">Unified Terms</h3>
              <p className="text-gray-400 text-sm">All athletes get the same offer</p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-white font-medium">Compliance Ready</h3>
              <p className="text-gray-400 text-sm">Terms vetted for regulations</p>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-white font-medium">Batch Processing</h3>
              <p className="text-gray-400 text-sm">Send offers to all at once</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-zinc-800">
        <Button 
          type="button" 
          variant="outline"
          className="border-zinc-700 bg-black/20 text-white hover:bg-black/40"
          onClick={() => {
            prevStep();
            navigate('/wizard/pro/match');
          }}
        >
          ← Back
        </Button>
        
        <Button 
          onClick={createBundle}
          className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-black font-medium"
          disabled={isLoading || (bundleType === 'custom' && !customBundle.name)}
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Bundle & Continue →
        </Button>
      </div>
    </div>
  );
}