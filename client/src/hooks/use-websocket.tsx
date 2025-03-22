import { useEffect, useRef, useState, useCallback } from 'react';

type WebSocketMessage = {
  type: string;
  message: string;
  data?: any;
  matchData?: any;
};

type WebSocketHook = {
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  connectionStatus: 'connecting' | 'open' | 'closed';
};

export function useWebSocket(sessionId: string | null): WebSocketHook {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed'>('closed');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds

  // Function reference for attempting reconnect
  const attemptReconnectRef = useRef<() => void>();
  
  // Function to establish a WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!sessionId) return;
    
    // Clear any existing socket
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      setConnectionStatus('connecting');

      socket.onopen = () => {
        console.log('WebSocket connection established');
        setConnectionStatus('open');
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts
        
        // Register with the server using the session ID
        socket.send(JSON.stringify({
          type: 'register',
          sessionId
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          setLastMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setConnectionStatus('closed');

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && attemptReconnectRef.current) {
          attemptReconnectRef.current();
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('closed');
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('closed');
      if (attemptReconnectRef.current) {
        attemptReconnectRef.current();
      }
    }
  }, [sessionId]);

  // Define the reconnect function and store in ref to avoid dependency cycles
  useEffect(() => {
    attemptReconnectRef.current = () => {
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Maximum reconnection attempts reached');
        return;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current += 1;
        console.log(`Attempting to reconnect (attempt ${reconnectAttemptsRef.current} of ${MAX_RECONNECT_ATTEMPTS})...`);
        connectWebSocket();
      }, RECONNECT_DELAY);
    };
  }, [connectWebSocket, MAX_RECONNECT_ATTEMPTS, RECONNECT_DELAY]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (sessionId) {
      connectWebSocket();
    }

    // Clean up WebSocket connection and timeouts on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [sessionId, connectWebSocket]);

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected, cannot send message. Current state:', 
        socketRef.current ? socketRef.current.readyState : 'No socket');
      
      // If no connection, attempt to reconnect
      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        connectWebSocket();
      }
    }
  }, [connectWebSocket]);

  return { lastMessage, sendMessage, connectionStatus };
}