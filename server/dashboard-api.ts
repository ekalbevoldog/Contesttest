import { Express, Request, Response, Router } from 'express';
import { storage } from './storage';
import { 
  DashboardConfig, 
  StatsData, 
  ChartData, 
  ActivityData, 
  QuickActionsData,
  DashboardPreferences
} from '../shared/dashboard-schema';

// Create dashboard router
const dashboardRouter = Router();

/**
 * Dashboard API module
 * Handles all dashboard-related API routes
 */

// Get the user's dashboard configuration
async function getDashboardConfig(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id.toString();
    const userType = req.user.role;

    // Try to get saved dashboard configuration from database
    const preferences = await storage.getUserPreferences(userId, 'dashboard');
    
    // If no saved configuration, return default based on user type
    if (!preferences || !preferences.data) {
      const defaultConfig = getDefaultDashboardConfig(userType);
      return res.json(defaultConfig);
    }
    
    // Return saved configuration
    return res.json(preferences.data as DashboardConfig);
  } catch (error) {
    console.error('Error getting dashboard config:', error);
    return res.status(500).json({ error: 'Failed to get dashboard configuration' });
  }
}

// Save the user's dashboard configuration
async function saveDashboardConfig(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id.toString();
    const dashboardConfig = req.body as DashboardConfig;

    // Validate the config
    if (!dashboardConfig || !dashboardConfig.widgets || !Array.isArray(dashboardConfig.widgets)) {
      return res.status(400).json({ error: 'Invalid dashboard configuration' });
    }

    // Create or update user preferences
    await storage.saveUserPreferences({
      user_id: userId,
      preference_type: 'dashboard',
      data: dashboardConfig
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving dashboard config:', error);
    return res.status(500).json({ error: 'Failed to save dashboard configuration' });
  }
}

// Update a specific widget
async function updateWidget(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id.toString();
    const widgetId = req.params.widgetId;
    const updates = req.body;

    // Validate input
    if (!widgetId || !updates) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Get current dashboard config
    const preferences = await storage.getUserPreferences(userId, 'dashboard');
    if (!preferences || !preferences.data) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }

    const dashboardConfig = preferences.data as DashboardConfig;
    
    // Find and update the widget
    const widgetIndex = dashboardConfig.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    // Apply updates to the widget
    dashboardConfig.widgets[widgetIndex] = {
      ...dashboardConfig.widgets[widgetIndex],
      ...updates
    };

    // Save updated config
    await storage.saveUserPreferences({
      user_id: userId,
      preference_type: 'dashboard',
      data: dashboardConfig
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating widget:', error);
    return res.status(500).json({ error: 'Failed to update widget' });
  }
}

// Remove a widget from the dashboard
async function removeWidget(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id.toString();
    const widgetId = req.params.widgetId;

    // Validate input
    if (!widgetId) {
      return res.status(400).json({ error: 'Widget ID is required' });
    }

    // Get current dashboard config
    const preferences = await storage.getUserPreferences(userId, 'dashboard');
    if (!preferences || !preferences.data) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }

    const dashboardConfig = preferences.data as DashboardConfig;
    
    // Remove the widget
    dashboardConfig.widgets = dashboardConfig.widgets.filter(w => w.id !== widgetId);

    // Save updated config
    await storage.saveUserPreferences({
      user_id: userId,
      preference_type: 'dashboard',
      data: dashboardConfig
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error removing widget:', error);
    return res.status(500).json({ error: 'Failed to remove widget' });
  }
}

// Get data for stats widget
async function getStatsData(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id.toString();
    const userType = req.user.role;

    // Generate stats data based on user type
    let statsData: StatsData = { items: [] };

    switch(userType) {
      case 'business':
        statsData = await getBusinessStats(userId);
        break;
      case 'athlete':
        statsData = await getAthleteStats(userId);
        break;
      case 'admin':
        statsData = await getAdminStats();
        break;
      case 'compliance':
        statsData = await getComplianceStats();
        break;
      default:
        statsData = {
          items: [
            {
              key: 'welcome',
              label: 'Welcome',
              value: 'Please complete your profile',
              icon: 'user',
              color: 'blue'
            }
          ]
        };
    }

    return res.json(statsData);
  } catch (error) {
    console.error('Error getting stats data:', error);
    return res.status(500).json({ error: 'Failed to get stats data' });
  }
}

