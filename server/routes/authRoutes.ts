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

// More detailed test endpoint for debugging
router.get('/test', (req, res) => {
  console.log('[Auth] Test endpoint hit from ' + req.ip);
  res.json({ 
    message: 'Auth routes are working properly',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method
  });
});

// Test all auth endpoints working
router.get('/check-endpoints', (req, res) => {
  console.log('[Auth] Endpoint check requested');
  try {
    // Manually list the configured routes instead of introspecting
    const routes = [
      { path: '/test', methods: 'GET', description: 'Test endpoint' },
      { path: '/check-endpoints', methods: 'GET', description: 'List all endpoints' },
      { path: '/login', methods: 'POST', description: 'User login' },
      { path: '/register', methods: 'POST', description: 'User registration' },
      { path: '/logout', methods: 'POST', description: 'User logout' },
      { path: '/refresh-token', methods: 'POST', description: 'Refresh auth token' },
      { path: '/reset-password', methods: 'POST', description: 'Request password reset' },
      { path: '/me', methods: 'GET', description: 'Get current user (protected)' },
      { path: '/me', methods: 'PUT', description: 'Update user details (protected)' },
      { path: '/change-password', methods: 'POST', description: 'Change password (protected)' }
    ];
      
    console.log('[Auth] Found registered routes:', routes.length);
    res.json({
      message: 'Auth routes configuration',
      timestamp: new Date().toISOString(),
      routeCount: routes.length,
      routes: routes
    });
  } catch (error) {
    console.error('[Auth] Error getting routes:', error);
    res.status(500).json({ error: 'Failed to check endpoints' });
  }
});

// Public routes
router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

// Add an alias for '/me' endpoint as '/user' to match client expectations
router.get('/user', requireAuth, authController.getCurrentUser.bind(authController));

// Protected routes - require authentication
router.get('/me', requireAuth, authController.getCurrentUser.bind(authController));
router.put('/me', requireAuth, authController.updateUser.bind(authController));
router.post('/change-password', requireAuth, authController.changePassword.bind(authController));

export default router;