import { Express, Request, Response, NextFunction } from "express";
import { supabase } from "./supabase";
import { storage } from "./storage";

// Define the User interface for our request object - using just string type properties
export interface User {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

/**
 * Middleware to verify Supabase JWT token
 */
export const verifySupabaseToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Set user data for the request
    req.user = {
      id: data.user.id, // This is a string in Supabase
      email: data.user.email || '',
      role: data.user.user_metadata?.role || 'user',
      ...(data.user.user_metadata || {})
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Check if the user has the required role
 */
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

/**
 * Setup auth routes for Supabase authentication
 */
export function setupSupabaseAuth(app: Express) {
  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      console.log('\n==== SUPABASE LOGIN ATTEMPT ====');
      console.log(`Login attempt for: ${email}`);
      
      // Use Supabase Auth for login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      if (!data.user || !data.session) {
        return res.status(401).json({ error: 'Authentication failed' });
      }
      
      // Update last login in our users table
      await supabase
        .from('users')
        .update({ last_login: new Date() })
        .eq('email', email);
      
      // Also fetch the user profile data from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
        
      if (userError) {
        console.error('Error fetching user data after login:', userError);
        // We can still proceed with just the auth data
      }
      
      console.log('Login successful for:', email);
      
      // Return both auth data and profile data
      return res.status(200).json({
        user: data.user,
        profile: userData || null,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  });
  
  // Logout endpoint
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract token
        const token = authHeader.split(' ')[1];
        
        // Sign out using Supabase Auth
        await supabase.auth.signOut();
      }
      
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Logout failed' });
    }
  });

  // User endpoint - get current authenticated user
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      // Check for authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Extract token
      const token = authHeader.split(' ')[1];
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Get additional user data from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();
        
      if (userError) {
        console.error('Error fetching user data:', userError);
        // We can still return just the auth user
      }
      
      return res.status(200).json({
        auth: user,
        profile: userData || null
      });
    } catch (error) {
      console.error('Error getting authenticated user:', error);
      return res.status(401).json({ error: 'Not authenticated' });
    }
  });
  
  // Register endpoint - stores additional user data in our database
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      // Log incoming request body for debugging
      console.log("\n==== /api/auth/register RECEIVED REQUEST ====");
      console.log("Request headers:", req.headers);
      console.log("Request body:", req.body);
      console.log("Request body type:", typeof req.body);
      
      // Extract form data from request
      const { email, password, fullName, role } = req.body;
      
      // Ensure we have all required fields
      if (!email || !password || !fullName) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          missing: [
            !email ? 'email' : null,
            !password ? 'password' : null,
            !fullName ? 'fullName' : null
          ].filter(Boolean)
        });
      }
      
      // FIRST check if the user already exists in Supabase Auth
      // Try logging in first to see if account exists and credentials are valid
      try {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (loginData?.user) {
          console.log('User exists in Supabase Auth and credentials match');
          
          // Now check if they exist in our application database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
          
          if (userData) {
            // User exists in both Supabase Auth and our application database
            // Return success with existing user data
            console.log('User exists in both Auth and application database - returning user data');
            return res.status(200).json({ 
              message: 'Login successful. Account already exists.',
              user: {
                ...userData,
                id: loginData.user.id,
                auth_id: loginData.user.id
              }
            });
          } else {
            // User exists in Supabase Auth but not in our application database
            // This is an unusual case - let's create the user record
            console.log('User exists in Auth but not in application database - creating user record');
            
            // Store user data in our application database
            const userDataToInsert = {
              email: email,
              role: role,
              created_at: new Date()
            };
            
            const { data: newUserData, error: insertError } = await supabase
              .from('users')
              .insert(userDataToInsert)
              .select()
              .single();
              
            if (insertError) {
              console.error('Error storing user data for existing auth user:', insertError);
              return res.status(500).json({ 
                error: 'Account setup incomplete',
                message: 'Your account exists but we could not complete the profile setup. Please contact support.'
              });
            }
            
            return res.status(200).json({ 
              message: 'Login successful. Account profile created.',
              user: {
                ...newUserData,
                id: loginData.user.id,
                auth_id: loginData.user.id
              }
            });
          }
        }
      } catch (loginError) {
        console.log('Login attempt failed (expected for new users)');
      }
      
      // Check if user exists with the given email in our application database
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
        
      if (userData) {
        console.log('User exists in our database but auth failed:', userData);
        return res.status(400).json({ 
          error: 'Email already registered',
          message: 'This email is already registered. Please use a different email or try signing in with the correct password.'
        });
      }
      
      console.log('\n==== SUPABASE REGISTRATION DATA ====');
      console.log('Creating user account with Supabase Auth...');
      
      // First create the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });
      
      if (authError) {
        console.error('Error creating Supabase auth account:', authError);
        
        // Check for specific error codes and provide more helpful error messages
        if (authError.code === 'weak_password') {
          return res.status(400).json({ 
            error: 'Password too weak',
            message: 'Please use a stronger password. Include a mix of uppercase and lowercase letters, numbers, and symbols. Avoid common passwords.'
          });
        } else if (authError.code === 'user_already_exists') {
          // User exists in Supabase Auth but our login attempt above failed
          // This means the password is incorrect
          return res.status(400).json({ 
            error: 'Email already in use',
            message: 'This email is already registered but the password does not match. Please try signing in with the correct password.'
          });
        } else {
          // For any other errors, return a generic message
          return res.status(500).json({ 
            error: 'Registration failed',
            message: 'Account creation failed. Please try again with different credentials.',
            code: authError.code || 'unknown'
          });
        }
      }
      
      console.log('Auth account created successfully, storing additional user data...');
      
      // Also store in the users table for our application - only include columns that actually exist
      const userDataToInsert = {
        email: email,
        role: role,
        created_at: new Date()
        // Note: The actual schema only has id, email, role, created_at, last_login
      };
      
      console.log('Inserting user data into users table:', userDataToInsert);
      
      // Store user data in our database
      // Using only the columns that exist in the users table
      const { data, error } = await supabase
        .from('users')
        .insert(userDataToInsert)
        .select()
        .single();
      
      if (error) {
        console.error('Error storing user data:', error);
        // Useful debug information
        console.log('Column error details:', error.details);
        console.log('Column error hint:', error.hint);
        console.log('Column error code:', error.code);
        
        // Even though auth account was created, we should report the error
        return res.status(500).json({ error: 'Failed to store user data' });
      }
      
      // Return success only after storing all user data
      return res.status(201).json({ 
        message: 'Registration successful. Account details stored.',
        user: {
          ...data,
          id: authData?.user?.id || data.id, // Include the auth ID which may be needed on client
          auth_id: authData?.user?.id, // Additional field to make it clear this is from auth
          email: email,
          role: role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed' });
    }
  });
  
  // User profile endpoint - get the user's profile data
  app.get("/api/auth/profile", verifySupabaseToken, async (req: Request, res: Response) => {
    try {
      // Make sure we have req.user
      if (!req.user || !req.user.email) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Query additional user data from our database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', req.user.email)
        .single();
        
      if (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ error: 'Failed to fetch user profile' });
      }
      
      return res.status(200).json(data);
    } catch (error) {
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });
  
  // Update user profile endpoint
  app.patch("/api/auth/profile", verifySupabaseToken, async (req: Request, res: Response) => {
    try {
      const { fullName, ...otherData } = req.body;
      
      // Only update allowed fields
      const updateData: Record<string, any> = {};
            
      // Add only fields that exist in the schema (id, email, role, created_at, last_login)
      // We're only allowing last_login to be updated
      if (otherData.last_login) {
        updateData.last_login = otherData.last_login;
      }
      
      // Make sure we have req.user
      if (!req.user || !req.user.email) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Only perform the update if there's data to update
      if (Object.keys(updateData).length === 0) {
        // Return the current user profile instead
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', req.user.email)
          .single();
          
        if (fetchError) {
          console.error('Error fetching user profile:', fetchError);
          return res.status(500).json({ error: 'Failed to fetch user profile' });
        }
        
        return res.status(200).json({ 
          message: 'No update needed',
          user: userData
        });
      }
      
      // Update the user data
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('email', req.user.email)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating user profile:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      
      return res.status(200).json({ 
        message: 'Profile updated successfully',
        user: data
      });
    } catch (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  });
}

// Declare the user property on the Express Request object
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}