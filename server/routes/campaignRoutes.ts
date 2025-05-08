/** 05/08/2025 - 1426 CST
 * Campaign Routes
 * 
 * Defines all routes related to campaign management.
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { campaignService } from '../services/campaignService';
import { AppError } from '../middleware/error';

const router = Router();

/**
 * GET /api/campaign
 * Get campaigns for the current business user
 */
router.get('/', requireAuth, requireRole(['business', 'admin']), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User ID not found', 401, 'UNAUTHORIZED');
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
      throw new AppError(result.error || 'Failed to get campaigns', 400, 'CAMPAIGN_ERROR');
    }

    res.status(200).json({
      campaigns: result.campaigns,
      count: result.campaigns.length
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    console.error('Error in GET /campaign:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

/**
 * GET /api/campaign/:id
 * Get a specific campaign by ID
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;

    if (!campaignId) {
      throw new AppError('Campaign ID is required', 400, 'INVALID_INPUT');
    }

    const result = await campaignService.getCampaign(campaignId);

    if (!result.success) {
      throw new AppError(result.error || 'Failed to get campaign', 400, 'CAMPAIGN_ERROR');
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
      throw new AppError('You do not have permission to view this campaign', 403, 'FORBIDDEN');
    }

    res.status(200).json({
      campaign: result.campaign
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    console.error('Error in GET /campaign/:id:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

/**
 * POST /api/campaign
 * Create a new campaign
 */
router.post('/', requireAuth, requireRole(['business']), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User ID not found', 401, 'UNAUTHORIZED');
    }

    const campaignData = req.body;

    // Additional validation
    if (!campaignData.title || !campaignData.description) {
      throw new AppError('Title and description are required', 400, 'INVALID_INPUT');
    }

    const result = await campaignService.createCampaign(userId, campaignData);

    if (!result.success) {
      throw new AppError(result.error || 'Failed to create campaign', 400, 'CAMPAIGN_ERROR');
    }

    res.status(201).json({
      message: result.message || 'Campaign created successfully',
      campaign: result.campaign
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    console.error('Error in POST /campaign:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

/**
 * PUT /api/campaign/:id
 * Update a campaign
 */
router.put('/:id', requireAuth, requireRole(['business']), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const campaignId = req.params.id;

    if (!userId) {
      throw new AppError('User ID not found', 401, 'UNAUTHORIZED');
    }

    if (!campaignId) {
      throw new AppError('Campaign ID is required', 400, 'INVALID_INPUT');
    }

    // First get the campaign to check ownership
    const checkResult = await campaignService.getCampaign(campaignId);

    if (!checkResult.success) {
      throw new AppError(checkResult.error || 'Campaign not found', 404, 'NOT_FOUND');
    }

    const campaign = checkResult.campaign;

    // Check ownership
    if (campaign.business_id !== userId && campaign.created_by !== userId) {
      throw new AppError('You do not have permission to update this campaign', 403, 'FORBIDDEN');
    }

    // Don't allow status change through this endpoint
    if (req.body.status && req.body.status !== campaign.status) {
      delete req.body.status;
    }

    const updateResult = await campaignService.updateCampaign(campaignId, req.body);

    if (!updateResult.success) {
      throw new AppError(updateResult.error || 'Failed to update campaign', 400, 'CAMPAIGN_ERROR');
    }

    res.status(200).json({
      message: updateResult.message || 'Campaign updated successfully',
      campaign: updateResult.campaign
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    console.error('Error in PUT /campaign/:id:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

/**
 * DELETE /api/campaign/:id
 * Delete a campaign (draft only)
 */
router.delete('/:id', requireAuth, requireRole(['business']), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const campaignId = req.params.id;

    if (!userId) {
      throw new AppError('User ID not found', 401, 'UNAUTHORIZED');
    }

    if (!campaignId) {
      throw new AppError('Campaign ID is required', 400, 'INVALID_INPUT');
    }

    // First get the campaign to check ownership
    const checkResult = await campaignService.getCampaign(campaignId);

    if (!checkResult.success) {
      throw new AppError(checkResult.error || 'Campaign not found', 404, 'NOT_FOUND');
    }

    const campaign = checkResult.campaign;

    // Check ownership
    if (campaign.business_id !== userId && campaign.created_by !== userId) {
      throw new AppError('You do not have permission to delete this campaign', 403, 'FORBIDDEN');
    }

    // Only allow deleting draft campaigns
    if (campaign.status !== 'draft') {
      throw new AppError('Only draft campaigns can be deleted', 400, 'INVALID_OPERATION');
    }

    const deleteResult = await campaignService.deleteCampaign(campaignId);

    if (!deleteResult.success) {
      throw new AppError(deleteResult.error || 'Failed to delete campaign', 400, 'CAMPAIGN_ERROR');
    }

    res.status(200).json({
      message: deleteResult.message || 'Campaign deleted successfully'
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    console.error('Error in DELETE /campaign/:id:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

/**
 * POST /api/campaign/:id/launch
 * Launch a campaign
 */
router.post('/:id/launch', requireAuth, requireRole(['business']), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const campaignId = req.params.id;

    if (!userId) {
      throw new AppError('User ID not found', 401, 'UNAUTHORIZED');
    }

    if (!campaignId) {
      throw new AppError('Campaign ID is required', 400, 'INVALID_INPUT');
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
      throw new AppError(result.error || 'Failed to launch campaign', 400, 'CAMPAIGN_ERROR');
    }

    res.status(200).json({
      message: result.message || 'Campaign launched successfully',
      campaign: result.campaign
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    console.error('Error in POST /campaign/:id/launch:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

/**
 * GET /api/campaign/:id/matches
 * Get athlete matches for a campaign
 */
router.get('/:id/matches', requireAuth, requireRole(['business']), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const campaignId = req.params.id;

    if (!userId) {
      throw new AppError('User ID not found', 401, 'UNAUTHORIZED');
    }

    if (!campaignId) {
      throw new AppError('Campaign ID is required', 400, 'INVALID_INPUT');
    }

    // Extract limit from query params
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await campaignService.getCampaignMatches(campaignId, limit);

    if (!result.success) {
      throw new AppError(result.error || 'Failed to get campaign matches', 400, 'CAMPAIGN_ERROR');
    }

    res.status(200).json({
      matches: result.matches,
      campaign: result.campaign
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    console.error('Error in GET /campaign/:id/matches:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

/**
 * POST /api/campaign/:id/match/:athleteId
 * Save a match score
 */
router.post('/:id/match/:athleteId', requireAuth, requireRole(['business']), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const campaignId = req.params.id;
    const athleteId = req.params.athleteId;
    const { score } = req.body;

    if (!userId) {
      throw new AppError('User ID not found', 401, 'UNAUTHORIZED');
    }

    if (!campaignId) {
      throw new AppError('Campaign ID is required', 400, 'INVALID_INPUT');
    }

    if (!athleteId) {
      throw new AppError('Athlete ID is required', 400, 'INVALID_INPUT');
    }

    if (typeof score !== 'number' || score < 0 || score > 1) {
      throw new AppError('Score must be a number between 0 and 1', 400, 'INVALID_INPUT');
    }

    const result = await campaignService.saveMatchScore(campaignId, athleteId, score, userId);

    if (!result.success) {
      throw new AppError(result.error || 'Failed to save match score', 400, 'MATCH_ERROR');
    }

    res.status(200).json({
      message: result.message,
      match: result.match
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    console.error('Error in POST /campaign/:id/match/:athleteId:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    });
  }
});

export default router;