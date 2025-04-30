import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase.js';
import { logger } from './logger.js';
import { initializeDashboardTables } from './dashboard-init.js';
import {
  DEFAULT_DASHBOARDS,
  SAMPLE_DATA,
  DashboardConfig,
  WidgetConfig,
  UserRole,
  StatItem,
  ChartData,
  ActivityItem,
  QuickActionItem
} from '@shared/dashboard-schema.js';

const router = Router();

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  logger.info('[Dashboard API] isAuthenticated middleware running, req.user:', req.user);
  
  // Log headers for debugging
  logger.debug('[Dashboard API] Request headers:', req.headers);
  
  // If user is authenticated via session, continue
  if (req.isAuthenticated && req.isAuthenticated()) {
    logger.info('[Dashboard API] User authenticated via session');
    return next();
  }
  
  // Check for token-based auth (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Verify token validity with Supabase
      // For now, we're just checking if it exists and is non-empty
      if (token) {
        logger.info('[Dashboard API] User authenticated via token');
        
        // In development mode, we'll use a test user for convenience
        if (process.env.NODE_ENV === 'development') {
          logger.info('[Dashboard API] Using test user for development');
          // Create a minimal fake user object for development
          req.user = {
            id: '00000000-0000-0000-0000-000000000000',
            role: 'athlete',
            user_metadata: { role: 'athlete' }
          };
        }
        return next();
      }
    } catch (err) {
      logger.error('[Dashboard API] Token verification error:', err);
    }
  } else {
    logger.info('[Dashboard API] No bearer token found, using debug user');
    
    // In development mode, we'll use a test user for convenience
    if (process.env.NODE_ENV === 'development') {
      logger.info('[Dashboard API] Setting test user for development:', {
        id: '00000000-0000-0000-0000-000000000000',
        role: 'athlete',
        user_metadata: { role: 'athlete' }
      });
      
      // Create a minimal fake user object for development
      req.user = {
        id: '00000000-0000-0000-0000-000000000000',
        role: 'athlete',
        user_metadata: { role: 'athlete' }
      };
      return next();
    }
  }
  
  logger.info('[Dashboard API] Authentication failed');
  res.status(401).json({ error: 'Authentication required' });
};

// Get dashboard configuration
router.get('/config', isAuthenticated, async (req: Request, res: Response) => {
  logger.info('[Dashboard API] Request received, user:', req.user ? 'authenticated' : 'unauthenticated');
  
  try {
    // Check for database table initialization
    const tablesInitialized = await initializeDashboardTables();
    if (!tablesInitialized.success) {
      logger.error('[Dashboard API] Failed to initialize dashboard tables:', tablesInitialized.error);
    }
    
    // Get user ID from authenticated user
    const userId = req.user?.id as string;
    const userRole = req.user?.role as UserRole || 
                    (req.user as any)?.user_metadata?.role as UserRole || 
                    'athlete';
    
    logger.info(`[Dashboard API] Dashboard config requested for user: ${userId} with role: ${userRole}`);
    logger.info('[Dashboard API] User object:', JSON.stringify(req.user, null, 2));
    logger.info(`[Dashboard API] Using role: ${userRole} for dashboard config`);
    
    // Get dashboard config for the user
    const dashboardConfig = await getDashboardWithData(userId, userRole);
    
    if (!dashboardConfig) {
      logger.info('[Dashboard API] No dashboard config found, returning 404');
      return res.status(404).json({ 
        error: 'Dashboard not found',
        message: 'No dashboard configuration found for this user.'
      });
    }
    
    logger.info('[Dashboard API] Returning dashboard config');
    res.json(dashboardConfig);
  } catch (error) {
    logger.error('[Dashboard API] Error getting dashboard config:', error);
    res.status(500).json({ 
      error: 'Dashboard error',
      message: 'Error retrieving dashboard configuration.'
    });
  }
});

