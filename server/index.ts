import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { registerPublicRoutes } from "./routes-public.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { testSupabaseConnection } from "./supabase.js";

// Import storage with error handling
import { storage } from './storage.js';
import { objectStorage } from './objectStorage.js';

// Verify storage modules are available with graceful fallback
console.log('Storage modules initialized - continuing even if Object Storage is unavailable');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize Supabase tables first
  try {
    const { setupSupabase } = await import('./supabaseSetup');
    await setupSupabase();

    // Run all migrations including UUID migration
    try {
      const { runAllMigrations } = await import('./runMigrations');
      await runAllMigrations();
      console.log('All database migrations completed successfully');
    } catch (migrationError) {
      console.error('Error running migrations:', migrationError);
      // Continue with server startup even if migrations fail
    }
  } catch (error) {
    console.error('Error setting up Supabase:', error);
    // Continue with server startup even if Supabase setup fails
  }

  // Set up Supabase auth endpoints
  try {
    const { setupSupabaseAuth } = await import('./supabaseAuth');
    setupSupabaseAuth(app);

    const { setupProfileEndpoints } = await import('./supabaseProfile');
    setupProfileEndpoints(app);

    console.log('Supabase auth and profile endpoints registered successfully');
  } catch (error) {
    console.error('Error setting up Supabase auth endpoints:', error);
    // Continue with server startup even if Supabase auth setup fails
  }

  // Register public routes first, so they're available even if other routes fail
  registerPublicRoutes(app);

  // Set up direct landing page that doesn't depend on Vite
  try {
    const { setupDirectLanding } = await import('./directLanding.js');
    setupDirectLanding(app);
    console.log('Direct landing page registered successfully');
  } catch (error) {
    console.error('Error setting up direct landing page:', error);
    // Continue with server startup even if direct landing setup fails
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error("Server error:", err);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

// Minimal placeholder implementations for storage modules
// Replace these with your actual implementation
export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    return null; // Replace with actual storage retrieval
  },
  setItem: async (key: string, value: string): Promise<void> => {
    // Replace with actual storage setting
  },
};

export const objectStorage = {
  upload: async (file: any, path: string) => {
    //Replace with actual object storage upload
  },
  download: async (path: string) => {
    //Replace with actual object storage download
  }
};