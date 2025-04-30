import { Router } from 'express';
import { storage } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { DashboardConfig, Widget, WidgetType } from '../shared/dashboard-schema';

const dashboardRouter = Router();

// Get dashboard configuration for the current user
dashboardRouter.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id.toString();
    const dashboardConfig = await storage.getDashboardConfig(userId);
    
    if (!dashboardConfig) {
      // If no dashboard config exists, create default config
      const defaultConfig = await createDefaultConfig(userId, req.user.role);
      return res.json(defaultConfig);
    }
    
    res.json(dashboardConfig);
  } catch (error) {
    console.error('Error getting dashboard config:', error);
    res.status(500).json({ error: 'Failed to get dashboard configuration' });
  }
});

// Save dashboard configuration
dashboardRouter.post('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id.toString();
    const config = req.body as DashboardConfig;
    
    if (config.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: User ID mismatch' });
    }
    
    await storage.saveDashboardConfig(userId, config);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving dashboard config:', error);
    res.status(500).json({ error: 'Failed to save dashboard configuration' });
  }
});

// Get default dashboard configuration
dashboardRouter.get('/default', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id.toString();
    const userRole = req.user.role;
    
    const defaultConfig = await createDefaultConfig(userId, userRole);
    res.json(defaultConfig);
  } catch (error) {
    console.error('Error getting default dashboard config:', error);
    res.status(500).json({ error: 'Failed to get default dashboard configuration' });
  }
});

// Reset dashboard to default configuration
dashboardRouter.post('/reset', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id.toString();
    const userRole = req.user.role;
    
    const defaultConfig = await createDefaultConfig(userId, userRole);
    await storage.saveDashboardConfig(userId, defaultConfig);
    
    res.json(defaultConfig);
  } catch (error) {
    console.error('Error resetting dashboard config:', error);
    res.status(500).json({ error: 'Failed to reset dashboard configuration' });
  }
});

// Reorder widgets
dashboardRouter.post('/reorder', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id.toString();
    const { widgetIds } = req.body;
    
    if (!Array.isArray(widgetIds)) {
      return res.status(400).json({ error: 'Invalid widget IDs' });
    }
    
    const dashboardConfig = await storage.getDashboardConfig(userId);
    
    if (!dashboardConfig) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    // Reorder widgets based on the provided widget IDs
    const reorderedWidgets = widgetIds.map((id, index) => {
      const widget = dashboardConfig.widgets.find(w => w.id === id);
      if (widget) {
        return { ...widget, position: index };
      }
      return null;
    }).filter(Boolean) as Widget[];
    
    // Add any widgets that weren't included in the widgetIds array
    const remainingWidgets = dashboardConfig.widgets
      .filter(w => !widgetIds.includes(w.id))
      .map((w, i) => ({ ...w, position: reorderedWidgets.length + i }));
    
    const updatedConfig = {
      ...dashboardConfig,
      widgets: [...reorderedWidgets, ...remainingWidgets],
      lastUpdated: new Date().toISOString()
    };
    
    await storage.saveDashboardConfig(userId, updatedConfig);
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error reordering widgets:', error);
    res.status(500).json({ error: 'Failed to reorder widgets' });
  }
});

// Widget-specific routes
const widgetsRouter = Router();

// Add a widget
widgetsRouter.post('/add', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id.toString();
    const { type } = req.body;
    
    if (!type || !['stats', 'chart', 'activity', 'quickActions'].includes(type)) {
      return res.status(400).json({ error: 'Invalid widget type' });
    }
    
    const dashboardConfig = await storage.getDashboardConfig(userId);
    
    if (!dashboardConfig) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    // Create new widget
    const newWidget = createWidget(type as WidgetType, dashboardConfig.widgets.length);
    
    const updatedConfig = {
      ...dashboardConfig,
      widgets: [...dashboardConfig.widgets, newWidget],
      lastUpdated: new Date().toISOString()
    };
    
    await storage.saveDashboardConfig(userId, updatedConfig);
    res.json(newWidget);
  } catch (error) {
    console.error('Error adding widget:', error);
    res.status(500).json({ error: 'Failed to add widget' });
  }
});

