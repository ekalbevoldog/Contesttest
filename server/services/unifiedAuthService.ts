import { supabase } from "../supabase.js";
import { SupabaseClient, AuthResponse, AuthUser, Session, User } from "@supabase/supabase-js";

// Custom interface to help with our authentication processes
interface CustomAuthResponse {
  data: {
    user: User | null;
    session: Session | null;
    weakPassword?: any;
  };
  error: Error | null;
}

// — Types —
export interface AuthResult {
  success: boolean;
  user?: { id: string; email: string; role: string };
  session?: { access_token: string; refresh_token: string; expires_at: number };
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

// — Unified Authentication Service —
export class UnifiedAuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabase;
  }

  /** Sign in */
  async login({ email, password }: LoginCredentials): Promise<AuthResult> {
    if (!email || !password)
      return { success: false, error: "Email and password are required" };

    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError || !authData.session || !authData.user) {
      return { success: false, error: authError?.message || "Invalid credentials" };
    }
    
    // Create a CustomAuthResponse from the Supabase response
    const customAuthResponse: CustomAuthResponse = {
      data: {
        user: authData.user,
        session: authData.session
      },
      error: null
    };

    return this.processSuccessfulAuth(customAuthResponse, email);
  }

  /** Register */
  async register(input: RegistrationData): Promise<AuthResult> {
    const { email, password, fullName, role } = input;
    if (!email || !password || !fullName || !role)
      return { success: false, error: "Missing required registration fields" };

    // Prevent duplicate
    const { data: existing } = await this.supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      return { success: false, error: "User with this email already exists" };
    }

    // Sign up
    const { data: signUpData, error: signUpErr } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (signUpErr || !signUpData.session || !signUpData.user) {
      return { success: false, error: signUpErr?.message || "Registration failed" };
    }

    // Create DB record
    const userId = signUpData.user.id;
    const { data: newUser, error: insertErr } = await this.supabase
      .from("users")
      .insert({
        id: userId,
        email,
        role,
        full_name: fullName,
        created_at: new Date(),
      })
      .select()
      .single();
    if (insertErr || !newUser) {
      return { success: false, error: insertErr?.message || "Failed to create user record" };
    }

    return {
      success: true,
      user: { id: newUser.id, email, role },
      session: {
        access_token: signUpData.session.access_token,
        refresh_token: signUpData.session.refresh_token,
        expires_at: typeof signUpData.session.expires_at === 'number' ? 
          signUpData.session.expires_at : 
          Math.floor(Date.now() / 1000) + 3600, // Default 1 hour expiration
      },
      needsProfile: true,
      redirectTo: "/onboarding",
    };
  }

  /** Logout */
  async logout(): Promise<AuthResult> {
    const { error } = await this.supabase.auth.signOut();
    return error ? { success: false, error: error.message } : { success: true };
  }

  /** Get current user from token */
  async getCurrentUser(token: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user) {
      return { success: false, error: error?.message || "Not authenticated" };
    }
    
    // Create a proper CustomAuthResponse structure for processSuccessfulAuth
    const authResponse: CustomAuthResponse = {
      data: {
        user: data.user,
        session: null // We don't have session in getUser response
      },
      error: null
    };
    
    return this.processSuccessfulAuth(authResponse as any, data.user.email || "");
  }

  /** Refresh session */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session || !data.user) {
      return { success: false, error: error?.message || "Failed to refresh token" };
    }
    
    // Create a proper CustomAuthResponse structure for processSuccessfulAuth
    const authResponse: CustomAuthResponse = {
      data: {
        user: data.user,
        session: data.session
      },
      error: null
    };
    
    return this.processSuccessfulAuth(authResponse as any, data.user.email || "");
  }

  /** Update user profile */
  async updateProfile(id: string, profileData: Partial<any>): Promise<AuthResult> {
    const { data, error } = await this.supabase
      .from("users")
      .update(profileData)
      .eq("id", id)
      .select()
      .single();
    return error || !data
      ? { success: false, error: error?.message || "Failed to update profile" }
      : { success: true, user: data };
  }

  /** Internal helper */
  private async processSuccessfulAuth(
    authResponse: CustomAuthResponse,
    email: string
  ): Promise<AuthResult> {
    const { user, session } = authResponse.data;
    
    // For getCurrentUser calls, we may not have a session
    if (!user) {
      return { success: false, error: "Invalid auth data: missing user" };
    }

    const userId = user.id;
    // Sync users table (upsert by PK=id)
    const { data: userRecord, error: upsertErr } = await this.supabase
      .from("users")
      .upsert(
        { id: userId, email, role: user.user_metadata?.role || "user", last_login: new Date() },
        { onConflict: "id" }
      )
      .select()
      .single();
    if (upsertErr || !userRecord) {
      return { success: false, error: upsertErr?.message || "Failed to sync user record" };
    }

    // Basic response without session
    const authResult: AuthResult = {
      success: true,
      user: { id: userRecord.id, email, role: userRecord.role }
    };
    
    // Add session data if available
    if (session) {
      authResult.session = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        // Make sure expires_at is a number
        expires_at: typeof session.expires_at === 'number' ? 
          session.expires_at : 
          Math.floor(Date.now() / 1000) + 3600 // Default 1 hour expiration if not provided
      };
    }
    
    return authResult;
  }
}

export const authService = new UnifiedAuthService();
