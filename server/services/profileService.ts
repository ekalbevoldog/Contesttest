/** 050825 - 1420 CST
 * Profile Service
 * 
 * Manages athlete and business profiles.
 * Handles profile creation, updates, and retrieval.
 */

import { supabase, handleDatabaseError } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Types for profile data
export interface AthleteProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birthdate?: string;
  gender?: string;
  bio?: string;
  school?: string;
  division?: string;
  graduation_year?: number;
  major?: string;
  gpa?: number;
  sport?: string;
  position?: string;
  sport_achievements?: string;
  follower_count?: number;
  content_style?: string;
  compensation_goals?: string;
  profile_image?: string;
  created_at?: string;
  updated_at: string;
  session_id?: string;
  [key: string]: any;
}

export interface BusinessProfile {
  id: string;
  name: string;
  email?: string;
  industry?: string;
  business_type?: string;
  company_size?: string;
  zipcode?: string;
  product_type?: string;
  audience_goals?: string;
  campaign_vibe?: string;
  values?: string;
  target_schools_sports?: string;
  budget?: string;
  budgetmin?: number;
  budgetmax?: number;
  profile_image?: string;
  created_at?: string;
  updated_at: string;
  session_id?: string;
  [key: string]: any;
}

export interface ProfileResult {
  success: boolean;
  profile?: AthleteProfile | BusinessProfile;
  error?: string;
}

class ProfileService {
  /**
   * Get athlete profile by user ID
   */
  async getAthleteProfile(userId: string): Promise<ProfileResult> {
    try {
      console.log(`Getting athlete profile for user ID: ${userId}`);

      // Try to get the profile directly by ID (new schema)
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error getting athlete profile:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to retrieve athlete profile' 
        };
      }

      if (!data) {
        return { 
          success: false, 
          error: 'Athlete profile not found' 
        };
      }

