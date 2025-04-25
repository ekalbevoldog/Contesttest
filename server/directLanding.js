import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Serve a direct landing page that bypasses Vite
 */
export function setupDirectLanding(app) {
  console.log('[Server] Setting up direct landing page handler');

  // Path to the landing page
  const landingPath = path.resolve(__dirname, '..', 'client', 'simpleLanding.html');
  
  if (!fs.existsSync(landingPath)) {
    console.error('[Server] Landing page not found at:', landingPath);
    return;
  }
  
  console.log('[Server] Found landing page at:', landingPath);
  
  // Serve the landing page as both a special route and root route fallback
  app.get('/landing', (req, res) => {
    fs.readFile(landingPath, 'utf8', (err, content) => {
      if (err) {
        console.error('[Server] Error reading landing page:', err);
        res.status(500).send('Error loading landing page');
        return;
      }
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    });
  });

  // Also serve the landing page as a fallback for the root path
  // This helps when Vite fails to load the React app
  app.get('/direct', (req, res) => {
    fs.readFile(landingPath, 'utf8', (err, content) => {
      if (err) {
        console.error('[Server] Error reading landing page:', err);
        res.status(500).send('Error loading landing page');
        return;
      }
      res.setHeader('Content-Type', 'text/html');
      res.send(content);
    });
  });

  console.log('[Server] Direct landing page registered at /landing and /direct');
}