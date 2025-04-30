// Dashboard services for fetching personalized widget data
import { supabase } from './supabase-client';

export type WidgetType = 'stats' | 'chart' | 'activity' | 'quickActions' | 'custom';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: number;
  settings?: Record<string, any>;
  visible?: boolean;
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
  layout?: 'grid' | 'list';
  theme?: 'dark' | 'light';
}

// Get default dashboard configuration for different user types
export function getDefaultDashboardConfig(userType: string): DashboardConfig {
  switch(userType) {
    case 'business':
      return {
        widgets: [
          {
            id: 'business-stats',
            type: 'stats',
            title: 'Overview',
            description: 'Key metrics for your business',
            size: 'full',
            position: 0,
            visible: true
          },
          {
            id: 'campaign-performance',
            type: 'chart',
            title: 'Campaign Performance',
            description: 'Monitor campaign metrics over time',
            size: 'lg',
            position: 1,
            settings: {
              chartType: 'area',
              dataSource: 'campaigns',
              period: 'month'
            },
            visible: true
          },
          {
            id: 'budget-allocation',
            type: 'chart',
            title: 'Budget Allocation',
            description: 'Campaign spending breakdown',
            size: 'md',
            position: 2,
            settings: {
              chartType: 'pie',
              dataSource: 'budget'
            },
            visible: true
          },
          {
            id: 'recent-activity',
            type: 'activity',
            title: 'Recent Activity',
            description: 'Latest updates and notifications',
            size: 'md',
            position: 3,
            settings: {
              maxItems: 5
            },
            visible: true
          },
          {
            id: 'quick-actions',
            type: 'quickActions',
            title: 'Quick Actions',
            size: 'md',
            position: 4,
            visible: true
          }
        ],
        layout: 'grid',
        theme: 'dark'
      };
    
    case 'athlete':
      return {
        widgets: [
          {
            id: 'athlete-stats',
            type: 'stats',
            title: 'Performance',
            description: 'Your key metrics at a glance',
            size: 'full',
            position: 0,
            visible: true
          },
          {
            id: 'engagement-trends',
            type: 'chart',
            title: 'Engagement Trends',
            description: 'Track your engagement metrics over time',
            size: 'lg',
            position: 1,
            settings: {
              chartType: 'line',
              dataSource: 'engagement',
              period: 'week'
            },
            visible: true
          },
          {
            id: 'sponsor-distribution',
            type: 'chart',
            title: 'Sponsorship Breakdown',
            description: 'Distribution of sponsorship types',
            size: 'md',
            position: 2,
            settings: {
              chartType: 'pie',
              dataSource: 'sponsors'
            },
            visible: true
          },
          {
            id: 'recent-activity',
            type: 'activity',
            title: 'Recent Activity',
            description: 'Latest updates and messages',
            size: 'md',
            position: 3,
            settings: {
              maxItems: 5
            },
            visible: true
          },
          {
            id: 'quick-actions',
            type: 'quickActions',
            title: 'Quick Actions',
            size: 'md',
            position: 4,
            visible: true
          }
        ],
        layout: 'grid',
        theme: 'dark'
      };
    
    case 'admin':
      return {
        widgets: [
          {
            id: 'platform-stats',
            type: 'stats',
            title: 'Platform Metrics',
            description: 'Overall platform performance',
            size: 'full',
            position: 0,
            visible: true
          },
          {
            id: 'user-growth',
            type: 'chart',
            title: 'User Growth',
            description: 'Track new users over time',
            size: 'lg',
            position: 1,
            settings: {
              chartType: 'line',
              dataSource: 'users',
              period: 'month'
            },
            visible: true
          },
          {
            id: 'business-athlete-ratio',
            type: 'chart',
            title: 'User Distribution',
            description: 'Ratio of businesses to athletes',
            size: 'md',
            position: 2,
            settings: {
              chartType: 'pie',
              dataSource: 'userTypes'
            },
            visible: true
          },
          {
            id: 'system-activity',
            type: 'activity',
            title: 'System Activity',
            description: 'Recent platform events',
            size: 'md',
            position: 3,
            settings: {
              maxItems: 10
            },
            visible: true
          },
          {
            id: 'admin-actions',
            type: 'quickActions',
            title: 'Administration',
            size: 'md',
            position: 4,
            visible: true
          }
        ],
        layout: 'grid',
        theme: 'dark'
      };
      
    case 'compliance':
      return {
        widgets: [
          {
            id: 'compliance-stats',
            type: 'stats',
            title: 'Compliance Overview',
            description: 'Key compliance metrics',
            size: 'full',
            position: 0,
            visible: true
          },
          {
            id: 'review-queue',
            type: 'activity',
            title: 'Review Queue',
            description: 'Pending reviews and approvals',
            size: 'lg',
            position: 1,
            settings: {
              maxItems: 10,
              filter: 'pending'
            },
            visible: true
          },
          {
            id: 'compliance-actions',
            type: 'quickActions',
            title: 'Compliance Tools',
            size: 'md',
            position: 2,
            visible: true
          }
        ],
        layout: 'grid',
        theme: 'dark'
      };

    default:
      return {
        widgets: [
          {
            id: 'default-stats',
            type: 'stats',
            title: 'Overview',
            size: 'full',
            position: 0,
            visible: true
          },
          {
            id: 'quick-actions',
            type: 'quickActions',
            title: 'Quick Actions',
            size: 'md',
            position: 1,
            visible: true
          }
        ],
        layout: 'grid',
        theme: 'dark'
      };
  }
}

