import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
// Import viteConfig conditionally based on environment
let viteConfig = {};
if (process.env.NODE_ENV === "development") {
  const { default: config } = await import("../vite.config.js");
  viteConfig = config;
}
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Skip Vite setup in production mode
  if (process.env.NODE_ENV === "production") {
    return;
  }
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, the public directory is at dist/public
  const distPath = path.resolve(__dirname, "..", "public");
  
  if (!fs.existsSync(distPath)) {
    console.warn(`Could not find the build directory at ${distPath}, looking for alternative paths...`);
    
    // Try alternate paths that might work in the deployment environment
    const altPaths = [
      path.resolve(__dirname, "../public"),
      path.resolve(__dirname, "../../public"),
      path.resolve(__dirname, "public"),
      path.resolve(process.cwd(), "dist/public")
    ];
    
    for (const altPath of altPaths) {
      if (fs.existsSync(altPath)) {
        console.log(`Found build directory at ${altPath}`);
        app.use(express.static(altPath));
        
        // fall through to index.html if the file doesn't exist
        app.use("*", (_req, res) => {
          res.sendFile(path.resolve(altPath, "index.html"));
        });
        
        return;
      }
    }
    
    console.error("Could not find any valid build directory. Serving a fallback page.");
    
    // Serve a simple fallback page if no build directory is found
    app.use("*", (_req, res) => {
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Application Error</title>
            <style>
              body { font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
              h1 { color: #e53e3e; }
            </style>
          </head>
          <body>
            <h1>Application Error</h1>
            <p>The application could not find the built client files. Please make sure the build process completed successfully.</p>
          </body>
        </html>
      `);
    });
    
    return;
  }
  
  app.use(express.static(distPath));
  
  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
