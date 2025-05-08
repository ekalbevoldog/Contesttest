// ===============================
// Contested Replit – unified server
// ===============================
// This file **replaces** the old index.ts in your repo.
// It merges Supabase auth/profile helpers + route registration + static file serving in a clean, deployment‑ready form.

// ---------- server/index.ts ----------
import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local helpers
import { registerRoutes } from './routes';
import { setupSupabaseAuth } from './supabaseAuth';
import { setupProfileEndpoints } from './supabaseProfile';

// ---------- Env ----------
dotenv.config();
const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// ---------- App ----------
const app: Express = express();

// ---------- Global middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));

// ---------- Supabase auth + profile endpoints ----------
setupSupabaseAuth(app);
setupProfileEndpoints(app);

// ---------- Config endpoint used by front‑end ----------
app.get('/api/config/supabase', (_req: Request, res: Response) => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }
  res.json({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY });
});

// ---------- API routes ----------
registerRoutes(app);

// ---------- 404 for unknown API paths ----------
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ---------- Static asset serving ----------
// We're handling static asset serving through the Routes-public.ts module
// This ensures a consistent approach with proper fallbacks

// ---------- Error handler ----------
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? 500;
  console.error('[Server error]', err);
  // Always return JSON for API paths, otherwise fallback to generic text
  if (req.originalUrl.startsWith('/api')) {
    return res.status(status).json({ error: err.message ?? 'Internal Server Error' });
  }
  res.status(status).send(err.message ?? 'Internal Server Error');
});

// ---------- Start ----------
app.listen(PORT, '0.0.0.0', () =>
  console.log(`🚀 Server listening on http://localhost:${PORT}  (env: ${NODE_ENV})`)
);
// ---------- END server/index.ts ----------


// NOTE: This is a legacy comment. The actual routes logic is in server/routes.ts
// The server/routes.ts file is imported above and used on line 49
// ---------- END server/index.ts ----------
