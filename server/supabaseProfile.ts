import { Request, Response } from "express";
import { Express } from "express";
import { supabase } from './supabase';

export function setupProfileEndpoints(app: Express) {
  // CREATE PROFILE ENDPOINT
  app.post("/api/supabase/profile", async (req: Request, res: Response) => {
    try {
      const { userId, email, name, userType, ...otherData } = req.body;
      
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
        
        // Insert into Supabase athlete_profiles table
        const { data: profile, error } = await supabase
          .from('athlete_profiles')
          .insert(athleteProfile)
          .select()
          .single();
          
        if (error) {
          console.error('Error creating athlete profile:', error);
          return res.status(500).json({ 
            error: 'Failed to create athlete profile', 
            details: error.message 
          });
        }
        
        // Update the users table to mark profile as completed
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            has_completed_profile: true,
            profile_id: profile.id 
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating user profile status:', updateError);
          // Continue anyway since the profile was created
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
        
        // Insert into Supabase business_profiles table
        const { data: profile, error } = await supabase
          .from('business_profiles')
          .insert(businessProfile)
          .select()
          .single();
          
        if (error) {
          console.error('Error creating business profile:', error);
          return res.status(500).json({ 
            error: 'Failed to create business profile', 
            details: error.message 
          });
        }
        
        // Update the users table to mark profile as completed
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            has_completed_profile: true,
            profile_id: profile.id 
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Error updating user profile status:', updateError);
          // Continue anyway since the profile was created
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