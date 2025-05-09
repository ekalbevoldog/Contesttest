/**
 * WebSocket Test Routes
 * 
 * API routes for testing WebSocket functionality
 */

import { Router } from 'express';
import { wsHelpers } from './index';
import { broadcastUserStats, broadcastNewCampaign } from '../utils/wsNotifications';

const router = Router();

/**
 * Send a test notification to all connected clients
 * @route GET /api/ws-test/broadcast
 */
router.get('/broadcast', (req, res) => {
  if (!wsHelpers.broadcastToChannel) {
    return res.status(503).json({ 
      error: 'WebSocket service not available',
      success: false
    });
  }
  
  const channel = req.query.channel as string || 'global';
  const message = req.query.message as string || 'Test broadcast message';
  
  const recipients = wsHelpers.broadcastToChannel(channel, {
    type: 'test_message',
    content: message,
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    recipients,
    channel,
    message
  });
});

/**
 * Update live user count
 * @route GET /api/ws-test/stats
 */
router.get('/stats', (req, res) => {
  const userCount = parseInt(req.query.count as string) || Math.floor(Math.random() * 100) + 50;
  
  const recipients = broadcastUserStats(userCount, {
    activeCampaigns: Math.floor(Math.random() * 20) + 10,
    lastUpdated: new Date().toISOString()
  });
  
  res.json({
    success: true,
    recipients,
    userCount
  });
});

/**
 * Broadcast a new campaign notification
 * @route GET /api/ws-test/new-campaign
 */
router.get('/new-campaign', (req, res) => {
  const campaignName = req.query.name as string || 'Summer Fitness Challenge';
  const campaignId = req.query.id as string || `campaign-${Date.now()}`;
  
  const recipients = broadcastNewCampaign(
    campaignName, 
    campaignId,
    {
      budget: '$5,000',
      industry: 'Fitness',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  );
  
  res.json({
    success: true,
    recipients,
    campaignName,
    campaignId
  });
});

export default router;