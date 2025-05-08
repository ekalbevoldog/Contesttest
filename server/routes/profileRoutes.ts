/**
 * Profile Routes
 * 
 * Manages user profile operations including creation, retrieval, updates,
 * and image handling for different user types (athletes, businesses).
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { supabase, handleDatabaseError } from '../lib/unifiedSupabase';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && allowedTypes.test(ext)) {
      return cb(null, true);
    }
    
    cb(new Error('Only image files are allowed!'));
  }
});

/** 1) CREATE/upsert business profile */
router.post('/create-business-profile', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  
  try {
    // Get user details to verify role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', userId)
      .maybeSingle();
      
    if (userError) throw userError;
    if (!user || user.role !== 'business') {
      return res.status(400).json({ 
        error: 'Invalid user type',
        message: 'Only business users can create business profiles'
      });
    }

    // Get profile data from request or use defaults
    const profileData = {
      name: req.body.name || 'My Business',
      email: user.email,
      industry: req.body.industry || '',
      business_type: req.body.business_type || '',
      budget: req.body.budget || null,
      values: req.body.values || 'Default values',
      product_type: req.body.product_type || 'Default product',
      target_schools_sports: req.body.target_schools_sports || 'All'
    };

    // Generate a new session ID to track if this is new or updated
    const sessionId = uuidv4();
    
    // Upsert the business profile
    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .upsert({
        id: userId,
        session_id: sessionId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();
      
    if (profileError) throw profileError;

    // Return appropriate status based on whether this was a create or update
    return res
      .status(profile.session_id === sessionId ? 201 : 200)
      .json({ 
        success: true, 
        profile,
        isNew: profile.session_id === sessionId
      });
      
  } catch(error: any) {
    console.error('Business profile creation error:', error);
    const errorResponse = handleDatabaseError(error);
    res.status(500).json({
      error: 'Failed to create business profile',
      message: errorResponse.error.message,
      code: errorResponse.error.code
    });
  }
});

/** 2) GET profile */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const role = (req.user?.role || '').toLowerCase();
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  try {
    let data, error;
    
    if (role === 'athlete') {
      ({ data, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('id', userId)
        .single());
    } else if (role === 'business') {
      ({ data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', userId)
        .single());
    } else {
      ({ data, error } = await supabase
        .from('users')
        .select('id, email, role, created_at, last_login')
        .eq('id', userId)
        .maybeSingle());
    }
    
    // Handle record not found gracefully
    if (error && error.code === 'PGRST116') {
      data = null;
      error = null;
    }
    
    if (error) throw error;
    
    res.json(data || { id: userId, role });
  } catch(error: any) {
    console.error('Profile fetch error:', error);
    const errorResponse = handleDatabaseError(error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: errorResponse.error.message,
      code: errorResponse.error.code
    });
  }
});

/** 3) PATCH profile */
router.patch('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const role = (req.user?.role || '').toLowerCase();
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  const body = { 
    ...req.body,
    updated_at: new Date().toISOString()
  };

  try {
    let record;
    
    if (role === 'athlete') {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .upsert({ id: userId, ...body }, { onConflict: 'id' })
        .select()
        .single();
        
      if (error) throw error;
      record = data;
    } else if (role === 'business') {
      const { data, error } = await supabase
        .from('business_profiles')
        .upsert({ id: userId, ...body }, { onConflict: 'id' })
        .select()
        .single();
        
      if (error) throw error;
      record = data;
    } else {
      // General users: update only email
      const upd: any = {};
      if (body.email) upd.email = body.email;
      
      if (Object.keys(upd).length) {
        const { error } = await supabase
          .from('users')
          .update(upd)
          .eq('id', userId);
          
        if (error) throw error;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      record = data;
    }
    
    res.json({ 
      message: 'Profile updated successfully', 
      profile: record 
    });
  } catch(error: any) {
    console.error('Profile update error:', error);
    const errorResponse = handleDatabaseError(error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: errorResponse.error.message,
      code: errorResponse.error.code
    });
  }
});

/** 4) UPLOAD profile image */
router.post('/upload-image', requireAuth, upload.single('profile_image'), async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const role = (req.user?.role || '').toLowerCase();
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    // Create the storage key for this user's profile image
    const key = `profile_images/${userId}/${req.file.filename}`;
    const buf = fs.readFileSync(req.file.path);
    
    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(key, buf, { upsert: true });
      
    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(key);
      
    const url = urlData.publicUrl;

    // Determine the table to update based on user role
    const table = role === 'athlete' ? 'athlete_profiles'
                : role === 'business' ? 'business_profiles'
                : 'users';

    // Update the profile with the new image URL
    const { error: updateError } = await supabase
      .from(table)
      .update({ 
        profile_image: url, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);
      
    if (updateError) throw updateError;

    // Clean up the temporary file
    fs.unlinkSync(req.file.path);
    
    res.json({ 
      message: 'Image uploaded successfully', 
      imageUrl: url 
    });
  } catch(error: any) {
    console.error('Image upload error:', error);
    
    // Clean up the temporary file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    const errorResponse = handleDatabaseError(error);
    res.status(500).json({
      error: 'Failed to upload image',
      message: errorResponse.error.message,
      code: errorResponse.error.code
    });
  }
});

/** 5) DELETE profile image */
router.delete('/remove-image', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const role = (req.user?.role || '').toLowerCase();
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }
  
  const table = role === 'athlete' ? 'athlete_profiles'
              : role === 'business' ? 'business_profiles'
              : 'users';

  try {
    // First, get the current profile image URL
    const { data: profile, error: fetchError } = await supabase
      .from(table)
      .select('profile_image')
      .eq('id', userId)
      .single();
      
    if (fetchError) throw fetchError;

    // If there's an image, delete it from storage
    if (profile?.profile_image) {
      const parts = new URL(profile.profile_image).pathname.split('/');
      const path = parts.slice(2).join('/'); // Remove the domain and first path segment
      
      const { error: removeError } = await supabase.storage
        .from('media')
        .remove([path]);
        
      if (removeError) throw removeError;
    }

    // Update the profile to clear the image reference
    const { error: updateError } = await supabase
      .from(table)
      .update({ 
        profile_image: null, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);
      
    if (updateError) throw updateError;

    res.json({ message: 'Profile image removed successfully' });
  } catch(error: any) {
    console.error('Image removal error:', error);
    const errorResponse = handleDatabaseError(error);
    res.status(500).json({
      error: 'Failed to remove profile image',
      message: errorResponse.error.message,
      code: errorResponse.error.code
    });
  }
});

export default router;