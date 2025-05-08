/**
 * Profile Controller
 * 
 * Handles HTTP requests related to user profiles.
 * Connects route handlers to the profile service.
 */

import { Request, Response } from 'express';
import { profileService } from '../services/profileService';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && allowedTypes.test(ext)) {
      return cb(null, true);
    }

    cb(new Error('Only image files are allowed!'));
  }
});

class ProfileController {
  /**
   * Get the current user's profile based on their role
   */
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get profile based on user type
      if (role === 'athlete') {
        const result = await profileService.getAthleteProfile(userId);

        if (!result.success) {
          return res.status(404).json({ error: result.error || 'Athlete profile not found' });
        }

        return res.status(200).json({ profile: result.profile });
      } else if (role === 'business') {
        const result = await profileService.getBusinessProfile(userId);

        if (!result.success) {
          return res.status(404).json({ error: result.error || 'Business profile not found' });
        }

        return res.status(200).json({ profile: result.profile });
      } else {
        // For other roles, just return basic user info
        return res.status(200).json({ 
          profile: {
            id: userId,
            email: req.user?.email,
            role: role,
            firstName: req.user?.firstName,
            lastName: req.user?.lastName
          }
        });
      }
    } catch (error: any) {
      console.error('Get profile error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving profile' });
    }
  }

  /**
   * Get a specific athlete's profile
   */
  async getAthleteProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await profileService.getAthleteProfile(id);

      if (!result.success) {
        return res.status(404).json({ error: result.error || 'Athlete profile not found' });
      }

      return res.status(200).json({ profile: result.profile });
    } catch (error: any) {
      console.error('Get athlete profile error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving athlete profile' });
    }
  }

  /**
   * Get a specific business's profile
   */
  async getBusinessProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await profileService.getBusinessProfile(id);

      if (!result.success) {
        return res.status(404).json({ error: result.error || 'Business profile not found' });
      }

      return res.status(200).json({ profile: result.profile });
    } catch (error: any) {
      console.error('Get business profile error:', error);
      return res.status(500).json({ error: error.message || 'Error retrieving business profile' });
    }
  }

  /**
   * Create or update an athlete profile
   */
  async upsertAthleteProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const profileData = req.body;

      const result = await profileService.upsertAthleteProfile(userId, profileData);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to save athlete profile' });
      }

      return res.status(200).json({ 
        message: 'Athlete profile saved successfully', 
        profile: result.profile 
      });
    } catch (error: any) {
      console.error('Update athlete profile error:', error);
      return res.status(500).json({ error: error.message || 'Error updating athlete profile' });
    }
  }

  /**
   * Create or update a business profile
   */
  async upsertBusinessProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const profileData = req.body;

      const result = await profileService.upsertBusinessProfile(userId, profileData);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to save business profile' });
      }

      return res.status(200).json({ 
        message: 'Business profile saved successfully', 
        profile: result.profile 
      });
    } catch (error: any) {
      console.error('Update business profile error:', error);
      return res.status(500).json({ error: error.message || 'Error updating business profile' });
    }
  }

  /**
   * Upload a profile image
   */
  async uploadProfileImage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if file exists in request
      if (!req.file) {
        return res.status(400).json({ error: 'No image provided' });
      }

      // Read file from disk
      const file = fs.readFileSync(req.file.path);

      // Upload to profile service
      const userType = role === 'athlete' ? 'athlete' : 'business';
      const result = await profileService.uploadProfileImage(
        userId, 
        userType, 
        file, 
        req.file.originalname
      );

      // Clean up temporary file
      fs.unlinkSync(req.file.path);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to upload image' });
      }

      return res.status(200).json({ 
        message: 'Profile image uploaded successfully', 
        imageUrl: result.url 
      });
    } catch (error: any) {
      console.error('Upload profile image error:', error);

      // Clean up temporary file if it exists
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({ error: error.message || 'Error uploading profile image' });
    }
  }

  /**
   * Remove a profile image
   */
  async removeProfileImage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Remove profile image
      const userType = role === 'athlete' ? 'athlete' : 'business';
      const result = await profileService.removeProfileImage(userId, userType);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to remove profile image' });
      }

      return res.status(200).json({ message: 'Profile image removed successfully' });
    } catch (error: any) {
      console.error('Remove profile image error:', error);
      return res.status(500).json({ error: error.message || 'Error removing profile image' });
    }
  }
}

// Create and export singleton instance
export const profileController = new ProfileController();
export default profileController;