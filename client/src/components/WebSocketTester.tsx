/**
 * WebSocket Tester Component
 * 
 * A UI component for testing the WebSocket connection and functionality.
 */
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  type: string;
  data?: any;
  message?: string;
  timestamp: string;
}

export function WebSocketTester() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const socketRef = useRef<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Establish WebSocket connection
  useEffect(() => {
    // Close previous connection if exists
    if (socketRef.current) {
      socketRef.current.close();
    }

    try {
      // Construct WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      // Connection opened handler
      socket.addEventListener('open', () => {
        setConnected(true);
        setError(null);
        console.log('WebSocket connection established');
      });
      
      // Message handler
      socket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages((prev) => [...prev, data]);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      });
      
      // Error handler
      socket.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error occurred');
        setConnected(false);
      });
      
      // Connection closed handler
      socket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        setConnected(false);
      });
      
      // Cleanup on unmount
      return () => {
        socket.close();
      };
    } catch (err) {
      console.error('Failed to establish WebSocket connection:', err);
      setError('Failed to establish connection');
    }
  }, []);
  
  // Function to send a message
  const sendMessage = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !inputMessage.trim()) {
      return;
    }
    
    try {
      const message = {
        text: inputMessage.trim(),
        timestamp: new Date().toISOString()
      };
      
      socketRef.current.send(JSON.stringify(message));
      setInputMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          WebSocket Test
          <Badge variant={connected ? "secondary" : "destructive"}>
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Test the real-time WebSocket connection
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-destructive/20 text-destructive p-2 rounded mb-4 text-sm">
            Error: {error}
          </div>
        )}
        
        <ScrollArea className="h-[250px] p-2 border rounded-md bg-muted/20">
          {messages.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No messages yet. Send something to start!
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <div key={index} className="p-2 border rounded-md bg-background">
                  <div className="text-xs text-muted-foreground">
                    {new Date(msg.timestamp).toLocaleTimeString()} - {msg.type}
                  </div>
                  <div className="mt-1">
                    {msg.message || (msg.data && JSON.stringify(msg.data, null, 2))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <Button onClick={sendMessage} disabled={!connected || !inputMessage.trim()}>
          Send
        </Button>
      </CardFooter>
    </Card>
  );
}