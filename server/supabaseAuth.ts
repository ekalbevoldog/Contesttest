import { Express, Request, Response, NextFunction } from "express";
import { supabase, supabaseAdmin } from "./supabase.js";

// Extend Express Request to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email?: string;
      role: string;
      [key: string]: any;
    };
  }
}

/**
 * Middleware: Verify Supabase JWT Bearer token
 */
export const verifySupabaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("[Auth] Verifying token");
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error("[Auth] Token verification error:", error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    console.log(`[Auth] Token verified for user: ${data.user.id} (${data.user.email})`);
    req.user = {
      id: data.user.id,
      email: data.user.email || undefined,
      role: data.user.user_metadata?.role || "user",
      ...data.user.user_metadata
    };
    next();
  } catch (err) {
    console.error("[Auth] Middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Setup Supabase Auth & Registration routes with improved error handling
 */
export function setupSupabaseAuth(app: Express) {
  // ——— LOGIN —————————————————————————————————
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("[Auth] Login request received");
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      console.log("[Auth] Login attempt for:", email);
      const {
        data: authData,
        error: authError
      } = await supabase.auth.signInWithPassword({ email, password });
      
      if (authError || !authData.user || !authData.session) {
        console.error("[Auth] Supabase auth error:", authError);
        return res.status(401).json({ 
          error: "Invalid credentials",
          details: authError?.message || "Authentication failed"
        });
      }
      
      console.log(`[Auth] User authenticated successfully: ${authData.user.id}`);
      
      // Update last_login
      const { error: updateError } = await supabase
        .from("users")
        .update({ last_login: new Date() })
        .eq("email", email);
        
      if (updateError) {
        console.warn("[Auth] Failed to update last_login:", updateError);
      }
      
      // Fetch user profile
      console.log("[Auth] Fetching user profile by email");
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (userError || !userRecord) {
        console.log("[Auth] User not found by email, trying auth_id");
        // Try again with auth_id which is the correct identifier
        const { data: authIdRecord, error: authIdError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", authData.user.id)
          .single();

        if (authIdError || !authIdRecord) {
          console.log("[Auth] User authenticated but needs onboarding:", authData.user.id);

          // User exists in auth but not in users table - they need to complete onboarding
          return res.status(200).json({
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
          });
        }

        // Found user by auth_id, use this record
        console.log("[Auth] Found user by auth_id:", authIdRecord.role);
        return res.status(200).json({
          user: {
            id: authData.user.id,
            email,
            role: authIdRecord.role || "user"
          },
          profile: authIdRecord,
          session: {
            access_token: authData.session.access_token,
            refresh_token: authData.session.refresh_token,
            expires_at: authData.session.expires_at
          }
        });
      }
      
      // Set cookies
      const sessionObj = {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        user_id: authData.user.id,
        timestamp: Date.now()
      };
      
      res.cookie("supabase-auth", JSON.stringify(sessionObj), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/"
      });
      
      res.cookie("sb-access-token", authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/"
      });
      
      res.cookie("sb-refresh-token", authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/"
      });
      
      res.cookie("auth-status", "authenticated", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/"
      });
      
      console.log("[Auth] Login successful, returning user data");
      
      // Return user + session
      return res.status(200).json({
        user: {
          id: authData.user.id,
          email,
          role: userRecord.role || "user"
        },
        profile: userRecord,
        session: {
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
          expires_at: authData.session.expires_at
        }
      });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      return res.status(500).json({ error: "Login failed", details: String(error) });
    }
  });

  // ——— LOGOUT —————————————————————————————————
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      console.log("[Auth] Logout request received");
      await supabase.auth.signOut();
      
      // Clear cookies
      ["supabase-auth", "sb-access-token", "sb-refresh-token", "auth-status"].forEach(c =>
        res.clearCookie(c, { path: "/" })
      );
      
      console.log("[Auth] Logout successful");
      return res.status(200).json({ message: "Logged out" });
    } catch (err) {
      console.error("[Auth] Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
  });

  // ——— WHOAMI —————————————————————————————————
  app.get(
    "/api/auth/user",
    verifySupabaseToken,
    async (req: Request, res: Response) => {
      try {
        console.log("[Auth] User info request received");
        if (!req.user?.email && !req.user?.id) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        
        let userQuery = supabase.from("users").select("*");
        
        if (req.user.email) {
          console.log(`[Auth] Fetching user by email: ${req.user.email}`);
          userQuery = userQuery.eq("email", req.user.email);
        } else {
          console.log(`[Auth] Fetching user by auth_id: ${req.user.id}`);
          userQuery = userQuery.eq("auth_id", req.user.id);
        }
        
        const { data, error } = await userQuery.single();
        
        if (error || !data) {
          console.error("[Auth] Profile fetch error:", error);
          
          // If no user record found but we have authenticated user, return minimal info
          if (error.code === 'PGRST116') {
            console.log("[Auth] No user record found, returning minimal info");
            return res.status(200).json({ 
              user: {
                id: req.user.id,
                email: req.user.email,
                role: req.user.role,
                needsProfile: true
              } 
            });
          }
          
          return res.status(500).json({ error: "Failed to fetch profile" });
        }
        
        console.log(`[Auth] User profile found: ${data.id}`);
        return res.status(200).json({ user: data });
      } catch (err) {
        console.error("[Auth] Whoami error:", err);
        return res.status(500).json({ error: "Failed to fetch user" });
      }
    }
  );

  // ——— REGISTER —————————————————————————————————
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      console.log("[Auth] Registration request received");
      const { email, password, fullName, role, auth_id } = req.body;
      
      if (!email || !password || !fullName || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Step 1: Check if user already exists in Auth or Users table
      console.log("[Auth] Checking for existing user with email:", email);
      
      // Check users table first
      const { data: existingUserData, error: existingUserError } = await supabase
        .from("users")
        .select("id, auth_id, email")
        .eq("email", email)
        .single();
        
      if (existingUserData) {
        console.log(`[Auth] User already exists in users table: ${existingUserData.id}`);
        
        // User exists in our database - let's check if they have an auth_id
        if (existingUserData.auth_id) {
          console.log(`[Auth] User has auth_id: ${existingUserData.auth_id}`);
          return res.status(409).json({ 
            error: "User with this email already exists",
            details: "This email is already registered" 
          });
        }
        
        // User exists but no auth_id - we need to create auth account and link it
        console.log(`[Auth] User exists but has no auth_id. Creating auth account to link.`);
      }
      
      // Step 2: Handle auth_id if provided (from client registration flow)
      let authUserId = auth_id;
      
      // If no auth_id provided, create Supabase Auth user
      if (!authUserId) {
        console.log("[Auth] No auth_id provided, creating user in Supabase Auth");
        const { data: signUpData, error: signUpErr } =
          await supabase.auth.signUp({
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
          console.error("[Auth] Supabase signup error:", signUpErr);
          return res.status(400).json({ 
            error: "Registration failed",
            details: signUpErr.message
          });
        }
        
        // Step 3: Verify auth account was created
        console.log("[Auth] Verifying auth account creation");
        if (!signUpData?.user?.id) {
          console.error("[Auth] Auth signup succeeded but no user ID was returned");
          return res.status(500).json({ 
            error: "User creation incomplete",
            details: "Auth account created but user ID missing" 
          });
        }
        
        authUserId = signUpData.user.id;
        console.log(`[Auth] Auth account created successfully: ${authUserId}`);
      } else {
        console.log(`[Auth] Using provided auth_id: ${authUserId}`);
      }
      
      // Step 4: Map role for database
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
      
      // Step 5: Handle user record creation/update
      if (existingUserData) {
        // Update existing user with auth_id
        console.log(`[Auth] Updating existing user ${existingUserData.id} with auth_id ${authUserId}`);
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({ 
            auth_id: authUserId,
            role: dbRole 
          })
          .eq("id", existingUserData.id)
          .select()
          .single();
          
        if (updateError) {
          console.error("[Auth] Failed to update existing user with auth_id:", updateError);
          return res.status(500).json({ 
            error: "Failed to link user record to authentication",
            details: updateError.message
          });
        }
        
        console.log(`[Auth] Successfully updated user with auth_id: ${updatedUser.id}`);
        return res.status(200).json({ 
          message: "User account linked successfully", 
          user: updatedUser,
          auth_id: authUserId 
        });
      } else {
        // Create new user record
        console.log(`[Auth] Creating new user record with auth_id ${authUserId}`);
        
        // First check if a user with this auth_id already exists (shouldn't happen but check)
        const { data: existingByAuthId, error: checkAuthIdError } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", authUserId)
          .single();
          
        if (existingByAuthId) {
          console.log(`[Auth] User already exists with auth_id ${authUserId}, id: ${existingByAuthId.id}`);
          
          // Since user already exists, just return it
          const { data: userData, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("id", existingByAuthId.id)
            .single();
            
          if (fetchError) {
            console.error("[Auth] Error fetching existing user:", fetchError);
            return res.status(500).json({ error: "Failed to retrieve user data" });
          }
          
          return res.status(200).json({ message: "User already exists", user: userData });
        }
        
        // Prepare user data for insertion
        const userToInsert = { 
          email, 
          role: dbRole, 
          auth_id: authUserId,
          username: email.split('@')[0],  // Generate a basic username
          created_at: new Date() 
        };
        
        // Insert the new user
        console.log(`[Auth] Inserting new user with data:`, JSON.stringify(userToInsert));
        const { data, error: insertErr } = await supabase
          .from("users")
          .insert(userToInsert)
          .select()
          .single();
          
        if (insertErr) {
          console.error("[Auth] DB insert error:", insertErr);
          
          // Get more details about the error for debugging
          console.log("[Auth] Insert error details:", JSON.stringify(insertErr));
          
          // Check specific error conditions
          if (insertErr.code === '23505') {
            // Unique constraint violation - likely duplicate email or username
            if (insertErr.message?.includes('username')) {
              return res.status(409).json({ 
                error: "Username already taken",
                details: "Please try a different username" 
              });
            } else {
              return res.status(409).json({ 
                error: "User with this email already exists",
                details: "This email is already registered" 
              });
            }
          } else if (insertErr.code === '23503') {
            // Foreign key constraint - likely auth_id issue
            return res.status(500).json({ 
              error: "Failed to link user record to authentication", 
              details: "Foreign key constraint violation - auth_id may not exist"
            });
          }
          
          return res.status(500).json({ 
            error: "Failed to store user",
            details: insertErr.message || "Database error" 
          });
        }
        
        // Success! Log details for debugging
        console.log("[Auth] User created successfully:", {
          id: data.id,
          email: data.email,
          role: data.role,
          auth_id: data.auth_id
        });
        
        return res.status(201).json({ 
          message: "Registered successfully", 
          user: data,
          auth_id: authUserId
        });
      }
    } catch (err) {
      console.error("[Auth] Register error:", err);
      return res.status(500).json({ 
        error: "Registration failed", 
        details: String(err)
      });
    }
  });
}