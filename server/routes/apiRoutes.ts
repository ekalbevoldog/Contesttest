// server/routes/apiRoutes.ts
import { Router } from 'express';
const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Version endpoint
router.get('/version', (_req, res) => {
  res.json({ version: process.env.npm_package_version || '1.0.0' });
});

// Add more API routes as needed

export default router;