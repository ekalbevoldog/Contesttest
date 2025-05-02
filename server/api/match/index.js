import express from 'express';
import { supabase, supabaseAdmin } from '../../supabase.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// POST /api/match/run
// Run athlete matching for a campaign
router.post('/run', async (req, res) => {
  try {
    // Extract request data
    const { campaignId, targetSports, targetAudience } = req.body;
    
    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID is required' });
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
    
    // Check if matching service URL is configured
    const matchingServiceUrl = process.env.MATCHING_SVC_URL;
    let matchingResult;
    
    if (matchingServiceUrl) {
      console.log('Using external matching service');
      try {
        // Call the external matching service
        const response = await fetch(`${matchingServiceUrl}/match`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId,
            targetSports: targetSports || campaign.target_sports,
            targetAudience: targetAudience || campaign.target_audience,
            budget: campaign.budget,
            objective: campaign.objective,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Matching service returned ${response.status}`);
        }
        
        matchingResult = await response.json();
      } catch (matchServiceError) {
        console.error('External matching service error:', matchServiceError);
        // Fall back to direct database query
        matchingResult = await performLocalMatching(campaign, targetSports, targetAudience);
      }
    } else {
      console.log('No matching service configured, performing local matching');
      // Perform a direct database query for matching
      matchingResult = await performLocalMatching(campaign, targetSports, targetAudience);
    }
    
    // Store the match results in the campaign record
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        match_candidates: matchingResult.candidates.map(c => c.id),
        matched_at: new Date().toISOString(),
      })
      .eq('id', campaignId);
    
    if (updateError) {
      console.error('Error updating campaign with match results:', updateError);
    }
    
    return res.json(matchingResult);
    
  } catch (error) {
    console.error('Error in match execution:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Function to perform local matching when external service is unavailable
async function performLocalMatching(campaign, targetSports, targetAudience) {
  console.log('Performing local athlete matching');
  
  // Build query based on campaign parameters
  let query = supabase.from('athlete_profiles').select('*');
  
  // Apply sport filters if available
  if (targetSports && targetSports.length > 0) {
    // This assumes the sport is stored as a string field
    // For array fields, would need to use containedBy or other operators
    query = query.in('sport', targetSports);
  }
  
  // Apply age range filter if available
  if (targetAudience?.ageRange) {
    const [minAge, maxAge] = targetAudience.ageRange;
    // This assumes there's an age field in the athlete profile
    // Alternatively, calculate from birthdate if that's how it's stored
    query = query.gte('age', minAge).lte('age', maxAge);
  }
  
  // Apply gender filter if available and not set to 'all'
  if (targetAudience?.gender && targetAudience.gender !== 'all') {
    query = query.eq('gender', targetAudience.gender);
  }
  
  // Limit to a reasonable number of results
  query = query.limit(20);
  
  // Execute the query
  const { data: athletes, error } = await query;
  
  if (error) {
    console.error('Error in local matching query:', error);
    throw error;
  }
  
  // Simple scoring logic: Athletes get points for each matching criteria
  const scoredAthletes = athletes.map(athlete => {
    let score = 50; // Base score
    
    // Add score for sport match
    if (targetSports && targetSports.includes(athlete.sport)) {
      score += 20;
    }
    
    // Add score for follower counts if available
    if (athlete.followers) {
      // More followers = higher score, up to a point
      const followerScore = Math.min(Math.log10(athlete.followers) * 5, 20);
      score += followerScore;
    }
    
    // Add score for engagement rate if available
    if (athlete.engagement_rate) {
      // Higher engagement = higher score
      const engagementScore = Math.min(athlete.engagement_rate * 10, 10);
      score += engagementScore;
    }
    
    // Calculate a percentage match score (max 100)
    const matchScore = Math.min(Math.round(score), 100);
    
    return {
      ...athlete,
      match_score: `${matchScore}%`,
    };
  });
  
  // Sort by match score (descending)
  scoredAthletes.sort((a, b) => {
    return parseInt(b.match_score) - parseInt(a.match_score);
  });
  
  return {
    candidates: scoredAthletes,
    total: scoredAthletes.length,
    matchingTime: new Date().toISOString(),
  };
}

export default router;