      return {
        success: true,
        profile: this.formatAthleteProfile(data)
      };
    } catch (error: any) {
      console.error('Exception getting athlete profile:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while retrieving athlete profile'
      };
    }
  }

  /**
   * Get business profile by user ID
   */
  async getBusinessProfile(userId: string): Promise<ProfileResult> {
    try {
      console.log(`Getting business profile for user ID: ${userId}`);

      // Try to get the profile directly by ID (new schema)
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error getting business profile:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to retrieve business profile' 
        };
      }

      if (!data) {
        return { 
          success: false, 
          error: 'Business profile not found' 
        };
      }

      return {
        success: true,
        profile: this.formatBusinessProfile(data)
      };
    } catch (error: any) {
      console.error('Exception getting business profile:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while retrieving business profile'
      };
    }
  }

  /**
   * Create or update athlete profile
   */
  async upsertAthleteProfile(userId: string, profileData: Partial<AthleteProfile>): Promise<ProfileResult> {
    try {
      // Generate a session ID if not provided
      const sessionId = profileData.session_id || uuidv4();

      // Format data for database insert
      const dbProfile: any = {
        id: userId,
        session_id: sessionId,
        ...profileData,
        updated_at: new Date().toISOString()
      };

      // If this is a new profile, add created_at timestamp
      if (!profileData.id) {
        dbProfile.created_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('athlete_profiles')
        .upsert(dbProfile, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting athlete profile:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to save athlete profile' 
        };
      }

      // Update the user record to mark profile as completed
      await this.markProfileCompleted(userId);

      return {
        success: true,
        profile: this.formatAthleteProfile(data)
      };
    } catch (error: any) {
      console.error('Exception upserting athlete profile:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while saving athlete profile'
      };
    }
  }

  /**
   * Create or update business profile
   */
  async upsertBusinessProfile(userId: string, profileData: Partial<BusinessProfile>): Promise<ProfileResult> {
    try {
      // Generate a session ID if not provided
      const sessionId = profileData.session_id || uuidv4();

      // Format data for database insert
      const dbProfile: any = {
        id: userId,
        session_id: sessionId,
        ...profileData,
        updated_at: new Date().toISOString()
      };

      // If this is a new profile, add created_at timestamp
      if (!profileData.id) {
        dbProfile.created_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('business_profiles')
        .upsert(dbProfile, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting business profile:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to save business profile' 
        };
      }

      // Update the user record to mark profile as completed
      await this.markProfileCompleted(userId);

      return {
        success: true,
        profile: this.formatBusinessProfile(data)
      };
    } catch (error: any) {
      console.error('Exception upserting business profile:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while saving business profile'
      };
    }
  }

  /**
   * Upload a profile image
   */
  async uploadProfileImage(userId: string, userType: string, file: Buffer, filename: string): Promise<{ success: boolean, url?: string, error?: string }> {
    try {
      console.log(`Uploading profile image for user ${userId} of type ${userType}`);
      
      // Create the storage key for this user's profile image
      const fileExt = filename.split('.').pop() || 'jpg';
      const storageKey = `profile_images/${userId}/${Date.now()}.${fileExt}`;
      
      // First, check if the 'media' bucket exists, and create it if not
      const { data: buckets } = await supabase.storage.listBuckets();
      const mediaBucket = buckets?.find(bucket => bucket.name === 'media');
      
      if (!mediaBucket) {
        console.log("Media bucket not found, creating it...");
        try {
          const { data, error } = await supabase.storage.createBucket('media', {
            public: true, // Make it publicly accessible
            fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
          });
          
          if (error) {
            console.error("Failed to create media bucket:", error);
            return { 
              success: false, 
              error: "Failed to create storage bucket: " + error.message 
            };
          }
          
          console.log("Successfully created media bucket");
        } catch (error) {
          const bucketError = error as any;
          console.error("Exception creating media bucket:", bucketError);
          return { 
            success: false, 
            error: "Error creating storage bucket: " + (bucketError.message || String(bucketError)) 
          };
        }
      }

      // Upload to Supabase storage
      console.log(`Uploading file to ${storageKey}`);
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storageKey, file, { upsert: true });

      if (uploadError) {
        console.error("File upload error:", uploadError);
        throw uploadError;
      }

      // Get the public URL
      console.log("Getting public URL for uploaded file");
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(storageKey);

      const url = urlData.publicUrl;

      // Update the profile with the new image URL
      const tableName = userType === 'athlete' ? 'athlete_profiles' : 'business_profiles';

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ 
          profile_image: url, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      return { 
        success: true, 
        url 
      };
    } catch (error: any) {
      console.error('Image upload error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to upload image' 
      };
    }
  }

  /**
   * Remove a profile image
   */
  async removeProfileImage(userId: string, userType: string): Promise<{ success: boolean, error?: string }> {
    try {
      const tableName = userType === 'athlete' ? 'athlete_profiles' : 'business_profiles';

      // First, get the current profile image URL
      const { data: profile, error: fetchError } = await supabase
        .from(tableName)
        .select('profile_image')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // If there's an image, delete it from storage
      if (profile?.profile_image) {
        // Extract the storage path from the URL
        const url = new URL(profile.profile_image);
        const pathParts = url.pathname.split('/');
        const storagePath = pathParts.slice(2).join('/'); // Remove initial segments including 'media'

        // Remove the file from storage
        const { error: removeError } = await supabase.storage
          .from('media')
          .remove([storagePath]);

        if (removeError) throw removeError;
      }

      // Update the profile to clear the image reference
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ 
          profile_image: null, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error: any) {
      console.error('Image removal error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to remove profile image' 
      };
    }
  }

  // Helper methods

  /**
   * Mark user's profile as completed
   */
  private async markProfileCompleted(userId: string): Promise<void> {
    try {
      // Check if the users table has a profile_completed field
      const { data: columns } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      // This will help us determine what fields to update
      const sample = columns && columns[0];
      const updateFields: Record<string, any> = {};

      if (sample) {
        if ('profile_completed' in sample) {
          updateFields.profile_completed = true;
        }
        if ('has_completed_profile' in sample) {
          updateFields.has_completed_profile = true;
        }
      } else {
        // Default field to update if we can't detect schema
        updateFields.profile_completed = true;
      }

      // Only update if we have fields to update
      if (Object.keys(updateFields).length > 0) {
        await supabase
          .from('users')
          .update(updateFields)
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error marking profile as completed:', error);
    }
  }

  /**
   * Format athlete profile from database to standard format
   */
  private formatAthleteProfile(dbProfile: any): AthleteProfile {
    if (!dbProfile) return {} as AthleteProfile;

    // Start with all fields from the database
    const profile = { ...dbProfile } as AthleteProfile;

    // Add camelCase versions of snake_case fields for client convenience
    Object.keys(dbProfile).forEach(key => {
      if (key.includes('_')) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        (profile as any)[camelKey] = dbProfile[key];
      }
    });

    return profile;
  }

  /**
   * Format business profile from database to standard format
   */
  private formatBusinessProfile(dbProfile: any): BusinessProfile {
    if (!dbProfile) return {} as BusinessProfile;

    // Start with all fields from the database
    const profile = { ...dbProfile } as BusinessProfile;

    // Add camelCase versions of snake_case fields for client convenience
    Object.keys(dbProfile).forEach(key => {
      if (key.includes('_')) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        (profile as any)[camelKey] = dbProfile[key];
      }
    });

    return profile;
  }
}

// Create and export singleton instance
export const profileService = new ProfileService();
export default profileService;