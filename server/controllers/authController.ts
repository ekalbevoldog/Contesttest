/** 05/10/2025 - 13:35 CST
 * Authentication Controller
 * 
 * Handles HTTP requests related to authentication.
 * Connects route handlers to the authentication service.
 */

import { Request, Response } from 'express';
import authService from '../services/authService';
import { supabaseAdmin } from '../lib/supabase';

// Use Express.Request which already has our user property defined in auth.ts
type AuthenticatedRequest = Request;

class AuthController {
  /**
   * Handle user login
   */
  async login(req: Request, res: Response) {
    try {
      console.log(`[Auth Controller] Login request received from ${req.ip}`);
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        console.log('[Auth Controller] Login validation failed: Missing email or password');
        return res.status(400).json({ error: 'Email and password are required' });
      }

      console.log(`[Auth Controller] Attempting login for email: ${email}`);
      // Attempt login
      const result = await authService.login({ email, password });

      if (!result.success) {
        return res.status(401).json({ error: result.error || 'Invalid credentials' });
      }

      // Set auth cookies if using cookie authentication
      if (req.body.useCookies && result.session) {
        res.cookie('auth-token', result.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
      }

      // Return user and session data
      return res.status(200).json({
        user: result.user,
        session: result.session,
        needsProfile: result.needsProfile,
        redirectTo: result.redirectTo
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ error: error.message || 'Login failed' });
    }
  }

  /**
   * Handle user registration
   */
  async register(req: Request, res: Response) {
    try {
      console.log(`[Auth Controller] Registration request received from ${req.ip}`);
      const registrationData = req.body;

      // Validate required fields
      if (!registrationData.email || !registrationData.password || 
          (!registrationData.firstName && !registrationData.name) || !registrationData.role) {
        console.log('[Auth Controller] Registration validation failed: Missing required fields');
        return res.status(400).json({ error: 'Required fields missing' });
      }

      // For backward compatibility, if firstName isn't provided but name is, use name as firstName
      if (!registrationData.firstName && registrationData.name) {
        registrationData.firstName = registrationData.name;
        console.log('[Auth Controller] Used name field for firstName:', registrationData.firstName);
      }
      
      // Ensure fullName is set for the service function
      if (!registrationData.fullName) {
        const firstName = registrationData.firstName || registrationData.name || '';
        const lastName = registrationData.lastName || '';
        registrationData.fullName = `${firstName} ${lastName}`.trim();
        console.log('[Auth Controller] Generated fullName:', registrationData.fullName);
      }

      console.log(`[Auth Controller] Attempting registration for email: ${registrationData.email}, role: ${registrationData.role}`);
      // Attempt registration
      const result = await authService.register(registrationData);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Registration failed' });
      }

      // Set auth cookies if using cookie authentication
      if (req.body.useCookies && result.session) {
        res.cookie('auth-token', result.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
      }

      // Return user and **sessionId** for next step
      return res.status(201).json({
        user: result.user,
        sessionId: result.session?.access_token, // <- new
        needsProfile: true, // frontend will know to call profile
        redirectTo: result.redirectTo
      });
  } catch (err: any) {
      // 1️⃣ Log every property of the error to your server console with enhanced details
      console.error(
        '❌ [AuthController.register] error:',
        JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
      );

      // Log request body (excluding sensitive data)
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
      console.error('Request body:', JSON.stringify(sanitizedBody, null, 2));

      // Log Supabase connection status
      console.error('Is Supabase admin client initialized:', !!supabaseAdmin);

      // 2️⃣ Send back the full error object to the client with more context
      return res.status(400).json({
        error:   err.message,
        details: err.details,
        hint:    err.hint,
        code:    err.code,
        info:    'Supabase registration error - check server logs for details'
      });
    }
  }

  /**
   * Handle user logout
   */
  async logout(req: Request, res: Response) {
    try {
      // Attempt logout
      const result = await authService.logout();

      // Clear auth cookies if using cookie authentication
      res.clearCookie('auth-token');

      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: error.message || 'Logout failed' });
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('[Auth Controller] Get current user request received');

