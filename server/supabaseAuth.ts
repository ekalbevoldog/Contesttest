import { Express, Request, Response, NextFunction } from "express";
import { supabase } from "./supabase.js";

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
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      console.error("Token verification error:", error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = {
      id: data.user.id,
      email: data.user.email || undefined,
      role: data.user.user_metadata?.role || "user",
      ...data.user.user_metadata
    };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Setup Supabase Auth & Registration routes
 */
export function setupSupabaseAuth(app: Express) {
  // ——— LOGIN —————————————————————————————————
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      console.log("Login attempt for:", email);
      const {
        data: authData,
        error: authError
      } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !authData.user || !authData.session) {
        console.error("Supabase auth error:", authError);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      // Update last_login
      await supabase.from("users").update({ last_login: new Date() }).eq("email", email);
      // Fetch user profile
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (userError || !userRecord) {
        // Try again with auth_id which is the correct identifier
        const { data: authIdRecord, error: authIdError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_id", authData.user.id)
          .single();

        if (authIdError || !authIdRecord) {
          console.log("User authenticated but needs onboarding:", authData.user.id);

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
        userRecord = authIdRecord;
        console.log("Found user by auth_id:", userRecord.role);
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
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // ——— LOGOUT —————————————————————————————————
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      await supabase.auth.signOut();
      // Clear cookies
      ["supabase-auth", "sb-access-token", "sb-refresh-token", "auth-status"].forEach(c =>
        res.clearCookie(c, { path: "/" })
      );
      return res.status(200).json({ message: "Logged out" });
    } catch (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
  });

  // ——— WHOAMI —————————————————————————————————
  app.get(
    "/api/auth/user",
    verifySupabaseToken,
    async (req: Request, res: Response) => {
      try {
        if (!req.user?.email) {
          return res.status(401).json({ error: "Not authenticated" });
        }
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", req.user.email)
          .single();
        if (error || !data) {
          console.error("Profile fetch error:", error);
          return res.status(500).json({ error: "Failed to fetch profile" });
        }
        return res.status(200).json({ user: data });
      } catch (err) {
        console.error("Whoami error:", err);
        return res.status(500).json({ error: "Failed to fetch user" });
      }
    }
  );

  // ——— REGISTER —————————————————————————————————
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, role } = req.body;
      if (!email || !password || !fullName || !role) {
        return res.status(400).json({ error: "Missing fields" });
      }
      const { data: signUpData, error: signUpErr } =
        await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role } }
        });
      if (signUpErr) {
        console.error("Supabase signup error:", signUpErr);
        return res.status(400).json({ error: signUpErr.message });
      }
      
      // Check if user was created successfully in Auth
      if (!signUpData?.user?.id) {
        console.error("Auth signup succeeded but no user ID was returned");
        return res.status(500).json({ error: "User creation incomplete" });
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
      
      // Include auth_id when creating user record
      const userToInsert = { 
        email, 
        role: dbRole, 
        auth_id: signUpData.user.id,  // Link to Supabase Auth user
        created_at: new Date() 
      };
      
      // First check if a user with this auth_id already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", signUpData.user.id)
        .single();
        
      if (existingUser) {
        // User already exists, return it
        const { data: userData, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", existingUser.id)
          .single();
          
        if (fetchError) {
          console.error("Error fetching existing user:", fetchError);
          return res.status(500).json({ error: "Failed to retrieve user data" });
        }
        
        return res.status(200).json({ message: "User already exists", user: userData });
      }
      
      // Insert the new user
      const { data, error: insertErr } = await supabase
        .from("users")
        .insert(userToInsert)
        .select()
        .single();
      if (insertErr) {
        console.error("DB insert error:", insertErr);
        
        // Get more details about the error
        console.log("Insert error details:", JSON.stringify(insertErr));
        
        // Check specific error conditions
        if (insertErr.code === '23505') {
          // Unique constraint violation - likely duplicate email
          return res.status(409).json({ error: "User with this email already exists" });
        } else if (insertErr.code === '23503') {
          // Foreign key constraint - likely auth_id issue
          return res.status(500).json({ 
            error: "Failed to link user record to authentication", 
            details: "Try checking the auth_id mapping in the database"
          });
        }
        
        return res.status(500).json({ error: "Failed to store user" });
      }
      
      // Additional logging for successful user creation
      console.log("User created successfully:", {
        id: data.id,
        email: data.email,
        role: data.role,
        auth_id: data.auth_id
      });
      
      return res.status(201).json({ 
        message: "Registered", 
        user: data,
        auth_id: signUpData.user.id // Return auth_id for client reference
      });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ error: "Registration failed" });
    }
  });
}