import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { testConnection, getDatabaseHealth } from "./db";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
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

// Database health check endpoint
app.get('/api/health/db', async (_req: Request, res: Response) => {
  try {
    const health = await getDatabaseHealth();
    if (health.status === 'healthy') {
      return res.status(200).json(health);
    }
    return res.status(503).json(health);
  } catch (error) {
    return res.status(500).json({ 
      status: 'error', 
      message: 'Error checking database health',
      error: String(error)
    });
  }
});

// Application health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown'
  });
});

(async () => {
  try {
    // Verify database connection before starting server
    console.log("Checking database connection...");
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.warn("⚠️ Failed to connect to the database, falling back to in-memory storage");
      console.warn("⚠️ This is acceptable for development but not for production");
      // Continue with in-memory storage, no need to exit
    }
    
    // Register API routes
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ 
        error: message,
        status: status,
        timestamp: new Date().toISOString()
      });
      
      console.error("Server error:", err);
    });

    // Setup Vite for development or static serving for production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the server
    const port = process.env.PORT || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log("==========================================");
      console.log(`🚀 Server started successfully! Listening on port ${port}`);
      console.log(`💾 ${isConnected ? 'Database connection established' : 'Using in-memory storage (no persistence)'}`);
      console.log(`🌐 API available at http://localhost:${port}/api`);
      console.log(`📱 Web application available at http://localhost:${port}`);
      console.log("==========================================");
    });
    
    // Handle graceful shutdown
    const gracefulShutdown = () => {
      console.log("🛑 Shutting down gracefully...");
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        console.error("⚠️ Could not close connections in time, forcefully shutting down");
        process.exit(1);
      }, 10000);
    };
    
    // Listen for termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
})();
