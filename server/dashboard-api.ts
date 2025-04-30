import { Router } from 'express';
import { storage } from './storage';
import { widgetSchema, dashboardConfigSchema } from '@shared/dashboard-schema';
import { v4 as uuidv4 } from 'uuid';

export const dashboardRouter = Router();

// Authentication middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get user dashboard configuration
dashboardRouter.get('/config', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const config = await storage.getDashboardConfig(userId);
    
    if (!config) {
      // If no configuration exists, return a default one
      const defaultConfig = {
        userId,
        widgets: [],
        lastUpdated: new Date().toISOString(),
      };
      await storage.saveDashboardConfig(userId, defaultConfig);
      return res.json(defaultConfig);
    }
    
    return res.json(config);
  } catch (error) {
    console.error('Error getting dashboard config:', error);
    return res.status(500).json({ error: 'Failed to get dashboard configuration' });
  }
});

// Save user dashboard configuration
dashboardRouter.post('/config', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const validatedData = dashboardConfigSchema.parse({
      ...req.body,
      userId,
    });
    
    await storage.saveDashboardConfig(userId, validatedData);
    return res.json(validatedData);
  } catch (error) {
    console.error('Error saving dashboard config:', error);
    return res.status(500).json({ error: 'Failed to save dashboard configuration' });
  }
});

// Add a new widget
dashboardRouter.post('/widgets', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const config = await storage.getDashboardConfig(userId);
    
    if (!config) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    const newWidget = widgetSchema.parse({
      ...req.body,
      id: uuidv4(),
    });
    
    const updatedConfig = {
      ...config,
      widgets: [...config.widgets, newWidget],
      lastUpdated: new Date().toISOString(),
    };
    
    await storage.saveDashboardConfig(userId, updatedConfig);
    return res.json(newWidget);
  } catch (error) {
    console.error('Error adding widget:', error);
    return res.status(500).json({ error: 'Failed to add widget' });
  }
});

// Update an existing widget
dashboardRouter.patch('/widgets/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const widgetId = req.params.id;
    const config = await storage.getDashboardConfig(userId);
    
    if (!config) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    const widgetIndex = config.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      return res.status(404).json({ error: 'Widget not found' });
    }
    
    const updatedWidget = {
      ...config.widgets[widgetIndex],
      ...req.body,
    };
    
    const updatedConfig = {
      ...config,
      widgets: [
        ...config.widgets.slice(0, widgetIndex),
        updatedWidget,
        ...config.widgets.slice(widgetIndex + 1),
      ],
      lastUpdated: new Date().toISOString(),
    };
    
    await storage.saveDashboardConfig(userId, updatedConfig);
    return res.json(updatedWidget);
  } catch (error) {
    console.error('Error updating widget:', error);
    return res.status(500).json({ error: 'Failed to update widget' });
  }
});

// Delete a widget
dashboardRouter.delete('/widgets/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const widgetId = req.params.id;
    const config = await storage.getDashboardConfig(userId);
    
    if (!config) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    const updatedConfig = {
      ...config,
      widgets: config.widgets.filter(w => w.id !== widgetId),
      lastUpdated: new Date().toISOString(),
    };
    
    await storage.saveDashboardConfig(userId, updatedConfig);
    return res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting widget:', error);
    return res.status(500).json({ error: 'Failed to delete widget' });
  }
});

// Reorder widgets
dashboardRouter.post('/widgets/reorder', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const { widgetIds } = req.body;
    
    if (!Array.isArray(widgetIds)) {
      return res.status(400).json({ error: 'Widget IDs must be an array' });
    }
    
    const config = await storage.getDashboardConfig(userId);
    
    if (!config) {
      return res.status(404).json({ error: 'Dashboard configuration not found' });
    }
    
    const widgetMap = new Map(config.widgets.map(w => [w.id, w]));
    
    // Create a new array of widgets in the order specified by widgetIds
    const reorderedWidgets = widgetIds
      .filter(id => widgetMap.has(id)) // Only include existing widgets
      .map((id, index) => ({
        ...widgetMap.get(id),
        position: index,
      }));
    
    // Add any widgets that were not included in the widgetIds array
    const remainingWidgets = config.widgets
      .filter(w => !widgetIds.includes(w.id))
      .map((w, i) => ({
        ...w,
        position: reorderedWidgets.length + i,
      }));
    
    const updatedConfig = {
      ...config,
      widgets: [...reorderedWidgets, ...remainingWidgets],
      lastUpdated: new Date().toISOString(),
    };
    
    await storage.saveDashboardConfig(userId, updatedConfig);
    return res.json(updatedConfig.widgets);
  } catch (error) {
    console.error('Error reordering widgets:', error);
    return res.status(500).json({ error: 'Failed to reorder widgets' });
  }
});

