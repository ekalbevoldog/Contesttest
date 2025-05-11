/** 050825 - 1420 CST
 * Profile Service
 * 
 * Manages athlete and business profiles.
 * Handles profile creation, updates, and retrieval.
 * Includes profile migration functionality.
 */

import { supabase, supabaseAdmin, getSupabaseAdmin, handleDatabaseError } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Express, Request, Response } from 'express';

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

      if (!error && data) {
        console.log('Found athlete profile by id:', userId);
        return {
          success: true,
          profile: this.formatAthleteProfile(data)
        };
      }
      
      // Try getting by session_id
      const { data: sessionData, error: sessionError } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('session_id', userId)
        .maybeSingle();
        
      if (!sessionError && sessionData) {
        console.log('Found athlete profile by session_id:', userId);
        return {
          success: true,
          profile: this.formatAthleteProfile(sessionData)
        };
      }
      
      // Try getting by user lookup as fallback
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (userData?.id) {
        console.log('Found user id for id:', userData.id);
        const { data: profileData, error: profileError } = await supabase
          .from('athlete_profiles')
          .select('*')
          .eq('id', userData.id)
          .maybeSingle();
          
        if (!profileError && profileData) {
          console.log('Found athlete profile by id lookup');
          return {
            success: true,
            profile: this.formatAthleteProfile(profileData)
          };
        }
      }
      
      console.error('Could not find athlete profile for user:', userId);
      return { 
        success: false, 
        error: 'Athlete profile not found' 
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
      const { data: directProfileMatch, error: directError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (directProfileMatch) {
        console.log('Found business profile directly with id match:', directProfileMatch.id);
        return {
          success: true,
          profile: this.formatBusinessProfile(directProfileMatch)
        };
      }
      
      // Try getting by session_id
      const { data: sessionData, error: sessionError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('session_id', userId)
        .maybeSingle();
        
      if (!sessionError && sessionData) {
        console.log('Found business profile by session_id:', userId);
        return {
          success: true,
          profile: this.formatBusinessProfile(sessionData)
        };
      }
      
      // If direct match fails, try to find user record by id (UUID from Supabase Auth)
      const { data: userById, error: IdError } = await supabase
        .from('users')
        .select('id, email, id')
        .eq('id', userId)
        .maybeSingle();
      
      if (userById) {
        console.log('Found matching user by id search:', userById.id);
        
        // Look up business profile using this user ID as the id field
        const { data: profileByUserId, error: profileError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('id', userById.id)
          .maybeSingle();
          
        if (profileByUserId) {
          console.log('Found business profile through user record:', profileByUserId.id);
          return {
            success: true,
            profile: this.formatBusinessProfile(profileByUserId)
          };
        }
      }
      
      // Try by looping through all users as a last resort
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, email, id');
        
      if (!usersError && allUsers && allUsers.length > 0) {
        // Find user by userId match on either id or id
        const matchingUser = allUsers.find(u => 
          u.id?.toString() === userId || 
          u.id === userId
        );
        
        if (matchingUser) {
          console.log('Found matching user by id search:', matchingUser.id);
          
          // Look up business profile using this user ID as the ID field
          const { data: profileData } = await supabase
            .from('business_profiles')
            .select('*')
            .eq('id', matchingUser.id)
            .maybeSingle();
            
          if (profileData) {
            console.log('Found business profile through user match:', profileData.id);
            return {
              success: true,
              profile: this.formatBusinessProfile(profileData)
            };
          }
        }
      }
      
      console.error('Could not find business profile for user:', userId);
      return { 
        success: false, 
        error: 'Business profile not found' 
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
   * Safely update a user record with profile data, handling potential schema mismatches
   */
  async safelyUpdateUserProfile(userId: string, profileId: string | number, markCompleted: boolean = true): Promise<{ success: boolean, error?: any }> {
    console.log(`Attempting to update user ${userId} with profile ${profileId}`);
    try {
      // Ensure we have supabaseAdmin (if not, get a new instance)
      const adminClient = supabaseAdmin || getSupabaseAdmin();
      
      const { data: columns, error: columnsError } = await adminClient
        .from('users')
        .select('*')
        .limit(1);

      if (columnsError) {
        console.error('Error checking users table schema:', columnsError);
        return { success: false, error: columnsError };
      }

      const updateFields: Record<string, any> = {};
      const sample = columns && columns[0];
      if (sample) {
        if ('profile_id' in sample) {
          updateFields.profile_id = profileId;
        }
        if (markCompleted) {
          if ('profile_completed' in sample) {
            updateFields.profile_completed = true;
          }
          if ('has_completed_profile' in sample) {
            updateFields.has_completed_profile = true;
          }
        }
      } else {
        updateFields.profile_id = profileId;
        if (markCompleted) {
          updateFields.profile_completed = true;
        }
      }

      if (Object.keys(updateFields).length > 0) {
        const { error: updateError } = await adminClient
          .from('users')
          .update(updateFields)
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user profile status:', updateError);
          return { success: false, error: updateError };
        }
      }

      console.log('User record updated successfully');
      return { success: true };
    } catch (err) {
      console.error('Exception when updating user record:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Mark user's profile as completed
   */
  private async markProfileCompleted(userId: string): Promise<void> {
    try {
      // Use the safelyUpdateUserProfile method for consistency
      const result = await this.safelyUpdateUserProfile(userId, userId, true);
      
      if (!result.success) {
        console.error('Error marking profile as completed:', result.error);
      }
    } catch (error) {
      console.error('Exception marking profile as completed:', error);
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
  
  /**
   * Migrate athlete profile session ID to a new UUID
   */
  async migrateAthleteProfileSessionId(sessionId: string, newId: string): Promise<ProfileResult> {
    try {
      console.log(`Migrating athlete profile from session ${sessionId} to user ID ${newId}`);
      
      // Ensure we have supabaseAdmin (if not, get a new instance)
      const adminClient = supabaseAdmin || getSupabaseAdmin();
      
      const { error } = await adminClient
        .from('athlete_profiles')
        .update({ session_id: newId })
        .eq('session_id', sessionId);
      
      if (error) {
        console.error('Error migrating athlete profile session ID:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to migrate athlete profile' 
        };
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('Exception in athlete profile migration:', err);
      return { 
        success: false, 
        error: err.message || 'Unknown error occurred during migration' 
      };
    }
  }
  
  /**
   * Migrate business profile session ID to a new UUID
   */
  async migrateBusinessProfileSessionId(sessionId: string, newId: string): Promise<ProfileResult> {
    try {
      console.log(`Migrating business profile from session ${sessionId} to user ID ${newId}`);
      
      // Ensure we have supabaseAdmin (if not, get a new instance)
      const adminClient = supabaseAdmin || getSupabaseAdmin();
      
      const { error } = await adminClient
        .from('business_profiles')
        .update({ session_id: newId })
        .eq('session_id', sessionId);
      
      if (error) {
        console.error('Error migrating business profile session ID:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to migrate business profile' 
        };
      }
      
      return { success: true };
    } catch (err: any) {
      console.error('Exception in business profile migration:', err);
      return { 
        success: false, 
        error: err.message || 'Unknown error occurred during migration' 
      };
    }
  }
  
  /**
   * Setup profile endpoints
   */
  setupProfileEndpoints(app: Express): void {
    // Create or update a business profile with session_id
    app.post('/api/supabase/business-profile', async (req: Request, res: Response) => {
      const {
        session_id,
        name,
        email,
        phone,
        industry,
        business_type,
        company_size,
        zipcode,
        product_type,
        budgetmin,
        budgetmax,
        haspreviouspartnerships,
        bio,
        operatingLocation,
        company,
        position,
        // ... any other business-specific fields
      } = req.body;

      // session_id may be temp or real UUID
      if (!session_id || !name) {
        return res.status(400).json({ error: 'session_id and name are required' });
      }

      // Build a data object for the business profile
      const businessData = {
        session_id,
        name,
        email,
        phone,
        industry,
        business_type,
        company_size,
        zipcode,
        product_type,
        budgetmin,
        budgetmax,
        haspreviouspartnerships,
        bio,
        operating_location: operatingLocation,
        company,
        position,
        // Add any other fields that were sent
        ...Object.keys(req.body)
          .filter(key => !['session_id', 'name', 'email', 'phone', 'industry', 
                          'business_type', 'company_size', 'zipcode', 'product_type',
                          'budgetmin', 'budgetmax', 'haspreviouspartnerships', 'bio',
                          'operatingLocation', 'company', 'position'].includes(key))
          .reduce((obj, key) => ({ ...obj, [key]: req.body[key] }), {})
      };

      try {
        const result = await this.upsertBusinessProfile(session_id, businessData);

        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }

        return res.status(200).json({ profile: result.profile });
      } catch (err: any) {
        console.error('Exception upserting business profile:', err);
        return res.status(500).json({ 
          error: 'Profile creation failed',
          message: err.message || 'Unknown error occurred'
        });
      }
    });

    // Create or update an athlete profile with session_id
    app.post('/api/supabase/athlete-profile', async (req: Request, res: Response) => {
      const {
        session_id,
        name,
        email,
        phone,
        birthdate,
        gender,
        bio,
        school,
        division,
        graduation_year,
        sport,
        position,
        sport_achievements,
        content_style,
        compensation_goals,
        // ... any other athlete-specific fields
      } = req.body;

      // session_id may be temp or real UUID
      if (!session_id || !name) {
        return res.status(400).json({ error: 'session_id and name are required' });
      }

      // Build a data object for the athlete profile
      const athleteData = {
        session_id,
        name,
        email,
        phone,
        birthdate,
        gender,
        bio,
        school,
        division,
        graduation_year,
        sport,
        position,
        sport_achievements,
        content_style,
        compensation_goals,
        // Add any other fields that were sent
        ...Object.keys(req.body)
          .filter(key => !['session_id', 'name', 'email', 'phone', 'birthdate', 
                          'gender', 'bio', 'school', 'division', 'graduation_year',
                          'sport', 'position', 'sport_achievements', 'content_style',
                          'compensation_goals'].includes(key))
          .reduce((obj, key) => ({ ...obj, [key]: req.body[key] }), {})
      };

      try {
        const result = await this.upsertAthleteProfile(session_id, athleteData);

        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }

        return res.status(200).json({ profile: result.profile });
      } catch (err: any) {
        console.error('Exception upserting athlete profile:', err);
        return res.status(500).json({ 
          error: 'Profile creation failed',
          message: err.message || 'Unknown error occurred'
        });
      }
    });

    // Fetch athlete profile by ID
    app.get('/api/supabase/athlete-profile/:userId', async (req: Request, res: Response) => {
      const { userId } = req.params;
      const result = await this.getAthleteProfile(userId);
      
      if (!result.success) {
        return res.status(404).json({ error: 'Athlete profile not found' });
      }
      
      return res.status(200).json({ profile: result.profile });
    });

    // Fetch business profile by ID
    app.get('/api/supabase/business-profile/:userId', async (req: Request, res: Response) => {
      const { userId } = req.params;
      const result = await this.getBusinessProfile(userId);
      
      if (!result.success) {
        return res.status(404).json({ error: 'Business profile not found' });
      }
      
      return res.status(200).json({ profile: result.profile });
    });

    // Migrate athlete profile session_id → real user UUID
    app.post('/api/supabase/athlete-profile/migrate', async (req: Request, res: Response) => {
      try {
        const { sessionId, newId } = req.body;
        
        if (!sessionId || !newId) {
          return res.status(400).json({ 
            error: 'Missing required parameters',
            message: 'Both sessionId and newId are required' 
          });
        }
        
        const result = await this.migrateAthleteProfileSessionId(sessionId, newId);
        
        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }
        
        return res.status(200).json({ success: true });
      } catch (err: any) {
        console.error('Exception in athlete profile migration endpoint:', err);
        return res.status(500).json({ 
          error: 'Migration failed',
          message: err.message || 'Unknown error occurred'
        });
      }
    });

    // Migrate business profile session_id → real user UUID
    app.post('/api/supabase/business-profile/migrate', async (req: Request, res: Response) => {
      try {
        const { sessionId, newId } = req.body;
        
        if (!sessionId || !newId) {
          return res.status(400).json({ 
            error: 'Missing required parameters',
            message: 'Both sessionId and newId are required' 
          });
        }
        
        const result = await this.migrateBusinessProfileSessionId(sessionId, newId);
        
        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }
        
        return res.status(200).json({ success: true });
      } catch (err: any) {
        console.error('Exception in business profile migration endpoint:', err);
        return res.status(500).json({ 
          error: 'Migration failed',
          message: err.message || 'Unknown error occurred'
        });
      }
    });
  }
}

// Create and export singleton instance
export const profileService = new ProfileService();
export default profileService;