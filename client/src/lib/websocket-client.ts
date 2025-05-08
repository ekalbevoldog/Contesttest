/**
 * WebSocket Client
 * 
 * A reliable WebSocket client implementation that handles reconnection,
 * message queuing, and graceful degradation with fallbacks.
 */

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;

interface WebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  path?: string;
  debug?: boolean;
}

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private readonly url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private messageQueue: string[] = [];
  private messageHandlers: MessageHandler[] = [];
  private connectHandlers: ConnectionHandler[] = [];
  private disconnectHandlers: ConnectionHandler[] = [];
  private isConnected = false;
  private reconnectTimer: number | null = null;
  private debug: boolean;

  /**
   * Creates a new WebSocket client
   * @param options Configuration options
   */
  constructor(options: WebSocketOptions = {}) {
    // Default options
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.debug = options.debug || false;
    
    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsPath = options.path || '/ws';
    this.url = `${protocol}//${window.location.host}${wsPath}`;
    
    // Auto-connect
    this.connect();
    
    // Handle page visibility for reconnection
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.isConnected) {
        this.connect();
      }
    });
    
    // Handle window events
    window.addEventListener('online', () => {
      this.log('Network connection restored, reconnecting WebSocket...');
      this.connect();
    });
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    // Don't reconnect if already connected
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      return;
    }
    
    this.log(`Connecting to WebSocket at ${this.url}`);
    
    try {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      this.log('Error creating WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.isConnected = false;
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Send a message to the WebSocket server
   * @param data Message data (will be JSON-serialized)
   * @returns True if sent immediately, false if queued
   */
  public send(data: any): boolean {
    const message = JSON.stringify(data);
    
    if (this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(message);
        return true;
      } catch (error) {
        this.log('Error sending message:', error);
        this.messageQueue.push(message);
        return false;
      }
    } else {
      this.messageQueue.push(message);
      return false;
    }
  }

  /**
   * Add a message handler
   * @param handler Function to call when a message is received
   */
  public onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Add a connection handler
   * @param handler Function to call when connected
   */
  public onConnect(handler: ConnectionHandler): void {
    this.connectHandlers.push(handler);
    // If already connected, call handler immediately
    if (this.isConnected) {
      handler();
    }
  }

  /**
   * Add a disconnection handler
   * @param handler Function to call when disconnected
   */
  public onDisconnect(handler: ConnectionHandler): void {
    this.disconnectHandlers.push(handler);
  }

  /**
   * Check if the connection is active
   */
  public isActive(): boolean {
    return this.isConnected;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    this.log('WebSocket connection established');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Process queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(message);
      }
    }
    
    // Notify handlers
    this.connectHandlers.forEach(handler => handler());
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.messageHandlers.forEach(handler => handler(data));
    } catch (error) {
      this.log('Error parsing message:', error);
      // Pass the raw message if it can't be parsed as JSON
      this.messageHandlers.forEach(handler => handler(event.data));
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.isConnected = false;
    
    // Notify handlers
    this.disconnectHandlers.forEach(handler => handler());
    
    this.scheduleReconnect();
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    this.log('WebSocket error:', event);
    // No need to set isConnected = false here as close will be called
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // Exponential backoff with jitter
      const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1) * (0.9 + Math.random() * 0.2);
      
      this.log(`Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(delay)}ms`);
      
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, delay);
    } else {
      this.log('Maximum reconnection attempts reached');
    }
  }

  /**
   * Log a message if debug is enabled
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('%c[WebSocket]', 'color: #3498db', ...args);
    }
  }
}

// Create a singleton instance
export const websocket = new WebSocketClient({ debug: true });

export default websocket;