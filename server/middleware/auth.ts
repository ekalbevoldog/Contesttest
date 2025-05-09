/** 05/08/2025 - 13:33 CST
 * Authentication Middleware
 * 
 * Provides middleware for protecting routes that require authentication.
 * Verifies JWT tokens and attaches user information to the request.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { AppError } from './error';

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        token?: string;
        userType?: string;
        user_metadata?: Record<string, any>;
        [key: string]: any;
      };
    }
  }
}

/**
 * Middleware to require authentication
 * 
 * Verifies the Authorization header contains a valid JWT token
 * and attaches the user object to the request.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Extract the token from the header (format: "Bearer <token>")
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      throw new AppError('Invalid authorization format', 401, 'UNAUTHORIZED');
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
    }

    // Get additional user data from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      // We can still proceed with basic auth user data
    }

    // Determine effective role
    const effectiveRole = userData?.role || 
      user.user_metadata?.role || 
      user.user_metadata?.userType || 
      'user';

    // Attach user info to request
    const metadata = user.user_metadata || {};
    req.user = {
      id: user.id,
      email: user.email || '',
      role: effectiveRole,
      token: token,
      userType: effectiveRole,
      user_metadata: {
        role: metadata.role,
        userType: metadata.userType,
        user_type: metadata.user_type
      }
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed'
      }
    });
  }
};

/**
 * Middleware to optionally authenticate
 * 
 * Similar to requireAuth but doesn't error if no token is present.
 * Useful for routes that can work with or without authentication.
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('[Auth Middleware] optionalAuth called with authorization header:', !!authHeader);

    // If no token, continue without authentication
    if (!authHeader) {
      console.log('[Auth Middleware] No authorization header found, continuing without auth');
      return next();
    }

    // Extract the token from the header
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      console.log('[Auth Middleware] No token found in authorization header');
      return next();
    }

    console.log('[Auth Middleware] Verifying token with Supabase');
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    // If invalid token, continue without authentication
    if (error || !user) {
      console.log('[Auth Middleware] Invalid token or no user found:', error?.message);
      return next();
    }

    console.log('[Auth Middleware] Token valid, user found:', user.id);
    
    // Get additional user data - we'll try this but continue even if it fails
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        console.log('[Auth Middleware] Additional user data found');
      }
      
      // Determine effective role
      const effectiveRole = userData?.role || 
        user.user_metadata?.role || 
        user.user_metadata?.userType || 
        'user';

      // Attach user info to request
      const metadata = user.user_metadata || {};
      req.user = {
        id: user.id,
        email: user.email || '',
        role: effectiveRole,
        token: token,
        userType: effectiveRole,
        user_metadata: {
          role: metadata.role,
          userType: metadata.userType,
          user_type: metadata.user_type
        }
      };
    } catch (userDataError) {
      console.warn('[Auth Middleware] Error getting additional user data:', userDataError);
      
      // Set basic user info even if we couldn't get additional data
      const metadata = user.user_metadata || {};
      req.user = {
        id: user.id,
        email: user.email || '',
        role: metadata.role || 'user',
        token: token,
        userType: metadata.userType || 'user',
        user_metadata: metadata
      };
    }

    console.log('[Auth Middleware] User attached to request, role:', req.user.role);
    next();
  } catch (error) {
    // For optional auth, log the error but continue without user
    console.error('[Auth Middleware] Error in optionalAuth:', error);
    next();
  }
};

/**
 * Middleware to require a specific role
 * 
 * Must be used after requireAuth
 */
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
};

export default {
  requireAuth,
  optionalAuth,
  requireRole
};