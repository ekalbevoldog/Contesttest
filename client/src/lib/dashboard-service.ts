import { apiRequest, queryClient } from './queryClient';
import { 
  DashboardConfig, 
  StatsData, 
  ChartData, 
  ActivityData, 
  QuickActionsData 
} from '../../shared/dashboard-schema';

// Dashboard API endpoints
const DASHBOARD_API = {
  CONFIG: '/api/dashboard',
  WIDGET: '/api/dashboard/widgets',
  STATS: '/api/dashboard/data/stats',
  CHART: '/api/dashboard/data',
  ACTIVITIES: '/api/dashboard/data/activities',
  QUICK_ACTIONS: '/api/dashboard/data/quickActions'
};

// Dashboard query keys
export const dashboardQueryKeys = {
  config: ['dashboard', 'config'],
  statsData: ['dashboard', 'data', 'stats'],
  chartData: (source: string) => ['dashboard', 'data', 'chart', source],
  activityData: ['dashboard', 'data', 'activities'],
  quickActionsData: ['dashboard', 'data', 'quickActions']
};

// Dashboard query options
export const dashboardQueryOptions = {
  config: {
    queryKey: dashboardQueryKeys.config,
    queryFn: async (): Promise<DashboardConfig> => {
      const res = await apiRequest('GET', DASHBOARD_API.CONFIG);
      return await res.json();
    }
  },
  statsData: {
    queryKey: dashboardQueryKeys.statsData,
    queryFn: async (): Promise<StatsData> => {
      const res = await apiRequest('GET', DASHBOARD_API.STATS);
      return await res.json();
    }
  },
  chartData: (source: string) => ({
    queryKey: dashboardQueryKeys.chartData(source),
    queryFn: async (): Promise<ChartData> => {
      const res = await apiRequest('GET', `${DASHBOARD_API.CHART}/${source}`);
      return await res.json();
    }
  }),
  activityData: {
    queryKey: dashboardQueryKeys.activityData,
    queryFn: async (): Promise<ActivityData> => {
      const res = await apiRequest('GET', DASHBOARD_API.ACTIVITIES);
      return await res.json();
    }
  },
  quickActionsData: {
    queryKey: dashboardQueryKeys.quickActionsData,
    queryFn: async (): Promise<QuickActionsData> => {
      const res = await apiRequest('GET', DASHBOARD_API.QUICK_ACTIONS);
      return await res.json();
    }
  }
};

// Get dashboard configuration
export async function getDashboardConfig(): Promise<DashboardConfig> {
  const res = await apiRequest('GET', DASHBOARD_API.CONFIG);
  return await res.json();
}

// Save full dashboard configuration
export async function saveDashboardConfig(config: DashboardConfig): Promise<void> {
  await apiRequest('POST', DASHBOARD_API.CONFIG, config);
  
  // Invalidate dashboard configuration query
  queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.config });
}

// Update specific widget
export async function updateWidget(
  widgetId: string, 
  updates: Partial<any>
): Promise<void> {
  await apiRequest('PATCH', `${DASHBOARD_API.WIDGET}/${widgetId}`, updates);
  
  // Invalidate dashboard configuration query
  queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.config });
}

// Remove widget
export async function removeWidget(widgetId: string): Promise<void> {
  await apiRequest('DELETE', `${DASHBOARD_API.WIDGET}/${widgetId}`);
  
  // Invalidate dashboard configuration query
  queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.config });
}

// Add widget
export async function addWidget(widgetType: string): Promise<void> {
  // Note: This is implemented on the server-side to create a new widget
  // and add it to the user's dashboard configuration
  await apiRequest('POST', `${DASHBOARD_API.WIDGET}/add`, { type: widgetType });
  
  // Invalidate dashboard configuration query
  queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.config });
}

// Get default dashboard configuration for current user
export async function getDefaultDashboardConfig(): Promise<DashboardConfig> {
  const res = await apiRequest('GET', `${DASHBOARD_API.CONFIG}/default`);
  return await res.json();
}

// Reset dashboard to defaults
export async function resetDashboard(): Promise<void> {
  await apiRequest('POST', `${DASHBOARD_API.CONFIG}/reset`);
  
  // Invalidate dashboard configuration query
  queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.config });
}

// Reorder widgets
export async function reorderWidgets(widgetIds: string[]): Promise<void> {
  await apiRequest('POST', `${DASHBOARD_API.CONFIG}/reorder`, { widgetIds });
  
  // Invalidate dashboard configuration query
  queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.config });
}