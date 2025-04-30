import { supabase } from "../supabase.js";
import { createClient, SupabaseClient, AuthResponse } from "@supabase/supabase-js";
import { storage } from "../storage.js";
import { objectStorage } from "../objectStorage.js";

// Types
export interface AuthResult {
  success: boolean;
  user?: any;
  session?: any;
  needsProfile?: boolean;
  redirectTo?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

/**
 * Unified Authentication Service
 * 
 * This service consolidates authentication functionality using Supabase
 * as the primary provider with robust error handling and fallbacks.
 */
export class UnifiedAuthService {
  private supabase: SupabaseClient;
  private fallbackClient: SupabaseClient | null = null;
  
  constructor() {
    this.supabase = supabase;
    
    // Initialize a fallback client if possible
    try {
      if (process.env.SUPABASE_FALLBACK_URL && process.env.SUPABASE_FALLBACK_KEY) {
        this.fallbackClient = createClient(
          process.env.SUPABASE_FALLBACK_URL,
          process.env.SUPABASE_FALLBACK_KEY
        );
        console.log("Fallback Supabase client initialized");
      }
    } catch (error) {
      console.error("Failed to initialize fallback Supabase client:", error);
    }
  }
  
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Try primary Supabase instance
      const { email, password } = credentials;
      
      if (!email || !password) {
        return { 
          success: false, 
          error: "Email and password are required" 
        };
      }
      
      console.log("Login attempt for:", email);
      
      const {
        data: authData,
        error: authError
      } = await this.supabase.auth.signInWithPassword({ email, password });
      
      // If primary auth fails, try fallback if available
      if (authError && this.fallbackClient) {
        console.log("Primary auth failed, trying fallback");
        const fallbackResult = await this.fallbackClient.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (!fallbackResult.error) {
          console.log("Fallback auth succeeded");
          return this.processSuccessfulAuth(fallbackResult, email);
        }
      }
      
      // If we had an error and either no fallback is available or fallback also failed
      if (authError) {
        console.error("Supabase auth error:", authError);
        return { 
          success: false, 
          error: "Invalid credentials" 
        };
      }
      
