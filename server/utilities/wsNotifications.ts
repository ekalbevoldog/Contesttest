/**
 * WebSocket Notification Utilities
 * 
 * This module provides utility functions for sending notifications
 * and updates to clients via WebSockets.
 */

import { wsHelpers } from '../routes';

/**
 * Broadcast live user statistics to all clients
 * 
 * @param {number} userCount - Number of active users
 * @param {Object} additionalStats - Any additional statistics to include
 * @returns {number} Number of clients the message was sent to
 */
export function broadcastUserStats(userCount: number, additionalStats = {}): number {
  if (!wsHelpers.broadcastToChannel) {
    console.warn('WebSocket helper not available, cannot broadcast stats');
    return 0;
  }

  return wsHelpers.broadcastToChannel('stats:global', {
    type: 'stats_update',
    userCount,
    ...additionalStats,
    timestamp: new Date().toISOString()
  });
}

/**
 * Broadcast new campaign notification to all clients
 * 
 * @param {string} campaignName - Name of the new campaign
 * @param {string} campaignId - ID of the new campaign
 * @param {Object} campaignDetails - Additional campaign details
 * @returns {number} Number of clients the message was sent to
 */
export function broadcastNewCampaign(
  campaignName: string, 
  campaignId: string, 
  campaignDetails = {}
): number {
  if (!wsHelpers.broadcastToChannel) {
    console.warn('WebSocket helper not available, cannot broadcast campaign');
    return 0;
  }

  return wsHelpers.broadcastToChannel('campaigns:new', {
    type: 'new_campaign',
    campaignName,
    campaignId,
    details: campaignDetails,
    timestamp: new Date().toISOString()
  });
}

/**
 * Send a personalized notification to a specific user
 * 
 * @param {string} userId - ID of the user to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} level - Notification level (info, success, warning, error)
 * @param {Object} additionalData - Additional data to include
 * @returns {number} 1 if sent, 0 if not
 */
export function sendUserNotification(
  userId: string,
  title: string,
  message: string,
  level: 'info' | 'success' | 'warning' | 'error' = 'info',
  additionalData = {}
): number {
  if (!wsHelpers.broadcastToChannel) {
    console.warn('WebSocket helper not available, cannot send user notification');
    return 0;
  }

  return wsHelpers.broadcastToChannel(`user:${userId}`, {
    type: 'notification',
    title,
    message,
    level,
    data: additionalData,
    timestamp: new Date().toISOString()
  });
}

/**
 * Send a notification to users with a specific role
 * 
 * @param {string} role - Role to target (athlete, business, admin)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} level - Notification level
 * @param {Object} additionalData - Additional data to include
 * @returns {number} Number of clients the message was sent to
 */
export function sendRoleNotification(
  role: string,
  title: string,
  message: string,
  level: 'info' | 'success' | 'warning' | 'error' = 'info',
  additionalData = {}
): number {
  if (!wsHelpers.broadcastToChannel) {
    console.warn('WebSocket helper not available, cannot send role notification');
    return 0;
  }

  return wsHelpers.broadcastToChannel(`role:${role}`, {
    type: 'notification',
    title,
    message,
    level,
    data: additionalData,
    timestamp: new Date().toISOString()
  });
}

export default {
  broadcastUserStats,
  broadcastNewCampaign,
  sendUserNotification,
  sendRoleNotification
};