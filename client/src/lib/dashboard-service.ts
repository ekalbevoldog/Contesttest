import { DashboardConfig, Widget, StatItem, ChartData, ActivityItem, QuickActionItem } from "@shared/dashboard-schema";
import { apiRequest, queryClient } from "./queryClient";

// Base URL for dashboard API
const API_BASE_URL = '/api/dashboard';

// Check dashboard health
export async function checkDashboardHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Dashboard health check failed:', error);
    return false;
  }
}

// Auth info storage for cached dashboard data
export function storeAuthInfo(userId: string, token: string, role: string = 'athlete'): void {
  localStorage.setItem('dashboard_user_id', userId);
  localStorage.setItem('dashboard_user_role', role);
  localStorage.setItem('dashboard_auth_token', token);
}

// Clear auth info
export function clearAuthInfo(): void {
  localStorage.removeItem('dashboard_user_id');
  localStorage.removeItem('dashboard_user_role');
  localStorage.removeItem('dashboard_auth_token');
  
  // Also clear dashboard cache
  DashboardLocalStorageCache.clearCache();
}

// Fetch dashboard config
export async function fetchDashboardConfig(): Promise<DashboardConfig> {
  try {
    const response = await apiRequest('GET', `${API_BASE_URL}/config`);
    const data = await response.json();
    
    // Cache the config
    DashboardLocalStorageCache.saveConfig(data);
    
    return data;
  } catch (error) {
    console.error('Error fetching dashboard config:', error);
    
    // Try to load from cache
    const cachedConfig = DashboardLocalStorageCache.loadConfig();
    if (cachedConfig) {
      console.log('Using cached dashboard config');
      return cachedConfig;
    }
    
    throw error;
  }
}

// Save dashboard config
export async function saveDashboardConfig(config: DashboardConfig): Promise<void> {
  try {
    await apiRequest('POST', `${API_BASE_URL}/config`, config);
    
    // Invalidate cache
    queryClient.invalidateQueries({ queryKey: [`${API_BASE_URL}/config`] });
    
    // Update cache
    DashboardLocalStorageCache.saveConfig(config);
  } catch (error) {
    console.error('Error saving dashboard config:', error);
    throw error;
  }
}

// Add a new widget
export async function addWidget(widget: Omit<Widget, 'id'>): Promise<Widget> {
  try {
    const response = await apiRequest('POST', `${API_BASE_URL}/widgets`, widget);
    const newWidget = await response.json();
    
    // Invalidate cache
    queryClient.invalidateQueries({ queryKey: [`${API_BASE_URL}/config`] });
    
    return newWidget;
  } catch (error) {
    console.error('Error adding widget:', error);
    throw error;
  }
}

// Update a widget
export async function updateWidget(widgetId: string, data: Partial<Widget>): Promise<Widget> {
  try {
    const response = await apiRequest('PATCH', `${API_BASE_URL}/widgets/${widgetId}`, data);
    const updatedWidget = await response.json();
    
    // Invalidate cache
    queryClient.invalidateQueries({ queryKey: [`${API_BASE_URL}/config`] });
    
    return updatedWidget;
  } catch (error) {
    console.error('Error updating widget:', error);
    throw error;
  }
}

// Remove a widget
export async function removeWidget(widgetId: string): Promise<void> {
  try {
    await apiRequest('DELETE', `${API_BASE_URL}/widgets/${widgetId}`);
    
    // Invalidate cache
    queryClient.invalidateQueries({ queryKey: [`${API_BASE_URL}/config`] });
  } catch (error) {
    console.error('Error removing widget:', error);
    throw error;
  }
}

// Reorder widgets
export async function reorderWidgets(widgetIds: string[]): Promise<void> {
  try {
    await apiRequest('POST', `${API_BASE_URL}/widgets/reorder`, { widgetIds });
    
    // Invalidate cache
    queryClient.invalidateQueries({ queryKey: [`${API_BASE_URL}/config`] });
  } catch (error) {
    console.error('Error reordering widgets:', error);
    throw error;
  }
}

