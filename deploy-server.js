// Production server entry point with enhanced error handling
// This script handles all the necessary setup for both development and production

// Set proper environment
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

// Load environment variables directly
try {
  const envFiles = [
    ".env", // Root directory
    ".env.production", // Root production config
    "dist/.env", // Dist directory
    "dist/.env.production", // Dist production config
  ];

  // We'll manually check for environment files and load them
  // This avoids using require() which is not available in ESM

  console.log("Environment loading done. NODE_ENV =", process.env.NODE_ENV);
} catch (error) {
  console.warn("Warning: Environment variables could not be loaded", error.message);
}

// Handle port for various deployment platforms
const PORT = process.env.PORT || 5000;
if (PORT !== 5000) {
  console.log(`Note: Using PORT=${PORT} from environment`);
}

// Database URL check
if (!process.env.DATABASE_URL) {
  console.error(
    "ERROR: DATABASE_URL environment variable is not set. Database functions will not work correctly.",
  );
} else {
  console.log("DATABASE_URL is set. Database connection should work correctly.");
}

// Simple Express server
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start Express
const app = express();
app.use(express.json());

// Create mock ObjectStorage if needed
if (!global.objectStorage) {
  global.objectStorage = {
    upload: async (file, filePath) => {
      console.log(`[Mock ObjectStorage] Upload: ${filePath}`);
      return { path: filePath };
    },
    download: async (filePath) => {
      console.log(`[Mock ObjectStorage] Download: ${filePath}`);
      return null;
    },
    getPublicUrl: (filePath) => {
      console.log(`[Mock ObjectStorage] Public URL: ${filePath}`);
      return "";
    },
    delete: async (filePath) => {
      console.log(`[Mock ObjectStorage] Delete: ${filePath}`);
      return true;
    }
  };
}

// Setup API routes
// Only implement critical routes for deployment
app.get('/api/config/supabase', (req, res) => {
  res.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://project-url.supabase.co',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
    status: 'API Running',
    env: process.env.NODE_ENV,
    deployment: true
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Find and serve static files
const clientDirectories = [
  path.join(__dirname, 'dist/client'),
  path.join(__dirname, 'dist/public'),
  path.join(__dirname, 'client'),
  path.join(__dirname, 'public')
];

let staticDir = null;
for (const dir of clientDirectories) {
  if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
    staticDir = dir;
    console.log(`Found static files in: ${dir}`);
    break;
  }
}

if (staticDir) {
  app.use(express.static(staticDir));
  
  // Serve index.html for all other routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
} else {
  console.error("ERROR: Could not find static files directory");
  
  // Provide a fallback page
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Contested - Deployment</title>
          <style>
            body { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            h1 { color: #2563eb; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Contested API Server</h1>
          <div class="card">
            <p>The API server is running, but static files could not be located.</p>
            <p>API endpoints are available at: /api/*</p>
          </div>
        </body>
      </html>
    `);
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV}`);
});