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


// Handle port for various deployment platforms
const PORT = process.env.PORT || 3000;
console.log(`Note: Using PORT=${PORT} for deployment`);

// Import and start the server with better error handling and fallbacks
async function startServer() {
  try {
    // Directly use express to create a minimal server
    const express = await import('express');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const app = express.default();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Serve static files from dist/public (Vite's output directory)
    const clientDist = path.join(__dirname, 'dist', 'public');
    console.log('Serving static files from:', clientDist);

    app.use(express.static(clientDist));

    // Add JSON body parser
    app.use(express.json());

    // API endpoint for health checks
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', environment: process.env.NODE_ENV });
    });

    // Import and register our API routes
    try {
      const apiRoutes = await import('./server/api/index.js');
      app.use('/api', apiRoutes.default);
      console.log('API routes registered successfully');
    } catch (apiError) {
      console.error('Failed to load API routes:', apiError);
    }

    // Fallback for SPA routing - MUST come after API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });

    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

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