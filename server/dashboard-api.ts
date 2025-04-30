import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storage } from './storage';
import { widgetSchema, dashboardConfigSchema } from '../shared/dashboard-schema';

const router = Router();

// Helper function to check authentication
const ensureAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

// Generate sample data based on user type
const getSampleWidgetData = (req: Request, dataType: string, source: string = 'default') => {
  const userType = req.user?.role || 'athlete';
  const userId = req.user?.id.toString() || '';
  
  // Stats Widget Data
  if (dataType === 'stats') {
    if (userType === 'athlete') {
      return {
        items: [
          {
            key: 'followers',
            label: 'Followers',
            value: '2.4k',
            icon: 'Users',
            color: 'blue',
            trend: 'up',
            change: 12,
            link: '/analytics'
          },
          {
            key: 'engagement',
            label: 'Engagement Rate',
            value: '4.7%',
            icon: 'BarChart2',
            color: 'green',
            trend: 'up',
            change: 2.3,
          },
          {
            key: 'offers',
            label: 'Pending Offers',
            value: '3',
            icon: 'FileText',
            color: 'amber',
            link: '/offers'
          },
          {
            key: 'campaigns',
            label: 'Active Campaigns',
            value: '2',
            icon: 'Briefcase',
            color: 'purple',
            link: '/campaigns'
          }
        ]
      };
    } else if (userType === 'business') {
      return {
        items: [
          {
            key: 'campaigns',
            label: 'Active Campaigns',
            value: '4',
            icon: 'Briefcase',
            color: 'purple',
            link: '/campaigns'
          },
          {
            key: 'athletes',
            label: 'Partnered Athletes',
            value: '7',
            icon: 'Users',
            color: 'blue',
            trend: 'up',
            change: 3,
            link: '/partners'
          },
          {
            key: 'budget',
            label: 'Budget Utilized',
            value: '68%',
            icon: 'DollarSign',
            color: 'amber',
            trend: 'up',
            change: 8,
          },
          {
            key: 'roi',
            label: 'Estimated ROI',
            value: '2.3x',
            icon: 'TrendingUp',
            color: 'green',
            trend: 'up',
            change: 0.5,
            link: '/analytics'
          }
        ]
      };
    } else if (userType === 'compliance') {
      return {
        items: [
          {
            key: 'pending',
            label: 'Pending Reviews',
            value: '12',
            icon: 'Clock',
            color: 'amber',
            link: '/pending-reviews'
          },
          {
            key: 'approved',
            label: 'Approved This Week',
            value: '34',
            icon: 'CheckCircle',
            color: 'green',
            trend: 'up',
            change: 8,
          },
          {
            key: 'rejected',
            label: 'Rejected This Week',
            value: '6',
            icon: 'XCircle',
            color: 'red',
            trend: 'down',
            change: 2,
          },
          {
            key: 'overdue',
            label: 'Overdue Reviews',
            value: '3',
            icon: 'AlertTriangle',
            color: 'red',
            link: '/overdue'
          }
        ]
      };
    } else {
      // Admin stats
      return {
        items: [
          {
            key: 'athletes',
            label: 'Total Athletes',
            value: '1.2k',
            icon: 'User',
            color: 'blue',
            trend: 'up',
            change: 5,
            link: '/athletes'
          },
          {
            key: 'businesses',
            label: 'Total Businesses',
            value: '642',
            icon: 'Briefcase',
            color: 'purple',
            trend: 'up',
            change: 3,
            link: '/businesses'
          },
          {
            key: 'campaigns',
            label: 'Active Campaigns',
            value: '213',
            icon: 'Activity',
            color: 'green',
            link: '/campaigns'
          },
          {
            key: 'revenue',
            label: 'Monthly Revenue',
            value: '$28.5k',
            icon: 'DollarSign',
            color: 'green',
            trend: 'up',
            change: 12,
            link: '/revenue'
          }
        ]
      };
    }
  }
  
  // Chart Widget Data
  else if (dataType === 'chart') {
    if (source === 'engagement') {
      return {
        xAxis: 'date',
        series: ['views', 'likes', 'comments', 'shares'],
        data: [
          { date: 'Jan', views: 4000, likes: 2400, comments: 1200, shares: 800 },
          { date: 'Feb', views: 3000, likes: 1398, comments: 800, shares: 500 },
          { date: 'Mar', views: 2000, likes: 9800, comments: 2200, shares: 1800 },
          { date: 'Apr', views: 2780, likes: 3908, comments: 1800, shares: 1500 },
          { date: 'May', views: 1890, likes: 4800, comments: 2400, shares: 1900 },
          { date: 'Jun', views: 2390, likes: 3800, comments: 2100, shares: 1700 },
          { date: 'Jul', views: 3490, likes: 4300, comments: 2500, shares: 2000 }
        ]
      };
    } else if (source === 'campaigns') {
      return {
        xAxis: 'month',
        series: ['active', 'completed', 'pending'],
        data: [
          { month: 'Jan', active: 10, completed: 5, pending: 3 },
          { month: 'Feb', active: 12, completed: 8, pending: 5 },
          { month: 'Mar', active: 15, completed: 10, pending: 8 },
          { month: 'Apr', active: 18, completed: 12, pending: 6 },
          { month: 'May', active: 20, completed: 15, pending: 10 },
          { month: 'Jun', active: 24, completed: 18, pending: 8 }
        ]
      };
    } else if (source === 'revenue') {
      return {
        xAxis: 'month',
        series: ['revenue', 'expenses', 'profit'],
        data: [
          { month: 'Jan', revenue: 10000, expenses: 7000, profit: 3000 },
          { month: 'Feb', revenue: 12000, expenses: 7500, profit: 4500 },
          { month: 'Mar', revenue: 15000, expenses: 8000, profit: 7000 },
          { month: 'Apr', revenue: 18000, expenses: 9000, profit: 9000 },
          { month: 'May', revenue: 20000, expenses: 10000, profit: 10000 },
          { month: 'Jun', revenue: 22000, expenses: 11000, profit: 11000 }
        ]
      };
    } else {
      // Default chart data
      return {
        xAxis: 'month',
        series: ['value'],
        data: [
          { month: 'Jan', value: 4000 },
          { month: 'Feb', value: 3000 },
          { month: 'Mar', value: 2000 },
          { month: 'Apr', value: 2780 },
          { month: 'May', value: 1890 },
          { month: 'Jun', value: 2390 },
          { month: 'Jul', value: 3490 }
        ]
      };
    }
  }
  
  // Activity Widget Data
  else if (dataType === 'activity') {
    if (userType === 'athlete') {
      return [
        {
          id: '1',
          title: 'New campaign offer',
          description: 'Nike has sent you a new campaign offer',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: 'MailOpen',
          status: 'pending',
          link: '/offers/123'
        },
        {
          id: '2',
          title: 'Campaign approved',
          description: 'Your Adidas campaign was approved by compliance',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          icon: 'CheckCircle',
          status: 'success',
          link: '/campaigns/456'
        },
        {
          id: '3',
          title: 'Payment received',
          description: 'You received $1,200 for the Under Armour campaign',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          icon: 'DollarSign',
          status: 'success'
        },
        {
          id: '4',
          title: 'Content submission required',
          description: 'Please submit content for the Reebok campaign',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          icon: 'AlertCircle',
          status: 'warning',
          link: '/campaigns/789/submit'
        }
      ];
    } else if (userType === 'business') {
      return [
        {
          id: '1',
          title: 'New athlete match',
          description: 'We found 5 new athlete matches for your campaign',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          icon: 'Users',
          status: 'success',
          link: '/matches'
        },
        {
          id: '2',
          title: 'Campaign launched',
          description: 'Your summer campaign has been launched successfully',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          icon: 'Zap',
          status: 'success',
          link: '/campaigns/123'
        },
        {
          id: '3',
          title: 'Content approval needed',
          description: 'John Smith has submitted content for your review',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          icon: 'FileText',
          status: 'pending',
          link: '/content/456'
        },
        {
          id: '4',
          title: 'Billing update',
          description: 'Your monthly invoice has been generated',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          icon: 'CreditCard',
          link: '/billing'
        }
      ];
    } else if (userType === 'compliance') {
      return [
        {
          id: '1',
          title: 'New review request',
          description: 'Campaign agreement needs compliance review',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          icon: 'FileText',
          status: 'pending',
          link: '/reviews/123'
        },
        {
          id: '2',
          title: 'Content flagged',
          description: 'Athlete content flagged for review',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          icon: 'Flag',
          status: 'warning',
          link: '/content/456'
        },
        {
          id: '3',
          title: 'Review completed',
          description: 'You approved Nike spring campaign',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          icon: 'CheckCircle',
          status: 'success'
        },
        {
          id: '4',
          title: 'Policy update',
          description: 'Compliance policy updated - review changes',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          icon: 'Book',
          link: '/policies'
        }
      ];
    } else {
      // Admin activities
      return [
        {
          id: '1',
          title: 'New business registration',
          description: 'Adidas registered as a new business',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          icon: 'Briefcase',
          status: 'success',
          link: '/businesses/123'
        },
        {
          id: '2',
          title: 'System alert',
          description: 'Unusual login activity detected',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          icon: 'AlertTriangle',
          status: 'warning',
          link: '/security'
        },
        {
          id: '3',
          title: 'Revenue milestone',
          description: 'Platform reached $1M in monthly revenue',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          icon: 'DollarSign',
          status: 'success'
        },
        {
          id: '4',
          title: 'New feature deployed',
          description: 'Messaging system deployed to production',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          icon: 'Package',
          link: '/releases'
        }
      ];
    }
  }
  
  // Quick Actions Widget Data
  else if (dataType === 'quickActions') {
    if (userType === 'athlete') {
      return [
        {
          id: '1',
          label: 'Review Offers',
          description: 'Review pending campaign offers',
          icon: 'Inbox',
          link: '/offers',
          color: 'blue'
        },
        {
          id: '2',
          label: 'Submit Content',
          description: 'Upload content for active campaigns',
          icon: 'Upload',
          link: '/submit-content',
          color: 'green'
        },
        {
          id: '3',
          label: 'Update Profile',
          description: 'Keep your profile information current',
          icon: 'User',
          link: '/profile',
          color: 'purple'
        },
        {
          id: '4',
          label: 'View Analytics',
          description: 'Check your performance metrics',
          icon: 'BarChart2',
          link: '/analytics',
          color: 'amber'
        }
      ];
    } else if (userType === 'business') {
      return [
        {
          id: '1',
          label: 'Create Campaign',
          description: 'Start a new marketing campaign',
          icon: 'Plus',
          link: '/campaigns/new',
          color: 'blue'
        },
        {
          id: '2',
          label: 'Browse Athletes',
          description: 'Find athletes that match your needs',
          icon: 'Search',
          link: '/athletes',
          color: 'purple'
        },
        {
          id: '3',
          label: 'Review Content',
          description: 'Review submitted campaign content',
          icon: 'FileText',
          link: '/content-review',
          color: 'amber'
        },
        {
          id: '4',
          label: 'Campaign Analytics',
          description: 'Track your campaign performance',
          icon: 'PieChart',
          link: '/analytics',
          color: 'green'
        }
      ];
    } else if (userType === 'compliance') {
      return [
        {
          id: '1',
          label: 'Pending Reviews',
          description: 'Review pending campaigns and content',
          icon: 'Clock',
          link: '/pending-reviews',
          color: 'amber'
        },
        {
          id: '2',
          label: 'Flag Content',
          description: 'Flag problematic content for review',
          icon: 'Flag',
          link: '/flag-content',
          color: 'red'
        },
        {
          id: '3',
          label: 'Policy Updates',
          description: 'View recent compliance policy changes',
          icon: 'FileText',
          link: '/policies',
          color: 'blue'
        },
        {
          id: '4',
          label: 'Generate Report',
          description: 'Create compliance reports',
          icon: 'FileText',
          link: '/reports',
          color: 'green'
        }
      ];
    } else {
      // Admin quick actions
      return [
        {
          id: '1',
          label: 'User Management',
          description: 'Manage platform users',
          icon: 'Users',
          link: '/users',
          color: 'blue'
        },
        {
          id: '2',
          label: 'System Settings',
          description: 'Configure application settings',
          icon: 'Settings',
          link: '/settings',
          color: 'purple'
        },
        {
          id: '3',
          label: 'Analytics Dashboard',
          description: 'View platform analytics',
          icon: 'BarChart2',
          link: '/admin-analytics',
          color: 'green'
        },
        {
          id: '4',
          label: 'Support Tickets',
          description: 'Handle user support tickets',
          icon: 'HelpCircle',
          link: '/support',
          color: 'amber'
        }
      ];
    }
  }
  
  return null;
};

