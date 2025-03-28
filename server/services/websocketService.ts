
import { WebSocket } from 'ws';
import { storage } from '../storage';

interface ConnectedClient {
  ws: WebSocket;
  userId?: number;
  lastActivity: Date;
}

class WebSocketService {
  private clients: Map<string, ConnectedClient> = new Map();
  private messageQueue: Map<number, any[]> = new Map();

  registerClient(sessionId: string, ws: WebSocket) {
    this.clients.set(sessionId, {
      ws,
      lastActivity: new Date()
    });

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'presence') {
          this.updatePresence(sessionId);
        } else if (message.type === 'message') {
          await this.handleNewMessage(message);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      this.clients.delete(sessionId);
      this.broadcastPresence();
    });
  }

  private async handleNewMessage(message: any) {
    try {
      // Store message in database
      const storedMessage = await storage.storeMessage(message.sessionId, message.sender, message.content, message.metadata);
      
      // Find recipient's websocket connection
      const recipientClient = Array.from(this.clients.entries())
        .find(([_, client]) => client.userType === message.recipientId);

      if (recipientClient) {
        // Send to specific recipient
        const [recipientSessionId, client] = recipientClient;
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'new_message',
            message: storedMessage
          }));
        }
      }

      // Update unread counts
      this.updateUnreadCounts(message.sessionId);
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  }

  private updatePresence(sessionId: string) {
    const client = this.clients.get(sessionId);
    if (client) {
      client.lastActivity = new Date();
      this.broadcastPresence();
    }
  }

  private broadcastPresence() {
    const presence = Array.from(this.clients.entries()).map(([sessionId, client]) => ({
      sessionId,
      lastActivity: client.lastActivity
    }));

    this.broadcast({
      type: 'presence_update',
      presence
    });
  }

  private broadcastMessage(message: any) {
    this.broadcast(message);
  }

  private broadcast(data: any) {
    const payload = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }

  private async updateUnreadCounts(sessionId: string) {
    const unreadCounts = await storage.getUnreadMessageCounts(sessionId);
    const client = this.clients.get(sessionId);
    if (client?.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'unread_update',
        counts: unreadCounts
      }));
    }
  }
}

export const websocketService = new WebSocketService();
