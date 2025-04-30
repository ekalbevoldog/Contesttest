// Dashboard schema types

// Widget types
export type WidgetType = 'stats' | 'chart' | 'activity' | 'quickActions';

// Widget sizes
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Base widget interface
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
  userId: string;
  widgets: Widget[];
  lastUpdated?: string;
}

// Stats Widget Data Types
export interface StatItem {
  key: string;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  icon?: string;
  color?: string;
  link?: string;
}

export interface StatsData {
  items: StatItem[];
  timestamp?: string;
}

// Chart Widget Data Types
export interface ChartData {
  data: any[];
  series: string[];
  xAxis?: string;
  timestamp?: string;
}

// Activity Widget Data Types
export interface ActivityItem {
  id: string;
  type: string;
  icon?: string;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  link?: string;
}

export type ActivityData = ActivityItem[];

// Quick Actions Widget Data Types
export interface QuickActionItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  link: string;
  color?: string;
  action?: string;
}

export type QuickActionsData = QuickActionItem[];