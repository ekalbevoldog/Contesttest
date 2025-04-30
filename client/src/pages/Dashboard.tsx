import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { dashboardQueryOptions, addWidget, reorderWidgets } from '@/lib/dashboard-service';
import { Widget, WidgetType } from '../../shared/dashboard-schema';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import StatsWidget from '@/components/dashboard/StatsWidget';
import ChartWidget from '@/components/dashboard/ChartWidget';
import ActivityWidget from '@/components/dashboard/ActivityWidget';
import QuickActionsWidget from '@/components/dashboard/QuickActionsWidget';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { v4 as uuidv4 } from 'uuid';
import { Card } from '@/components/ui/card';

// Function to get widget component by type
const getWidgetComponent = (widget: Widget, isEditing: boolean = false) => {
  if (!widget || !widget.type) {
    console.error("Invalid widget data:", widget);
    return <div>Invalid widget data</div>;
  }
  
  try {
    switch (widget.type) {
      case 'stats':
        return <StatsWidget key={widget.id} widget={widget} isEditing={isEditing} />;
      case 'chart':
        return <ChartWidget key={widget.id} widget={widget} isEditing={isEditing} />;
      case 'activity':
        return <ActivityWidget key={widget.id} widget={widget} isEditing={isEditing} />;
      case 'quickActions':
        return <QuickActionsWidget key={widget.id} widget={widget} isEditing={isEditing} />;
      default:
        console.warn(`Unknown widget type: ${widget.type}`);
        return <div>Unknown widget type: {widget.type}</div>;
    }
  } catch (error) {
    console.error("Error rendering widget:", error, widget);
    return <div>Error rendering widget</div>;
  }
};

// Widget size CSS classes
const sizeClasses = {
  'sm': 'col-span-1',
  'md': 'col-span-1 md:col-span-2',
  'lg': 'col-span-1 md:col-span-3',
  'xl': 'col-span-1 md:col-span-3 lg:col-span-4',
  'full': 'col-span-full',
};

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [newWidgetType, setNewWidgetType] = useState<WidgetType>('stats');
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  
  // Fetch dashboard configuration
  const { 
    data: dashboardConfig, 
    isLoading, 
    isError,
    refetch 
  } = useQuery(dashboardQueryOptions.config);

  // Handle adding a new widget
  const addWidgetMutation = useMutation({
    mutationFn: addWidget,
    onSuccess: () => {
      toast({
        title: 'Widget added',
        description: 'The widget has been added to your dashboard.',
      });
      refetch();
      setAddWidgetOpen(false);
      setNewWidgetTitle('');
    },
    onError: (error) => {
      toast({
        title: 'Failed to add widget',
        description: 'There was an error adding the widget. Please try again.',
        variant: 'destructive',
      });
      console.error('Error adding widget:', error);
    },
  });
  
  // Handle reordering widgets
  const reorderWidgetsMutation = useMutation({
    mutationFn: reorderWidgets,
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Failed to reorder widgets',
        description: 'There was an error reordering widgets. Please try again.',
        variant: 'destructive',
      });
      console.error('Error reordering widgets:', error);
    },
  });
  
  // Handle adding a new widget
  const handleAddWidget = () => {
    if (!newWidgetTitle.trim()) {
      toast({
        title: 'Widget title required',
        description: 'Please provide a title for the new widget.',
        variant: 'destructive',
      });
      return;
    }
    
    addWidgetMutation.mutate({
      type: newWidgetType,
      title: newWidgetTitle,
      position: dashboardConfig?.widgets?.length || 0,
      size: 'md',
      visible: true,
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isError || !dashboardConfig) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 p-4 rounded-md text-red-500 text-center">
          <h2 className="text-lg font-semibold">Error loading dashboard</h2>
          <p>There was a problem loading your dashboard. Please try refreshing the page.</p>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="mt-2"
          >
            Refresh
          </Button>
        </div>
      </div>
    );
  }
  
  // Sort widgets by position
  const sortedWidgets = [...dashboardConfig.widgets].sort((a, b) => a.position - b.position);
  
  // Filter visible widgets
  const visibleWidgets = sortedWidgets.filter(widget => widget.visible);
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.username || 'User'}. Here's your personalized dashboard.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Done Editing' : 'Edit Dashboard'}
          </Button>
          
          {isEditing && (
            <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a new widget</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="widget-title">Widget Title</Label>
                    <Input
                      id="widget-title"
                      value={newWidgetTitle}
                      onChange={(e) => setNewWidgetTitle(e.target.value)}
                      placeholder="Enter widget title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="widget-type">Widget Type</Label>
                    <Select
                      value={newWidgetType}
                      onValueChange={(value) => setNewWidgetType(value as WidgetType)}
                    >
                      <SelectTrigger id="widget-type">
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
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={handleAddWidget}
                    disabled={addWidgetMutation.isPending}
                  >
                    {addWidgetMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Widget
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {visibleWidgets.length === 0 ? (
        <div className="py-12">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">No widgets added yet</h2>
            <p className="text-muted-foreground mb-4">
              Your dashboard is empty. Add widgets to personalize your experience.
            </p>
            <Dialog open={addWidgetOpen} onOpenChange={setAddWidgetOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Widget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a new widget</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="widget-title">Widget Title</Label>
                    <Input
                      id="widget-title"
                      value={newWidgetTitle}
                      onChange={(e) => setNewWidgetTitle(e.target.value)}
                      placeholder="Enter widget title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="widget-type">Widget Type</Label>
                    <Select
                      value={newWidgetType}
                      onValueChange={(value) => setNewWidgetType(value as WidgetType)}
                    >
                      <SelectTrigger id="widget-type">
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
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={handleAddWidget}
                    disabled={addWidgetMutation.isPending}
                  >
                    {addWidgetMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Widget
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {visibleWidgets.map((widget) => (
            <div key={widget.id} className={sizeClasses[widget.size]}>
              {getWidgetComponent(widget, isEditing)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;