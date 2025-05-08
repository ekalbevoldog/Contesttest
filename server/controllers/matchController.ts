/** 050825 1621CST
 * Match Controller
 * 
 * Handles HTTP requests related to matches between athletes and businesses.
 */

import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { AppError } from '../lib/error';
import { wsHelpers } from '../services/websocketService';

class MatchController {
  /**
   * Get matches for the current user (athlete or business)
   */
  async getMatches(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Filter by status if provided
      const status = req.query.status as string;

      // Determine which type of matches to fetch based on user role
      let matches;

      if (userRole === 'athlete') {
        // Get matches for athlete
        let query = supabase
          .from('match_scores')
          .select(`
            *,
            campaign:campaign_id(*),
            business:business_id(id, name, profile_image)
          `)
          .eq('athlete_id', userId)
          .order('created_at', { ascending: false });

        // Apply status filter if provided
        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
          throw new AppError('Failed to fetch matches', 500, 'DATABASE_ERROR');
        }

        matches = data;
      } else if (userRole === 'business') {
        // Get matches for business
        let query = supabase
          .from('match_scores')
          .select(`
            *,
            campaign:campaign_id(*),
            athlete:athlete_id(id, name, profile_image, sport, school, follower_count)
          `)
          .eq('business_id', userId)
          .order('created_at', { ascending: false });

        // Apply status filter if provided
        if (status) {
          query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
          throw new AppError('Failed to fetch matches', 500, 'DATABASE_ERROR');
        }

        matches = data;
      } else if (userRole === 'compliance' || userRole === 'admin') {
        // For compliance officers and admins, get all matches
        let query = supabase
          .from('match_scores')
          .select(`
            *,
            campaign:campaign_id(*),
            business:business_id(id, name),
            athlete:athlete_id(id, name, sport, school)
          `)
          .order('created_at', { ascending: false });

        // Apply status filter if provided
        if (status) {
          query = query.eq('status', status);
        }

        // Apply compliance status filter if specifically requested
        const complianceStatus = req.query.compliance_status as string;
        if (complianceStatus) {
          query = query.eq('compliance_status', complianceStatus);
        }

        const { data, error } = await query;

        if (error) {
          throw new AppError('Failed to fetch matches', 500, 'DATABASE_ERROR');
        }

        matches = data;
      } else {
        // Unsupported role
        return res.status(403).json({ error: 'Unauthorized role' });
      }