// Update a widget
widgetsRouter.patch('/:widgetId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id.toString();
    const { widgetId } = req.params;
    const updates = req.body;
    
    const dashboardConfig = await storage.getDashboardConfig(userId);
    
    if (!dashboardConfig) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    const widgetIndex = dashboardConfig.widgets.findIndex(w => w.id === widgetId);
    
    if (widgetIndex === -1) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Update widget
    const updatedWidget = {
      ...dashboardConfig.widgets[widgetIndex],
      ...updates
    };
    
    const updatedWidgets = [...dashboardConfig.widgets];
    updatedWidgets[widgetIndex] = updatedWidget;
    
    const updatedConfig = {
      ...dashboardConfig,
      widgets: updatedWidgets,
      lastUpdated: new Date().toISOString()
    };
    
    await storage.saveDashboardConfig(userId, updatedConfig);
    res.json(updatedWidget);
  } catch (error) {
    console.error('Error updating widget:', error);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

// Remove a widget
widgetsRouter.delete('/:widgetId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userId = req.user.id.toString();
    const { widgetId } = req.params;
    
    const dashboardConfig = await storage.getDashboardConfig(userId);
    
    if (!dashboardConfig) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    // Filter out the widget to remove
    const updatedWidgets = dashboardConfig.widgets
      .filter(w => w.id !== widgetId)
      .map((w, i) => ({ ...w, position: i })); // Update positions
    
    const updatedConfig = {
      ...dashboardConfig,
      widgets: updatedWidgets,
      lastUpdated: new Date().toISOString()
    };
    
    await storage.saveDashboardConfig(userId, updatedConfig);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error removing widget:', error);
    res.status(500).json({ error: 'Failed to remove widget' });
  }
});

// Mock data endpoints for widgets
const dataRouter = Router();

// Get stats data
dataRouter.get('/stats', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userRole = req.user.role;
    const statsData = getMockStatsData(userRole);
    
    res.json(statsData);
  } catch (error) {
    console.error('Error getting stats data:', error);
    res.status(500).json({ error: 'Failed to get stats data' });
  }
});

// Get chart data
dataRouter.get('/:source', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { source } = req.params;
    const userRole = req.user.role;
    
    const chartData = getMockChartData(source, userRole);
    res.json(chartData);
  } catch (error) {
    console.error('Error getting chart data:', error);
    res.status(500).json({ error: 'Failed to get chart data' });
  }
});

// Get activity data
dataRouter.get('/activities', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userRole = req.user.role;
    const activityData = getMockActivityData(userRole);
    
    res.json(activityData);
  } catch (error) {
    console.error('Error getting activity data:', error);
    res.status(500).json({ error: 'Failed to get activity data' });
  }
});

// Get quick actions data
dataRouter.get('/quickActions', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userRole = req.user.role;
    const quickActionsData = getMockQuickActionsData(userRole);
    
    res.json(quickActionsData);
  } catch (error) {
    console.error('Error getting quick actions data:', error);
    res.status(500).json({ error: 'Failed to get quick actions data' });
  }
});

// Helper functions
function createWidget(type: WidgetType, position: number): Widget {
  const id = uuidv4();
  let title = '';
  let description = '';
  let size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  let settings = {};
  
  switch (type) {
    case 'stats':
      title = 'Key Metrics';
      description = 'Overview of important statistics';
      size = 'lg';
      break;
    case 'chart':
      title = 'Performance Trends';
      description = 'Visualize your data over time';
      size = 'lg';
      settings = {
        chartType: 'line',
        timeRange: '30d',
        showControls: true,
        showLegend: true
      };
      break;
    case 'activity':
      title = 'Recent Activity';
      description = 'Latest updates and notifications';
      size = 'md';
      settings = {
        maxItems: 5
      };
      break;
    case 'quickActions':
      title = 'Quick Actions';
      description = 'Frequently used actions';
      size = 'md';
      settings = {
        columns: 3
      };
      break;
  }
  
  return {
    id,
    type,
    title,
    description,
    size,
    position,
    visible: true,
    settings
  };
}

