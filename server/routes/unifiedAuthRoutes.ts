// server/routes/unifiedAuthRoutes.ts

import { Express, Request, Response, NextFunction } from "express";
import { authService } from "../services/unifiedAuthService.js";

/**
 * Middleware: Verify authentication token
 */
export const verifyAuthToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // 1) Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      // 2) Fallback to our single supabase-auth cookie
      const raw = req.cookies?.["supabase-auth"];
      if (!raw) {
        return res.status(401).json({ error: "No token provided" });
      }
      const parsed = JSON.parse(raw);
      token = parsed.access_token;
    }

    // 3) Validate token and populate req.user
    const authResult = await authService.getCurrentUser(token);
    if (!authResult.success || !authResult.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = authResult.user;
    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Setup unified authentication routes
 */
export function setupUnifiedAuthRoutes(app: Express) {
  // ——— LOGIN —————————————————————————————————
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const authResult = await authService.login({ email, password });
      if (!authResult.success || !authResult.session || !authResult.user) {
        return res.status(401).json({ error: authResult.error });
      }

      const { access_token, refresh_token, expires_at } = authResult.session;
      const id = authResult.user.id;

      // 1) Set the supabase-auth cookie (httpOnly)
      res.cookie(
        "supabase-auth",
        JSON.stringify({ access_token, refresh_token, expires_at, id, timestamp: Date.now() }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          path: "/",
        }
      );

      // 2) Non-httpOnly flag for client ­checks
      res.cookie("auth-status", "authenticated", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return res.status(200).json(authResult);
    } catch (error: any) {
      console.error("Login route error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  // ——— REGISTER —————————————————————————————————
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, role } = req.body;
      const authResult = await authService.register({ email, password, fullName, role });
      if (!authResult.success) {
        return res.status(400).json({ error: authResult.error });
      }
      return res.status(201).json(authResult);
    } catch (error: any) {
      console.error("Register route error:", error);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  // ——— LOGOUT —————————————————————————————————
  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    try {
      // Clear only the cookies we set
      res.clearCookie("supabase-auth", { path: "/" });
      res.clearCookie("auth-status", { path: "/" });
      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error: any) {
      console.error("Logout route error:", error);
      return res.status(500).json({ error: "Logout failed" });
    }
  });

  // ——— GET CURRENT USER —————————————————————————————————
  app.get("/api/auth/user", verifyAuthToken, (req: Request, res: Response) => {
    // At this point req.user is set
    return res.status(200).json({ user: req.user });
  });

  // ——— REFRESH TOKEN —————————————————————————————————
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      // Always pull refresh_token from our supabase-auth cookie
      const raw = req.cookies?.["supabase-auth"];
      if (!raw) {
        return res.status(400).json({ error: "No refresh token provided" });
      }
      const { refresh_token, id } = JSON.parse(raw);
      const authResult = await authService.refreshToken(refresh_token);
      if (!authResult.success || !authResult.session) {
        return res.status(401).json({ error: authResult.error });
      }

      // Reset cookie with new tokens
      const { access_token, refresh_token: rt2, expires_at } = authResult.session;
      res.cookie(
        "supabase-auth",
        JSON.stringify({ access_token, refresh_token: rt2, expires_at, id, timestamp: Date.now() }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000,
          path: "/",
        }
      );
      return res.status(200).json(authResult);
    } catch (error: any) {
      console.error("Refresh token route error:", error);
      return res.status(500).json({ error: "Token refresh failed" });
    }
  });
}
