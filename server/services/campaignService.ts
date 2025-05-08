/** 05/08/2025 - 1456 CST
 * Campaign Service
 * 
 * Handles campaign creation, updating, and retrieval.
 * Provides methods for managing campaign operations.
 */

import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { wsHelpers } from './websocketService';

// Interface for campaign data
interface Campaign {
  id: string;
  business_id: string;
  title: string;
  description: string;
  status: string;
  deliverables: any[];
  budget?: string;
  budget_min?: number;
  budget_max?: number;
  start_date?: string;
  end_date?: string;
  target_audience?: any;
  target_sports?: string[];
  created_at?: string;
  updated_at?: string;
}

// Interface for campaign creation
interface CampaignInput {
  title: string;
  description: string;
  deliverables: any[];
  budget?: string;
  budget_min?: number;
  budget_max?: number;
  start_date?: string;
  end_date?: string;
  target_audience?: any;
  target_sports?: string[];
  [key: string]: any;
}

// Interface for campaign result
interface CampaignResult {
  success: boolean;
  campaign?: Campaign;
  error?: string;
  message?: string;
}

// Campaign launch specific interface
interface LaunchCampaignInput {
  campaignId: string;
  bundleType?: string;
  selectedAthletes?: any[];
  bundleDetails?: any;
  launchDetails?: any;
}

