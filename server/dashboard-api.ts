import express, { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from './logger.js';
import { supabase } from './supabase.js';
import { v4 as uuidv4 } from 'uuid';
import { initializeDashboardTables } from './dashboard-init.js';

// Create router
export const dashboardApiRouter = express.Router();

// Widget schema
const widgetSchema = z.object({
  id: z.string().optional(), // Optional because it's generated on the server for new widgets
  type: z.enum(['stats', 'chart', 'activity', 'quickActions']),
  title: z.string().min(1),
  position: z.number().int().min(0),
  size: z.enum(['sm', 'md', 'lg', 'xl', 'full']),
  visible: z.boolean(),
  settings: z.record(z.any()).optional()
});

// Dashboard config schema
const dashboardConfigSchema = z.object({
  userId: z.string().min(1),
  lastUpdated: z.string().optional(),
  widgets: z.array(widgetSchema)
});

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: express.NextFunction) => {
  if (!req.user) {
    // Check for JWT authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    // For simplicity, we'll just check if a token is provided
    // In a real app, you'd validate the JWT token here
    // We'll set a userid in the request object to simulate authentication
    req.user = { 
      id: req.query.userId as string || 'test-user',
      role: req.query.role as string || 'athlete'
    };
  }
  
  next();
};

// Initialize dashboard tables if needed
(async () => {
  try {
    const result = await initializeDashboardTables();
    if (result.success) {
      logger.info('[Dashboard API] Dashboard tables initialized successfully');
    } else {
      logger.error('[Dashboard API] Failed to initialize dashboard tables:', result.error);
    }
  } catch (error) {
    logger.error('[Dashboard API] Error initializing dashboard tables:', error);
  }
})();