      // Process the successful authentication
      return this.processSuccessfulAuth({ data: authData, error: null }, email);
      
    } catch (error) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: "Login failed due to a server error" 
      };
    }
  }
  
  /**
   * Register a new user
   */
  async register(data: RegistrationData): Promise<AuthResult> {
    try {
      const { email, password, fullName, role } = data;
      
      if (!email || !password || !fullName || !role) {
        return { 
          success: false, 
          error: "Missing required fields" 
        };
      }
      
      // Check if user already exists
      const { data: existingUser } = await this.supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();
        
      if (existingUser) {
        return { 
          success: false, 
          error: "User with this email already exists" 
        };
      }
      
      // Register the user with Supabase Auth
      const { data: signUpData, error: signUpErr } = await this.supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            full_name: fullName, 
            role 
          } 
        }
      });
      
      if (signUpErr) {
        console.error("Supabase signup error:", signUpErr);
        return { 
          success: false, 
          error: signUpErr.message 
        };
      }
      
      // Map role → DB enum
      let dbRole: string;
      switch (role) {
        case "business":
          dbRole = "business";
          break;
        case "compliance":
          dbRole = "compliance_officer";
          break;
        case "admin":
        case "athlete":
          dbRole = role;
          break;
        default:
          dbRole = "athlete";
      }
      
      // Store the user in our database
      const userToInsert = { 
        email, 
        role: dbRole, 
        auth_id: signUpData.user?.id,
        created_at: new Date() 
      };
      
      const { data: insertedUser, error: insertErr } = await this.supabase
        .from("users")
        .insert(userToInsert)
        .select()
        .single();
        
      if (insertErr) {
        console.error("DB insert error:", insertErr);
        return { 
          success: false, 
          error: "Failed to store user" 
        };
      }
      
      return { 
        success: true, 
        user: insertedUser,
        needsProfile: true,
        redirectTo: "/onboarding"
      };
      
    } catch (error) {
      console.error("Registration error:", error);
      return { 
        success: false, 
        error: "Registration failed due to a server error" 
      };
    }
  }
  
  /**
   * Logout the current user
   */
  async logout(): Promise<AuthResult> {
    try {
      await this.supabase.auth.signOut();
      return { 
        success: true 
      };
    } catch (error) {
      console.error("Logout error:", error);
      return { 
        success: false, 
        error: "Logout failed" 
      };
    }
  }
  
  /**
   * Get the current user
   */
  async getCurrentUser(token: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      
      if (error || !data.user) {
        return { 
          success: false, 
          error: "Not authenticated" 
        };
      }
      
      // Fetch the user profile
      const { data: userRecord, error: userError } = await this.supabase
        .from("users")
        .select("*")
        .eq("auth_id", data.user.id)
        .single();
        
      if (userError || !userRecord) {
        // Try with email as fallback
        if (data.user.email) {
          const { data: emailRecord, error: emailError } = await this.supabase
            .from("users")
            .select("*")
            .eq("email", data.user.email)
            .single();
            
          if (!emailError && emailRecord) {
            return { 
              success: true, 
              user: emailRecord 
            };
          }
        }
        
        // User exists in auth but not in users table - they need to complete onboarding
        return { 
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata?.role || "user"
          },
          needsProfile: true,
          redirectTo: "/onboarding"
        };
      }
      
      return { 
        success: true, 
        user: userRecord 
      };
      
    } catch (error) {
      console.error("Get current user error:", error);
      return { 
        success: false, 
        error: "Failed to fetch user" 
      };
    }
  }
  
  /**
   * Update a user profile
   */
  async updateProfile(userId: string, profileData: any): Promise<AuthResult> {
    try {
      // Check if userId is a numeric ID or an auth_id (UUID)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      
      let query;
      if (isUUID) {
        console.log(`Updating user by auth_id: ${userId}`);
        query = this.supabase
          .from("users")
          .update(profileData)
          .eq("auth_id", userId);
      } else {
        console.log(`Updating user by id: ${userId}`);
        query = this.supabase
          .from("users")
          .update(profileData)
          .eq("id", userId);
      }
      
      const { data, error } = await query.select().single();
        
      if (error) {
        console.error("Profile update error:", error);
        return { 
          success: false, 
          error: "Failed to update profile" 
        };
      }
      
      return { 
        success: true, 
        user: data 
      };
      
    } catch (error) {
      console.error("Update profile error:", error);
      return { 
        success: false, 
        error: "Failed to update profile" 
      };
    }
  }
  
  /**
   * Refresh the authentication token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken
      });
      
      if (error || !data.session) {
        console.error("Token refresh error:", error);
        return { 
          success: false, 
          error: "Failed to refresh token" 
        };
      }
      
      return { 
        success: true, 
        session: data.session 
      };
      
    } catch (error) {
      console.error("Token refresh error:", error);
      return { 
        success: false, 
        error: "Failed to refresh token" 
      };
    }
  }
  
  /**
   * Process a successful authentication
   * Private helper method to handle the logic after successful authentication
   */
  private async processSuccessfulAuth(authResponse: AuthResponse, email: string): Promise<AuthResult> {
    const { data: authData } = authResponse;
    
    if (!authData?.user || !authData?.session) {
      return { 
        success: false, 
        error: "Invalid authentication data" 
      };
    }
    
    // Update last_login
    await this.supabase
      .from("users")
      .update({ last_login: new Date() })
      .eq("email", email);
      
    // Fetch user profile
    const { data: userRecord, error: userError } = await this.supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();
    
    // Try with auth_id if email lookup fails
    if (userError || !userRecord) {
      const { data: authIdRecord, error: authIdError } = await this.supabase
        .from("users")
        .select("*")
        .eq("auth_id", authData.user.id)
        .single();
        
      if (authIdError || !authIdRecord) {
        // User exists in auth but not in users table - they need to complete onboarding
        return {
          success: true,
          user: {
            id: authData.user.id,
            email: email,
            role: authData.user.user_metadata?.role || "user"
          },
          needsProfile: true,
          redirectTo: "/onboarding",
          session: {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_at: authData.session.expires_at
          }
        };
      }
      
      // Found user by auth_id, use this record
      return {
        success: true,
        user: {
          id: authIdRecord.id, // Use the database ID, not the auth ID
          auth_id: authData.user.id,
          email,
          role: authIdRecord.role || "user"
        },
        profile: authIdRecord,
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at
        }
      };
    }
    
    // Make sure the auth_id is updated in the user record if it's missing
    if (userRecord && userRecord.id && (!userRecord.auth_id || userRecord.auth_id !== authData.user.id)) {
      console.log(`Updating auth_id for user ${userRecord.id} to ${authData.user.id}`);
      try {
        await this.supabase
          .from("users")
          .update({ auth_id: authData.user.id })
          .eq("id", userRecord.id);
      } catch (updateError) {
        console.error("Failed to update auth_id:", updateError);
      }
    }

    // Return user + session
    return {
      success: true,
      user: {
        id: userRecord.id, // Use the database ID, not the auth ID
        auth_id: authData.user.id,
        email,
        role: userRecord.role || "user"
      },
      profile: userRecord,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      }
    };
  }
}

// Export singleton instance
export const authService = new UnifiedAuthService();