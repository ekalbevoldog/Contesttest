import { WebSocketTester } from '@/components/WebSocketTester';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function WebSocketTest() {
  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">WebSocket Testing Page</h1>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          This page demonstrates real-time WebSocket communication functionality.
          Messages sent will be echoed back from the server.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">WebSocket Tester</h2>
          <WebSocketTester />
        </div>
        
        <div className="border rounded-lg p-6 bg-muted/10">
          <h2 className="text-xl font-semibold mb-4">Connection Details</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium">WebSocket URL</h3>
              <code className="block bg-muted p-2 rounded mt-1 text-sm">
                {window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//{window.location.host}/ws
              </code>
            </div>
            
            <div>
              <h3 className="text-base font-medium">Message Format</h3>
              <code className="block bg-muted p-2 rounded mt-1 text-sm">
                {JSON.stringify({ text: "Your message", timestamp: new Date().toISOString() }, null, 2)}
              </code>
            </div>
            
            <div>
              <h3 className="text-base font-medium">API Health Endpoints</h3>
              <div className="mt-1 space-y-2">
                <a 
                  href="/api/health" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block bg-muted p-2 rounded text-sm hover:bg-muted/80 transition-colors"
                >
                  Basic Health Check: /api/health
                </a>
                <a 
                  href="/api/health/extended" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block bg-muted p-2 rounded text-sm hover:bg-muted/80 transition-colors"
                >
                  Extended Health Check: /api/health/extended
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}