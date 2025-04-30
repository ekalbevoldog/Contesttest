import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  DashboardConfig, 
  Widget, 
  StatItem,
  ActivityItem,
  ChartData,
  QuickActionItem
} from '../../shared/dashboard-schema';

// API functions for dashboard data
export async function fetchDashboardConfig(): Promise<DashboardConfig> {
  try {
    console.log('[Dashboard] Fetching dashboard configuration...');
    // First check if we have a user ID in localStorage
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole') || 'athlete';
    
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
    
    try {
      const response = await apiRequest('GET', '/api/dashboard/config');
      
      console.log('[Dashboard] API response status:', response.status);
      
      const data = await response.json();
      console.log('[Dashboard] Dashboard config received:', data);
      return data;
    } catch (apiError) {
      console.error('[Dashboard] API error:', apiError);
      
      // If we can't fetch from API, return a minimal configuration
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