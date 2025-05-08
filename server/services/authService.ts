/** 05/08/2025 - 14:16 CST
 * Authentication Service
 * 
 * Provides a unified interface for all authentication operations.
 * Handles user registration, login, token verification, and session management.
 */

import { supabase, supabaseAdmin } from '../lib/supabase';
import config from '../config/environment';
import { v4 as uuidv4 } from 'uuid';

// Types for authentication
export interface AuthResult {
  success: boolean;
  user?: UserInfo;
  session?: SessionInfo;
  error?: string;
  needsProfile?: boolean;
  redirectTo?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

export interface SessionInfo {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  [key: string]: any; // Additional fields specific to user type
}

class AuthService {
  /**
   * User login with email and password
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

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user || !data.session) {
        return { 
          success: false, 
          error: error?.message || 'Invalid credentials' 
        };
      }

      // Get user info including role
      const role = this.determineUserRole(data.user);

      // Update last login time
      await this.updateLastLogin(data.user.id);

      // Get user profile status
      const { needsProfile, redirectTo } = await this.checkProfileStatus(data.user.id, role);

      // Format user data to return
      const userInfo: UserInfo = {
        id: data.user.id,
        email: data.user.email || email,
        role: role,
        firstName: data.user.user_metadata?.first_name || data.user.user_metadata?.firstName,
        lastName: data.user.user_metadata?.last_name || data.user.user_metadata?.lastName
      };

      // Format session data
      const sessionInfo: SessionInfo = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || (Math.floor(Date.now() / 1000) + 3600)
      };

      return {
        success: true,
        user: userInfo,
        session: sessionInfo,
        needsProfile,
        redirectTo
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  /**
   * Register a new user
   */
  async register(registrationData: RegistrationData): Promise<AuthResult> {
    try {
      const { email, password, firstName, lastName, role, ...additionalData } = registrationData;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !role) {
        return { 
          success: false, 
          error: 'Required fields missing' 
        };
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        return { 
          success: false, 
          error: 'User with this email already exists' 
        };
      }

      // Register with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
            ...additionalData
          }
        }
      });

      if (error || !data.user) {
        return { 
          success: false, 
          error: error?.message || 'Registration failed' 
        };
      }

      // Create record in users table
      await this.createUserRecord(data.user.id, {
        email,
        firstName,
        lastName,
        role,
        ...additionalData
      });

      // Create initial profile based on user type
      if (role === 'athlete') {
        await this.createInitialAthleteProfile(data.user.id, {
          email,
          firstName,
          lastName,
          ...additionalData
        });
      } else if (role === 'business') {
        await this.createInitialBusinessProfile(data.user.id, {
          email,
          firstName,
          lastName,
          ...additionalData
        });
      }

      // Format user data to return
      const userInfo: UserInfo = {
        id: data.user.id,
        email: data.user.email || email,
        role: role,
        firstName: firstName,
        lastName: lastName
      };

      // Format session data if available
      let sessionInfo = undefined;
      if (data.session) {
        sessionInfo = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at || (Math.floor(Date.now() / 1000) + 3600)
        };
      }

      return {
        success: true,
        user: userInfo,
        session: sessionInfo,
        needsProfile: true,
        redirectTo: '/onboarding'
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  /**
   * Verify a token and get user information
   */
  async verifyToken(token: string): Promise<AuthResult> {
    try {
      if (!token) {
        return { 
          success: false, 
          error: 'No token provided' 
        };
      }

      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return { 
          success: false, 
          error: error?.message || 'Invalid token' 
        };
      }

      // Get user information including role
      const role = this.determineUserRole(data.user);

      // Get user record from users table
      const { data: userRecord } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      // Get profile information
      const { needsProfile, redirectTo } = await this.checkProfileStatus(data.user.id, role);

      // Format user data to return
      const userInfo: UserInfo = {
        id: data.user.id,
        email: data.user.email || '',
        role: role,
        firstName: data.user.user_metadata?.first_name || data.user.user_metadata?.firstName,
        lastName: data.user.user_metadata?.last_name || data.user.user_metadata?.lastName,
        // Include additional user fields from database if available
        ...(userRecord || {})
      };

      return {
        success: true,
        user: userInfo,
        needsProfile,
        redirectTo
      };
    } catch (error: any) {
      console.error('Token verification error:', error);
      return {
        success: false,
        error: error.message || 'Token verification failed'
      };
    }
  }

  /**
   * Refresh an authentication token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      if (!refreshToken) {
        return { 
          success: false, 
          error: 'No refresh token provided' 
        };
      }

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error || !data.user || !data.session) {
        return { 
          success: false, 
          error: error?.message || 'Invalid refresh token' 
        };
      }

      // Get user info including role
      const role = this.determineUserRole(data.user);

      // Format user data to return
      const userInfo: UserInfo = {
        id: data.user.id,
        email: data.user.email || '',
        role: role,
        firstName: data.user.user_metadata?.first_name || data.user.user_metadata?.firstName,
        lastName: data.user.user_metadata?.last_name || data.user.user_metadata?.lastName
      };

      // Format session data
      const sessionInfo: SessionInfo = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at || (Math.floor(Date.now() / 1000) + 3600)
      };

      return {
        success: true,
        user: userInfo,
        session: sessionInfo
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message || 'Token refresh failed'
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
        return { 
          success: false, 
          error: error.message 
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message || 'Logout failed'
      };
    }
  }

  /**
   * Update a user's profile
   */
  async updateUser(userId: string, userData: Partial<UserInfo>): Promise<AuthResult> {
    try {
      // Update user metadata in Auth
      const { firstName, lastName, email, ...otherData } = userData;

      const authUpdateData: any = {};
      const userMetadata: any = {};

      if (email) authUpdateData.email = email;
      if (firstName) userMetadata.first_name = firstName;
      if (lastName) userMetadata.last_name = lastName;

      // Only update auth if we have data to update
      if (Object.keys(authUpdateData).length > 0 || Object.keys(userMetadata).length > 0) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            ...authUpdateData,
            user_metadata: userMetadata
          }
        );

        if (authError) {
          console.error('Error updating auth user:', authError);
        }
      }

      // Update user record in database
      const updateData: any = {};
      if (email) updateData.email = email;
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;

      // Add other fields to update
      Object.keys(otherData).forEach(key => {
        // Convert camelCase to snake_case for database
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[snakeKey] = (otherData as any)[key];
      });

      // Only update if we have data
      if (Object.keys(updateData).length > 0) {
        const { error: dbError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);

        if (dbError) {
          return { 
            success: false, 
            error: dbError.message || 'Failed to update user' 
          };
        }
      }

      // Get updated user
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      return {
        success: true,
        user: this.formatUserData(updatedUser)
      };
    } catch (error: any) {
      console.error('User update error:', error);
      return {
        success: false,
        error: error.message || 'User update failed'
      };
    }
  }

  /**
   * Change a user's password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<AuthResult> {
    try {
      // First verify the old password by signing in
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (!userData || !userData.email) {
        return { 
          success: false, 
          error: 'User not found' 
        };
      }

      // Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: oldPassword
      });

      if (signInError) {
        return { 
          success: false, 
          error: 'Current password is incorrect' 
        };
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return { 
          success: false, 
          error: updateError.message || 'Failed to update password' 
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Password change error:', error);
      return {
        success: false,
        error: error.message || 'Password change failed'
      };
    }
  }

  /**
   * Send a password reset email
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${config.SERVER_URL}/reset-password`
      });

      if (error) {
        return { 
          success: false, 
          error: error.message 
        };
      }

      return {
        success: true
      };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: error.message || 'Password reset failed'
      };
    }
  }

  // Helper methods

  /**
   * Determine user role from user data
   */
  private determineUserRole(user: any): string {
    // Try different locations where role might be stored
    return user.user_metadata?.role || 
           user.role || 
           user.user_metadata?.userType ||
           user.user_metadata?.user_type || 
           'user';
  }

  /**
   * Update last login time
   */
  private async updateLastLogin(userId: string): Promise<void> {
    try {
      await supabase
        .from('users')
        .upsert({
          id: userId,
          last_login: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Check if a user has completed their profile
   */
  private async checkProfileStatus(userId: string, role: string): Promise<{ needsProfile: boolean, redirectTo?: string }> {
    try {
      // Check if user has a profile based on their role
      if (role === 'athlete') {
        const { data } = await supabase
          .from('athlete_profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (!data) {
          return { needsProfile: true, redirectTo: '/onboarding/athlete' };
        }
      } else if (role === 'business') {
        const { data } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (!data) {
          return { needsProfile: true, redirectTo: '/onboarding/business' };
        }
      }

      return { needsProfile: false };
    } catch (error) {
      console.error('Error checking profile status:', error);
      return { needsProfile: false };
    }
  }

  /**
   * Create a user record in the database
   */
  private async createUserRecord(userId: string, userData: any): Promise<void> {
    try {
      const { firstName, lastName, email, role, ...additionalData } = userData;

      // Map camelCase to snake_case
      const dbData: any = {
        id: userId,
        email: email,
        role: role,
        first_name: firstName,
        last_name: lastName,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };

      // Add additional fields
      Object.keys(additionalData).forEach(key => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        dbData[snakeKey] = additionalData[key];
      });

      await supabase
        .from('users')
        .upsert(dbData, { onConflict: 'id' });
    } catch (error) {
      console.error('Error creating user record:', error);
    }
  }

  /**
   * Create an initial athlete profile
   */
  private async createInitialAthleteProfile(userId: string, userData: any): Promise<void> {
    try {
      const { firstName, lastName, email } = userData;

      await supabase
        .from('athlete_profiles')
        .upsert({
          id: userId,
          name: `${firstName} ${lastName}`,
          email: email,
          session_id: uuidv4(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (error) {
      console.error('Error creating initial athlete profile:', error);
    }
  }

  /**
   * Create an initial business profile
   */
  private async createInitialBusinessProfile(userId: string, userData: any): Promise<void> {
    try {
      const { firstName, lastName, email } = userData;

      await supabase
        .from('business_profiles')
        .upsert({
          id: userId,
          name: userData.businessName || `${firstName} ${lastName}'s Business`,
          email: email,
          session_id: uuidv4(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch (error) {
      console.error('Error creating initial business profile:', error);
    }
  }

  /**
   * Format user data from database to standard format
   */
  private formatUserData(dbUser: any): UserInfo {
    if (!dbUser) return {} as UserInfo;

    return {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      // Add other fields from database
      ...Object.keys(dbUser).reduce((acc: any, key) => {
        // Convert snake_case to camelCase
        if (!['id', 'email', 'role', 'first_name', 'last_name'].includes(key)) {
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          acc[camelKey] = dbUser[key];
        }
        return acc;
      }, {})
    };
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;