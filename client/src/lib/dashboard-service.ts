import { apiRequest } from './queryClient';
import { 
  DashboardConfig, 
  StatsData, 
  ChartData, 
  ActivityData, 
  QuickActionsData 
} from '../../shared/dashboard-schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Dashboard service that handles all dashboard-related API calls
 */

// Fetch the user's dashboard configuration
export async function fetchDashboardConfig(): Promise<DashboardConfig> {
  try {
    const response = await apiRequest('GET', '/api/dashboard');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard config:', error);
    // Return default configuration if there's an error
    return getDefaultDashboardConfig('unknown');
  }
}

// Save the user's dashboard configuration
export async function saveDashboardConfig(config: DashboardConfig): Promise<{ success: boolean }> {
  try {
    const response = await apiRequest('POST', '/api/dashboard', config);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving dashboard config:', error);
    throw error;
  }
}

// Update a specific widget
export async function updateWidget(widgetId: string, updates: Partial<any>): Promise<{ success: boolean }> {
  try {
    const response = await apiRequest('PATCH', `/api/dashboard/widgets/${widgetId}`, updates);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating widget:', error);
    throw error;
  }
}

// Remove a widget from the dashboard
export async function removeWidget(widgetId: string): Promise<{ success: boolean }> {
  try {
    const response = await apiRequest('DELETE', `/api/dashboard/widgets/${widgetId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error removing widget:', error);
    throw error;
  }
}

// Fetch stats data for stats widget
export async function fetchStatsData(): Promise<StatsData> {
  try {
    const response = await apiRequest('GET', '/api/dashboard/data/stats');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stats data:', error);
    throw error;
  }
}

// Fetch chart data for chart widget
export async function fetchChartData(dataSource: string): Promise<ChartData> {
  try {
    const response = await apiRequest('GET', `/api/dashboard/data/${dataSource}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching chart data for source ${dataSource}:`, error);
    throw error;
  }
}

// Fetch activity data for activity widget
export async function fetchActivityData(): Promise<ActivityData> {
  try {
    const response = await apiRequest('GET', '/api/dashboard/data/activities');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching activity data:', error);
    throw error;
  }
}

// Fetch quick actions data for quick actions widget
export async function fetchQuickActionsData(): Promise<QuickActionsData> {
  try {
    const response = await apiRequest('GET', '/api/dashboard/data/quickActions');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching quick actions data:', error);
    throw error;
  }
}

// Default dashboard config based on user type
export function getDefaultDashboardConfig(userType: string): DashboardConfig {
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
          dataSource: userType === 'business' ? 'campaigns' : 'engagement',
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

// Default quick actions based on user type
export function getDefaultQuickActions(userType: string): QuickActionsData {
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