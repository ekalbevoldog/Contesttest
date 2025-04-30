// Dashboard related types shared between client and server

export type WidgetType = 
  | 'stats' 
  | 'chart' 
  | 'activity' 
  | 'quick-actions'
  | 'matches'
  | 'campaigns'
  | 'profile'
  | 'compliance'
  | 'notifications'
  | 'calendar'
  | 'messages';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export type UserRole = 'athlete' | 'business' | 'compliance' | 'admin';

// Widget configuration
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings?: Record<string, any>;
  data?: any;
}

// Dashboard configuration
export interface DashboardConfig {
  userId: string;
  layout: WidgetConfig[];
  settings: {
    theme?: string;
    refreshInterval?: number;
    compactView?: boolean;
  };
}

// Dashboard preferences
export interface DashboardPreferences {
  userId: string;
  widgetPreferences: Record<string, any>;
  theme: string;
  refreshInterval: number;
  hiddenWidgets: string[];
}

// Stats widget item
export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  color?: string;
}

// Chart data
export interface ChartData {
  labels: string[];
  datasets: Array<{
    name: string;
    data: number[];
    color?: string;
  }>;
  type?: 'line' | 'bar' | 'pie' | 'doughnut';
  title?: string;
  subtitle?: string;
}

// Activity item
export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type: 'message' | 'match' | 'campaign' | 'profile' | 'other';
  icon?: string;
  read?: boolean;
  actionUrl?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Quick action item
export interface QuickActionItem {
  id: string;
  title: string;
  description?: string;
  icon: string;
  action: string; // URL or function name
  color?: string;
  badge?: number | string;
}

// Default dashboard configurations based on user role
export const DEFAULT_DASHBOARDS: Record<UserRole, Omit<WidgetConfig, 'id'>[]> = {
  athlete: [
    {
      type: 'stats',
      title: 'Your Stats',
      size: 'medium',
      position: { x: 0, y: 0, width: 6, height: 2 }
    },
    {
      type: 'matches',
      title: 'Recent Matches',
      size: 'medium',
      position: { x: 6, y: 0, width: 6, height: 3 }
    },
    {
      type: 'chart',
      title: 'Engagement Metrics',
      size: 'medium',
      position: { x: 0, y: 2, width: 6, height: 4 },
      settings: { chartType: 'line' }
    },
    {
      type: 'activity',
      title: 'Recent Activity',
      size: 'medium',
      position: { x: 6, y: 3, width: 6, height: 3 }
    },
    {
      type: 'quick-actions',
      title: 'Quick Actions',
      size: 'small',
      position: { x: 0, y: 6, width: 12, height: 1 }
    }
  ],
  
  business: [
    {
      type: 'stats',
      title: 'Campaign Performance',
      size: 'medium',
      position: { x: 0, y: 0, width: 6, height: 2 }
    },
    {
      type: 'campaigns',
      title: 'Active Campaigns',
      size: 'medium',
      position: { x: 6, y: 0, width: 6, height: 3 }
    },
    {
      type: 'chart',
      title: 'ROI Analytics',
      size: 'medium',
      position: { x: 0, y: 2, width: 6, height: 4 },
      settings: { chartType: 'bar' }
    },
    {
      type: 'matches',
      title: 'Athlete Matches',
      size: 'medium',
      position: { x: 6, y: 3, width: 6, height: 3 }
    },
    {
      type: 'quick-actions',
      title: 'Quick Actions',
      size: 'small',
      position: { x: 0, y: 6, width: 12, height: 1 }
    }
  ],
  
  compliance: [
    {
      type: 'stats',
      title: 'Compliance Overview',
      size: 'medium',
      position: { x: 0, y: 0, width: 6, height: 2 }
    },
    {
      type: 'compliance',
      title: 'Pending Reviews',
      size: 'medium',
      position: { x: 6, y: 0, width: 6, height: 3 }
    },
    {
      type: 'chart',
      title: 'Approval Metrics',
      size: 'medium',
      position: { x: 0, y: 2, width: 6, height: 4 },
      settings: { chartType: 'pie' }
    },
    {
      type: 'activity',
      title: 'Recent Activity',
      size: 'medium',
      position: { x: 6, y: 3, width: 6, height: 3 }
    },
    {
      type: 'quick-actions',
      title: 'Quick Actions',
      size: 'small',
      position: { x: 0, y: 6, width: 12, height: 1 }
    }
  ],
  
  admin: [
    {
      type: 'stats',
      title: 'Platform Stats',
      size: 'medium',
      position: { x: 0, y: 0, width: 6, height: 2 }
    },
    {
      type: 'chart',
      title: 'User Growth',
      size: 'medium',
      position: { x: 6, y: 0, width: 6, height: 3 },
      settings: { chartType: 'line' }
    },
    {
      type: 'chart',
      title: 'Revenue Metrics',
      size: 'medium',
      position: { x: 0, y: 2, width: 6, height: 4 },
      settings: { chartType: 'bar' }
    },
    {
      type: 'activity',
      title: 'Platform Activity',
      size: 'medium',
      position: { x: 6, y: 3, width: 6, height: 3 }
    },
    {
      type: 'quick-actions',
      title: 'Admin Actions',
      size: 'small',
      position: { x: 0, y: 6, width: 12, height: 1 }
    }
  ]
};

