import { Router, Request, Response } from 'express';
import { storage } from './storage';
import { DashboardConfig, StatsData, ChartData, ActivityData, QuickActionsData } from '../shared/dashboard-schema';
import { v4 as uuidv4 } from 'uuid';

// Create dashboard router
export const dashboardRouter = Router();

// Helper function to get user ID from request
function getUserId(req: Request): string {
  if (!req.isAuthenticated() || !req.user) {
    return '';
  }
  return req.user.id.toString();
}

// Helper function to get user type/role from request
function getUserType(req: Request): string {
  if (!req.isAuthenticated() || !req.user) {
    return 'unknown';
  }
  return req.user.role;
}

// Get dashboard configuration
dashboardRouter.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = getUserId(req);
    const userType = getUserType(req);
    
    // Get user's dashboard preferences from storage
    const preferences = await storage.getUserPreferences(userId, 'dashboard');
    
    if (preferences && preferences.data) {
      console.log('Found existing dashboard preferences for user', userId);
      return res.json(preferences.data);
    }
    
    // If no preferences found, create default configuration based on user type
    console.log('Creating default dashboard config for', userType);
    const defaultConfig = getDefaultDashboardConfig(userType);
    
    // Save default config for future use
    await storage.saveUserPreferences({
      user_id: userId,
      preference_type: 'dashboard',
      data: defaultConfig
    });
    
    return res.json(defaultConfig);
  } catch (error) {
    console.error('Error retrieving dashboard config:', error);
    res.status(500).json({ error: 'Error retrieving dashboard configuration' });
  }
});

// Save dashboard configuration
dashboardRouter.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = getUserId(req);
    const config: DashboardConfig = req.body;
    
    await storage.saveUserPreferences({
      user_id: userId,
      preference_type: 'dashboard',
      data: config
    });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error saving dashboard config:', error);
    res.status(500).json({ error: 'Error saving dashboard configuration' });
  }
});

// Update a specific widget
dashboardRouter.patch('/widgets/:widgetId', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = getUserId(req);
    const widgetId = req.params.widgetId;
    const updates = req.body;
    
    // Get current dashboard config
    const preferences = await storage.getUserPreferences(userId, 'dashboard');
    
    if (!preferences || !preferences.data || !preferences.data.widgets) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    const config: DashboardConfig = preferences.data;
    
    // Find and update the widget
    const widgetIndex = config.widgets.findIndex(widget => widget.id === widgetId);
    
    if (widgetIndex === -1) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Update the widget with the new values
    config.widgets[widgetIndex] = {
      ...config.widgets[widgetIndex],
      ...updates
    };
    
    // Save updated config
    await storage.saveUserPreferences({
      user_id: userId,
      preference_type: 'dashboard',
      data: config
    });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating widget:', error);
    res.status(500).json({ error: 'Error updating widget' });
  }
});

// Delete a specific widget
dashboardRouter.delete('/widgets/:widgetId', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = getUserId(req);
    const widgetId = req.params.widgetId;
    
    // Get current dashboard config
    const preferences = await storage.getUserPreferences(userId, 'dashboard');
    
    if (!preferences || !preferences.data || !preferences.data.widgets) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    const config: DashboardConfig = preferences.data;
    
    // Remove the widget from the config
    config.widgets = config.widgets.filter(widget => widget.id !== widgetId);
    
    // Save updated config
    await storage.saveUserPreferences({
      user_id: userId,
      preference_type: 'dashboard',
      data: config
    });
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error removing widget:', error);
    res.status(500).json({ error: 'Error removing widget' });
  }
});

// Get stats data
dashboardRouter.get('/data/stats', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userType = getUserType(req);
    const data = await getStatsData(userType, req);
    
    return res.json(data);
  } catch (error) {
    console.error('Error retrieving stats data:', error);
    res.status(500).json({ error: 'Error retrieving stats data' });
  }
});

// Get activities data
dashboardRouter.get('/data/activities', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userType = getUserType(req);
    const data = await getActivityData(userType, req);
    
    return res.json(data);
  } catch (error) {
    console.error('Error retrieving activity data:', error);
    res.status(500).json({ error: 'Error retrieving activity data' });
  }
});