// Get stats data for the stats widget
dashboardRouter.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const userRole = req.user.role;
    
    // Get stats based on user role
    let stats;
    switch (userRole) {
      case 'athlete':
        stats = await getAthleteStats(userId);
        break;
      case 'business':
        stats = await getBusinessStats(userId);
        break;
      case 'compliance':
        stats = await getComplianceStats();
        break;
      case 'admin':
        stats = await getAdminStats();
        break;
      default:
        stats = { items: [] };
    }
    
    return res.json(stats);
  } catch (error) {
    console.error('Error getting stats data:', error);
    return res.status(500).json({ error: 'Failed to get stats data' });
  }
});

// Get chart data for the chart widget
dashboardRouter.get('/charts/:source', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const userRole = req.user.role;
    const source = req.params.source;
    
    // Get chart data based on user role and requested source
    let chartData;
    switch (userRole) {
      case 'athlete':
        chartData = await getAthleteChartData(userId, source);
        break;
      case 'business':
        chartData = await getBusinessChartData(userId, source);
        break;
      case 'compliance':
        chartData = await getComplianceChartData(source);
        break;
      case 'admin':
        chartData = await getAdminChartData(source);
        break;
      default:
        chartData = getDefaultChartData();
    }
    
    return res.json(chartData);
  } catch (error) {
    console.error('Error getting chart data:', error);
    return res.status(500).json({ error: 'Failed to get chart data' });
  }
});

// Get activity data for the activity widget
dashboardRouter.get('/activity', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const userRole = req.user.role;
    
    // Get activity data based on user role
    let activityData;
    switch (userRole) {
      case 'athlete':
        activityData = await getAthleteActivity(userId);
        break;
      case 'business':
        activityData = await getBusinessActivity(userId);
        break;
      case 'compliance':
        activityData = await getComplianceActivity();
        break;
      case 'admin':
        activityData = await getAdminActivity();
        break;
      default:
        activityData = [];
    }
    
    return res.json(activityData);
  } catch (error) {
    console.error('Error getting activity data:', error);
    return res.status(500).json({ error: 'Failed to get activity data' });
  }
});

// Get quick actions data for the quick actions widget
dashboardRouter.get('/quick-actions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id.toString();
    const userRole = req.user.role;
    
    // Get quick actions based on user role
    let quickActions;
    switch (userRole) {
      case 'athlete':
        quickActions = await getAthleteQuickActions(userId);
        break;
      case 'business':
        quickActions = await getBusinessQuickActions(userId);
        break;
      case 'compliance':
        quickActions = await getComplianceQuickActions();
        break;
      case 'admin':
        quickActions = await getAdminQuickActions();
        break;
      default:
        quickActions = [];
    }
    
    return res.json(quickActions);
  } catch (error) {
    console.error('Error getting quick actions data:', error);
    return res.status(500).json({ error: 'Failed to get quick actions data' });
  }
});

// Helper functions to get data for widgets based on user role
async function getAthleteStats(userId: string) {
  // Fetch athlete-specific stats from Supabase
  const { data: athlete, error: athleteError } = await storage.supabase
    .from('athlete_profiles')
    .select('follower_count, content_style')
    .eq('id', userId)
    .single();

  if (athleteError) {
    console.error('Error fetching athlete stats:', athleteError);
    return { items: [] };
  }

  // Get matches data
  const { data: matches, error: matchesError } = await storage.supabase
    .from('matches')
    .select('status')
    .eq('athlete_id', userId);

  if (matchesError) {
    console.error('Error fetching athlete matches:', matchesError);
    return { items: [] };
  }

  // Calculate stats
  const pendingMatches = matches?.filter(m => m.status === 'pending').length || 0;
  const acceptedMatches = matches?.filter(m => m.status === 'accepted').length || 0;

  return {
    items: [
      {
        key: 'followers',
        label: 'Followers',
        value: athlete?.follower_count || 0,
        icon: 'Users',
        color: 'blue',
      },
      {
        key: 'pending-matches',
        label: 'Pending Matches',
        value: pendingMatches,
        icon: 'Hourglass',
        color: 'yellow',
      },
      {
        key: 'active-campaigns',
        label: 'Active Campaigns',
        value: acceptedMatches,
        icon: 'Rocket',
        color: 'green',
      },
      {
        key: 'content-style',
        label: 'Content Style',
        value: athlete?.content_style || 'Not set',
        icon: 'Camera',
        color: 'purple',
      },
    ],
  };
}

