import express from 'express';
import { supabase, supabaseAdmin } from '../../supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// POST /api/offer/send
// Send offers to athletes for a campaign
router.post('/send', async (req, res) => {
  try {
    // Extract request data
    const { campaignId, bundleType, athletes } = req.body;
    
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
    }
    
    if (!athletes || !Array.isArray(athletes) || athletes.length === 0) {
      return res.status(400).json({ error: 'At least one athlete is required' });
    }
    
    // Get the campaign from Supabase
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (campaignError) {
      console.error('Error fetching campaign:', campaignError);
      return res.status(500).json({ error: 'Failed to fetch campaign data' });
    }
    
    // Get the bundle if it exists
    let bundle;
    if (campaign.bundle_id) {
      const { data: bundleData, error: bundleError } = await supabase
        .from('bundles')
        .select('*')
        .eq('id', campaign.bundle_id)
        .single();
        
      if (!bundleError) {
        bundle = bundleData;
      } else {
        console.error('Error fetching bundle:', bundleError);
      }
    }
    
    // Check if DocuSign integration is configured
    const docusignIntegratorKey = process.env.DOCUSIGN_INTEGRATOR_KEY;
    let useDocusign = false;
    
    if (docusignIntegratorKey) {
      useDocusign = true;
      console.log('DocuSign integration is configured');
    } else {
      console.log('DocuSign integration is not configured, using internal offer system');
    }
    
    // Prepare offer data for each athlete
    const offerPromises = athletes.map(async (athlete) => {
      // Basic offer data
      const offerData = {
        campaign_id: campaignId,
        athlete_id: athlete.id,
        business_id: campaign.business_id,
        status: 'SENT',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        bundle_type: bundleType || 'standard',
        compensation_type: 'monetary', // Default
        offer_amount: getCompensationForBundle(bundleType, bundle),
        usage_rights: 'Standard digital usage for promotional purposes',
        term: '6 months from content creation',
      };
      
      // If there's a match record, include it
      if (campaign.match_candidates && campaign.match_candidates.includes(athlete.id)) {
        const { data: matchScore } = await supabase
          .from('match_scores')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('athlete_id', athlete.id)
          .single();
          
        if (matchScore) {
          offerData.match_id = matchScore.id;
        }
      }
      
      // If DocuSign is configured, generate a document
      if (useDocusign) {
        try {
          // Call DocuSign API to create and send an envelope
          const docusignResponse = await sendDocusignEnvelope(campaign, athlete, offerData);
          
          // Update offer data with DocuSign information
          offerData.docusign_envelope_id = docusignResponse.envelopeId;
          offerData.docusign_status = docusignResponse.status;
        } catch (docusignError) {
          console.error('DocuSign API error:', docusignError);
          // Continue with the offer creation even if DocuSign fails
        }
      }
      
      // Insert the offer into the database
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .insert([offerData])
        .select()
        .single();
        
      if (offerError) {
        console.error('Error creating offer for athlete:', athlete.id, offerError);
        return { athleteId: athlete.id, status: 'error', error: offerError.message };
      }
      
      return { athleteId: athlete.id, offerId: offer.id, status: 'sent' };
    });
    
    // Wait for all offer creations to complete
    const results = await Promise.all(offerPromises);
    
    // Check if all offers were created successfully
    const allSuccessful = results.every(result => result.status === 'sent');
    
    // Update campaign status
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        status: 'ACTIVE',
        offers_sent_at: new Date().toISOString(),
      })
      .eq('id', campaignId);
    
    if (updateError) {
      console.error('Error updating campaign status:', updateError);
    }
    
    // Return the results
    return res.status(allSuccessful ? 200 : 207).json({
      campaign_id: campaignId,
      offers_sent: results.filter(r => r.status === 'sent').length,
      offers_failed: results.filter(r => r.status === 'error').length,
      results,
    });
    
  } catch (error) {
    console.error('Error in sending offers:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Function to determine compensation amount based on bundle type
function getCompensationForBundle(bundleType, bundle) {
  // If we have a bundle with details, use that
  if (bundle && bundle.details && bundle.details.compensation) {
    return bundle.details.compensation;
  }
  
  // Otherwise use preset values
  switch (bundleType) {
    case 'premium':
      return '$1,500-$3,000 per athlete';
    case 'basic':
      return '$200-$500 per athlete';
    case 'standard':
    default:
      return '$500-$1,500 per athlete';
  }
}

// Function to send a DocuSign envelope
async function sendDocusignEnvelope(campaign, athlete, offerData) {
  try {
    // This is just a placeholder function
    // In a real implementation, you would call the DocuSign API here
    console.log(`Sending DocuSign envelope for campaign ${campaign.id} to athlete ${athlete.id}`);
    
    // Simulate a DocuSign API call
    // In reality, you would use the DocuSign SDK or API to create an envelope
    return {
      envelopeId: `env-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'sent',
      created: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error sending DocuSign envelope:', error);
    throw error;
  }
}

export default router;