// Save dashboard configuration
router.post('/config', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const dashboardConfig = req.body as DashboardConfig;
    
    // Update dashboard config in the database
    const { data, error } = await supabase
      .from('user_dashboard_configs')
      .upsert({
        user_id: userId,
        layout: dashboardConfig.layout,
        settings: dashboardConfig.settings
      }, { onConflict: 'user_id' });
    
    if (error) {
      logger.error('[Dashboard API] Error saving dashboard config:', error);
      return res.status(500).json({ 
        error: 'Save failed',
        message: 'Error saving dashboard configuration.'
      });
    }
    
    // Get the updated config with data
    const updatedConfig = await getDashboardWithData(userId);
    
    res.json(updatedConfig || dashboardConfig);
  } catch (error) {
    logger.error('[Dashboard API] Error saving dashboard config:', error);
    res.status(500).json({ 
      error: 'Dashboard error',
      message: 'Error saving dashboard configuration.'
    });
  }
});

// Get widget data
router.get('/widget/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const widgetId = req.params.id;
    
    // Get dashboard config
    const { data, error } = await supabase
      .from('user_dashboard_configs')
      .select('layout')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      logger.error('[Dashboard API] Error getting widget data:', error);
      return res.status(500).json({ error: 'Error retrieving widget data' });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    const layout = data.layout as WidgetConfig[];
    const widget = layout.find(w => w.id === widgetId);
    
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    // Get widget data based on type
    const widgetData = await getWidgetData(widget.type, userId);
    
    res.json(widgetData);
  } catch (error) {
    logger.error('[Dashboard API] Error getting widget data:', error);
    res.status(500).json({ error: 'Error retrieving widget data' });
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  logger.info('[Dashboard API] Health check received');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get stats widget data
router.get('/stats', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const userRole = req.user?.role as UserRole || 
                    (req.user as any)?.user_metadata?.role as UserRole || 
                    'athlete';
    
    const stats = await getStats(userId, userRole);
    res.json({ items: stats });
  } catch (error) {
    logger.error('[Dashboard API] Error getting stats:', error);
    res.status(500).json({ error: 'Error retrieving stats data' });
  }
});

// Get chart widget data
router.get('/charts/:source?', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const userRole = req.user?.role as UserRole || 
                    (req.user as any)?.user_metadata?.role as UserRole || 
                    'athlete';
    const source = req.params.source || 'default';
    
    const chartData = await getChartData(userId, userRole, source);
    res.json(chartData);
  } catch (error) {
    logger.error('[Dashboard API] Error getting chart data:', error);
    res.status(500).json({ error: 'Error retrieving chart data' });
  }
});

// Get activity widget data
router.get('/activity', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const userRole = req.user?.role as UserRole || 
                    (req.user as any)?.user_metadata?.role as UserRole || 
                    'athlete';
    
    const activities = await getActivity(userId, userRole);
    res.json(activities);
  } catch (error) {
    logger.error('[Dashboard API] Error getting activity data:', error);
    res.status(500).json({ error: 'Error retrieving activity data' });
  }
});

// Get quick actions widget data
router.get('/quick-actions', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const userRole = req.user?.role as UserRole || 
                    (req.user as any)?.user_metadata?.role as UserRole || 
                    'athlete';
    
    const quickActions = await getQuickActions(userId, userRole);
    res.json(quickActions);
  } catch (error) {
    logger.error('[Dashboard API] Error getting quick actions:', error);
    res.status(500).json({ error: 'Error retrieving quick actions data' });
  }
});

