import { z } from 'zod';

// Widget size options
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Widget type options
export type WidgetType = 'stats' | 'chart' | 'activity' | 'quickActions';

// Widget settings schema
export interface WidgetSettings {
  chartType?: 'line' | 'bar' | 'area';
  dataSource?: string;
  refreshInterval?: number;
  colors?: string[];
  [key: string]: any;
}

// Widget schema
export interface Widget {
  id: string;
  title: string;
  description?: string;
  type: WidgetType;
  position: number;
  size: WidgetSize;
  visible: boolean;
  settings?: WidgetSettings;
}

// Dashboard config schema
export interface DashboardConfig {
  userId: string;
  widgets: Widget[];
  lastUpdated: string;
}

// Stats Widget Data
export interface StatItem {
  key: string;
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  link?: string;
}

// Activity Widget Data
export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  status?: 'success' | 'pending' | 'warning' | 'error';
  link?: string;
}

// Chart Widget Data
export interface ChartData {
  xAxis: string;
  series: string[];
  data: Array<Record<string, any>>;
}

// Quick Actions Widget Data
export interface QuickActionItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  link: string;
  color?: string;
}

// Zod schemas for validation
export const widgetSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(['stats', 'chart', 'activity', 'quickActions']),
  position: z.number(),
  size: z.enum(['sm', 'md', 'lg', 'xl', 'full']),
  visible: z.boolean(),
  settings: z.record(z.any()).optional(),
});

export const dashboardConfigSchema = z.object({
  userId: z.string(),
  widgets: z.array(widgetSchema),
  lastUpdated: z.string(),
});

export const createInsertWidgetSchema = () => widgetSchema.omit({ id: true });
export type InsertWidget = z.infer<ReturnType<typeof createInsertWidgetSchema>>;