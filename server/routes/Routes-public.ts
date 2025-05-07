// server/routes/routes-public.ts
//---------------------------------------------------------------------
//  PUBLIC ROUTER   (no authentication required)
//  – serves the client bundle, static assets, health checks, etc.
//---------------------------------------------------------------------

import { Router, static as serveStatic } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* -------------------------------------------------------------------
 * 1) ENV / BUILD PATHS
 * ------------------------------------------------------------------*/
const CLIENT_DIST = path.resolve(__dirname, "../../client/dist"); // vite build
const PUBLIC_DIR  = path.resolve(__dirname, "../../public");      // raw assets

/* Helper: pick the first directory that actually exists */
function existingDir(...dirs: string[]) {
  for (const d of dirs) {
    try { if (fs.statSync(d).isDirectory()) return d; } catch {}
  }
  return undefined;
}

const STATIC_ROOT = existingDir(CLIENT_DIST, PUBLIC_DIR);
if (!STATIC_ROOT) {
  console.warn(
    "[routes-public] No static directory found; " +
      "client bundle will NOT be served. " +
      "Check your build scripts."
  );
}

/* -------------------------------------------------------------------
 * 2) HEALTH & INFO
 * ------------------------------------------------------------------*/
router.get("/healthz", (_req, res) => res.json({ ok: true, ts: Date.now() }));

router.get("/version", (_req, res) => {
  // Tiny helper to bubble the package version to the UI / CI
  const pkg = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8")
  );
  res.json({ version: pkg.version || "0.0.0" });
});

/* -------------------------------------------------------------------
 * 3) STATIC FILES (CSS, JS, images, etc.)
 * ------------------------------------------------------------------*/
if (STATIC_ROOT) {
  router.use(
    "/",
    serveStatic(STATIC_ROOT, {
      // Let the browser cache assets aggressively; HTML is handled below
      maxAge: "1y",
      index: false,
    })
  );
}

/* -------------------------------------------------------------------
 * 4) SPA FALLBACK (index.html) – must be **after** static middleware
 * ------------------------------------------------------------------*/
router.get("*", (_req, res, next) => {
  if (!STATIC_ROOT) return next();                  // nothing to serve
  const indexHtml = path.join(STATIC_ROOT, "index.html");
  try {
    return res.sendFile(indexHtml);
  } catch {
    return next();                                  // let 404 handler run
  }
});

/* -------------------------------------------------------------------
 * 5) DEFAULT 404 for anything not caught above
 * ------------------------------------------------------------------*/
router.use((_req, res) => res.status(404).json({ error: "Not found" }));

export default router;