// Fetch stats data
export async function fetchStatsData(): Promise<{ items: StatItem[] }> {
  try {
    const response = await apiRequest('GET', `${API_BASE_URL}/stats`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching stats data:', error);
    throw error;
  }
}

// Fetch chart data
export async function fetchChartData(source: string = 'default'): Promise<ChartData> {
  try {
    const response = await apiRequest('GET', `${API_BASE_URL}/charts/${source}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching chart data:', error);
    throw error;
  }
}

// Fetch activity data
export async function fetchActivityData(): Promise<ActivityItem[]> {
  try {
    const response = await apiRequest('GET', `${API_BASE_URL}/activity`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching activity data:', error);
    throw error;
  }
}

// Fetch quick actions data
export async function fetchQuickActionsData(): Promise<QuickActionItem[]> {
  try {
    const response = await apiRequest('GET', `${API_BASE_URL}/quick-actions`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching quick actions data:', error);
    throw error;
  }
}

// Dashboard manager for polling updates and communication
export class DashboardManager {
  private pollingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2 seconds
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;
  private isConnected = false;
  private userId: string | null = null;
  private userRole: string | null = null;
  
  constructor() {
    // Look for auth info in local storage
    const userId = localStorage.getItem('dashboard_user_id');
    const userRole = localStorage.getItem('dashboard_user_role');
    
    if (userId && userRole) {
      this.userId = userId;
      this.userRole = userRole;
    }
    
    // Try to reconnect when window gets focus
    window.addEventListener('focus', () => {
      if (!this.isConnected && !this.isConnecting) {
        this.connect();
      }
    });
  }
  
  public setUser(userId: string, userRole: string) {
    this.userId = userId;
    this.userRole = userRole;
    
    // Store in local storage
    localStorage.setItem('dashboard_user_id', userId);
    localStorage.setItem('dashboard_user_role', userRole);
    
    // If not already connected, connect now
    if (!this.isConnected && !this.isConnecting) {
      this.connect();
    }
  }
  
  public connect(): void {
    if (this.isConnecting || this.isConnected) {
      return;
    }
    
    this.isConnecting = true;
    console.log('Connecting to dashboard service...');
    
    // Verify health before connecting
    checkDashboardHealth()
      .then(isHealthy => {
        if (isHealthy) {
          console.log('Dashboard service is healthy, starting polling');
          this.isConnected = true;
          this.startPolling();
          this.notifyListeners('connect', { connected: true });
        } else {
          console.error('Dashboard service is unhealthy, will retry');
          this.scheduleReconnect();
        }
      })
      .catch(error => {
        console.error('Error checking dashboard health:', error);
        this.scheduleReconnect();
      })
      .finally(() => {
        this.isConnecting = false;
      });
  }
  
  /**
   * Set up polling for dashboard updates
   */
  private startPolling(): void {
    // Clear any existing interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    // Start polling every 30 seconds
    this.pollingInterval = setInterval(() => {
      this.fetchDashboardData();
    }, 30000); // 30 seconds
    
    // Fetch immediately
    this.fetchDashboardData();
  }
  
  /**
   * Fetch dashboard data from the API
   */
  private async fetchDashboardData(): Promise<void> {
    try {
      // Fetch dashboard config
      const config = await fetchDashboardConfig();
      this.notifyListeners('config', config);
      
      // Reset reconnect attempts on successful fetch
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      if (error instanceof Response && error.status === 401) {
        // Authentication error
        this.isConnected = false;
        this.notifyListeners('auth_error', { error: 'Authentication failed' });
      } else {
        // Other error, try to reconnect
        this.scheduleReconnect();
      }
    }
  }
  
  public disconnect(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.isConnected = false;
    this.notifyListeners('disconnect', { connected: false });
  }
  
  public on(event: string, callback: (data: any) => void): () => void {
    // Get or create listener set for this event
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    const listeners = this.eventListeners.get(event)!;
    listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listenerSet = this.eventListeners.get(event);
      if (listenerSet) {
        listenerSet.delete(callback);
      }
    };
  }
  
  public send(type: string, data: any): void {
    // In a WebSocket implementation, this would send a message
    // For HTTP polling, we'll use this to trigger specific calls
    switch (type) {
      case 'add_widget':
        addWidget(data).then(widget => {
          this.notifyListeners('widget_added', widget);
        });
        break;
        
      case 'update_widget':
        if (data.id) {
          updateWidget(data.id, data).then(widget => {
            this.notifyListeners('widget_updated', widget);
          });
        }
        break;
        
      case 'remove_widget':
        if (data.id) {
          removeWidget(data.id).then(() => {
            this.notifyListeners('widget_removed', { id: data.id });
          });
        }
        break;
        
      case 'reorder_widgets':
        if (Array.isArray(data.widgetIds)) {
          reorderWidgets(data.widgetIds).then(() => {
            this.notifyListeners('widgets_reordered', { widgetIds: data.widgetIds });
          });
        }
        break;
        
      default:
        console.warn('Unknown message type:', type);
    }
  }
  
  private notifyListeners(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnect attempts reached');
      this.notifyListeners('error', { message: 'Failed to connect to dashboard service after multiple attempts' });
      return;
    }
    
    // Exponential backoff
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
}

// Create a singleton instance
export const dashboardManager = new DashboardManager();

// Export dashboardWs for backward compatibility
export const dashboardWs = dashboardManager;

// Cache implementation for dashboard data
export class DashboardLocalStorageCache {
  private static DASHBOARD_CACHE_KEY = 'dashboard_config_cache';
  private static CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
  
  public static saveConfig(config: DashboardConfig): void {
    try {
      const cacheData = {
        config,
        timestamp: Date.now()
      };
      
      localStorage.setItem(
        this.DASHBOARD_CACHE_KEY,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Error saving dashboard config to cache:', error);
    }
  }
  
  public static loadConfig(): DashboardConfig | null {
    try {
      const cacheJson = localStorage.getItem(this.DASHBOARD_CACHE_KEY);
      if (!cacheJson) {
        return null;
      }
      
      const cacheData = JSON.parse(cacheJson);
      const cacheAge = Date.now() - cacheData.timestamp;
      
      // Check if cache is expired
      if (cacheAge > this.CACHE_EXPIRY_TIME) {
        this.clearCache();
        return null;
      }
      
      return cacheData.config;
    } catch (error) {
      console.error('Error loading dashboard config from cache:', error);
      return null;
    }
  }
  
  public static clearCache(): void {
    localStorage.removeItem(this.DASHBOARD_CACHE_KEY);
  }
}

// Query options for React Query
export const dashboardQueryOptions = {
  config: {
    queryKey: [`${API_BASE_URL}/config`],
    queryFn: fetchDashboardConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  },
  stats: {
    queryKey: [`${API_BASE_URL}/stats`],
    queryFn: fetchStatsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  },
  activity: {
    queryKey: [`${API_BASE_URL}/activity`],
    queryFn: fetchActivityData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  },
  quickActions: {
    queryKey: [`${API_BASE_URL}/quick-actions`],
    queryFn: fetchQuickActionsData,
    staleTime: 15 * 60 * 1000, // 15 minutes
  }
};