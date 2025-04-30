import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  DashboardConfig, 
  Widget, 
  StatItem,
  ActivityItem,
  ChartData,
  QuickActionItem
} from '../../shared/dashboard-schema';

// Health check function to test API connectivity
export async function checkDashboardHealth(): Promise<boolean> {
  try {
    console.log('[Dashboard] Checking dashboard API health...');
    const response = await fetch('/api/dashboard/health');
    
    console.log('[Dashboard] Health check status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('[Dashboard] Health check response:', data);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Dashboard] Health check failed:', error);
    return false;
  }
}

// Store auth info in localStorage
export function storeAuthInfo(userId: string, token: string, role: string = 'athlete'): void {
  console.log(`[Dashboard] Storing auth info for user ${userId} with role ${role}`);
  localStorage.setItem('userId', userId);
  localStorage.setItem('userRole', role);
  localStorage.setItem('authToken', token);
  // Set timestamp for token
  localStorage.setItem('authTimestamp', Date.now().toString());
}

// Clear auth info
export function clearAuthInfo(): void {
  console.log('[Dashboard] Clearing auth info');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
  localStorage.removeItem('authToken');
  localStorage.removeItem('authTimestamp');
}

// API functions for dashboard data
export async function fetchDashboardConfig(): Promise<DashboardConfig> {
  try {
    console.log('[Dashboard] Fetching dashboard configuration...');
    // First check if we have a user ID in localStorage
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole') || 'athlete';
    const authToken = localStorage.getItem('authToken');
    
    console.log(`[Dashboard] Auth state check: userId=${!!userId}, authToken=${!!authToken}, userRole=${userRole}`);
    
    if (!userId) {
      console.warn('[Dashboard] No user ID found in localStorage, cannot fetch dashboard config');
      // Create default config for unauthenticated users to avoid breaking UI
      return {
        userId: 'guest-user',
        lastUpdated: new Date().toISOString(),
        widgets: []
      };
    }
    
    console.log(`[Dashboard] Fetching config for user ${userId} with role ${userRole}`);
    
    // Start by checking if API is accessible
    const isHealthy = await checkDashboardHealth();
    if (!isHealthy) {
      console.warn('[Dashboard] Dashboard API is not responding, using fallback config');
      return {
        userId: userId,
        lastUpdated: new Date().toISOString(),
        widgets: []
      };
    }
    
    try {
      console.log('[Dashboard] Making authenticated request to dashboard API...');
      const response = await apiRequest('GET', '/api/dashboard/config');
      
      console.log('[Dashboard] API response status:', response.status);
      
      const data = await response.json();
      console.log('[Dashboard] Dashboard config received:', data);
      
      // Cache the data in localStorage
      DashboardLocalStorageCache.saveConfig(data);
      
      return data;
    } catch (apiError) {
      console.error('[Dashboard] API error:', apiError);
      
      // Try getting from cache if API fails
      const cachedConfig = DashboardLocalStorageCache.loadConfig();
      if (cachedConfig && cachedConfig.userId === userId) {
        console.log('[Dashboard] Using cached dashboard config');
        return cachedConfig;
      }
      
      // If no cache or cache is for different user, return a minimal configuration
      console.log('[Dashboard] Creating fallback dashboard config');
      return {
        userId: userId,
        lastUpdated: new Date().toISOString(),
        widgets: []
      };
    }
  } catch (error) {
    console.error('[Dashboard] Error in fetchDashboardConfig:', error);
    // Return empty dashboard rather than breaking completely
    return {
      userId: 'error-state',
      lastUpdated: new Date().toISOString(),
      widgets: []
    };
  }
}

export async function saveDashboardConfig(config: DashboardConfig): Promise<void> {
  await apiRequest('POST', '/api/dashboard/config', config);
  // Invalidate the dashboard config in the cache
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard/config'] });
}

export async function addWidget(widget: Omit<Widget, 'id'>): Promise<Widget> {
  const response = await apiRequest('POST', '/api/dashboard/widgets', widget);
  // Invalidate the dashboard config in the cache
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard/config'] });
  return response.json();
}

