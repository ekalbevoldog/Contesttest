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
    console.log('Fetching dashboard configuration...');
    const response = await apiRequest('GET', '/api/dashboard/config');
    
    if (!response.ok) {
      console.error('Failed to fetch dashboard config:', response.status, response.statusText);
      throw new Error(`Failed to fetch dashboard configuration: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Dashboard config received:', data);
    return data;
  } catch (error) {
    console.error('Error in fetchDashboardConfig:', error);
    throw error;
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