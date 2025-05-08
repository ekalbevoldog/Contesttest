/** 050825 1429CST
 * Profile Routes
 * 
 * Defines all routes related to user profiles.
 */

import { Router } from 'express';
import { profileController, upload } from '../controllers/profileController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Current user's profile routes
router.get('/me', requireAuth, profileController.getProfile);
router.post('/athlete', requireAuth, requireRole('athlete'), profileController.upsertAthleteProfile);
router.post('/business', requireAuth, requireRole('business'), profileController.upsertBusinessProfile);
router.post('/upload-image', requireAuth, upload.single('profile_image'), profileController.uploadProfileImage);
router.delete('/remove-image', requireAuth, profileController.removeProfileImage);

// Get specific profile by ID
router.get('/athlete/:id', requireAuth, profileController.getAthleteProfile);
router.get('/business/:id', requireAuth, profileController.getBusinessProfile);

export default router;