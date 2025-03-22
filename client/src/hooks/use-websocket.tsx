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

  useEffect(() => {
    if (!sessionId) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    
    setConnectionStatus('connecting');

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setConnectionStatus('open');
      
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

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnectionStatus('closed');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Clean up WebSocket connection on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [sessionId]);

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected, cannot send message');
    }
  }, []);

  return { lastMessage, sendMessage, connectionStatus };
}