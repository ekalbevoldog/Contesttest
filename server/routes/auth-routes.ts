import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'contested-development-jwt-secret';

/**
 * Simple authentication service API endpoints
 * Used as fallback when Supabase Auth is not available
 */

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    // Query database for user
    const { data: users, error } = await db
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1);
    
    if (error) {
      console.error('Database error during login:', error);
      return res.status(500).json({ success: false, error: 'Database error occurred' });
    }
    
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    
    const user = users[0];
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Strip sensitive data from user object
    const { password_hash, ...userWithoutPassword } = user;
    
    // Set auth cookie
    res.cookie('auth-status', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    return res.status(200).json({
      success: true,
      token,
      user: {
        ...userWithoutPassword,
        aud: 'authenticated',
        auth_provider: 'simple-auth',
      }
    });
  } catch (error) {
    console.error('Server error during login:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Register route
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role = 'athlete' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    // Check if user exists
    const { data: existingUsers, error: checkError } = await db
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1);
    
    if (checkError) {
      console.error('Database error checking user existence:', checkError);
      return res.status(500).json({ success: false, error: 'Database error occurred' });
    }
    
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user ID
    const userId = uuidv4();
    
    // Insert new user
    const { error: insertError } = await db.from('users').insert({
      id: userId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      full_name: fullName || '',
      role: role,
      created_at: new Date().toISOString(),
      profile_completed: false
    });
    
    if (insertError) {
      console.error('Database error during user creation:', insertError);
      return res.status(500).json({ success: false, error: 'Error creating user' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: userId,
        email,
        role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Set auth cookie
    res.cookie('auth-status', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        role,
        full_name: fullName || '',
        created_at: new Date().toISOString(),
        profile_completed: false,
        aud: 'authenticated',
        auth_provider: 'simple-auth',
      }
    });
  } catch (error) {
    console.error('Server error during registration:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  try {
    // Clear auth cookie
    res.clearCookie('auth-status');
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Server error during logout:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Verify token route
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Get user data
    const { data: users, error } = await db
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .limit(1);
    
    if (error) {
      console.error('Database error verifying token:', error);
      return res.status(500).json({ success: false, error: 'Database error occurred' });
    }
    
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    const user = users[0];
    
    // Strip sensitive data from user object
    const { password_hash, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      success: true,
      user: {
        ...userWithoutPassword,
        aud: 'authenticated',
        auth_provider: 'simple-auth',
      }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    console.error('Server error verifying token:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Refresh session
router.post('/refresh-session', (req: Request, res: Response) => {
  try {
    // Set refreshed auth cookie
    res.cookie('auth-status', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Server error refreshing session:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;