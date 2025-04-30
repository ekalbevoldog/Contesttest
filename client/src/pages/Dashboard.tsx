import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  dashboardQueryOptions, 
  addWidget, 
  reorderWidgets, 
  dashboardWs,
  DashboardLocalStorageCache
} from '@/lib/dashboard-service';
import { Widget, WidgetType, DashboardConfig } from '../../shared/dashboard-schema';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, RefreshCw, AlertTriangle, WifiOff } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [newWidgetType, setNewWidgetType] = useState<WidgetType>('stats');
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [useOfflineMode, setUseOfflineMode] = useState(false);
  const [localDashboardConfig, setLocalDashboardConfig] = useState<DashboardConfig | null>(null);
  
  // Generate default widgets based on user role
  const generateDefaultWidgets = useCallback((userId: string, role: string): Widget[] => {
    const defaultWidgets: Widget[] = [];
    
    // Stats widget for all roles
    defaultWidgets.push({
      id: `stats-${uuidv4()}`,
      type: 'stats',
      title: 'Key Metrics',
      position: 0,
      size: 'md',
      visible: true,
      settings: {
        refreshInterval: 300,
      }
    });
    
    // Different widgets based on role
    if (role === 'athlete') {
      defaultWidgets.push({
        id: `activity-${uuidv4()}`,
        type: 'activity',
        title: 'Recent Activity',
        position: 1,
        size: 'md',
        visible: true,
        settings: {}
      });
      
      defaultWidgets.push({
        id: `opportunities-${uuidv4()}`,
        type: 'quickActions',
        title: 'Available Opportunities',
        position: 2,
        size: 'md',
        visible: true,
        settings: {
          maxItems: 5,
          showIcons: true
        }
      });
    } else if (role === 'business') {
      defaultWidgets.push({
        id: `chart-${uuidv4()}`,
        type: 'chart',
        title: 'Campaign Performance',
        position: 1,
        size: 'lg',
        visible: true,
        settings: {
          chartType: 'bar',
          dataKey: 'campaigns'
        }
      });
      
      defaultWidgets.push({
        id: `actions-${uuidv4()}`,
        type: 'quickActions',
        title: 'Campaign Actions',
        position: 2,
        size: 'sm',
        visible: true,
        settings: {}
      });
    } else {
      // Admin or compliance officer
      defaultWidgets.push({
        id: `chart-${uuidv4()}`,
        type: 'chart',
        title: 'Platform Analytics',
        position: 1,
        size: 'lg', 
        visible: true,
        settings: {
          chartType: 'line',
          dataKey: 'analytics'
        }
      });
    }
    
    return defaultWidgets;
  }, []);
  
  // Create local cache in case API fails
  const createLocalDashboardConfig = useCallback(() => {
    if (!user) return null;
    
    const userId = user.id || localStorage.getItem('userId') || 'anonymous';
    const role = user.role || localStorage.getItem('userRole') || 'athlete';
    
    // Store the user ID and role for reference
    localStorage.setItem('userId', userId);
    localStorage.setItem('userRole', role);
    
    // Generate default widgets for this user
    const widgets = generateDefaultWidgets(userId, role);
    
    const dashboardConfig: DashboardConfig = {
      userId: userId,
      lastUpdated: new Date().toISOString(),
      widgets
    };
    
    // Save to localStorage
    DashboardLocalStorageCache.saveConfig(dashboardConfig);
    
    return dashboardConfig;
  }, [user, generateDefaultWidgets]);
  
  // Fetch dashboard configuration
  const { 
    data: dashboardConfig, 
    isLoading, 
    isError,
    error,
    refetch 
  } = useQuery({
    ...dashboardQueryOptions.config,
    retry: 1, // Don't retry too many times
    refetchOnWindowFocus: false, // Disable automatic refetches on window focus
    onError: () => {
      // On error, try to use cached config
      const cachedConfig = DashboardLocalStorageCache.loadConfig();
      if (cachedConfig) {
        setLocalDashboardConfig(cachedConfig);
        setUseOfflineMode(true);
        toast({
          title: "Using offline dashboard",
          description: "Could not connect to server. Using locally cached dashboard configuration.",
          variant: "warning"
        });
      } else {
        // If no cached config, create a default one
        const newConfig = createLocalDashboardConfig();
        if (newConfig) {
          setLocalDashboardConfig(newConfig);
          setUseOfflineMode(true);
          toast({
            title: "Using default dashboard",
            description: "Created a default dashboard configuration for offline use.",
            variant: "warning"
          });
        }
      }
    },
    onSuccess: (data) => {
      // On success, update the local cache
      DashboardLocalStorageCache.saveConfig(data);
      setUseOfflineMode(false);
    }
  });
  
  // Set up WebSocket connection for real-time dashboard updates
  useEffect(() => {
    if (user?.id) {
      // Set user info in the WebSocket manager
      dashboardWs.setUser(user.id, user.role || 'athlete');
      
      // Connect to WebSocket for real-time updates
      dashboardWs.connect();
      
      // Listen for connection status
      const connectionUnsubscribe = dashboardWs.on('connection', (data) => {
        setWsConnected(data.status === 'connected');
        if (data.status === 'connected') {
          console.log('[Dashboard Page] WebSocket connected');
          // Request latest dashboard data via WebSocket
          dashboardWs.send('get_dashboard', { userId: user.id });
        }
      });
      
      // Listen for dashboard updates
      const dashboardUnsubscribe = dashboardWs.on('dashboard_update', (data) => {
        console.log('[Dashboard Page] Received dashboard update via WebSocket:', data);
        // Update the react-query cache with the new data
        queryClient.setQueryData(['/api/dashboard/config'], data.config);
        toast({
          title: "Dashboard updated",
          description: "Your dashboard has been updated in real-time.",
        });
      });
      
      return () => {
        // Clean up event listeners and close connection when component unmounts
        connectionUnsubscribe();
        dashboardUnsubscribe();
        dashboardWs.disconnect();
      };
    }
  }, [user, queryClient, toast]);
  
  // Log dashboard configuration for debugging
  useEffect(() => {
    console.log('[Dashboard Page] Auth user:', user);
    console.log('[Dashboard Page] Dashboard config fetch status:', { 
      isLoading, 
      isError, 
      hasData: !!dashboardConfig,
      usingOfflineMode: useOfflineMode,
      localCache: !!localDashboardConfig,
      wsConnected
    });
    if (error) {
      console.error('[Dashboard Page] Error fetching dashboard config:', error);
    }
    if (dashboardConfig) {
      console.log('[Dashboard Page] Dashboard config loaded:', dashboardConfig);
    }
    if (localDashboardConfig) {
      console.log('[Dashboard Page] Local dashboard config:', localDashboardConfig);
    }
  }, [dashboardConfig, isLoading, isError, error, user, useOfflineMode, localDashboardConfig, wsConnected]);

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
  
  // Helper function to handle automatic dashboard initialization
  const handleDashboardInit = useCallback(() => {
    // If we're in offline mode and have a local config, use that
    if (useOfflineMode && localDashboardConfig) {
      // Use the cached dashboard configuration
      return localDashboardConfig;
    }
    
    // If still loading, show loading state
    if (isLoading) {
      return null;
    }
    
    // Use the fetched dashboard configuration if available
    if (dashboardConfig) {
      return dashboardConfig;
    }
    
    // As a last resort, create a new local dashboard config
    const newConfig = createLocalDashboardConfig();
    if (newConfig) {
      return newConfig;
    }
    
    // If all else fails, return empty config
    return {
      userId: user?.id || 'anonymous',
      lastUpdated: new Date().toISOString(),
      widgets: []
    };
  }, [isLoading, dashboardConfig, useOfflineMode, localDashboardConfig, createLocalDashboardConfig, user]);
  
  // Get the active dashboard config
  const activeDashboardConfig = handleDashboardInit();
  
  // Show loading state
  if (isLoading && !useOfflineMode && !localDashboardConfig) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  // If we have a critical error and no fallback
  if ((isError || !activeDashboardConfig) && !useOfflineMode && !localDashboardConfig) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>
            We couldn't load your dashboard data. This could be due to a network issue or a server problem.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col gap-4 items-center justify-center">
          <p>Please try one of the following:</p>
          <div className="flex gap-2">
            <Button 
              onClick={() => refetch()} 
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
            
            <Button 
              onClick={() => {
                const newConfig = createLocalDashboardConfig();
                if (newConfig) {
                  setLocalDashboardConfig(newConfig);
                  setUseOfflineMode(true);
                  toast({
                    title: "Using offline mode",
                    description: "Created a default dashboard for offline use.",
                  });
                }
              }}
            >
              <WifiOff className="h-4 w-4 mr-2" />
              Use Offline Mode
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If we have no dashboard config at all (very unlikely)
  if (!activeDashboardConfig) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Dashboard Unavailable</h2>
        <p className="mb-4">We couldn't initialize your dashboard. Please try again later.</p>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }
  
  // Sort widgets by position
  const sortedWidgets = [...activeDashboardConfig.widgets].sort((a, b) => a.position - b.position);
  
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