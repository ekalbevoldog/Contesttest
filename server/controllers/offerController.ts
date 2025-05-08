/** 050825 1620CST
 * Offer Controller
 * 
 * Handles HTTP requests related to partnership offers.
 */

import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { wsHelpers } from '../services/websocketService';

class OfferController {
  /**
   * Get offers for the current user
   */
  async getUserOffers(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Filter by status if provided
      const status = req.query.status as string;

      let query;

      if (userRole === 'athlete') {
        // Get offers where the user is the athlete
        query = supabase
          .from('partnership_offers')
          .select(`
            *,
            campaign:campaign_id(*),
            business:business_id(id, name, profile_image),
            match:match_id(*)
          `)
          .eq('athlete_id', userId);
      } else if (userRole === 'business') {
        // Get offers where the user is the business
        query = supabase
          .from('partnership_offers')
          .select(`
            *,
            campaign:campaign_id(*),
            athlete:athlete_id(id, name, profile_image, sport, school, follower_count),
            match:match_id(*)
          `)
          .eq('business_id', userId);
      } else if (userRole === 'compliance' || userRole === 'admin') {
        // For compliance officers and admins, get all offers
        query = supabase
          .from('partnership_offers')
          .select(`
            *,
            campaign:campaign_id(*),
            business:business_id(id, name),
            athlete:athlete_id(id, name, sport, school),
            match:match_id(*)
          `);
      } else {
        return res.status(403).json({ error: 'Unauthorized role' });
      }

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }

      // Execute query
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch offers' });
      }

      return res.status(200).json({
        offers: data,
        count: data.length
      });
    } catch (error: any) {
      console.error('Get user offers error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving offers' });
    }
  }

  /**
   * Get a specific offer by ID
   */
  async getOffer(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const offerId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!offerId) {
        return res.status(400).json({ error: 'Offer ID is required' });
      }

      // Get the offer with related data
      const { data: offer, error } = await supabase
        .from('partnership_offers')
        .select(`
          *,
          campaign:campaign_id(*),
          business:business_id(id, name, profile_image, email),
          athlete:athlete_id(id, name, profile_image, sport, school, follower_count, email),
          match:match_id(*)
        `)
        .eq('id', offerId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Check permission to view offer
      const isAuthorized = 
        userRole === 'admin' || 
        userRole === 'compliance' || 
        offer.athlete_id === userId || 
        offer.business_id === userId;

      if (!isAuthorized) {
        return res.status(403).json({ error: 'You do not have permission to view this offer' });
      }

      return res.status(200).json({
        offer
      });
    } catch (error: any) {
      console.error('Get offer error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving offer' });
    }
  }

  /**
   * Create a new offer
   */
  async createOffer(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (userRole !== 'business') {
        return res.status(403).json({ error: 'Only businesses can create offers' });
      }

      const { 
        athlete_id, 
        campaign_id, 
        match_id, 
        compensation_type, 
        offer_amount,
        term,
        usage_rights,
        ...otherFields 
      } = req.body;

      // Validate required fields
      if (!athlete_id || !compensation_type || !offer_amount || !term || !usage_rights) {
        return res.status(400).json({ 
          error: 'Missing required fields (athlete_id, compensation_type, offer_amount, term, usage_rights)' 
        });
      }

      // Calculate expiration date (default 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (otherFields.expires_in_days || 7));

      // Create the offer
      const { data: offer, error: createError } = await supabase
        .from('partnership_offers')
        .insert({
          athlete_id,
          business_id: userId,
          campaign_id,
          match_id,
          compensation_type,
          offer_amount,
          term,
          usage_rights,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          ...otherFields
        })
        .select()
        .single();

      if (createError) {
        return res.status(400).json({ error: 'Failed to create offer' });
      }

      // Create notification for athlete
      await supabase
        .from('notifications')
        .insert({
          user_id: athlete_id,
          type: 'NEW_PARTNERSHIP_OFFER',
          title: 'New Partnership Offer',
          content: `You have received a new partnership offer for ${offer_amount}`,
          reference_type: 'OFFER',
          reference_id: offer.id,
          is_read: false,
          created_at: new Date().toISOString()
        });

      // Send WebSocket notification if available
      if (wsHelpers.broadcastToChannel) {
        wsHelpers.broadcastToChannel(`user:${athlete_id}`, {
          type: 'notification',
          notification: {
            type: 'NEW_PARTNERSHIP_OFFER',
            title: 'New Partnership Offer',
            content: `You have received a new partnership offer`,
            offerId: offer.id
          }
        });
      }

      return res.status(201).json({
        message: 'Offer created successfully',
        offer
      });
    } catch (error: any) {
      console.error('Create offer error:', error);
      return res.status(500).json({ error: error.message || 'Error creating offer' });
    }
  }

  /**
   * Update an offer
   */
  async updateOffer(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const offerId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!offerId) {
        return res.status(400).json({ error: 'Offer ID is required' });
      }

      // Check if offer exists and user has permission
      const { data: existingOffer, error: fetchError } = await supabase
        .from('partnership_offers')
        .select('business_id, status')
        .eq('id', offerId)
        .single();

      if (fetchError) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      if (existingOffer.business_id !== userId) {
        return res.status(403).json({ error: 'You do not have permission to update this offer' });
      }

      // Only allow updating pending offers
      if (existingOffer.status !== 'pending') {
        return res.status(400).json({ error: `Cannot update offer with status ${existingOffer.status}` });
      }

      // Update the offer
      const { data, error } = await supabase
        .from('partnership_offers')
        .update({
          ...req.body,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to update offer' });
      }

      // Notify athlete about the update
      await supabase
        .from('notifications')
        .insert({
          user_id: data.athlete_id,
          type: 'OFFER_UPDATED',
          title: 'Offer Updated',
          content: 'A partnership offer has been updated',
          reference_type: 'OFFER',
          reference_id: offerId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      // Send WebSocket notification if available
      if (wsHelpers.broadcastToChannel) {
        wsHelpers.broadcastToChannel(`user:${data.athlete_id}`, {
          type: 'notification',
          notification: {
            type: 'OFFER_UPDATED',
            title: 'Offer Updated',
            content: 'A partnership offer has been updated',
            offerId: offerId
          }
        });
      }

      return res.status(200).json({
        message: 'Offer updated successfully',
        offer: data
      });
    } catch (error: any) {
      console.error('Update offer error:', error);
      return res.status(500).json({ error: error.message || 'Error updating offer' });
    }
  }

  /**
   * Respond to an offer (accept/decline) as an athlete
   */
  async respondToOffer(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const offerId = req.params.id;
      const { response, message } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!offerId) {
        return res.status(400).json({ error: 'Offer ID is required' });
      }

      if (!response || !['accepted', 'declined', 'countered'].includes(response)) {
        return res.status(400).json({ error: 'Valid response (accepted/declined/countered) is required' });
      }

      // Get the offer to verify ownership
      const { data: offer, error: offerError } = await supabase
        .from('partnership_offers')
        .select('id, athlete_id, business_id, campaign_id, status')
        .eq('id', offerId)
        .single();

      if (offerError || !offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Verify the athlete owns this offer
      if (offer.athlete_id !== userId) {
        return res.status(403).json({ error: 'You do not have permission to respond to this offer' });
      }

      // Check if offer is already responded to
      if (offer.status !== 'pending') {
        return res.status(400).json({ error: `Offer has already been ${offer.status}` });
      }

      // Update offer status
      const { data: updatedOffer, error: updateError } = await supabase
        .from('partnership_offers')
        .update({
          status: response,
          athlete_response: message || null,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update offer status' });
      }

      // Create notification for business
      await supabase
        .from('notifications')
        .insert({
          user_id: offer.business_id,
          type: `OFFER_${response.toUpperCase()}`,
          title: `Offer ${response === 'accepted' ? 'Accepted' : response === 'declined' ? 'Declined' : 'Countered'}`,
          content: `An athlete has ${response} your offer${message ? ': ' + message : ''}`,
          reference_type: 'OFFER',
          reference_id: offerId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      // Send WebSocket notification if available
      if (wsHelpers.broadcastToChannel) {
        wsHelpers.broadcastToChannel(`user:${offer.business_id}`, {
          type: 'notification',
          notification: {
            type: `OFFER_${response.toUpperCase()}`,
            title: `Offer ${response === 'accepted' ? 'Accepted' : response === 'declined' ? 'Declined' : 'Countered'}`,
            content: `An athlete has ${response} your offer`,
            offerId: offerId
          }
        });
      }

      return res.status(200).json({
        message: `Offer ${response} successfully`,
        offer: updatedOffer
      });
    } catch (error: any) {
      console.error('Respond to offer error:', error);
      return res.status(500).json({ error: error.message || 'Error responding to offer' });
    }
  }

  /**
   * Cancel an offer (business only)
   */
  async cancelOffer(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const offerId = req.params.id;
      const { reason } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!offerId) {
        return res.status(400).json({ error: 'Offer ID is required' });
      }

      // Get the offer to verify ownership
      const { data: offer, error: offerError } = await supabase
        .from('partnership_offers')
        .select('id, athlete_id, business_id, status')
        .eq('id', offerId)
        .single();

      if (offerError || !offer) {
        return res.status(404).json({ error: 'Offer not found' });
      }

      // Verify the business owns this offer
      if (offer.business_id !== userId) {
        return res.status(403).json({ error: 'You do not have permission to cancel this offer' });
      }

      // Only allow canceling pending offers
      if (offer.status !== 'pending') {
        return res.status(400).json({ error: `Cannot cancel offer with status ${offer.status}` });
      }

      // Update offer status
      const { data: updatedOffer, error: updateError } = await supabase
        .from('partnership_offers')
        .update({
          status: 'canceled',
          cancellation_reason: reason || null,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ error: 'Failed to cancel offer' });
      }

      // Create notification for athlete
      await supabase
        .from('notifications')
        .insert({
          user_id: offer.athlete_id,
          type: 'OFFER_CANCELED',
          title: 'Offer Canceled',
          content: `An offer has been canceled${reason ? ': ' + reason : ''}`,
          reference_type: 'OFFER',
          reference_id: offerId,
          is_read: false,
          created_at: new Date().toISOString()
        });

      // Send WebSocket notification if available
      if (wsHelpers.broadcastToChannel) {
        wsHelpers.broadcastToChannel(`user:${offer.athlete_id}`, {
          type: 'notification',
          notification: {
            type: 'OFFER_CANCELED',
            title: 'Offer Canceled',
            content: `An offer has been canceled`,
            offerId: offerId
          }
        });
      }

      return res.status(200).json({
        message: 'Offer canceled successfully',
        offer: updatedOffer
      });
    } catch (error: any) {
      console.error('Cancel offer error:', error);
      return res.status(500).json({ error: error.message || 'Error canceling offer' });
    }
  }
}

// Create and export singleton instance
export const offerController = new OfferController();
export default offerController;