// Mock sample data for each widget type
export const SAMPLE_DATA = {
  stats: {
    athlete: [
      { id: '1', label: 'Matches', value: 12, change: 2, trend: 'up' },
      { id: '2', label: 'Campaigns', value: 5, change: 1, trend: 'up' },
      { id: '3', label: 'Followers', value: '15.2K', change: 5.3, trend: 'up' },
      { id: '4', label: 'Avg. Engagement', value: '24%', change: -1.2, trend: 'down' }
    ],
    business: [
      { id: '1', label: 'Active Campaigns', value: 8, change: 2, trend: 'up' },
      { id: '2', label: 'Matched Athletes', value: 24, change: 8, trend: 'up' },
      { id: '3', label: 'Audience Reach', value: '215K', change: 15.4, trend: 'up' },
      { id: '4', label: 'ROI', value: '320%', change: 5.2, trend: 'up' }
    ],
    compliance: [
      { id: '1', label: 'Pending Reviews', value: 18, change: -3, trend: 'down' },
      { id: '2', label: 'Approved', value: 86, change: 12, trend: 'up' },
      { id: '3', label: 'Rejected', value: 7, change: -2, trend: 'down' },
      { id: '4', label: 'Avg. Response Time', value: '8h', change: -25, trend: 'up' }
    ],
    admin: [
      { id: '1', label: 'Total Users', value: 1243, change: 56, trend: 'up' },
      { id: '2', label: 'Active Campaigns', value: 87, change: 12, trend: 'up' },
      { id: '3', label: 'Revenue', value: '$24.8K', change: 18.5, trend: 'up' },
      { id: '4', label: 'Platform Health', value: '99.8%', change: 0.2, trend: 'up' }
    ]
  },
  
  charts: {
    athlete: {
      engagement: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          { name: 'Views', data: [1200, 1900, 3000, 3500, 4200, 5100] },
          { name: 'Likes', data: [400, 550, 800, 950, 1200, 1500] }
        ],
        type: 'line'
      }
    },
    business: {
      roi: {
        labels: ['Campaign A', 'Campaign B', 'Campaign C', 'Campaign D'],
        datasets: [
          { name: 'ROI', data: [250, 180, 300, 280] }
        ],
        type: 'bar'
      }
    },
    compliance: {
      approvals: {
        labels: ['Approved', 'Rejected', 'Pending'],
        datasets: [
          { name: 'Status', data: [72, 8, 20] }
        ],
        type: 'pie'
      }
    },
    admin: {
      growth: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          { name: 'Athletes', data: [80, 120, 180, 240, 320, 400] },
          { name: 'Businesses', data: [20, 40, 60, 90, 120, 150] }
        ],
        type: 'line'
      }
    }
  },
  
  activity: {
    athlete: [
      { id: '1', title: 'New match with Nike', description: 'You have a new match with Nike for their summer campaign', timestamp: '2023-06-15T10:30:00Z', type: 'match' },
      { id: '2', title: 'Profile update', description: 'Your profile was viewed by 24 businesses this week', timestamp: '2023-06-14T14:20:00Z', type: 'profile' }
    ],
    business: [
      { id: '1', title: 'New athlete matched', description: 'Sarah Johnson matches 95% with your Basketball campaign', timestamp: '2023-06-15T09:15:00Z', type: 'match' },
      { id: '2', title: 'Campaign started', description: 'Your Summer Collection campaign is now live', timestamp: '2023-06-13T11:45:00Z', type: 'campaign' }
    ],
    compliance: [
      { id: '1', title: 'New review needed', description: 'Nike x Michael Jordan campaign needs approval', timestamp: '2023-06-15T08:20:00Z', type: 'campaign' },
      { id: '2', title: 'Approval stats', description: 'You approved 28 campaigns this week (+12%)', timestamp: '2023-06-14T16:10:00Z', type: 'other' }
    ],
    admin: [
      { id: '1', title: 'New business signup', description: 'Adidas joined the platform', timestamp: '2023-06-15T07:45:00Z', type: 'profile' },
      { id: '2', title: 'Platform update', description: 'New matching algorithm deployed successfully', timestamp: '2023-06-14T13:30:00Z', type: 'other' }
    ]
  },
  
  quickActions: {
    athlete: [
      { id: '1', title: 'Update Profile', icon: 'user', action: '/profile/edit' },
      { id: '2', title: 'Browse Campaigns', icon: 'search', action: '/campaigns/browse' },
      { id: '3', title: 'Review Matches', icon: 'check-circle', action: '/matches', badge: 3 },
      { id: '4', title: 'Messages', icon: 'message-circle', action: '/messages', badge: 5 }
    ],
    business: [
      { id: '1', title: 'Create Campaign', icon: 'plus-circle', action: '/campaigns/create' },
      { id: '2', title: 'Find Athletes', icon: 'search', action: '/athletes/browse' },
      { id: '3', title: 'Review Matches', icon: 'check-circle', action: '/matches', badge: 8 },
      { id: '4', title: 'Messages', icon: 'message-circle', action: '/messages', badge: 2 }
    ],
    compliance: [
      { id: '1', title: 'Review Queue', icon: 'clipboard', action: '/compliance/queue', badge: 12 },
      { id: '2', title: 'Approve Campaigns', icon: 'check-circle', action: '/compliance/campaigns' },
      { id: '3', title: 'Review Reports', icon: 'flag', action: '/compliance/reports', badge: 3 },
      { id: '4', title: 'Guidelines', icon: 'book', action: '/compliance/guidelines' }
    ],
    admin: [
      { id: '1', title: 'User Management', icon: 'users', action: '/admin/users' },
      { id: '2', title: 'Analytics', icon: 'bar-chart-2', action: '/admin/analytics' },
      { id: '3', title: 'System Health', icon: 'activity', action: '/admin/system' },
      { id: '4', title: 'Settings', icon: 'settings', action: '/admin/settings' }
    ]
  }
};