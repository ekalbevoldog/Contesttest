/** 05/08/2025 - 13:28 CST
 * Subscription Routes
 * 
 * Defines all routes related to subscriptions and payments.
 */

import { Router } from 'express';
import { subscriptionController } from '../controllers/subscriptionController';
import { requireAuth } from '../middleware/auth';
import { jsonWithRawBody } from '../middleware/rawBodyParser';

const router = Router();

// Get subscription plans
router.get('/plans', subscriptionController.getPlans);

// Subscription management (protected routes)
router.get('/status', requireAuth, subscriptionController.getSubscriptionStatus);
router.post('/create-checkout-session', requireAuth, subscriptionController.createCheckoutSession);
router.post('/cancel', requireAuth, subscriptionController.cancelSubscription);
router.post('/reactivate', requireAuth, subscriptionController.reactivateSubscription);
router.post('/change-plan', requireAuth, subscriptionController.changeSubscriptionPlan);
router.post('/create-portal-session', requireAuth, subscriptionController.createPortalSession);

// Webhook endpoint (not protected, uses signature verification)
router.post('/webhook', jsonWithRawBody(), subscriptionController.handleWebhook);

export default router;