// Save dashboard configuration for a user
export async function saveDashboardConfig(userId: string, config: DashboardConfig): Promise<boolean> {
  try {
    // First, look for an existing dashboard config
    const { data: existingConfig, error: fetchError } = await supabase
      .from('user_preferences')
      .select('id, data')
      .eq('user_id', userId)
      .eq('preference_type', 'dashboard_config')
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching dashboard config:', fetchError);
      return false;
    }
    
    // If config exists, update it
    if (existingConfig) {
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({
          data: config,
          updated_at: new Date()
        })
        .eq('id', existingConfig.id);
      
      if (updateError) {
        console.error('Error updating dashboard config:', updateError);
        return false;
      }
      
      return true;
    }
    
    // Otherwise, create a new config
    const { error: insertError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        preference_type: 'dashboard_config',
        data: config
      });
    
    if (insertError) {
      console.error('Error saving dashboard config:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error saving dashboard config:', error);
    return false;
  }
}

// Load dashboard configuration for a user
export async function loadDashboardConfig(userId: string, userType: string): Promise<DashboardConfig> {
  try {
    // Try to fetch user's custom dashboard config
    const { data: userPreference, error } = await supabase
      .from('user_preferences')
      .select('data')
      .eq('user_id', userId)
      .eq('preference_type', 'dashboard_config')
      .single();
    
    // If there's a valid config, return it
    if (!error && userPreference && userPreference.data) {
      return userPreference.data as DashboardConfig;
    }
    
    // Otherwise, return the default config for this user type
    return getDefaultDashboardConfig(userType);
  } catch (error) {
    console.error('Error loading dashboard config:', error);
    return getDefaultDashboardConfig(userType);
  }
}

// Update a specific widget configuration
export async function updateWidgetConfig(
  userId: string, 
  widgetId: string, 
  updates: Partial<WidgetConfig>
): Promise<boolean> {
  try {
    // Get current dashboard config
    const currentConfig = await loadDashboardConfig(userId, ''); // Empty string as fallback
    
    // Find and update the specific widget
    const updatedWidgets = currentConfig.widgets.map(widget => {
      if (widget.id === widgetId) {
        return { ...widget, ...updates };
      }
      return widget;
    });
    
    // Save the updated config
    return await saveDashboardConfig(userId, {
      ...currentConfig,
      widgets: updatedWidgets
    });
  } catch (error) {
    console.error('Error updating widget config:', error);
    return false;
  }
}

// Add a new widget to the dashboard
export async function addWidget(
  userId: string, 
  widget: WidgetConfig
): Promise<boolean> {
  try {
    // Get current dashboard config
    const currentConfig = await loadDashboardConfig(userId, '');
    
    // Add the new widget
    const updatedWidgets = [...currentConfig.widgets, widget];
    
    // Save the updated config
    return await saveDashboardConfig(userId, {
      ...currentConfig,
      widgets: updatedWidgets
    });
  } catch (error) {
    console.error('Error adding widget:', error);
    return false;
  }
}

// Remove a widget from the dashboard
export async function removeWidget(
  userId: string, 
  widgetId: string
): Promise<boolean> {
  try {
    // Get current dashboard config
    const currentConfig = await loadDashboardConfig(userId, '');
    
    // Filter out the widget to remove
    const updatedWidgets = currentConfig.widgets.filter(widget => widget.id !== widgetId);
    
    // Save the updated config
    return await saveDashboardConfig(userId, {
      ...currentConfig,
      widgets: updatedWidgets
    });
  } catch (error) {
    console.error('Error removing widget:', error);
    return false;
  }
}

// Reorder widgets on the dashboard
export async function reorderWidgets(
  userId: string, 
  newOrder: { id: string, position: number }[]
): Promise<boolean> {
  try {
    // Get current dashboard config
    const currentConfig = await loadDashboardConfig(userId, '');
    
    // Create a map for the new positions
    const positionMap = new Map(newOrder.map(item => [item.id, item.position]));
    
    // Update positions for each widget
    const updatedWidgets = currentConfig.widgets.map(widget => {
      const newPosition = positionMap.get(widget.id);
      if (newPosition !== undefined) {
        return { ...widget, position: newPosition };
      }
      return widget;
    });
    
    // Sort widgets by position
    updatedWidgets.sort((a, b) => (a.position || 0) - (b.position || 0));
    
    // Save the updated config
    return await saveDashboardConfig(userId, {
      ...currentConfig,
      widgets: updatedWidgets
    });
  } catch (error) {
    console.error('Error reordering widgets:', error);
    return false;
  }
}