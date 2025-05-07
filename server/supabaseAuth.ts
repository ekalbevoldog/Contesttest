import { Express, Request, Response, NextFunction } from "express";
import { supabase, supabaseAdmin } from "./supabase.js";
import { ensureBusinessProfile } from "./services/ensureBusinessProfile.js";
import { v4 as uuidv4 } from "uuid";

/* ------------------------------------------------------------------ */
/*  Express type augmentation                                         */
/* ------------------------------------------------------------------ */
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      email?: string;
      role: string;
      [key: string]: any;
    };
  }
}

/* ------------------------------------------------------------------ */
/*  Helper: convert full DB row ➞ safe client object                  */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  JWT‑verification middleware                                       */
/* ------------------------------------------------------------------ */
export const verifySupabaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
      return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user)
      return res.status(401).json({ error: "Invalid or expired token" });

    req.user = {
      id: data.user.id,
      email: data.user.email || undefined,
      role: data.user.user_metadata?.role ?? "user",
      ...data.user.user_metadata,
    };
    next();
  } catch (err) {
    console.error("[Auth] Middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ------------------------------------------------------------------ */
/*  Cookie helper                                                     */
/* ------------------------------------------------------------------ */
function setAuthCookies(res: Response, session: any, id: string) {
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    }
  );
  res.cookie("auth-status", "authenticated", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

/* ------------------------------------------------------------------ */
/*  Helper: ensure athlete profile                                    */
/* ------------------------------------------------------------------ */
async function ensureAthleteProfile(id: string, full_name: string, email: string) {
  await supabase
    .from("athlete_profiles")
    .upsert(
      {
        id,
        full_name,
        email,
        session_id: uuidv4(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      { onConflict: "id" }
    );
}

/* ------------------------------------------------------------------ */
/*  Main route‑setup function                                         */
/* ------------------------------------------------------------------ */
export function setupSupabaseAuth(app: Express) {
  /* --------------------------- LOGIN ------------------------------ */
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({ error: "Email and password are required" });

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (authError || !authData.user || !authData.session)
        return res.status(401).json({ error: "Invalid credentials" });

      const userId = authData.user.id;

      /* sync last_login */
      await supabase
        .from("users")
        .upsert({ id: userId, email, last_login: new Date() }, { onConflict: "id" });

      /* fetch full row */
      const { data: userRecord } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      /* onboarding required */
      if (!userRecord) {
        setAuthCookies(res, authData.session, userId);
        return res.status(200).json({
          user: { id: userId, email, role: "user", needsProfile: true },
          redirectTo: "/onboarding",
          session: authData.session,
        });
      }

      /* ensure role‑specific profile */
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
      res.status(500).json({ error: "Login failed" });
    }
  });

  /* --------------------------- LOGOUT ----------------------------- */
  app.post("/api/auth/logout", async (_req, res) => {
    try {
      await supabase.auth.signOut();
      ["supabase-auth", "auth-status"].forEach((c) =>
        res.clearCookie(c, { path: "/" })
      );
      res.status(200).json({ message: "Logged out" });
    } catch (err) {
      console.error("[Auth] Logout error:", err);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  /* --------------------------- WHOAMI ----------------------------- */
  app.get("/api/auth/user", verifySupabaseToken, async (req, res) => {
    try {
      if (!req.user?.id)
        return res.status(401).json({ error: "Not authenticated" });

      const { data: userRecord, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", req.user.id)
        .single();

      if (error && error.code !== "PGRST116")
        return res.status(500).json({ error: "Failed to fetch user" });

      if (!userRecord) {
        return res.status(200).json({
          user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            needsProfile: true,
          },
        });
      }

      if (userRecord.role === "business")
        await ensureBusinessProfile(userRecord.id, userRecord.role);
      else if (userRecord.role === "athlete")
        await ensureAthleteProfile(userRecord.id, userRecord.full_name, userRecord.email);

      return res.status(200).json({ user: toClientUser(userRecord) });
    } catch (err) {
      console.error("[Auth] WhoAmI error:", err);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  /* ------------------------- REGISTER ----------------------------- */
  app.post("/api/auth/register", async (req, res) => {
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

      if (!email || !password || !fullName || !role)
        return res.status(400).json({ error: "Missing required fields" });

      /* duplicate email check */
      const { data: exists } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (exists) return res.status(409).json({ error: "Email already in use" });

      /* create auth user */
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (signUpErr || !signUpData.user)
        return res.status(400).json({ error: signUpErr?.message || "Registration failed" });

      const newId = signUpData.user.id;

      /* 1) insert core row into users */
      const { error: insertErr } = await supabaseAdmin.from("users").insert({
        id: newId,
        email,
        role,
        created_at: new Date(),
      });
      if (insertErr)
        return res.status(500).json({ error: insertErr.message || "Failed to store user" });

      /* 2) create role‑specific profile */
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
            created_at: new Date(),
            updated_at: new Date(),
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
      res.status(500).json({ error: "Registration failed" });
    }
  });
} /* ----------------- END setupSupabaseAuth ------------------------- */
