// services/supabaseProfile.ts
import { Express, Request, Response } from 'express';
import { supabase, supabaseAdmin } from './supabase';

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
    
    // First try to find user record by auth_id (UUID from Supabase Auth)
    const { data: userByAuthId, error: authIdError } = await supabase
      .from('users')
      .select('id, email, auth_id')
      .eq('auth_id', userId)
      .maybeSingle();
    
    if (userByAuthId) {
      console.log('Found user record by auth_id:', userByAuthId);
      
      // Look up business profile using this user ID
      const { data: profileByUserId, error: profileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userByAuthId.id)
        .maybeSingle();
        
      if (profileByUserId) {
        console.log('Found business profile through user record:', profileByUserId);
        return profileByUserId;
      } else if (profileError) {
        console.log('Error finding business profile with user ID:', profileError);
      } else {
        console.log('No business profile found for user ID:', userByAuthId.id);
      }
    } else if (authIdError) {
      console.log('Error finding user by auth_id:', authIdError);
    }
    
    // Try direct lookup by user_id as UUID
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      console.log('Found business profile by direct user_id match:', userId);
      return data;
    } else if (error) {
      console.log('Error finding business profile with direct user_id:', error);
    }
    
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
        
        // Look up business profile using this user ID
        const { data: profileData } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', matchingUser.id)
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
    await supabaseAdmin
      .from('businesses')
      .upsert({
        user_id:       profile.user_id,
        company_name:  profile.name,
        email:         profile.email,
        industry:      profile.industry,
        business_type: profile.business_type,
        zip_code:      profile.zipcode ?? profile.zip_code,
      }, { onConflict: ['user_id'] });
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

    if (!userId || !userType || !sessionId) {
      return res.status(400).json({ error: 'Missing userId, userType or sessionId' });
    }

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
    const base: Record<string, any> = {
      session_id:      sessionId,
      user_id:         internalUserId, // Now using the correct internal ID
      name,
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

    // Choose the correct staging table
    const table = userType === 'athlete'
      ? 'athlete_profiles'
      : 'business_profiles';

    // Upsert into staging by session_id
    const { data: profile, error } = await supabaseAdmin
      .from(table)
      .upsert(base, { onConflict: ['session_id'] })
      .select()
      .single();

    if (error) {
      console.error('Profile upsert error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Mirror into domain tables
    await syncToDomain(userType, profile);

    // Mark user as having completed their profile
    await safelyUpdateUserProfile(userId, profile.id);

    return res.status(200).json({ profile });
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
