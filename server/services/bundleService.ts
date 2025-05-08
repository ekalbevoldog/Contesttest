/** 050825 1626CST
 * Bundle Service
 * 
 * Manages campaign bundles for grouping multiple athletes.
 */

import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Types for bundle data
export interface Bundle {
  id: string;
  name: string;
  description?: string;
  campaign_id: string;
  athlete_ids: string[];
  bundle_type: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
}

// Interface for bundle result
export interface BundleResult {
  success: boolean;
  bundle?: Bundle;
  error?: string;
  message?: string;
}

// Interface for bundle type
export interface BundleType {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: number | null;
}

// Main bundle service class
class BundleService {
  /**
   * Get available bundle types
   */
  getBundleTypes(): BundleType[] {
    // Define standard bundle types
    return [
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
  }

  /**
   * Get bundle by ID
   */
  async getBundle(bundleId: string): Promise<BundleResult> {
    try {
      // Validate input
      if (!bundleId) {
        return { 
          success: false, 
          error: 'Bundle ID is required' 
        };
      }

      // Get the bundle
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .eq('id', bundleId)
        .single();

      if (error) {
        console.error('Error getting bundle:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to retrieve bundle' 
        };
      }

      return {
        success: true,
        bundle: data
      };
    } catch (error: any) {
      console.error('Bundle retrieval exception:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while retrieving bundle'
      };
    }
  }

  /**
   * Get bundles for a campaign
   */
  async getCampaignBundles(campaignId: string): Promise<BundleResult> {
    try {
      // Validate input
      if (!campaignId) {
        return { 
          success: false, 
          error: 'Campaign ID is required' 
        };
      }

      // Get bundles for the campaign
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting campaign bundles:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to retrieve campaign bundles' 
        };
      }

      return {
        success: true,
        bundles: data
      };
    } catch (error: any) {
      console.error('Campaign bundles retrieval exception:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while retrieving campaign bundles'
      };
    }
  }

  /**
   * Create a new bundle
   */
  async createBundle(userId: string, bundleData: Partial<Bundle>): Promise<BundleResult> {
    try {
      // Validate input
      if (!userId) {
        return { 
          success: false, 
          error: 'User ID is required' 
        };
      }

      if (!bundleData.name || !bundleData.campaign_id || !bundleData.athlete_ids) {
        return { 
          success: false, 
          error: 'Name, campaign ID, and athlete IDs are required' 
        };
      }

      // Prepare bundle data
      const bundle = {
        id: uuidv4(),
        name: bundleData.name,
        description: bundleData.description,
        campaign_id: bundleData.campaign_id,
        athlete_ids: bundleData.athlete_ids,
        bundle_type: bundleData.bundle_type || 'standard',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert bundle into database
      const { data, error } = await supabase
        .from('bundles')
        .insert(bundle)
        .select()
        .single();

      if (error) {
        console.error('Error creating bundle:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to create bundle' 
        };
      }

      return {
        success: true,
        bundle: data,
        message: 'Bundle created successfully'
      };
    } catch (error: any) {
      console.error('Bundle creation exception:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while creating bundle'
      };
    }
  }

  /**
   * Update a bundle
   */
  async updateBundle(bundleId: string, userId: string, bundleData: Partial<Bundle>): Promise<BundleResult> {
    try {
      // Validate input
      if (!bundleId || !userId) {
        return { 
          success: false, 
          error: 'Bundle ID and User ID are required' 
        };
      }

      // Check if bundle exists and user has permission
      const { data: existingBundle, error: fetchError } = await supabase
        .from('bundles')
        .select('created_by')
        .eq('id', bundleId)
        .single();

      if (fetchError) {
        console.error('Error checking bundle:', fetchError);
        return { 
          success: false, 
          error: 'Bundle not found' 
        };
      }

      if (existingBundle.created_by !== userId) {
        return { 
          success: false, 
          error: 'You do not have permission to update this bundle' 
        };
      }

      // Prepare update data
      const updateData = {
        ...bundleData,
        updated_at: new Date().toISOString()
      };

      // Update bundle in database
      const { data, error } = await supabase
        .from('bundles')
        .update(updateData)
        .eq('id', bundleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating bundle:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to update bundle' 
        };
      }

      return {
        success: true,
        bundle: data,
        message: 'Bundle updated successfully'
      };
    } catch (error: any) {
      console.error('Bundle update exception:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while updating bundle'
      };
    }
  }

  /**
   * Delete a bundle
   */
  async deleteBundle(bundleId: string, userId: string): Promise<BundleResult> {
    try {
      // Validate input
      if (!bundleId || !userId) {
        return { 
          success: false, 
          error: 'Bundle ID and User ID are required' 
        };
      }

      // Check if bundle exists and user has permission
      const { data: existingBundle, error: fetchError } = await supabase
        .from('bundles')
        .select('created_by')
        .eq('id', bundleId)
        .single();

      if (fetchError) {
        console.error('Error checking bundle:', fetchError);
        return { 
          success: false, 
          error: 'Bundle not found' 
        };
      }

      if (existingBundle.created_by !== userId) {
        return { 
          success: false, 
          error: 'You do not have permission to delete this bundle' 
        };
      }

      // Delete bundle from database
      const { error } = await supabase
        .from('bundles')
        .delete()
        .eq('id', bundleId);

      if (error) {
        console.error('Error deleting bundle:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to delete bundle' 
        };
      }

      return {
        success: true,
        message: 'Bundle deleted successfully'
      };
    } catch (error: any) {
      console.error('Bundle deletion exception:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while deleting bundle'
      };
    }
  }
}

// Create and export singleton instance
export const bundleService = new BundleService();
export default bundleService;