// Get data for chart widget
async function getChartData(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id.toString();
    const userType = req.user.role;
    const dataSource = req.params.dataSource;

    // Generate chart data based on user type and data source
    let chartData: ChartData;

    switch(dataSource) {
      case 'campaigns':
        chartData = await getCampaignPerformanceData(userId, userType);
        break;
      case 'engagement':
        chartData = await getEngagementData(userId, userType);
        break;
      case 'users':
        chartData = await getUserGrowthData();
        break;
      case 'userTypes':
        chartData = await getUserDistributionData();
        break;
      case 'sponsors':
        chartData = await getSponsorshipData(userId);
        break;
      case 'budget':
        chartData = await getBudgetData(userId);
        break;
      default:
        chartData = {
          data: [],
          series: []
        };
    }

    return res.json(chartData);
  } catch (error) {
    console.error('Error getting chart data:', error);
    return res.status(500).json({ error: 'Failed to get chart data' });
  }
}

// Get data for activity widget
async function getActivityData(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id.toString();
    const userType = req.user.role;

    // Get activities based on user type
    let activityData: ActivityData = [];

    switch(userType) {
      case 'business':
        activityData = await getBusinessActivities(userId);
        break;
      case 'athlete':
        activityData = await getAthleteActivities(userId);
        break;
      case 'admin':
        activityData = await getAdminActivities();
        break;
      case 'compliance':
        activityData = await getComplianceActivities();
        break;
      default:
        activityData = [];
    }

    return res.json(activityData);
  } catch (error) {
    console.error('Error getting activity data:', error);
    return res.status(500).json({ error: 'Failed to get activity data' });
  }
}

// Get data for quick actions widget
async function getQuickActionsData(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userType = req.user.role;

    // Get quick actions based on user type
    const quickActions = getDefaultQuickActions(userType);

    return res.json(quickActions);
  } catch (error) {
    console.error('Error getting quick actions data:', error);
    return res.status(500).json({ error: 'Failed to get quick actions data' });
  }
}

// Data generator functions
async function getBusinessStats(userId: string): Promise<StatsData> {
  // Here we would fetch real stats from the database
  // For now, we'll return some sample data
  return {
    items: [
      {
        key: 'campaigns',
        label: 'Active Campaigns',
        value: '4',
        icon: 'bar-chart',
        color: 'blue',
        trend: 'up',
        change: 12
      },
      {
        key: 'matches',
        label: 'Potential Matches',
        value: '18',
        icon: 'users',
        color: 'indigo',
        trend: 'up',
        change: 8
      },
      {
        key: 'conversions',
        label: 'Partnerships',
        value: '7',
        icon: 'handshake',
        color: 'emerald',
        trend: 'up',
        change: 5
      },
      {
        key: 'budget',
        label: 'Budget Utilization',
        value: '68%',
        icon: 'trending-up',
        color: 'amber',
        trend: 'neutral',
        change: 0
      }
    ]
  };
}

async function getAthleteStats(userId: string): Promise<StatsData> {
  // Get athlete-specific stats
  return {
    items: [
      {
        key: 'offers',
        label: 'Partnership Offers',
        value: '5',
        icon: 'mail',
        color: 'blue',
        trend: 'up',
        change: 20
      },
      {
        key: 'matches',
        label: 'Brand Matches',
        value: '12',
        icon: 'thumbs-up',
        color: 'indigo',
        trend: 'up',
        change: 4
      },
      {
        key: 'partnerships',
        label: 'Active Partnerships',
        value: '3',
        icon: 'handshake',
        color: 'emerald',
        trend: 'up',
        change: 33
      },
      {
        key: 'earnings',
        label: 'Q1 Earnings',
        value: '$2,450',
        icon: 'trending-up',
        color: 'emerald',
        trend: 'up',
        change: 12
      }
    ]
  };
}

async function getAdminStats(): Promise<StatsData> {
  // Get admin-specific stats
  return {
    items: [
      {
        key: 'total-users',
        label: 'Total Users',
        value: '1,284',
        icon: 'users',
        color: 'blue',
        trend: 'up',
        change: 8
      },
      {
        key: 'active-campaigns',
        label: 'Active Campaigns',
        value: '48',
        icon: 'clipboard',
        color: 'indigo',
        trend: 'up',
        change: 12
      },
      {
        key: 'partnerships',
        label: 'Total Partnerships',
        value: '156',
        icon: 'handshake',
        color: 'emerald',
        trend: 'up',
        change: 15
      },
      {
        key: 'compliance-rate',
        label: 'Compliance Rate',
        value: '92%',
        icon: 'check-circle',
        color: 'emerald',
        trend: 'up',
        change: 2
      }
    ]
  };
}

async function getComplianceStats(): Promise<StatsData> {
  // Get compliance-specific stats
  return {
    items: [
      {
        key: 'pending-reviews',
        label: 'Pending Reviews',
        value: '24',
        icon: 'clock',
        color: 'amber',
        trend: 'up',
        change: 5
      },
      {
        key: 'completed-reviews',
        label: 'Reviews Completed',
        value: '187',
        icon: 'check-circle',
        color: 'emerald',
        trend: 'up',
        change: 14
      },
      {
        key: 'flagged-content',
        label: 'Flagged Content',
        value: '8',
        icon: 'alert-triangle',
        color: 'red',
        trend: 'down',
        change: -10
      },
      {
        key: 'avg-review-time',
        label: 'Avg. Review Time',
        value: '1.2 days',
        icon: 'clock',
        color: 'blue',
        trend: 'down',
        change: -8
      }
    ]
  };
}

// Chart data generator functions
async function getCampaignPerformanceData(userId: string, userType: string): Promise<ChartData> {
  // Generate campaign performance data for businesses
  return {
    data: [
      { month: 'Jan', impressions: 2400, engagement: 240, conversions: 24 },
      { month: 'Feb', impressions: 3600, engagement: 380, conversions: 38 },
      { month: 'Mar', impressions: 2900, engagement: 310, conversions: 31 },
      { month: 'Apr', impressions: 3800, engagement: 420, conversions: 42 },
      { month: 'May', impressions: 4200, engagement: 460, conversions: 46 },
      { month: 'Jun', impressions: 5000, engagement: 550, conversions: 55 }
    ],
    series: ['impressions', 'engagement', 'conversions'],
    xAxis: 'month'
  };
}

async function getEngagementData(userId: string, userType: string): Promise<ChartData> {
  // Generate engagement data for athletes
  return {
    data: [
      { date: 'Mon', views: 120, likes: 45, shares: 12 },
      { date: 'Tue', views: 180, likes: 56, shares: 18 },
      { date: 'Wed', views: 150, likes: 48, shares: 15 },
      { date: 'Thu', views: 210, likes: 65, shares: 20 },
      { date: 'Fri', views: 290, likes: 80, shares: 28 },
      { date: 'Sat', views: 380, likes: 110, shares: 45 },
      { date: 'Sun', views: 320, likes: 94, shares: 35 }
    ],
    series: ['views', 'likes', 'shares'],
    xAxis: 'date'
  };
}

async function getUserGrowthData(): Promise<ChartData> {
  // Generate user growth data for admins
  return {
    data: [
      { month: 'Jan', athletes: 120, businesses: 45 },
      { month: 'Feb', athletes: 150, businesses: 52 },
      { month: 'Mar', athletes: 180, businesses: 60 },
      { month: 'Apr', athletes: 220, businesses: 70 },
      { month: 'May', athletes: 280, businesses: 82 },
      { month: 'Jun', athletes: 340, businesses: 95 }
    ],
    series: ['athletes', 'businesses'],
    xAxis: 'month'
  };
}

async function getUserDistributionData(): Promise<ChartData> {
  // Generate user distribution data for admins
  return {
    data: [
      { name: 'Athletes', value: 620 },
      { name: 'Businesses', value: 210 },
      { name: 'Compliance', value: 15 },
      { name: 'Admins', value: 5 }
    ],
    series: ['value'],
    xAxis: 'name'
  };
}

async function getSponsorshipData(userId: string): Promise<ChartData> {
  // Generate sponsorship data for athletes
  return {
    data: [
      { name: 'Product', value: 45 },
      { name: 'Monetary', value: 30 },
      { name: 'Affiliate', value: 15 },
      { name: 'Hybrid', value: 10 }
    ],
    series: ['value'],
    xAxis: 'name'
  };
}

async function getBudgetData(userId: string): Promise<ChartData> {
  // Generate budget data for businesses
  return {
    data: [
      { name: 'Campaign A', value: 4000 },
      { name: 'Campaign B', value: 3000 },
      { name: 'Campaign C', value: 2000 },
      { name: 'Campaign D', value: 1000 }
    ],
    series: ['value'],
    xAxis: 'name'
  };
}

