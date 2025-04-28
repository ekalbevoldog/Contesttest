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
    // Try getting by user_id first
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      console.log('Found business profile by user_id:', userId);
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
        .from('business_profiles')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();
        
      if (!profileError && profileData) {
        console.log('Found business profile by auth_id lookup');
        return profileData;
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

    // Build a snake_case object for your staging table
    const base: Record<string, any> = {
      session_id:      sessionId,
      user_id:         userId,
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
