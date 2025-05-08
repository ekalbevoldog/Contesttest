/**
 * WebSocket Provider
 * 
 * A context provider that makes the WebSocket connection available to all components
 * in the application. Uses the useWebSocket hook for connection management.
 */
import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useWebSocket } from '../hooks/use-websocket';
import type { WebSocketMessage } from '../hooks/use-websocket';

// Context interface
interface WebSocketContextType {
  connected: boolean;
  connecting: boolean;
  authenticated: boolean;
  messages: WebSocketMessage[];
  sendMessage: (message: any) => void;
  subscribeToChannel: (channel: string) => void;
  unsubscribeFromChannel: (channel: string) => void;
  connectionId: string | null;
  reconnect: () => void;
}

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Provider props interface
interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean; 
  path?: string;
}

/**
 * WebSocket Provider Component
 * 
 * Provides WebSocket functionality to the application through React Context.
 */
export function WebSocketProvider({ 
  children, 
  autoConnect = true,
  path = '/ws'
}: WebSocketProviderProps) {
  // Use the WebSocket hook to manage the connection
  const { 
    connected,
    connecting,
    authenticated,
    messages,
    sendMessage,
    subscribeToChannel,
    unsubscribeFromChannel,
    connectionId,
    reconnect
  } = useWebSocket({
    autoConnect,
    path
  });

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    connected,
    connecting,
    authenticated,
    messages,
    sendMessage,
    subscribeToChannel,
    unsubscribeFromChannel,
    connectionId,
    reconnect
  }), [
    connected,
    connecting,
    authenticated,
    messages,
    sendMessage,
    subscribeToChannel,
    unsubscribeFromChannel,
    connectionId,
    reconnect
  ]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Custom hook to use WebSocket context
 * 
 * This hook provides easy access to the WebSocket context values.
 */
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  
  if (context === null) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  
  return context;
}