// Get quick actions data
dashboardRouter.get('/data/quickActions', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userType = getUserType(req);
    const data = await getQuickActionsData(userType, req);
    
    return res.json(data);
  } catch (error) {
    console.error('Error retrieving quick actions data:', error);
    res.status(500).json({ error: 'Error retrieving quick actions data' });
  }
});

// Get chart data for specific charts
dashboardRouter.get('/data/:dataSource', async (req: Request, res: Response) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dataSource = req.params.dataSource;
    const userType = getUserType(req);
    const data = await getChartData(dataSource, userType, req);
    
    return res.json(data);
  } catch (error) {
    console.error(`Error retrieving chart data for ${req.params.dataSource}:`, error);
    res.status(500).json({ error: `Error retrieving chart data for ${req.params.dataSource}` });
  }
});

// Helper functions to generate data
async function getStatsData(userType: string, req: Request): Promise<StatsData> {
  const userId = getUserId(req);
  
  switch (userType) {
    case 'athlete':
      return {
        items: [
          {
            key: 'matches',
            label: 'Potential Matches',
            value: await getAthleteMatchCount(userId),
            icon: 'Users',
            color: 'blue',
            trend: 'up',
            change: 12
          },
          {
            key: 'offers',
            label: 'Partnership Offers',
            value: await getAthleteOfferCount(userId),
            icon: 'Mail',
            color: 'green',
            trend: 'up',
            change: 3
          },
          {
            key: 'active',
            label: 'Active Partnerships',
            value: await getAthleteActivePartnerships(userId),
            icon: 'Handshake',
            color: 'indigo',
            trend: 'neutral',
            change: 0
          },
          {
            key: 'earnings',
            label: 'Est. Earnings',
            value: await getAthleteEarnings(userId),
            icon: 'DollarSign',
            color: 'green',
            trend: 'up',
            change: 15
          }
        ]
      };
    case 'business':
      return {
        items: [
          {
            key: 'campaigns',
            label: 'Active Campaigns',
            value: await getBusinessCampaignCount(userId),
            icon: 'Megaphone',
            color: 'blue',
            trend: 'neutral',
            change: 0
          },
          {
            key: 'matches',
            label: 'Potential Athletes',
            value: await getBusinessMatchCount(userId),
            icon: 'Users',
            color: 'indigo',
            trend: 'up',
            change: 8
          },
          {
            key: 'partnerships',
            label: 'Active Partnerships',
            value: await getBusinessPartnershipCount(userId),
            icon: 'Handshake',
            color: 'green',
            trend: 'up',
            change: 2
          },
          {
            key: 'budget',
            label: 'Budget Used',
            value: await getBusinessBudgetUsed(userId),
            icon: 'Wallet',
            color: 'amber',
            trend: 'up',
            change: 5
          }
        ]
      };
    case 'compliance':
      return {
        items: [
          {
            key: 'pending',
            label: 'Pending Reviews',
            value: await getCompliancePendingCount(),
            icon: 'ClipboardCheck',
            color: 'amber',
            trend: 'up',
            change: 4
          },
          {
            key: 'approved',
            label: 'Approved This Week',
            value: await getComplianceApprovedCount(),
            icon: 'CheckCircle',
            color: 'green',
            trend: 'up',
            change: 12
          },
          {
            key: 'rejected',
            label: 'Rejected This Week',
            value: await getComplianceRejectedCount(),
            icon: 'XCircle',
            color: 'red',
            trend: 'down',
            change: 2
          },
          {
            key: 'time',
            label: 'Avg. Review Time',
            value: '1.2 days',
            icon: 'Clock',
            color: 'blue',
            trend: 'down',
            change: 8
          }
        ]
      };
    case 'admin':
      return {
        items: [
          {
            key: 'users',
            label: 'Total Users',
            value: await getAdminUserCount(),
            icon: 'Users',
            color: 'blue',
            trend: 'up',
            change: 15
          },
          {
            key: 'businesses',
            label: 'Businesses',
            value: await getAdminBusinessCount(),
            icon: 'Building',
            color: 'indigo',
            trend: 'up',
            change: 5
          },
          {
            key: 'athletes',
            label: 'Athletes',
            value: await getAdminAthleteCount(),
            icon: 'UserCircle',
            color: 'green',
            trend: 'up',
            change: 10
          },
          {
            key: 'partnerships',
            label: 'Partnerships',
            value: await getAdminPartnershipCount(),
            icon: 'Handshake',
            color: 'amber',
            trend: 'up',
            change: 12
          }
        ]
      };
    default:
      return { items: [] };
  }
}

async function getChartData(dataSource: string, userType: string, req: Request): Promise<ChartData> {
  const userId = getUserId(req);
  
  switch (dataSource) {
    case 'engagement':
      return {
        data: [
          { date: '2023-01', views: 450, clicks: 120, shares: 30 },
          { date: '2023-02', views: 580, clicks: 160, shares: 40 },
          { date: '2023-03', views: 610, clicks: 180, shares: 45 },
          { date: '2023-04', views: 750, clicks: 220, shares: 60 },
          { date: '2023-05', views: 820, clicks: 250, shares: 70 },
          { date: '2023-06', views: 950, clicks: 290, shares: 85 }
        ],
        series: ['views', 'clicks', 'shares'],
        xAxis: 'date',
        yAxis: 'count'
      };
    case 'campaigns':
      return {
        data: [
          { month: 'Jan', spending: 2000, roi: 1.2, partnerships: 5 },
          { month: 'Feb', spending: 2500, roi: 1.3, partnerships: 6 },
          { month: 'Mar', spending: 3000, roi: 1.4, partnerships: 7 },
          { month: 'Apr', spending: 2800, roi: 1.5, partnerships: 8 },
          { month: 'May', spending: 3200, roi: 1.6, partnerships: 9 },
          { month: 'Jun', spending: 3500, roi: 1.7, partnerships: 10 }
        ],
        series: ['spending', 'roi', 'partnerships'],
        xAxis: 'month',
        yAxis: 'value'
      };
    case 'offers':
      return {
        data: [
          { month: 'Jan', received: 10, accepted: 5, rejected: 2 },
          { month: 'Feb', received: 12, accepted: 6, rejected: 3 },
          { month: 'Mar', received: 15, accepted: 7, rejected: 2 },
          { month: 'Apr', received: 18, accepted: 8, rejected: 4 },
          { month: 'May', received: 20, accepted: 10, rejected: 3 },
          { month: 'Jun', received: 22, accepted: 12, rejected: 2 }
        ],
        series: ['received', 'accepted', 'rejected'],
        xAxis: 'month',
        yAxis: 'count'
      };
    case 'compliance':
      return {
        data: [
          { month: 'Jan', reviewed: 45, approved: 35, rejected: 10 },
          { month: 'Feb', reviewed: 50, approved: 40, rejected: 10 },
          { month: 'Mar', reviewed: 60, approved: 48, rejected: 12 },
          { month: 'Apr', reviewed: 65, approved: 55, rejected: 10 },
          { month: 'May', reviewed: 70, approved: 58, rejected: 12 },
          { month: 'Jun', reviewed: 75, approved: 65, rejected: 10 }
        ],
        series: ['reviewed', 'approved', 'rejected'],
        xAxis: 'month',
        yAxis: 'count'
      };
    case 'admin':
      return {
        data: [
          { month: 'Jan', athletes: 100, businesses: 40, partnerships: 30 },
          { month: 'Feb', athletes: 120, businesses: 45, partnerships: 35 },
          { month: 'Mar', athletes: 140, businesses: 50, partnerships: 40 },
          { month: 'Apr', athletes: 160, businesses: 55, partnerships: 45 },
          { month: 'May', athletes: 180, businesses: 60, partnerships: 50 },
          { month: 'Jun', athletes: 200, businesses: 65, partnerships: 55 }
        ],
        series: ['athletes', 'businesses', 'partnerships'],
        xAxis: 'month',
        yAxis: 'count'
      };
    default:
      return {
        data: [],
        series: []
      };
  }
}