// Get dashboard configuration
router.get('/config', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id.toString() || '';
    
    // Get user's dashboard configuration from storage
    let config = await storage.getDashboardConfig(userId);
    
    // If no configuration exists, create a default one
    if (!config) {
      const userType = req.user?.role || 'athlete';
      const defaultWidgets = [];
      
      // Create default widgets based on user type
      if (userType === 'athlete') {
        defaultWidgets.push(
          {
            id: uuidv4(),
            title: 'Your Statistics',
            type: 'stats',
            position: 0,
            size: 'full',
            visible: true
          },
          {
            id: uuidv4(),
            title: 'Engagement Over Time',
            type: 'chart',
            position: 1,
            size: 'lg',
            visible: true,
            settings: { 
              chartType: 'line',
              dataSource: 'engagement'
            }
          },
          {
            id: uuidv4(),
            title: 'Recent Activity',
            type: 'activity',
            position: 2,
            size: 'md',
            visible: true
          },
          {
            id: uuidv4(),
            title: 'Quick Actions',
            type: 'quickActions',
            position: 3,
            size: 'sm',
            visible: true
          }
        );
      } else if (userType === 'business') {
        defaultWidgets.push(
          {
            id: uuidv4(),
            title: 'Campaign Overview',
            type: 'stats',
            position: 0,
            size: 'full',
            visible: true
          },
          {
            id: uuidv4(),
            title: 'Campaign Performance',
            type: 'chart',
            position: 1,
            size: 'lg',
            visible: true,
            settings: { 
              chartType: 'bar',
              dataSource: 'campaigns'
            }
          },
          {
            id: uuidv4(),
            title: 'Recent Activity',
            type: 'activity',
            position: 2,
            size: 'md',
            visible: true
          },
          {
            id: uuidv4(),
            title: 'Quick Actions',
            type: 'quickActions',
            position: 3,
            size: 'sm',
            visible: true
          }
        );
      } else if (userType === 'compliance') {
        defaultWidgets.push(
          {
            id: uuidv4(),
            title: 'Review Status',
            type: 'stats',
            position: 0,
            size: 'full',
            visible: true
          },
          {
            id: uuidv4(),
            title: 'Review Activity',
            type: 'activity',
            position: 1,
            size: 'lg',
            visible: true
          },
          {
            id: uuidv4(),
            title: 'Quick Actions',
            type: 'quickActions',
            position: 2,
            size: 'md',
            visible: true
          }
        );
      } else {
        // Admin
        defaultWidgets.push(
          {
            id: uuidv4(),
            title: 'Platform Overview',
            type: 'stats',
            position: 0,
            size: 'full',
            visible: true
          },
          {
            id: uuidv4(),
            title: 'Revenue',
            type: 'chart',
            position: 1,
            size: 'lg',
            visible: true,
            settings: { 
              chartType: 'area',
              dataSource: 'revenue'
            }
          },
          {
            id: uuidv4(),
            title: 'Recent Activity',
            type: 'activity',
            position: 2,
            size: 'md',
            visible: true
          },
          {
            id: uuidv4(),
            title: 'Admin Actions',
            type: 'quickActions',
            position: 3,
            size: 'sm',
            visible: true
          }
        );
      }
      
      // Create and save the default configuration
      config = {
        userId,
        widgets: defaultWidgets,
        lastUpdated: new Date().toISOString()
      };
      
      await storage.saveDashboardConfig(userId, config);
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error getting dashboard config:', error);
    res.status(500).json({ error: 'Failed to get dashboard configuration' });
  }
});

