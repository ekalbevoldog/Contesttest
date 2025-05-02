import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Get user profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get profile data based on user role
    const userRole = req.user.role?.toLowerCase() || 'user';
    
    let profileData = null;
    
    if (userRole === 'athlete') {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) throw error;
      profileData = data;
    } else if (userRole === 'business') {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) throw error;
      profileData = data;
    } else {
      // General user profile
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      profileData = data;
    }
    
    // If no profile exists, just return basic user data
    if (!profileData) {
      return res.json({
        id: userId,
        name: req.user.name || req.user.username,
        email: req.user.email,
      });
    }
    
    // Return the profile data
    return res.json({
      ...profileData,
      user_id: userId,
      role: userRole,
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({
      error: 'Failed to get profile',
      details: error.message
    });
  }
});

// Update user profile
router.patch('/', requireAuth, async (req, res) => {
  try {
    console.log('[ProfileRoutes] Processing profile update request');
    
    // Get user ID, handle both id formats (direct id and auth_id)
    const userId = req.user.id;
    const authId = req.user.auth_id || req.user.id;
    const userEmail = req.user.email;
    
    // Get user role with fallback
    const userRole = req.user.role?.toLowerCase() || 'user';
    
    console.log(`[ProfileRoutes] Update profile for user ${userId} (${userEmail}) with role ${userRole}`);
    
    // Extract profile data, remove profile_image if present
    const { profile_image, ...profileData } = req.body;
    
    // Format profile data for database
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    };
    
    let result;
    
    // Log the profile table being used
    console.log(`[ProfileRoutes] Using ${userRole}_profiles table for profile update`);
    
    if (userRole === 'athlete') {
      // First try with direct ID
      let { data: existingProfile, error: lookupError } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      // If not found with direct ID, try with auth_id
      if (lookupError && authId !== userId) {
        console.log(`[ProfileRoutes] Athlete profile not found with user_id ${userId}, trying with auth_id ${authId}`);
        const { data: profileByAuthId } = await supabase
          .from('athlete_profiles')
          .select('id')
          .eq('user_id', authId)
          .single();
          
        if (profileByAuthId) {
          existingProfile = profileByAuthId;
          lookupError = null;
        }
      }
      
      // Also try with direct ID match if neither option worked
      if (lookupError) {
        console.log(`[ProfileRoutes] Athlete profile not found with either user_id or auth_id, trying with id ${userId}`);
        const { data: profileById } = await supabase
          .from('athlete_profiles')
          .select('id')
          .eq('id', userId)
          .single();
          
        if (profileById) {
          existingProfile = profileById;
          lookupError = null;
        }
      }
      
      if (existingProfile) {
        console.log(`[ProfileRoutes] Updating existing athlete profile for ${userId}`);
        
        // Try updating with direct user_id match first
        let updateResult = await supabase
          .from('athlete_profiles')
          .update(updateData)
          .eq('user_id', userId)
          .select();
          
        // If no rows were affected and we have an auth_id, try that
        if (updateResult.count === 0 && authId !== userId) {
          console.log(`[ProfileRoutes] No rows updated with user_id ${userId}, trying auth_id ${authId}`);
          updateResult = await supabase
            .from('athlete_profiles')
            .update(updateData)
            .eq('user_id', authId)
            .select();
        }
        
        // If still no rows affected, try direct ID match
        if (updateResult.count === 0) {
          console.log(`[ProfileRoutes] No rows updated with either user_id or auth_id, trying direct id match`);
          updateResult = await supabase
            .from('athlete_profiles')
            .update(updateData)
            .eq('id', userId)
            .select();
        }
        
        if (updateResult.error) {
          console.error(`[ProfileRoutes] Error updating athlete profile:`, updateResult.error);
          throw updateResult.error;
        }
        
        result = updateResult.data?.[0] || null;
      } else {
        // Create new profile
        console.log(`[ProfileRoutes] Creating new athlete profile for ${userId}`);
        
        const insertData = {
          ...updateData,
          user_id: userId,
          id: userId, // Also set ID directly for lookup
          email: userEmail, // Add email for consistency
          created_at: new Date().toISOString(),
        };
        
        const { data, error } = await supabase
          .from('athlete_profiles')
          .insert(insertData)
          .select()
          .single();
          
        if (error) {
          console.error(`[ProfileRoutes] Error creating athlete profile:`, error);
          throw error;
        }
        
        result = data;
      }
    } else if (userRole === 'business') {
      // First try with direct ID
      let { data: existingProfile, error: lookupError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      // If not found with direct ID, try with auth_id
      if (lookupError && authId !== userId) {
        console.log(`[ProfileRoutes] Business profile not found with user_id ${userId}, trying with auth_id ${authId}`);
        const { data: profileByAuthId } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('user_id', authId)
          .single();
          
        if (profileByAuthId) {
          existingProfile = profileByAuthId;
          lookupError = null;
        }
      }
      
      // Also try with direct ID match if neither option worked
      if (lookupError) {
        console.log(`[ProfileRoutes] Business profile not found with either user_id or auth_id, trying with id ${userId}`);
        const { data: profileById } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('id', userId)
          .single();
          
        if (profileById) {
          existingProfile = profileById;
          lookupError = null;
        }
      }
      
      if (existingProfile) {
        console.log(`[ProfileRoutes] Updating existing business profile for ${userId}`);
        
        // Try updating with direct user_id match first
        let updateResult = await supabase
          .from('business_profiles')
          .update(updateData)
          .eq('user_id', userId)
          .select();
          
        // If no rows were affected and we have an auth_id, try that
        if (updateResult.count === 0 && authId !== userId) {
          console.log(`[ProfileRoutes] No rows updated with user_id ${userId}, trying auth_id ${authId}`);
          updateResult = await supabase
            .from('business_profiles')
            .update(updateData)
            .eq('user_id', authId)
            .select();
        }
        
        // If still no rows affected, try direct ID match
        if (updateResult.count === 0) {
          console.log(`[ProfileRoutes] No rows updated with either user_id or auth_id, trying direct id match`);
          updateResult = await supabase
            .from('business_profiles')
            .update(updateData)
            .eq('id', userId)
            .select();
        }
        
        if (updateResult.error) {
          console.error(`[ProfileRoutes] Error updating business profile:`, updateResult.error);
          throw updateResult.error;
        }
        
        result = updateResult.data?.[0] || null;
      } else {
        // Create new profile
        console.log(`[ProfileRoutes] Creating new business profile for ${userId}`);
        
        const insertData = {
          ...updateData,
          user_id: userId,
          id: userId, // Also set ID directly for lookup
          email: userEmail, // Add email for consistency
          created_at: new Date().toISOString(),
        };
        
        const { data, error } = await supabase
          .from('business_profiles')
          .insert(insertData)
          .select()
          .single();
          
        if (error) {
          console.error(`[ProfileRoutes] Error creating business profile:`, error);
          throw error;
        }
        
        result = data;
      }
    } else {
      // Handle general user profile with the same robust approach
      let { data: existingProfile, error: lookupError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      // Try additional lookup methods
      if (lookupError) {
        // Try with auth_id
        if (authId !== userId) {
          const { data: profileByAuthId } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', authId)
            .single();
            
          if (profileByAuthId) {
            existingProfile = profileByAuthId;
            lookupError = null;
          }
        }
        
        // Try with direct ID
        if (lookupError) {
          const { data: profileById } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', userId)
            .single();
            
          if (profileById) {
            existingProfile = profileById;
            lookupError = null;
          }
        }
      }
      
      if (existingProfile) {
        console.log(`[ProfileRoutes] Updating existing user profile for ${userId}`);
        
        // Try multiple update strategies
        let updateResult = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', userId)
          .select();
          
        if (updateResult.count === 0 && authId !== userId) {
          updateResult = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('user_id', authId)
            .select();
        }
        
        if (updateResult.count === 0) {
          updateResult = await supabase
            .from('user_profiles')
            .update(updateData)
            .eq('id', userId)
            .select();
        }
        
        if (updateResult.error) throw updateResult.error;
        result = updateResult.data?.[0] || null;
      } else {
        // Create new profile
        console.log(`[ProfileRoutes] Creating new user profile for ${userId}`);
        
        const insertData = {
          ...updateData,
          user_id: userId,
          id: userId,
          email: userEmail,
          created_at: new Date().toISOString(),
        };
        
        const { data, error } = await supabase
          .from('user_profiles')
          .insert(insertData)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
    }
    
    // Update user record if name or email changed
    if (profileData.name || profileData.email) {
      try {
        const userUpdateData = {};
        if (profileData.name) userUpdateData.name = profileData.name;
        if (profileData.email) userUpdateData.email = profileData.email;
        
        console.log(`[ProfileRoutes] Updating user record with name/email changes`);
        
        // Try multiple update strategies for the user record
        const userUpdateResult = await supabase
          .from('users')
          .update(userUpdateData)
          .eq('id', userId);
          
        if (userUpdateResult.error) {
          console.warn(`[ProfileRoutes] Error updating user record:`, userUpdateResult.error);
          // Non-fatal error, continue
        }
      } catch (userUpdateError) {
        console.warn(`[ProfileRoutes] Error updating user record:`, userUpdateError);
        // Non-fatal error, continue with response
      }
    }
    
    // Log success
    console.log(`[ProfileRoutes] Profile update successful for user ${userId}`);
    
    // Return the updated profile
    return res.json({
      ...result,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('[ProfileRoutes] Error updating profile:', error);
    return res.status(500).json({
      error: 'Failed to update profile',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Upload profile image
router.post('/upload-image', requireAuth, upload.single('profile_image'), async (req, res) => {
  try {
    console.log('[ProfileRoutes] Processing profile image upload request');
    
    // Get user ID, handle both id formats (direct id and auth_id)
    const userId = req.user.id;
    const authId = req.user.auth_id || req.user.id;
    const userEmail = req.user.email;
    
    // Get user role with fallback
    const userRole = req.user.role?.toLowerCase() || 'user';
    
    console.log(`[ProfileRoutes] Upload profile image for user ${userId} (${userEmail}) with role ${userRole}`);
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }
    
    // Get the file path
    const filePath = req.file.path;
    const fileName = req.file.filename;
    
    console.log(`[ProfileRoutes] Image file received: ${fileName} (${req.file.mimetype})`);
    
    // Upload to Supabase Storage
    const uniqueFileName = `profile_images/${userId}/${fileName}`;
    
    const fileData = fs.readFileSync(filePath);
    
    console.log(`[ProfileRoutes] Uploading file to Supabase storage: ${uniqueFileName}`);
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(uniqueFileName, fileData, {
        contentType: req.file.mimetype,
        upsert: true
      });
    
    if (error) {
      console.error(`[ProfileRoutes] Error uploading to Supabase storage:`, error);
      throw error;
    }
    
    console.log(`[ProfileRoutes] Image uploaded successfully to Supabase storage`);
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(uniqueFileName);
    
    const imageUrl = publicUrlData.publicUrl;
    
    console.log(`[ProfileRoutes] Image public URL: ${imageUrl}`);
    
    // Update the user's profile with the image URL
    let tableName;
    if (userRole === 'athlete') {
      tableName = 'athlete_profiles';
    } else if (userRole === 'business') {
      tableName = 'business_profiles';
    } else {
      tableName = 'user_profiles';
    }
    
    console.log(`[ProfileRoutes] Updating ${tableName} table with image URL`);
    
    // Use a more robust approach to check and update the profile
    
    // First try with direct ID
    let { data: existingProfile, error: lookupError } = await supabase
      .from(tableName)
      .select('id')
      .eq('user_id', userId)
      .single();
    
    // If not found with direct ID, try with auth_id
    if (lookupError && authId !== userId) {
      console.log(`[ProfileRoutes] Profile not found with user_id ${userId}, trying with auth_id ${authId}`);
      const { data: profileByAuthId } = await supabase
        .from(tableName)
        .select('id')
        .eq('user_id', authId)
        .single();
        
      if (profileByAuthId) {
        existingProfile = profileByAuthId;
        lookupError = null;
      }
    }
    
    // Also try with direct ID match if neither option worked
    if (lookupError) {
      console.log(`[ProfileRoutes] Profile not found with either user_id or auth_id, trying with id ${userId}`);
      const { data: profileById } = await supabase
        .from(tableName)
        .select('id')
        .eq('id', userId)
        .single();
        
      if (profileById) {
        existingProfile = profileById;
        lookupError = null;
      }
    }
    
    const updateData = {
      profile_image: imageUrl,
      updated_at: new Date().toISOString()
    };
    
    if (existingProfile) {
      console.log(`[ProfileRoutes] Updating existing profile with image URL`);
      
      // Try updating with direct user_id match first
      let updateResult = await supabase
        .from(tableName)
        .update(updateData)
        .eq('user_id', userId);
        
      // If no rows were affected and we have an auth_id, try that
      if (updateResult.count === 0 && authId !== userId) {
        console.log(`[ProfileRoutes] No rows updated with user_id ${userId}, trying auth_id ${authId}`);
        updateResult = await supabase
          .from(tableName)
          .update(updateData)
          .eq('user_id', authId);
      }
      
      // If still no rows affected, try direct ID match
      if (updateResult.count === 0) {
        console.log(`[ProfileRoutes] No rows updated with either user_id or auth_id, trying direct id match`);
        updateResult = await supabase
          .from(tableName)
          .update(updateData)
          .eq('id', userId);
      }
      
      if (updateResult.error) {
        console.error(`[ProfileRoutes] Error updating profile with image URL:`, updateResult.error);
        throw updateResult.error;
      }
    } else {
      // Create new profile with the image URL
      console.log(`[ProfileRoutes] Creating new profile with image URL`);
      
      const insertData = {
        user_id: userId,
        id: userId, // Also set ID directly for lookup
        email: userEmail,
        profile_image: imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const insertResult = await supabase
        .from(tableName)
        .insert(insertData);
        
      if (insertResult.error) {
        console.error(`[ProfileRoutes] Error creating profile with image URL:`, insertResult.error);
        throw insertResult.error;
      }
    }
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    
    console.log(`[ProfileRoutes] Profile image upload and update completed successfully`);
    
    return res.json({
      message: 'Image uploaded successfully',
      imageUrl
    });
  } catch (error) {
    console.error('[ProfileRoutes] Error uploading profile image:', error);
    
    // Clean up the temporary file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({
      error: 'Failed to upload profile image',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Remove profile image
router.delete('/remove-image', requireAuth, async (req, res) => {
  try {
    console.log('[ProfileRoutes] Processing profile image removal request');
    
    // Get user ID, handle both id formats (direct id and auth_id)
    const userId = req.user.id;
    const authId = req.user.auth_id || req.user.id;
    
    // Get user role with fallback
    const userRole = req.user.role?.toLowerCase() || 'user';
    
    console.log(`[ProfileRoutes] Removing profile image for user ${userId} with role ${userRole}`);
    
    // Determine which table to update
    let tableName;
    if (userRole === 'athlete') {
      tableName = 'athlete_profiles';
    } else if (userRole === 'business') {
      tableName = 'business_profiles';
    } else {
      tableName = 'user_profiles';
    }
    
    console.log(`[ProfileRoutes] Using ${tableName} table for image removal`);
    
    // Try multiple lookup approaches to find the profile
    let profile = null;
    let lookupError = null;
    
    // First try with direct user_id
    const { data: profileByUserId, error: userIdError } = await supabase
      .from(tableName)
      .select('profile_image')
      .eq('user_id', userId)
      .single();
      
    if (userIdError) {
      lookupError = userIdError;
      
      // Try with auth_id if different
      if (authId !== userId) {
        console.log(`[ProfileRoutes] Profile not found with user_id ${userId}, trying with auth_id ${authId}`);
        const { data: profileByAuthId, error: authIdError } = await supabase
          .from(tableName)
          .select('profile_image')
          .eq('user_id', authId)
          .single();
          
        if (!authIdError && profileByAuthId) {
          profile = profileByAuthId;
          lookupError = null;
        }
      }
      
      // If still not found, try with direct ID
      if (lookupError) {
        console.log(`[ProfileRoutes] Profile not found with either user_id or auth_id, trying with id ${userId}`);
        const { data: profileById, error: idError } = await supabase
          .from(tableName)
          .select('profile_image')
          .eq('id', userId)
          .single();
          
        if (!idError && profileById) {
          profile = profileById;
          lookupError = null;
        }
      }
    } else {
      profile = profileByUserId;
    }
    
    // If we found a profile with an image, remove it from storage
    if (profile && profile.profile_image) {
      console.log(`[ProfileRoutes] Found profile with image: ${profile.profile_image}`);
      
      try {
        // Extract the path from the URL
        const urlPath = new URL(profile.profile_image).pathname;
        const storagePath = urlPath.split('/').slice(2).join('/'); // Remove /storage/v1/object/public/
        
        console.log(`[ProfileRoutes] Extracted storage path: ${storagePath}`);
        
        // Delete from storage if it exists
        if (storagePath) {
          const { error: removeError } = await supabase.storage
            .from('media')
            .remove([storagePath]);
            
          if (removeError) {
            console.warn(`[ProfileRoutes] Error removing file from storage: ${removeError.message}`);
          } else {
            console.log(`[ProfileRoutes] Successfully removed file from storage`);
          }
        }
      } catch (urlError) {
        console.warn(`[ProfileRoutes] Error parsing image URL: ${urlError.message}`);
        // Non-fatal error, continue with profile update
      }
    } else {
      console.log(`[ProfileRoutes] No profile found with image or profile not found`);
    }
    
    // Try multiple update strategies to update the profile
    let updateSuccess = false;
    
    // First try with user_id
    console.log(`[ProfileRoutes] Updating profile to remove image reference`);
    
    const updateData = {
      profile_image: null,
      updated_at: new Date().toISOString()
    };
    
    // Try with user_id first
    let { error: updateError, count } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('user_id', userId);
      
    if (count && count > 0) {
      updateSuccess = true;
    } else if (authId !== userId) {
      // Try with auth_id
      console.log(`[ProfileRoutes] No rows updated with user_id ${userId}, trying with auth_id ${authId}`);
      const authUpdateResult = await supabase
        .from(tableName)
        .update(updateData)
        .eq('user_id', authId);
        
      if (authUpdateResult.count && authUpdateResult.count > 0) {
        updateSuccess = true;
      }
    }
    
    // If still not updated, try with direct ID
    if (!updateSuccess) {
      console.log(`[ProfileRoutes] No rows updated with either user_id or auth_id, trying with direct id ${userId}`);
      const idUpdateResult = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', userId);
        
      if (idUpdateResult.count && idUpdateResult.count > 0) {
        updateSuccess = true;
      }
    }
    
    console.log(`[ProfileRoutes] Profile update ${updateSuccess ? 'successful' : 'unsuccessful'}`);
    
    // Return success regardless - if the profile doesn't exist, there's no image to remove
    return res.json({
      message: 'Profile image removed successfully'
    });
  } catch (error) {
    console.error('[ProfileRoutes] Error removing profile image:', error);
    return res.status(500).json({
      error: 'Failed to remove profile image',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;