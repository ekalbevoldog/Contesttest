/** 05/08/2025 - 13:37 CST
 * Authentication Routes
 * 
 * Defines routes for authentication operations.
 * Routes are connected to the authentication controller.
 */

import express from 'express';
import { authController } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

// Create a router
const router = express.Router();

// Public routes
router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

// Protected routes - require authentication
router.get('/me', requireAuth, authController.getCurrentUser.bind(authController));
router.put('/me', requireAuth, authController.updateUser.bind(authController));
router.post('/change-password', requireAuth, authController.changePassword.bind(authController));

export default router;