// Update dashboard configuration
router.post('/config', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id.toString() || '';
    const config = req.body;
    
    // Validate config
    const validation = dashboardConfigSchema.safeParse(config);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid dashboard configuration', details: validation.error });
    }
    
    // Ensure userId matches the authenticated user
    if (config.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to modify this dashboard' });
    }
    
    // Save the updated configuration
    await storage.saveDashboardConfig(userId, config);
    
    res.json(config);
  } catch (error) {
    console.error('Error saving dashboard config:', error);
    res.status(500).json({ error: 'Failed to save dashboard configuration' });
  }
});

// Add a new widget
router.post('/widgets', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id.toString() || '';
    const widgetData = req.body;
    
    // Validate widget data
    const validation = widgetSchema.safeParse(widgetData);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid widget data', details: validation.error });
    }
    
    // Get the current dashboard config
    const config = await storage.getDashboardConfig(userId);
    if (!config) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    // Add the new widget with a generated ID
    const newWidget = {
      ...widgetData,
      id: widgetData.id || uuidv4()
    };
    
    config.widgets.push(newWidget);
    config.lastUpdated = new Date().toISOString();
    
    // Save the updated configuration
    await storage.saveDashboardConfig(userId, config);
    
    res.status(201).json(newWidget);
  } catch (error) {
    console.error('Error adding widget:', error);
    res.status(500).json({ error: 'Failed to add widget' });
  }
});