async function getBusinessStats(userId: string) {
  // Fetch business-specific stats from Supabase
  const { data: campaigns, error: campaignsError } = await storage.supabase
    .from('campaigns')
    .select('status')
    .eq('business_id', userId);

  if (campaignsError) {
    console.error('Error fetching business campaigns:', campaignsError);
    return { items: [] };
  }

  // Calculate campaign stats
  const draftCampaigns = campaigns?.filter(c => c.status === 'draft').length || 0;
  const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
  const completedCampaigns = campaigns?.filter(c => c.status === 'completed').length || 0;

  // Get matches data
  const { data: matches, error: matchesError } = await storage.supabase
    .from('matches')
    .select('status')
    .eq('business_id', userId);

  if (matchesError) {
    console.error('Error fetching business matches:', matchesError);
    return { items: [] };
  }

  const pendingMatches = matches?.filter(m => m.status === 'pending').length || 0;

  return {
    items: [
      {
        key: 'active-campaigns',
        label: 'Active Campaigns',
        value: activeCampaigns,
        icon: 'Rocket',
        color: 'green',
      },
      {
        key: 'draft-campaigns',
        label: 'Draft Campaigns',
        value: draftCampaigns,
        icon: 'FileEdit',
        color: 'blue',
      },
      {
        key: 'pending-matches',
        label: 'Pending Matches',
        value: pendingMatches,
        icon: 'Hourglass',
        color: 'yellow',
      },
      {
        key: 'completed-campaigns',
        label: 'Completed',
        value: completedCampaigns,
        icon: 'CheckCircle',
        color: 'gray',
      },
    ],
  };
}

async function getComplianceStats() {
  // Fetch compliance-specific stats from Supabase
  const { data: matches, error: matchesError } = await storage.supabase
    .from('matches')
    .select('compliance_status');

  if (matchesError) {
    console.error('Error fetching compliance stats:', matchesError);
    return { items: [] };
  }

  // Calculate compliance stats
  const pendingReviews = matches?.filter(m => m.compliance_status === 'pending').length || 0;
  const approvedMatches = matches?.filter(m => m.compliance_status === 'approved').length || 0;
  const rejectedMatches = matches?.filter(m => m.compliance_status === 'rejected').length || 0;

  return {
    items: [
      {
        key: 'pending-reviews',
        label: 'Pending Reviews',
        value: pendingReviews,
        icon: 'AlertCircle',
        color: 'yellow',
        trend: pendingReviews > 10 ? 'up' : 'down',
        change: pendingReviews > 10 ? 15 : 8,
      },
      {
        key: 'approved-matches',
        label: 'Approved Matches',
        value: approvedMatches,
        icon: 'CheckCircle',
        color: 'green',
      },
      {
        key: 'rejected-matches',
        label: 'Rejected Matches',
        value: rejectedMatches,
        icon: 'XCircle',
        color: 'red',
      },
      {
        key: 'compliance-rate',
        label: 'Compliance Rate',
        value: `${Math.round((approvedMatches / (approvedMatches + rejectedMatches || 1)) * 100)}%`,
        icon: 'Percent',
        color: 'blue',
      },
    ],
  };
}

