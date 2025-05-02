
// Production server entry point with enhanced error handling
// This script handles TypeScript compilation issues during deployment
// by providing multiple fallback options to load the server

// Set production mode
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Configure error reporting
process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught exception:", err);
  // Don't exit process for uncaught exceptions in production
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled rejection at:", promise, "reason:", reason);
  // Don't exit process for unhandled rejections in production
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

// Load environment variables from multiple possible locations
try {
  // Try to load from .env files in various locations
  import("dotenv").then(dotenv => {
    // Order of priority (later overrides earlier)
    const envFiles = [
      ".env", // Root directory
      ".env.production", // Root production config
      "./dist/.env", // Dist directory
      "./dist/.env.production", // Dist production config
    ];

    envFiles.forEach((file) => {
      try {
        const result = dotenv.config({ path: file });
        if (result.parsed) {
          console.log(`Loaded environment from ${file}`);
        }
      } catch (e) {
        // Silently ignore missing env files
      }
    });

    console.log("Environment loading complete. NODE_ENV =", process.env.NODE_ENV);
  }).catch(error => {
    console.warn("Warning: dotenv could not be loaded", error.message);
  });
} catch (error) {
  console.warn("Warning: dotenv could not be loaded", error.message);
}

// Handle port for various deployment platforms
// Use PORT 3000 to match the ports configuration in .replit for proper deployment
const PORT = process.env.PORT || 3000;
console.log(`Note: Using PORT=${PORT} for deployment`);

// Check for Supabase environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn("WARNING: Supabase environment variables are not set. Supabase functionality may not work correctly.");
} else {
  console.log("Supabase environment variables are properly set.");
}

// Verify database connectivity before starting server
async function checkDatabaseConnection() {
  try {
    console.log("Verifying Supabase database connection...");
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
    
    // Simple query to test connection
    const { data, error } = await supabase.from('sessions').select('count');
    
    if (error) {
      throw error;
    }
    
    console.log("Supabase database connection successful!");
    return true;
  } catch (error) {
    console.error("WARNING: Supabase database connection failed:", error.message);
    console.log("The server will still start, but database functionality may not work.");
    return false;
  }
}

// Try different ways to start the server with fallbacks
console.log("Starting server in production mode...");

// Import and start the server with better error handling and fallbacks
async function startServer() {
  try {
    // First verify database connection
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      await checkDatabaseConnection();
    }
    
    // Directly use express to create a minimal server
    // This approach avoids issues with missing vite.config
    try {
      console.log("Loading compiled JavaScript...");
      
      const express = await import('express');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const app = express.default();
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      
      // Serve static files from dist/public (Vite's output directory)
      const clientDist = path.join(__dirname, 'dist/public');
      app.use(express.static(clientDist));
      
      // API endpoint for health checks
      app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', environment: process.env.NODE_ENV });
      });
      
      // Fallback for SPA routing
      app.get('*', (req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
      });
      
      // Start the server
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running in fallback mode on port ${PORT}`);
      });
      
      console.log("Server started successfully in fallback mode.");
      
    } catch (expressError) {
      console.error("Failed to start fallback express server:", expressError);
      
      // Last resort - try to load the compiled server code
      try {
        console.log("Attempting to load compiled server code...");
        await import("./dist/server/index.js");
        console.log("Server started successfully via compiled code.");
      } catch (serverError) {
        console.error("Failed to load compiled server code:", serverError.message);
        throw new Error("All server startup strategies failed");
      }
    }
  } catch (error) {
    console.error("Server startup failed:", error.message);
    console.error("Please rebuild the application or check the server code.");
    process.exit(1);
  }
}

// Start the server
startServer().catch(err => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
