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
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      // Try to get token from cookie as fallback
      const cookies = req.cookies;
      const authCookie = cookies && cookies["sb-access-token"];
      
      if (!authCookie) {
        return res.status(401).json({ error: "No token provided" });
      }
      
      // Verify the token from cookie
      const authResult = await authService.getCurrentUser(authCookie);
      
      if (!authResult.success) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      
      req.user = authResult.user;
      return next();
    }
    
    // Verify the token from Authorization header
    const token = authHeader.split(" ")[1];
    const authResult = await authService.getCurrentUser(token);
    
    if (!authResult.success) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    
    req.user = authResult.user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Internal server error" });
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
      
      if (!authResult.success) {
        return res.status(401).json({ error: authResult.error });
      }
      
      // Set cookies for session persistence
      if (authResult.session) {
        const { access_token, refresh_token, expires_at } = authResult.session;
        
        // Set a single auth cookie with all necessary data
        res.cookie("supabase-auth", JSON.stringify({
          access_token,
          refresh_token,
          expires_at,
          user_id: authResult.user?.id,
          timestamp: Date.now()
        }), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          path: "/"
        });
        
        // Set non-httpOnly cookie for client-side auth status check
        res.cookie("auth-status", "authenticated", {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          path: "/"
        });
      }
      
      return res.status(200).json(authResult);
    } catch (error) {
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
    } catch (error) {
      console.error("Register route error:", error);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  // ——— LOGOUT —————————————————————————————————
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      await authService.logout();
      
      // Clear cookies
      ["supabase-auth", "sb-access-token", "sb-refresh-token", "auth-status"].forEach(c =>
        res.clearCookie(c, { path: "/" })
      );
      
      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout route error:", error);
      return res.status(500).json({ error: "Logout failed" });
    }
  });

  // ——— GET CURRENT USER —————————————————————————————————
  app.get("/api/auth/user", verifyAuthToken, async (req: Request, res: Response) => {
    try {
      // User is already set by the middleware
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      return res.status(200).json({ user: req.user });
    } catch (error) {
      console.error("Get user route error:", error);
      return res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // ——— REFRESH TOKEN —————————————————————————————————
  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;
      
      if (!refresh_token) {
        // Try to get refresh token from cookie
        const cookies = req.cookies;
        const authCookie = cookies && cookies["supabase-auth"];
        
        if (!authCookie) {
          return res.status(400).json({ error: "No refresh token provided" });
        }
        
        try {
          const authData = JSON.parse(authCookie);
          if (!authData.refresh_token) {
            return res.status(400).json({ error: "Invalid auth cookie data" });
          }
          
          const authResult = await authService.refreshToken(authData.refresh_token);
          
          if (!authResult.success) {
            return res.status(401).json({ error: authResult.error });
          }
          
          // Update cookies with new tokens
          if (authResult.session) {
            const { access_token, refresh_token, expires_at } = authResult.session;
            
            res.cookie("supabase-auth", JSON.stringify({
              access_token,
              refresh_token,
              expires_at,
              user_id: authData.user_id,
              timestamp: Date.now()
            }), {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
              path: "/"
            });
          }
          
          return res.status(200).json(authResult);
        } catch (error) {
          console.error("Error parsing auth cookie:", error);
          return res.status(400).json({ error: "Invalid auth cookie" });
        }
      }
      
      const authResult = await authService.refreshToken(refresh_token);
      
      if (!authResult.success) {
        return res.status(401).json({ error: authResult.error });
      }
      
      return res.status(200).json(authResult);
    } catch (error) {
      console.error("Refresh token route error:", error);
      return res.status(500).json({ error: "Token refresh failed" });
    }
  });
}