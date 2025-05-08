/** 05/08/2025 - 13:33 CST
 * Authentication Middleware
 * 
 * Provides middleware for protecting routes that require authentication.
 * Verifies JWT tokens and attaches user information to the request.
 */

import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { AppError } from './error';

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
      .select('id, email, role, metadata')
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
    req.user = {
      id: user.id,
      email: user.email || '',
      role: effectiveRole,
      token: token,
      userType: effectiveRole,
      user_metadata: {
        role: user.user_metadata?.role,
        userType: user.user_metadata?.userType,
        user_type: user.user_metadata?.user_type
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

    // If no token, continue without authentication
    if (!authHeader) {
      return next();
    }

    // Extract the token from the header
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return next();
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    // If invalid token, continue without authentication
    if (error || !user) {
      return next();
    }

    // Get additional user data
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, role, metadata')
      .eq('id', user.id)
      .single();

    // Determine effective role
    const effectiveRole = userData?.role || 
      user.user_metadata?.role || 
      user.user_metadata?.userType || 
      'user';

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: effectiveRole,
      token: token,
      userType: effectiveRole,
      user_metadata: {
        role: user.user_metadata?.role,
        userType: user.user_metadata?.userType,
        user_type: user.user_metadata?.user_type
      }
    };

    next();
  } catch (error) {
    // For optional auth, just continue without user
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