import express from 'express';
import matchRouter from './match/index.js';
import bundleRouter from './bundle/index.js';
import offerRouter from './offer/index.js';

const router = express.Router();

// Register API routes
router.use('/match', matchRouter);
router.use('/bundle', bundleRouter);
router.use('/offer', offerRouter);

export default router;