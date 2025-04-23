import { Request, Response } from "express";
import { Express } from "express";
import { supabase } from './supabase';

/**
 * Safely update a user record with profile data, handling potential schema mismatches
 */
async function safelyUpdateUserProfile(userId: string, profileId: string | number) {
  console.log(`Attempting to update user ${userId} with profile ${profileId}`);
  
  try {
    // First check which columns actually exist in the users table
    const { data: columns, error: columnsError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (columnsError) {
      console.error('Error checking users table schema:', columnsError);
      return { success: false, error: columnsError };
    } 
    
    // Only include fields that we know exist in our update
    const updateFields: Record<string, any> = {};
    
    // First sample record shows us available columns
    if (columns && columns.length > 0) {
      const sampleRecord = columns[0];
      
      // Check if these fields exist in the schema
      if ('profile_id' in sampleRecord) {
        updateFields.profile_id = profileId;
      }
      
      if ('has_completed_profile' in sampleRecord) {
        updateFields.has_completed_profile = true;
      }
    } else {
      // We couldn't get schema info, just try with profile_id
      updateFields.profile_id = profileId;
    }
    
    console.log('Updating user record with:', updateFields);
    
    // Only do the update if we have fields to update
    if (Object.keys(updateFields).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating user profile status:', updateError);
        console.log('Error details:', updateError.details);
        console.log('Error hint:', updateError.hint);
        return { success: false, error: updateError };
      }
      
      console.log('User record updated successfully');
      return { success: true };
    }
    
    return { success: true, message: 'No fields to update' };
  } catch (updateErr) {
    console.error('Exception when updating user record:', updateErr);
    return { success: false, error: updateErr };
  }
}