async function getAdminStats() {
  // Fetch admin-specific stats from Supabase
  const { data: users, error: usersError } = await storage.supabase
    .from('users')
    .select('role');

  if (usersError) {
    console.error('Error fetching admin stats:', usersError);
    return { items: [] };
  }

  // Calculate user stats
  const athleteCount = users?.filter(u => u.role === 'athlete').length || 0;
  const businessCount = users?.filter(u => u.role === 'business').length || 0;
  
  // Get campaign data
  const { data: campaigns, error: campaignsError } = await storage.supabase
    .from('campaigns')
    .select('status');

  if (campaignsError) {
    console.error('Error fetching campaign stats:', campaignsError);
    return { items: [] };
  }

  const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;

  // Get match data
  const { data: matches, error: matchesError } = await storage.supabase
    .from('matches')
    .select('status');

  if (matchesError) {
    console.error('Error fetching match stats:', matchesError);
    return { items: [] };
  }

  const completedMatches = matches?.filter(m => m.status === 'completed').length || 0;

  return {
    items: [
      {
        key: 'athletes',
        label: 'Athletes',
        value: athleteCount,
        icon: 'User',
        color: 'blue',
      },
      {
        key: 'businesses',
        label: 'Businesses',
        value: businessCount,
        icon: 'Briefcase',
        color: 'green',
      },
      {
        key: 'active-campaigns',
        label: 'Active Campaigns',
        value: activeCampaigns,
        icon: 'Rocket',
        color: 'purple',
      },
      {
        key: 'completed-matches',
        label: 'Completed Matches',
        value: completedMatches,
        icon: 'Check',
        color: 'gray',
      },
    ],
  };
}

async function getAthleteChartData(userId: string, source: string) {
  let chartData;

  switch (source) {
    case 'matches':
      // Get match data over time
      const { data: matches, error: matchesError } = await storage.supabase
        .from('matches')
        .select('created_at, status')
        .eq('athlete_id', userId)
        .order('created_at', { ascending: true });

      if (matchesError) {
        console.error('Error fetching athlete match chart data:', matchesError);
        return getDefaultChartData();
      }

      // Process data for the chart (monthly grouping)
      const matchesByMonth = matches?.reduce((acc, match) => {
        const date = new Date(match.created_at);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = { month: monthYear, pending: 0, accepted: 0, declined: 0 };
        }
        
        acc[monthYear][match.status]++;
        return acc;
      }, {});

      chartData = {
        xAxis: 'month',
        series: ['pending', 'accepted', 'declined'],
        data: Object.values(matchesByMonth || {}),
      };
      break;
      
    case 'engagement':
    default:
      // For demo, return engagement data with random values
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      
      // Generate last 6 months of data
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        data.push({
          month: monthNames[monthIndex],
          views: Math.floor(Math.random() * 10000) + 5000,
          engagement: Math.floor(Math.random() * 2000) + 1000,
          conversions: Math.floor(Math.random() * 500) + 100,
        });
      }
      
      chartData = {
        xAxis: 'month',
        series: ['views', 'engagement', 'conversions'],
        data,
      };
      break;
  }

  return chartData;
}

async function getBusinessChartData(userId: string, source: string) {
  let chartData;

  switch (source) {
    case 'campaigns':
      // Get campaign data over time
      const { data: campaigns, error: campaignsError } = await storage.supabase
        .from('campaigns')
        .select('created_at, status')
        .eq('business_id', userId)
        .order('created_at', { ascending: true });

      if (campaignsError) {
        console.error('Error fetching business campaign chart data:', campaignsError);
        return getDefaultChartData();
      }

      // Process data for the chart (monthly grouping)
      const campaignsByMonth = campaigns?.reduce((acc, campaign) => {
        const date = new Date(campaign.created_at);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = { month: monthYear, draft: 0, active: 0, completed: 0, cancelled: 0 };
        }
        
        acc[monthYear][campaign.status]++;
        return acc;
      }, {});

      chartData = {
        xAxis: 'month',
        series: ['draft', 'active', 'completed', 'cancelled'],
        data: Object.values(campaignsByMonth || {}),
      };
      break;
      
    case 'roi':
    default:
      // For demo, return ROI data with random values
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      
      // Generate last 6 months of data
      const data = [];
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const investment = Math.floor(Math.random() * 5000) + 3000;
        const returns = Math.floor(Math.random() * 10000) + 4000;
        data.push({
          month: monthNames[monthIndex],
          investment,
          returns,
          roi: Math.round((returns / investment - 1) * 100),
        });
      }
      
      chartData = {
        xAxis: 'month',
        series: ['investment', 'returns', 'roi'],
        data,
      };
      break;
  }

  return chartData;
}

