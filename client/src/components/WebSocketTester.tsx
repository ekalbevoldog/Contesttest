import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useWebSocket } from "@/hooks/use-websocket";
import { v4 as uuidv4 } from "uuid";

export function WebSocketTester() {
  // Generate a unique session ID for testing if none exists
  const [sessionId, setSessionId] = useState<string>(() => {
    const existingId = localStorage.getItem('sessionId');
    return existingId || uuidv4();
  });
  
  // Get the WebSocket hook
  const { connectionStatus, lastMessage, sendMessage } = useWebSocket(sessionId);
  
  // Save session ID to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sessionId', sessionId);
  }, [sessionId]);
  
  // Test sending a message through the WebSocket
  const handleTestWebSocket = () => {
    sendMessage({
      type: 'test',
      sessionId,
      message: 'This is a test message'
    });
  };
  
  // Test the notification endpoint
  const handleTestNotification = async () => {
    try {
      const response = await fetch('/api/test/simulate-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });
      
      const data = await response.json();
      console.log('Notification test response:', data);
    } catch (error) {
      console.error('Error testing notification:', error);
    }
  };
  
  // Reset the session ID
  const handleResetSession = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
  };
  
  return (
    <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">WebSocket Connection Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="session-id">Session ID</Label>
          <div className="flex space-x-2">
            <Input 
              id="session-id" 
              value={sessionId} 
              readOnly 
              className="flex-1 bg-zinc-800 border-zinc-700" 
            />
            <Button variant="outline" onClick={handleResetSession}>
              Reset
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Connection Status</Label>
          <div className="flex items-center space-x-2">
            <div 
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'open' 
                  ? 'bg-green-500' 
                  : connectionStatus === 'connecting' 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
              }`} 
            />
            <span className="text-sm">
              {connectionStatus === 'open' 
                ? 'Connected' 
                : connectionStatus === 'connecting' 
                ? 'Connecting...' 
                : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            onClick={handleTestWebSocket}
            disabled={connectionStatus !== 'open'}
            className="bg-zinc-800 hover:bg-zinc-700"
          >
            Send Test Message
          </Button>
          <Button 
            onClick={handleTestNotification}
            disabled={connectionStatus !== 'open'}
            className="bg-gradient-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600"
          >
            Test Match Notification
          </Button>
        </div>
        
        {lastMessage && (
          <div className="mt-6 space-y-2">
            <Label>Last Message Received</Label>
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="bg-zinc-700">
                    {lastMessage.type || 'unknown'}
                  </Badge>
                  <span className="text-xs text-zinc-400">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <pre className="text-xs bg-black p-2 rounded-md overflow-auto max-h-32">
                  {JSON.stringify(lastMessage, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}