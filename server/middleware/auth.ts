import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

interface AuthenticatedRequest extends Request {
  user?: any;
  isAuthenticated: () => boolean;
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Check if the user is authenticated via express-session
  if (req.session && req.session.passport && req.session.passport.user) {
    req.user = req.session.passport.user;
    req.isAuthenticated = () => true;
    return next();
  }
  
  // Otherwise check for supabase JWT
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized - No authentication token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - Invalid authorization header format' });
  }

  try {
    // Verify the token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('Auth error:', error);
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
      .eq('auth_id', data.user.id)
      .single();
      
    if (userError) {
      // Only log the error, don't fail - try alternative lookup method
      console.log('User data lookup error with auth_id:', userError);
      
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
          auth_id: data.user.id,
          email: data.user.email,
          role: role,
          created_at: new Date().toISOString()
        };
      } else {
        // Found user by email
        req.user = userByEmail;
      }
    } else if (!userData) {
      console.warn('No user data found for auth_id:', data.user.id);
      
      // Create a basic user object from the token data
      req.user = {
        id: data.user.id,
        auth_id: data.user.id,
        email: data.user.email,
        role: role,
        created_at: new Date().toISOString()
      };
    } else {
      // We found the user record
      req.user = userData;
    }
    
    // Ensure role is set
    if (!req.user.role && role) {
      req.user.role = role;
    }
    
    // Set authentication flag
    req.isAuthenticated = () => true;
    
    // Log success
    console.log('[Auth] User authenticated:', req.user.id, 'role:', req.user.role);
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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