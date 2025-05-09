/** 05/09/2025 - 13:45 CST
 * Public Routes for Static Assets
 * 
 * Handles serving static assets and the client-side application.
 * This file ensures that the React app (Home.tsx) is properly served from the main route.
 */

import express, { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// Function to check if a directory exists
function directoryExists(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

// Function to check if a file exists
function fileExists(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
}

// Look for static files in potential directories
function findStaticDirectory(): string | null {
  // Force use of public directory for now
  const publicPath = path.resolve(__dirname, '../../../public');
  if (directoryExists(publicPath)) {
    // Verify that index.html exists in the public directory
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('[routes-public] Found index.html in public directory:', publicPath);
      return publicPath;
    } else {
      console.log('[routes-public] Public directory exists but missing index.html');
    }
  }

  // Check production build directory
  const distPublicPath = path.resolve(__dirname, '../../../dist/public');
  if (directoryExists(distPublicPath)) {
    console.log('[routes-public] Found static directory:', distPublicPath);
    return distPublicPath;
  }

  // Check Vite development build directory
  const clientDistPath = path.resolve(__dirname, '../../../client/dist');
  if (directoryExists(clientDistPath)) {
    console.log('[routes-public] Found static directory:', clientDistPath);
    return clientDistPath;
  }

  // Fallback to client directory for development
  const clientSrcPath = path.resolve(__dirname, '../../../client');
  if (directoryExists(clientSrcPath)) {
    console.log('[routes-public] Using client directory as fallback:', clientSrcPath);
    return clientSrcPath;
  }
  
  console.log('[routes-public] Creating public directory with index.html');
  try {
    // Create public dir if it doesn't exist
    fs.mkdirSync(path.resolve(__dirname, '../../../public'), { recursive: true });
    
    // Try one more time
    const publicPath = path.resolve(__dirname, '../../../public');
    return publicPath;
  } catch (err) {
    console.error('[routes-public] Error creating directory:', err);
  }

  console.error('[routes-public] No static directory found');
  return null;
}

// Find the static directory and serve it
const staticDir = findStaticDirectory();

if (staticDir) {
  // Serve static files
  router.use(express.static(staticDir));

  // Check for specific static files like favicon, etc.
  const faviconPath = path.join(staticDir, 'favicon.ico');
  if (fs.existsSync(faviconPath)) {
    router.get('/favicon.ico', (req, res) => {
      res.sendFile(faviconPath);
    });
  }
} else {
  console.warn('[routes-public] No static directory found. Static file serving is disabled.');
}

// No simplified HTML fallback - we want to properly load the React app

// Specifically handle test pages that should only be accessible when explicitly requested
router.get('/test.html', (req, res) => {
  const publicDir = path.resolve(__dirname, '../../../public');
  const testFilePath = path.join(publicDir, 'test.html');
  if (fileExists(testFilePath)) {
    return res.sendFile(testFilePath);
  }
  res.status(404).send('Test page not found');
});

router.get('/websocket-test.html', (req, res) => {
  const publicDir = path.resolve(__dirname, '../../../public');
  const testFilePath = path.join(publicDir, 'websocket-test.html');
  if (fileExists(testFilePath)) {
    return res.sendFile(testFilePath);
  }
  res.status(404).send('WebSocket test page not found');
});

router.get('/simple.html', (req, res) => {
  const publicDir = path.resolve(__dirname, '../../../public');
  const testFilePath = path.join(publicDir, 'simple.html');
  if (fileExists(testFilePath)) {
    return res.sendFile(testFilePath);
  }
  res.status(404).send('Simple test page not found');
});

// Always serve index.html for any route not handled (client-side routing)
router.get('*', (req, res) => {
  // Priority for serving:
  // 1. First check if React client's index.html is available
  const clientIndexPath = path.resolve(__dirname, '../../../client/index.html');
  if (fileExists(clientIndexPath)) {
    console.log(`[routes-public] Serving React app from: ${clientIndexPath}`);
    return res.sendFile(clientIndexPath);
  }
  
  // 2. If client index.html isn't available, try static files
  if (staticDir) {
    // If this is a specific file request, try to serve the file
    const requestedPath = path.join(staticDir, req.path);
    if (req.path !== '/' && fileExists(requestedPath) && !fs.statSync(requestedPath).isDirectory()) {
      return res.sendFile(requestedPath);
    }
    
    // 3. For all client routes or the home route, serve static index.html
    const indexPath = path.join(staticDir, 'index.html');
    if (fileExists(indexPath)) {
      console.log(`[routes-public] Falling back to static index.html: ${indexPath}`);
      return res.sendFile(indexPath);
    }
  }
  
  // Fallback to 404 if nothing can be served
  console.log(`[routes-public] Cannot serve route: ${req.path}`);
  res.status(404).send('Not found');
});

export default router;