export function setupProfileEndpoints(app: Express) {
  // CREATE PROFILE ENDPOINT
  app.post("/api/supabase/profile", async (req: Request, res: Response) => {
    try {
      const { userId, email, name, userType, sessionId = null, ...otherData } = req.body;
      
      console.log(`Creating ${userType} profile for user ID ${userId}`);
      
      if (!userId || !userType) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          details: 'userId and userType are required'
        });
      }
      
      if (userType === 'athlete') {
        // Transform the data to match our table schema
        // Ensure we're using snake_case for field names as that's what our tables use
        const athleteProfile = {
          user_id: userId,
          name: name || email?.split('@')[0] || 'Athlete',
          email: email,
          
          // Map form fields to schema fields
          school: otherData.school || 'Unknown',
          division: otherData.division || 'Unknown',
          sport: otherData.sport || 'Unknown',
          
          // Social and engagement metrics
          follower_count: otherData.followerCount || 0,
          social_handles: otherData.socialHandles,
          average_engagement_rate: otherData.averageEngagementRate,
          
          // Content preferences
          content_style: otherData.contentStyle || 'Authentic',
          content_types: otherData.contentTypes,
          
          // Compensation
          compensation_goals: otherData.compensationGoals || 'Fair compensation',
          
          // Demographics and personal data
          birthdate: otherData.birthdate,
          gender: otherData.gender,
          bio: otherData.bio,
          
          // Academic info
          graduation_year: otherData.graduationYear,
          major: otherData.major,
          gpa: otherData.gpa,
          academic_honors: otherData.academicHonors,
          
          // Athletic specifics
          position: otherData.position,
          sport_achievements: otherData.sportAchievements,
          
          // Preferences
          preferred_product_categories: otherData.preferredProductCategories,
          personal_values: otherData.personalValues,
          causes: otherData.causes,
          
          // Availability
          minimum_compensation: otherData.minimumCompensation,
          availability_timeframe: otherData.availabilityTimeframe,
          
          created_at: new Date(),
          updated_at: new Date()
        };
        
        console.log('Creating athlete profile with data:', athleteProfile);
        
        console.log('Attempting to insert athlete profile into table...');
        // Try to insert into Supabase athlete_profiles table
        let profile;
        let error;
        
        try {
          // First check if the table exists and has the right structure
          const { data: tableCheck, error: tableError } = await supabase
            .from('athlete_profiles')
            .select('*')
            .limit(1);
            
          if (tableError) {
            console.error('Error checking athlete_profiles table:', tableError);
            if (tableError.message.includes('does not exist')) {
              return res.status(500).json({
                error: 'Database table does not exist',
                details: 'The athlete_profiles table has not been created yet'
              });
            }
          }
          
          // Now try the insert
          const result = await supabase
            .from('athlete_profiles')
            .insert(athleteProfile)
            .select()
            .single();
            
          profile = result.data;
          error = result.error;
        } catch (insertError) {
          console.error('Exception during profile insert:', insertError);
          return res.status(500).json({
            error: 'Database error during profile creation',
            details: insertError instanceof Error ? insertError.message : 'Unknown error'
          });
        }
          
        if (error) {
          console.error('Error creating athlete profile:', error);
          return res.status(500).json({ 
            error: 'Failed to create athlete profile', 
            details: error.message 
          });
        }
        
        // Update the users table to mark profile as completed using our safe function
        const updateResult = await safelyUpdateUserProfile(userId, profile.id);
        
        if (!updateResult.success) {
          console.error('User profile record update failed, but continuing since profile was created');
        }
        
        console.log('Athlete profile created successfully');
        return res.status(201).json({ 
          message: 'Athlete profile created successfully', 
          profile 
        });
        
      } else if (userType === 'business') {
        // Transform business data to match our table schema
        const businessProfile = {
          user_id: userId,
          name: name || email?.split('@')[0] || 'Business',
          email: email,
          
          // Business type info
          industry: otherData.industry,
          business_type: otherData.businessType,
          company_size: otherData.businessSize,
          
          // Product info
          product_type: otherData.productType || 'product',
          
          // Campaign details
          audience_goals: otherData.audienceGoals || otherData.goalIdentification?.join(', ') || 'Increasing brand awareness',
          campaign_vibe: otherData.campaignVibe || 'Professional',
          values: otherData.values || 'Quality, authenticity',
          
          // Target info
          target_schools_sports: otherData.targetSchoolsSports || 'All',
          
          // Budget
          budget: otherData.budget || `$${otherData.budgetMin || 0} - $${otherData.budgetMax || 5000}`,
          budgetMin: otherData.budgetMin,
          budgetMax: otherData.budgetMax,
          
          // Location
          zipCode: otherData.zipCode,
          
          // Experience
          hasPreviousPartnerships: otherData.hasPastPartnership,
          
          // Additional preferences as JSON
          preferences: otherData.preferences || JSON.stringify({
            contactInfo: {
              name: name,
              title: otherData.contactTitle,
              email: email,
              phone: otherData.contactPhone
            },
            operatingLocation: otherData.operatingLocation,
            accessRestriction: otherData.accessRestriction
          }),
          
          created_at: new Date(),
          updated_at: new Date()
        };
        
        console.log('Creating business profile with data:', businessProfile);
        
        console.log('Attempting to insert business profile into table...');
        // Try to insert into Supabase business_profiles table
        let profile;
        let error;
        
        try {
          // First check if the table exists and has the right structure
          const { data: tableCheck, error: tableError } = await supabase
            .from('business_profiles')
            .select('*')
            .limit(1);
            
          if (tableError) {
            console.error('Error checking business_profiles table:', tableError);
            if (tableError.message.includes('does not exist')) {
              return res.status(500).json({
                error: 'Database table does not exist',
                details: 'The business_profiles table has not been created yet'
              });
            }
          }
          
          // Now try the insert
          const result = await supabase
            .from('business_profiles')
            .insert(businessProfile)
            .select()
            .single();
            
          profile = result.data;
          error = result.error;
        } catch (insertError) {
          console.error('Exception during profile insert:', insertError);
          return res.status(500).json({
            error: 'Database error during profile creation',
            details: insertError instanceof Error ? insertError.message : 'Unknown error'
          });
        }
          
        if (error) {
          console.error('Error creating business profile:', error);
          return res.status(500).json({ 
            error: 'Failed to create business profile', 
            details: error.message 
          });
        }
        
        // Update the users table to mark profile as completed using our safe function
        const updateResult = await safelyUpdateUserProfile(userId, profile.id);
        
        if (!updateResult.success) {
          console.error('User profile record update failed, but continuing since profile was created');
        }
        
        console.log('Business profile created successfully');
        return res.status(201).json({ 
          message: 'Business profile created successfully', 
          profile 
        });
      } else {
        return res.status(400).json({ 
          error: 'Invalid user type', 
          details: `User type "${userType}" not supported`
        });
      }
    } catch (error) {
      console.error('Error in profile creation:', error);
      return res.status(500).json({ 
        error: 'Failed to create profile', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Other profile-related endpoints can be added here
}