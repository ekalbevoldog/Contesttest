import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Serve a custom landing page in development mode 
 * when the Vite build process fails to generate the React app
 */
export function serveLandingPage(app) {
  console.log('Setting up fallback landing page handler');

  // Look for landing page at multiple possible locations
  const possiblePaths = [
    path.resolve(__dirname, '..', 'client', 'index.html'),
    path.resolve(__dirname, '..', 'client', 'index-dev.html'),
    path.resolve(__dirname, '..', 'dist', 'client', 'index.html')
  ];

  let landingPagePath = null;
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      landingPagePath = filePath;
      console.log(`Found landing page at: ${landingPagePath}`);
      break;
    }
  }

  // If no landing page is found, create a minimal one
  if (!landingPagePath) {
    console.warn('No landing page found, using minimal fallback');
    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Contested Platform</title>
            <style>
              body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #2563eb; }
            </style>
          </head>
          <body>
            <h1>Contested Platform</h1>
            <p>The application is running but unable to locate a landing page.</p>
            <div>
              <a href="/api/config/supabase">Check API Status</a>
            </div>
          </body>
        </html>
      `);
    });
    return;
  }

  // Serve the landing page for any route that doesn't match an API
  app.get('/', (req, res) => {
    fs.readFile(landingPagePath, 'utf8', (err, content) => {
      if (err) {
        console.error('Error reading landing page:', err);
        res.status(500).send('Error loading application');
        return;
      }
      res.send(content);
    });
  });
}