export async function updateWidget(widgetId: string, data: Partial<Widget>): Promise<Widget> {
  const response = await apiRequest('PATCH', `/api/dashboard/widgets/${widgetId}`, data);
  // Invalidate the dashboard config in the cache
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard/config'] });
  return response.json();
}

export async function removeWidget(widgetId: string): Promise<void> {
  await apiRequest('DELETE', `/api/dashboard/widgets/${widgetId}`);
  // Invalidate the dashboard config in the cache
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard/config'] });
}

export async function reorderWidgets(widgetIds: string[]): Promise<void> {
  await apiRequest('POST', '/api/dashboard/widgets/reorder', { widgetIds });
  // Invalidate the dashboard config in the cache
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard/config'] });
}

// Data fetching functions for specific widget types
export async function fetchStatsData(): Promise<{ items: StatItem[] }> {
  const response = await apiRequest('GET', '/api/dashboard/stats');
  return response.json();
}

export async function fetchChartData(source: string = 'default'): Promise<ChartData> {
  const response = await apiRequest('GET', `/api/dashboard/charts/${source}`);
  return response.json();
}

export async function fetchActivityData(): Promise<ActivityItem[]> {
  const response = await apiRequest('GET', '/api/dashboard/activity');
  return response.json();
}

export async function fetchQuickActionsData(): Promise<QuickActionItem[]> {
  const response = await apiRequest('GET', '/api/dashboard/quick-actions');
  return response.json();
}

// WebSocket integration for real-time dashboard updates
export class DashboardWebSocketManager {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2 seconds
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;
  private userId: string | null = null;
  private userRole: string | null = null;
  
