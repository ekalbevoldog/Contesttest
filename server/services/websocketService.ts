import { WebSocket } from 'ws';
import { storage } from '../storage.js';

// WebSockets have been disabled for Supabase compatibility
// Using HTTP polling instead
console.log('[WebSocketService] WebSockets are disabled - using HTTP polling for real-time updates');

interface ConnectedClient {
  ws: WebSocket;
  userId?: number;
  userType?: number; // Added userType
  lastActivity: Date;
}

/**
 * WEBSOCKET SERVICE DISABLED
 * This service has been fully disabled as WebSockets are not compatible
 * with the current Supabase implementation. All real-time updates are
 * now handled via HTTP polling.
 */
class WebSocketService {
  private clients: Map<string, ConnectedClient> = new Map();
  private messageQueue: Map<number, any[]> = new Map();

  // All methods disabled - WebSockets not compatible with Supabase
  registerClient(sessionId: string, ws: WebSocket, userType: number) { 
    console.log('[WebSocketService] registerClient called, but WebSockets are disabled');
    return; // Do nothing - WebSockets are disabled
  }

  // All methods disabled - WebSockets not compatible with Supabase
  
  private async handleNewMessage(message: any) {
    console.log('[WebSocketService] handleNewMessage called, but WebSockets are disabled');
    return; // Do nothing - WebSockets are disabled
  }

  private updatePresence(sessionId: string) {
    console.log('[WebSocketService] updatePresence called, but WebSockets are disabled');
    return; // Do nothing - WebSockets are disabled
  }

  private broadcastPresence() {
    console.log('[WebSocketService] broadcastPresence called, but WebSockets are disabled');
    return; // Do nothing - WebSockets are disabled
  }

  private broadcastMessage(message: any) {
    console.log('[WebSocketService] broadcastMessage called, but WebSockets are disabled');
    return; // Do nothing - WebSockets are disabled
  }

  private broadcast(data: any) {
    console.log('[WebSocketService] broadcast called, but WebSockets are disabled');
    return; // Do nothing - WebSockets are disabled
  }

  private async updateUnreadCounts(sessionId: string) {
    console.log('[WebSocketService] updateUnreadCounts called, but WebSockets are disabled');
    return; // Do nothing - WebSockets are disabled
  }
}

export const websocketService = new WebSocketService();