// Create default dashboard configuration based on user role
async function createDefaultConfig(userId: string, userRole: string): Promise<DashboardConfig> {
  const widgets: Widget[] = [];
  
  // Common widgets for all roles
  widgets.push(createWidget('stats', 0));
  widgets.push(createWidget('activity', 1));
  
  // Role-specific widgets
  if (userRole === 'athlete') {
    widgets.push(createWidget('chart', 2));
    widgets.push(createWidget('quickActions', 3));
  } else if (userRole === 'business') {
    widgets.push(createWidget('chart', 2));
    widgets.push(createWidget('quickActions', 3));
  } else if (userRole === 'compliance' || userRole === 'admin') {
    widgets.push(createWidget('chart', 2));
    widgets.push(createWidget('quickActions', 3));
  }
  
  return {
    userId,
    widgets,
    lastUpdated: new Date().toISOString()
  };
}

// Mock data functions (these will be replaced with real data from your database)
function getMockStatsData(userRole: string) {
  switch (userRole) {
    case 'athlete':
      return {
        items: [
          { key: 'matches', label: 'Matches', value: 12, trend: 'up', change: 25, icon: 'Users', color: 'blue' },
          { key: 'campaigns', label: 'Active Campaigns', value: 3, trend: 'up', change: 50, icon: 'Megaphone', color: 'green' },
          { key: 'earnings', label: 'Earnings', value: '$2,500', trend: 'up', change: 15, icon: 'DollarSign', color: 'amber' },
          { key: 'followers', label: 'New Followers', value: 102, trend: 'down', change: 5, icon: 'Heart', color: 'red' }
        ],
        timestamp: new Date().toISOString()
      };
    case 'business':
      return {
        items: [
          { key: 'campaigns', label: 'Active Campaigns', value: 5, trend: 'up', change: 20, icon: 'Megaphone', color: 'green' },
          { key: 'matches', label: 'Athlete Matches', value: 27, trend: 'up', change: 35, icon: 'Users', color: 'blue' },
          { key: 'budget', label: 'Budget Used', value: '$12,500', trend: 'neutral', change: 0, icon: 'DollarSign', color: 'amber' },
          { key: 'engagement', label: 'Engagement Rate', value: '12.5%', trend: 'up', change: 8, icon: 'BarChart', color: 'purple' }
        ],
        timestamp: new Date().toISOString()
      };
    case 'compliance':
    case 'admin':
      return {
        items: [
          { key: 'pending', label: 'Pending Reviews', value: 23, trend: 'down', change: 10, icon: 'Clock', color: 'amber' },
          { key: 'approved', label: 'Approved', value: 145, trend: 'up', change: 32, icon: 'CheckCircle', color: 'green' },
          { key: 'rejected', label: 'Rejected', value: 12, trend: 'down', change: 15, icon: 'XCircle', color: 'red' },
          { key: 'users', label: 'Active Users', value: 1250, trend: 'up', change: 5, icon: 'Users', color: 'blue' }
        ],
        timestamp: new Date().toISOString()
      };
    default:
      return {
        items: [],
        timestamp: new Date().toISOString()
      };
  }
}

function getMockChartData(source: string, userRole: string) {
  const now = new Date();
  const data = [];
  
  // Generate dates for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    switch (source) {
      case 'engagement':
        data.push({
          date: dateStr,
          views: Math.floor(Math.random() * 1000) + 500,
          likes: Math.floor(Math.random() * 200) + 100,
          shares: Math.floor(Math.random() * 50) + 20
        });
        break;
      case 'campaigns':
        data.push({
          date: dateStr,
          active: Math.floor(Math.random() * 10) + 1,
          completed: Math.floor(Math.random() * 5),
          pending: Math.floor(Math.random() * 3)
        });
        break;
      case 'revenue':
        data.push({
          date: dateStr,
          amount: Math.floor(Math.random() * 1000) + 200
        });
        break;
      case 'performance':
        data.push({
          date: dateStr,
          clicks: Math.floor(Math.random() * 500) + 100,
          conversions: Math.floor(Math.random() * 50) + 10,
          roi: (Math.random() * 20 + 5).toFixed(2)
        });
        break;
      default:
        // Default data with random values
        data.push({
          date: dateStr,
          value1: Math.floor(Math.random() * 100) + 50,
          value2: Math.floor(Math.random() * 100) + 25
        });
    }
  }
  
  let series: string[] = [];
  let xAxis = 'date';
  
  switch (source) {
    case 'engagement':
      series = ['views', 'likes', 'shares'];
      break;
    case 'campaigns':
      series = ['active', 'completed', 'pending'];
      break;
    case 'revenue':
      series = ['amount'];
      break;
    case 'performance':
      series = ['clicks', 'conversions', 'roi'];
      break;
    default:
      series = ['value1', 'value2'];
  }
  
  return { data, series, xAxis };
}

function getMockActivityData(userRole: string) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);
  
  switch (userRole) {
    case 'athlete':
      return [
        {
          id: '1',
          type: 'match',
          icon: 'Users',
          title: 'New Match',
          description: 'You matched with Nike for their winter campaign',
          timestamp: now.toISOString(),
          status: 'success',
          link: '/matches/123'
        },
        {
          id: '2',
          type: 'payment',
          icon: 'DollarSign',
          title: 'Payment Received',
          description: 'Received $500 from Adidas campaign',
          timestamp: yesterday.toISOString(),
          status: 'success',
          link: '/payments/456'
        },
        {
          id: '3',
          type: 'campaign',
          icon: 'Megaphone',
          title: 'Campaign Update',
          description: 'Under Armour campaign needs your attention',
          timestamp: threeDaysAgo.toISOString(),
          status: 'pending',
          link: '/campaigns/789'
        },
        {
          id: '4',
          type: 'message',
          icon: 'MessageSquare',
          title: 'New Message',
          description: 'Message from Puma about upcoming campaign',
          timestamp: lastWeek.toISOString(),
          link: '/messages/101'
        }
      ];
    case 'business':
      return [
        {
          id: '1',
          type: 'campaign',
          icon: 'Megaphone',
          title: 'Campaign Created',
          description: 'Summer promotional campaign successfully created',
          timestamp: now.toISOString(),
          status: 'success',
          link: '/campaigns/123'
        },
        {
          id: '2',
          type: 'match',
          icon: 'Users',
          title: 'New Athlete Matches',
          description: '5 new athletes matched with your campaign',
          timestamp: yesterday.toISOString(),
          status: 'success',
          link: '/matches'
        },
        {
          id: '3',
          type: 'alert',
          icon: 'AlertCircle',
          title: 'Budget Alert',
          description: 'Campaign is nearing its budget limit',
          timestamp: threeDaysAgo.toISOString(),
          status: 'warning',
          link: '/campaigns/456/budget'
        },
        {
          id: '4',
          type: 'message',
          icon: 'MessageSquare',
          title: 'New Messages',
          description: '2 athletes have sent you messages',
          timestamp: lastWeek.toISOString(),
          link: '/messages'
        }
      ];
    case 'compliance':
    case 'admin':
      return [
        {
          id: '1',
          type: 'review',
          icon: 'CheckCircle',
          title: 'Campaign Approved',
          description: 'Nike winter campaign approved',
          timestamp: now.toISOString(),
          status: 'success',
          link: '/campaigns/123'
        },
        {
          id: '2',
          type: 'alert',
          icon: 'AlertTriangle',
          title: 'Content Alert',
          description: 'Adidas campaign content needs review',
          timestamp: yesterday.toISOString(),
          status: 'error',
          link: '/campaigns/456'
        },
        {
          id: '3',
          type: 'notification',
          icon: 'Bell',
          title: 'New Athletes',
          description: '12 new athletes registered today',
          timestamp: threeDaysAgo.toISOString(),
          link: '/users/athletes'
        },
        {
          id: '4',
          type: 'update',
          icon: 'RefreshCw',
          title: 'System Update',
          description: 'Platform updated to version 2.5',
          timestamp: lastWeek.toISOString(),
          status: 'success',
          link: '/system/updates'
        }
      ];
    default:
      return [];
  }
}

function getMockQuickActionsData(userRole: string) {
  switch (userRole) {
    case 'athlete':
      return [
        {
          id: '1',
          label: 'Browse Campaigns',
          icon: 'Search',
          link: '/campaigns',
          color: 'blue'
        },
        {
          id: '2',
          label: 'View Matches',
          icon: 'Users',
          link: '/matches',
          color: 'green'
        },
        {
          id: '3',
          label: 'Check Messages',
          icon: 'MessageSquare',
          link: '/messages',
          color: 'purple'
        },
        {
          id: '4',
          label: 'Update Profile',
          icon: 'User',
          link: '/profile',
          color: 'amber'
        },
        {
          id: '5',
          label: 'View Earnings',
          icon: 'DollarSign',
          link: '/earnings',
          color: 'cyan'
        },
        {
          id: '6',
          label: 'Get Support',
          icon: 'HelpCircle',
          link: '/support',
          color: 'red'
        }
      ];
    case 'business':
      return [
        {
          id: '1',
          label: 'Create Campaign',
          icon: 'PlusCircle',
          link: '/campaigns/new',
          color: 'green'
        },
        {
          id: '2',
          label: 'View Athletes',
          icon: 'Users',
          link: '/athletes',
          color: 'blue'
        },
        {
          id: '3',
          label: 'Manage Campaigns',
          icon: 'Layers',
          link: '/campaigns',
          color: 'purple'
        },
        {
          id: '4',
          label: 'Review Matches',
          icon: 'CheckSquare',
          link: '/matches',
          color: 'amber'
        },
        {
          id: '5',
          label: 'View Analytics',
          icon: 'BarChart2',
          link: '/analytics',
          color: 'cyan'
        },
        {
          id: '6',
          label: 'Get Support',
          icon: 'HelpCircle',
          link: '/support',
          color: 'red'
        }
      ];
    case 'compliance':
    case 'admin':
      return [
        {
          id: '1',
          label: 'Review Campaigns',
          icon: 'CheckCircle',
          link: '/compliance/campaigns',
          color: 'amber'
        },
        {
          id: '2',
          label: 'Manage Users',
          icon: 'Users',
          link: '/admin/users',
          color: 'blue'
        },
        {
          id: '3',
          label: 'View Reports',
          icon: 'FileText',
          link: '/reports',
          color: 'green'
        },
        {
          id: '4',
          label: 'System Settings',
          icon: 'Settings',
          link: '/admin/settings',
          color: 'purple'
        },
        {
          id: '5',
          label: 'Audit Log',
          icon: 'List',
          link: '/admin/audit',
          color: 'cyan'
        },
        {
          id: '6',
          label: 'Help Center',
          icon: 'HelpCircle',
          link: '/help',
          color: 'red'
        }
      ];
    default:
      return [];
  }
}

// Register routes
dashboardRouter.use('/widgets', widgetsRouter);
dashboardRouter.use('/data', dataRouter);

export { dashboardRouter };