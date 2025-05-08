/**
 * Campaign Launch API
 * 
 * Handles launching a campaign with proper transaction support to ensure
 * database consistency across all related operations (campaign update, 
 * activity logging, offer creation, notifications).
 */

import express from 'express';
import { getDb, sql } from '../../dbSetup.js';

const router = express.Router();

/**
 * POST /api/campaigns/launch
 * 
 * Launch a campaign and create related records in a single transaction
 * Request body should include:
 * - campaignId: string
 * - bundleType: string
 * - selectedAthletes: Array of athlete objects
 * - bundleDetails: Object with bundle information
 * - launchDetails: Object with additional launch information
 */
router.post('/', async (req, res) => {
  // Ensure user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to launch a campaign'
    });
  }
  
  const { campaignId, bundleType, selectedAthletes, bundleDetails, launchDetails } = req.body;
  
  // Validate required parameters
  if (!campaignId) {
    return res.status(400).json({
      error: 'Missing campaign ID',
      message: 'Campaign ID is required to launch a campaign'
    });
  }
  
  // Get database connection
  const db = getDb();
  
  // Begin a transaction to ensure all operations succeed or fail together
  const client = await db.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Step 1: Verify the campaign exists and belongs to the current user
    const verifyQuery = `
      SELECT * FROM campaigns 
      WHERE id = $1 
      AND (business_id = $2 OR created_by = $2)
    `;
    
    const { rows } = await client.query(verifyQuery, [campaignId, req.user.id]);
    
    if (rows.length === 0) {
      throw new Error('Campaign not found or you do not have permission to launch it');
    }
    
    const campaign = rows[0];
    
    // Check if campaign is already launched
    if (campaign.status === 'ACTIVE') {
      throw new Error('Campaign is already launched');
    }
    
    // Step 2: Update campaign status
    const updateQuery = `
      UPDATE campaigns
      SET 
        status = 'ACTIVE',
        launched_at = NOW(),
        updated_at = NOW(),
        terms_accepted = $1,
        terms_accepted_at = $2,
        terms_accepted_by = $3,
        bundle_type = $4,
        bundle_details = $5
      WHERE id = $6
      RETURNING *
    `;
    
    const updateValues = [
      true,
      launchDetails?.terms_accepted_at || new Date().toISOString(),
      req.user.id,
      bundleType || 'standard',
      JSON.stringify(bundleDetails || {}),
      campaignId
    ];
    
    const { rows: updateRows } = await client.query(updateQuery, updateValues);
    
    if (updateRows.length === 0) {
      throw new Error('Failed to update campaign status');
    }
    
    // Step 3: Log campaign launch activity
    const activityQuery = `
      INSERT INTO campaign_activities (
        campaign_id, 
        activity_type, 
        actor_id, 
        details, 
        created_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `;
    
    const activityValues = [
      campaignId,
      'LAUNCH',
      req.user.id,
      JSON.stringify({
        bundle_type: bundleType,
        athlete_count: selectedAthletes?.length || 0
      })
    ];
    
    await client.query(activityQuery, activityValues);
    
    // Step 4: Create offer records for each athlete if any are selected
    if (selectedAthletes && selectedAthletes.length > 0) {
      // Prepare values for batch insert
      const offerValues = selectedAthletes.map(athlete => ({
        campaign_id: campaignId,
        athlete_id: athlete.id,
        status: 'PENDING',
        bundle_type: bundleType || 'standard',
        compensation: bundleDetails?.compensation || 'Not specified',
        created_at: new Date().toISOString(),
        created_by: req.user.id
      }));
      
      // Build batch insert query
      const offerPlaceholders = offerValues.map((_, index) => 
        `($${index * 7 + 1}, $${index * 7 + 2}, $${index * 7 + 3}, $${index * 7 + 4}, $${index * 7 + 5}, $${index * 7 + 6}, $${index * 7 + 7})`
      ).join(', ');
      
      const offerParams = offerValues.flatMap(offer => [
        offer.campaign_id,
        offer.athlete_id,
        offer.status,
        offer.bundle_type,
        offer.compensation,
        offer.created_at,
        offer.created_by
      ]);
      
      const offerQuery = `
        INSERT INTO offers (
          campaign_id, 
          athlete_id, 
          status, 
          bundle_type, 
          compensation, 
          created_at, 
          created_by
        )
        VALUES ${offerPlaceholders}
        RETURNING id
      `;
      
      await client.query(offerQuery, offerParams);
    }
    
    // Step 5: Generate campaign notification records
    const notificationQuery = `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        content,
        reference_type,
        reference_id,
        is_read,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;
    
    // Send notification to each athlete
    for (const athlete of (selectedAthletes || [])) {
      await client.query(notificationQuery, [
        athlete.user_id || athlete.id,
        'NEW_OFFER',
        'New Campaign Offer',
        `You have received a new offer for "${campaign.title || 'Campaign'}"`,
        'CAMPAIGN',
        campaignId,
        false
      ]);
    }
    
    // Step 6: Update campaign stats
    const statsQuery = `
      UPDATE campaign_stats
      SET 
        athlete_count = $1,
        updated_at = NOW()
      WHERE campaign_id = $2
    `;
    
    await client.query(statsQuery, [
      selectedAthletes?.length || 0,
      campaignId
    ]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Return success
    res.status(200).json({
      success: true,
      campaignId,
      message: 'Campaign launched successfully',
      athleteCount: selectedAthletes?.length || 0
    });
    
  } catch (error) {
    // Rollback transaction on any error
    await client.query('ROLLBACK');
    
    console.error('Campaign launch error:', error);
    
    res.status(500).json({
      error: 'Campaign launch failed',
      message: error.message || 'An unexpected error occurred'
    });
    
  } finally {
    // Release client back to pool
    client.release();
  }
});

export default router;