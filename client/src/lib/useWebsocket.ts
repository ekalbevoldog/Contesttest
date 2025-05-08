/**
 * React Hook for WebSocket Management
 *
 * A robust WebSocket client with authentication, channel subscription,
 * automatic reconnection, and message handling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';

// WebSocket message types
export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

// WebSocket connection status
export type WebSocketStatus = 'connecting' | 'connected' | 'authenticated' | 'error' | 'closed';

// Hook options
export type UseWebSocketOptions = {
  autoConnect?: boolean;
  autoReconnect?: boolean;
  autoAuthenticate?: boolean;
  reconnectInterval?: number;
  pingInterval?: number;
  maxReconnectAttempts?: number;
  channels?: string[];
  authExpiryThreshold?: number;
  authRedirectPath?: string;
  onError?: (error: any) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  debug?: boolean;
};

// WebSocket hook return value
export type UseWebSocketReturn = {
  status: WebSocketStatus;
  isConnected: boolean;
  isAuthenticated: boolean;
  connect: () => void;
  disconnect: () => void;
  authenticate: (token: string) => void;
  sendMessage: (message: WebSocketMessage) => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  subscriptions: Set<string>;
  lastMessage: WebSocketMessage | null;
};

// Default options
const defaultOptions: UseWebSocketOptions = {
  autoConnect: true,
  autoReconnect: true,
  autoAuthenticate: true,
  reconnectInterval: 3000,
  pingInterval: 30000,
  maxReconnectAttempts: 5,
  channels: [],
  authExpiryThreshold: 300000, // 5 minutes
  authRedirectPath: '/login',
  debug: false
};

/**
 * WebSocket Hook for React Applications
 *
 * @param token Authentication token (optional)
 * @param options WebSocket configuration options
 * @returns WebSocket connection status and control methods
 */
export function useWebSocket(token?: string, options: UseWebSocketOptions = {}): UseWebSocketReturn {
  // Merge default options with provided options
  const opts = { ...defaultOptions, ...options };
  
  // State variables
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [subscriptions] = useState<Set<string>>(new Set(opts.channels));
  
  // Refs to prevent issues with stale closures
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const pingTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const tokenRef = useRef<string | undefined>(token);
  const [, setLocation] = useLocation();

  // Update token ref when token changes
  useEffect(() => {
    tokenRef.current = token;
    
    // If token changes and we're connected, authenticate
    if (token && wsRef.current?.readyState === WebSocket.OPEN && opts.autoAuthenticate && !isAuthenticated) {
      authenticate(token);
    }
  }, [token, opts.autoAuthenticate, isAuthenticated]);

  // Log debug messages if debug is enabled
  const log = useCallback((message: string, ...data: any[]) => {
    if (opts.debug) {
      console.log(`[WebSocket] ${message}`, ...data);
    }
  }, [opts.debug]);

  // Connect to WebSocket server
  const connect = useCallback(() => {
    // Don't connect if already connected
    if (wsRef.current && (wsRef.current.readyState === 0 || wsRef.current.readyState === 1)) {
      log('Already connected or connecting');
      return;
    }
    
    try {
      setStatus('connecting');
      
      // Determine WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      log(`Connecting to ${wsUrl}`);
      
      // Create WebSocket connection
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      // WebSocket event handlers
      ws.onopen = () => {
        log('Connection established');
        setStatus('connected');
        reconnectAttempts.current = 0;
        
        // Set up ping interval
        startPingInterval();
        
        // Auto-authenticate if token is available
        if (tokenRef.current && opts.autoAuthenticate) {
          authenticate(tokenRef.current);
        }
        
        // Subscribe to channels
        subscriptions.forEach(channel => {
          subscribe(channel);
        });
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          log('Received message', message);
          
          // Update last message
          setLastMessage(message);
          
          // Handle specific message types
          switch (message.type) {
            case 'auth_success':
              log('Authentication successful', message);
              setIsAuthenticated(true);
              setStatus('authenticated');
              break;
              
            case 'auth_error':
              log('Authentication failed', message);
              setIsAuthenticated(false);
              
              // If authentication fails, redirect to login page
              if (opts.authRedirectPath) {
                setLocation(opts.authRedirectPath);
              }
              break;
          }
          
          // Call onMessage callback if provided
          if (opts.onMessage) {
            opts.onMessage(message);
          }
        } catch (error) {
          log('Error parsing message', error);
          
          if (opts.onError) {
            opts.onError(error);
          }
        }
      };
      
      ws.onclose = (event) => {
        log('Connection closed', event);
        setStatus('closed');
        setIsAuthenticated(false);
        
        // Clear ping interval
        stopPingInterval();
        
        // Reconnect if auto-reconnect is enabled
        if (opts.autoReconnect && reconnectAttempts.current < (opts.maxReconnectAttempts || 5)) {
          reconnectTimerRef.current = window.setTimeout(() => {
            reconnectAttempts.current++;
            log(`Reconnecting (attempt ${reconnectAttempts.current})`);
            connect();
          }, opts.reconnectInterval);
        }
      };
      
      ws.onerror = (error) => {
        log('Connection error', error);
        setStatus('error');
        
        if (opts.onError) {
          opts.onError(error);
        }
      };
    } catch (error) {
      log('Error creating WebSocket', error);
      setStatus('error');
      
      if (opts.onError) {
        opts.onError(error);
      }
    }
  }, []);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    log('Disconnecting');
    
    // Clear timers
    stopPingInterval();
    
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setStatus('closed');
    setIsAuthenticated(false);
  }, []);
  
  // Start ping interval to keep connection alive
  const startPingInterval = useCallback(() => {
    stopPingInterval();
    
    pingTimerRef.current = window.setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        log('Sending ping');
        sendMessage({ type: 'ping' });
      }
    }, opts.pingInterval);
  }, [opts.pingInterval]);
  
  // Stop ping interval
  const stopPingInterval = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, []);

  // Authenticate with WebSocket server
  const authenticate = useCallback((authToken: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      log('Authenticating');
      sendMessage({ type: 'authenticate', token: authToken });
    } else {
      log('Cannot authenticate - WebSocket not connected');
    }
  }, []);

  // Send message to WebSocket server
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      log('Sending message', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      log('Cannot send message - WebSocket not connected');
    }
  }, []);

  // Subscribe to a channel
  const subscribe = useCallback((channel: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      log(`Subscribing to channel: ${channel}`);
      subscriptions.add(channel);
      sendMessage({ type: 'subscribe', channel });
    } else {
      // Save subscription for when we connect
      log(`Will subscribe to channel ${channel} when connected`);
      subscriptions.add(channel);
    }
  }, []);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      log(`Unsubscribing from channel: ${channel}`);
      subscriptions.delete(channel);
      sendMessage({ type: 'unsubscribe', channel });
    } else {
      log(`Removing channel ${channel} from subscriptions`);
      subscriptions.delete(channel);
    }
  }, []);

  // Auto-connect when component mounts
  useEffect(() => {
    if (opts.autoConnect) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  // Call onStatusChange callback when status changes
  useEffect(() => {
    if (opts.onStatusChange) {
      opts.onStatusChange(status);
    }
  }, [status, opts.onStatusChange]);

  // Return WebSocket status and control methods
  return {
    status,
    isConnected: status === 'connected' || status === 'authenticated',
    isAuthenticated,
    connect,
    disconnect,
    authenticate,
    sendMessage,
    subscribe,
    unsubscribe,
    subscriptions,
    lastMessage
  };
}

export default useWebSocket;