// Main campaign service class
class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(businessId: string, campaignData: CampaignInput): Promise<CampaignResult> {
    try {
      // Validate input
      if (!businessId) {
        return { 
          success: false, 
          error: 'Business ID is required' 
        };
      }

      if (!campaignData.title || !campaignData.description) {
        return { 
          success: false, 
          error: 'Title and description are required' 
        };
      }

      // Prepare campaign data
      const campaign = {
        business_id: businessId,
        title: campaignData.title,
        description: campaignData.description,
        status: 'draft',
        deliverables: campaignData.deliverables || [],
        budget: campaignData.budget,
        budget_min: campaignData.budget_min,
        budget_max: campaignData.budget_max,
        start_date: campaignData.start_date,
        end_date: campaignData.end_date,
        target_audience: campaignData.target_audience,
        target_sports: campaignData.target_sports,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Add any other fields from campaignData
        ...Object.fromEntries(
          Object.entries(campaignData)
            .filter(([key]) => !['title', 'description', 'deliverables', 'budget', 
                               'budget_min', 'budget_max', 'start_date', 'end_date', 
                               'target_audience', 'target_sports'].includes(key))
        )
      };

      // Insert campaign into database
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to create campaign' 
        };
      }

      // Create campaign stats record
      await supabase
        .from('campaign_stats')
        .insert({
          campaign_id: data.id,
          athlete_count: 0,
          view_count: 0,
          created_at: new Date().toISOString()
        });

      return {
        success: true,
        campaign: data,
        message: 'Campaign created successfully'
      };
    } catch (error: any) {
      console.error('Campaign creation exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create campaign' 
      };
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string): Promise<CampaignResult> {
    try {
      // Validate input
      if (!campaignId) {
        return { 
          success: false, 
          error: 'Campaign ID is required' 
        };
      }

      // Get campaign from database
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          business:business_id (
            id,
            name,
            profile_image
          ),
          stats:campaign_stats (*)
        `)
        .eq('id', campaignId)
        .single();

      if (error) {
        console.error('Error getting campaign:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to get campaign' 
        };
      }

      // Increment view count
      await this.incrementCampaignViewCount(campaignId);

      return {
        success: true,
        campaign: data
      };
    } catch (error: any) {
      console.error('Get campaign exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get campaign' 
      };
    }
  }

  /**
   * Get campaigns for a business
   */
  async getBusinessCampaigns(businessId: string, filters?: any): Promise<any> {
    try {
      // Validate input
      if (!businessId) {
        return { 
          success: false, 
          error: 'Business ID is required' 
        };
      }

      // Start building query
      let query = supabase
        .from('campaigns')
        .select(`
          *,
          stats:campaign_stats (*)
        `)
        .eq('business_id', businessId);

      // Apply filters if provided
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.dateRange) {
          if (filters.dateRange.start) {
            query = query.gte('created_at', filters.dateRange.start);
          }
          if (filters.dateRange.end) {
            query = query.lte('created_at', filters.dateRange.end);
          }
        }
      }

      // Execute query
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting business campaigns:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to get campaigns' 
        };
      }

      return {
        success: true,
        campaigns: data || []
      };
    } catch (error: any) {
      console.error('Get business campaigns exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get campaigns' 
      };
    }
  }

  /**
   * Update a campaign
   */
  async updateCampaign(campaignId: string, campaignData: Partial<CampaignInput>): Promise<CampaignResult> {
    try {
      // Validate input
      if (!campaignId) {
        return { 
          success: false, 
          error: 'Campaign ID is required' 
        };
      }

      // Prepare update data
      const updateData = {
        ...campaignData,
        updated_at: new Date().toISOString()
      };

      // Update campaign in database
      const { data, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .select()
        .single();

      if (error) {
        console.error('Error updating campaign:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to update campaign' 
        };
      }

      return {
        success: true,
        campaign: data,
        message: 'Campaign updated successfully'
      };
    } catch (error: any) {
      console.error('Update campaign exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update campaign' 
      };
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<CampaignResult> {
    try {
      // Validate input
      if (!campaignId) {
        return { 
          success: false, 
          error: 'Campaign ID is required' 
        };
      }

      // Check if campaign is already launched
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('status')
        .eq('id', campaignId)
        .single();

      if (campaignData?.status === 'active') {
        return { 
          success: false, 
          error: 'Cannot delete an active campaign' 
        };
      }

      // Delete campaign from database
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        console.error('Error deleting campaign:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to delete campaign' 
        };
      }

      return {
        success: true,
        message: 'Campaign deleted successfully'
      };
    } catch (error: any) {
      console.error('Delete campaign exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete campaign' 
      };
    }
  }

  /**
   * Launch a campaign
   */
  async launchCampaign(userId: string, launchData: LaunchCampaignInput): Promise<CampaignResult> {
    try {
      const { campaignId, bundleType, selectedAthletes, bundleDetails, launchDetails } = launchData;

      // Validate input
      if (!campaignId) {
        return { 
          success: false, 
          error: 'Campaign ID is required' 
        };
      }

      // Verify the campaign exists and belongs to the user's business
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*, business:business_id (*)')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        return { 
          success: false, 
          error: 'Campaign not found' 
        };
      }

      if (campaign.business_id !== userId && campaign.created_by !== userId) {
        return { 
          success: false, 
          error: 'You do not have permission to launch this campaign' 
        };
      }

      // Check if campaign is already launched
      if (campaign.status === 'active') {
        return { 
          success: false, 
          error: 'Campaign is already launched' 
        };
      }

      // Update campaign status
      const { data: updatedCampaign, error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'active',
          launched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          terms_accepted: true,
          terms_accepted_at: launchDetails?.terms_accepted_at || new Date().toISOString(),
          terms_accepted_by: userId,
          bundle_type: bundleType || 'standard',
          bundle_details: bundleDetails || {}
        })
        .eq('id', campaignId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating campaign status:', updateError);
        return { 
          success: false, 
          error: updateError.message || 'Failed to update campaign status' 
        };
      }

      // Log campaign launch activity
      await supabase
        .from('campaign_activities')
        .insert({
          campaign_id: campaignId,
          activity_type: 'LAUNCH',
          actor_id: userId,
          details: {
            bundle_type: bundleType,
            athlete_count: selectedAthletes?.length || 0
          },
          created_at: new Date().toISOString()
        });

      // Create offer records for selected athletes
      if (selectedAthletes && selectedAthletes.length > 0) {
        const offers = selectedAthletes.map(athlete => ({
          campaign_id: campaignId,
          athlete_id: athlete.id,
          status: 'pending',
          bundle_type: bundleType || 'standard',
          compensation: bundleDetails?.compensation || 'Not specified',
          created_at: new Date().toISOString(),
          created_by: userId
        }));

        const { error: offersError } = await supabase
          .from('offers')
          .insert(offers);

        if (offersError) {
          console.error('Error creating offers:', offersError);
          // Continue despite error
        }

        // Send notifications to athletes
        for (const athlete of selectedAthletes) {
          await supabase
            .from('notifications')
            .insert({
              user_id: athlete.user_id || athlete.id,
              type: 'NEW_OFFER',
              title: 'New Campaign Offer',
              content: `You have received a new offer for "${campaign.title}"`,
              reference_type: 'CAMPAIGN',
              reference_id: campaignId,
              is_read: false,
              created_at: new Date().toISOString()
            });

          // Try to send WebSocket notification if available
          if (wsHelpers.broadcastToChannel) {
            wsHelpers.broadcastToChannel(`user:${athlete.user_id || athlete.id}`, {
              type: 'notification',
              notification: {
                type: 'NEW_OFFER',
                title: 'New Campaign Offer',
                content: `You have received a new offer for "${campaign.title}"`,
                campaignId
              }
            });
          }
        }
      }

      // Update campaign stats
      await supabase
        .from('campaign_stats')
        .upsert({
          campaign_id: campaignId,
          athlete_count: selectedAthletes?.length || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'campaign_id' });

      return {
        success: true,
        campaign: updatedCampaign,
        message: 'Campaign launched successfully'
      };
    } catch (error: any) {
      console.error('Launch campaign exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to launch campaign' 
      };
    }
  }

  /**
   * Get campaign matching suggestions
   */
  async getCampaignMatches(campaignId: string, limit = 20): Promise<any> {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) {
        return { 
          success: false, 
          error: 'Campaign not found' 
        };
      }

      // Get existing match scores
      const { data: existingMatches, error: matchError } = await supabase
        .from('match_scores')
        .select('athlete_id, score')
        .eq('campaign_id', campaignId);

      // Create a map of existing matches for quick lookup
      const matchMap = new Map();
      if (!matchError && existingMatches) {
        existingMatches.forEach(match => {
          matchMap.set(match.athlete_id, match.score);
        });
      }

      // Find potential athlete matches based on campaign criteria
      let query = supabase
        .from('athlete_profiles')
        .select(`
          *,
          social_accounts:athlete_social_accounts(*)
        `);

      // Apply filters based on campaign targeting
      if (campaign.target_sports && campaign.target_sports.length > 0) {
        query = query.in('sport', campaign.target_sports);
      }

      if (campaign.target_divisions && campaign.target_divisions.length > 0) {
        query = query.in('division', campaign.target_divisions);
      }

      // Add follower count constraint if specified
      if (campaign.target_follower_counts?.min) {
        query = query.gte('follower_count', campaign.target_follower_counts.min);
      }

      if (campaign.target_follower_counts?.max) {
        query = query.lte('follower_count', campaign.target_follower_counts.max);
      }

      // Execute query with limit
      const { data: athletes, error: athleteError } = await query.limit(limit);

      if (athleteError) {
        console.error('Error finding athlete matches:', athleteError);
        return { 
          success: false, 
          error: 'Failed to find athlete matches' 
        };
      }

      // Calculate match scores for each athlete
      const matches = athletes.map(athlete => {
        // Use existing score if available, otherwise calculate
        const score = matchMap.has(athlete.id) 
          ? matchMap.get(athlete.id) 
          : this.calculateMatchScore(campaign, athlete);

        return {
          athlete,
          score,
          campaign_id: campaignId,
          existing: matchMap.has(athlete.id)
        };
      });

      // Sort by score (highest first)
      matches.sort((a, b) => b.score - a.score);

      return {
        success: true,
        matches,
        campaign
      };
    } catch (error: any) {
      console.error('Get campaign matches exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get campaign matches' 
      };
    }
  }

  /**
   * Save match score
   */
  async saveMatchScore(campaignId: string, athleteId: string, score: number, businessId: string): Promise<any> {
    try {
      // Check if match already exists
      const { data: existingMatch, error: matchError } = await supabase
        .from('match_scores')
        .select('id, score')
        .eq('campaign_id', campaignId)
        .eq('athlete_id', athleteId)
        .maybeSingle();

      if (existingMatch) {
        // Update existing match
        const { data, error } = await supabase
          .from('match_scores')
          .update({
            score,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMatch.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating match score:', error);
          return { 
            success: false, 
            error: 'Failed to update match score' 
          };
        }

        return {
          success: true,
          match: data,
          message: 'Match score updated'
        };
      } else {
        // Create new match
        const { data, error } = await supabase
          .from('match_scores')
          .insert({
            campaign_id: campaignId,
            athlete_id: athleteId,
            business_id: businessId,
            score,
            status: 'pending',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating match score:', error);
          return { 
            success: false, 
            error: 'Failed to create match score' 
          };
        }

        return {
          success: true,
          match: data,
          message: 'Match score created'
        };
      }
    } catch (error: any) {
      console.error('Save match score exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to save match score' 
      };
    }
  }

  /**
   * Calculate a match score between campaign and athlete
   * This is a simplified version - a real implementation would be more complex
   */
  private calculateMatchScore(campaign: any, athlete: any): number {
    let score = 0.5; // Start with neutral score

    // Sport match (high importance)
    if (campaign.target_sports && campaign.target_sports.includes(athlete.sport)) {
      score += 0.2;
    }

    // Division match (medium importance)
    if (campaign.target_divisions && campaign.target_divisions.includes(athlete.division)) {
      score += 0.1;
    }

    // Follower count optimization (sliding scale)
    if (campaign.target_follower_counts?.ideal && athlete.follower_count) {
      const ideal = campaign.target_follower_counts.ideal;
      const actual = athlete.follower_count;

      // Score inversely proportional to distance from ideal
      const distance = Math.abs(actual - ideal) / ideal;
      const followerScore = Math.max(0, 0.15 * (1 - distance));
      score += followerScore;
    }

    // Engagement rate bonus
    if (athlete.average_engagement_rate && athlete.average_engagement_rate > 0.05) {
      score += 0.1;
    }

    // Cap score at 0.95 (not 1.0, to leave room for manual adjustments)
    return Math.min(0.95, score);
  }

  /**
   * Increment campaign view count
   */
  private async incrementCampaignViewCount(campaignId: string): Promise<void> {
    try {
      // Get current stats
      const { data: currentStats } = await supabase
        .from('campaign_stats')
        .select('view_count')
        .eq('campaign_id', campaignId)
        .maybeSingle();

      const currentViews = currentStats?.view_count || 0;

      // Update view count
      await supabase
        .from('campaign_stats')
        .upsert({
          campaign_id: campaignId,
          view_count: currentViews + 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'campaign_id' });
    } catch (error) {
      console.error('Error incrementing view count:', error);
      // Fail silently - this is a non-critical operation
    }
  }
}

// Export singleton instance
export const campaignService = new CampaignService();
export default campaignService;