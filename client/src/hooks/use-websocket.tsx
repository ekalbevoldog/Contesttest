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

export function useWebSocket(sessionId: string | null = null): WebSocketHook {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed'>('closed');
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 3; // Reduced to prevent excessive retries
  const RECONNECT_DELAY = 2000; // 2 seconds between retries
  const CONNECTION_TIMEOUT = 5000; // 5 seconds timeout for initial connection

  // Function reference for attempting reconnect
  const attemptReconnectRef = useRef<() => void>();
  
  // Track if the component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Function to establish a WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!sessionId) {
      console.log('No sessionId provided, skipping WebSocket connection');
      return;
    }
    
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
      console.log('Closing existing WebSocket connection');
      socketRef.current.close();
    }

    try {
      // Create WebSocket connection - use relative path with host for cross-compatibility
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Use the same origin as the current page to avoid CORS issues
      const wsUrl = `${protocol}//${window.location.host}/api/contested-ws`;
      console.log(`Attempting to connect to WebSocket at ${wsUrl}`);
      
      // Set connecting state before creating the socket
      setConnectionStatus('connecting');
      
      // Create the socket with error handling
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connection established successfully');
        if (isMountedRef.current) {
          setConnectionStatus('open');
          reconnectAttemptsRef.current = 0; // Reset reconnect attempts
        }
        
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
        
        // Only send if socket is still open
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(registrationMessage));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (isMountedRef.current) {
            setLastMessage(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        
        if (isMountedRef.current) {
          setConnectionStatus('closed');
        }

        // Attempt to reconnect if not a normal closure and component is still mounted
        if (event.code !== 1000 && attemptReconnectRef.current && isMountedRef.current) {
          attemptReconnectRef.current();
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        if (isMountedRef.current) {
          setConnectionStatus('closed');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      
      if (isMountedRef.current) {
        setConnectionStatus('closed');
      }
      
      if (attemptReconnectRef.current && isMountedRef.current) {
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
    // Set isMounted to true when the component mounts
    isMountedRef.current = true;
    
    // Create a function to safely set connection status
    const safeSetConnectionStatus = (status: 'connecting' | 'open' | 'closed') => {
      if (isMountedRef.current) {
        setConnectionStatus(status);
      }
    };
    
    let connectionTimeoutId: ReturnType<typeof setTimeout>;
    
    if (sessionId) {
      try {
        // Try to connect with error handling
        connectWebSocket();
        
        // Add connection timeout
        connectionTimeoutId = setTimeout(() => {
          if (isMountedRef.current && connectionStatus === 'connecting') {
            console.log('WebSocket connection timeout - setting to closed state');
            safeSetConnectionStatus('closed');
          }
        }, CONNECTION_TIMEOUT);
      } catch (error) {
        console.error('Error during WebSocket initialization:', error);
        safeSetConnectionStatus('closed');
      }
    }
    
    // Clean up WebSocket connection and timeouts on unmount
    return () => {
      // Mark as unmounted to prevent state updates
      isMountedRef.current = false;
      
      // Clear connection timeout
      if (connectionTimeoutId) {
        clearTimeout(connectionTimeoutId);
      }
      
      // Close WebSocket connection if it exists
      if (socketRef.current) {
        try {
          // Set to null after close to prevent further operations
          const socket = socketRef.current;
          socketRef.current = null;
          
          socket.onclose = null; // Remove close handler to prevent reconnect attempts
          socket.onerror = null; // Remove error handler
          socket.close();
        } catch (error) {
          console.error('Error closing WebSocket connection:', error);
        }
      }
      
      // Clear any pending reconnection timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [sessionId, connectWebSocket, connectionStatus, CONNECTION_TIMEOUT]);

  // Send a message through WebSocket
  const sendMessage = useCallback((message: any) => {
    // If component is not mounted, don't attempt to send
    if (!isMountedRef.current) {
      console.log('Component is unmounted, skipping message send');
      return false;
    }
    
    let messageSent = false;
    
    // Try direct WebSocket first
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(message));
        console.log('WebSocket message sent successfully:', message.type);
        messageSent = true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        
        // Only attempt reconnect if component is still mounted
        if (isMountedRef.current) {
          connectWebSocket(); // Try to reconnect on send error
        }
      }
    } else {
      console.warn('WebSocket is not connected, attempting to reconnect');
      
      // If no connection, attempt to reconnect
      if ((!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) && isMountedRef.current) {
        console.log('Attempting to reconnect WebSocket before sending message');
        connectWebSocket();
        
        // Queue the message to be sent after connection is established
        setTimeout(() => {
          // Check again that component is still mounted before attempting to send
          if (!isMountedRef.current) {
            return;
          }
          
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