import express from 'express';
import matchRouter from './match/index.js';
import bundleRouter from './bundle/index.js';
import offerRouter from './offer/index.js';
import authRouter from './auth/index.js';
import configRouter from './config/index.js';

const router = express.Router();

// Register API routes
router.use('/auth', authRouter);
router.use('/match', matchRouter);
router.use('/bundle', bundleRouter);
router.use('/offer', offerRouter);
router.use('/config', configRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;