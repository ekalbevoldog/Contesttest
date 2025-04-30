import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  StatsWidget,
  ChartWidget,
  ActivityWidget,
  QuickActionsWidget,
  DashboardConfig,
  Widget
} from '@/components/dashboard';

import { fetchDashboardConfig, saveDashboardConfig, updateWidget, removeWidget } from '@/lib/dashboard-service';
import { v4 as uuidv4 } from 'uuid';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isWidgetDialogOpen, setIsWidgetDialogOpen] = useState(false);
  const [newWidgetType, setNewWidgetType] = useState<string>('stats');
  const [newWidgetSize, setNewWidgetSize] = useState<string>('md');

  // Fetch dashboard configuration
  const { data: dashboardConfig, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: fetchDashboardConfig,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Save dashboard configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: saveDashboardConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: 'Dashboard saved',
        description: 'Your dashboard configuration has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error saving dashboard',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Update widget mutation
  const updateWidgetMutation = useMutation({
    mutationFn: ({ widgetId, updates }: { widgetId: string; updates: Partial<Widget> }) => 
      updateWidget(widgetId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating widget',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Remove widget mutation
  const removeWidgetMutation = useMutation({
    mutationFn: removeWidget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: 'Widget removed',
        description: 'The widget has been removed from your dashboard.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error removing widget',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Add new widget to dashboard
  const handleAddWidget = () => {
    if (!dashboardConfig) return;

    const newWidget: Widget = {
      id: `${newWidgetType}-${uuidv4().substring(0, 8)}`,
      type: newWidgetType as any,
      title: getWidgetTitle(newWidgetType),
      description: getWidgetDescription(newWidgetType),
      size: newWidgetSize as any,
      position: dashboardConfig.widgets.length,
      visible: true,
    };

    // Add chart-specific settings
    if (newWidgetType === 'chart') {
      newWidget.settings = {
        chartType: 'line',
        dataSource: user?.role === 'business' ? 'campaigns' : 'engagement',
        showLegend: true,
      };
    }

    // Add activity-specific settings
    if (newWidgetType === 'activity') {
      newWidget.settings = {
        maxItems: 5,
      };
    }

    const updatedConfig: DashboardConfig = {
      ...dashboardConfig,
      widgets: [...dashboardConfig.widgets, newWidget],
    };

    saveConfigMutation.mutate(updatedConfig);
    setIsWidgetDialogOpen(false);
  };

  // Toggle widget visibility
  const toggleWidgetVisibility = (widgetId: string, visible: boolean) => {
    updateWidgetMutation.mutate({
      widgetId,
      updates: { visible: !visible },
    });
  };

  // Delete widget
  const deleteWidget = (widgetId: string) => {
    removeWidgetMutation.mutate(widgetId);
  };

  // Helper functions for widget titles and descriptions
  const getWidgetTitle = (type: string): string => {
    switch (type) {
      case 'stats':
        return 'Key Metrics';
      case 'chart':
        return 'Performance Trends';
      case 'activity':
        return 'Recent Activity';
      case 'quickActions':
        return 'Quick Actions';
      default:
        return 'New Widget';
    }
  };

  const getWidgetDescription = (type: string): string => {
    switch (type) {
      case 'stats':
        return 'Overview of your performance metrics';
      case 'chart':
        return 'Visualize your data over time';
      case 'activity':
        return 'Latest updates and notifications';
      case 'quickActions':
        return 'Common tasks and shortcuts';
      default:
        return '';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-md">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <Skeleton className="h-full w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !dashboardConfig) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Dashboard Error</CardTitle>
            <CardDescription>
              We encountered an error loading your dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] })}
              variant="outline"
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const visibleWidgets = dashboardConfig.widgets.filter(widget => widget.visible);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.username || 'User'}! Here's your personalized dashboard.
          </p>
        </div>
        <Dialog open={isWidgetDialogOpen} onOpenChange={setIsWidgetDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Widget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Widget</DialogTitle>
              <DialogDescription>
                Choose the type of widget you want to add to your dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="widget-type" className="text-right">
                  Widget Type
                </label>
                <Select 
                  value={newWidgetType} 
                  onValueChange={setNewWidgetType}
                >
                  <SelectTrigger id="widget-type" className="col-span-3">
                    <SelectValue placeholder="Select widget type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stats">Statistics</SelectItem>
                    <SelectItem value="chart">Chart</SelectItem>
                    <SelectItem value="activity">Activity Feed</SelectItem>
                    <SelectItem value="quickActions">Quick Actions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="widget-size" className="text-right">
                  Widget Size
                </label>
                <Select 
                  value={newWidgetSize} 
                  onValueChange={setNewWidgetSize}
                >
                  <SelectTrigger id="widget-size" className="col-span-3">
                    <SelectValue placeholder="Select widget size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                    <SelectItem value="full">Full Width</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsWidgetDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddWidget}>
                Add Widget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleWidgets.map((widget) => (
          <div 
            key={widget.id}
            className={`
              ${widget.size === 'sm' ? 'col-span-1' : ''}
              ${widget.size === 'md' ? 'col-span-1 md:col-span-1 lg:col-span-2' : ''}
              ${widget.size === 'lg' ? 'col-span-1 md:col-span-2 lg:col-span-2' : ''}
              ${widget.size === 'xl' ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''}
              ${widget.size === 'full' ? 'col-span-1 md:col-span-2 lg:col-span-4' : ''}
            `}
          >
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{widget.title}</CardTitle>
                    {widget.description && (
                      <CardDescription>{widget.description}</CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Widget settings</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => toggleWidgetVisibility(widget.id, widget.visible)}
                      >
                        {widget.visible ? 'Hide' : 'Show'} Widget
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteWidget(widget.id)}
                        className="text-red-600"
                      >
                        Delete Widget
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {widget.type === 'stats' && (
                  <StatsWidget widget={widget} />
                )}
                {widget.type === 'chart' && (
                  <ChartWidget widget={widget} />
                )}
                {widget.type === 'activity' && (
                  <ActivityWidget widget={widget} />
                )}
                {widget.type === 'quickActions' && (
                  <QuickActionsWidget widget={widget} />
                )}
              </CardContent>
            </Card>
          </div>
        ))}

        {visibleWidgets.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <Card className="shadow-md">
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
                <p className="text-center text-muted-foreground mb-4">
                  Your dashboard is empty. Add widgets to customize your view.
                </p>
                <Button onClick={() => setIsWidgetDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Widget
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;