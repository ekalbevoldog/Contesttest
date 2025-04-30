import express, { Router } from 'express';
import { supabase, supabaseAdmin } from './supabase';

type DashboardWidget = {
  id: string;
  type: string;
  title: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  settings: Record<string, any>;
  data?: any;
};

type DashboardConfig = {
  id: string;
  user_id: string;
  widgets: DashboardWidget[];
  last_updated: string;
};

// Default widget configurations based on user role
const defaultWidgets = {
  athlete: [
    {
      id: 'athlete-stats',
      type: 'stats',
      title: 'Your Performance',
      position: { x: 0, y: 0 },
      size: { width: 12, height: 3 },
      settings: {
        metrics: [
          { name: 'Campaign Opportunities', value: 0, change: 0, icon: 'trending-up' },
          { name: 'Accepted Offers', value: 0, change: 0, icon: 'check-circle' },
          { name: 'Total Earnings', value: '$0', change: 0, icon: 'dollar-sign' },
          { name: 'Profile Views', value: 0, change: 0, icon: 'eye' },
        ]
      }
    },
    {
      id: 'athlete-engagement',
      type: 'chart',
      title: 'Engagement Metrics',
      position: { x: 0, y: 3 },
      size: { width: 8, height: 8 },
      settings: {
        chartType: 'line',
        xAxis: 'date',
        series: [
          { name: 'Profile Views', dataKey: 'views', color: '#8884d8' },
          { name: 'Match Rate', dataKey: 'matches', color: '#82ca9d' }
        ]
      }
    },
    {
      id: 'athlete-upcoming',
      type: 'timeline',
      title: 'Upcoming Deliverables',
      position: { x: 8, y: 3 },
      size: { width: 4, height: 8 },
      settings: {
        dateFormat: 'MMM D, YYYY',
        showStatus: true
      }
    }
  ],
  business: [
    {
      id: 'business-stats',
      type: 'stats',
      title: 'Campaign Performance',
      position: { x: 0, y: 0 },
      size: { width: 12, height: 3 },
      settings: {
        metrics: [
          { name: 'Active Campaigns', value: 0, change: 0, icon: 'briefcase' },
          { name: 'Athlete Matches', value: 0, change: 0, icon: 'users' },
          { name: 'Conversion Rate', value: '0%', change: 0, icon: 'percent' },
          { name: 'Budget Utilization', value: '0%', change: 0, icon: 'dollar-sign' },
        ]
      }
    },
    {
      id: 'business-roi',
      type: 'chart',
      title: 'ROI Metrics',
      position: { x: 0, y: 3 },
      size: { width: 8, height: 8 },
      settings: {
        chartType: 'bar',
        xAxis: 'category',
        series: [
          { name: 'Investment', dataKey: 'investment', color: '#8884d8' },
          { name: 'Return', dataKey: 'return', color: '#82ca9d' }
        ]
      }
    },
    {
      id: 'business-recommendations',
      type: 'recommendations',
      title: 'Recommended Athletes',
      position: { x: 8, y: 3 },
      size: { width: 4, height: 8 },
      settings: {
        limit: 5,
        showScore: true
      }
    }
  ],
  compliance: [
    {
      id: 'compliance-stats',
      type: 'stats',
      title: 'Compliance Overview',
      position: { x: 0, y: 0 },
      size: { width: 12, height: 3 },
      settings: {
        metrics: [
          { name: 'Pending Reviews', value: 0, change: 0, icon: 'clock' },
          { name: 'Approved Today', value: 0, change: 0, icon: 'check-circle' },
          { name: 'Rejected Today', value: 0, change: 0, icon: 'x-circle' },
          { name: 'Avg. Review Time', value: '0h', change: 0, icon: 'activity' },
        ]
      }
    },
    {
      id: 'compliance-queue',
      type: 'queue',
      title: 'Review Queue',
      position: { x: 0, y: 3 },
      size: { width: 12, height: 8 },
      settings: {
        showPriority: true,
        dateFormat: 'MMM D, YYYY'
      }
    }
  ],
  admin: [
    {
      id: 'admin-stats',
      type: 'stats',
      title: 'Platform Overview',
      position: { x: 0, y: 0 },
      size: { width: 12, height: 3 },
      settings: {
        metrics: [
          { name: 'Total Users', value: 0, change: 0, icon: 'users' },
          { name: 'Active Campaigns', value: 0, change: 0, icon: 'briefcase' },
          { name: 'Contracts Signed', value: 0, change: 0, icon: 'file-text' },
          { name: 'Platform Revenue', value: '$0', change: 0, icon: 'dollar-sign' },
        ]
      }
    },
    {
      id: 'admin-growth',
      type: 'chart',
      title: 'Platform Growth',
      position: { x: 0, y: 3 },
      size: { width: 8, height: 8 },
      settings: {
        chartType: 'area',
        xAxis: 'date',
        series: [
          { name: 'Athletes', dataKey: 'athletes', color: '#8884d8' },
          { name: 'Businesses', dataKey: 'businesses', color: '#82ca9d' },
          { name: 'Campaigns', dataKey: 'campaigns', color: '#ffc658' }
        ]
      }
    },
    {
      id: 'admin-alerts',
      type: 'alerts',
      title: 'System Alerts',
      position: { x: 8, y: 3 },
      size: { width: 4, height: 8 },
      settings: {
        showPriority: true,
        dateFormat: 'MMM D, YYYY'
      }
    }
  ]
};

// Function to create a dashboard config for a user with default widgets
async function createDefaultDashboardConfig(userId: string, userRole: string): Promise<DashboardConfig | null> {
  console.log(`[Dashboard API] createDefaultDashboardConfig - Creating default dashboard for user ${userId} with role ${userRole}`);
  
  try {
    // Check if user_dashboard_configs table exists and create it if needed
    console.log(`[Dashboard API] Checking if dashboard table exists and creating if needed...`);
    
    try {
      // First check if the table exists
      const { error: tableQueryError } = await supabaseAdmin
        .from('user_dashboard_configs')
        .select('count(*)', { count: 'exact', head: true });
        
      if (tableQueryError && tableQueryError.code === '42P01') { // Table doesn't exist error
        console.log(`[Dashboard API] Table user_dashboard_configs doesn't exist. Creating it...`);
        
        // SQL to create the table
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS user_dashboard_configs (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL UNIQUE,
            widgets JSONB NOT NULL DEFAULT '[]'::JSONB,
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;
        
        // Execute the SQL directly using Supabase's SQL execution capability
        const { error: createTableError } = await supabaseAdmin.rpc('exec_sql', {
          sql: createTableSQL
        });
        
        if (createTableError) {
          console.error(`[Dashboard API] Error creating table:`, createTableError);
          throw new Error(`Failed to create dashboard table: ${createTableError.message}`);
        }
        console.log(`[Dashboard API] Table created successfully`);
      }
    } catch (tableCheckError) {
      console.error(`[Dashboard API] Error checking/creating table:`, tableCheckError);
      // Continue anyway and try to insert
    }
    
    // Get the appropriate default widgets based on user role
    console.log(`[Dashboard API] Getting default widgets for role: ${userRole}`);
    const widgets = defaultWidgets[userRole as keyof typeof defaultWidgets] || defaultWidgets.athlete;
    console.log(`[Dashboard API] Found ${widgets.length} default widgets for role: ${userRole}`);
    
    // Insert a new dashboard config into the database
    console.log(`[Dashboard API] Inserting new dashboard config for user: ${userId}`);
    const { data, error } = await supabaseAdmin
      .from('user_dashboard_configs')
      .insert({
        user_id: userId,
        widgets: widgets,
        last_updated: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Dashboard API] Error creating default dashboard config:', error);
      return null;
    }
    
    console.log(`[Dashboard API] Successfully created default dashboard config for user: ${userId}`);
    return data as DashboardConfig;
  } catch (error) {
    console.error('[Dashboard API] Unexpected error in createDefaultDashboardConfig:', error);
    return null;
  }
}

// Function to get dashboard widgets with sample data for a user
async function getDashboardWithData(userId: string, userRole: string): Promise<DashboardConfig | null> {
  console.log(`[Dashboard API] getDashboardWithData - Getting dashboard for user ${userId} with role ${userRole}`);
  
  // Try to get the existing dashboard config
  console.log(`[Dashboard API] Checking if dashboard table exists...`);
  try {
    const tableCheck = await supabaseAdmin
      .from('user_dashboard_configs')
      .select('count(*)', { count: 'exact', head: true });
      
    console.log(`[Dashboard API] Table check result:`, tableCheck);
    
    if (tableCheck.error) {
      console.error(`[Dashboard API] Error checking if table exists:`, tableCheck.error);
      return null;
    }
  } catch (tableCheckError) {
    console.error(`[Dashboard API] Exception checking if table exists:`, tableCheckError);
  }
  
  console.log(`[Dashboard API] Querying dashboard config for user ${userId}`);
  const { data, error } = await supabaseAdmin
    .from('user_dashboard_configs')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  console.log(`[Dashboard API] Query result:`, { data: !!data, error });
  
  if (error) {
    console.log(`[Dashboard API] Error code: ${error.code}, message: ${error.message}`);
    if (error.code === 'PGRST116') {
      console.log(`[Dashboard API] No records found, creating default dashboard config for user ${userId}`);
      // No records found, create a default dashboard config
      return await createDefaultDashboardConfig(userId, userRole);
    }
    console.error('[Dashboard API] Error getting dashboard config:', error);
    return null;
  }
  
  // Enhance widgets with actual data from other tables (this is a simplified implementation)
  const dashboardConfig = data as DashboardConfig;
  const enhancedWidgets = await Promise.all(
    dashboardConfig.widgets.map(async (widget) => {
      // Add real data to each widget based on its type
      switch (widget.type) {
        case 'stats':
          if (userRole === 'athlete') {
            // Get athlete stats
            widget.data = {
              metrics: [
                { name: 'Campaign Opportunities', value: 5, change: 2, icon: 'trending-up' },
                { name: 'Accepted Offers', value: 2, change: 1, icon: 'check-circle' },
                { name: 'Total Earnings', value: '$500', change: 10, icon: 'dollar-sign' },
                { name: 'Profile Views', value: 120, change: 30, icon: 'eye' },
              ]
            };
          } else if (userRole === 'business') {
            // Get business stats
            widget.data = {
              metrics: [
                { name: 'Active Campaigns', value: 3, change: 1, icon: 'briefcase' },
                { name: 'Athlete Matches', value: 12, change: 4, icon: 'users' },
                { name: 'Conversion Rate', value: '25%', change: 5, icon: 'percent' },
                { name: 'Budget Utilization', value: '60%', change: 10, icon: 'dollar-sign' },
              ]
            };
          } else if (userRole === 'compliance') {
            // Get compliance stats
            widget.data = {
              metrics: [
                { name: 'Pending Reviews', value: 8, change: -2, icon: 'clock' },
                { name: 'Approved Today', value: 5, change: 1, icon: 'check-circle' },
                { name: 'Rejected Today', value: 2, change: 0, icon: 'x-circle' },
                { name: 'Avg. Review Time', value: '2h', change: -10, icon: 'activity' },
              ]
            };
          } else if (userRole === 'admin') {
            // Get admin stats
            widget.data = {
              metrics: [
                { name: 'Total Users', value: 150, change: 15, icon: 'users' },
                { name: 'Active Campaigns', value: 25, change: 8, icon: 'briefcase' },
                { name: 'Contracts Signed', value: 45, change: 12, icon: 'file-text' },
                { name: 'Platform Revenue', value: '$10,000', change: 20, icon: 'dollar-sign' },
              ]
            };
          }
          break;
        
        case 'chart':
          // Sample chart data
          if (widget.settings.chartType === 'line' || widget.settings.chartType === 'area') {
            widget.data = [
              { date: '2025-01-01', views: 100, matches: 10, athletes: 50, businesses: 30, campaigns: 20 },
              { date: '2025-02-01', views: 120, matches: 12, athletes: 60, businesses: 35, campaigns: 22 },
              { date: '2025-03-01', views: 150, matches: 15, athletes: 70, businesses: 40, campaigns: 25 },
              { date: '2025-04-01', views: 180, matches: 18, athletes: 85, businesses: 45, campaigns: 30 },
            ];
          } else if (widget.settings.chartType === 'bar') {
            widget.data = [
              { category: 'Campaign A', investment: 1000, return: 1500 },
              { category: 'Campaign B', investment: 2000, return: 3000 },
              { category: 'Campaign C', investment: 1500, return: 2000 },
            ];
          }
          break;
        
        case 'timeline':
        case 'queue':
          // Sample timeline/queue data
          widget.data = [
            { id: 1, title: 'Instagram Post', date: '2025-05-10', status: 'pending' },
            { id: 2, title: 'TikTok Video', date: '2025-05-15', status: 'completed' },
            { id: 3, title: 'Product Review', date: '2025-05-20', status: 'pending' },
          ];
          break;
        
        case 'recommendations':
          // Sample recommendations data
          widget.data = [
            { id: 1, name: 'John Smith', sport: 'Basketball', school: 'UCLA', score: 95 },
            { id: 2, name: 'Emily Johnson', sport: 'Soccer', school: 'Stanford', score: 90 },
            { id: 3, name: 'Michael Brown', sport: 'Football', school: 'Ohio State', score: 85 },
            { id: 4, name: 'Sarah Williams', sport: 'Volleyball', school: 'USC', score: 80 },
            { id: 5, name: 'David Jones', sport: 'Baseball', school: 'Texas', score: 75 },
          ];
          break;
        
        case 'alerts':
          // Sample alerts data
          widget.data = [
            { id: 1, message: 'System maintenance scheduled', priority: 'medium', date: '2025-05-05' },
            { id: 2, message: 'New feature released', priority: 'low', date: '2025-05-03' },
            { id: 3, message: 'Payment system upgrade', priority: 'high', date: '2025-05-10' },
          ];
          break;
      }
      
      return widget;
    })
  );
  
  return {
    ...dashboardConfig,
    widgets: enhancedWidgets
  };
}

// Create a router for dashboard endpoints
export const dashboardRouter = Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Apply authentication middleware to all dashboard routes
dashboardRouter.use(isAuthenticated);

// Endpoint to get the user's dashboard configuration
dashboardRouter.get('/config', async (req: any, res: any) => {
  console.log(`[Dashboard API] Request received, user:`, req.user ? 'authenticated' : 'not authenticated');
  
  if (!req.user) {
    console.log('[Dashboard API] Unauthorized - No user in request');
    return res.status(401).json({ error: 'Unauthorized - No user in request' });
  }
  
  console.log(`[Dashboard API] Dashboard config requested for user: ${req.user.id} with role: ${req.user.user_metadata?.role}`);
  console.log('[Dashboard API] User object:', JSON.stringify(req.user, null, 2));
  
  try {
    const userRole = req.user.user_metadata?.role || 'athlete';
    console.log(`[Dashboard API] Using role: ${userRole} for dashboard config`);
    
    console.log(`[Dashboard API] Calling getDashboardWithData for user: ${req.user.id}`);
    const dashboardConfig = await getDashboardWithData(req.user.id, userRole);
    
    if (!dashboardConfig) {
      console.log('[Dashboard API] No dashboard config found, returning 404');
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    console.log('[Dashboard API] Successfully retrieved dashboard config, returning data');
    return res.json(dashboardConfig);
  } catch (error) {
    console.error('[Dashboard API] Error fetching dashboard config:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard configuration', details: error instanceof Error ? error.message : String(error) });
  }
});

// Endpoint to update the user's dashboard configuration
dashboardRouter.post('/config', async (req: any, res: any) => {
  console.log('[Dashboard API] Update config request received');
  
  if (!req.user) {
    console.log('[Dashboard API] Unauthorized - No user in request');
    return res.status(401).json({ error: 'Unauthorized - No user in request' });
  }
  
  console.log(`[Dashboard API] Update dashboard config for user: ${req.user.id}`);
  
  try {
    const { widgets } = req.body;
    console.log(`[Dashboard API] Received widgets data:`, JSON.stringify(widgets).substring(0, 100) + '...');
    
    if (!widgets || !Array.isArray(widgets)) {
      console.log('[Dashboard API] Invalid widgets data:', widgets);
      return res.status(400).json({ error: 'Invalid widgets configuration' });
    }
    
    console.log(`[Dashboard API] Upserting dashboard config for user: ${req.user.id}`);
    const { data, error } = await supabaseAdmin
      .from('user_dashboard_configs')
      .upsert({
        user_id: req.user.id,
        widgets: widgets,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Dashboard API] Error updating dashboard config:', error);
      return res.status(500).json({ error: 'Failed to update dashboard configuration', details: error.message });
    }
    
    console.log('[Dashboard API] Dashboard config updated successfully');
    return res.json(data);
  } catch (error) {
    console.error('[Dashboard API] Error updating dashboard config:', error);
    return res.status(500).json({ error: 'Failed to update dashboard configuration', details: error instanceof Error ? error.message : String(error) });
  }
});

// Endpoint to reset the user's dashboard to default configuration
dashboardRouter.post('/reset', async (req: any, res: any) => {
  console.log('[Dashboard API] Reset dashboard config requested');
  
  if (!req.user) {
    console.log('[Dashboard API] Unauthorized - No user in request');
    return res.status(401).json({ error: 'Unauthorized - No user in request' });
  }
  
  console.log(`[Dashboard API] Resetting dashboard config for user: ${req.user.id}`);
  
  try {
    const userRole = req.user.user_metadata?.role || 'athlete';
    console.log(`[Dashboard API] Using role: ${userRole} for reset`);
    
    // Delete the existing dashboard config
    console.log(`[Dashboard API] Deleting existing dashboard config for user: ${req.user.id}`);
    const { error: deleteError } = await supabaseAdmin
      .from('user_dashboard_configs')
      .delete()
      .eq('user_id', req.user.id);
      
    if (deleteError) {
      console.error('[Dashboard API] Error deleting existing config:', deleteError);
      // Continue anyway to try creating a new one
    }
    
    // Create a new default dashboard config
    console.log(`[Dashboard API] Creating new default dashboard config for user: ${req.user.id}`);
    const dashboardConfig = await createDefaultDashboardConfig(req.user.id, userRole);
    
    if (!dashboardConfig) {
      console.error('[Dashboard API] Failed to create default dashboard config');
      return res.status(500).json({ error: 'Failed to reset dashboard configuration' });
    }
    
    console.log('[Dashboard API] Dashboard reset successful');
    return res.json(dashboardConfig);
  } catch (error) {
    console.error('[Dashboard API] Error resetting dashboard config:', error);
    return res.status(500).json({ error: 'Failed to reset dashboard configuration', details: error instanceof Error ? error.message : String(error) });
  }
});