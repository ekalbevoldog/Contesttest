/**
 * Supabase Profile Service
 * 
 * This module provides functions for managing user profiles in Supabase.
 * Handles profile creation, retrieval, and synchronization between tables.
 */

import { Express, Request, Response } from 'express';
import { supabase, supabaseAdmin, getSupabaseAdmin } from './lib/supabase';

/**
 * Safely update a user record with profile data, handling potential schema mismatches
 */
async function safelyUpdateUserProfile(userId: string, profileId: string | number) {
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
      if ('has_completed_profile' in sample) {
        updateFields.has_completed_profile = true;
      }
    } else {
      updateFields.profile_id = profileId;
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
 * Get athlete profile by user UUID
 */
export async function getAthleteByUserId(userId: string) {
  try {
    // Try getting by id first
    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      console.log('Found athlete profile by uid:', userId);
      return data;
    }
    
    // Try getting by id as fallback
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
        return profileData;
      }
    }
    
    console.error('Could not find athlete profile for user:', userId);
    return null;
  } catch (err) {
    console.error('Exception fetching athlete profile:', err);
    return null;
  }
}

/**
 * Get business profile by user UUID
 */
export async function getBusinessByUserId(userId: string) {
  try {
    console.log('Looking up business profile for user:', userId);
    
    // Try to get business profile directly by the ID field (new schema)
    const { data: directProfileMatch, error: directError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
      
    if (directProfileMatch) {
      console.log('Found business profile directly with id match:', directProfileMatch);
      return directProfileMatch;
    } else if (directError) {
      console.error('Error finding business profile with direct id:', directError);
    }
    
    // If direct match fails, try to find user record by id (UUID from Supabase Auth)
    const { data: userById, error: IdError } = await supabase
      .from('users')
      .select('id, email, id')
      .eq('id', userId)
      .maybeSingle();
    
    if (userById) {
      console.log('Found matching user by id search:', userById);
      
      // Look up business profile using this user ID as the id field (not uid)
      const { data: profileByUserId, error: profileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', userById.id)
        .maybeSingle();
        
      if (profileByUserId) {
        console.log('Found business profile through user record:', profileByUserId);
        return profileByUserId;
      } else if (profileError) {
        console.error('Error finding business profile with direct id:', profileError);
      } else {
        console.log('No business profile found for user ID:', userById.id);
      }
    } else if (IdError) {
      console.log('Error finding user by id:', IdError);
    }
    
    // No need to try direct id lookup, the field name has changed to 'id'
    // Skip this section
    
    // Try by email as fallback
    // First get all users to find our target user
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, id');
      
    if (usersError) {
      console.log('Error fetching users:', usersError);
    } else if (allUsers && allUsers.length > 0) {
      // Find user by userId match on either id or id
      const matchingUser = allUsers.find(u => 
        u.id?.toString() === userId || 
        u.id === userId
      );
      
      if (matchingUser) {
        console.log('Found matching user by id search:', matchingUser);
        
        // Look up business profile using this user ID as the ID field
        const { data: profileData } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('id', matchingUser.id)
          .maybeSingle();
          
        if (profileData) {
          console.log('Found business profile through user match:', profileData);
          return profileData;
        }
      } else {
        console.log('No matching user found in user table search');
      }
    }
    
    console.error('Could not find business profile for user:', userId);
    return null;
  } catch (err) {
    console.error('Exception fetching business profile:', err);
    return null;
  }
}

/**
 * Mirror a completed staging profile into your main athletes/businesses tables
 */
async function syncToDomain(userType: string, profile: any) {
  // Ensure we have supabaseAdmin (if not, get a new instance)
  const adminClient = supabaseAdmin || getSupabaseAdmin();

  if (userType === 'athlete') {
    await adminClient
      .from('athletes')
      .upsert({
        id:          profile.id,
        full_name:        profile.name,
        date_of_birth:    profile.birthdate,
        gender:           profile.gender,
        school:           profile.school,
        school_division:  profile.division,
        graduation_year:  profile.graduation_year,
        sport:            profile.sport,
        position:         profile.position,
        zip_code:         profile.zipcode ?? profile.zip_code,
        bio:              profile.bio,
      }, { onConflict: 'id' });
  } else if (userType === 'business') {
    // Use the primary key 'id' for businesses instead of 'user_id'
    await adminClient
      .from('businesses')
      .upsert({
        id:            profile.id, // Use 'id' instead of 'id'
        company_name:  profile.name,
        email:         profile.email,
        industry:      profile.industry,
        business_type: profile.business_type,
        zip_code:      profile.zipcode ?? profile.zip_code,
      }, { onConflict: 'id' }); // Conflict on 'id' not 'user_id'
  }
}

/**
 * Wire up your profile creation and lookup endpoints
 */
export function setupProfileEndpoints(app: Express) {
  // Create or update a business profile
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
      // Ensure we have supabaseAdmin (if not, get a new instance)
      const adminClient = supabaseAdmin || getSupabaseAdmin();
      
      console.log(`Upserting business profile with session_id: ${session_id}`);
      
      const { data, error } = await adminClient
        .from('business_profiles')
        .upsert(businessData, { onConflict: 'session_id' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting business profile:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ profile: data });
    } catch (err) {
      console.error('Exception upserting business profile:', err);
      return res.status(500).json({ 
        error: 'Profile creation failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  });

  // Create or update an athlete profile
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
      // Ensure we have supabaseAdmin (if not, get a new instance)
      const adminClient = supabaseAdmin || getSupabaseAdmin();
      
      console.log(`Upserting athlete profile with session_id: ${session_id}`);
      
      const { data, error } = await adminClient
        .from('athlete_profiles')
        .upsert(athleteData, { onConflict: 'session_id' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting athlete profile:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ profile: data });
    } catch (err) {
      console.error('Exception upserting athlete profile:', err);
      return res.status(500).json({ 
        error: 'Profile creation failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  });

  // Fetch athlete profile
  app.get('/api/supabase/athlete-profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const profile = await getAthleteByUserId(userId);
    if (!profile) return res.status(404).json({ error: 'Athlete profile not found' });
    return res.status(200).json({ profile });
  });

  // Fetch business profile
  app.get('/api/supabase/business-profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const profile = await getBusinessByUserId(userId);
    if (!profile) return res.status(404).json({ error: 'Business profile not found' });
    return res.status(200).json({ profile });
  });

  // Migrate athlete profile session_id → real user UUID
  app.post('/api/supabase/athlete-profile/migrate', async (req, res) => {
    try {
      const { sessionId, newId } = req.body;
      
      if (!sessionId || !newId) {
        return res.status(400).json({ 
          error: 'Missing required parameters',
          message: 'Both sessionId and newId are required' 
        });
      }

      console.log(`Migrating athlete profile from session ${sessionId} to user ID ${newId}`);
      
      // Ensure we have supabaseAdmin (if not, get a new instance)
      const adminClient = supabaseAdmin || getSupabaseAdmin();
      
      const { error } = await adminClient
        .from('athlete_profiles')
        .update({ session_id: newId })
        .eq('session_id', sessionId);
      
      if (error) {
        console.error('Error migrating athlete profile session ID:', error);
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Exception in athlete profile migration:', err);
      return res.status(500).json({ 
        error: 'Migration failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  });

  // Migrate business profile session_id → real user UUID
  app.post('/api/supabase/business-profile/migrate', async (req, res) => {
    try {
      const { sessionId, newId } = req.body;
      
      if (!sessionId || !newId) {
        return res.status(400).json({ 
          error: 'Missing required parameters',
          message: 'Both sessionId and newId are required' 
        });
      }

      console.log(`Migrating business profile from session ${sessionId} to user ID ${newId}`);
      
      // Ensure we have supabaseAdmin (if not, get a new instance)
      const adminClient = supabaseAdmin || getSupabaseAdmin();
      
      const { error } = await adminClient
        .from('business_profiles')
        .update({ session_id: newId })
        .eq('session_id', sessionId);
      
      if (error) {
        console.error('Error migrating business profile session ID:', error);
        return res.status(500).json({ error: error.message });
      }
      
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Exception in business profile migration:', err);
      return res.status(500).json({ 
        error: 'Migration failed',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  });
}
