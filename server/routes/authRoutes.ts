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

// Add request logging middleware for debugging
router.use((req, res, next) => {
  console.log(`[Auth] ${req.method} ${req.originalUrl} request received`);
  next();
});

// Add a test endpoint to verify auth routes are working
router.get('/test', (req, res) => {
  console.log('[Auth] Test endpoint hit');
  res.json({ 
    message: 'Auth routes are working properly',
    timestamp: new Date().toISOString()
  });
});

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