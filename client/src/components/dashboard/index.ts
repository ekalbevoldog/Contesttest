// Export all dashboard widget components
export { default as DashboardWidget } from './DashboardWidget';
export { default as StatsWidget } from './StatsWidget';
export { default as ChartWidget } from './ChartWidget';
export { default as ActivityWidget } from './ActivityWidget';
export { default as QuickActionsWidget } from './QuickActionsWidget';

// Export types from our schema
export type {
  Widget,
  DashboardConfig,
  StatsWidget as StatsWidgetType,
  ChartWidget as ChartWidgetType,
  ActivityWidget as ActivityWidgetType,
  QuickActionsWidget as QuickActionsWidgetType,
  CustomWidget as CustomWidgetType,
  StatsData,
  ChartData,
  ActivityData,
  ActivityItem,
  QuickActionsData,
  QuickAction
} from '../../../shared/dashboard-schema';