/**
 * Serve a direct landing page that bypasses Vite
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function setupDirectLanding(app) {
  const landingPagePath = path.join(__dirname, '..', 'client', 'simpleLanding.html');
  
  console.log('[Server] Setting up direct landing page handler');
  
  if (fs.existsSync(landingPagePath)) {
    console.log('[Server] Found landing page at:', landingPagePath);
    
    // Serve landing page directly at /auth route
    app.get('/auth', (req, res) => {
      res.sendFile(landingPagePath);
    });
    
    console.log('[Server] Direct landing page registered at /auth');
    return true;
  } else {
    console.log('[Server] Warning: landing page not found at:', landingPagePath);
    return false;
  }
}