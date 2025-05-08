import express from 'express';

const router = express.Router();

// GET /api/auth/user - Get the current user
router.get('/user', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No valid authentication token provided' 
      });
    }
    
    // For development purposes, we'll return a mock user based on the token
    // In production, this would validate with Supabase
    const token = authHeader.split(' ')[1];
    
    // Check if we have a valid token
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid token format' 
      });
    }
    
    // For development, simulate a user lookup
    // This would be replaced with actual Supabase token verification
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com',
      role: 'athlete',
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    };
    
    // Return user information
    return res.json({ 
      user: mockUser
    });
    
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ 
      error: 'Server Error', 
      message: 'Failed to retrieve user information'
    });
  }
});

// POST /api/auth/login - Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Email and password are required' 
      });
    }
    
    // For development, return a successful login with a mock token
    // In production, this would authenticate with Supabase
    const mockToken = "mock-auth-token-12345";
    
    // Create a mock user based on the provided email
    // The role would normally be looked up from the database
    const mockUser = {
      id: 'user-123',
      email: email,
      role: email.includes('admin') ? 'admin' : 
            email.includes('business') ? 'business' : 
            email.includes('compliance') ? 'compliance' : 'athlete',
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    };
    
    return res.json({
      token: mockToken,
      user: mockUser
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Server Error', 
      message: 'Authentication failed due to server error'
    });
  }
});

// POST /api/auth/register - Register endpoint
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  
  try {
    // Basic validation
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'All fields are required' 
      });
    }
    
    // For development, return a successful registration
    // In production, this would register with Supabase
    const mockToken = "mock-auth-token-new-user-12345";
    
    // Create a mock user based on the registration data
    const mockUser = {
      id: 'user-new-123',
      email: email,
      role: role,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    };
    
    return res.json({
      token: mockToken,
      user: mockUser
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Server Error', 
      message: 'Registration failed due to server error'
    });
  }
});

// POST /api/auth/logout - Logout endpoint
router.post('/logout', (req, res) => {
  // For development, just return success
  // In production, this would invalidate the token in Supabase
  return res.json({ 
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;