// Types for dashboard configuration and widget data

// Widget types
export type WidgetType = 'stats' | 'chart' | 'activity' | 'quickActions';

// Widget interface - base structure for all widget types
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  position: number;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  visible: boolean;
  settings?: Record<string, any>;
}

// Dashboard configuration interface
export interface DashboardConfig {
  userId: string;
  widgets: Widget[];
  lastUpdated: string; // ISO date string
}

// Stats widget data
export interface StatItem {
  key: string;
  label: string;
  value: string | number;
  icon?: string; // Lucide icon name
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: number; // Percentage change
  link?: string; // Optional link to more details
}

// Chart widget data
export interface ChartData {
  data: Record<string, any>[]; // Array of data points
  series: string[]; // Array of series names
  xAxis: string; // Property name for X-axis data
}

// Activity widget data
export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string; // ISO date string
  icon?: string; // Lucide icon name
  status?: 'success' | 'pending' | 'warning' | 'error';
  link?: string; // Optional link to more details
}

// Quick actions widget data
export interface QuickActionItem {
  id: string;
  label: string;
  icon?: string; // Lucide icon name
  color?: string;
  link: string;
  description?: string;
}