/**
 * WebSocket Provider Context
 * 
 * Provides application-wide WebSocket connection and management.
 * Simply wrap your app with this provider to enable WebSocket functionality.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import useWebSocket, { WebSocketMessage, UseWebSocketReturn, WebSocketStatus } from '@/lib/useWebsocket';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

// Default WebSocket context value
const defaultWebSocketValue: UseWebSocketReturn = {
  status: 'closed',
  isConnected: false,
  isAuthenticated: false,
  connect: () => {},
  disconnect: () => {},
  authenticate: () => {},
  sendMessage: () => {},
  subscribe: () => {},
  unsubscribe: () => {},
  subscriptions: new Set(),
  lastMessage: null,
};

// WebSocket context
const WebSocketContext = createContext<UseWebSocketReturn>(defaultWebSocketValue);

// WebSocket provider props
interface WebSocketProviderProps {
  children: React.ReactNode;
  initialChannels?: string[];
  debug?: boolean;
  autoConnect?: boolean;
  enableNotifications?: boolean;
}

/**
 * WebSocket Provider Component
 * 
 * @param props Component props
 * @returns Provider component
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  initialChannels = [],
  debug = false,
  autoConnect = true,
  enableNotifications = true,
}) => {
  // Get authentication token from Supabase
  const { session } = useSupabaseAuth();
  const token = session?.access_token;
  
  // WebSocket hook
  const webSocket = useWebSocket(token, {
    autoConnect,
    channels: initialChannels,
    debug,
    onMessage: handleMessage,
  });
  
  // Message notification system
  const [notifications, setNotifications] = useState<WebSocketMessage[]>([]);
  
  // Handle incoming messages
  function handleMessage(message: WebSocketMessage) {
    // Store notifications if enabled
    if (enableNotifications && message.type === 'notification') {
      setNotifications(prev => [...prev, message]);
    }
  }
  
  // Clear notifications
  const clearNotifications = () => setNotifications([]);
  
  // Status change handler
  useEffect(() => {
    if (webSocket.status === 'authenticated') {
      // Auto-subscribe to user-specific channel when authenticated
      if (session?.user?.id) {
        webSocket.subscribe(`user:${session.user.id}`);
      }
    }
  }, [webSocket.status, session?.user?.id]);

  return (
    <WebSocketContext.Provider 
      value={{
        ...webSocket,
        // Add additional functionality if needed
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Use WebSocket Hook
 * 
 * @returns WebSocket context
 */
export const useWebSocketContext = (): UseWebSocketReturn => {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  
  return context;
};

export default WebSocketProvider;