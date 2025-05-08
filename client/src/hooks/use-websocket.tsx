/**
 * WebSocket Hook
 *
 * A comprehensive React hook for WebSocket integration with:
 * - Automatic connection management
 * - Authentication support
 * - Channel subscriptions
 * - Reconnection handling
 * - Message sending and receiving
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

// Message types
export type WebSocketMessageType = 
  | 'system' 
  | 'auth_success' 
  | 'auth_error' 
  | 'subscribed' 
  | 'unsubscribed' 
  | 'echo' 
  | 'error' 
  | 'pong' 
  | string;

// Base message interface
export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp?: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
  path?: string; // WebSocket server path
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (event: Event) => void;
}

interface UseWebSocketResult {
  socket: WebSocket | null;
  connected: boolean;
  connecting: boolean;
  authenticated: boolean;
  messages: WebSocketMessage[];
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  sendMessage: (message: Omit<WebSocketMessage, 'timestamp'>) => void;
  subscribeToChannel: (channel: string) => void;
  unsubscribeFromChannel: (channel: string) => void;
  clearMessages: () => void;
  connectionId: string | null;
  connectionStartTime: number | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketResult {
  const {
    autoConnect = true,
    autoReconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    pingInterval = 30000,
    path = '/ws',
    onOpen,
    onClose,
    onMessage,
    onError,
  } = options;

  // Get authentication information
  const { user } = useAuth();
  const { toast } = useToast();
  
  // WebSocket state
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionStartTime, setConnectionStartTime] = useState<number | null>(null);
  
  // References for interval handling and reconnection
  const reconnectAttemptsRef = useRef(0);
  const pingIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const subscribedChannelsRef = useRef<Set<string>>(new Set());

  // Create WebSocket connection
  const connect = useCallback(() => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('[WebSocket] Already connected or connecting');
      return;
    }

    try {
      setConnecting(true);
      
      // Determine correct WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}${path}`;
      
      console.log(`[WebSocket] Connecting to ${wsUrl}`);
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = (event) => {
        console.log('[WebSocket] Connection established');
        setSocket(newSocket);
        setConnected(true);
        setConnecting(false);
        setConnectionStartTime(Date.now());
        reconnectAttemptsRef.current = 0;
        
        // Setup ping interval for keepalive
        if (pingInterval > 0) {
          if (pingIntervalRef.current) {
            window.clearInterval(pingIntervalRef.current);
          }
          
          pingIntervalRef.current = window.setInterval(() => {
            if (newSocket.readyState === WebSocket.OPEN) {
              newSocket.send(JSON.stringify({ type: 'ping' }));
            }
          }, pingInterval);
        }
        
        // If we have a user, authenticate
        if (user) {
          setTimeout(() => {
            console.log('[WebSocket] Authenticating user');
            newSocket.send(JSON.stringify({
              type: 'authenticate',
              token: localStorage.getItem('sb-access-token') || user.token
            }));
          }, 500);
        }
        
        // Resubscribe to previously subscribed channels
        subscribedChannelsRef.current.forEach(channel => {
          console.log(`[WebSocket] Resubscribing to channel: ${channel}`);
          newSocket.send(JSON.stringify({
            type: 'subscribe',
            channel
          }));
        });
        
        // Call user callback if provided
        if (onOpen) {
          onOpen(event);
        }
      };

      newSocket.onclose = (event) => {
        console.log(`[WebSocket] Connection closed: ${event.code} ${event.reason}`);
        setConnected(false);
        setConnecting(false);
        setAuthenticated(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          window.clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Attempt reconnection if enabled
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log(`[WebSocket] Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          if (reconnectTimeoutRef.current) {
            window.clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('[WebSocket] Max reconnection attempts reached');
          toast({
            title: 'Connection Lost',
            description: 'Unable to reconnect to the server. Please refresh the page.',
            variant: 'destructive'
          });
        }
        
        // Call user callback if provided
        if (onClose) {
          onClose(event);
        }
      };

      newSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          
          // Handle special message types
          if (message.type === 'system' && message.connectionId) {
            setConnectionId(message.connectionId);
          } else if (message.type === 'auth_success') {
            console.log('[WebSocket] Authentication successful');
            setAuthenticated(true);
          } else if (message.type === 'auth_error') {
            console.error('[WebSocket] Authentication failed:', message.error);
            setAuthenticated(false);
          }
          
          // Add message to history
          setMessages(prev => [...prev, message]);
          
          // Call user callback if provided
          if (onMessage) {
            onMessage(message);
          }
        } catch (err) {
          console.error('[WebSocket] Error parsing message:', err);
        }
      };

      newSocket.onerror = (event) => {
        console.error('[WebSocket] Connection error');
        
        // Call user callback if provided
        if (onError) {
          onError(event);
        }
      };

      setSocket(newSocket);
    } catch (err) {
      console.error('[WebSocket] Error creating connection:', err);
      setConnecting(false);
      
      toast({
        title: 'Connection Error',
        description: 'Failed to establish WebSocket connection.',
        variant: 'destructive'
      });
    }
  }, [
    socket, path, user, autoReconnect, maxReconnectAttempts, 
    reconnectInterval, pingInterval, onOpen, onClose, onMessage, 
    onError, toast
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (!socket) {
      return;
    }

    console.log('[WebSocket] Manually disconnecting');
    
    // Clear intervals and timeouts
    if (pingIntervalRef.current) {
      window.clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Reset reconnect attempts to avoid immediate reconnection
    reconnectAttemptsRef.current = maxReconnectAttempts;
    
    // Close socket connection
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
    
    setSocket(null);
    setConnected(false);
    setConnecting(false);
    setAuthenticated(false);
  }, [socket, maxReconnectAttempts]);

  // Force reconnection
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 500);
  }, [connect, disconnect]);

  // Send a message through the WebSocket
  const sendMessage = useCallback(
    (message: Omit<WebSocketMessage, 'timestamp'>) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.error('[WebSocket] Cannot send message, socket not connected');
        return;
      }

      socket.send(JSON.stringify(message));
    },
    [socket]
  );

  // Subscribe to a channel
  const subscribeToChannel = useCallback(
    (channel: string) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        // Store for later reconnection
        subscribedChannelsRef.current.add(channel);
        console.log(`[WebSocket] Channel ${channel} queued for subscription when connected`);
        return;
      }

      console.log(`[WebSocket] Subscribing to channel: ${channel}`);
      subscribedChannelsRef.current.add(channel);
      sendMessage({
        type: 'subscribe',
        channel
      });
    },
    [socket, sendMessage]
  );

  // Unsubscribe from a channel
  const unsubscribeFromChannel = useCallback(
    (channel: string) => {
      subscribedChannelsRef.current.delete(channel);
      
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.log(`[WebSocket] Channel ${channel} removed from subscription queue`);
        return;
      }

      console.log(`[WebSocket] Unsubscribing from channel: ${channel}`);
      sendMessage({
        type: 'unsubscribe',
        channel
      });
    },
    [socket, sendMessage]
  );

  // Clear message history
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (pingIntervalRef.current) {
        window.clearInterval(pingIntervalRef.current);
      }
      
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        console.log('[WebSocket] Closing connection on unmount');
        socket.close();
      }
    };
  }, [autoConnect, connect, socket]);

  return {
    socket,
    connected,
    connecting,
    authenticated,
    messages,
    connect,
    disconnect,
    reconnect,
    sendMessage,
    subscribeToChannel,
    unsubscribeFromChannel,
    clearMessages,
    connectionId,
    connectionStartTime
  };
}