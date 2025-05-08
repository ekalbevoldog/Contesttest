/** 050825 1619CST
 * Bundle Routes
 * 
 * Defines all routes related to campaign bundles.
 */

import { Router } from 'express';
import { bundleController } from '../controllers/bundleController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Get available bundle types
router.get('/types', bundleController.getBundleTypes);

// Protected routes - require authentication
router.use(requireAuth);

// Get bundle by ID
router.get('/:id', bundleController.getBundle);

// Routes that require business role
router.use(requireRole(['business', 'admin']));

// Create a new bundle
router.post('/', bundleController.createBundle);

// Update a bundle
router.put('/:id', bundleController.updateBundle);

// Delete a bundle
router.delete('/:id', bundleController.deleteBundle);

export default router;