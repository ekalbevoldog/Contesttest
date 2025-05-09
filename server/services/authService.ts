/** 05/08/2025 - 1455 CST
 * Authentication Service
 * 
 * Handles user authentication, registration, and token management.
 * Interfaces with Supabase Auth services.
 */

import { supabase, supabaseAdmin } from '../lib/supabase';
import { ensureBusinessProfile } from './ensureBusinessProfile';
import config from '../config/environment';

// Interface for login credentials
interface LoginCredentials {
  email: string;
  password: string;
}

// Interface for registration data
interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  role: string;
}

// Interface for auth result
interface AuthResult {
  success: boolean;
  user?: any;
  profile?: ProfileData | null;
  session?: any;
  needsProfile?: boolean;
  redirectTo?: string;
  error?: string;
}

// Interface for profile data
interface ProfileData {
  id: string | number;
  userId?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  role?: string;
  [key: string]: any;
}

// Main authentication service class
class AuthService {
  /**
   * Get user from an authorization token
   */
  async getUserFromToken(token: string): Promise<AuthResult> {
    try {
      console.log('[Auth Service] Getting user from token');
      
      // Validate token with Supabase
      if (!supabaseAdmin) {
        console.error('[Auth Service] Supabase admin client not initialized');
        return {
          success: false,
          error: 'Supabase admin client not initialized'
        };
      }
      
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !data.user) {
        console.error('[Auth Service] Token validation error:', error?.message);
        return {
          success: false,
          error: error?.message || 'Invalid token'
        };
      }
      
      // Get user's role and other metadata
      const user = data.user;
      
      // Handle various possible locations for role information with defensive programming
      let role = 'user'; // Default role
      
      if (user.user_metadata) {
        if (user.user_metadata.role) {
          role = user.user_metadata.role;
        } else if (user.user_metadata.userType) {
          role = user.user_metadata.userType;
        }
      }
      
      // Fallback to role or user_type if directly on user object (older structure)
      if (role === 'user' && (user as any).role) {
        role = (user as any).role;
      } else if (role === 'user' && (user as any).user_type) {
        role = (user as any).user_type;
      }
      
      console.log(`[Auth Service] User role resolved as: ${role}`);
      
      // Try to get user profile data based on role
      let profile = null;
      let profileCompleted = false;
      
      try {
        profile = await this.getUserProfile(user.id, role);
        
        // Check if profile is considered complete
        if (profile) {
          if (role === 'athlete' && profile.firstName && profile.sport) {
            profileCompleted = true;
          } else if (role === 'business' && profile.businessName && profile.industry) {
            profileCompleted = true;
          } else if (profile.firstName || profile.name || profile.businessName) {
            // Basic profile completion for other roles
            profileCompleted = true;
          }
        }
      } catch (profileError) {
        console.warn('[Auth Service] Could not fetch profile for token user:', profileError);
      }
      
      // Construct the full user object with metadata
      const userResponse = {
        id: user.id,
        email: user.email || '',
        role: role,
        profileCompleted: profileCompleted,
        // Safely include all user metadata with null checks
        ...(user.user_metadata ? user.user_metadata : {}),
        // Include createdAt from app_metadata if available
        createdAt: user.app_metadata?.created_at || user.created_at || null
      };
      
      // Log success
      console.log('[Auth Service] Successfully retrieved and processed user from token');
      
      return {
        success: true,
        user: userResponse,
        profile: profile,
        session: {
          access_token: token,
          user: userResponse
        }
      };
    } catch (error: any) {
      console.error('[Auth Service] Error getting user from token:', error);
      return {
        success: false,
        error: error.message || 'Error validating token'
      };
    }
  }

  /**
   * Get user profile data by user ID and optional role
   */
  async getUserProfile(userId: string, role?: string): Promise<ProfileData | null> {
    try {
      console.log(`[Auth Service] Getting profile for user: ${userId}, role: ${role || 'unspecified'}`);
      
      // If role is specified, only query that profile type
      if (role === 'athlete') {
        const { data: athleteData, error: athleteError } = await supabase
          .from('athlete_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (athleteData) {
          console.log('[Auth Service] Found athlete profile');
          return {
            ...athleteData,
            profileType: 'athlete',
            id: athleteData.id
          };
        }
        
        // If we have a role but no profile, return null early
        console.log('[Auth Service] No athlete profile found for athlete user');
        return null;
      }
      
      if (role === 'business') {
        const { data: businessData, error: businessError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (businessData) {
          console.log('[Auth Service] Found business profile');
          return {
            ...businessData,
            profileType: 'business',
            id: businessData.id
          };
        }
        
        // If we have a role but no profile, return null early
        console.log('[Auth Service] No business profile found for business user');
        return null;
      }
      
      if (role === 'compliance' || role === 'compliance_officer') {
        const { data: complianceData, error: complianceError } = await supabase
          .from('compliance_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (complianceData) {
          console.log('[Auth Service] Found compliance profile');
          return {
            ...complianceData,
            profileType: 'compliance',
            id: complianceData.id
          };
        }
        
        // If we have a role but no profile, return null early
        console.log('[Auth Service] No compliance profile found for compliance user');
        return null;
      }
      
      // If role is not specified or not one of the above, try all profiles in sequence
      
      // Try athlete profile
      const { data: athleteData, error: athleteError } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (athleteData) {
        console.log('[Auth Service] Found athlete profile');
        return {
          ...athleteData,
          profileType: 'athlete',
          id: athleteData.id
        };
      }
      
      // Try business profile
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (businessData) {
        console.log('[Auth Service] Found business profile');
        return {
          ...businessData,
          profileType: 'business',
          id: businessData.id
        };
      }
      
      // Try compliance officer profile
      const { data: complianceData, error: complianceError } = await supabase
        .from('compliance_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (complianceData) {
        console.log('[Auth Service] Found compliance profile');
        return {
          ...complianceData,
          profileType: 'compliance',
          id: complianceData.id
        };
      }
      
      // If no profile found
      console.log('[Auth Service] No profile found for user');
      return null;
    } catch (error: any) {
      console.error('[Auth Service] Error getting user profile:', error);
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }
  /**
   * Log in a user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;

      // Validate input
      if (!email || !password) {
        return { 
          success: false, 
          error: 'Email and password are required' 
        };
      }

      // Attempt login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        return { 
          success: false, 
          error: error.message || 'Invalid credentials' 
        };
      }

      if (!data.session || !data.user) {
        return { 
          success: false, 
          error: 'Authentication failed' 
        };
      }

      // Determine if user needs to complete profile
      const role = data.user.user_metadata?.role || data.user.user_metadata?.userType || 'user';
      const needsProfile = await this.checkIfProfileNeeded(data.user, role.toString());

      // Determine redirect URL based on role and profile status
      let redirectTo = '/dashboard';

      if (needsProfile) {
        redirectTo = '/onboarding';
      } else {
        // Different dashboard based on role
        const role = data.user.user_metadata?.role?.toLowerCase() ||
                     data.user.user_metadata?.userType?.toLowerCase() ||
                     'user';

        if (role === 'athlete') {
          redirectTo = '/athlete/dashboard';
        } else if (role === 'business') {
          redirectTo = '/business/dashboard';
        } else if (role === 'compliance') {
          redirectTo = '/compliance/dashboard';
        } else if (role === 'admin') {
          redirectTo = '/admin/dashboard';
        }
      }

      // Create placeholder business profile if needed
      if (data.user.user_metadata?.role === 'business') {
        await ensureBusinessProfile(data.user.id, 'business');
      }

      // Return success with user data, session, and navigation info
      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || 'user'
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        },
        needsProfile,
        redirectTo
      };
    } catch (error: any) {
      console.error('Login exception:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegistrationData): Promise<AuthResult> {
    try {
      const { email, password, firstName, lastName, role } = data;

      // Validate input
      if (!email || !password || !firstName || !role) {
        return { 
          success: false, 
          error: 'Required fields missing' 
        };
      }

      // Check password strength
      if (password.length < 8) {
        return {
          success: false,
          error: 'Password must be at least 8 characters long'
        };
      }

      // Attempt registration with Supabase
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName || '',
            role: role,
            full_name: `${firstName} ${lastName || ''}`.trim()
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        return { 
          success: false, 
          error: error.message || 'Registration failed' 
        };
      }

      if (!authData.user) {
        return { 
          success: false, 
          error: 'User creation failed' 
        };
      }

      // Create placeholder business profile if role is business
      if (role === 'business' && authData.user.id) {
        await ensureBusinessProfile(authData.user.id, role);
      }

      // Return success with user data and session if available
      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: role
        },
        session: authData.session ? {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at
        } : undefined,
        needsProfile: true,
        redirectTo: '/onboarding'
      };
    } catch (error: any) {
      console.error('Registration exception:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  }

  /**
   * Log out a user
   */
  async logout(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error);
        return { 
          success: false, 
          error: error.message || 'Logout failed' 
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Logout exception:', error);
      return { 
        success: false, 
        error: error.message || 'Logout failed' 
      };
    }
  }

  /**
   * Verify a token and get user info
   */
  async verifyToken(token: string): Promise<AuthResult> {
    try {
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return { 
          success: false, 
          error: error?.message || 'Invalid token' 
        };
      }

      // Get additional user data from the database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', user.id)
        .maybeSingle();

      // Determine effective role
      const effectiveRole = userData?.role || 
        user.user_metadata?.role || 
        user.user_metadata?.userType || 
        'user';

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: effectiveRole
        }
      };
    } catch (error: any) {
      console.error('Token verification exception:', error);
      return { 
        success: false, 
        error: error.message || 'Token verification failed' 
      };
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error || !data.session) {
        return { 
          success: false, 
          error: error?.message || 'Invalid refresh token' 
        };
      }

      return {
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
          role: data.user?.user_metadata?.role || 'user'
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      };
    } catch (error: any) {
      console.error('Token refresh exception:', error);
      return { 
        success: false, 
        error: error.message || 'Token refresh failed' 
      };
    }
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, userData: any): Promise<AuthResult> {
    try {
      // Don't allow role changes through this method
      if (userData.role) {
        delete userData.role;
      }

      // Update user metadata if provided
      if (Object.keys(userData).length > 0) {
        if (!supabaseAdmin) {
          console.error('[Auth Service] Supabase admin client not initialized');
          return {
            success: false,
            error: 'Supabase admin client not initialized'
          };
        }
        
        const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { user_metadata: userData }
        );

        if (metadataError) {
          console.error('Error updating user metadata:', metadataError);
          return { 
            success: false, 
            error: metadataError.message || 'Failed to update user metadata' 
          };
        }
      }

      // Update database record if needed
      if (userData.email || userData.firstName || userData.lastName) {
        const dbUpdates: any = {};

        if (userData.email) dbUpdates.email = userData.email;
        if (userData.firstName || userData.lastName) {
          const firstName = userData.firstName;
          const lastName = userData.lastName;
          if (firstName && lastName) {
            dbUpdates.full_name = `${firstName} ${lastName}`.trim();
          } else if (firstName) {
            dbUpdates.full_name = firstName;
          } else if (lastName) {
            // Get current first name
            const { data: currentUser } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', userId)
              .single();

            const currentName = currentUser?.full_name || '';
            const firstName = currentName.split(' ')[0] || '';
            dbUpdates.full_name = `${firstName} ${lastName}`.trim();
          }
        }

        if (Object.keys(dbUpdates).length > 0) {
          const { error: dbError } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', userId);

          if (dbError) {
            console.error('Error updating user in database:', dbError);
            // Continue anyway, as metadata update succeeded
          }
        }
      }

      // Get updated user data
      if (!supabaseAdmin) {
        console.error('[Auth Service] Supabase admin client not initialized');
        return {
          success: true, 
          user: { id: userId, ...userData }
        };
      }
      
      const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
        userId
      );

      if (getUserError || !user) {
        return { 
          success: true, 
          user: { id: userId, ...userData }
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'user',
          ...user.user_metadata
        }
      };
    } catch (error: any) {
      console.error('Update user exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update user' 
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      // First verify the current password
      if (!supabaseAdmin) {
        console.error('[Auth Service] Supabase admin client not initialized');
        return {
          success: false,
          error: 'Supabase admin client not initialized'
        };
      }
      
      const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
        userId
      );

      if (getUserError || !userData.user) {
        return { 
          success: false, 
          error: 'User not found' 
        };
      }

      // Get user's email
      const email = userData.user.email;

      if (!email) {
        return { 
          success: false, 
          error: 'User email not found' 
        };
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword
      });

      if (signInError) {
        return { 
          success: false, 
          error: 'Current password is incorrect' 
        };
      }

      // Update to new password
      // We've already checked for supabaseAdmin above, but TypeScript needs this check again
      if (!supabaseAdmin) {
        console.error('[Auth Service] Supabase admin client not initialized');
        return {
          success: false,
          error: 'Supabase admin client not initialized'
        };
      }
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        return { 
          success: false, 
          error: updateError.message || 'Failed to update password' 
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Change password exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to change password' 
      };
    }
  }

  /**
   * Request password reset email
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${config.SERVER_URL || ''}/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to send password reset email' 
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Password reset exception:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send password reset email' 
      };
    }
  }

  /**
   * Check if user needs to complete their profile
   * @param user The user object
   * @param providedRole Optional role string, to avoid re-computing it
   */
  private async checkIfProfileNeeded(user: any, providedRole?: string): Promise<boolean> {
    try {
      const role = providedRole?.toLowerCase() || 
                   user.user_metadata?.role?.toLowerCase() ||
                   user.user_metadata?.userType?.toLowerCase() ||
                   'user';

      // First check if onboarding_progress table has this user marked as complete
      const { data: progressData } = await supabase
        .from('onboarding_progress')
        .select('is_complete')
        .eq('id', user.id)
        .maybeSingle();

      if (progressData?.is_complete) {
        return false; // Profile is complete
      }

      // Check if user has a profile based on their role
      if (role === 'athlete') {
        const { data: athleteData, error: athleteError } = await supabase
          .from('athlete_profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!athleteError && athleteData) {
          return false; // Has athlete profile
        }
      } else if (role === 'business') {
        const { data: businessData, error: businessError } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (!businessError && businessData) {
          return false; // Has business profile
        }
      } else if (role === 'compliance' || role === 'admin') {
        return false; // Compliance and admin users don't need additional profiles
      }

      return true; // Profile needed
    } catch (error) {
      console.error('Error checking profile status:', error);
      return true; // Assume profile is needed on error
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;