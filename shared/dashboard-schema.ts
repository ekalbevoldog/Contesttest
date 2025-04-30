// Dashboard Widget Types

// Widget sizes
export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Base Widget interface that all widget types extend
export interface Widget {
  id: string;
  type: 'stats' | 'chart' | 'activity' | 'quickActions' | 'custom';
  title: string;
  description?: string;
  size: WidgetSize;
  position: number;
  settings?: Record<string, any>;
  visible: boolean;
}

// Stats Widget
export interface StatsWidget extends Widget {
  type: 'stats';
}

// Stats data for stats widget
export interface StatsDataItem {
  key: string;
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
}

export interface StatsData {
  items: StatsDataItem[];
}

// Chart Widget
export interface ChartWidget extends Widget {
  type: 'chart';
  settings?: {
    chartType: 'line' | 'bar' | 'area' | 'pie' | 'radar' | 'scatter';
    dataSource: string;
    period?: 'day' | 'week' | 'month' | 'year';
    showLegend?: boolean;
    colors?: string[];
  };
}

// Chart data for chart widget
export interface ChartData {
  data: Record<string, any>[];
  series: string[];
  xAxis?: string;
  yAxis?: string;
}

// Activity Widget
export interface ActivityWidget extends Widget {
  type: 'activity';
  settings?: {
    maxItems?: number;
    filter?: string;
  };
}

// Activity data for activity widget
export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: Date | string;
  type: string;
  icon?: string;
  status?: 'success' | 'error' | 'warning' | 'info' | 'pending';
  user?: {
    id?: string | number;
    name?: string;
    avatar?: string;
  };
  link?: string;
}

export type ActivityData = ActivityItem[];

// Quick Actions Widget
export interface QuickActionsWidget extends Widget {
  type: 'quickActions';
}

// Quick action data for quick actions widget
export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  link?: string;
  action?: string;
}

export type QuickActionsData = QuickAction[];

// Custom Widget (for extensibility)
export interface CustomWidget extends Widget {
  type: 'custom';
  componentName: string;
}

// Dashboard Configuration
export interface DashboardConfig {
  widgets: Widget[];
  layout?: 'grid' | 'masonry' | 'rows';
  theme?: string;
}

// Dashboard User Preferences
export interface DashboardPreferences {
  userId: string;
  dashboardConfig: DashboardConfig;
  lastUpdated?: Date;
}