async function getActivityData(userType: string, req: Request): Promise<ActivityData> {
  const userId = getUserId(req);
  
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const fourDaysAgo = new Date(now);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  
  switch (userType) {
    case 'athlete':
      return [
        {
          id: uuidv4(),
          title: 'New Partnership Offer',
          description: 'You received a new partnership offer from SportsBrand Co.',
          timestamp: now.toISOString(),
          type: 'offer',
          icon: 'Mail',
          status: 'success',
          link: '/athlete/offers'
        },
        {
          id: uuidv4(),
          title: 'Profile View',
          description: 'Your profile was viewed by 5 new businesses',
          timestamp: yesterday.toISOString(),
          type: 'profile',
          icon: 'Eye',
          link: '/athlete/profile'
        },
        {
          id: uuidv4(),
          title: 'Match Recommendation',
          description: 'We found 3 new potential brand matches for you',
          timestamp: twoDaysAgo.toISOString(),
          type: 'match',
          icon: 'Users',
          link: '/athlete/matches'
        },
        {
          id: uuidv4(),
          title: 'Partnership Agreement',
          description: 'Your partnership with FitnessBrand has been finalized',
          timestamp: threeDaysAgo.toISOString(),
          type: 'partnership',
          icon: 'CheckCircle',
          status: 'success',
          link: '/athlete/partnerships'
        },
        {
          id: uuidv4(),
          title: 'Content Approval',
          description: 'Your content for SportsBrand Co. has been approved',
          timestamp: fourDaysAgo.toISOString(),
          type: 'content',
          icon: 'FileCheck',
          status: 'success',
          link: '/athlete/content'
        }
      ];
    case 'business':
      return [
        {
          id: uuidv4(),
          title: 'Athlete Match',
          description: 'We found 5 new athlete matches for your campaign',
          timestamp: now.toISOString(),
          type: 'match',
          icon: 'Users',
          link: '/business/matches'
        },
        {
          id: uuidv4(),
          title: 'Offer Accepted',
          description: 'John Smith has accepted your partnership offer',
          timestamp: yesterday.toISOString(),
          type: 'offer',
          icon: 'CheckCircle',
          status: 'success',
          link: '/business/partnerships'
        },
        {
          id: uuidv4(),
          title: 'Campaign Update',
          description: 'Your Spring campaign has reached 10k impressions',
          timestamp: twoDaysAgo.toISOString(),
          type: 'campaign',
          icon: 'TrendingUp',
          status: 'success',
          link: '/business/campaigns'
        },
        {
          id: uuidv4(),
          title: 'Compliance Review',
          description: 'Your partnership with Jane Doe has been approved',
          timestamp: threeDaysAgo.toISOString(),
          type: 'compliance',
          icon: 'Shield',
          status: 'success',
          link: '/business/partnerships'
        },
        {
          id: uuidv4(),
          title: 'Content Submitted',
          description: 'Sarah Johnson has submitted content for your review',
          timestamp: fourDaysAgo.toISOString(),
          type: 'content',
          icon: 'File',
          link: '/business/content'
        }
      ];
    case 'compliance':
      return [
        {
          id: uuidv4(),
          title: 'New Partnership Review',
          description: 'New partnership between SportsBrand Co. and John Smith needs review',
          timestamp: now.toISOString(),
          type: 'review',
          icon: 'AlertCircle',
          status: 'pending',
          link: '/compliance/reviews'
        },
        {
          id: uuidv4(),
          title: 'Content Flagged',
          description: 'Content from Sarah Johnson has been flagged for review',
          timestamp: yesterday.toISOString(),
          type: 'content',
          icon: 'Flag',
          status: 'warning',
          link: '/compliance/content'
        },
        {
          id: uuidv4(),
          title: 'Partnership Approved',
          description: 'You approved partnership between FitnessBrand and Alex Miller',
          timestamp: twoDaysAgo.toISOString(),
          type: 'partnership',
          icon: 'CheckCircle',
          status: 'success',
          link: '/compliance/history'
        },
        {
          id: uuidv4(),
          title: 'Review Overdue',
          description: 'Partnership review is overdue by 2 days',
          timestamp: threeDaysAgo.toISOString(),
          type: 'alert',
          icon: 'Clock',
          status: 'error',
          link: '/compliance/reviews'
        },
        {
          id: uuidv4(),
          title: 'Policy Update',
          description: 'Compliance policy for sports supplements has been updated',
          timestamp: fourDaysAgo.toISOString(),
          type: 'policy',
          icon: 'FileText',
          link: '/compliance/policies'
        }
      ];
    case 'admin':
      return [
        {
          id: uuidv4(),
          title: 'New User Registrations',
          description: '15 new users registered in the last 24 hours',
          timestamp: now.toISOString(),
          type: 'user',
          icon: 'UserPlus',
          link: '/admin/users'
        },
        {
          id: uuidv4(),
          title: 'System Alert',
          description: 'High server load detected',
          timestamp: yesterday.toISOString(),
          type: 'system',
          icon: 'AlertTriangle',
          status: 'warning',
          link: '/admin/system'
        },
        {
          id: uuidv4(),
          title: 'Support Tickets',
          description: '5 new support tickets require attention',
          timestamp: twoDaysAgo.toISOString(),
          type: 'support',
          icon: 'HelpCircle',
          status: 'pending',
          link: '/admin/support'
        },
        {
          id: uuidv4(),
          title: 'Compliance Report',
          description: 'Monthly compliance report is ready for review',
          timestamp: threeDaysAgo.toISOString(),
          type: 'report',
          icon: 'FileText',
          link: '/admin/reports'
        },
        {
          id: uuidv4(),
          title: 'Payment Processing',
          description: 'Payment batch processed successfully',
          timestamp: fourDaysAgo.toISOString(),
          type: 'payment',
          icon: 'CreditCard',
          status: 'success',
          link: '/admin/payments'
        }
      ];
    default:
      return [];
  }
}

