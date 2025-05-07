import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
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
      email?: string;
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
  // Check if the user is authenticated via express-session (safely checking each property)
  try {
    if (req.session && req.session.passport && req.session.passport.user) {
      req.user = req.session.passport.user;
      return next();
    }
  } catch (sessionError) {
    console.error('Error accessing session:', sessionError);
    // Continue to JWT auth as fallback
  }
  
  // Otherwise check for supabase JWT
  const authHeader = req.headers.authorization;
  
  // Debug - log authorization header
  console.log('[Auth Middleware] Authorization header:', authHeader ? 'Present' : 'Missing');
  
  // First try getting token from Authorization header
  let token = null;
  
  if (authHeader) {
    // Handle both "Bearer <token>" and raw token formats
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Try using the header value directly
      token = authHeader;
    }
  }
  
  // If no token found yet, check if it's in a cookie
  if (!token && req.cookies && req.cookies.supabaseToken) {
    token = req.cookies.supabaseToken;
    console.log('[Auth Middleware] Found token in cookies');
  }
  
  // If no token found yet, check query string (for testing only)
  if (!token && req.query && req.query.token) {
    token = req.query.token as string;
    console.log('[Auth Middleware] Found token in query string');
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
    
    // Extract user role from metadata or direct property
    const role = data.user.user_metadata?.role || 
                data.user.role || 
                data.user.user_metadata?.user_type ||
                'user';
    
    // Get user details from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      req.user.id = data.user.id
      .single();
      
    if (userError) {
      // Only log the error, don't fail - try alternative lookup method
      console.log('User data lookup error with id:', userError);
      
      // Try looking up by email instead
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.user.email)
        .single();
        
      if (emailError || !userByEmail) {
        console.error('User not found by email either:', emailError || 'No results');
        
        // Instead of failing, create a basic user object from the token data
        req.user = {
          id: data.user.id,
          email: data.user.email,
          role: role,
          created_at: new Date().toISOString()
        };
      } else {
        // Found user by email
        req.user = userByEmail;
      }
    } else if (!userData) {
      console.warn('No user data found for id:', data.user.id);
      
      // Create a basic user object from the token data
      req.user = {
        id: data.user.id,
        email: data.user.email,
        role: role,
        created_at: new Date().toISOString()
      };
    } else {
      // We found the user record
      req.user = userData;
    }
    
    // Ensure user object is properly defined
    if (req.user) {
      // Ensure role is set
      if (!req.user.role && role) {
        req.user.role = role;
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