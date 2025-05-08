/** 05/08/2025 - 1423cst
 * Authentication Middleware
 * 
 * Provides middleware functions for authenticating requests and enforcing
 * role-based access control.
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role: string;
        firstName?: string;
        lastName?: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to check if a request is authenticated
 * 
 * This middleware verifies the JWT token in the Authorization header
 * and attaches the user object to the request if valid.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    // Check if authorization header exists and has the correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Verify the token and get user info
    const result = await authService.verifyToken(token);

    // If token verification fails, return 401
    if (!result.success || !result.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: result.error || 'Invalid authentication token' 
      });
    }

    // Attach user to request
    req.user = result.user;

    // Continue to the next middleware or route handler
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Authentication failed due to server error' 
    });
  }
};

/**
 * Middleware to check if a user has a specific role
 * 
 * This middleware must be used after requireAuth.
 * 
 * @param roles - Single role or array of roles that are allowed to access the route
 */
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure the user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    // Convert single role to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    // Check if the user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
      });
    }

    // User has required role, continue
    next();
  };
};

/**
 * Middleware to check if profile is completed
 * 
 * This middleware must be used after requireAuth.
 * It redirects to onboarding if profile is not completed.
 */
export const requireCompleteProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure the user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    // Check if profile is completed based on role
    const { needsProfile, redirectTo } = await authService.checkProfileStatus(
      req.user.id, 
      req.user.role
    );

    if (needsProfile) {
      return res.status(403).json({ 
        error: 'Incomplete Profile', 
        message: 'Please complete your profile first',
        redirectTo: redirectTo || '/onboarding'
      });
    }

    // Profile is complete, continue
    next();
  } catch (error: any) {
    console.error('Profile check middleware error:', error);
    next();
  }
};

export default {
  requireAuth,
  requireRole,
  requireCompleteProfile
};