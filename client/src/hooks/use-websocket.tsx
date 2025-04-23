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
  
  // Initialize Supabase realtime channel for redundancy
  useEffect(() => {
    if (!sessionId) return;
    
    try {
      console.log('Setting up Supabase realtime channel for session:', sessionId);
      
      // Create a channel specific to this session
      const channel = supabase.channel(`session-${sessionId}`, {
        config: {
          broadcast: { self: true }
        }
      });
      
      // Subscribe to events on this channel
      channel
        .on('broadcast', { event: 'message' }, (payload) => {
          console.log('Supabase realtime message received:', payload);
          setLastMessage(payload.payload);
        })
        .subscribe((status) => {
          console.log('Supabase channel status:', status);
          
          // If direct WebSocket isn't connected but Supabase is, we'll still be "open"
          if (status === 'SUBSCRIBED' && connectionStatus !== 'open') {
            setConnectionStatus('open');
          }
        });
      
      // Store channel reference
      channelRef.current = channel;
      
      // Clean up on unmount
      return () => {
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error setting up Supabase realtime channel:', error);
    }
  }, [sessionId, connectionStatus]);
  
  // Function to establish a direct WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!sessionId) return;
    
    // Clear any existing socket
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      // Create WebSocket connection - use just path, not full URL with domain
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Use relative path to avoid issues with hostname resolution
      const wsUrl = `/ws`;
      console.log(`Attempting to connect to WebSocket at ${protocol}//${window.location.host}${wsUrl}`);
      
      const socket = new WebSocket(`${protocol}//${window.location.host}${wsUrl}`);
      socketRef.current = socket;
      
      setConnectionStatus('connecting');

      socket.onopen = () => {
        console.log('WebSocket connection established successfully');
        setConnectionStatus('open');
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts
        
        // Register with the server using the session ID
        const registrationMessage = {
          type: 'register',
          sessionId,
          userData: {
            // Add user data from localStorage if available
            userId: localStorage.getItem('userId'),
            role: localStorage.getItem('userRole') || 'visitor'
          }
        };
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
        
        // Only set status to closed if Supabase channel isn't connected
        if (!channelRef.current || channelRef.current.state !== 'joined') {
          setConnectionStatus('closed');
        }

        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && attemptReconnectRef.current) {
          attemptReconnectRef.current();
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Only set status to closed if Supabase channel isn't connected
        if (!channelRef.current || channelRef.current.state !== 'joined') {
          setConnectionStatus('closed');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      // Only set status to closed if Supabase channel isn't connected
      if (!channelRef.current || channelRef.current.state !== 'joined') {
        setConnectionStatus('closed');
      }
      
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

  // Send a message through both WebSocket and Supabase for redundancy
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
      console.warn('Direct WebSocket is not connected, trying Supabase channel');
    }
    
    // Also try Supabase channel as backup
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'message',
          payload: message
        });
        console.log('Message sent via Supabase channel:', message.type);
        messageSent = true;
      } catch (supabaseError) {
        console.error('Error sending via Supabase channel:', supabaseError);
      }
    }
    
    // If neither method worked, try to reconnect WebSocket
    if (!messageSent) {
      console.error('Both WebSocket and Supabase channel failed to send message');
      
      // If no connection, attempt to reconnect
      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        console.log('Attempting to reconnect WebSocket before sending message');
        connectWebSocket();
        
        // Queue the message to be sent after connection is established
        setTimeout(() => {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            console.log('Sending delayed message after reconnection');
            socketRef.current.send(JSON.stringify(message));
          } else {
            console.error('Failed to send message after reconnection attempt');
            
            // Final attempt via Supabase
            if (channelRef.current) {
              try {
                channelRef.current.send({
                  type: 'broadcast',
                  event: 'message',
                  payload: message
                });
                console.log('Delayed message sent via Supabase channel');
              } catch (finalError) {
                console.error('All communication methods failed:', finalError);
              }
            }
          }
        }, 1000); // Wait 1 second for connection to establish
      }
    }
    
    return messageSent;
  }, [connectWebSocket]);

  return { lastMessage, sendMessage, connectionStatus };
}