async function getComplianceChartData(source: string) {
  let chartData;

  switch (source) {
    case 'reviews':
      // Get review data over time
      const { data: matches, error: matchesError } = await storage.supabase
        .from('matches')
        .select('created_at, compliance_status')
        .order('created_at', { ascending: true });

      if (matchesError) {
        console.error('Error fetching compliance review chart data:', matchesError);
        return getDefaultChartData();
      }

      // Process data for the chart (monthly grouping)
      const reviewsByMonth = matches?.reduce((acc, match) => {
        const date = new Date(match.created_at);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = { month: monthYear, pending: 0, approved: 0, rejected: 0 };
        }
        
        acc[monthYear][match.compliance_status]++;
        return acc;
      }, {});

      chartData = {
        xAxis: 'month',
        series: ['pending', 'approved', 'rejected'],
        data: Object.values(reviewsByMonth || {}),
      };
      break;
      
    default:
      // For demo, return review time data
      const weekNames = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Current'];
      
      // Generate 5 weeks of data
      const data = [];
      for (let i = 0; i < 5; i++) {
        data.push({
          week: weekNames[i],
          averageTime: Math.floor(Math.random() * 24) + 12,
          maxTime: Math.floor(Math.random() * 48) + 24,
          minTime: Math.floor(Math.random() * 8) + 4,
        });
      }
      
      chartData = {
        xAxis: 'week',
        series: ['averageTime', 'maxTime', 'minTime'],
        data,
      };
      break;
  }

  return chartData;
}

async function getAdminChartData(source: string) {
  let chartData;

  switch (source) {
    case 'users':
      // Get user registration data over time
      const { data: users, error: usersError } = await storage.supabase
        .from('users')
        .select('created_at, role')
        .order('created_at', { ascending: true });

      if (usersError) {
        console.error('Error fetching admin user chart data:', usersError);
        return getDefaultChartData();
      }

      // Process data for the chart (monthly grouping)
      const usersByMonth = users?.reduce((acc, user) => {
        const date = new Date(user.created_at);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = { month: monthYear, athlete: 0, business: 0, compliance: 0, admin: 0 };
        }
        
        acc[monthYear][user.role]++;
        return acc;
      }, {});

      chartData = {
        xAxis: 'month',
        series: ['athlete', 'business', 'compliance', 'admin'],
        data: Object.values(usersByMonth || {}),
      };
      break;
      
    default:
      // For demo, return platform metrics
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = new Date().getMonth();
      
      // Generate last 6 months of data
      const data = [];
      let totalMatches = 1000;
      let totalCampaigns = 800;
      
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12;
        const newMatches = Math.floor(Math.random() * 200) + 100;
        const newCampaigns = Math.floor(Math.random() * 150) + 50;
        totalMatches += newMatches;
        totalCampaigns += newCampaigns;
        
        data.push({
          month: monthNames[monthIndex],
          newMatches,
          newCampaigns,
          totalMatches,
          totalCampaigns,
        });
      }
      
      chartData = {
        xAxis: 'month',
        series: ['newMatches', 'newCampaigns', 'totalMatches', 'totalCampaigns'],
        data,
      };
      break;
  }

  return chartData;
}

function getDefaultChartData() {
  // Default chart data when no specific data is available
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const data = monthNames.map(month => ({
    month,
    value1: Math.floor(Math.random() * 100),
    value2: Math.floor(Math.random() * 100),
  }));
  
  return {
    xAxis: 'month',
    series: ['value1', 'value2'],
    data,
  };
}

