/**
 * Authentication Middleware
 * 
 * Provides authentication and role-based authorization using Supabase tokens
 * and session-based authentication. Centralizes all auth logic in one place.
 */
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/unifiedSupabase';
import { Session } from 'express-session';

// Extend Session type to include passport property
declare module 'express-session' {
  interface Session {
    passport?: {
      user?: any;
    };
  }
}

// Extend the Express namespace to include the user type
declare global {
  namespace Express {
    interface User {
      id: string | number;
      role?: string;
      userType?: string;
      user_type?: string;
      email?: string;
      user_metadata?: {
        role?: string;
        userType?: string;
        user_type?: string;
      };
      [key: string]: any;
    }
    
    // This forces the isAuthenticated() method to return the correct type
    interface Request {
      isAuthenticated(): boolean;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Modern JWT-based authentication only - no session fallbacks
  // We only use the Supabase JWT authentication for consistency
  
  // Otherwise check for supabase JWT
  const authHeader = req.headers.authorization;
  
  // Debug - log authorization header
  console.log('[Auth Middleware] Authorization header:', authHeader ? 'Present' : 'Missing');
  
  // Get token strictly from Authorization header only
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    console.log('[Auth Middleware] Authorization header missing or invalid format');
    return res.status(401).json({ error: 'Unauthorized - Invalid authorization header format' });
  }
  
  if (!token) {
    console.log('[Auth Middleware] No token found in request');
    return res.status(401).json({ error: 'Unauthorized - No authentication token provided' });
  }

  try {
    console.log('[Auth Middleware] Verifying token with Supabase (length:', token.length, 'chars)');
    // Debug - log first and last 10 chars of token
    if (token.length > 20) {
      console.log('[Auth Middleware] Token starts with:', token.substring(0, 10), '... ends with:', token.substring(token.length - 10));
    }
    
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('[Auth Middleware] Token verification failed:', error);
      return res.status(401).json({ error: 'Unauthorized - Invalid authentication token' });
    }
    
    console.log('[Auth] Token verified for user:', data.user.id, '(' + data.user.email + ')');
    
    // Extract user role using standardized approach
    const role = data.user.user_metadata?.role || 
                data.user.role || 
                data.user.user_metadata?.userType ||
                data.user.user_metadata?.user_type || 
                (data.user as any).user_type ||
                'user';
    
    // Get user details from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (userError) {
      // Create a standard user object from auth data - no alternative lookup methods
      console.log('User data lookup by ID failed:', userError);
      
      // Create a basic user object with standardized role fields
      req.user = {
        id: data.user.id,
        email: data.user.email,
        role: role,
        userType: role,
        created_at: new Date().toISOString(),
        user_metadata: {
          role: data.user.user_metadata?.role,
          userType: data.user.user_metadata?.userType,
          user_type: data.user.user_metadata?.user_type
        }
      };
    } else if (!userData) {
      console.warn('No user data found for id:', data.user.id);
      
      // Create a basic user object with standardized role fields
      req.user = {
        id: data.user.id,
        email: data.user.email,
        role: role,
        userType: role,
        created_at: new Date().toISOString(),
        user_metadata: {
          role: data.user.user_metadata?.role,
          userType: data.user.user_metadata?.userType,
          user_type: data.user.user_metadata?.user_type
        }
      };
    } else {
      // We found the user record
      req.user = userData;
    }
    
    // Ensure user object is properly defined with standardized role fields
    if (req.user) {
      // Ensure role is set using standardized approach
      if (!req.user.role && role) {
        req.user.role = role;
      }
      
      // Ensure userType is set
      if (!req.user.userType && req.user.role) {
        req.user.userType = req.user.role;
      }
      
      // Ensure user_metadata exists
      if (!req.user.user_metadata) {
        req.user.user_metadata = {
          role: data.user.user_metadata?.role,
          userType: data.user.user_metadata?.userType,
          user_type: data.user.user_metadata?.user_type
        };
      }
      
      // Log success
      console.log('[Auth] User authenticated:', req.user.id, 'role:', req.user.role || 'unknown');
    }
    
    // Set authentication flag using a standard function
    (req as any).isAuthenticated = function() { return true; };
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // First ensure the user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized - Authentication required' });
    }
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - User information missing' });
    }
    
    // Convert single role to array for consistent processing
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check if user's role is in the allowed roles
    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden - Insufficient privileges',
        message: `This action requires ${allowedRoles.join(' or ')} role`
      });
    }
    
    // User has required role, proceed
    next();
  };
};