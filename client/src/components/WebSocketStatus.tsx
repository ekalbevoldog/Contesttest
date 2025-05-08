/**
 * WebSocket Status Component
 *
 * Displays the current WebSocket connection status in the UI.
 * Can be shown as a small indicator or expanded with details.
 */

import React, { useState } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, Lock, Unlock, RefreshCw } from 'lucide-react';

interface WebSocketStatusProps {
  showDebug?: boolean;
  expanded?: boolean;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  showDebug = false,
  expanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const ws = useWebSocketContext();

  // Color mappings based on connection status
  const getStatusColor = () => {
    switch (ws.status) {
      case 'connected':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'authenticated':
        return 'bg-green-500 hover:bg-green-600';
      case 'connecting':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Icon based on connection status
  const StatusIcon = () => {
    if (ws.status === 'connecting') {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    } else if (ws.status === 'closed' || ws.status === 'error') {
      return <WifiOff className="h-4 w-4" />;
    } else if (ws.status === 'connected' || ws.status === 'authenticated') {
      return <Wifi className="h-4 w-4" />;
    }
    return <WifiOff className="h-4 w-4" />;
  };

  // Minimized indicator
  if (!isExpanded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              className={`${getStatusColor()} cursor-pointer transition-all`}
              onClick={() => setIsExpanded(true)}
            >
              <div className="flex items-center space-x-1">
                <StatusIcon />
                {showDebug && (
                  <span className="text-xs ml-1">
                    {ws.status.charAt(0).toUpperCase() + ws.status.slice(1)}
                  </span>
                )}
                {ws.isAuthenticated && <Lock className="h-3 w-3 ml-1" />}
              </div>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>WebSocket Status: {ws.status}</p>
            <p>Authenticated: {ws.isAuthenticated ? 'Yes' : 'No'}</p>
            <p>Click to expand</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded card with details
  return (
    <Card className="w-64 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">WebSocket Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(false)}
          >
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs">Status:</span>
            <Badge className={getStatusColor()}>
              <div className="flex items-center">
                <StatusIcon />
                <span className="ml-1">{ws.status.toUpperCase()}</span>
              </div>
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs">Authenticated:</span>
            <div className="flex items-center">
              {ws.isAuthenticated ? (
                <Lock className="h-3 w-3 text-green-500" />
              ) : (
                <Unlock className="h-3 w-3 text-gray-500" />
              )}
              <span className="text-xs ml-1">{ws.isAuthenticated ? 'YES' : 'NO'}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs">Channels:</span>
            <span className="text-xs">{ws.subscriptions.size}</span>
          </div>
          
          <div className="flex space-x-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2 py-0 flex-1"
              onClick={ws.connect}
              disabled={ws.isConnected}
            >
              Connect
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2 py-0 flex-1"
              onClick={ws.disconnect}
              disabled={!ws.isConnected}
            >
              Disconnect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebSocketStatus;