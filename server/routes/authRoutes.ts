// server/routes/authRoutes.ts
import { Router } from 'express';
const router = Router();

// Authentication routes
// These routes are handled by setupSupabaseAuth in supabaseAuth.ts
// This file exists to satisfy the import in server/routes.ts

// Login route (handled by setupSupabaseAuth)
router.post('/login', (_req, res) => {
  // This route is already handled by setupSupabaseAuth
  // This is a fallback in case the main handler fails
  res.status(404).json({ error: "Auth route not properly configured" });
});

// Registration route (handled by setupSupabaseAuth)
router.post('/register', (_req, res) => {
  // This route is already handled by setupSupabaseAuth
  // This is a fallback in case the main handler fails
  res.status(404).json({ error: "Auth route not properly configured" });
});

// Logout route (handled by setupSupabaseAuth)
router.post('/logout', (_req, res) => {
  // This route is already handled by setupSupabaseAuth
  // This is a fallback in case the main handler fails
  res.status(404).json({ error: "Auth route not properly configured" });
});

export default router;