      // Extract authorization token from header if present
      const authHeader = req.headers.authorization;
      let token = null;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log('[Auth Controller] Authorization token found in header');
      }

      // Check if we have a user from auth middleware
      if (!req.user) {
        // If we have a token but no user, we might need to validate the token manually
        if (token) {
          console.log('[Auth Controller] No user in request but token found, attempting to fetch user');
          try {
            const userResult = await authService.getUserFromToken(token);
            if (userResult && userResult.success && userResult.user) {
              console.log('[Auth Controller] Retrieved user from token');
              return res.status(200).json({ 
                user: userResult.user,
                profile: userResult.profile || null,
                authenticated: true
              });
            } else {
              console.log('[Auth Controller] Token validation failed or no user found');
            }
          } catch (tokenError) {
            console.error('[Auth Controller] Error validating token:', tokenError);
          }
        } else {
          console.log('[Auth Controller] No authorization token provided');
        }

        // For the /user endpoint with optionalAuth, return empty data instead of 401
        // This allows the auth page to load without authentication errors
        console.log('[Auth Controller] No authenticated user found, returning empty data');
        return res.status(200).json({ 
          user: null,
          authenticated: false,
          message: 'No authenticated user'
        });
      }

      // If we have a user, return it along with extended profile if available
      console.log(`[Auth Controller] Returning user data for user ID: ${req.user.id}`);

      // Try to fetch extended profile information
      try {
        const userProfile = await authService.getUserProfile(req.user.id);
        console.log('[Auth Controller] Profile retrieved successfully:', !!userProfile);

        return res.status(200).json({ 
          user: req.user,
          profile: userProfile || null,
          authenticated: true
        });
      } catch (profileError) {
        console.warn('[Auth Controller] Could not fetch profile:', profileError);
        // Fall back to just returning the user
        return res.status(200).json({ 
          user: req.user,
          authenticated: true
        });
      }
    } catch (error: any) {
      console.error('[Auth Controller] Get current user error:', error);
      // Return a proper response even on error
      return res.status(200).json({ 
        user: null, 
        authenticated: false,
        error: error.message || 'Error retrieving user',
        errorCode: 'SERVER_ERROR'
      });
    }
  }

  /**
   * Update user information
   */
  async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userData = req.body;

      // Validate user data
      if (!userData) {
        return res.status(400).json({ error: 'No data provided' });
      }

      // Don't allow role changes through this endpoint
      if (userData.role && req.user) {
        const userRole = req.user.role;
        if (userData.role !== userRole) {
          return res.status(403).json({ error: 'Role cannot be changed' });
        }
      }

      // Update user
      const result = await authService.updateUser(userId, userData);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to update user' });
      }

      return res.status(200).json({ 
        message: 'User updated successfully', 
        user: result.user 
      });
    } catch (error: any) {
      console.error('Update user error:', error);
      return res.status(500).json({ error: error.message || 'Error updating user' });
    }
  }

  /**
   * Refresh authentication token
   * Supports both refresh-token and refresh-session endpoints
   */
  async refreshToken(req: Request, res: Response) {
    try {
      console.log('[Auth Controller] Refresh token/session request received');

      // Check for refresh token in body (traditional method)
      let refreshToken = req.body.refreshToken;
      let accessToken = null;

      // If no refresh token in body, check for authorization header (session refresh method)
      if (!refreshToken) {
        console.log('[Auth Controller] No refresh token in body, checking authorization header');
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          accessToken = authHeader.substring(7);
          console.log('[Auth Controller] Found access token in authorization header');

          // Try to get the user details from this access token
          try {
            const userResult = await authService.getUserFromToken(accessToken);
            if (userResult.success && userResult.user) {
              console.log('[Auth Controller] Access token is valid, refreshing session');

              // Set auth cookies with existing token since it's still valid
              if (req.body.useCookies) {
                res.cookie('auth-token', accessToken, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });
                res.cookie('auth-status', 'authenticated', {
                  secure: process.env.NODE_ENV === 'production',
                  maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });
              }

              // Return the user and create a session object for client
              return res.status(200).json({
                user: userResult.user,
                session: {
                  access_token: accessToken,
                  user: userResult.user
                }
              });
            }
          } catch (tokenError) {
            console.error('[Auth Controller] Error validating access token:', tokenError);
            // Continue with refresh token flow
          }
        }

        // If we reach here, we couldn't use the authorization header or it was invalid
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      console.log('[Auth Controller] Attempting to refresh token');

      // Attempt to refresh token
      const result = await authService.refreshToken(refreshToken);

      if (!result.success) {
        console.error('[Auth Controller] Token refresh failed:', result.error);
        return res.status(401).json({ error: result.error || 'Invalid refresh token' });
      }

      console.log('[Auth Controller] Token refresh successful');

      // Set new auth cookies if using cookie authentication
      if (req.body.useCookies && result.session) {
        res.cookie('auth-token', result.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        res.cookie('auth-status', 'authenticated', {
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
      }

      // Return user and session data
      return res.status(200).json({
        user: result.user,
        session: result.session
      });
    } catch (error: any) {
      console.error('[Auth Controller] Token refresh error:', error);
      return res.status(500).json({ error: error.message || 'Token refresh failed' });
    }
  }

  /**
   * Change user password
   */
  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      // Validate password
      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long' });
      }

      // Change password
      const result = await authService.changePassword(userId, currentPassword, newPassword);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to change password' });
      }

      return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error: any) {
      console.error('Change password error:', error);
      return res.status(500).json({ error: error.message || 'Error changing password' });
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Send password reset email
      const result = await authService.resetPassword(email);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to send password reset email' });
      }

      return res.status(200).json({ message: 'Password reset email sent' });
    } catch (error: any) {
      console.error('Password reset error:', error);
      return res.status(500).json({ error: error.message || 'Error sending password reset email' });
    }
  }
}

// Create and export singleton instance
export const authController = new AuthController();
export default authController;