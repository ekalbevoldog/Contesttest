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
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('Auth error:', error);
      return res.status(401).json({ error: 'Unauthorized - Invalid authentication token' });
    }
    
    // Get user details from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();
      
    if (userError || !userData) {
      console.error('User data error:', userError);
      return res.status(401).json({ error: 'Unauthorized - User not found in database' });
    }
    
    // Attach user to request
    req.user = userData;
    req.isAuthenticated = () => true;
    
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