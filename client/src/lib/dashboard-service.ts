import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  DashboardConfig, 
  Widget, 
  StatItem, 
  ChartData, 
  ActivityItem, 
  QuickActionItem 
} from '../../shared/dashboard-schema';

// Query Options for dashboard config
export const dashboardQueryOptions = {
  dashboardConfig: {
    queryKey: ['/api/dashboard'],
    queryFn: async (): Promise<DashboardConfig> => {
      const res = await apiRequest('GET', '/api/dashboard');
      return await res.json();
    }
  },
  defaultConfig: {
    queryKey: ['/api/dashboard/default'],
    queryFn: async (): Promise<DashboardConfig> => {
      const res = await apiRequest('GET', '/api/dashboard/default');
      return await res.json();
    }
  },
  statsData: {
    queryKey: ['/api/dashboard/data/stats'],
    queryFn: async (): Promise<{ items: StatItem[], timestamp: string }> => {
      const res = await apiRequest('GET', '/api/dashboard/data/stats');
      return await res.json();
    }
  },
  chartData: (source: string) => ({
    queryKey: [`/api/dashboard/data/${source}`],
    queryFn: async (): Promise<ChartData> => {
      const res = await apiRequest('GET', `/api/dashboard/data/${source}`);
      return await res.json();
    }
  }),
  activityData: {
    queryKey: ['/api/dashboard/data/activities'],
    queryFn: async (): Promise<ActivityItem[]> => {
      const res = await apiRequest('GET', '/api/dashboard/data/activities');
      return await res.json();
    }
  },
  quickActionsData: {
    queryKey: ['/api/dashboard/data/quickActions'],
    queryFn: async (): Promise<QuickActionItem[]> => {
      const res = await apiRequest('GET', '/api/dashboard/data/quickActions');
      return await res.json();
    }
  }
};

// Save dashboard configuration
export async function saveDashboardConfig(config: DashboardConfig): Promise<void> {
  await apiRequest('POST', '/api/dashboard', config);
  // Invalidate the dashboard config query to refetch the latest data
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
}

// Reset dashboard to default
export async function resetDashboard(): Promise<DashboardConfig> {
  const res = await apiRequest('POST', '/api/dashboard/reset');
  // Invalidate the dashboard config query to refetch the latest data
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  return await res.json();
}

// Add a new widget
export async function addWidget(type: string): Promise<Widget> {
  const res = await apiRequest('POST', '/api/dashboard/widgets/add', { type });
  // Invalidate the dashboard config query to refetch the latest data
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  return await res.json();
}

// Update a widget
export async function updateWidget(
  widgetId: string, 
  updates: Partial<Widget>
): Promise<Widget> {
  const res = await apiRequest('PATCH', `/api/dashboard/widgets/${widgetId}`, updates);
  // Invalidate the dashboard config query to refetch the latest data
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  return await res.json();
}

// Remove a widget
export async function removeWidget(widgetId: string): Promise<void> {
  await apiRequest('DELETE', `/api/dashboard/widgets/${widgetId}`);
  // Invalidate the dashboard config query to refetch the latest data
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
}

// Reorder widgets
export async function reorderWidgets(widgetIds: string[]): Promise<DashboardConfig> {
  const res = await apiRequest('POST', '/api/dashboard/reorder', { widgetIds });
  // Invalidate the dashboard config query to refetch the latest data
  queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
  return await res.json();
}