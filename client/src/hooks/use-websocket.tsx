/**
 * WebSocket Hook for React Components
 * 
 * This hook provides a simple interface for React components to interact with
 * the WebSocket API, handling connection, message sending, and state tracking.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketClient, WebSocketMessage } from '../lib/websocket-client';
import { v4 as uuidv4 } from 'uuid';

// Connection status enum for better type safety
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected'
}

interface UseWebSocketOptions {
  // Whether to connect automatically on component mount
  autoConnect?: boolean;
  // Whether to store and retrieve sessionId from localStorage
  persistSession?: boolean;
  // Custom storage key for the session ID
  sessionStorageKey?: string;
}

interface UseWebSocketResult {
  // Current connection status
  connectionStatus: ConnectionStatus;
  // Last message received from the server
  lastMessage: WebSocketMessage | null;
  // Function to send a message to the server
  sendMessage: (message: WebSocketMessage) => boolean;
  // Function to manually connect to the server
  connect: () => Promise<void>;
  // Function to manually disconnect from the server
  disconnect: () => void;
  // Current session ID
  sessionId: string;
}

/**
 * React hook for WebSocket communication
 * @param initialSessionId Optional initial session ID
 * @param options Configuration options
 */
export function useWebSocket(
  initialSessionId?: string,
  options: UseWebSocketOptions = {}
): UseWebSocketResult {
  // Set default options
  const {
    autoConnect = true,
    persistSession = true,
    sessionStorageKey = 'websocket_session_id'
  } = options;
  
  // State for tracking connection status
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  
  // Keep track of the last received message
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // Generate or retrieve session ID
  const [sessionId, setSessionId] = useState<string>(() => {
    if (initialSessionId) return initialSessionId;
    
    if (persistSession) {
      const stored = localStorage.getItem(sessionStorageKey);
      if (stored) return stored;
    }
    
    // Generate a new session ID if none exists
    return uuidv4();
  });
  
  // Store active listeners for cleanup
  const listenersRef = useRef<Array<() => void>>([]);
  
  // Connect to the WebSocket server
  const connect = useCallback(async () => {
    try {
      setConnectionStatus(ConnectionStatus.CONNECTING);
      
      // Store session ID if persistence is enabled
      if (persistSession) {
        localStorage.setItem(sessionStorageKey, sessionId);
      }
      
      // Connect to the WebSocket server
      await websocketClient.connect(sessionId);
      setConnectionStatus(ConnectionStatus.CONNECTED);
      
      // Set up message listener
      const removeListener = websocketClient.on('message', (data: WebSocketMessage) => {
        setLastMessage(data);
      });
      
      // Track for cleanup
      listenersRef.current.push(removeListener);
    } catch (err) {
      console.error('Failed to connect to WebSocket:', err);
      setConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  }, [sessionId, persistSession, sessionStorageKey]);
  
  // Disconnect from the WebSocket server
  const disconnect = useCallback(() => {
    websocketClient.disconnect();
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    
    // Clean up listeners
    listenersRef.current.forEach(removeListener => removeListener());
    listenersRef.current = [];
  }, []);
  
  // Send a message to the WebSocket server
  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    // Include sessionId if not provided in message
    const messageWithSession = {
      ...message,
      sessionId: message.sessionId || sessionId
    };
    
    return websocketClient.send(messageWithSession);
  }, [sessionId]);
  
  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);
  
  // Monitor connection status changes
  useEffect(() => {
    // Helper to update status based on client state
    const updateStatus = () => {
      const isConnected = websocketClient.isConnected();
      setConnectionStatus(
        isConnected ? ConnectionStatus.CONNECTED : ConnectionStatus.DISCONNECTED
      );
    };
    
    // Update status every 5 seconds as a safeguard
    const interval = setInterval(updateStatus, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  return {
    connectionStatus,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    sessionId
  };
}