async function getAthleteActivity(userId: string) {
  // Fetch athlete-specific activity from Supabase
  const { data: matches, error: matchesError } = await storage.supabase
    .from('matches')
    .select('id, status, updated_at, campaign_id, business_id')
    .eq('athlete_id', userId)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (matchesError) {
    console.error('Error fetching athlete activity:', matchesError);
    return [];
  }

  // Get campaign and business info for each match
  const activities = await Promise.all(matches?.map(async (match) => {
    // Get campaign info
    const { data: campaign } = await storage.supabase
      .from('campaigns')
      .select('title')
      .eq('id', match.campaign_id)
      .single();

    // Get business info
    const { data: business } = await storage.supabase
      .from('business_profiles')
      .select('name')
      .eq('id', match.business_id)
      .single();

    let activity = {
      id: match.id,
      timestamp: match.updated_at,
      link: `/matches/${match.id}`,
    };

    switch (match.status) {
      case 'pending':
        return {
          ...activity,
          title: 'New Match Request',
          description: `You have a new match request from ${business?.name || 'a business'} for the campaign "${campaign?.title || 'Untitled Campaign'}"`,
          icon: 'Bell',
          status: 'pending',
        };
      case 'accepted':
        return {
          ...activity,
          title: 'Match Accepted',
          description: `You accepted the match with ${business?.name || 'a business'} for "${campaign?.title || 'Untitled Campaign'}"`,
          icon: 'CheckCircle',
          status: 'success',
        };
      case 'declined':
        return {
          ...activity,
          title: 'Match Declined',
          description: `You declined the match with ${business?.name || 'a business'} for "${campaign?.title || 'Untitled Campaign'}"`,
          icon: 'XCircle',
          status: 'error',
        };
      case 'completed':
        return {
          ...activity,
          title: 'Match Completed',
          description: `Your match with ${business?.name || 'a business'} for "${campaign?.title || 'Untitled Campaign'}" is complete`,
          icon: 'Award',
          status: 'success',
        };
      default:
        return {
          ...activity,
          title: 'Match Updated',
          description: `Your match status has been updated`,
          icon: 'RefreshCw',
        };
    }
  })) || [];

  return activities;
}

async function getBusinessActivity(userId: string) {
  // Fetch business-specific activity from Supabase
  const { data: campaigns, error: campaignsError } = await storage.supabase
    .from('campaigns')
    .select('id, title, status, updated_at')
    .eq('business_id', userId)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (campaignsError) {
    console.error('Error fetching business campaign activity:', campaignsError);
    return [];
  }

  // Get matches
  const { data: matches, error: matchesError } = await storage.supabase
    .from('matches')
    .select('id, status, updated_at, campaign_id, athlete_id')
    .eq('business_id', userId)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (matchesError) {
    console.error('Error fetching business match activity:', matchesError);
    return [];
  }

  // Create activity items for campaigns
  const campaignActivities = campaigns?.map(campaign => {
    let activity = {
      id: `campaign-${campaign.id}`,
      timestamp: campaign.updated_at,
      link: `/campaigns/${campaign.id}`,
    };

    switch (campaign.status) {
      case 'draft':
        return {
          ...activity,
          title: 'Campaign Created',
          description: `You created a draft campaign "${campaign.title}"`,
          icon: 'FileEdit',
          status: 'pending',
        };
      case 'active':
        return {
          ...activity,
          title: 'Campaign Activated',
          description: `Your campaign "${campaign.title}" is now active`,
          icon: 'Rocket',
          status: 'success',
        };
      case 'completed':
        return {
          ...activity,
          title: 'Campaign Completed',
          description: `Your campaign "${campaign.title}" has been completed`,
          icon: 'CheckCircle',
          status: 'success',
        };
      case 'cancelled':
        return {
          ...activity,
          title: 'Campaign Cancelled',
          description: `Your campaign "${campaign.title}" has been cancelled`,
          icon: 'XCircle',
          status: 'error',
        };
      default:
        return {
          ...activity,
          title: 'Campaign Updated',
          description: `Your campaign "${campaign.title}" has been updated`,
          icon: 'RefreshCw',
        };
    }
  }) || [];

  // Create activity items for matches
  const matchActivities = await Promise.all(matches?.map(async (match) => {
    // Get campaign info
    const { data: campaign } = await storage.supabase
      .from('campaigns')
      .select('title')
      .eq('id', match.campaign_id)
      .single();

    // Get athlete info
    const { data: athlete } = await storage.supabase
      .from('athlete_profiles')
      .select('name')
      .eq('id', match.athlete_id)
      .single();

    let activity = {
      id: `match-${match.id}`,
      timestamp: match.updated_at,
      link: `/matches/${match.id}`,
    };

    switch (match.status) {
      case 'pending':
        return {
          ...activity,
          title: 'Match Created',
          description: `You sent a match request to ${athlete?.name || 'an athlete'} for "${campaign?.title || 'Untitled Campaign'}"`,
          icon: 'Send',
          status: 'pending',
        };
      case 'accepted':
        return {
          ...activity,
          title: 'Match Accepted',
          description: `${athlete?.name || 'An athlete'} accepted your match request for "${campaign?.title || 'Untitled Campaign'}"`,
          icon: 'CheckCircle',
          status: 'success',
        };
      case 'declined':
        return {
          ...activity,
          title: 'Match Declined',
          description: `${athlete?.name || 'An athlete'} declined your match request for "${campaign?.title || 'Untitled Campaign'}"`,
          icon: 'XCircle',
          status: 'error',
        };
      case 'completed':
        return {
          ...activity,
          title: 'Match Completed',
          description: `Your match with ${athlete?.name || 'an athlete'} for "${campaign?.title || 'Untitled Campaign'}" is complete`,
          icon: 'Award',
          status: 'success',
        };
      default:
        return {
          ...activity,
          title: 'Match Updated',
          description: `A match status has been updated`,
          icon: 'RefreshCw',
        };
    }
  })) || [];

  // Combine and sort activities by timestamp
  const allActivities = [...campaignActivities, ...matchActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return allActivities;
}

async function getComplianceActivity() {
  // Fetch compliance-specific activity from Supabase
  const { data: matches, error: matchesError } = await storage.supabase
    .from('matches')
    .select('id, compliance_status, updated_at, campaign_id, business_id, athlete_id')
    .order('updated_at', { ascending: false })
    .limit(10);

  if (matchesError) {
    console.error('Error fetching compliance activity:', matchesError);
    return [];
  }

  // Create activity items for matches
  const activities = await Promise.all(matches?.map(async (match) => {
    // Get campaign info
    const { data: campaign } = await storage.supabase
      .from('campaigns')
      .select('title')
      .eq('id', match.campaign_id)
      .single();

    // Get business info
    const { data: business } = await storage.supabase
      .from('business_profiles')
      .select('name')
      .eq('id', match.business_id)
      .single();

    // Get athlete info
    const { data: athlete } = await storage.supabase
      .from('athlete_profiles')
      .select('name')
      .eq('id', match.athlete_id)
      .single();

    let activity = {
      id: match.id,
      timestamp: match.updated_at,
      link: `/compliance/matches/${match.id}`,
    };

    switch (match.compliance_status) {
      case 'pending':
        return {
          ...activity,
          title: 'Review Needed',
          description: `New match between ${business?.name || 'Business'} and ${athlete?.name || 'Athlete'} for "${campaign?.title || 'Untitled Campaign'}" needs review`,
          icon: 'AlertCircle',
          status: 'pending',
        };
      case 'approved':
        return {
          ...activity,
          title: 'Match Approved',
          description: `You approved the match between ${business?.name || 'Business'} and ${athlete?.name || 'Athlete'} for "${campaign?.title || 'Untitled Campaign'}"`,
          icon: 'CheckCircle',
          status: 'success',
        };
      case 'rejected':
        return {
          ...activity,
          title: 'Match Rejected',
          description: `You rejected the match between ${business?.name || 'Business'} and ${athlete?.name || 'Athlete'} for "${campaign?.title || 'Untitled Campaign'}"`,
          icon: 'XCircle',
          status: 'error',
        };
      default:
        return {
          ...activity,
          title: 'Match Updated',
          description: `Match status updated for review`,
          icon: 'RefreshCw',
        };
    }
  })) || [];

  return activities;
}

async function getAdminActivity() {
  // Fetch admin-specific activity
  const { data: users, error: usersError } = await storage.supabase
    .from('users')
    .select('id, role, created_at, username')
    .order('created_at', { ascending: false })
    .limit(5);

  if (usersError) {
    console.error('Error fetching admin user activity:', usersError);
    return [];
  }

  // Get campaigns
  const { data: campaigns, error: campaignsError } = await storage.supabase
    .from('campaigns')
    .select('id, title, status, updated_at, business_id')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (campaignsError) {
    console.error('Error fetching admin campaign activity:', campaignsError);
    return [];
  }

  // Create activity items for user registrations
  const userActivities = users?.map(user => ({
    id: `user-${user.id}`,
    title: 'New User Registration',
    description: `New ${user.role} registered: ${user.username}`,
    timestamp: user.created_at,
    icon: 'UserPlus',
    status: 'success',
    link: `/admin/users/${user.id}`,
  })) || [];

  // Create activity items for campaigns
  const campaignActivities = await Promise.all(campaigns?.map(async (campaign) => {
    // Get business info
    const { data: business } = await storage.supabase
      .from('business_profiles')
      .select('name')
      .eq('id', campaign.business_id)
      .single();

    return {
      id: `campaign-${campaign.id}`,
      title: 'Campaign Status Change',
      description: `Campaign "${campaign.title}" by ${business?.name || 'a business'} is now ${campaign.status}`,
      timestamp: campaign.updated_at,
      icon: 'Briefcase',
      status: campaign.status === 'active' ? 'success' : (campaign.status === 'cancelled' ? 'error' : 'pending'),
      link: `/admin/campaigns/${campaign.id}`,
    };
  })) || [];

  // Combine and sort activities by timestamp
  const allActivities = [...userActivities, ...campaignActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return allActivities;
}

async function getAthleteQuickActions(userId: string) {
  return [
    {
      id: 'view-matches',
      label: 'View Matches',
      description: 'See all your current matches',
      icon: 'Users',
      link: '/matches',
      color: 'blue',
    },
    {
      id: 'update-profile',
      label: 'Update Profile',
      description: 'Keep your profile information current',
      icon: 'UserCog',
      link: '/profile',
      color: 'purple',
    },
    {
      id: 'browse-campaigns',
      label: 'Browse Campaigns',
      description: 'Find new campaign opportunities',
      icon: 'Search',
      link: '/campaigns/browse',
      color: 'green',
    },
    {
      id: 'content-delivery',
      label: 'Content Delivery',
      description: 'Manage and submit your content',
      icon: 'Upload',
      link: '/content',
      color: 'yellow',
    },
  ];
}

async function getBusinessQuickActions(userId: string) {
  return [
    {
      id: 'create-campaign',
      label: 'Create Campaign',
      description: 'Start a new marketing campaign',
      icon: 'PlusCircle',
      link: '/campaigns/new',
      color: 'green',
    },
    {
      id: 'manage-campaigns',
      label: 'Manage Campaigns',
      description: 'View and edit your existing campaigns',
      icon: 'Briefcase',
      link: '/campaigns',
      color: 'blue',
    },
    {
      id: 'find-athletes',
      label: 'Find Athletes',
      description: 'Discover new athletes for your campaigns',
      icon: 'Search',
      link: '/athletes/browse',
      color: 'purple',
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      description: 'See performance metrics for your campaigns',
      icon: 'BarChart',
      link: '/analytics',
      color: 'orange',
    },
  ];
}

async function getComplianceQuickActions() {
  return [
    {
      id: 'pending-reviews',
      label: 'Pending Reviews',
      description: 'Review matches awaiting compliance approval',
      icon: 'AlertCircle',
      link: '/compliance/pending',
      color: 'yellow',
    },
    {
      id: 'compliance-dashboard',
      label: 'Compliance Dashboard',
      description: 'Overview of compliance activities',
      icon: 'ShieldCheck',
      link: '/compliance/dashboard',
      color: 'green',
    },
    {
      id: 'flagged-content',
      label: 'Flagged Content',
      description: 'Review content flagged for compliance issues',
      icon: 'Flag',
      link: '/compliance/flagged',
      color: 'red',
    },
    {
      id: 'compliance-reports',
      label: 'Generate Reports',
      description: 'Create compliance reports for review',
      icon: 'FileText',
      link: '/compliance/reports',
      color: 'blue',
    },
  ];
}

async function getAdminQuickActions() {
  return [
    {
      id: 'manage-users',
      label: 'Manage Users',
      description: 'View and manage all platform users',
      icon: 'Users',
      link: '/admin/users',
      color: 'blue',
    },
    {
      id: 'system-settings',
      label: 'System Settings',
      description: 'Configure platform settings',
      icon: 'Settings',
      link: '/admin/settings',
      color: 'gray',
    },
    {
      id: 'content-moderation',
      label: 'Content Moderation',
      description: 'Review and moderate user content',
      icon: 'Shield',
      link: '/admin/moderation',
      color: 'red',
    },
    {
      id: 'platform-analytics',
      label: 'Platform Analytics',
      description: 'View overall platform performance',
      icon: 'BarChart2',
      link: '/admin/analytics',
      color: 'purple',
    },
  ];
}