// Update a widget
router.patch('/widgets/:id', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id.toString() || '';
    const widgetId = req.params.id;
    const updates = req.body;
    
    // Get the current dashboard config
    const config = await storage.getDashboardConfig(userId);
    if (!config) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    // Find the widget to update
    const widgetIndex = config.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Update the widget
    config.widgets[widgetIndex] = {
      ...config.widgets[widgetIndex],
      ...updates
    };
    
    config.lastUpdated = new Date().toISOString();
    
    // Save the updated configuration
    await storage.saveDashboardConfig(userId, config);
    
    res.json(config.widgets[widgetIndex]);
  } catch (error) {
    console.error('Error updating widget:', error);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

// Delete a widget
router.delete('/widgets/:id', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id.toString() || '';
    const widgetId = req.params.id;
    
    // Get the current dashboard config
    const config = await storage.getDashboardConfig(userId);
    if (!config) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    // Find the widget to delete
    const widgetIndex = config.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Remove the widget
    config.widgets.splice(widgetIndex, 1);
    config.lastUpdated = new Date().toISOString();
    
    // Save the updated configuration
    await storage.saveDashboardConfig(userId, config);
    
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting widget:', error);
    res.status(500).json({ error: 'Failed to delete widget' });
  }
});

// Reorder widgets
router.post('/widgets/reorder', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id.toString() || '';
    const { widgetIds } = req.body;
    
    if (!Array.isArray(widgetIds)) {
      return res.status(400).json({ error: 'Widget IDs must be an array' });
    }
    
    // Get the current dashboard config
    const config = await storage.getDashboardConfig(userId);
    if (!config) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    // Create a map of widget IDs to their new positions
    const positionMap = new Map(widgetIds.map((id, index) => [id, index]));
    
    // Update the positions of widgets
    config.widgets.forEach(widget => {
      if (positionMap.has(widget.id)) {
        widget.position = positionMap.get(widget.id)!;
      }
    });
    
    config.lastUpdated = new Date().toISOString();
    
    // Save the updated configuration
    await storage.saveDashboardConfig(userId, config);
    
    res.json(config.widgets);
  } catch (error) {
    console.error('Error reordering widgets:', error);
    res.status(500).json({ error: 'Failed to reorder widgets' });
  }
});

