import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase-client';

type WebSocketMessage = {
  type: string;
  message?: string;
  data?: any;
  matchData?: any;
  sessionId?: string;
  step?: string;
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
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds

  // Function reference for attempting reconnect
  const attemptReconnectRef = useRef<() => void>();
  
  // Disable Supabase realtime channel - it's causing conflicts with our direct WebSocket
  // useEffect(() => {
  //   // Supabase realtime channel has been disabled to prevent websocket conflicts
  // }, [sessionId]);
  
  // Function to establish a direct WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!sessionId) return;
    
    // Get user authentication data
    let userId = localStorage.getItem('userId');
    if (!userId) {
      try {
        // Try to get from Supabase auth
        const authData = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
        userId = authData?.currentSession?.user?.id;
        if (userId) {
          console.log('Found user ID from Supabase auth:', userId);
          // Store it for easier access later
          localStorage.setItem('userId', userId);
        }
      } catch (error) {
        console.error('Error parsing Supabase auth data:', error);
      }
    }
    
    // Clear any existing socket
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      // Create WebSocket connection - use relative path with host for cross-compatibility
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Use the same origin as the current page to avoid CORS issues
      // Don't specify port - let the browser handle it automatically based on current location
      // Use a distinct path to avoid conflicts with Vite's WebSocket
      const wsUrl = `${protocol}//${window.location.host}/api/contested-ws`;
      console.log(`Attempting to connect to WebSocket at ${wsUrl}`);
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      setConnectionStatus('connecting');

      socket.onopen = () => {
        console.log('WebSocket connection established successfully');
        setConnectionStatus('open');
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts
        
        // Register with the server using the session ID
        // Get the userId that we fetched earlier
        const userId = localStorage.getItem('userId');
        
        const registrationMessage = {
          type: 'register',
          sessionId,
          userData: {
            // Add user data from localStorage
            userId: userId || null,
            role: localStorage.getItem('userRole') || 'visitor'
          }
        };
        
        // Log the userId for debugging
        console.log('Registering WebSocket with userId:', registrationMessage.userData.userId);
        console.log('Sending registration message:', registrationMessage);
        socket.send(JSON.stringify(registrationMessage));
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
        
        // Always set status to closed since we don't use Supabase channel
        setConnectionStatus('closed');

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && attemptReconnectRef.current) {
          attemptReconnectRef.current();
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Always set status to closed
        setConnectionStatus('closed');
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      // Always set status to closed
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

  // Send a message through WebSocket only - Supabase realtime has been disabled
  const sendMessage = useCallback((message: any) => {
    let messageSent = false;
    
    // Try direct WebSocket first
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(message));
        console.log('WebSocket message sent successfully:', message.type);
        messageSent = true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        connectWebSocket(); // Try to reconnect on send error
      }
    } else {
      console.warn('WebSocket is not connected, attempting to reconnect');
      
      // If no connection, attempt to reconnect
      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        console.log('Attempting to reconnect WebSocket before sending message');
        connectWebSocket();
        
        // Queue the message to be sent after connection is established
        setTimeout(() => {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            console.log('Sending delayed message after reconnection');
            socketRef.current.send(JSON.stringify(message));
            messageSent = true;
          } else {
            console.error('Failed to send message after reconnection attempt');
          }
        }, 1000); // Wait 1 second for connection to establish
      }
    }
    
    return messageSent;
  }, [connectWebSocket]);

  return { lastMessage, sendMessage, connectionStatus };
}