/** 050825 1621CST
 * Campaign Controller
 * 
 * Handles HTTP requests related to campaigns.
 * Connects route handlers to the campaign service.
 */

import { Request, Response } from 'express';
import { campaignService } from '../services/campaignService';
import { AppError } from '../lib/error';

class CampaignController {
  /**
   * Get all campaigns for the current business user
   */
  async getBusinessCampaigns(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Extract query parameters for filtering
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const filters: any = {};
      if (status) filters.status = status;
      if (startDate || endDate) {
        filters.dateRange = {};
        if (startDate) filters.dateRange.start = startDate;
        if (endDate) filters.dateRange.end = endDate;
      }

      const result = await campaignService.getBusinessCampaigns(userId, filters);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to get campaigns' });
      }

      return res.status(200).json({
        campaigns: result.campaigns,
        count: result.campaigns.length
      });
    } catch (error: any) {
      console.error('Get business campaigns error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving campaigns' });
    }
  }

  /**
   * Get a specific campaign by ID
   */
  async getCampaign(req: Request, res: Response) {
    try {
      const campaignId = req.params.id;

      if (!campaignId) {
        return res.status(400).json({ error: 'Campaign ID is required' });
      }

      const result = await campaignService.getCampaign(campaignId);

      if (!result.success) {
        return res.status(404).json({ error: result.error || 'Campaign not found' });
      }

      // Check permissions - only business owner, compliance officers, or admin can see campaigns
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const campaign = result.campaign;

      const hasAccess = 
        userRole === 'admin' || 
        userRole === 'compliance' || 
        campaign.business_id === userId || 
        campaign.created_by === userId;

      if (!hasAccess) {
        return res.status(403).json({ error: 'You do not have permission to view this campaign' });
      }

      return res.status(200).json({
        campaign: result.campaign
      });
    } catch (error: any) {
      console.error('Get campaign error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving campaign' });
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const campaignData = req.body;

      // Additional validation
      if (!campaignData.title || !campaignData.description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }

      const result = await campaignService.createCampaign(userId, campaignData);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to create campaign' });
      }

      return res.status(201).json({
        message: result.message || 'Campaign created successfully',
        campaign: result.campaign
      });
    } catch (error: any) {
      console.error('Create campaign error:', error);
      return res.status(500).json({ error: error.message || 'Error creating campaign' });
    }
  }

  /**
   * Update a campaign
   */
  async updateCampaign(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const campaignId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!campaignId) {
        return res.status(400).json({ error: 'Campaign ID is required' });
      }

      // First get the campaign to check ownership
      const checkResult = await campaignService.getCampaign(campaignId);

      if (!checkResult.success) {
        return res.status(404).json({ error: checkResult.error || 'Campaign not found' });
      }

      const campaign = checkResult.campaign;

      // Check ownership
      if (campaign.business_id !== userId && campaign.created_by !== userId) {
        return res.status(403).json({ error: 'You do not have permission to update this campaign' });
      }

      // Don't allow status change through this endpoint
      if (req.body.status && req.body.status !== campaign.status) {
        delete req.body.status;
      }

      const updateResult = await campaignService.updateCampaign(campaignId, req.body);

      if (!updateResult.success) {
        return res.status(400).json({ error: updateResult.error || 'Failed to update campaign' });
      }

      return res.status(200).json({
        message: updateResult.message || 'Campaign updated successfully',
        campaign: updateResult.campaign
      });
    } catch (error: any) {
      console.error('Update campaign error:', error);
      return res.status(500).json({ error: error.message || 'Error updating campaign' });
    }
  }

  /**
   * Delete a campaign (draft only)
   */
  async deleteCampaign(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const campaignId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!campaignId) {
        return res.status(400).json({ error: 'Campaign ID is required' });
      }

      // First get the campaign to check ownership
      const checkResult = await campaignService.getCampaign(campaignId);

      if (!checkResult.success) {
        return res.status(404).json({ error: checkResult.error || 'Campaign not found' });
      }

      const campaign = checkResult.campaign;

      // Check ownership
      if (campaign.business_id !== userId && campaign.created_by !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this campaign' });
      }

      // Only allow deleting draft campaigns
      if (campaign.status !== 'draft') {
        return res.status(400).json({ error: 'Only draft campaigns can be deleted' });
      }

      const deleteResult = await campaignService.deleteCampaign(campaignId);

      if (!deleteResult.success) {
        return res.status(400).json({ error: deleteResult.error || 'Failed to delete campaign' });
      }

      return res.status(200).json({
        message: deleteResult.message || 'Campaign deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete campaign error:', error);
      return res.status(500).json({ error: error.message || 'Error deleting campaign' });
    }
  }

  /**
   * Launch a campaign
   */
  async launchCampaign(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const campaignId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!campaignId) {
        return res.status(400).json({ error: 'Campaign ID is required' });
      }

      const { bundleType, selectedAthletes, bundleDetails, launchDetails } = req.body;

      const launchData = {
        campaignId,
        bundleType,
        selectedAthletes,
        bundleDetails,
        launchDetails
      };

      const result = await campaignService.launchCampaign(userId, launchData);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to launch campaign' });
      }

      return res.status(200).json({
        message: result.message || 'Campaign launched successfully',
        campaign: result.campaign
      });
    } catch (error: any) {
      console.error('Launch campaign error:', error);
      return res.status(500).json({ error: error.message || 'Error launching campaign' });
    }
  }

  /**
   * Get athlete matches for a campaign
   */
  async getCampaignMatches(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const campaignId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!campaignId) {
        return res.status(400).json({ error: 'Campaign ID is required' });
      }

      // Extract limit from query params
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const result = await campaignService.getCampaignMatches(campaignId, limit);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to get campaign matches' });
      }

      return res.status(200).json({
        matches: result.matches,
        campaign: result.campaign
      });
    } catch (error: any) {
      console.error('Get campaign matches error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving campaign matches' });
    }
  }

  /**
   * Save a match score
   */
  async saveMatchScore(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const campaignId = req.params.id;
      const athleteId = req.params.athleteId;
      const { score } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!campaignId) {
        return res.status(400).json({ error: 'Campaign ID is required' });
      }

      if (!athleteId) {
        return res.status(400).json({ error: 'Athlete ID is required' });
      }

      if (typeof score !== 'number' || score < 0 || score > 1) {
        return res.status(400).json({ error: 'Score must be a number between 0 and 1' });
      }

      const result = await campaignService.saveMatchScore(campaignId, athleteId, score, userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to save match score' });
      }

      return res.status(200).json({
        message: result.message,
        match: result.match
      });
    } catch (error: any) {
      console.error('Save match score error:', error);
      return res.status(500).json({ error: error.message || 'Error saving match score' });
    }
  }
}

// Create and export singleton instance
export const campaignController = new CampaignController();
export default campaignController;