      return res.status(200).json({
        matches,
        count: matches.length
      });
    } catch (error: any) {
      console.error('Get matches error:', error);

      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ 
          error: {
            code: error.code,
            message: error.message
          }
        });
      }

      return res.status(500).json({ error: error.message || 'Error retrieving matches' });
    }
  }

  /**
   * Get a specific match by ID
   */
  async getMatch(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const matchId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!matchId) {
        return res.status(400).json({ error: 'Match ID is required' });
      }

      // Get the match with related data
      const { data: match, error } = await supabase
        .from('match_scores')
        .select(`
          *,
          campaign:campaign_id(*),
          business:business_id(id, name, profile_image, email),
          athlete:athlete_id(id, name, profile_image, sport, school, follower_count, email)
        `)
        .eq('id', matchId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Match not found' });
      }

      // Check permission to view match
      const isAuthorized = 
        userRole === 'admin' || 
        userRole === 'compliance' || 
        match.athlete_id === userId || 
        match.business_id === userId;

      if (!isAuthorized) {
        return res.status(403).json({ error: 'You do not have permission to view this match' });
      }

      // Get partnership offers for this match
      const { data: offers, error: offersError } = await supabase
        .from('partnership_offers')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: false });

      if (offersError) {
        console.error('Error fetching offers:', offersError);
      }

      return res.status(200).json({
        match,
        offers: offers || []
      });
    } catch (error: any) {
      console.error('Get match error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving match' });
    }
  }

  /**
   * Respond to a match (accept/decline) as an athlete
   */
  async respondToMatch(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const matchId = req.params.id;
      const { response, message } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!matchId) {
        return res.status(400).json({ error: 'Match ID is required' });
      }

      if (!response || !['accepted', 'declined'].includes(response)) {
        return res.status(400).json({ error: 'Valid response (accepted/declined) is required' });
      }

      // Get the match to verify ownership
      const { data: match, error: matchError } = await supabase
        .from('match_scores')
        .select('id, athlete_id, business_id, campaign_id, status')
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      // Verify the athlete owns this match
      if (match.athlete_id !== userId) {
        return res.status(403).json({ error: 'You do not have permission to respond to this match' });
      }

      // Check if match is already responded to
      if (match.status !== 'pending') {
        return res.status(400).json({ error: `Match has already been ${match.status}` });
      }

      // Update match status
      const { data: updatedMatch, error: updateError } = await supabase
        .from('match_scores')
        .update({
          status: response,
          athlete_response: message || null,
          responded_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update match status' });
      }

      // Create notification for business
      await supabase
        .from('notifications')
        .insert({
          user_id: match.business_id,
          type: `MATCH_${response.toUpperCase()}`,
          title: `Match ${response === 'accepted' ? 'Accepted' : 'Declined'}`,
          content: `An athlete has ${response} your match request${message ? ': ' + message : ''}`,
          reference_type: 'MATCH',
          reference_id: matchId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      // Send WebSocket notification if available
      if (wsHelpers.broadcastToChannel) {
        wsHelpers.broadcastToChannel(`user:${match.business_id}`, {
          type: 'notification',
          notification: {
            type: `MATCH_${response.toUpperCase()}`,
            title: `Match ${response === 'accepted' ? 'Accepted' : 'Declined'}`,
            content: `An athlete has ${response} your match request`,
            matchId: matchId
          }
        });
      }

      return res.status(200).json({
        message: `Match ${response} successfully`,
        match: updatedMatch
      });
    } catch (error: any) {
      console.error('Respond to match error:', error);
      return res.status(500).json({ error: error.message || 'Error responding to match' });
    }
  }

  /**
   * Create a partnership offer for a match
   */
  async createOffer(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const matchId = req.params.id;
      const offerData = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!matchId) {
        return res.status(400).json({ error: 'Match ID is required' });
      }

      // Validate required offer fields
      if (!offerData.compensation_type || !offerData.offer_amount || 
          !offerData.term || !offerData.usage_rights) {
        return res.status(400).json({ error: 'Missing required offer details' });
      }

      // Get the match to verify ownership and get related IDs
      const { data: match, error: matchError } = await supabase
        .from('match_scores')
        .select('id, athlete_id, business_id, campaign_id, status')
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      // Verify the business owns this match
      if (match.business_id !== userId) {
        return res.status(403).json({ error: 'You do not have permission to create an offer for this match' });
      }

      // Check if match is accepted (can only make offers for accepted matches)
      if (match.status !== 'accepted') {
        return res.status(400).json({ error: 'Can only create offers for accepted matches' });
      }

      // Check if an offer already exists
      const { data: existingOffer, error: offerCheckError } = await supabase
        .from('partnership_offers')
        .select('id')
        .eq('match_id', matchId)
        .maybeSingle();

      if (!offerCheckError && existingOffer) {
        return res.status(400).json({ error: 'An offer already exists for this match' });
      }

      // Calculate expiration date (default 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (offerData.expires_in_days || 7));

      // Create the offer
      const { data: offer, error: createError } = await supabase
        .from('partnership_offers')
        .insert({
          match_id: matchId,
          business_id: match.business_id,
          athlete_id: match.athlete_id,
          campaign_id: match.campaign_id,
          compensation_type: offerData.compensation_type,
          offer_amount: offerData.offer_amount,
          payment_schedule: offerData.payment_schedule,
          bonus_structure: offerData.bonus_structure,
          deliverables: offerData.deliverables || [],
          content_specifications: offerData.content_specifications,
          post_frequency: offerData.post_frequency,
          approval_process: offerData.approval_process,
          usage_rights: offerData.usage_rights,
          term: offerData.term,
          exclusivity: offerData.exclusivity,
          geographic_restrictions: offerData.geographic_restrictions,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: 'Failed to create offer' });
      }

      // Create notification for athlete
      await supabase
        .from('notifications')
        .insert({
          user_id: match.athlete_id,
          type: 'NEW_PARTNERSHIP_OFFER',
          title: 'New Partnership Offer',
          content: `You have received a new partnership offer for ${offerData.offer_amount}`,
          reference_type: 'OFFER',
          reference_id: offer.id,
          is_read: false,
          created_at: new Date().toISOString()
        });

      // Send WebSocket notification if available
      if (wsHelpers.broadcastToChannel) {
        wsHelpers.broadcastToChannel(`user:${match.athlete_id}`, {
          type: 'notification',
          notification: {
            type: 'NEW_PARTNERSHIP_OFFER',
            title: 'New Partnership Offer',
            content: `You have received a new partnership offer`,
            offerId: offer.id,
            matchId: matchId
          }
        });
      }

      return res.status(201).json({
        message: 'Partnership offer created successfully',
        offer
      });
    } catch (error: any) {
      console.error('Create offer error:', error);
      return res.status(500).json({ error: error.message || 'Error creating offer' });
    }
  }

  /**
   * Update compliance status of a match
   */
  async updateComplianceStatus(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const matchId = req.params.id;
      const { status, notes } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!matchId) {
        return res.status(400).json({ error: 'Match ID is required' });
      }

      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Valid status (pending/approved/rejected) is required' });
      }

      // Get the match
      const { data: match, error: matchError } = await supabase
        .from('match_scores')
        .select('id, athlete_id, business_id')
        .eq('id', matchId)
        .single();

      if (matchError || !match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      // Update compliance status
      const { data: updatedMatch, error: updateError } = await supabase
        .from('match_scores')
        .update({
          compliance_status: status,
          compliance_officer_id: userId,
          compliance_notes: notes || null,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', matchId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update compliance status' });
      }

      // Create notifications for athlete and business
      const notificationType = `COMPLIANCE_${status.toUpperCase()}`;
      const notificationTitle = `Compliance ${status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Updated'}`;
      const notificationContent = `Your match has been ${status} by compliance${notes ? ': ' + notes : ''}`;

      // Notify athlete
      await supabase
        .from('notifications')
        .insert({
          user_id: match.athlete_id,
          type: notificationType,
          title: notificationTitle,
          content: notificationContent,
          reference_type: 'MATCH',
          reference_id: matchId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      // Notify business
      await supabase
        .from('notifications')
        .insert({
          user_id: match.business_id,
          type: notificationType,
          title: notificationTitle,
          content: notificationContent,
          reference_type: 'MATCH',
          reference_id: matchId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      // Send WebSocket notifications
      if (wsHelpers.broadcastToChannel) {
        const notification = {
          type: notificationType,
          title: notificationTitle,
          content: notificationContent,
          matchId: matchId
        };

        wsHelpers.broadcastToChannel(`user:${match.athlete_id}`, {
          type: 'notification',
          notification
        });

        wsHelpers.broadcastToChannel(`user:${match.business_id}`, {
          type: 'notification',
          notification
        });
      }

      return res.status(200).json({
        message: `Compliance status updated to ${status}`,
        match: updatedMatch
      });
    } catch (error: any) {
      console.error('Update compliance status error:', error);
      return res.status(500).json({ error: error.message || 'Error updating compliance status' });
    }
  }
}

// Create and export singleton instance
export const matchController = new MatchController();
export default matchController;