// Helper function to get dashboard config with data
async function getDashboardWithData(userId: string, role?: UserRole): Promise<DashboardConfig | null> {
  logger.info(`[Dashboard API] getDashboardWithData - Getting dashboard for user ${userId} with role ${role}`);
  
  try {
    // Check if dashboard table exists
    logger.info('[Dashboard API] Checking if dashboard table exists...');
    const tableCheck = await supabase.from('user_dashboard_configs').select('id').limit(1);
    
    logger.info('[Dashboard API] Table check result:', tableCheck);
    
    if (tableCheck.error) {
      logger.error('[Dashboard API] Error checking if table exists:', tableCheck.error);
      return null;
    }
    
    // Get dashboard config from database
    const { data, error } = await supabase
      .from('user_dashboard_configs')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is expected for new users
      logger.error('[Dashboard API] Error getting dashboard config:', error);
      return null;
    }
    
    // If user has no dashboard yet, create a default one
    if (!data) {
      logger.info(`[Dashboard API] No dashboard config found for user ${userId}, creating default`);
      
      // Get user role if not provided
      if (!role) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          logger.error('[Dashboard API] Error getting user data:', userError);
          role = 'athlete'; // Default fallback
        } else {
          role = (userData?.user?.user_metadata?.role as UserRole) || 'athlete';
        }
        
        logger.info(`[Dashboard API] Determined user role: ${role}`);
      }
      
      // Create default dashboard config
      const defaultLayout = createDefaultDashboard(role);
      
      // Store the default config
      const { data: insertData, error: insertError } = await supabase
        .from('user_dashboard_configs')
        .insert({
          user_id: userId,
          layout: defaultLayout,
          settings: {
            theme: 'system',
            refreshInterval: 30,
            compactView: false
          }
        })
        .select();
      
      if (insertError) {
        logger.error('[Dashboard API] Error creating default dashboard:', insertError);
        return {
          userId,
          layout: defaultLayout,
          settings: {
            theme: 'system',
            refreshInterval: 30,
            compactView: false
          }
        };
      }
      
      // Return the default dashboard with data
      const dashboardConfig: DashboardConfig = {
        userId,
        layout: defaultLayout,
        settings: {
          theme: 'system',
          refreshInterval: 30,
          compactView: false
        }
      };
      
      // Fetch widget data for each widget
      for (const widget of dashboardConfig.layout) {
        widget.data = await getWidgetData(widget.type, userId, role);
      }
      
      return dashboardConfig;
    }
    
    // Convert database format to client format
    const dashboardConfig: DashboardConfig = {
      userId,
      layout: data.layout as WidgetConfig[],
      settings: data.settings as DashboardConfig['settings']
    };
    
    // Fetch widget data for each widget
    for (const widget of dashboardConfig.layout) {
      widget.data = await getWidgetData(widget.type, userId, role);
    }
    
    return dashboardConfig;
  } catch (error) {
    logger.error('[Dashboard API] Error in getDashboardWithData:', error);
    return null;
  }
}

// Create default dashboard based on user role
function createDefaultDashboard(role: UserRole): WidgetConfig[] {
  const defaultWidgets = DEFAULT_DASHBOARDS[role] || DEFAULT_DASHBOARDS.athlete;
  
  // Add IDs to the widgets
  return defaultWidgets.map(widget => ({
    ...widget,
    id: uuidv4()
  }));
}

// Get widget data based on type
async function getWidgetData(type: string, userId: string, role?: UserRole): Promise<any> {
  if (!role) {
    try {
      // Try to get user role from Supabase
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        logger.error('[Dashboard API] Error getting user data:', userError);
        role = 'athlete'; // Default fallback
      } else {
        role = (userData?.user?.user_metadata?.role as UserRole) || 'athlete';
      }
    } catch (error) {
      logger.error('[Dashboard API] Error in getWidgetData:', error);
      role = 'athlete'; // Default fallback
    }
  }
  
  switch (type) {
    case 'stats':
      return { items: await getStats(userId, role) };
    case 'chart':
      return await getChartData(userId, role);
    case 'activity':
      return await getActivity(userId, role);
    case 'quick-actions':
      return await getQuickActions(userId, role);
    case 'matches':
      return await getMatches(userId, role);
    case 'campaigns':
      return await getCampaigns(userId, role);
    case 'profile':
      return await getProfileData(userId, role);
    case 'compliance':
      return await getComplianceData(userId, role);
    default:
      return null;
  }
}

