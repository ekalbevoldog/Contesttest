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
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase() || 'user';
    const { profile_image, ...profileData } = req.body;
    
    // Format profile data for database
    const updateData = {
      ...profileData,
      updated_at: new Date().toISOString(),
    };
    
    let result;
    
    if (userRole === 'athlete') {
      // Check if athlete profile exists
      const { data: existingProfile } = await supabase
        .from('athlete_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('athlete_profiles')
          .update(updateData)
          .eq('user_id', userId)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('athlete_profiles')
          .insert({
            ...updateData,
            user_id: userId,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
    } else if (userRole === 'business') {
      // Check if business profile exists
      const { data: existingProfile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('business_profiles')
          .update(updateData)
          .eq('user_id', userId)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('business_profiles')
          .insert({
            ...updateData,
            user_id: userId,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
    } else {
      // Handle general user profile
      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('user_id', userId)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('user_profiles')
          .insert({
            ...updateData,
            user_id: userId,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
    }
    
    // Update user record if name or email changed
    if (profileData.name || profileData.email) {
      const userUpdateData = {};
      if (profileData.name) userUpdateData.name = profileData.name;
      if (profileData.email) userUpdateData.email = profileData.email;
      
      await supabase
        .from('users')
        .update(userUpdateData)
        .eq('id', userId);
    }
    
    // Return the updated profile
    return res.json({
      ...result,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      error: 'Failed to update profile',
      details: error.message
    });
  }
});

// Upload profile image
router.post('/upload-image', requireAuth, upload.single('profile_image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase() || 'user';
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }
    
    // Get the file path
    const filePath = req.file.path;
    const fileName = req.file.filename;
    
    // Upload to Supabase Storage
    const uniqueFileName = `profile_images/${userId}/${fileName}`;
    
    const fileData = fs.readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(uniqueFileName, fileData, {
        contentType: req.file.mimetype,
        upsert: true
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl(uniqueFileName);
    
    const imageUrl = publicUrlData.publicUrl;
    
    // Update the user's profile with the image URL
    let tableName;
    if (userRole === 'athlete') {
      tableName = 'athlete_profiles';
    } else if (userRole === 'business') {
      tableName = 'business_profiles';
    } else {
      tableName = 'user_profiles';
    }
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from(tableName)
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existingProfile) {
      // Update existing profile
      await supabase
        .from(tableName)
        .update({
          profile_image: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Create new profile
      await supabase
        .from(tableName)
        .insert({
          user_id: userId,
          profile_image: imageUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    
    return res.json({
      message: 'Image uploaded successfully',
      imageUrl
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    
    // Clean up the temporary file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    return res.status(500).json({
      error: 'Failed to upload profile image',
      details: error.message
    });
  }
});

// Remove profile image
router.delete('/remove-image', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase() || 'user';
    
    // Determine which table to update
    let tableName;
    if (userRole === 'athlete') {
      tableName = 'athlete_profiles';
    } else if (userRole === 'business') {
      tableName = 'business_profiles';
    } else {
      tableName = 'user_profiles';
    }
    
    // Get current profile to get image path
    const { data: profile } = await supabase
      .from(tableName)
      .select('profile_image')
      .eq('user_id', userId)
      .single();
    
    if (profile && profile.profile_image) {
      // Extract the path from the URL
      const urlPath = new URL(profile.profile_image).pathname;
      const storagePath = urlPath.split('/').slice(2).join('/'); // Remove /storage/v1/object/public/
      
      // Delete from storage if it exists
      if (storagePath) {
        await supabase.storage
          .from('media')
          .remove([storagePath]);
      }
    }
    
    // Update profile to remove image reference
    await supabase
      .from(tableName)
      .update({
        profile_image: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    return res.json({
      message: 'Profile image removed successfully'
    });
  } catch (error) {
    console.error('Error removing profile image:', error);
    return res.status(500).json({
      error: 'Failed to remove profile image',
      details: error.message
    });
  }
});

export default router;