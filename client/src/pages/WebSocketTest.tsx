/**
 * WebSocket Test Component
 * 
 * A test UI for interacting with the WebSocket server.
 * This page allows testing authentication, subscription, and message sending.
 */

import { useState, useEffect } from 'react';
import useWebSocket, { WebSocketMessage } from '@/lib/useWebsocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

const WebSocketTest = () => {
  const { session } = useSupabaseAuth();
  const token = session?.access_token;
  
  // Local state
  const [channel, setChannel] = useState('global');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  
  // Initialize WebSocket
  const ws = useWebSocket(token, {
    autoConnect: true,
    autoAuthenticate: true,
    debug: true,
    onMessage: (msg) => {
      setMessages(prev => [msg, ...prev]);
    }
  });
  
  // Handle sending message
  const handleSendMessage = () => {
    if (message.trim()) {
      ws.sendMessage({
        type: 'message',
        content: message,
        channel: channel
      });
      setMessage('');
    }
  };
  
  // Subscribe to channel
  const handleSubscribe = () => {
    if (channel.trim()) {
      ws.subscribe(channel);
    }
  };
  
  // Unsubscribe from channel
  const handleUnsubscribe = () => {
    if (channel.trim()) {
      ws.unsubscribe(channel);
    }
  };
  
  // Clear messages
  const clearMessages = () => {
    setMessages([]);
  };
  
  // Get status badge color
  const getStatusColor = () => {
    switch(ws.status) {
      case 'connected': return 'bg-yellow-500';
      case 'authenticated': return 'bg-green-500';
      case 'connecting': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Count channels
  const channelCount = ws.subscriptions.size;
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">WebSocket Test Console</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge className={getStatusColor()}>
                  {ws.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Authenticated:</span>
                <Badge variant={ws.isAuthenticated ? "default" : "outline"}>
                  {ws.isAuthenticated ? "YES" : "NO"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Channels:</span>
                <Badge variant="outline">{channelCount}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Messages:</span>
                <Badge variant="outline">{messages.length}</Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={ws.connect}
              disabled={ws.isConnected}
              variant="outline"
            >
              Connect
            </Button>
            <Button 
              onClick={ws.disconnect}
              disabled={!ws.isConnected}
              variant="destructive"
            >
              Disconnect
            </Button>
          </CardFooter>
        </Card>
        
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Channel Name</label>
                <Input
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="Enter channel name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleSubscribe} disabled={!ws.isConnected}>
                  Subscribe
                </Button>
                <Button 
                  onClick={handleUnsubscribe} 
                  variant="outline"
                  disabled={!ws.isConnected}
                >
                  Unsubscribe
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <label className="block text-sm mb-2">Active Channels</label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(ws.subscriptions).map(ch => (
                    <Badge key={ch} variant="secondary">
                      {ch}
                    </Badge>
                  ))}
                  {ws.subscriptions.size === 0 && (
                    <span className="text-sm text-gray-500">No active subscriptions</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Message Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Message</label>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={handleSendMessage}
              disabled={!ws.isConnected || !message.trim()}
            >
              Send
            </Button>
            <Button 
              onClick={clearMessages}
              variant="outline"
            >
              Clear Messages
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Message Log */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Message Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full rounded border p-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                No messages received yet
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{msg.type}</Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="text-sm overflow-x-auto p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {JSON.stringify(msg, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebSocketTest;