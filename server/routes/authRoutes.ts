/**
 * Authentication Routes
 * 
 * Centralized authentication endpoints for Supabase integration
 * Handles login, registration, user profile checks, and logout functionality.
 */

import { Router, Request, Response } from 'express';
import { supabase, handleDatabaseError } from '../lib/unifiedSupabase';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/environment';

const router = Router();

// Helper function to convert user data to safe client object
function toClientUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    full_name: u.full_name,
    subscription_status: u.subscription_status,
    stripe_customer_id: u.stripe_customer_id,
    stripe_subscription_id: u.stripe_subscription_id,
    subscription_plan: u.subscription_plan,
    subscription_current_period_end: u.subscription_current_period_end,
    last_login: u.last_login,
    created_at: u.created_at,
  };
}

// Helper function to set authentication cookies
function setAuthCookies(res: Response, session: any, id: string) {
  const isProduction = config.isProduction;
  const cookieMaxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  res.cookie(
    "supabase-auth",
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      id,
      timestamp: Date.now(),
    }),
    {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: cookieMaxAge,
      path: "/",
    }
  );
  
  res.cookie("auth-status", "authenticated", {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    maxAge: cookieMaxAge,
    path: "/",
  });
}

// Helper function to ensure athlete profile
async function ensureAthleteProfile(id: string, full_name: string, email: string) {
  await supabase
    .from("athlete_profiles")
    .upsert(
      {
        id,
        full_name,
        email,
        session_id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
}

// Helper function to ensure business profile
async function ensureBusinessProfile(id: string, role: string) {
  const { data: existingProfile } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (!existingProfile) {
    await supabase
      .from('business_profiles')
      .insert({
        id,
        type: role,
        session_id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  }
}

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData.user || !authData.session) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userId = authData.user.id;

    // Sync last_login
    await supabase
      .from("users")
      .upsert({ id: userId, email, last_login: new Date().toISOString() }, { onConflict: "id" });

    // Fetch full user record
    const { data: userRecord } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // Onboarding required
    if (!userRecord) {
      setAuthCookies(res, authData.session, userId);
      return res.status(200).json({
        user: { id: userId, email, role: "user", needsProfile: true },
        redirectTo: "/onboarding",
        session: authData.session,
      });
    }

    // Ensure role-specific profile
    if (userRecord.role === "business") {
      await ensureBusinessProfile(userRecord.id, userRecord.role);
    } else if (userRecord.role === "athlete") {
      await ensureAthleteProfile(userRecord.id, userRecord.full_name, userRecord.email);
    }

    setAuthCookies(res, authData.session, userId);
    return res.status(200).json({
      user: toClientUser(userRecord),
      session: authData.session,
    });
  } catch (err) {
    console.error("[Auth] Login error:", err);
    const errorResponse = handleDatabaseError(err);
    res.status(500).json({ 
      error: "Login failed",
      message: errorResponse.error.message
    });
  }
});

// Registration route
router.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      fullName,
      role,
      industry,
      business_type,
      company_size,
      zipCode,
      budget,
      haspreviouspartnerships,
      location,
      phone,
      position,
    } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check for duplicate email
    const { data: exists } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
      
    if (exists) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Create auth user
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    
    if (signUpErr || !signUpData.user) {
      return res.status(400).json({ error: signUpErr?.message || "Registration failed" });
    }

    const newId = signUpData.user.id;

    // Insert core user record
    const { error: insertErr } = await supabase.from("users").insert({
      id: newId,
      email,
      role,
      created_at: new Date().toISOString(),
    });
    
    if (insertErr) {
      return res.status(500).json({ error: insertErr.message || "Failed to store user" });
    }

    // Create role-specific profile
    if (role === "business") {
      await supabase.from("business_profiles").upsert(
        {
          id: newId,
          name: fullName,
          email,
          industry,
          business_type,
          company_size,
          zipCode,
          budget,
          haspreviouspartnerships,
          location,
          phone,
          position,
          session_id: uuidv4(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } else if (role === "athlete") {
      await ensureAthleteProfile(newId, fullName, email);
    }

    return res.status(201).json({
      message: "Registered successfully",
      user: { id: newId, email, role },
      needsProfile: true,
      redirectTo: "/onboarding",
    });
  } catch (err) {
    console.error("[Auth] Register error:", err);
    const errorResponse = handleDatabaseError(err);
    res.status(500).json({ 
      error: "Registration failed",
      message: errorResponse.error.message 
    });
  }
});

// Logout route
router.post('/logout', async (_req: Request, res: Response) => {
  try {
    await supabase.auth.signOut();
    
    // Clear cookies
    ["supabase-auth", "auth-status"].forEach((c) =>
      res.clearCookie(c, { path: "/" })
    );
    
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("[Auth] Logout error:", err);
    const errorResponse = handleDatabaseError(err);
    res.status(500).json({ 
      error: "Logout failed",
      message: errorResponse.error.message 
    });
  }
});

// Get current user
router.get('/user', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = data.user.id;

    // Get full user record
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError && userError.code !== "PGRST116") {
      return res.status(500).json({ error: "Failed to fetch user" });
    }

    if (!userRecord) {
      return res.status(200).json({
        user: {
          id: userId,
          email: data.user.email,
          role: data.user.user_metadata?.role || "user",
          needsProfile: true,
        },
      });
    }

    if (userRecord.role === "business") {
      await ensureBusinessProfile(userRecord.id, userRecord.role);
    } else if (userRecord.role === "athlete") {
      await ensureAthleteProfile(
        userRecord.id, 
        userRecord.full_name, 
        userRecord.email
      );
    }

    return res.status(200).json({ user: toClientUser(userRecord) });
  } catch (err) {
    console.error("[Auth] User fetch error:", err);
    const errorResponse = handleDatabaseError(err);
    res.status(500).json({ 
      error: "Failed to fetch user",
      message: errorResponse.error.message 
    });
  }
});

export default router;