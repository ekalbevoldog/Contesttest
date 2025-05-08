/* ------------------------------------------------------------------
 *  Global route loader  – called once from server/index.ts
 * ----------------------------------------------------------------- */

import { Express } from "express";

/* ---------- Auth (Supabase JWT + cookies) ------------------------ */
import { setupSupabaseAuth } from "./supabaseAuth";

/* ---------- Core resource routers (compiled to .js at runtime) --- */
import profileRoutes  from "./routes/profileRoutes";
import publicRoutes from "./routes/Routes-public";
import webhookRoutes  from "./routes/webhookRoutes";
// NEED TO EDIT AND REVIEW

/* ---------- registerRoutes – expected by index.ts ---------------- */
// Returns HTTP server for WebSocket support
import http from 'http';
export function registerRoutes(app: Express): http.Server {
  // Create HTTP server for WebSocket support
  const httpServer = http.createServer(app);
  /* 1️⃣  Authentication & session‑cookies -------------------------- */
  setupSupabaseAuth(app);            // mounts /api/auth/* endpoints

  /* 2️⃣  Auth‑protected JSON APIs ---------------------------------- */
  app.use("/api/profile",  profileRoutes);   // athlete | business | user


  /* 3️⃣  Webhooks (Stripe, etc.) ----------------------------------- */
  app.use("/api/webhooks", webhookRoutes);

  /* Optional Stripe endpoints (load only if file exists) */
  importOptional("./stripeRoutes.js").then((r) => {
    if (r?.default) app.use("/api/stripe", r.default);
  });

  /* Optional Gemini / AI helpers */
  importOptional("./geminiRoutes.js").then((r) => {
    if (r?.default) app.use("/api/gemini", r.default);
  });

  /* 4️⃣  Public (no‑auth) pages & fallback static assets ----------- */
  app.use("/", publicRoutes);
  
  // Return the HTTP server for use in WebSocket setup
  return httpServer;
}

/* ------------------------------------------------------------------
 *  helper: safely import an optional route module
 * ----------------------------------------------------------------- */
async function importOptional(path: string) {
  try {
    return await import(path);
  } catch (err: any) {
    if (err.code !== "ERR_MODULE_NOT_FOUND") {
      console.warn(`[routes] Failed to load optional module ${path}:`, err);
    }
    return undefined;
  }
}