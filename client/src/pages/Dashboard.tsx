import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions, fetchWidgetData } from '@/lib/dashboard-service';
import DashboardWidget from '@/components/dashboard/DashboardWidget';
import StatsWidget from '@/components/dashboard/StatsWidget';
import ChartWidget from '@/components/dashboard/ChartWidget';
import ActivityWidget from '@/components/dashboard/ActivityWidget';
import QuickActionsWidget from '@/components/dashboard/QuickActionsWidget';
import { Widget } from '../../shared/dashboard-schema';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { addWidget, removeWidget, reorderWidgets, saveDashboardConfig } from '@/lib/dashboard-service';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [addWidgetType, setAddWidgetType] = useState<string>('');
  
  // Fetch dashboard configuration
  const { 
    data: dashboardConfig, 
    isLoading: isLoadingConfig,
    isError: isConfigError,
    error: configError,
    refetch: refetchConfig
  } = useQuery(dashboardQueryOptions.dashboardConfig);
  
  // Function to render the appropriate widget component based on widget type
  const renderWidget = (widget: Widget) => {
    const widgetProps = {
      widget,
      onRefresh: () => refetchWidgetData(widget),
      isEditing
    };
    
    switch (widget.type) {
      case 'stats':
        return <StatsWidget {...widgetProps} />;
      case 'chart':
        return <ChartWidget {...widgetProps} />;
      case 'activity':
        return <ActivityWidget {...widgetProps} />;
      case 'quickActions':
        return <QuickActionsWidget {...widgetProps} />;
      default:
        return (
          <DashboardWidget widget={widget}>
            <div className="text-center p-4 text-gray-400">
              Unknown widget type: {widget.type}
            </div>
          </DashboardWidget>
        );
    }
  };
  
  // Function to refetch data for a specific widget
  const refetchWidgetData = async (widget: Widget) => {
    try {
      // Based on widget type, use the appropriate query client refetch
      switch (widget.type) {
        case 'stats':
          // Use the queryClient to invalidate and refetch
          const statsKey = dashboardQueryOptions.statsData.queryKey;
          console.log(`Refreshing stats widget (${widget.id})`);
          return;
        case 'chart':
          const dataSource = widget.settings?.dataSource || 'default';
          const chartKey = dashboardQueryOptions.chartData(dataSource).queryKey;
          console.log(`Refreshing chart widget (${widget.id}) with data source ${dataSource}`);
          return;
        case 'activity':
          const activityKey = dashboardQueryOptions.activityData.queryKey;
          console.log(`Refreshing activity widget (${widget.id})`);
          return;
        case 'quickActions':
          const quickActionsKey = dashboardQueryOptions.quickActionsData.queryKey;
          console.log(`Refreshing quick actions widget (${widget.id})`);
          return;
      }
    } catch (error) {
      console.error(`Error refreshing widget ${widget.id}:`, error);
    }
  };
  
  // Function to handle widget removal
  const handleRemoveWidget = async (widgetId: string) => {
    try {
      await removeWidget(widgetId);
      refetchConfig();
    } catch (error) {
      console.error(`Error removing widget ${widgetId}:`, error);
    }
  };
  
  // Function to handle adding a new widget
  const handleAddWidget = async () => {
    if (!addWidgetType) return;
    
    try {
      // Create a new widget based on the selected type
      const newWidget: Omit<Widget, 'id'> = {
        type: addWidgetType as any,
        title: getDefaultTitle(addWidgetType),
        description: getDefaultDescription(addWidgetType),
        size: 'md',
        position: dashboardConfig?.widgets.length || 0,
        visible: true,
        settings: getDefaultSettings(addWidgetType)
      };
      
      await addWidget(newWidget);
      refetchConfig();
      setAddWidgetType('');
    } catch (error) {
      console.error('Error adding widget:', error);
    }
  };
  
  // Helper functions for default widget properties
  const getDefaultTitle = (type: string): string => {
    switch (type) {
      case 'stats': return 'Key Metrics';
      case 'chart': return 'Performance Chart';
      case 'activity': return 'Recent Activity';
      case 'quickActions': return 'Quick Actions';
      default: return 'New Widget';
    }
  };
  
  const getDefaultDescription = (type: string): string => {
    switch (type) {
      case 'stats': return 'Overview of your key performance indicators';
      case 'chart': return 'Visualize your data over time';
      case 'activity': return 'See your latest updates and notifications';
      case 'quickActions': return 'Quick access to common actions';
      default: return '';
    }
  };
  
  const getDefaultSettings = (type: string): Record<string, any> | undefined => {
    switch (type) {
      case 'chart':
        return {
          chartType: 'line',
          dataSource: user?.role === 'athlete' ? 'engagement' :
                     user?.role === 'business' ? 'campaigns' :
                     user?.role === 'compliance' ? 'compliance' : 'admin',
          showLegend: true
        };
      case 'activity':
        return {
          maxItems: 5
        };
      default:
        return undefined;
    }
  };
  
  // If configuration is loading, show loading state
  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-xl">Loading dashboard...</span>
      </div>
    );
  }
  
  // If there was an error loading the configuration
  if (isConfigError || !dashboardConfig) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h2 className="text-2xl font-bold text-red-500">Error loading dashboard</h2>
        <p className="text-gray-600">
          {configError instanceof Error ? configError.message : 'Failed to load dashboard configuration'}
        </p>
        <Button onClick={() => refetchConfig()}>Try Again</Button>
      </div>
    );
  }
  
  // Filter visible widgets and sort by position
  const visibleWidgets = dashboardConfig.widgets
    .filter(widget => widget.visible)
    .sort((a, b) => a.position - b.position);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Select value={addWidgetType} onValueChange={setAddWidgetType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Add Widget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stats">Stats Widget</SelectItem>
                  <SelectItem value="chart">Chart Widget</SelectItem>
                  <SelectItem value="activity">Activity Widget</SelectItem>
                  <SelectItem value="quickActions">Quick Actions</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddWidget} disabled={!addWidgetType}>
                Add
              </Button>
            </div>
          )}
          <Button 
            variant={isEditing ? "default" : "outline"} 
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Done' : 'Edit Dashboard'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        {visibleWidgets.map(widget => (
          <React.Fragment key={widget.id}>
            {renderWidget(widget)}
          </React.Fragment>
        ))}
        
        {visibleWidgets.length === 0 && (
          <div className="col-span-12 flex flex-col items-center justify-center py-12 border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-4">No widgets in your dashboard</p>
            <Button onClick={() => setIsEditing(true)}>Customize Dashboard</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;