// Get stats data
async function getStats(userId: string, role: UserRole = 'athlete'): Promise<StatItem[]> {
  try {
    // TODO: Get real stats data from database
    // For now, return sample data
    return SAMPLE_DATA.stats[role] || SAMPLE_DATA.stats.athlete;
  } catch (error) {
    logger.error('[Dashboard API] Error getting stats:', error);
    return [];
  }
}

// Get chart data
async function getChartData(userId: string, role: UserRole = 'athlete', source: string = 'default'): Promise<ChartData> {
  try {
    // TODO: Get real chart data from database
    // For now, return sample data
    switch (role) {
      case 'athlete':
        return SAMPLE_DATA.charts.athlete.engagement;
      case 'business':
        return SAMPLE_DATA.charts.business.roi;
      case 'compliance':
        return SAMPLE_DATA.charts.compliance.approvals;
      case 'admin':
        return SAMPLE_DATA.charts.admin.growth;
      default:
        return SAMPLE_DATA.charts.athlete.engagement;
    }
  } catch (error) {
    logger.error('[Dashboard API] Error getting chart data:', error);
    return {
      labels: [],
      datasets: []
    };
  }
}

// Get activity data
async function getActivity(userId: string, role: UserRole = 'athlete'): Promise<ActivityItem[]> {
  try {
    // TODO: Get real activity data from database
    // For now, return sample data
    return SAMPLE_DATA.activity[role] || SAMPLE_DATA.activity.athlete;
  } catch (error) {
    logger.error('[Dashboard API] Error getting activity data:', error);
    return [];
  }
}

// Get quick actions
async function getQuickActions(userId: string, role: UserRole = 'athlete'): Promise<QuickActionItem[]> {
  try {
    // TODO: Get real quick actions data from database or business logic
    // For now, return sample data
    return SAMPLE_DATA.quickActions[role] || SAMPLE_DATA.quickActions.athlete;
  } catch (error) {
    logger.error('[Dashboard API] Error getting quick actions:', error);
    return [];
  }
}

// Get matches data
async function getMatches(userId: string, role: UserRole = 'athlete'): Promise<any> {
  try {
    // TODO: Get real matches data from database
    // For now, return sample data
    return {
      items: [
        { id: 1, name: 'Nike', campaign: 'Summer Collection', matchScore: 95, status: 'pending' },
        { id: 2, name: 'Adidas', campaign: 'Basketball Shoes', matchScore: 88, status: 'accepted' }
      ]
    };
  } catch (error) {
    logger.error('[Dashboard API] Error getting matches data:', error);
    return { items: [] };
  }
}

// Get campaigns data
async function getCampaigns(userId: string, role: UserRole = 'athlete'): Promise<any> {
  try {
    // TODO: Get real campaigns data from database
    // For now, return sample data
    return {
      items: [
        { id: 1, title: 'Summer Collection', athletes: 24, status: 'active', progress: 65 },
        { id: 2, title: 'Fall Lineup', athletes: 12, status: 'draft', progress: 20 }
      ]
    };
  } catch (error) {
    logger.error('[Dashboard API] Error getting campaigns data:', error);
    return { items: [] };
  }
}

// Get profile data
async function getProfileData(userId: string, role: UserRole = 'athlete'): Promise<any> {
  try {
    // TODO: Get real profile data from database
    // For now, return sample data
    return {
      completeness: 85,
      views: 124,
      matches: 8
    };
  } catch (error) {
    logger.error('[Dashboard API] Error getting profile data:', error);
    return {};
  }
}

// Get compliance data
async function getComplianceData(userId: string, role: UserRole = 'compliance'): Promise<any> {
  try {
    // TODO: Get real compliance data from database
    // For now, return sample data
    return {
      pending: 18,
      approved: 86,
      rejected: 7,
      items: [
        { id: 1, campaign: 'Nike - Summer Collection', status: 'pending' },
        { id: 2, campaign: 'Adidas - Basketball Shoes', status: 'pending' }
      ]
    };
  } catch (error) {
    logger.error('[Dashboard API] Error getting compliance data:', error);
    return { pending: 0, approved: 0, rejected: 0, items: [] };
  }
}

export { router as dashboardApiRouter };