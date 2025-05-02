// services/supabaseProfile.ts
import { Express, Request, Response } from 'express';
import { supabase, supabaseAdmin } from './supabase.js';

/**
 * Safely update a user record with profile data, handling potential schema mismatches
 */
async function safelyUpdateUserProfile(userId: string, profileId: string | number) {
  console.log(`Attempting to update user ${userId} with profile ${profileId}`);
  try {
    const { data: columns, error: columnsError } = await supabaseAdmin
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
      const { error: updateError } = await supabaseAdmin
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
    // Try getting by user_id first
    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      console.log('Found athlete profile by user_id:', userId);
      return data;
    }
    
    // Try getting by auth_id as fallback
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', userId)
      .maybeSingle();
      
    if (userData?.id) {
      console.log('Found user id for auth_id:', userData.id);
      const { data: profileData, error: profileError } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();
        
      if (!profileError && profileData) {
        console.log('Found athlete profile by auth_id lookup');
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
    
    // If direct match fails, try to find user record by auth_id (UUID from Supabase Auth)
    const { data: userByAuthId, error: authIdError } = await supabase
      .from('users')
      .select('id, email, auth_id')
      .eq('auth_id', userId)
      .maybeSingle();
    
    if (userByAuthId) {
      console.log('Found matching user by auth_id search:', userByAuthId);
      
      // Look up business profile using this user ID as the id field (not user_id)
      const { data: profileByUserId, error: profileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', userByAuthId.id)
        .maybeSingle();
        
      if (profileByUserId) {
        console.log('Found business profile through user record:', profileByUserId);
        return profileByUserId;
      } else if (profileError) {
        console.error('Error finding business profile with direct user_id:', profileError);
      } else {
        console.log('No business profile found for user ID:', userByAuthId.id);
      }
    } else if (authIdError) {
      console.log('Error finding user by auth_id:', authIdError);
    }
    
    // No need to try direct user_id lookup, the field name has changed to 'id'
    // Skip this section
    
    // Try by email as fallback
    // First get all users to find our target user
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, auth_id');
      
    if (usersError) {
      console.log('Error fetching users:', usersError);
    } else if (allUsers && allUsers.length > 0) {
      // Find user by userId match on either id or auth_id
      const matchingUser = allUsers.find(u => 
        u.id?.toString() === userId || 
        u.auth_id === userId
      );
      
      if (matchingUser) {
        console.log('Found matching user by id/auth_id search:', matchingUser);
        
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
  if (userType === 'athlete') {
    await supabaseAdmin
      .from('athletes')
      .upsert({
        user_id:          profile.user_id,
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
      }, { onConflict: ['user_id'] });
  } else if (userType === 'business') {
    // Use the primary key 'id' for businesses instead of 'user_id'
    await supabaseAdmin
      .from('businesses')
      .upsert({
        id:            profile.id, // Use 'id' instead of 'user_id'
        company_name:  profile.name,
        email:         profile.email,
        industry:      profile.industry,
        business_type: profile.business_type,
        zip_code:      profile.zipcode ?? profile.zip_code,
      }, { onConflict: ['id'] }); // Conflict on 'id' not 'user_id'
  }
}

/**
 * Wire up your profile creation and lookup endpoints
 */
export function setupProfileEndpoints(app: Express) {
  // Create or update a profile
  app.post('/api/supabase/profile', async (req: Request, res: Response) => {
    const {
      userId,
      userType,
      sessionId,
      name,
      email,
      phone,
      birthdate,
      gender,
      bio,
      school,
      division,
      graduationYear,
      zipcode,
      industry,
      business_type,
      sport,
      position,
      // …add any other fields your form sends…
    } = req.body;

    // Generate defaults for missing fields
    const generatedSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const generatedUserType = userType || (sport ? 'athlete' : 'business');
    
    // Log the situation if fields are missing
    if (!userId || !userType || !sessionId) {
      console.warn(`Profile creation with missing fields: userId=${userId}, userType=${userType}, sessionId=${sessionId}`);
      console.warn('Using generated values where needed');
    }
    
    // Continue with userId if available, otherwise profile creation might still fail
    // but we won't block it at this validation step

    // First, look up the internal user ID if we have an auth_id
    let internalUserId = userId;
    
    try {
      // Check if the userId is from Auth (UUID format)
      if (userId.includes('-') && userId.length > 30) {
        console.log('Looking up internal user ID for auth_id:', userId);
        const { data: userData, error } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', userId)
          .maybeSingle();
          
        if (userData?.id) {
          console.log('Found internal user ID:', userData.id);
          internalUserId = userData.id;
        } else if (error) {
          console.error('Error finding user by auth_id:', error);
        }
      }
    } catch (err) {
      console.error('Error looking up internal user ID:', err);
    }

    // Build a snake_case object for your staging table
    // Note: for business_profiles, the primary identifier is 'id' not 'user_id'
    const base: Record<string, any> = {
      session_id:      generatedSessionId, // Use generated session ID if needed
      name: name || 'Anonymous User', // Provide fallback for required fields
      email,
      phone,
      birthdate,
      gender,
      bio,
      school,
      division,
      graduation_year: graduationYear,
      zipcode,
      industry,
      business_type,
      sport,
      position,
    };
    
    // Add correct ID field based on the table
    if (generatedUserType === 'business') {
      // For business_profiles, it's 'id' not 'user_id'
      base.id = internalUserId;
    } else {
      // For athlete_profiles, it's still 'user_id'
      base.user_id = internalUserId;
    }

    // Choose the correct staging table
    const table = generatedUserType === 'athlete'
      ? 'athlete_profiles'
      : 'business_profiles';

    // Upsert using proper conflict key based on table
    const conflictKey = generatedUserType === 'athlete' ? 'user_id' : 'id';
    console.log(`Using ${conflictKey} as conflict key for ${table} upsert`);
    
    // Double-check that the ID field is present before attempting upsert
    if (!base[conflictKey]) {
      console.error(`[CRITICAL] Missing ${conflictKey} field for ${table} upsert. Data:`, base);
      return res.status(400).json({ 
        error: "Missing required ID field", 
        message: "Profile creation failed due to missing ID field",
        details: "Please contact support with error code: PROFILE-ID-MISSING"
      });
    }
    
    // Log the full profile data for debugging
    console.log(`Attempting profile upsert with data:`, JSON.stringify(base, null, 2));
    
    // Perform the upsert with robust error handling
    try {
      const { data: profile, error } = await supabaseAdmin
        .from(table)
        .upsert(base, { onConflict: conflictKey })
      .select()
      .single();

    if (error) {
      console.error('Profile upsert error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Mirror into domain tables
    try {
      await syncToDomain(generatedUserType, profile);
    } catch (syncError) {
      console.error('[CRITICAL] Error syncing profile to domain table:', syncError);
      // Continue despite sync error - the profile exists in the main table
    }

    // Mark user as having completed their profile
    if (userId) {
      try {
        await safelyUpdateUserProfile(userId, profile.id);
      } catch (updateError) {
        console.error('[WARNING] Error updating user profile status:', updateError);
        // Continue despite error - this is a non-critical update
      }
    } else {
      console.warn('No userId available, skipping profile linkage');
    }

    return res.status(200).json({ profile });
    
    } catch (upsertError) {
      console.error('[CRITICAL] Unexpected error during profile upsert:', upsertError);
      return res.status(500).json({ 
        error: "Profile creation failed",
        message: "An unexpected error occurred",
        details: "Please try again or contact support with error code: PROFILE-UPSERT-FAILED" 
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
}
