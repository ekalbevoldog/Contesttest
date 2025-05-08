/** 050825 1618CST
 * Offer Routes
 * 
 * Defines all routes related to partnership offers.
 */

import { Router } from 'express';
import { offerController } from '../controllers/offerController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Protected routes - require authentication
router.use(requireAuth);

// Get offers for the current user
router.get('/', offerController.getUserOffers);

// Get offer by ID
router.get('/:id', offerController.getOffer);

// Routes that require business role
router.post('/', requireRole(['business']), offerController.createOffer);
router.put('/:id', requireRole(['business']), offerController.updateOffer);
router.post('/:id/cancel', requireRole(['business']), offerController.cancelOffer);

// Routes that require athlete role
router.post('/:id/respond', requireRole(['athlete']), offerController.respondToOffer);

export default router;