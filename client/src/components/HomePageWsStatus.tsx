/**
 * Home Page WebSocket Status Component
 * 
 * A subtle indicator that shows WebSocket connection status in the corner of the Home page
 */

import { useState, useEffect } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketProvider';
import { motion } from 'framer-motion';

interface HomePageWsStatusProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function HomePageWsStatus({ position = 'bottom-right' }: HomePageWsStatusProps) {
  const webSocket = useWebSocketContext();
  const [showDetails, setShowDetails] = useState(false);
  
  // Generate position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };
  
  // Status color mapping
  const statusColor = () => {
    switch (webSocket.status) {
      case 'connected': return 'bg-yellow-500';
      case 'authenticated': return 'bg-green-500';
      case 'connecting': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Status label
  const statusLabel = () => {
    switch (webSocket.status) {
      case 'connected': return 'Connected';
      case 'authenticated': return 'Authenticated';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };
  
  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-10`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="glass-card p-2 cursor-pointer flex items-center gap-2"
        onClick={() => setShowDetails(!showDetails)}
      >
        <motion.div 
          className={`h-3 w-3 rounded-full ${statusColor()}`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ 
            repeat: webSocket.status === 'connecting' ? Infinity : 0, 
            duration: 1.5 
          }}
        />
        
        {showDetails && (
          <span className="text-xs text-gray-300">
            {statusLabel()} {webSocket.subscriptions.size > 0 && `(${webSocket.subscriptions.size} channels)`}
          </span>
        )}
      </div>
    </motion.div>
  );
}