// Get stats data for the stats widget
router.get('/stats', ensureAuthenticated, (req: Request, res: Response) => {
  try {
    const statsData = getSampleWidgetData(req, 'stats');
    res.json(statsData);
  } catch (error) {
    console.error('Error getting stats data:', error);
    res.status(500).json({ error: 'Failed to get stats data' });
  }
});

// Get chart data for the chart widget
router.get('/charts/:source?', ensureAuthenticated, (req: Request, res: Response) => {
  try {
    const source = req.params.source || 'default';
    const chartData = getSampleWidgetData(req, 'chart', source);
    res.json(chartData);
  } catch (error) {
    console.error('Error getting chart data:', error);
    res.status(500).json({ error: 'Failed to get chart data' });
  }
});

// Get activity data for the activity widget
router.get('/activity', ensureAuthenticated, (req: Request, res: Response) => {
  try {
    const activityData = getSampleWidgetData(req, 'activity');
    res.json(activityData);
  } catch (error) {
    console.error('Error getting activity data:', error);
    res.status(500).json({ error: 'Failed to get activity data' });
  }
});

// Get quick actions data for the quick actions widget
router.get('/quick-actions', ensureAuthenticated, (req: Request, res: Response) => {
  try {
    const quickActionsData = getSampleWidgetData(req, 'quickActions');
    res.json(quickActionsData);
  } catch (error) {
    console.error('Error getting quick actions data:', error);
    res.status(500).json({ error: 'Failed to get quick actions data' });
  }
});

export const dashboardRouter = router;