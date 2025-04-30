import { apiRequest, queryClient } from "./queryClient";
import {
  DashboardConfig,
  Widget,
  WidgetSize,
  StatsData,
  ChartData,
  ActivityData,
  QuickActionsData
} from "../../shared/dashboard-schema";

// Base URL for dashboard API endpoints
const DASHBOARD_API_BASE = "/api/dashboard";

/**
 * Fetch dashboard configuration for the current user
 * Creates default configuration if none exists
 */
export async function fetchDashboardConfig(): Promise<DashboardConfig> {
  try {
    const response = await apiRequest("GET", DASHBOARD_API_BASE);
    return await response.json();
  } catch (error) {
    console.error("Error fetching dashboard config:", error);
    throw new Error("Failed to load dashboard configuration");
  }
}

/**
 * Save dashboard configuration
 */
export async function saveDashboardConfig(config: DashboardConfig): Promise<void> {
  try {
    await apiRequest("POST", DASHBOARD_API_BASE, config);
    // Invalidate cached dashboard config
    queryClient.invalidateQueries({ queryKey: [DASHBOARD_API_BASE] });
  } catch (error) {
    console.error("Error saving dashboard config:", error);
    throw new Error("Failed to save dashboard configuration");
  }
}

/**
 * Update a specific widget
 */
export async function updateWidget(widgetId: string, updates: Partial<Widget>): Promise<void> {
  try {
    await apiRequest("PATCH", `${DASHBOARD_API_BASE}/widgets/${widgetId}`, updates);
    // Invalidate cached dashboard config
    queryClient.invalidateQueries({ queryKey: [DASHBOARD_API_BASE] });
  } catch (error) {
    console.error(`Error updating widget ${widgetId}:`, error);
    throw new Error("Failed to update widget");
  }
}

/**
 * Remove a widget from the dashboard
 */
export async function removeWidget(widgetId: string): Promise<void> {
  try {
    await apiRequest("DELETE", `${DASHBOARD_API_BASE}/widgets/${widgetId}`);
    // Invalidate cached dashboard config
    queryClient.invalidateQueries({ queryKey: [DASHBOARD_API_BASE] });
  } catch (error) {
    console.error(`Error removing widget ${widgetId}:`, error);
    throw new Error("Failed to remove widget");
  }
}

/**
 * Add a new widget to the dashboard
 */
export async function addWidget(widget: Omit<Widget, 'id'>): Promise<void> {
  try {
    // Fetch current config
    const config = await fetchDashboardConfig();
    
    // Create a new widget with a unique ID
    const newWidget: Widget = {
      ...widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Add the widget to the config
    config.widgets.push(newWidget);
    
    // Save the updated config
    await saveDashboardConfig(config);
  } catch (error) {
    console.error("Error adding widget:", error);
    throw new Error("Failed to add widget");
  }
}

/**
 * Reorder widgets by updating positions
 */
export async function reorderWidgets(widgetIds: string[]): Promise<void> {
  try {
    // Fetch current config
    const config = await fetchDashboardConfig();
    
    // Create a map of widget IDs to their new positions
    const positionMap = new Map<string, number>();
    widgetIds.forEach((id, index) => {
      positionMap.set(id, index);
    });
    
    // Update widget positions
    config.widgets.forEach(widget => {
      if (positionMap.has(widget.id)) {
        widget.position = positionMap.get(widget.id) as number;
      }
    });
    
    // Sort widgets by position
    config.widgets.sort((a, b) => a.position - b.position);
    
    // Save the updated config
    await saveDashboardConfig(config);
  } catch (error) {
    console.error("Error reordering widgets:", error);
    throw new Error("Failed to reorder widgets");
  }
}

/**
 * Fetch stats data for the stats widget
 */
export async function fetchStatsData(): Promise<StatsData> {
  try {
    const response = await apiRequest("GET", `${DASHBOARD_API_BASE}/data/stats`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching stats data:", error);
    throw new Error("Failed to load stats data");
  }
}

/**
 * Fetch chart data for the chart widget
 */
export async function fetchChartData(dataSource: string): Promise<ChartData> {
  try {
    const response = await apiRequest("GET", `${DASHBOARD_API_BASE}/data/${dataSource}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching chart data for ${dataSource}:`, error);
    throw new Error(`Failed to load chart data for ${dataSource}`);
  }
}

/**
 * Fetch activity data for the activity widget
 */
export async function fetchActivityData(): Promise<ActivityData> {
  try {
    const response = await apiRequest("GET", `${DASHBOARD_API_BASE}/data/activities`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching activity data:", error);
    throw new Error("Failed to load activity data");
  }
}

/**
 * Fetch quick actions data for the quick actions widget
 */
export async function fetchQuickActionsData(): Promise<QuickActionsData> {
  try {
    const response = await apiRequest("GET", `${DASHBOARD_API_BASE}/data/quickActions`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching quick actions data:", error);
    throw new Error("Failed to load quick actions data");
  }
}

/**
 * Fetch widget data based on widget type and settings
 */
export async function fetchWidgetData(widget: Widget): Promise<any> {
  try {
    switch (widget.type) {
      case 'stats':
        return fetchStatsData();
      case 'chart':
        return fetchChartData(widget.settings?.dataSource || 'default');
      case 'activity':
        return fetchActivityData();
      case 'quickActions':
        return fetchQuickActionsData();
      default:
        throw new Error(`Unsupported widget type: ${widget.type}`);
    }
  } catch (error) {
    console.error(`Error fetching data for widget ${widget.id}:`, error);
    throw error;
  }
}

/**
 * Hook data fetchers for TanStack Query
 */
export const dashboardQueryOptions = {
  dashboardConfig: {
    queryKey: [DASHBOARD_API_BASE],
    queryFn: fetchDashboardConfig,
  },
  statsData: {
    queryKey: [`${DASHBOARD_API_BASE}/data/stats`],
    queryFn: fetchStatsData,
  },
  activityData: {
    queryKey: [`${DASHBOARD_API_BASE}/data/activities`],
    queryFn: fetchActivityData,
  },
  quickActionsData: {
    queryKey: [`${DASHBOARD_API_BASE}/data/quickActions`],
    queryFn: fetchQuickActionsData,
  },
  chartData: (dataSource: string) => ({
    queryKey: [`${DASHBOARD_API_BASE}/data/${dataSource}`],
    queryFn: () => fetchChartData(dataSource),
  }),
};