// Activity data generator functions
async function getBusinessActivities(userId: string): Promise<ActivityData> {
  // Generate business activities
  return [
    {
      id: '1',
      title: 'New Match Found',
      description: 'A new athlete match has been found for your Campaign A',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      type: 'notification',
      status: 'success',
      link: '/business/matches'
    },
    {
      id: '2',
      title: 'Partnership Offer Accepted',
      description: 'John Doe has accepted your partnership offer',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      type: 'notification',
      status: 'success',
      link: '/business/partnerships'
    },
    {
      id: '3',
      title: 'Campaign Performance Update',
      description: 'Your Campaign A has reached 3,000 impressions',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      type: 'notification',
      status: 'info',
      link: '/business/campaigns/1'
    },
    {
      id: '4',
      title: 'Content Approval Required',
      description: 'Sarah Smith has submitted content for your review',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      type: 'notification',
      status: 'warning',
      link: '/business/content'
    },
    {
      id: '5',
      title: 'Campaign Budget Alert',
      description: 'Campaign B is at 80% of its allocated budget',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      type: 'notification',
      status: 'warning',
      link: '/business/campaigns/2'
    }
  ];
}

async function getAthleteActivities(userId: string): Promise<ActivityData> {
  // Generate athlete activities
  return [
    {
      id: '1',
      title: 'New Partnership Offer',
      description: 'You have received a new partnership offer from Acme Sports',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      type: 'notification',
      status: 'info',
      link: '/athlete/offers'
    },
    {
      id: '2',
      title: 'Content Approval',
      description: 'Your content for ABC Brands has been approved',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      type: 'notification',
      status: 'success',
      link: '/athlete/content'
    },
    {
      id: '3',
      title: 'Payment Received',
      description: 'You have received a payment of $450 from XYZ Company',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10), // 10 hours ago
      type: 'notification',
      status: 'success',
      link: '/athlete/payments'
    },
    {
      id: '4',
      title: 'Content Update Required',
      description: 'Your recent submission requires some changes',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      type: 'notification',
      status: 'warning',
      link: '/athlete/content'
    },
    {
      id: '5',
      title: 'New Brand Match',
      description: 'Your profile matches with 3 new brands',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      type: 'notification',
      status: 'info',
      link: '/athlete/matches'
    }
  ];
}

async function getAdminActivities(): Promise<ActivityData> {
  // Generate admin activities
  return [
    {
      id: '1',
      title: 'New User Registration',
      description: 'A new business user has registered: Tech Innovations Inc.',
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      type: 'user',
      status: 'info',
      link: '/admin/users'
    },
    {
      id: '2',
      title: 'System Alert',
      description: 'Storage usage at 75% of allocated capacity',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      type: 'warning',
      status: 'warning',
      link: '/admin/system'
    },
    {
      id: '3',
      title: 'Compliance Flag',
      description: 'A partnership has been flagged for compliance review',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      type: 'warning',
      status: 'warning',
      link: '/admin/compliance'
    },
    {
      id: '4',
      title: 'Billing Update',
      description: 'Monthly billing cycle completed successfully',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      type: 'notification',
      status: 'success',
      link: '/admin/billing'
    },
    {
      id: '5',
      title: 'New Feature Deployed',
      description: 'Enhanced analytics dashboard is now live',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      type: 'notification',
      status: 'success',
      link: '/admin/system'
    }
  ];
}

async function getComplianceActivities(): Promise<ActivityData> {
  // Generate compliance activities
  return [
    {
      id: '1',
      title: 'New Review Required',
      description: 'Partnership between Acme Inc. and John Doe needs review',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      type: 'notification',
      status: 'info',
      link: '/compliance/reviews'
    },
    {
      id: '2',
      title: 'Content Flagged',
      description: 'Content submission has been flagged for inappropriate material',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      type: 'warning',
      status: 'warning',
      link: '/compliance/content'
    },
    {
      id: '3',
      title: 'Guideline Update',
      description: 'Sponsorship guidelines have been updated',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      type: 'notification',
      status: 'info',
      link: '/compliance/guidelines'
    },
    {
      id: '4',
      title: 'Review Completed',
      description: 'You have completed 12 reviews today',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      type: 'notification',
      status: 'success'
    },
    {
      id: '5',
      title: 'Escalation Required',
      description: 'A complex case requires management review',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      type: 'warning',
      status: 'warning',
      link: '/compliance/escalations'
    }
  ];
}