// GET /api/dashboard/health - Health check endpoint
dashboardApiRouter.get('/health', (req: Request, res: Response) => {
  try {
    logger.info('[Dashboard API] Health check requested');
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('[Dashboard API] Health check error:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/dashboard/config - Get dashboard configuration
dashboardApiRouter.get('/config', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    logger.info(`[Dashboard API] Fetching dashboard config for user ${userId}`);
    
    // Get dashboard configuration from database
    const { rows, error } = await supabase.query(`
      SELECT * FROM user_dashboard_configs 
      WHERE user_id = $1 
      LIMIT 1
    `, [userId]);
    
    if (error) {
      logger.error(`[Dashboard API] Error fetching dashboard config: ${error.message}`);
      return res.status(500).json({ error: 'Failed to fetch dashboard configuration' });
    }
    
    // If no configuration exists, create a default one
    if (!rows || rows.length === 0) {
      logger.info(`[Dashboard API] No dashboard config found for user ${userId}, creating default`);
      
      const defaultConfig = createDefaultDashboard(req.user.role || 'athlete');
      
      // Save default config to database
      const { error: insertError } = await supabase.query(`
        INSERT INTO user_dashboard_configs (user_id, layout)
        VALUES ($1, $2)
        ON CONFLICT (user_id) DO UPDATE
        SET layout = $2, updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [userId, JSON.stringify(defaultConfig)]);
      
      if (insertError) {
        logger.error(`[Dashboard API] Error creating default dashboard config: ${insertError.message}`);
        return res.status(500).json({ error: 'Failed to create default dashboard configuration' });
      }
      
      // Return the default config
      return res.status(200).json({
        userId,
        lastUpdated: new Date().toISOString(),
        widgets: defaultConfig
      });
    }
    
    // Parse configuration
    try {
      const config = rows[0];
      const widgets = config.layout || [];
      
      return res.status(200).json({
        userId,
        lastUpdated: config.updated_at,
        widgets
      });
    } catch (parseError) {
      logger.error(`[Dashboard API] Error parsing dashboard config: ${parseError}`);
      return res.status(500).json({ error: 'Failed to parse dashboard configuration' });
    }
  } catch (error) {
    logger.error('[Dashboard API] Error in GET /config:', error);
    return res.status(500).json({ 
      error: 'Unexpected error fetching dashboard configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/dashboard/config - Update dashboard configuration
dashboardApiRouter.post('/config', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Validate request body
    const parsedBody = dashboardConfigSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({ error: 'Invalid dashboard configuration', details: parsedBody.error });
    }
    
    const { widgets } = parsedBody.data;
    
    logger.info(`[Dashboard API] Updating dashboard config for user ${userId}`);
    
    // Update dashboard configuration in database
    const { error } = await supabase.query(`
      INSERT INTO user_dashboard_configs (user_id, layout)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE
      SET layout = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, JSON.stringify(widgets)]);
    
    if (error) {
      logger.error(`[Dashboard API] Error updating dashboard config: ${error.message}`);
      return res.status(500).json({ error: 'Failed to update dashboard configuration' });
    }
    
    return res.status(200).json({
      userId,
      lastUpdated: new Date().toISOString(),
      widgets
    });
  } catch (error) {
    logger.error('[Dashboard API] Error in POST /config:', error);
    return res.status(500).json({ 
      error: 'Unexpected error updating dashboard configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/dashboard/widget/:id - Get widget data
dashboardApiRouter.get('/widget/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const widgetId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!widgetId) {
      return res.status(400).json({ error: 'Widget ID is required' });
    }
    
    logger.info(`[Dashboard API] Fetching widget ${widgetId} for user ${userId}`);
    
    // Get dashboard configuration from database
    const { rows, error } = await supabase.query(`
      SELECT layout FROM user_dashboard_configs 
      WHERE user_id = $1 
      LIMIT 1
    `, [userId]);
    
    if (error) {
      logger.error(`[Dashboard API] Error fetching widget: ${error.message}`);
      return res.status(500).json({ error: 'Failed to fetch widget' });
    }
    
    if (!rows || rows.length === 0 || !rows[0].layout) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    // Find the widget in the layout
    const widgets = rows[0].layout;
    const widget = widgets.find((w: any) => w.id === widgetId);
    
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Get widget data based on type
    const widgetData = await getWidgetData(widget.type, userId, req.user.role);
    
    return res.status(200).json({
      widget,
      data: widgetData
    });
  } catch (error) {
    logger.error(`[Dashboard API] Error in GET /widget/${req.params.id}:`, error);
    return res.status(500).json({ 
      error: 'Unexpected error fetching widget data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/dashboard/widgets - Add a new widget
dashboardApiRouter.post('/widgets', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Validate request body
    const widgetData = widgetSchema.omit({ id: true }).safeParse(req.body);
    if (!widgetData.success) {
      return res.status(400).json({ error: 'Invalid widget data', details: widgetData.error });
    }
    
    // Generate a unique ID for the widget
    const widgetId = `${widgetData.data.type}-${uuidv4()}`;
    const newWidget = { ...widgetData.data, id: widgetId };
    
    logger.info(`[Dashboard API] Adding new widget for user ${userId}`);
    
    // Get existing dashboard configuration
    const { data, error } = await supabase.query(`
      SELECT layout FROM user_dashboard_configs 
      WHERE user_id = $1 
      LIMIT 1
    `, [userId]);
    
    if (error) {
      logger.error(`[Dashboard API] Error fetching existing config: ${error.message}`);
      return res.status(500).json({ error: 'Failed to add widget' });
    }
    
    let widgets = [];
    if (data && data.length > 0 && data[0].layout) {
      widgets = data[0].layout;
    }
    
    // Add the new widget
    widgets.push(newWidget);
    
    // Update dashboard configuration in database
    const { error: updateError } = await supabase.query(`
      INSERT INTO user_dashboard_configs (user_id, layout)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE
      SET layout = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, JSON.stringify(widgets)]);
    
    if (updateError) {
      logger.error(`[Dashboard API] Error adding widget: ${updateError.message}`);
      return res.status(500).json({ error: 'Failed to add widget' });
    }
    
    return res.status(201).json(newWidget);
  } catch (error) {
    logger.error('[Dashboard API] Error in POST /widgets:', error);
    return res.status(500).json({ 
      error: 'Unexpected error adding widget',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/dashboard/widgets/:id - Update a widget
dashboardApiRouter.patch('/widgets/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const widgetId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!widgetId) {
      return res.status(400).json({ error: 'Widget ID is required' });
    }
    
    // Get existing dashboard configuration
    const { data, error } = await supabase.query(`
      SELECT layout FROM user_dashboard_configs 
      WHERE user_id = $1 
      LIMIT 1
    `, [userId]);
    
    if (error) {
      logger.error(`[Dashboard API] Error fetching config for widget update: ${error.message}`);
      return res.status(500).json({ error: 'Failed to update widget' });
    }
    
    if (!data || data.length === 0 || !data[0].layout) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    // Find and update the widget
    const widgets = data[0].layout;
    const widgetIndex = widgets.findIndex((w: any) => w.id === widgetId);
    
    if (widgetIndex === -1) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Update widget with new data, maintaining its ID
    widgets[widgetIndex] = { 
      ...widgets[widgetIndex], 
      ...req.body,
      id: widgetId // Ensure ID doesn't change
    };
    
    // Update dashboard configuration in database
    const { error: updateError } = await supabase.query(`
      UPDATE user_dashboard_configs
      SET layout = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING *
    `, [JSON.stringify(widgets), userId]);
    
    if (updateError) {
      logger.error(`[Dashboard API] Error updating widget: ${updateError.message}`);
      return res.status(500).json({ error: 'Failed to update widget' });
    }
    
    return res.status(200).json(widgets[widgetIndex]);
  } catch (error) {
    logger.error(`[Dashboard API] Error in PATCH /widgets/${req.params.id}:`, error);
    return res.status(500).json({ 
      error: 'Unexpected error updating widget',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/dashboard/widgets/:id - Remove a widget
dashboardApiRouter.delete('/widgets/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const widgetId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!widgetId) {
      return res.status(400).json({ error: 'Widget ID is required' });
    }
    
    // Get existing dashboard configuration
    const { data, error } = await supabase.query(`
      SELECT layout FROM user_dashboard_configs 
      WHERE user_id = $1 
      LIMIT 1
    `, [userId]);
    
    if (error) {
      logger.error(`[Dashboard API] Error fetching config for widget deletion: ${error.message}`);
      return res.status(500).json({ error: 'Failed to delete widget' });
    }
    
    if (!data || data.length === 0 || !data[0].layout) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    // Filter out the widget to remove
    const widgets = data[0].layout.filter((w: any) => w.id !== widgetId);
    
    // Update dashboard configuration in database
    const { error: updateError } = await supabase.query(`
      UPDATE user_dashboard_configs
      SET layout = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING *
    `, [JSON.stringify(widgets), userId]);
    
    if (updateError) {
      logger.error(`[Dashboard API] Error deleting widget: ${updateError.message}`);
      return res.status(500).json({ error: 'Failed to delete widget' });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`[Dashboard API] Error in DELETE /widgets/${req.params.id}:`, error);
    return res.status(500).json({ 
      error: 'Unexpected error deleting widget',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/dashboard/widgets/reorder - Reorder widgets
dashboardApiRouter.post('/widgets/reorder', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Validate request body
    if (!req.body.widgetIds || !Array.isArray(req.body.widgetIds)) {
      return res.status(400).json({ error: 'Widget IDs array is required' });
    }
    
    const widgetIds = req.body.widgetIds;
    
    // Get existing dashboard configuration
    const { data, error } = await supabase.query(`
      SELECT layout FROM user_dashboard_configs 
      WHERE user_id = $1 
      LIMIT 1
    `, [userId]);
    
    if (error) {
      logger.error(`[Dashboard API] Error fetching config for widget reordering: ${error.message}`);
      return res.status(500).json({ error: 'Failed to reorder widgets' });
    }
    
    if (!data || data.length === 0 || !data[0].layout) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    // Create a map for quick lookup of widgets
    const widgetMap = new Map();
    data[0].layout.forEach((widget: any) => {
      widgetMap.set(widget.id, widget);
    });
    
    // Create a new array with widgets in the desired order
    const reorderedWidgets = widgetIds.map((id: string, index: number) => {
      const widget = widgetMap.get(id);
      if (!widget) {
        return null;
      }
      return { ...widget, position: index };
    }).filter(Boolean);
    
    // Update dashboard configuration in database
    const { error: updateError } = await supabase.query(`
      UPDATE user_dashboard_configs
      SET layout = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING *
    `, [JSON.stringify(reorderedWidgets), userId]);
    
    if (updateError) {
      logger.error(`[Dashboard API] Error reordering widgets: ${updateError.message}`);
      return res.status(500).json({ error: 'Failed to reorder widgets' });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('[Dashboard API] Error in POST /widgets/reorder:', error);
    return res.status(500).json({ 
      error: 'Unexpected error reordering widgets',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/dashboard/stats - Get stats data
dashboardApiRouter.get('/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const role = req.user.role || 'athlete';
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    logger.info(`[Dashboard API] Fetching stats for user ${userId} with role ${role}`);
    
    // Get stats data
    const stats = await getStats(userId, role as any);
    
    return res.status(200).json({ items: stats });
  } catch (error) {
    logger.error('[Dashboard API] Error in GET /stats:', error);
    return res.status(500).json({ 
      error: 'Unexpected error fetching stats data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/dashboard/charts/:source? - Get chart data
dashboardApiRouter.get('/charts/:source?', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const role = req.user.role || 'athlete';
    const source = req.params.source || 'default';
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    logger.info(`[Dashboard API] Fetching chart data for user ${userId} with role ${role} and source ${source}`);
    
    // Get chart data
    const chartData = await getChartData(userId, role as any, source);
    
    return res.status(200).json(chartData);
  } catch (error) {
    logger.error(`[Dashboard API] Error in GET /charts/${req.params.source || 'default'}:`, error);
    return res.status(500).json({ 
      error: 'Unexpected error fetching chart data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/dashboard/activity - Get activity data
dashboardApiRouter.get('/activity', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const role = req.user.role || 'athlete';
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    logger.info(`[Dashboard API] Fetching activity for user ${userId} with role ${role}`);
    
    // Get activity data
    const activity = await getActivity(userId, role as any);
    
    return res.status(200).json(activity);
  } catch (error) {
    logger.error('[Dashboard API] Error in GET /activity:', error);
    return res.status(500).json({ 
      error: 'Unexpected error fetching activity data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/dashboard/quick-actions - Get quick actions data
dashboardApiRouter.get('/quick-actions', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '';
    const role = req.user.role || 'athlete';
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    logger.info(`[Dashboard API] Fetching quick actions for user ${userId} with role ${role}`);
    
    // Get quick actions data
    const quickActions = await getQuickActions(userId, role as any);
    
    return res.status(200).json(quickActions);
  } catch (error) {
    logger.error('[Dashboard API] Error in GET /quick-actions:', error);
    return res.status(500).json({ 
      error: 'Unexpected error fetching quick actions data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to get widget data based on type
async function getWidgetData(type: string, userId: string, role?: string): Promise<any> {
  switch (type) {
    case 'stats':
      return { items: await getStats(userId, role) };
    case 'chart':
      return await getChartData(userId, role);
    case 'activity':
      return await getActivity(userId, role);
    case 'quickActions':
      return await getQuickActions(userId, role);
    default:
      return null;
  }
}

// Helper function to create a default dashboard configuration
function createDefaultDashboard(role: string): any[] {
  const defaultWidgets = [];
  
  // Add a stats widget for all roles
  defaultWidgets.push({
    id: `stats-${uuidv4()}`,
    type: 'stats',
    title: 'Key Metrics',
    position: 0,
    size: 'full',
    visible: true,
    settings: {
      refreshInterval: 300,
    }
  });
  
  // Add role-specific widgets
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
      id: `chart-${uuidv4()}`,
      type: 'chart',
      title: 'Engagement Overview',
      position: 2,
      size: 'md',
      visible: true,
      settings: {
        chartType: 'line',
        dataKey: 'engagement'
      }
    });
    
    defaultWidgets.push({
      id: `quickActions-${uuidv4()}`,
      type: 'quickActions',
      title: 'Partnership Opportunities',
      position: 3,
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
      size: 'md',
      visible: true,
      settings: {
        chartType: 'bar',
        dataKey: 'campaigns'
      }
    });
    
    defaultWidgets.push({
      id: `activity-${uuidv4()}`,
      type: 'activity',
      title: 'Recent Matches',
      position: 2,
      size: 'md',
      visible: true,
      settings: {}
    });
    
    defaultWidgets.push({
      id: `quickActions-${uuidv4()}`,
      type: 'quickActions',
      title: 'Campaign Actions',
      position: 3,
      size: 'md',
      visible: true,
      settings: {}
    });
  } else if (role === 'compliance') {
    defaultWidgets.push({
      id: `activity-${uuidv4()}`,
      type: 'activity',
      title: 'Recent Partnership Requests',
      position: 1,
      size: 'lg',
      visible: true,
      settings: {}
    });
    
    defaultWidgets.push({
      id: `chart-${uuidv4()}`,
      type: 'chart',
      title: 'Review Status',
      position: 2,
      size: 'md',
      visible: true,
      settings: {
        chartType: 'pie',
        dataKey: 'compliance'
      }
    });
    
    defaultWidgets.push({
      id: `quickActions-${uuidv4()}`,
      type: 'quickActions',
      title: 'Pending Reviews',
      position: 3,
      size: 'md',
      visible: true,
      settings: {}
    });
  } else if (role === 'admin') {
    defaultWidgets.push({
      id: `chart-${uuidv4()}`,
      type: 'chart',
      title: 'Platform Analytics',
      position: 1,
      size: 'lg',
      visible: true,
      settings: {
        chartType: 'bar',
        dataKey: 'analytics'
      }
    });
    
    defaultWidgets.push({
      id: `activity-${uuidv4()}`,
      type: 'activity',
      title: 'System Activity',
      position: 2,
      size: 'md',
      visible: true,
      settings: {}
    });
    
    defaultWidgets.push({
      id: `quickActions-${uuidv4()}`,
      type: 'quickActions',
      title: 'Admin Actions',
      position: 3,
      size: 'md',
      visible: true,
      settings: {}
    });
  }
  
  return defaultWidgets;
}

// Helper function to get stats data
async function getStats(userId: string, role: string = 'athlete'): Promise<any[]> {
  // Default stats for all roles
  const defaultStats = [
    {
      id: 'total-views',
      label: 'Total Views',
      value: '0',
      change: 0,
      changeType: 'increase',
      changeLabel: 'vs. last month',
      icon: 'eye'
    }
  ];
  
  // Try to fetch real stats from the database
  try {
    // If athlete, try to get their stats
    if (role === 'athlete') {
      try {
        // Find athlete profile
        const { data: athlete, error } = await supabase.query(`
          SELECT * FROM athletes WHERE user_id = $1 LIMIT 1
        `, [userId]);
        
        if (error || !athlete || athlete.length === 0) {
          logger.warn(`No athlete profile found for user ${userId}, using default stats`);
          return [
            {
              id: 'profile-views',
              label: 'Profile Views',
              value: '0',
              change: 0,
              changeType: 'neutral',
              changeLabel: 'vs. last month',
              icon: 'eye'
            },
            {
              id: 'partnership-offers',
              label: 'Partnership Offers',
              value: '0',
              change: 0,
              changeType: 'neutral',
              changeLabel: 'vs. last month',
              icon: 'briefcase'
            },
            {
              id: 'engagement-rate',
              label: 'Engagement Rate',
              value: '0%',
              change: 0,
              changeType: 'neutral',
              changeLabel: 'vs. last month',
              icon: 'activity'
            },
            {
              id: 'matches',
              label: 'Matches',
              value: '0',
              change: 0,
              changeType: 'neutral',
              changeLabel: 'vs. last month',
              icon: 'users'
            }
          ];
        }
        
        // Get partnership offers count
        const { data: offers, error: offersError } = await supabase.query(`
          SELECT COUNT(*) as count FROM partnership_offers WHERE athlete_id = $1
        `, [athlete[0].id]);
        
        // Get matches count
        const { data: matches, error: matchesError } = await supabase.query(`
          SELECT COUNT(*) as count FROM matches WHERE athlete_id = $1
        `, [athlete[0].id]);
        
        return [
          {
            id: 'profile-views',
            label: 'Profile Views',
            value: athlete[0].profile_views?.toString() || '0',
            change: 5,
            changeType: 'increase',
            changeLabel: 'vs. last month',
            icon: 'eye'
          },
          {
            id: 'partnership-offers',
            label: 'Partnership Offers',
            value: (offers && offers[0] ? offers[0].count : '0').toString(),
            change: 2,
            changeType: 'increase',
            changeLabel: 'vs. last month',
            icon: 'briefcase'
          },
          {
            id: 'engagement-rate',
            label: 'Engagement Rate',
            value: '2.4%',
            change: 0.5,
            changeType: 'increase',
            changeLabel: 'vs. last month',
            icon: 'activity'
          },
          {
            id: 'matches',
            label: 'Matches',
            value: (matches && matches[0] ? matches[0].count : '0').toString(),
            change: 1,
            changeType: 'increase',
            changeLabel: 'vs. last month',
            icon: 'users'
          }
        ];
      } catch (error) {
        logger.error(`Error fetching athlete stats: ${error}`);
      }
    } 
    // If business, try to get their stats
    else if (role === 'business') {
      try {
        // Find business profile
        const { data: business, error } = await supabase.query(`
          SELECT * FROM business_profiles WHERE user_id = $1 LIMIT 1
        `, [userId]);
        
        if (error || !business || business.length === 0) {
          logger.warn(`No business profile found for user ${userId}, using default stats`);
          return [
            {
              id: 'active-campaigns',
              label: 'Active Campaigns',
              value: '0',
              change: 0,
              changeType: 'neutral',
              changeLabel: 'vs. last month',
              icon: 'layers'
            },
            {
              id: 'athlete-partnerships',
              label: 'Athlete Partnerships',
              value: '0',
              change: 0,
              changeType: 'neutral',
              changeLabel: 'vs. last month',
              icon: 'users'
            },
            {
              id: 'content-pieces',
              label: 'Content Pieces',
              value: '0',
              change: 0,
              changeType: 'neutral',
              changeLabel: 'vs. last month',
              icon: 'image'
            },
            {
              id: 'audience-reach',
              label: 'Audience Reach',
              value: '0',
              change: 0,
              changeType: 'neutral',
              changeLabel: 'vs. last month',
              icon: 'radio'
            }
          ];
        }
        
        // Get campaigns count
        const { data: campaigns, error: campaignsError } = await supabase.query(`
          SELECT COUNT(*) as count FROM campaigns WHERE business_id = $1 AND status = 'active'
        `, [business[0].id]);
        
        // Get partnerships count
        const { data: partnerships, error: partnershipsError } = await supabase.query(`
          SELECT COUNT(*) as count FROM partnership_offers 
          WHERE business_id = $1 AND status = 'accepted'
        `, [business[0].id]);
        
        return [
          {
            id: 'active-campaigns',
            label: 'Active Campaigns',
            value: (campaigns && campaigns[0] ? campaigns[0].count : '0').toString(),
            change: 1,
            changeType: 'increase',
            changeLabel: 'vs. last month',
            icon: 'layers'
          },
          {
            id: 'athlete-partnerships',
            label: 'Athlete Partnerships',
            value: (partnerships && partnerships[0] ? partnerships[0].count : '0').toString(),
            change: 2,
            changeType: 'increase',
            changeLabel: 'vs. last month',
            icon: 'users'
          },
          {
            id: 'content-pieces',
            label: 'Content Pieces',
            value: '5',
            change: 3,
            changeType: 'increase',
            changeLabel: 'vs. last month',
            icon: 'image'
          },
          {
            id: 'audience-reach',
            label: 'Audience Reach',
            value: '12.5K',
            change: 2000,
            changeType: 'increase',
            changeLabel: 'vs. last month',
            icon: 'radio'
          }
        ];
      } catch (error) {
        logger.error(`Error fetching business stats: ${error}`);
      }
    }
    // If compliance officer, try to get their stats
    else if (role === 'compliance') {
      try {
        // Get pending reviews count
        const { data: pending, error: pendingError } = await supabase.query(`
          SELECT COUNT(*) as count FROM partnership_offers 
          WHERE compliance_status = 'pending'
        `, []);
        
        // Get approved reviews count
        const { data: approved, error: approvedError } = await supabase.query(`
          SELECT COUNT(*) as count FROM partnership_offers 
          WHERE compliance_status = 'approved'
        `, []);
        
        // Get rejected reviews count
        const { data: rejected, error: rejectedError } = await supabase.query(`
          SELECT COUNT(*) as count FROM partnership_offers 
          WHERE compliance_status = 'rejected'
        `, []);
        
        return [
          {
            id: 'pending-reviews',
            label: 'Pending Reviews',
            value: (pending && pending[0] ? pending[0].count : '0').toString(),
            change: 0,
            changeType: 'neutral',
            changeLabel: 'vs. yesterday',
            icon: 'clock'
          },
          {
            id: 'approved-partnerships',
            label: 'Approved Partnerships',
            value: (approved && approved[0] ? approved[0].count : '0').toString(),
            change: 1,
            changeType: 'increase',
            changeLabel: 'vs. yesterday',
            icon: 'check-circle'
          },
          {
            id: 'rejected-partnerships',
            label: 'Rejected Partnerships',
            value: (rejected && rejected[0] ? rejected[0].count : '0').toString(),
            change: 0,
            changeType: 'neutral',
            changeLabel: 'vs. yesterday',
            icon: 'x-circle'
          },
          {
            id: 'average-review-time',
            label: 'Avg. Review Time',
            value: '1.5 days',
            change: -0.2,
            changeType: 'decrease',
            changeLabel: 'faster than last week',
            icon: 'watch'
          }
        ];
      } catch (error) {
        logger.error(`Error fetching compliance stats: ${error}`);
      }
    }
    // If admin, try to get platform stats
    else if (role === 'admin') {
      try {
        // Get users count
        const { data: users, error: usersError } = await supabase.query(`
          SELECT COUNT(*) as count FROM users
        `, []);
        
        // Get athletes count
        const { data: athletes, error: athletesError } = await supabase.query(`
          SELECT COUNT(*) as count FROM athletes
        `, []);
        
        // Get businesses count
        const { data: businesses, error: businessesError } = await supabase.query(`
          SELECT COUNT(*) as count FROM business_profiles
        `, []);
        
        // Get partnerships count
        const { data: partnerships, error: partnershipsError } = await supabase.query(`
          SELECT COUNT(*) as count FROM partnership_offers
          WHERE status = 'accepted'
        `, []);
        
        return [
          {
            id: 'total-users',
            label: 'Total Users',
            value: (users && users[0] ? users[0].count : '0').toString(),
            change: 5,
            changeType: 'increase',
            changeLabel: 'vs. last week',
            icon: 'users'
          },
          {
            id: 'athletes',
            label: 'Athletes',
            value: (athletes && athletes[0] ? athletes[0].count : '0').toString(),
            change: 3,
            changeType: 'increase',
            changeLabel: 'vs. last week',
            icon: 'user'
          },
          {
            id: 'businesses',
            label: 'Businesses',
            value: (businesses && businesses[0] ? businesses[0].count : '0').toString(),
            change: 2,
            changeType: 'increase',
            changeLabel: 'vs. last week',
            icon: 'briefcase'
          },
          {
            id: 'active-partnerships',
            label: 'Active Partnerships',
            value: (partnerships && partnerships[0] ? partnerships[0].count : '0').toString(),
            change: 4,
            changeType: 'increase',
            changeLabel: 'vs. last week',
            icon: 'handshake'
          }
        ];
      } catch (error) {
        logger.error(`Error fetching admin stats: ${error}`);
      }
    }
  } catch (error) {
    logger.error(`Error getting stats for user ${userId} with role ${role}: ${error}`);
  }
  
  // Fallback to default stats if real stats couldn't be fetched
  return defaultStats;
}

// Helper function to get chart data
async function getChartData(userId: string, role: string = 'athlete', source: string = 'default'): Promise<any> {
  // Default chart data structure
  const defaultChartData = {
    title: 'No Data Available',
    description: 'There is no data available for this chart.',
    data: [],
    xAxis: { key: 'x', label: 'X Axis' },
    yAxis: { key: 'y', label: 'Y Axis' },
    series: []
  };
  
  try {
    if (role === 'athlete') {
      if (source === 'engagement') {
        return {
          title: 'Engagement Overview',
          description: 'Your engagement metrics over time',
          data: [
            { date: '2023-01', views: 800, likes: 120, comments: 45 },
            { date: '2023-02', views: 950, likes: 140, comments: 53 },
            { date: '2023-03', views: 1100, likes: 170, comments: 67 },
            { date: '2023-04', views: 1000, likes: 160, comments: 62 },
            { date: '2023-05', views: 1250, likes: 190, comments: 78 },
            { date: '2023-06', views: 1500, likes: 230, comments: 94 }
          ],
          xAxis: { key: 'date', label: 'Month' },
          yAxis: { key: 'views', label: 'Count' },
          series: [
            { key: 'views', name: 'Profile Views', color: '#4F46E5' },
            { key: 'likes', name: 'Likes', color: '#EC4899' },
            { key: 'comments', name: 'Comments', color: '#10B981' }
          ]
        };
      } else if (source === 'offers') {
        return {
          title: 'Partnership Offers',
          description: 'Partnership offers received over time',
          data: [
            { date: '2023-01', received: 2, accepted: 1, declined: 1 },
            { date: '2023-02', received: 3, accepted: 2, declined: 1 },
            { date: '2023-03', received: 5, accepted: 3, declined: 2 },
            { date: '2023-04', received: 4, accepted: 2, declined: 2 },
            { date: '2023-05', received: 6, accepted: 4, declined: 2 },
            { date: '2023-06', received: 8, accepted: 5, declined: 3 }
          ],
          xAxis: { key: 'date', label: 'Month' },
          yAxis: { key: 'received', label: 'Count' },
          series: [
            { key: 'received', name: 'Received', color: '#4F46E5' },
            { key: 'accepted', name: 'Accepted', color: '#10B981' },
            { key: 'declined', name: 'Declined', color: '#F43F5E' }
          ]
        };
      } else {
        // Default athlete chart
        return {
          title: 'Profile Performance',
          description: 'Your profile performance metrics',
          data: [
            { date: '2023-01', views: 800, clicks: 150 },
            { date: '2023-02', views: 950, clicks: 180 },
            { date: '2023-03', views: 1100, clicks: 210 },
            { date: '2023-04', views: 1000, clicks: 190 },
            { date: '2023-05', views: 1250, clicks: 240 },
            { date: '2023-06', views: 1500, clicks: 290 }
          ],
          xAxis: { key: 'date', label: 'Month' },
          yAxis: { key: 'views', label: 'Count' },
          series: [
            { key: 'views', name: 'Profile Views', color: '#4F46E5' },
            { key: 'clicks', name: 'Profile Clicks', color: '#EC4899' }
          ]
        };
      }
    } else if (role === 'business') {
      if (source === 'campaigns') {
        return {
          title: 'Campaign Performance',
          description: 'Performance metrics for your campaigns',
          data: [
            { campaign: 'Summer Promo', impressions: 12500, clicks: 750, conversions: 120 },
            { campaign: 'Fall Collection', impressions: 18000, clicks: 1200, conversions: 190 },
            { campaign: 'Holiday Special', impressions: 25000, clicks: 1800, conversions: 320 },
            { campaign: 'New Year Sale', impressions: 20000, clicks: 1500, conversions: 250 }
          ],
          xAxis: { key: 'campaign', label: 'Campaign' },
          yAxis: { key: 'impressions', label: 'Count' },
          series: [
            { key: 'impressions', name: 'Impressions', color: '#4F46E5' },
            { key: 'clicks', name: 'Clicks', color: '#EC4899' },
            { key: 'conversions', name: 'Conversions', color: '#10B981' }
          ]
        };
      } else if (source === 'athletes') {
        return {
          title: 'Athlete Performance',
          description: 'Performance metrics for partnered athletes',
          data: [
            { athlete: 'John D.', impressions: 5200, engagement: 780, conversions: 45 },
            { athlete: 'Sarah T.', impressions: 7800, engagement: 1150, conversions: 82 },
            { athlete: 'Michael K.', impressions: 6500, engagement: 950, conversions: 68 },
            { athlete: 'Emma R.', impressions: 9200, engagement: 1350, conversions: 95 }
          ],
          xAxis: { key: 'athlete', label: 'Athlete' },
          yAxis: { key: 'impressions', label: 'Count' },
          series: [
            { key: 'impressions', name: 'Impressions', color: '#4F46E5' },
            { key: 'engagement', name: 'Engagement', color: '#EC4899' },
            { key: 'conversions', name: 'Conversions', color: '#10B981' }
          ]
        };
      } else {
        // Default business chart
        return {
          title: 'Marketing Performance',
          description: 'Overall marketing performance metrics',
          data: [
            { date: '2023-01', spend: 2000, revenue: 8000, roi: 4 },
            { date: '2023-02', spend: 2500, revenue: 11000, roi: 4.4 },
            { date: '2023-03', spend: 3000, revenue: 15000, roi: 5 },
            { date: '2023-04', spend: 2800, revenue: 14000, roi: 5 },
            { date: '2023-05', spend: 3500, revenue: 19000, roi: 5.4 },
            { date: '2023-06', spend: 4000, revenue: 24000, roi: 6 }
          ],
          xAxis: { key: 'date', label: 'Month' },
          yAxis: { key: 'revenue', label: 'Amount ($)' },
          series: [
            { key: 'spend', name: 'Marketing Spend', color: '#F43F5E' },
            { key: 'revenue', name: 'Revenue', color: '#10B981' }
          ]
        };
      }
    } else if (role === 'compliance') {
      if (source === 'compliance') {
        return {
          title: 'Review Status',
          description: 'Compliance review statistics',
          data: [
            { status: 'Approved', value: 65 },
            { status: 'Pending', value: 25 },
            { status: 'Rejected', value: 10 }
          ],
          type: 'pie',
          nameKey: 'status',
          dataKey: 'value',
          colors: ['#10B981', '#F59E0B', '#F43F5E']
        };
      } else if (source === 'timeline') {
        return {
          title: 'Review Timeline',
          description: 'Compliance review timeline',
          data: [
            { date: '2023-01', reviews: 48, approved: 35, rejected: 13 },
            { date: '2023-02', reviews: 52, approved: 40, rejected: 12 },
            { date: '2023-03', reviews: 65, approved: 50, rejected: 15 },
            { date: '2023-04', reviews: 58, approved: 45, rejected: 13 },
            { date: '2023-05', reviews: 72, approved: 58, rejected: 14 },
            { date: '2023-06', reviews: 85, approved: 70, rejected: 15 }
          ],
          xAxis: { key: 'date', label: 'Month' },
          yAxis: { key: 'reviews', label: 'Count' },
          series: [
            { key: 'reviews', name: 'Total Reviews', color: '#4F46E5' },
            { key: 'approved', name: 'Approved', color: '#10B981' },
            { key: 'rejected', name: 'Rejected', color: '#F43F5E' }
          ]
        };
      } else {
        // Default compliance chart
        return {
          title: 'Compliance Overview',
          description: 'Overview of compliance metrics',
          data: [
            { date: '2023-01', reviews: 48, avgTime: 1.8 },
            { date: '2023-02', reviews: 52, avgTime: 1.7 },
            { date: '2023-03', reviews: 65, avgTime: 1.6 },
            { date: '2023-04', reviews: 58, avgTime: 1.5 },
            { date: '2023-05', reviews: 72, avgTime: 1.4 },
            { date: '2023-06', reviews: 85, avgTime: 1.3 }
          ],
          xAxis: { key: 'date', label: 'Month' },
          yAxis: { key: 'reviews', label: 'Count' },
          series: [
            { key: 'reviews', name: 'Total Reviews', color: '#4F46E5' }
          ],
          secondaryYAxis: {
            key: 'avgTime', 
            name: 'Avg. Review Time (days)',
            color: '#F59E0B'
          }
        };
      }
    } else if (role === 'admin') {
      if (source === 'analytics') {
        return {
          title: 'Platform Analytics',
          description: 'Key platform metrics over time',
          data: [
            { date: '2023-01', users: 240, athletes: 150, businesses: 90 },
            { date: '2023-02', users: 280, athletes: 175, businesses: 105 },
            { date: '2023-03', users: 330, athletes: 205, businesses: 125 },
            { date: '2023-04', users: 390, athletes: 240, businesses: 150 },
            { date: '2023-05', users: 450, athletes: 275, businesses: 175 },
            { date: '2023-06', users: 520, athletes: 320, businesses: 200 }
          ],
          xAxis: { key: 'date', label: 'Month' },
          yAxis: { key: 'users', label: 'Count' },
          series: [
            { key: 'users', name: 'Total Users', color: '#4F46E5' },
            { key: 'athletes', name: 'Athletes', color: '#EC4899' },
            { key: 'businesses', name: 'Businesses', color: '#10B981' }
          ]
        };
      } else if (source === 'partnerships') {
        return {
          title: 'Partnerships Overview',
          description: 'Partnership statistics',
          data: [
            { date: '2023-01', created: 45, completed: 30, rejected: 15 },
            { date: '2023-02', created: 52, completed: 38, rejected: 14 },
            { date: '2023-03', created: 65, completed: 50, rejected: 15 },
            { date: '2023-04', created: 78, completed: 60, rejected: 18 },
            { date: '2023-05', created: 90, completed: 72, rejected: 18 },
            { date: '2023-06', created: 105, completed: 85, rejected: 20 }
          ],
          xAxis: { key: 'date', label: 'Month' },
          yAxis: { key: 'created', label: 'Count' },
          series: [
            { key: 'created', name: 'Created', color: '#4F46E5' },
            { key: 'completed', name: 'Completed', color: '#10B981' },
            { key: 'rejected', name: 'Rejected', color: '#F43F5E' }
          ]
        };
      } else {
        // Default admin chart
        return {
          title: 'User Growth',
          description: 'Platform user growth over time',
          data: [
            { date: '2023-01', users: 240, growth: 15 },
            { date: '2023-02', users: 280, growth: 16.7 },
            { date: '2023-03', users: 330, growth: 17.9 },
            { date: '2023-04', users: 390, growth: 18.2 },
            { date: '2023-05', users: 450, growth: 15.4 },
            { date: '2023-06', users: 520, growth: 15.6 }
          ],
          xAxis: { key: 'date', label: 'Month' },
          yAxis: { key: 'users', label: 'Users' },
          series: [
            { key: 'users', name: 'Total Users', color: '#4F46E5', type: 'bar' }
          ],
          secondaryYAxis: {
            key: 'growth', 
            name: 'Growth (%)',
            color: '#F59E0B'
          }
        };
      }
    }
  } catch (error) {
    logger.error(`Error getting chart data for user ${userId} with role ${role}: ${error}`);
  }
  
  // Fallback to default chart data
  return defaultChartData;
}

// Helper function to get activity data
async function getActivity(userId: string, role: string = 'athlete'): Promise<any[]> {
  // Default activity items
  const defaultActivity = [
    {
      id: 'activity-1',
      title: 'Welcome to your dashboard',
      description: 'Your personalized dashboard has been set up.',
      timestamp: new Date().toISOString(),
      type: 'welcome',
      icon: 'bell'
    }
  ];
  
  try {
    if (role === 'athlete') {
      // Find athlete profile
      const { data: athlete, error } = await supabase.query(`
        SELECT * FROM athletes WHERE user_id = $1 LIMIT 1
      `, [userId]);
      
      if (error || !athlete || athlete.length === 0) {
        return defaultActivity;
      }
      
      // Try to get real activity data
      const { data: offers, error: offersError } = await supabase.query(`
        SELECT po.*, b.name as business_name
        FROM partnership_offers po
        JOIN business_profiles b ON po.business_id = b.id
        WHERE po.athlete_id = $1
        ORDER BY po.created_at DESC
        LIMIT 5
      `, [athlete[0].id]);
      
      if (offersError || !offers || offers.length === 0) {
        return defaultActivity;
      }
      
      // Convert to activity items
      return offers.map((offer: any) => ({
        id: `offer-${offer.id}`,
        title: `New partnership offer from ${offer.business_name}`,
        description: `You have received a new partnership offer for ${offer.title || 'a campaign'}`,
        timestamp: offer.created_at,
        type: 'offer',
        icon: 'mail',
        data: { offerId: offer.id, status: offer.status }
      }));
    } else if (role === 'business') {
      // Find business profile
      const { data: business, error } = await supabase.query(`
        SELECT * FROM business_profiles WHERE user_id = $1 LIMIT 1
      `, [userId]);
      
      if (error || !business || business.length === 0) {
        return defaultActivity;
      }
      
      // Try to get real activity data
      const { data: matches, error: matchesError } = await supabase.query(`
        SELECT m.*, a.name as athlete_name
        FROM matches m
        JOIN athletes a ON m.athlete_id = a.id
        WHERE m.business_id = $1
        ORDER BY m.created_at DESC
        LIMIT 5
      `, [business[0].id]);
      
      if (matchesError || !matches || matches.length === 0) {
        return defaultActivity;
      }
      
      // Convert to activity items
      return matches.map((match: any) => ({
        id: `match-${match.id}`,
        title: `New match with ${match.athlete_name}`,
        description: `You have a new match with an athlete for your campaign.`,
        timestamp: match.created_at,
        type: 'match',
        icon: 'users',
        data: { matchId: match.id, status: match.status }
      }));
    } else if (role === 'compliance') {
      // Try to get real activity data
      const { data: reviews, error: reviewsError } = await supabase.query(`
        SELECT po.*, a.name as athlete_name, b.name as business_name
        FROM partnership_offers po
        JOIN athletes a ON po.athlete_id = a.id
        JOIN business_profiles b ON po.business_id = b.id
        WHERE po.compliance_status = 'pending'
        ORDER BY po.created_at DESC
        LIMIT 5
      `, []);
      
      if (reviewsError || !reviews || reviews.length === 0) {
        return [
          {
            id: 'review-1',
            title: 'Partnership review needed',
            description: 'There are partnership agreements awaiting your review.',
            timestamp: new Date().toISOString(),
            type: 'review',
            icon: 'file-text'
          }
        ];
      }
      
      // Convert to activity items
      return reviews.map((review: any) => ({
        id: `review-${review.id}`,
        title: `Review needed: ${review.business_name} & ${review.athlete_name}`,
        description: `A partnership agreement is waiting for your review.`,
        timestamp: review.created_at,
        type: 'review',
        icon: 'file-text',
        data: { offerId: review.id, status: review.compliance_status }
      }));
    } else if (role === 'admin') {
      // Try to get recent user registrations
      const { data: users, error: usersError } = await supabase.query(`
        SELECT * FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `, []);
      
      if (usersError || !users || users.length === 0) {
        return [
          {
            id: 'system-1',
            title: 'Platform monitoring active',
            description: 'You are now monitoring system activity.',
            timestamp: new Date().toISOString(),
            type: 'system',
            icon: 'activity'
          }
        ];
      }
      
      // Convert to activity items
      return users.map((user: any) => ({
        id: `user-${user.id}`,
        title: `New user registered: ${user.email}`,
        description: `A new user has registered with role: ${user.role}`,
        timestamp: user.created_at,
        type: 'user',
        icon: 'user-plus',
        data: { userId: user.id, role: user.role }
      }));
    }
  } catch (error) {
    logger.error(`Error getting activity for user ${userId} with role ${role}: ${error}`);
  }
  
  // Fallback to default activity
  return defaultActivity;
}

// Helper function to get quick actions data
async function getQuickActions(userId: string, role: string = 'athlete'): Promise<any[]> {
  // Default quick actions
  const defaultQuickActions = [
    {
      id: 'complete-profile',
      title: 'Complete your profile',
      description: 'Finish setting up your profile to get better matches',
      icon: 'user',
      color: 'blue',
      link: '/profile'
    }
  ];
  
  try {
    if (role === 'athlete') {
      return [
        {
          id: 'view-offers',
          title: 'View partnership offers',
          description: 'You have new partnership offers to review',
          icon: 'mail',
          color: 'blue',
          link: '/offers'
        },
        {
          id: 'update-profile',
          title: 'Update your profile',
          description: 'Keep your profile up-to-date to get better matches',
          icon: 'user',
          color: 'green',
          link: '/profile'
        },
        {
          id: 'explore-businesses',
          title: 'Explore businesses',
          description: 'Discover businesses looking for athletes like you',
          icon: 'search',
          color: 'purple',
          link: '/explore'
        },
        {
          id: 'manage-content',
          title: 'Manage your content',
          description: 'Update your content portfolio',
          icon: 'image',
          color: 'amber',
          link: '/content'
        }
      ];
    } else if (role === 'business') {
      return [
        {
          id: 'create-campaign',
          title: 'Create a new campaign',
          description: 'Set up a new marketing campaign with athletes',
          icon: 'plus-circle',
          color: 'blue',
          link: '/campaigns/new'
        },
        {
          id: 'view-matches',
          title: 'View athlete matches',
          description: 'You have new athlete matches to review',
          icon: 'users',
          color: 'green',
          link: '/matches'
        },
        {
          id: 'manage-partnerships',
          title: 'Manage partnerships',
          description: 'Review and manage your active partnerships',
          icon: 'handshake',
          color: 'purple',
          link: '/partnerships'
        },
        {
          id: 'analytics-dashboard',
          title: 'View analytics',
          description: 'Check the performance of your campaigns',
          icon: 'bar-chart',
          color: 'amber',
          link: '/analytics'
        }
      ];
    } else if (role === 'compliance') {
      return [
        {
          id: 'pending-reviews',
          title: 'Review pending partnerships',
          description: 'There are partnerships waiting for your review',
          icon: 'clipboard',
          color: 'blue',
          link: '/compliance/pending'
        },
        {
          id: 'review-content',
          title: 'Review content submissions',
          description: 'Check content for compliance with guidelines',
          icon: 'eye',
          color: 'amber',
          link: '/compliance/content'
        },
        {
          id: 'update-guidelines',
          title: 'Update compliance guidelines',
          description: 'Review and update compliance guidelines',
          icon: 'book',
          color: 'green',
          link: '/compliance/guidelines'
        },
        {
          id: 'generate-report',
          title: 'Generate compliance report',
          description: 'Create a report of compliance activities',
          icon: 'file-text',
          color: 'purple',
          link: '/compliance/reports'
        }
      ];
    } else if (role === 'admin') {
      return [
        {
          id: 'manage-users',
          title: 'Manage users',
          description: 'View and manage user accounts',
          icon: 'users',
          color: 'blue',
          link: '/admin/users'
        },
        {
          id: 'system-settings',
          title: 'System settings',
          description: 'Configure system settings',
          icon: 'settings',
          color: 'amber',
          link: '/admin/settings'
        },
        {
          id: 'view-analytics',
          title: 'Platform analytics',
          description: 'View detailed platform analytics',
          icon: 'bar-chart',
          color: 'green',
          link: '/admin/analytics'
        },
        {
          id: 'manage-content',
          title: 'Content moderation',
          description: 'Moderate user content',
          icon: 'shield',
          color: 'purple',
          link: '/admin/content'
        }
      ];
    }
  } catch (error) {
    logger.error(`Error getting quick actions for user ${userId} with role ${role}: ${error}`);
  }
  
  // Fallback to default quick actions
  return defaultQuickActions;
}