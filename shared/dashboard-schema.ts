/**
 * Dashboard schema definitions shared between client and server
 */

// Widget types
export type WidgetType = 'stats' | 'chart' | 'activity' | 'quickActions';

// Widget sizes
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Widget definition
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: number;
  size: WidgetSize;
  visible: boolean;
  settings?: Record<string, any>;
}

// Dashboard configuration
export interface DashboardConfig {
  userId: string;
  lastUpdated: string;
  widgets: Widget[];
}

// Dashboard user preferences
export interface DashboardPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  refreshInterval: number;
  widgetPreferences: Record<string, any>;
  hiddenWidgets: string[];
}

// Stats widget item
export interface StatItem {
  id: string;
  label: string;
  value: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  changeLabel?: string;
  icon?: string;
}

// Chart data series definition
export interface ChartSeries {
  key: string;
  name: string;
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

// Chart data structure
export interface ChartData {
  title: string;
  description?: string;
  data: Record<string, any>[];
  xAxis: {
    key: string;
    label: string;
  };
  yAxis: {
    key: string;
    label: string;
  };
  series: ChartSeries[];
  type?: 'line' | 'bar' | 'area' | 'pie';
  nameKey?: string;
  dataKey?: string;
  colors?: string[];
  secondaryYAxis?: {
    key: string;
    name: string;
    color: string;
  };
}

// Activity item for activity feed
export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: string;
  icon?: string;
  color?: string;
  data?: Record<string, any>;
}

// Quick action item
export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  link: string;
  action?: () => void;
}

// Dashboard widget data by type
export type WidgetData = 
  | { type: 'stats', items: StatItem[] }
  | { type: 'chart', data: ChartData }
  | { type: 'activity', items: ActivityItem[] }
  | { type: 'quickActions', items: QuickActionItem[] };

// Response format for widget data
export interface WidgetDataResponse {
  widget: Widget;
  data: any;
}