// Default dashboard config and quick actions
function getDefaultDashboardConfig(userType: string) {
  // Create default dashboard configuration based on user type
  // This would normally come from a database or config file
  return {
    widgets: [
      {
        id: 'stats-1',
        type: 'stats',
        title: 'Key Metrics',
        description: 'Overview of your performance metrics',
        size: 'lg',
        position: 0,
        visible: true
      },
      {
        id: 'chart-1',
        type: 'chart',
        title: 'Performance Trends',
        description: 'Visualize your data over time',
        size: 'md',
        position: 1,
        settings: {
          chartType: 'line',
          dataSource: userType === 'business' ? 'campaigns' : 'engagement',
          showLegend: true
        },
        visible: true
      },
      {
        id: 'activity-1',
        type: 'activity',
        title: 'Recent Activity',
        description: 'Latest updates and notifications',
        size: 'md',
        position: 2,
        settings: {
          maxItems: 5
        },
        visible: true
      },
      {
        id: 'quick-actions-1',
        type: 'quickActions',
        title: 'Quick Actions',
        description: 'Common tasks and shortcuts',
        size: 'sm',
        position: 3,
        visible: true
      }
    ],
    layout: 'grid'
  };
}

function getDefaultQuickActions(userType: string) {
  // Create default quick actions based on user type
  switch (userType) {
    case 'business':
      return [
        {
          id: 'create-campaign',
          label: 'Create Campaign',
          description: 'Start a new marketing campaign',
          icon: 'FilePlus',
          color: 'blue',
          link: '/business/campaigns/new'
        },
        {
          id: 'browse-athletes',
          label: 'Browse Athletes',
          description: 'Discover potential partnerships',
          icon: 'Users',
          color: 'indigo',
          link: '/business/athletes'
        },
        {
          id: 'manage-offers',
          label: 'Manage Offers',
          description: 'View and edit your active offers',
          icon: 'ClipboardList',
          color: 'amber',
          link: '/business/offers'
        }
      ];
    case 'athlete':
      return [
        {
          id: 'view-offers',
          label: 'View Offers',
          description: 'See your partnership opportunities',
          icon: 'Mail',
          color: 'blue',
          link: '/athlete/offers'
        },
        {
          id: 'update-profile',
          label: 'Update Profile',
          description: 'Keep your information current',
          icon: 'UserCircle',
          color: 'indigo',
          link: '/athlete/profile'
        },
        {
          id: 'view-partnerships',
          label: 'View Partnerships',
          description: 'Manage your active partnerships',
          icon: 'Handshake',
          color: 'emerald',
          link: '/athlete/partnerships'
        }
      ];
    case 'admin':
      return [
        {
          id: 'user-management',
          label: 'User Management',
          description: 'Manage user accounts and access',
          icon: 'Users',
          color: 'blue',
          link: '/admin/users'
        },
        {
          id: 'content-moderation',
          label: 'Content Moderation',
          description: 'Review reported content',
          icon: 'Shield',
          color: 'red',
          link: '/admin/moderation'
        },
        {
          id: 'system-settings',
          label: 'System Settings',
          description: 'Configure application settings',
          icon: 'Settings',
          color: 'gray',
          link: '/admin/settings'
        }
      ];
    case 'compliance':
      return [
        {
          id: 'pending-reviews',
          label: 'Pending Reviews',
          description: 'Review partnerships awaiting approval',
          icon: 'ClipboardCheck',
          color: 'amber',
          link: '/compliance/reviews'
        },
        {
          id: 'content-reports',
          label: 'Content Reports',
          description: 'Investigate reported content',
          icon: 'Flag',
          color: 'red',
          link: '/compliance/reports'
        },
        {
          id: 'audit-log',
          label: 'Audit Log',
          description: 'View system activity history',
          icon: 'History',
          color: 'blue',
          link: '/compliance/audit'
        }
      ];
    default:
      return [];
  }
}

// Register all dashboard API routes on the router
// Dashboard configuration routes
dashboardRouter.get('/api/dashboard', getDashboardConfig);
dashboardRouter.post('/api/dashboard', saveDashboardConfig);
dashboardRouter.patch('/api/dashboard/widgets/:widgetId', updateWidget);
dashboardRouter.delete('/api/dashboard/widgets/:widgetId', removeWidget);

// Widget data routes
dashboardRouter.get('/api/dashboard/data/stats', getStatsData);
dashboardRouter.get('/api/dashboard/data/:dataSource', getChartData);
dashboardRouter.get('/api/dashboard/data/activities', getActivityData);
dashboardRouter.get('/api/dashboard/data/quickActions', getQuickActionsData);

// Export the router as default
export default dashboardRouter;