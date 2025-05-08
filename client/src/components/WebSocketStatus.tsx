/**
 * WebSocket Status Component
 * 
 * Provides a UI for monitoring and interacting with the WebSocket connection.
 * Can be used for debugging and displaying connection status.
 */
import { useState } from 'react';
import { useWebSocket } from '../hooks/use-websocket';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiIcon, WifiOffIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';

interface WebSocketStatusProps {
  showDebug?: boolean;
}

export function WebSocketStatus({ showDebug = false }: WebSocketStatusProps) {
  const { user } = useAuth();
  const { 
    connected, 
    connecting, 
    authenticated, 
    messages, 
    connect, 
    disconnect, 
    reconnect,
    connectionId,
    connectionStartTime,
    clearMessages
  } = useWebSocket();

  const [expanded, setExpanded] = useState(false);
  
  // Calculate connection duration if connected
  const connectionDuration = connectionStartTime 
    ? Math.floor((Date.now() - connectionStartTime) / 1000)
    : 0;
  
  // Get the most recent messages (limited to 5)
  const recentMessages = messages.slice(-5).reverse();

  return (
    <div className="flex flex-col">
      {/* Simple status indicator when collapsed */}
      {!expanded && (
        <div 
          className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted rounded"
          onClick={() => setExpanded(true)}
        >
          {connected ? (
            <WifiIcon className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOffIcon className="h-4 w-4 text-red-500" />
          )}
          <span className="text-xs font-medium">
            {connecting ? 'Connecting...' : connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      )}

      {/* Expanded status card */}
      {expanded && (
        <Card className="w-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">WebSocket Status</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setExpanded(false)}
              >
                Collapse
              </Button>
            </div>
            <CardDescription>Real-time connection information</CardDescription>
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Status</span>
                <div className="flex items-center gap-1.5">
                  {connected ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Connected
                    </Badge>
                  ) : connecting ? (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Connecting
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Disconnected
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Authentication</span>
                <div className="flex items-center gap-1.5">
                  {authenticated ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Authenticated
                    </Badge>
                  ) : connected ? (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Not Authenticated
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                      N/A
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {connected && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Connection ID:</span>
                  <span className="font-mono ml-1">{connectionId || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-1">{connectionDuration}s</span>
                </div>
                <div>
                  <span className="text-muted-foreground">User:</span>
                  <span className="ml-1">{user?.email || 'Not logged in'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Messages:</span>
                  <span className="ml-1">{messages.length}</span>
                </div>
              </div>
            )}
            
            {/* Debug section with recent messages */}
            {showDebug && connected && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium">Recent Messages</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearMessages}
                    className="h-6 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                <div className="bg-slate-50 rounded border border-slate-200 p-2 max-h-32 overflow-y-auto">
                  {recentMessages.length === 0 ? (
                    <div className="text-xs text-center text-muted-foreground py-2">
                      No messages yet
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {recentMessages.map((msg, idx) => (
                        <li key={idx} className="text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                          {msg.type}: {JSON.stringify(msg).slice(0, 50)}
                          {JSON.stringify(msg).length > 50 ? '...' : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="pt-0">
            <div className="flex gap-2 w-full">
              {!connected && !connecting && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={connect}
                  className="flex-1"
                  disabled={connecting}
                >
                  Connect
                </Button>
              )}
              
              {connected && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={disconnect}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              )}
              
              {(connected || (!connected && !connecting)) && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={reconnect}
                  className="flex-1"
                  disabled={connecting}
                >
                  Reconnect
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}