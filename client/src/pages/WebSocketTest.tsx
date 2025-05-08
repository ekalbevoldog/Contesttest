/**
 * WebSocket Test Page
 * 
 * A page for testing WebSocket functionality including:
 * - Connecting/disconnecting
 * - Authentication
 * - Subscribing to channels
 * - Sending and receiving messages
 */
import { useState } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketProvider';
import { useAuth } from '../hooks/use-auth';
import { WebSocketStatus } from '../components/WebSocketStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function WebSocketTest() {
  const { user } = useAuth();
  const { 
    connected, 
    connecting, 
    authenticated, 
    messages, 
    sendMessage, 
    subscribeToChannel, 
    unsubscribeFromChannel 
  } = useWebSocketContext();
  
  const [messageText, setMessageText] = useState('');
  const [channelName, setChannelName] = useState('');
  const [activeSubscriptions, setActiveSubscriptions] = useState<string[]>([]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    
    sendMessage({
      type: 'message',
      content: messageText,
      sender: user?.email || 'anonymous'
    });
    
    setMessageText('');
  };
  
  // Handle subscribing to a channel
  const handleSubscribe = () => {
    if (!channelName.trim()) return;
    
    subscribeToChannel(channelName);
    
    if (!activeSubscriptions.includes(channelName)) {
      setActiveSubscriptions([...activeSubscriptions, channelName]);
    }
    
    setChannelName('');
  };
  
  // Handle unsubscribing from a channel
  const handleUnsubscribe = (channel: string) => {
    unsubscribeFromChannel(channel);
    setActiveSubscriptions(activeSubscriptions.filter(ch => ch !== channel));
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">WebSocket Test Page</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* WebSocket Controls */}
        <Card>
          <CardHeader>
            <CardTitle>WebSocket Connection</CardTitle>
            <CardDescription>Status and controls for the WebSocket connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <WebSocketStatus showDebug={true} />
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Channel Subscriptions</h3>
                <div className="flex">
                  <Input
                    placeholder="Enter channel name..."
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    disabled={!connected}
                    className="mr-2"
                  />
                  <Button 
                    onClick={handleSubscribe} 
                    disabled={!connected || !channelName.trim()}
                  >
                    Subscribe
                  </Button>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeSubscriptions.map((channel) => (
                    <Badge 
                      key={channel} 
                      variant="outline"
                      className="flex gap-1 items-center px-2 py-1"
                    >
                      {channel}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnsubscribe(channel)}
                        className="h-4 w-4 p-0 ml-1"
                      >
                        &times;
                      </Button>
                    </Badge>
                  ))}
                  {activeSubscriptions.length === 0 && (
                    <span className="text-xs text-muted-foreground">No active subscriptions</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Send Message</h3>
                <div className="flex">
                  <Input
                    placeholder="Enter message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={!connected}
                    className="mr-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!connected || !messageText.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Message Display */}
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>WebSocket message history</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All Messages</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
                <TabsTrigger value="auth">Auth</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-2">
                <MessageList 
                  messages={messages} 
                  filter={() => true}
                />
              </TabsContent>
              
              <TabsContent value="system" className="mt-2">
                <MessageList 
                  messages={messages} 
                  filter={(msg) => msg.type === 'system' || msg.type === 'ping' || msg.type === 'pong'}
                />
              </TabsContent>
              
              <TabsContent value="auth" className="mt-2">
                <MessageList 
                  messages={messages} 
                  filter={(msg) => msg.type.includes('auth')}
                />
              </TabsContent>
              
              <TabsContent value="custom" className="mt-2">
                <MessageList 
                  messages={messages} 
                  filter={(msg) => 
                    msg.type === 'message' || 
                    msg.type === 'echo' || 
                    (!msg.type.includes('auth') && 
                     msg.type !== 'system' && 
                     msg.type !== 'ping' && 
                     msg.type !== 'pong')}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">WebSocket API Reference</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Authentication</h3>
                <pre className="bg-muted p-3 rounded-md text-xs mt-2">
{`// Send authentication request with JWT token
{
  "type": "authenticate",
  "token": "your-jwt-token"
}`}
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Channel Subscription</h3>
                <pre className="bg-muted p-3 rounded-md text-xs mt-2">
{`// Subscribe to a channel
{
  "type": "subscribe",
  "channel": "channel-name"
}

// Unsubscribe from a channel
{
  "type": "unsubscribe",
  "channel": "channel-name"
}`}
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Sending Messages</h3>
                <pre className="bg-muted p-3 rounded-md text-xs mt-2">
{`// Send a custom message (echo)
{
  "type": "message",
  "content": "Your message",
  "data": { /* any additional data */ }
}

// Send a ping to keep connection alive
{
  "type": "ping"
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for displaying messages
function MessageList({ 
  messages, 
  filter 
}: { 
  messages: any[],
  filter: (msg: any) => boolean
}) {
  // Get last 50 messages and apply filter
  const filteredMessages = messages
    .filter(filter)
    .slice(-50)
    .reverse();
  
  if (filteredMessages.length === 0) {
    return (
      <div className="bg-muted/50 rounded-md p-4 text-center text-sm text-muted-foreground">
        No messages to display
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[300px] rounded-md border p-2">
      <div className="space-y-2">
        {filteredMessages.map((msg, idx) => (
          <div key={idx} className="text-sm border-b border-border pb-2">
            <div className="flex justify-between items-start">
              <Badge variant="outline" className="mb-1">
                {msg.type}
              </Badge>
              {msg.timestamp && (
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
            <pre className="whitespace-pre-wrap break-all text-xs bg-muted p-2 rounded mt-1">
              {JSON.stringify(msg, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}