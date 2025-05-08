/** 050825 1620CST
 * Bundle Controller
 * 
 * Handles HTTP requests related to campaign bundles.
 * Bundles group multiple athletes together for campaigns.
 */

import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

class BundleController {
  /**
   * Get available bundle types
   */
  async getBundleTypes(req: Request, res: Response) {
    try {
      // Define bundle types - in a real app, these might come from the database
      const bundleTypes = [
        {
          id: 'standard',
          name: 'Standard Bundle',
          description: 'Basic bundle with standard features',
          features: ['Up to 5 athletes', 'Standard campaign analytics', 'Basic reporting'],
          price: 99
        },
        {
          id: 'premium',
          name: 'Premium Bundle',
          description: 'Enhanced bundle with premium features',
          features: ['Up to 15 athletes', 'Advanced analytics', 'Enhanced reporting', 'Priority support'],
          price: 199
        },
        {
          id: 'enterprise',
          name: 'Enterprise Bundle',
          description: 'Full-featured bundle for large campaigns',
          features: ['Unlimited athletes', 'Executive dashboard', 'Comprehensive analytics', 'Dedicated manager'],
          price: 399
        },
        {
          id: 'custom',
          name: 'Custom Bundle',
          description: 'Tailored to your specific needs',
          features: ['Custom athlete count', 'Personalized features', 'Custom analytics'],
          price: null
        }
      ];

      // Return bundle types
      return res.status(200).json({ bundleTypes });
    } catch (error: any) {
      console.error('Get bundle types error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving bundle types' });
    }
  }

  /**
   * Get bundle by ID
   */
  async getBundle(req: Request, res: Response) {
    try {
      const bundleId = req.params.id;

      if (!bundleId) {
        return res.status(400).json({ error: 'Bundle ID is required' });
      }

      // In a real app, this would fetch from the database
      // For now, we'll simulate a database lookup
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .eq('id', bundleId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Bundle not found' });
      }

      return res.status(200).json({ bundle: data });
    } catch (error: any) {
      console.error('Get bundle error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving bundle' });
    }
  }

  /**
   * Create a new bundle
   */
  async createBundle(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { name, description, campaignId, athleteIds, bundleType } = req.body;

      // Validate required fields
      if (!name || !campaignId || !athleteIds || !Array.isArray(athleteIds)) {
        return res.status(400).json({ error: 'Name, campaign ID, and athlete IDs (array) are required' });
      }

      // Create the bundle
      const { data, error } = await supabase
        .from('bundles')
        .insert({
          name,
          description,
          campaign_id: campaignId,
          athlete_ids: athleteIds,
          bundle_type: bundleType || 'standard',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to create bundle' });
      }

      return res.status(201).json({
        message: 'Bundle created successfully',
        bundle: data
      });
    } catch (error: any) {
      console.error('Create bundle error:', error);
      return res.status(500).json({ error: error.message || 'Error creating bundle' });
    }
  }

  /**
   * Update a bundle
   */
  async updateBundle(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const bundleId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!bundleId) {
        return res.status(400).json({ error: 'Bundle ID is required' });
      }

      // Check if bundle exists and user has permission
      const { data: existingBundle, error: fetchError } = await supabase
        .from('bundles')
        .select('created_by')
        .eq('id', bundleId)
        .single();

      if (fetchError) {
        return res.status(404).json({ error: 'Bundle not found' });
      }

      if (existingBundle.created_by !== userId) {
        return res.status(403).json({ error: 'You do not have permission to update this bundle' });
      }

      // Update the bundle
      const { data, error } = await supabase
        .from('bundles')
        .update({
          ...req.body,
          updated_at: new Date().toISOString()
        })
        .eq('id', bundleId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to update bundle' });
      }

      return res.status(200).json({
        message: 'Bundle updated successfully',
        bundle: data
      });
    } catch (error: any) {
      console.error('Update bundle error:', error);
      return res.status(500).json({ error: error.message || 'Error updating bundle' });
    }
  }

  /**
   * Delete a bundle
   */
  async deleteBundle(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const bundleId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!bundleId) {
        return res.status(400).json({ error: 'Bundle ID is required' });
      }

      // Check if bundle exists and user has permission
      const { data: existingBundle, error: fetchError } = await supabase
        .from('bundles')
        .select('created_by')
        .eq('id', bundleId)
        .single();

      if (fetchError) {
        return res.status(404).json({ error: 'Bundle not found' });
      }

      if (existingBundle.created_by !== userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this bundle' });
      }

      // Delete the bundle
      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', bundleId);

      if (error) {
        return res.status(400).json({ error: 'Failed to delete bundle' });
      }

      return res.status(200).json({
        message: 'Bundle deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete bundle error:', error);
      return res.status(500).json({ error: error.message || 'Error deleting bundle' });
    }
  }
}

// Create and export singleton instance
export const bundleController = new BundleController();
export default bundleController;