import express from 'express';
import { supabase, supabaseAdmin } from '../../supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/bundle/create
// Create a bundle for a campaign with selected athletes
router.post('/create', async (req, res) => {
  try {
    // Extract request data
    const { campaign_id, type, custom_details, athlete_ids } = req.body;
    
    if (!campaign_id) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }
    
    if (!athlete_ids || !Array.isArray(athlete_ids) || athlete_ids.length === 0) {
      return res.status(400).json({ error: 'At least one athlete ID is required' });
    }
    
    // Get the campaign from Supabase
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();
    
    if (campaignError) {
      console.error('Error fetching campaign:', campaignError);
      return res.status(500).json({ error: 'Failed to fetch campaign data' });
    }
    
    // Get the business_id from the campaign
    const business_id = campaign.business_id;
    
    // Determine bundle details based on type
    let bundleDetails;
    if (type === 'custom' && custom_details) {
      bundleDetails = custom_details;
    } else {
      // Use preset details based on type
      bundleDetails = getPresetBundleDetails(type);
    }
    
    // Create a new bundle
    const { data: bundle, error: bundleError } = await supabase
      .from('bundles')
      .insert([
        {
          campaign_id,
          business_id,
          name: bundleDetails.name || `${type.charAt(0).toUpperCase() + type.slice(1)} Bundle`,
          type,
          details: bundleDetails,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();
      
    if (bundleError) {
      console.error('Error creating bundle:', bundleError);
      return res.status(500).json({ error: 'Failed to create bundle', details: bundleError.message });
    }
    
    // Add athletes to the bundle (bundle_members table)
    const bundleMembers = athlete_ids.map(athlete_id => ({
      bundle_id: bundle.id,
      athlete_id,
      status: 'pending',
      created_at: new Date().toISOString(),
    }));
    
    const { error: memberError } = await supabase
      .from('bundle_members')
      .insert(bundleMembers);
      
    if (memberError) {
      console.error('Error adding athletes to bundle:', memberError);
      // Don't return an error here, the bundle was created successfully
      // Just log the error and continue
    }
    
    // Update the campaign with the bundle ID
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        bundle_id: bundle.id,
        bundle_type: type,
        bundle_created_at: new Date().toISOString(),
      })
      .eq('id', campaign_id);
    
    if (updateError) {
      console.error('Error updating campaign with bundle ID:', updateError);
    }
    
    // Return the created bundle
    return res.status(201).json({
      ...bundle,
      athlete_count: athlete_ids.length,
    });
    
  } catch (error) {
    console.error('Error in bundle creation:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Function to get preset bundle details based on type
function getPresetBundleDetails(type) {
  switch (type) {
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
    case 'standard':
    default:
      return {
        name: 'Standard Package',
        description: 'Our standard athlete partnership package with balanced deliverables',
        deliverables: '3 social media posts, 2 stories, 1 product showcase',
        compensation: '$500-$1,500 per athlete',
        timeline: '30 days from acceptance',
      };
  }
}

export default router;