async function getQuickActionsData(userType: string, req: Request): Promise<QuickActionsData> {
  switch (userType) {
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
        },
        {
          id: 'explore-brands',
          label: 'Explore Brands',
          description: 'Discover potential partnerships',
          icon: 'Search',
          color: 'purple',
          link: '/athlete/explore'
        }
      ];
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
        },
        {
          id: 'view-analytics',
          label: 'View Analytics',
          description: 'See campaign performance metrics',
          icon: 'BarChart',
          color: 'green',
          link: '/business/analytics'
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
        },
        {
          id: 'policy-management',
          label: 'Policy Management',
          description: 'Update compliance policies',
          icon: 'FileText',
          color: 'indigo',
          link: '/compliance/policies'
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
        },
        {
          id: 'analytics-dashboard',
          label: 'Analytics Dashboard',
          description: 'View platform performance metrics',
          icon: 'BarChart',
          color: 'indigo',
          link: '/admin/analytics'
        }
      ];
    default:
      return [];
  }
}

// Default dashboard config based on user type
function getDefaultDashboardConfig(userType: string): DashboardConfig {
  // Create default dashboard configuration based on user type
  return {
    widgets: [
      {
        id: `stats-${uuidv4().substring(0, 8)}`,
        type: 'stats',
        title: 'Key Metrics',
        description: 'Overview of your performance metrics',
        size: 'lg',
        position: 0,
        visible: true
      },
      {
        id: `chart-${uuidv4().substring(0, 8)}`,
        type: 'chart',
        title: 'Performance Trends',
        description: 'Visualize your data over time',
        size: 'md',
        position: 1,
        settings: {
          chartType: 'line',
          dataSource: userType === 'business' ? 'campaigns' : 
                      userType === 'athlete' ? 'engagement' : 
                      userType === 'compliance' ? 'compliance' : 'admin',
          showLegend: true
        },
        visible: true
      },
      {
        id: `activity-${uuidv4().substring(0, 8)}`,
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
        id: `quick-actions-${uuidv4().substring(0, 8)}`,
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

// Mock data access methods (would be replaced with real data access in production)
async function getAthleteMatchCount(userId: string): Promise<number> {
  return 24;
}

async function getAthleteOfferCount(userId: string): Promise<number> {
  return 8;
}

async function getAthleteActivePartnerships(userId: string): Promise<number> {
  return 3;
}

async function getAthleteEarnings(userId: string): Promise<string> {
  return '$3,250';
}

async function getBusinessCampaignCount(userId: string): Promise<number> {
  return 5;
}

async function getBusinessMatchCount(userId: string): Promise<number> {
  return 42;
}

async function getBusinessPartnershipCount(userId: string): Promise<number> {
  return 12;
}

async function getBusinessBudgetUsed(userId: string): Promise<string> {
  return '$12,500';
}

async function getCompliancePendingCount(): Promise<number> {
  return 18;
}

async function getComplianceApprovedCount(): Promise<number> {
  return 72;
}

async function getComplianceRejectedCount(): Promise<number> {
  return 6;
}

async function getAdminUserCount(): Promise<number> {
  return 1250;
}

async function getAdminBusinessCount(): Promise<number> {
  return 320;
}

async function getAdminAthleteCount(): Promise<number> {
  return 930;
}

async function getAdminPartnershipCount(): Promise<number> {
  return 450;
}