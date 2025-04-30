import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-utils';
import { loadDashboardConfig, updateWidgetConfig, removeWidget, DashboardConfig, WidgetConfig } from '@/lib/dashboard-service';
import { 
  DashboardWidget,
  StatsWidget, 
  ChartWidget, 
  ActivityWidget, 
  QuickActionsWidget,
  StatIcons 
} from '@/components/dashboard';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Users, TrendingUp, MessageSquare, Briefcase, Plus, Settings, Zap, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const userType = user?.role || 'unknown';
  
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  
  // Fetch dashboard configuration
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard', userId],
    queryFn: async () => {
      if (!userId) return null;
      return await loadDashboardConfig(userId, userType);
    },
    enabled: !!userId,
  });
  
  useEffect(() => {
    if (dashboardData) {
      setDashboardConfig(dashboardData);
    }
  }, [dashboardData]);
  
  // Handle widget removal
  const handleRemoveWidget = async (widgetId: string) => {
    if (!userId || !dashboardConfig) return;
    
    // Optimistic UI update
    const updatedWidgets = dashboardConfig.widgets.filter(w => w.id !== widgetId);
    setDashboardConfig({
      ...dashboardConfig,
      widgets: updatedWidgets
    });
    
    // Persist the change
    await removeWidget(userId, widgetId);
  };
  
  // Handle widget resize
  const handleResizeWidget = async (widgetId: string, newSize: 'sm' | 'md' | 'lg' | 'xl' | 'full') => {
    if (!userId || !dashboardConfig) return;
    
    // Optimistic UI update
    const updatedWidgets = dashboardConfig.widgets.map(w => 
      w.id === widgetId ? { ...w, size: newSize } : w
    );
    
    setDashboardConfig({
      ...dashboardConfig,
      widgets: updatedWidgets
    });
    
    // Persist the change
    await updateWidgetConfig(userId, widgetId, { size: newSize });
  };
  
  // Render placeholder/loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Skeleton className="col-span-full h-40 bg-zinc-800/50" />
          <Skeleton className="col-span-1 md:col-span-6 h-80 bg-zinc-800/50" />
          <Skeleton className="col-span-1 md:col-span-6 h-80 bg-zinc-800/50" />
          <Skeleton className="col-span-1 md:col-span-4 h-60 bg-zinc-800/50" />
          <Skeleton className="col-span-1 md:col-span-4 h-60 bg-zinc-800/50" />
          <Skeleton className="col-span-1 md:col-span-4 h-60 bg-zinc-800/50" />
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Dashboard</h1>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-500">Error loading dashboard: {(error as Error).message}</p>
          <Button 
            variant="outline" 
            className="mt-4 bg-zinc-900/70 border-zinc-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Example athlete stats data
  const athleteStats = [
    { 
      icon: StatIcons.campaigns, 
      label: 'Potential Deals', 
      value: '12', 
      change: 33,
      changeLabel: 'vs last month'
    },
    { 
      icon: StatIcons.engagement, 
      label: 'Engagement Rate', 
      value: '5.8%', 
      change: 2.1,
      changeLabel: 'vs last week'
    },
    { 
      icon: <DollarSign className="h-6 w-6 text-amber-500" />, 
      label: 'Total Earnings', 
      value: '$2,450', 
      change: 18,
      changeLabel: 'vs last month'
    }
  ];
  
  // Example business stats data
  const businessStats = [
    { 
      icon: StatIcons.campaigns, 
      label: 'Active Campaigns', 
      value: '3', 
      change: 1,
      changeLabel: 'vs last month'
    },
    { 
      icon: StatIcons.athletes, 
      label: 'Athlete Matches', 
      value: '28', 
      change: 12,
      changeLabel: 'vs last week'
    },
    { 
      icon: <DollarSign className="h-6 w-6 text-amber-500" />, 
      label: 'Budget Utilized', 
      value: '$5,840', 
      change: -8,
      changeLabel: 'remaining'
    }
  ];
  
  // Example admin stats data
  const adminStats = [
    { 
      icon: StatIcons.athletes, 
      label: 'Total Athletes', 
      value: '487', 
      change: 24,
      changeLabel: 'new this month'
    },
    { 
      icon: <Briefcase className="h-6 w-6 text-amber-500" />, 
      label: 'Total Businesses', 
      value: '76', 
      change: 6,
      changeLabel: 'new this month'
    },
    { 
      icon: StatIcons.campaigns, 
      label: 'Active Campaigns', 
      value: '32', 
      change: 15,
      changeLabel: 'vs last month'
    },
    { 
      icon: <MessageSquare className="h-6 w-6 text-amber-500" />, 
      label: 'Support Tickets', 
      value: '14', 
      change: -3,
      changeLabel: 'vs last week'
    }
  ];
  
  // Example compliance stats data
  const complianceStats = [
    { 
      icon: StatIcons.campaigns, 
      label: 'Pending Reviews', 
      value: '18', 
      change: -5,
      changeLabel: 'vs last week'
    },
    { 
      icon: <Users className="h-6 w-6 text-green-500" />, 
      label: 'Approved Deals', 
      value: '43', 
      change: 12,
      changeLabel: 'this month'
    },
    { 
      icon: <Users className="h-6 w-6 text-red-500" />, 
      label: 'Rejected Deals', 
      value: '7', 
      change: -2,
      changeLabel: 'vs last month'
    }
  ];
  
  // Example chart data
  const monthlyEngagementData = [
    { name: 'Jan', instagram: 4000, tiktok: 2400, twitter: 1800 },
    { name: 'Feb', instagram: 3000, tiktok: 1398, twitter: 2000 },
    { name: 'Mar', instagram: 2000, tiktok: 3800, twitter: 2200 },
    { name: 'Apr', instagram: 2780, tiktok: 3908, twitter: 2500 },
    { name: 'May', instagram: 1890, tiktok: 4800, twitter: 2300 },
    { name: 'Jun', instagram: 2390, tiktok: 3800, twitter: 2400 },
    { name: 'Jul', instagram: 3490, tiktok: 4300, twitter: 2100 },
  ];
  
  const monthlyRevenueData = [
    { name: 'Jan', revenue: 1200 },
    { name: 'Feb', revenue: 1900 },
    { name: 'Mar', revenue: 3000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 4000 },
    { name: 'Jun', revenue: 3200 },
    { name: 'Jul', revenue: 5000 },
  ];
  
  const campaignPerformanceData = [
    { name: 'Week 1', impressions: 1200, clicks: 320, conversions: 80 },
    { name: 'Week 2', impressions: 1800, clicks: 490, conversions: 120 },
    { name: 'Week 3', impressions: 2200, clicks: 580, conversions: 160 },
    { name: 'Week 4', impressions: 2800, clicks: 740, conversions: 210 },
  ];
  
  const budgetAllocationData = [
    { name: 'Athlete Payments', value: 68 },
    { name: 'Content Production', value: 12 },
    { name: 'Promotion', value: 8 },
    { name: 'Analytics', value: 6 },
    { name: 'Other', value: 6 },
  ];
  
  const userDistributionData = [
    { name: 'Athletes', value: 487 },
    { name: 'Businesses', value: 76 },
    { name: 'Compliance', value: 14 },
    { name: 'Admins', value: 5 },
  ];
  
  // Example activity data
  const athleteActivities = [
    {
      id: 'act-1',
      type: 'match' as const,
      title: 'New Match Found',
      description: 'You have a new match with SportsBrand Inc. for their summer campaign',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'pending' as const,
      action: {
        label: 'View Match',
        onClick: () => console.log('View match')
      }
    },
    {
      id: 'act-2',
      type: 'message' as const,
      title: 'Message from SportsBrand',
      description: 'We loved your content! Can we discuss the details?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      user: {
        id: 'user-1',
        name: 'Sarah from SportsBrand',
        avatar: 'https://i.pravatar.cc/150?img=32'
      }
    },
    {
      id: 'act-3',
      type: 'payment' as const,
      title: 'Payment Received',
      description: 'Payment of $750 received from FitGear campaign',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      status: 'completed' as const
    }
  ];
  
  const businessActivities = [
    {
      id: 'act-1',
      type: 'campaign' as const,
      title: 'Campaign Launched',
      description: 'Summer Collection campaign is now active',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      status: 'completed' as const
    },
    {
      id: 'act-2',
      type: 'match' as const,
      title: 'Match Accepted',
      description: 'John Smith has accepted your partnership offer',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      user: {
        id: 'user-2',
        name: 'John Smith',
        avatar: 'https://i.pravatar.cc/150?img=68'
      },
      action: {
        label: 'View Details',
        onClick: () => console.log('View match details')
      }
    },
    {
      id: 'act-3',
      type: 'system' as const,
      title: 'Compliance Review',
      description: 'Your campaign has been approved by compliance',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      status: 'completed' as const
    }
  ];
  
  // Example quick actions
  const athleteActions = [
    {
      id: 'action-1',
      label: 'View Matches',
      description: 'See all your potential partnerships',
      icon: <Users className="h-5 w-5" />,
      href: '/matches'
    },
    {
      id: 'action-2',
      label: 'Update Profile',
      description: 'Keep your profile current',
      icon: <Settings className="h-5 w-5" />,
      href: '/profile'
    },
    {
      id: 'action-3',
      label: 'View Analytics',
      description: 'Track your performance',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/analytics'
    },
    {
      id: 'action-4',
      label: 'Messages',
      description: 'Check your conversations',
      icon: <MessageSquare className="h-5 w-5" />,
      href: '/messages'
    }
  ];
  
  const businessActions = [
    {
      id: 'action-1',
      label: 'Create Campaign',
      description: 'Start a new partnership campaign',
      icon: <Plus className="h-5 w-5" />,
      href: '/campaigns/new'
    },
    {
      id: 'action-2',
      label: 'Find Athletes',
      description: 'Browse athlete profiles',
      icon: <Users className="h-5 w-5" />,
      href: '/athletes'
    },
    {
      id: 'action-3',
      label: 'Manage Campaigns',
      description: 'View and edit your campaigns',
      icon: <Briefcase className="h-5 w-5" />,
      href: '/campaigns'
    },
    {
      id: 'action-4',
      label: 'Performance Reports',
      description: 'Analyze campaign results',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/reports'
    }
  ];
  
  const complianceActions = [
    {
      id: 'action-1',
      label: 'Review Matches',
      description: 'Review pending partnerships',
      icon: <Users className="h-5 w-5" />,
      href: '/compliance/matches'
    },
    {
      id: 'action-2',
      label: 'Audit Campaigns',
      description: 'Verify campaign compliance',
      icon: <Briefcase className="h-5 w-5" />,
      href: '/compliance/campaigns'
    },
    {
      id: 'action-3',
      label: 'Generate Reports',
      description: 'Create compliance reports',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/compliance/reports'
    }
  ];
  
  const adminActions = [
    {
      id: 'action-1',
      label: 'User Management',
      description: 'Manage user accounts',
      icon: <Users className="h-5 w-5" />,
      href: '/admin/users'
    },
    {
      id: 'action-2',
      label: 'Platform Settings',
      description: 'Configure system settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/admin/settings'
    },
    {
      id: 'action-3',
      label: 'Reports & Analytics',
      description: 'View platform metrics',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/admin/analytics'
    },
    {
      id: 'action-4',
      label: 'Compliance Overview',
      description: 'Monitor compliance activities',
      icon: <Briefcase className="h-5 w-5" />,
      href: '/admin/compliance'
    }
  ];
  
  // Render the appropriate widgets based on user type
  const renderWidgets = () => {
    if (!dashboardConfig) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {dashboardConfig.widgets
          .filter(widget => widget.visible !== false)
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map(widget => renderWidget(widget))}
      </div>
    );
  };
  
  // Helper function to render the appropriate widget based on config
  const renderWidget = (widget: WidgetConfig) => {
    const { id, type, title, description, size } = widget;
    
    switch (type) {
      case 'stats':
        let statsData;
        switch (userType) {
          case 'athlete':
            statsData = athleteStats;
            break;
          case 'business':
            statsData = businessStats;
            break;
          case 'admin':
            statsData = adminStats;
            break;
          case 'compliance':
            statsData = complianceStats;
            break;
          default:
            statsData = athleteStats;
        }
        
        return (
          <StatsWidget
            key={id}
            id={id}
            title={title}
            description={description}
            size={size}
            stats={statsData}
            columns={userType === 'admin' ? 4 : 3}
            onRemove={() => handleRemoveWidget(id)}
            onResize={(newSize) => handleResizeWidget(id, newSize)}
          />
        );
        
      case 'chart':
        let chartData;
        let chartSeries;
        let chartType: 'area' | 'bar' | 'line' | 'pie' = 'area';
        
        // Determine chart data based on widget ID and user type
        if (id.includes('engagement')) {
          chartData = monthlyEngagementData;
          chartSeries = [
            { 
              name: 'Instagram', 
              dataKey: 'instagram', 
              color: '#E1306C',
              gradient: {
                id: 'instaGradient',
                startColor: '#E1306C',
                endColor: '#405DE6',
                startOpacity: 0.8,
                endOpacity: 0.1
              }
            },
            { 
              name: 'TikTok', 
              dataKey: 'tiktok', 
              color: '#69C9D0',
              gradient: {
                id: 'tiktokGradient',
                startColor: '#69C9D0',
                endColor: '#EE1D52',
                startOpacity: 0.8,
                endOpacity: 0.1
              }
            },
            { 
              name: 'Twitter', 
              dataKey: 'twitter', 
              color: '#1DA1F2',
              gradient: {
                id: 'twitterGradient',
                startColor: '#1DA1F2',
                endColor: '#14171A',
                startOpacity: 0.8,
                endOpacity: 0.1
              }
            }
          ];
          chartType = 'area';
        } else if (id.includes('revenue')) {
          chartData = monthlyRevenueData;
          chartSeries = [
            { 
              name: 'Revenue', 
              dataKey: 'revenue', 
              color: '#22c55e',
              gradient: {
                id: 'revenueGradient',
                startColor: '#22c55e',
                endColor: '#14532d',
                startOpacity: 0.8,
                endOpacity: 0.1
              }
            }
          ];
          chartType = 'area';
        } else if (id.includes('performance')) {
          chartData = campaignPerformanceData;
          chartSeries = [
            { name: 'Impressions', dataKey: 'impressions', color: '#60a5fa' },
            { name: 'Clicks', dataKey: 'clicks', color: '#f59e0b' },
            { name: 'Conversions', dataKey: 'conversions', color: '#10b981' }
          ];
          chartType = 'bar';
        } else if (id.includes('budget')) {
          chartData = budgetAllocationData;
          chartSeries = [
            { name: 'Budget', dataKey: 'value', color: '#f59e0b' },
            { name: 'Athlete Payments', dataKey: 'value', color: '#f87171' },
            { name: 'Content Production', dataKey: 'value', color: '#60a5fa' },
            { name: 'Promotion', dataKey: 'value', color: '#4ade80' },
            { name: 'Analytics', dataKey: 'value', color: '#a78bfa' }
          ];
          chartType = 'pie';
        } else if (id.includes('distribution')) {
          chartData = userDistributionData;
          chartSeries = [
            { name: 'Users', dataKey: 'value', color: '#f87171' },
            { name: 'Athletes', dataKey: 'value', color: '#60a5fa' },
            { name: 'Businesses', dataKey: 'value', color: '#a78bfa' },
            { name: 'Compliance', dataKey: 'value', color: '#4ade80' }
          ];
          chartType = 'pie';
        } else {
          // Default chart data
          chartData = monthlyEngagementData;
          chartSeries = [
            { name: 'Engagement', dataKey: 'instagram', color: '#f59e0b' }
          ];
        }
        
        return (
          <ChartWidget
            key={id}
            id={id}
            title={title}
            description={description}
            size={size}
            chartType={chartType}
            data={chartData}
            series={chartSeries}
            onRemove={() => handleRemoveWidget(id)}
            onResize={(newSize) => handleResizeWidget(id, newSize)}
          />
        );
        
      case 'activity':
        return (
          <ActivityWidget
            key={id}
            id={id}
            title={title}
            description={description}
            size={size}
            activities={userType === 'business' ? businessActivities : athleteActivities}
            maxItems={widget.settings?.maxItems || 5}
            onRemove={() => handleRemoveWidget(id)}
            onResize={(newSize) => handleResizeWidget(id, newSize)}
          />
        );
        
      case 'quickActions':
        let actions;
        
        switch (userType) {
          case 'athlete':
            actions = athleteActions;
            break;
          case 'business':
            actions = businessActions;
            break;
          case 'admin':
            actions = adminActions;
            break;
          case 'compliance':
            actions = complianceActions;
            break;
          default:
            actions = athleteActions;
        }
        
        return (
          <QuickActionsWidget
            key={id}
            id={id}
            title={title}
            description={description}
            size={size}
            actions={actions}
            layout={widget.settings?.layout || 'grid'}
            columns={widget.settings?.columns || 2}
            onRemove={() => handleRemoveWidget(id)}
            onResize={(newSize) => handleResizeWidget(id, newSize)}
          />
        );
        
      default:
        return (
          <DashboardWidget
            key={id}
            id={id}
            title={title}
            description={description}
            size={size}
            onRemove={() => handleRemoveWidget(id)}
            onResize={(newSize) => handleResizeWidget(id, newSize)}
          >
            <div className="p-4 text-center text-gray-400">
              Unknown widget type: {type}
            </div>
          </DashboardWidget>
        );
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        
        <div className="flex gap-2">
          <Button variant="outline" className="bg-zinc-900/70 border-zinc-700">
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="bg-zinc-900/50 border border-zinc-800">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-500"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className="data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-500"
          >
            Performance
          </TabsTrigger>
          {userType === 'business' && (
            <TabsTrigger 
              value="campaigns" 
              className="data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-500"
            >
              Campaigns
            </TabsTrigger>
          )}
          {userType === 'athlete' && (
            <TabsTrigger 
              value="partnerships" 
              className="data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-500"
            >
              Partnerships
            </TabsTrigger>
          )}
          {(userType === 'admin' || userType === 'compliance') && (
            <TabsTrigger 
              value="reports" 
              className="data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-500"
            >
              Reports
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {renderWidgets()}
        </TabsContent>
        
        <TabsContent value="performance" className="mt-6">
          <div className="text-center text-gray-400 py-12">
            <Zap className="h-12 w-12 mx-auto mb-4 text-amber-500 opacity-50" />
            <h3 className="text-xl font-medium mb-2">Performance Dashboard Coming Soon</h3>
            <p>Detailed analytics and performance metrics will be available here.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="campaigns" className="mt-6">
          <div className="text-center text-gray-400 py-12">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-amber-500 opacity-50" />
            <h3 className="text-xl font-medium mb-2">Campaign Dashboard Coming Soon</h3>
            <p>Detailed campaign metrics and management will be available here.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="partnerships" className="mt-6">
          <div className="text-center text-gray-400 py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-amber-500 opacity-50" />
            <h3 className="text-xl font-medium mb-2">Partnerships Dashboard Coming Soon</h3>
            <p>Detailed partnership metrics and management will be available here.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="reports" className="mt-6">
          <div className="text-center text-gray-400 py-12">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-amber-500 opacity-50" />
            <h3 className="text-xl font-medium mb-2">Reports Dashboard Coming Soon</h3>
            <p>Detailed reports and administrative controls will be available here.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;