  constructor() {
    // Try to initialize with stored user details
    this.userId = localStorage.getItem('userId');
    this.userRole = localStorage.getItem('userRole') || 'athlete';
    
    // Set up auto-reconnect on visibility change (when user returns to tab)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !this.isConnected()) {
          this.connect();
        }
      });
    }
  }
  
  public setUser(userId: string, userRole: string) {
    this.userId = userId;
    this.userRole = userRole;
    localStorage.setItem('userId', userId);
    localStorage.setItem('userRole', userRole);
    
    // Reconnect with new user details if we're already connected
    if (this.isConnected()) {
      this.disconnect();
      this.connect();
    }
  }
  
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  public connect(): void {
    // Don't try to connect if we're already connecting or connected
    if (this.isConnecting || this.isConnected()) return;
    this.isConnecting = true;
    
    console.log('[Dashboard WebSocket] Connecting to WebSocket server...');
    
    try {
      // Determine the WebSocket URL based on the current environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('[Dashboard WebSocket] Connection established');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 2000;
        
        // Identify this connection with user info
        if (this.userId) {
          this.socket?.send(JSON.stringify({
            type: 'identify',
            userId: this.userId,
            userRole: this.userRole || 'athlete',
            channel: 'dashboard'
          }));
          
          // Request initial dashboard data
          this.socket?.send(JSON.stringify({
            type: 'get_dashboard',
            userId: this.userId
          }));
        }
        
        // Notify listeners
        this.notifyListeners('connection', { status: 'connected' });
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[Dashboard WebSocket] Received message:', data);
          
          // Route message to appropriate listeners based on type
          if (data.type) {
            this.notifyListeners(data.type, data);
          }
          
          // Also notify general message listeners
          this.notifyListeners('message', data);
        } catch (err) {
          console.error('[Dashboard WebSocket] Error parsing message:', err);
        }
      };
      
      this.socket.onclose = (event) => {
        console.log(`[Dashboard WebSocket] Connection closed: ${event.code} ${event.reason}`);
        this.isConnecting = false;
        this.socket = null;
        
        // Notify listeners
        this.notifyListeners('connection', { status: 'disconnected', code: event.code });
        
        // Try to reconnect unless this was a normal closure
        if (event.code !== 1000 && event.code !== 1001) {
          this.scheduleReconnect();
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('[Dashboard WebSocket] Connection error:', error);
        this.isConnecting = false;
        
        // Socket will auto-close after error, but we'll handle reconnection in onclose
      };
    } catch (err) {
      console.error('[Dashboard WebSocket] Error creating connection:', err);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }
  
  public disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Normal closure');
      this.socket = null;
    }
  }
  
  public on(event: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)?.add(callback);
    
    // Return function to remove this listener
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }
  
  public send(type: string, data: any): void {
    if (!this.isConnected()) {
      console.warn('[Dashboard WebSocket] Tried to send message while disconnected');
      this.connect(); // Try to reconnect
      return;
    }
    
    try {
      this.socket?.send(JSON.stringify({
        ...data,
        type,
        userId: this.userId,
        timestamp: new Date().toISOString()
      }));
    } catch (err) {
      console.error('[Dashboard WebSocket] Error sending message:', err);
    }
  }
  
  public async sendAndReceive(type: string, data: any, timeout = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      // Generate a unique request ID
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Set a timeout
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Request timed out after ${timeout}ms`));
      }, timeout);
      
      // Set up a one-time listener for the response
      const unsubscribe = this.on('message', (message) => {
        if (message.requestId === requestId) {
          cleanup();
          resolve(message);
        }
      });
      
      // Function to clean up listeners and timeout
      const cleanup = () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
      
      // Send the message with the request ID
      this.send(type, {
        ...data,
        requestId
      });
    });
  }
  
  private notifyListeners(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[Dashboard WebSocket] Error in listener for '${event}':`, err);
      }
    });
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[Dashboard WebSocket] Max reconnect attempts reached, giving up');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(30000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1));
    
    console.log(`[Dashboard WebSocket] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isConnected() && !this.isConnecting) {
        this.connect();
      }
    }, delay);
  }
}

// Create a singleton instance
export const dashboardWs = new DashboardWebSocketManager();

// Local storage dashboard cache
export class DashboardLocalStorageCache {
  private static DASHBOARD_CACHE_KEY = 'dashboard_config_cache';
  private static CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
  
  public static saveConfig(config: DashboardConfig): void {
    try {
      const cacheData = {
        config,
        timestamp: Date.now()
      };
      localStorage.setItem(this.DASHBOARD_CACHE_KEY, JSON.stringify(cacheData));
      console.log('[Dashboard Cache] Config saved to local storage');
    } catch (err) {
      console.error('[Dashboard Cache] Error saving config to local storage:', err);
    }
  }
  
  public static loadConfig(): DashboardConfig | null {
    try {
      const cacheData = localStorage.getItem(this.DASHBOARD_CACHE_KEY);
      if (!cacheData) return null;
      
      const { config, timestamp } = JSON.parse(cacheData);
      
      // Check if cache is expired
      if (Date.now() - timestamp > this.CACHE_EXPIRY_TIME) {
        console.log('[Dashboard Cache] Cache expired, returning null');
        return null;
      }
      
      console.log('[Dashboard Cache] Loaded config from local storage');
      return config;
    } catch (err) {
      console.error('[Dashboard Cache] Error loading config from local storage:', err);
      return null;
    }
  }
  
  public static clearCache(): void {
    localStorage.removeItem(this.DASHBOARD_CACHE_KEY);
  }
}

// TanStack Query options for dashboard data
export const dashboardQueryOptions = {
  config: {
    queryKey: ['/api/dashboard/config'],
    queryFn: fetchDashboardConfig,
  },
  statsData: {
    queryKey: ['/api/dashboard/stats'],
    queryFn: fetchStatsData,
  },
  chartData: (source: string = 'default') => ({
    queryKey: ['/api/dashboard/charts', source],
    queryFn: () => fetchChartData(source),
  }),
  activityData: {
    queryKey: ['/api/dashboard/activity'],
    queryFn: fetchActivityData,
  },
  quickActionsData: {
    queryKey: ['/api/dashboard/quick-actions'],
    queryFn: fetchQuickActionsData,
  },
};