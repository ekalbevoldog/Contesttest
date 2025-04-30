import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions, addWidget } from '@/lib/dashboard-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, RefreshCw, Settings, Save, Undo } from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Widget, WidgetType } from '../../shared/dashboard-schema';
import { 
  StatsWidget, 
  ChartWidget, 
  ActivityWidget, 
  QuickActionsWidget 
} from '@/components/dashboard';
import { useAuth } from '@/hooks/use-auth';

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch dashboard configuration
  const { 
    data: dashboardConfig, 
    isLoading,
    isError,
    refetch
  } = useQuery(dashboardQueryOptions.config);
  
  // Handle refresh of all dashboard data
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    
    toast({
      title: "Dashboard refreshed",
      description: "All dashboard widgets have been updated with the latest data.",
    });
  };
  
  // Add a new widget to the dashboard
  const handleAddWidget = async (widgetType: WidgetType) => {
    try {
      await addWidget(widgetType);
      toast({
        title: "Widget added",
        description: `New ${widgetType} widget has been added to your dashboard.`,
      });
    } catch (error) {
      toast({
        title: "Error adding widget",
        description: "There was an error adding the widget. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(prev => !prev);
    
    if (isEditing) {
      toast({
        title: "Edit mode disabled",
        description: "Your dashboard changes have been saved.",
      });
    } else {
      toast({
        title: "Edit mode enabled",
        description: "You can now customize your dashboard widgets.",
      });
    }
  };
  
  // Reset the dashboard to default settings
  const handleResetDashboard = async () => {
    // This would call a function to reset dashboard to defaults
    toast({
      title: "Dashboard reset",
      description: "Your dashboard has been reset to the default layout.",
    });
  };
  
  // Render widget based on its type
  const renderWidget = (widget: Widget) => {
    if (!widget.visible) return null;
    
    switch (widget.type) {
      case 'stats':
        return (
          <StatsWidget 
            key={widget.id} 
            widget={widget} 
            isEditing={isEditing} 
          />
        );
      case 'chart':
        return (
          <ChartWidget 
            key={widget.id} 
            widget={widget} 
            isEditing={isEditing} 
          />
        );
      case 'activity':
        return (
          <ActivityWidget 
            key={widget.id} 
            widget={widget} 
            isEditing={isEditing} 
          />
        );
      case 'quickActions':
        return (
          <QuickActionsWidget 
            key={widget.id} 
            widget={widget} 
            isEditing={isEditing} 
          />
        );
      default:
        return null;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-4">
          {[1, 2, 3, 4].map(index => (
            <div key={index} className="col-span-6">
              <Skeleton className="h-64 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (isError || !dashboardConfig) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Dashboard Error</h2>
        <p className="text-gray-500 mb-4">
          There was an error loading your personalized dashboard.
        </p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">{user?.role === 'athlete' ? 'Athlete' : user?.role === 'business' ? 'Business' : user?.role === 'compliance' ? 'Compliance Officer' : 'Admin'} Dashboard</h1>
          <p className="text-gray-500">
            {isEditing 
              ? 'Customize your dashboard by adding, removing, or resizing widgets.' 
              : 'View your personalized dashboard and insights.'}
          </p>
        </div>
        
        <div className="flex mt-4 sm:mt-0 space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant={isEditing ? "default" : "outline"} 
            size="icon"
            onClick={toggleEditMode}
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
          </Button>
          
          {isEditing && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Widget
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleAddWidget('stats')}>
                    Stats Widget
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddWidget('chart')}>
                    Chart Widget
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddWidget('activity')}>
                    Activity Widget
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddWidget('quickActions')}>
                    Quick Actions Widget
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleResetDashboard}
              >
                <Undo className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        {dashboardConfig.widgets.map(widget => renderWidget(widget))}
      </div>
    </div>
  );
};

export default Dashboard;