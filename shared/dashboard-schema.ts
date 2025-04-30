// Dashboard widgets configuration types

// Widget sizes
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Widget types
export type WidgetType = 'stats' | 'chart' | 'activity' | 'quickActions';

// Base widget configuration
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size: WidgetSize;
  position: number;
  visible: boolean;
  settings?: Record<string, any>;
}

// Dashboard configuration
export interface DashboardConfig {
  widgets: Widget[];
  layout: 'grid' | 'list' | 'custom';
}

// Stats widget data types
export interface StatItem {
  key: string;
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
}

export interface StatsData {
  items: StatItem[];
}

// Chart widget data types
export interface ChartData {
  data: Record<string, any>[];
  series: string[];
  xAxis?: string;
  yAxis?: string;
}

// Activity widget data types
export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: string;
  icon?: string;
  status?: 'pending' | 'success' | 'warning' | 'error';
  link?: string;
}

export type ActivityData = ActivityItem[];

// Quick actions widget data types
export interface QuickActionItem {
  id: string;
  label: string;
  description: string;
  icon?: string;
  color?: string;
  link: string;
}

export type QuickActionsData = QuickActionItem[];