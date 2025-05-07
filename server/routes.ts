/* ------------------------------------------------------------------
 *  Global route loader  – called once from server/index.ts
 * ----------------------------------------------------------------- */

import { Express } from "express";

/* ---------- Auth (Supabase JWT + cookies) ------------------------ */
import { setupSupabaseAuth } from "./supabaseAuth.js";

/* ---------- Core resource routers (compiled to .js at runtime) --- */
import profileRoutes  from "./routes/profileRoutes";
import publicRoutes   from "./routes-public.js";
import webhookRoutes  from "./webhooks.js";

/* ---------- registerRoutes – expected by index.ts ---------------- */
export function registerRoutes(app: Express) {
  /* 1️⃣  Authentication & session‑cookies -------------------------- */
  setupSupabaseAuth(app);            // mounts /api/auth/* endpoints

  /* 2️⃣  Auth‑protected JSON APIs ---------------------------------- */
  app.use("/api/profile",  profileRoutes);   // athlete | business | user
  // add more protected routers here as you create them, e.g.:
  // app.use("/api/matches", matchRoutes);

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