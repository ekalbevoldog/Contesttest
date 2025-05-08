'use client';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { useProWizard } from '@/contexts/ProWizardProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Loader2, CheckCircle, Calendar, FileText, DollarSign, Users, Tag, Settings, 
  Target, BarChart, User, LucideIcon, Mail, Check, Megaphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

interface SummaryItemProps {
  icon: LucideIcon;
  title: string;
  content: React.ReactNode;
  className?: string;
}

const SummaryItem = ({ icon: Icon, title, content, className }: SummaryItemProps) => (
  <div className={`flex gap-3 ${className || ''}`}>
    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-amber-500" />
    </div>
    <div>
      <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      <div className="text-white mt-1">{content}</div>
    </div>
  </div>
);

export default function Review() {
  const { campaignId, form, updateForm, prevStep, reset } = useProWizard();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { user } = useSupabaseAuth();
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Get bundle details
  const getBundleDetails = () => {
    if (form.selectedBundle) {
      return form.selectedBundle;
    }
    
    // Fallback based on bundleType
    const bundleType = form.bundleType || 'standard';
    
    if (bundleType === 'custom' && form.customBundle) {
      return form.customBundle;
    }
    
    // Default values by type
    switch (bundleType) {
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
        return {
          name: 'Standard Package',
          description: 'Our standard athlete partnership package with balanced deliverables',
          deliverables: '3 social media posts, 2 stories, 1 product showcase',
          compensation: '$500-$1,500 per athlete',
          timeline: '30 days from acceptance',
        };
    }
  };
  
  // Form submission handler for campaign launch
  const launchCampaign = async () => {
    // Validate campaign ID exists
    if (!campaignId) {
      toast({
        title: "Error",
        description: "Campaign ID not found. Please start from the beginning.",
        variant: "destructive"
      });
      navigate('/wizard/pro/start');
      return;
    }
    
    // Validate terms acceptance
    if (!acceptedTerms) {
      toast({
        title: "Please accept terms",
        description: "You must accept the terms and conditions to launch the campaign",
        variant: "destructive"
      });
      return;
    }
    
    // Set loading state
    setIsLoading(true);
    
    try {
      // Instead of multiple Supabase queries, use a single server endpoint 
      // that handles all operations in a transaction for consistency
      const response = await fetch('/api/campaigns/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          campaignId,
          bundleType: form.bundleType,
          selectedAthletes: form.selectedMatches || [],
          bundleDetails: form.selectedBundle || getBundleDetails(),
          launchDetails: {
            terms_accepted: true,
            terms_accepted_at: new Date().toISOString()
          }
        })
      });
      
      // Handle server response
      if (!response.ok) {
        // Try to get detailed error message
        let errorMessage = "Server error occurred";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || "Failed to launch campaign";
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        
        throw new Error(errorMessage);
      }
      
      // Success - show toast and navigate to dashboard
      toast({
        title: "Campaign Launched!",
        description: "Your campaign is now live and offers have been sent to athletes",
        variant: "default",
      });
      
      // Reset wizard state
      reset();
      
      // Navigate to dashboard
      navigate('/business/dashboard');
      
    } catch (error: any) {
      console.error('Campaign launch error:', error);
      
      toast({
        title: "Launch failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const bundleDetails = getBundleDetails();
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Review & Launch Campaign</h2>
        <p className="text-gray-400">Review your campaign details before sending offers to athletes</p>
      </div>
      
      {/* Campaign Summary */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Campaign Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-amber-500" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SummaryItem 
                icon={Settings} 
                title="Campaign Title" 
                content={form.title || "Pro Campaign"}
              />
              <SummaryItem 
                icon={Calendar} 
                title="Campaign Timeline" 
                content={
                  <div>
                    <div>Start: {formatDate(form.startDate || '')}</div>
                    <div>End: {formatDate(form.endDate || '')}</div>
                  </div>
                }
              />
              <SummaryItem 
                icon={FileText} 
                title="Objective" 
                content={form.objective || "Not specified"}
                className="md:col-span-2"
              />
            </div>
          </div>
          
          <Separator className="bg-zinc-700" />
          
          {/* Targeting */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" />
              Targeting
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SummaryItem 
                icon={Users} 
                title="Target Audience" 
                content={
                  <div>
                    <div>Age: {form.targetAudience?.ageRange?.[0] || 18} - {form.targetAudience?.ageRange?.[1] || 34}</div>
                    <div>Gender: {form.targetAudience?.gender || 'All'}</div>
                    {form.targetAudience?.interests?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {form.targetAudience.interests.map((interest: string) => (
                          <Badge key={interest} variant="outline" className="bg-zinc-800 text-gray-300 border-zinc-700 text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
              <SummaryItem 
                icon={BarChart} 
                title="Target Sports" 
                content={
                  <div className="flex flex-wrap gap-1">
                    {(form.targetSports || []).map((sport: string) => (
                      <Badge key={sport} variant="outline" className="bg-zinc-800 text-gray-300 border-zinc-700 text-xs">
                        {sport}
                      </Badge>
                    ))}
                    {(!form.targetSports || form.targetSports.length === 0) && 'Not specified'}
                  </div>
                }
              />
            </div>
          </div>
          
          <Separator className="bg-zinc-700" />
          
          {/* Deliverables */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              Deliverables
            </h3>
            
            <div>
              {(form.deliverables || []).length > 0 ? (
                <div className="space-y-2">
                  {(form.deliverables || []).map((deliverable: any, index: number) => (
                    <div key={index} className="bg-black/30 border border-zinc-700 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                          {deliverable.type}
                        </Badge>
                        {deliverable.platform && (
                          <Badge variant="outline" className="bg-zinc-800 text-gray-300 border-zinc-700">
                            {deliverable.platform}
                          </Badge>
                        )}
                        <span className="text-gray-300 text-sm">x{deliverable.quantity}</span>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">{deliverable.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No specific deliverables defined</p>
              )}
              
              {form.hashtagRequirements?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-white mb-2">Required Hashtags</h4>
                  <div className="flex flex-wrap gap-1">
                    {form.hashtagRequirements.map((tag: string, index: number) => (
                      <Badge
                        key={index}
                        className="bg-amber-500/20 text-amber-400 border-amber-500/30 flex items-center gap-1"
                      >
                        <Tag className="h-3 w-3" />
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Separator className="bg-zinc-700" />
          
          {/* Bundle */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-500" />
              Partnership Bundle
            </h3>
            <div className="bg-black/30 border border-zinc-700 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-white font-semibold">{bundleDetails.name || 'Partnership Bundle'}</h4>
                <Badge variant="outline" className="bg-zinc-800 text-gray-300 border-zinc-700">
                  {form.bundleType || 'standard'}
                </Badge>
              </div>
              
              <p className="text-gray-400 mb-4">{bundleDetails.description || 'No description provided'}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-gray-300">Deliverables</h5>
                  <p className="text-white text-sm">{bundleDetails.deliverables || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-gray-300">Compensation</h5>
                  <p className="text-white text-sm">{bundleDetails.compensation || form.budget || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-gray-300">Timeline</h5>
                  <p className="text-white text-sm">{bundleDetails.timeline || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <Separator className="bg-zinc-700" />
          
          {/* Selected Athletes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-amber-500" />
              Selected Athletes
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(form.selectedMatches || []).map((athlete: any) => (
                <div key={athlete.id} className="bg-black/30 border border-zinc-700 rounded-md p-3 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-zinc-700">
                    <AvatarImage src={athlete.profile_image || ''} alt={athlete.name} />
                    <AvatarFallback className="bg-amber-500/20 text-amber-500">
                      {athlete.name?.split(' ').map((n: string) => n[0]).join('') || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-white font-medium">{athlete.name || 'Unnamed Athlete'}</h4>
                    <div className="flex gap-2 mt-1">
                      {athlete.sport && (
                        <Badge variant="outline" className="bg-zinc-800 text-gray-300 border-zinc-700 text-xs">
                          {athlete.sport}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(!form.selectedMatches || form.selectedMatches.length === 0) && (
                <div className="md:col-span-2 lg:col-span-3 text-center p-4 text-gray-400">
                  No athletes selected
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* FAQ Accordion */}
      <Accordion type="single" collapsible className="bg-zinc-900/60 border border-zinc-800 rounded-lg">
        <AccordionItem value="item-1" className="border-b-0">
          <AccordionTrigger className="px-4 py-4 hover:bg-black/20 text-white">
            What happens after I launch the campaign?
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-gray-300">
            After launching, offers will be sent to all selected athletes. You'll be able to track the status of each offer in your dashboard. 
            Once athletes accept, they'll be able to see the campaign details and deliverables in their dashboards.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="border-b-0">
          <AccordionTrigger className="px-4 py-4 hover:bg-black/20 text-white">
            Can I edit the campaign after launching?
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-gray-300">
            Limited edits are possible after launching. You can update certain campaign details, but you cannot change the bundle or compensation once offers have been sent.
            If you need to make major changes, you may need to create a new campaign.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3" className="border-b-0">
          <AccordionTrigger className="px-4 py-4 hover:bg-black/20 text-white">
            How is payment handled?
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-gray-300">
            Payment is processed securely through our platform. Funds will be held in escrow until athletes complete their deliverables. 
            You'll be able to review and approve content before payment is released.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Terms and Conditions */}
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="terms" 
          checked={acceptedTerms}
          onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
          className="mt-1 data-[state=checked]:bg-amber-500 data-[state=checked]:text-black"
        />
        <div className="space-y-1">
          <Label htmlFor="terms" className="text-white cursor-pointer">
            I agree to the Terms and Conditions
          </Label>
          <p className="text-gray-400 text-sm">
            By checking this box, you confirm that you've reviewed all campaign details and agree to the platform's terms of service.
            You understand that offers will be sent to selected athletes and your account will be charged for the campaign budget upon acceptance.
          </p>
        </div>
      </div>
      
      {/* Business Info */}
      <Card className="bg-zinc-900/60 border border-zinc-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border border-zinc-700">
              <AvatarImage src="" alt={user?.email || 'Business'} />
              <AvatarFallback className="bg-amber-500/20 text-amber-500">
                {user?.email?.substring(0, 2).toUpperCase() || 'BP'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-white font-medium">{user?.email || 'Business Account'}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300 text-sm">{user?.email || 'No email provided'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Terms and Conditions Agreement */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3 space-y-0">
            <Checkbox 
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="data-[state=checked]:bg-amber-500 data-[state=checked]:text-black mt-0.5"
            />
            <div className="space-y-1">
              <Label 
                htmlFor="terms" 
                className="text-white font-medium cursor-pointer"
              >
                I agree to the Terms and Conditions
              </Label>
              <p className="text-gray-400 text-sm">
                By checking this box, I acknowledge that I have read and agree to the Campaign Terms, 
                Athletes Rights Agreement, and Content Licensing Terms. I understand that this will 
                initiate partnership offers to the selected athletes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-zinc-800">
        <Button 
          type="button" 
          variant="outline"
          className="border-zinc-700 bg-black/20 text-white hover:bg-black/40"
          onClick={() => {
            prevStep();
            navigate('/wizard/pro/bundle');
          }}
          disabled={isLoading}
        >
          ← Back
        </Button>
        
        <Button 
          onClick={launchCampaign}
          className="bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-black font-medium"
          disabled={isLoading || !acceptedTerms}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Launching...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Launch Campaign & Send Offers
            </>
          )}
        </Button>
      </div>
    </div>
  );
}