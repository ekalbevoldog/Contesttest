# Dashboard Widget System Guide

## Overview

The dashboard widget system allows users to create a personalized dashboard experience with various widget types that display different kinds of information. This guide covers how to work with widgets, customize them, and develop new widget types.

## Widget Architecture

Each widget in the system follows a modular architecture:

1. **Base Component**: `DashboardWidget` serves as the wrapper component, providing:
   - Standard card UI with consistent styling
   - Header with title, settings, and remove options
   - Loading and error states
   - Common sizing behavior

2. **Specialized Components**: Each widget type has its own implementation:
   - `StatsWidget`: Displays key metrics in a grid layout
   - `ChartWidget`: Visualizes data using Recharts library
   - `ActivityWidget`: Shows a feed of recent activities
   - `QuickActionsWidget`: Provides shortcut buttons for common tasks

## Widget Types and Data Formats

### Stats Widget

**Purpose**: Display key metrics and statistics in a grid layout.

**Data Format**:
```typescript
interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  changeDirection?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

interface StatsWidgetData {
  items: StatItem[];
}
```

**Example**:
```json
{
  "items": [
    {
      "label": "Total Matches",
      "value": 24,
      "change": 12.5,
      "changeDirection": "up"
    },
    {
      "label": "Response Rate",
      "value": "68%",
      "change": -3.2,
      "changeDirection": "down"
    }
  ]
}
```

### Chart Widget

**Purpose**: Visualize data trends using various chart types.

**Data Format**:
```typescript
interface ChartPoint {
  x: string | number;
  y: number;
}

interface ChartSeries {
  name: string;
  data: ChartPoint[];
  color?: string;
}

interface ChartWidgetData {
  type: 'line' | 'bar' | 'area' | 'pie';
  series: ChartSeries[];
  xAxis?: {
    title?: string;
    type?: 'category' | 'time' | 'numeric';
  };
  yAxis?: {
    title?: string;
  };
}
```

**Example**:
```json
{
  "type": "line",
  "series": [
    {
      "name": "Profile Views",
      "data": [
        { "x": "Jan", "y": 120 },
        { "x": "Feb", "y": 145 },
        { "x": "Mar", "y": 132 }
      ],
      "color": "#4f46e5"
    }
  ],
  "xAxis": {
    "title": "Month"
  },
  "yAxis": {
    "title": "Views"
  }
}
```

### Activity Widget

**Purpose**: Display a feed of recent activities or events.

**Data Format**:
```typescript
interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: string;
  category?: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface ActivityWidgetData {
  items: ActivityItem[];
}
```

**Example**:
```json
{
  "items": [
    {
      "id": "act_123",
      "title": "New Campaign Match",
      "description": "You have a new match with Nike Running Campaign",
      "timestamp": "2025-04-30T14:23:10Z",
      "category": "match",
      "actionUrl": "/campaigns/123",
      "actionLabel": "View Match"
    }
  ]
}
```

### Quick Actions Widget

**Purpose**: Provide shortcut buttons for common actions.

**Data Format**:
```typescript
interface QuickActionItem {
  id: string;
  label: string;
  icon?: string;
  url?: string;
  action?: string;
  color?: string;
  description?: string;
}

interface QuickActionsWidgetData {
  items: QuickActionItem[];
}
```

**Example**:
```json
{
  "items": [
    {
      "id": "qa_1",
      "label": "New Campaign",
      "icon": "Plus",
      "url": "/campaigns/create",
      "color": "#4f46e5",
      "description": "Create a new marketing campaign"
    }
  ]
}
```

## Widget Customization

Users can customize widgets in several ways:

### Size Options

Widgets can be set to four different sizes:
- **Small (sm)**: Single column - ideal for simple stats
- **Medium (md)**: Two columns - default size for most widgets
- **Large (lg)**: Three columns - good for charts and complex data
- **Extra Large (xl)**: Full width - best for detailed charts or tables

Size is controlled by the `size` property in the widget configuration and corresponds to Tailwind CSS grid column spans.

### Visibility

Widgets can be hidden without removing them entirely using the `visible` property. This allows users to temporarily hide widgets they don't need.

### Position

Widget ordering is controlled by the `position` property, with widgets sorted from lowest to highest position value. When reordering, positions are recalculated to maintain consistent spacing.

## Default Widgets by User Role

The system provides role-specific default widgets when a user's dashboard is empty:

### Athletes

- **Performance Stats**: Key metrics on profile views, engagement, etc.
- **Match Opportunities**: Recent campaign matches with quick action buttons
- **Engagement Chart**: Line chart showing profile engagement over time
- **Activity Feed**: Recent notifications and platform activities

### Businesses

- **Campaign Performance**: Stats on active campaigns and performance
- **Athlete Matches**: Overview of recent matches with athletes
- **Budget Overview**: Chart showing budget allocation and spend
- **Quick Actions**: Shortcuts to create campaigns, review applications

### Compliance Officers

- **Review Queue**: Stats on pending reviews and completion rates
- **Compliance Metrics**: Charts showing compliance trends
- **Recent Actions**: Activity feed of recent approvals/rejections
- **Flag Actions**: Quick actions to flag common issues

### Administrators

- **Platform Health**: Stats on overall system performance
- **User Growth**: Charts showing user acquisition and retention
- **Recent Signups**: Activity feed of new user registrations
- **Admin Actions**: Shortcuts to common administrative tasks

## Widget State Management

The dashboard uses TanStack Query (React Query) for state management with the following query keys:

- Dashboard config: `['/api/dashboard/config']`
- Stats data: `['/api/dashboard/stats']` 
- Chart data: `['/api/dashboard/charts', source]`
- Activity data: `['/api/dashboard/activity']`
- Quick Actions data: `['/api/dashboard/quick-actions']`

Each widget type has its own data fetching logic with automatic loading states and error handling.

## Offline Support

The widget system implements offline support through:

1. **LocalStorage Caching**: Dashboard configurations are cached in browser localStorage
2. **Default Generators**: Role-based default widgets are generated when no configuration exists
3. **Visual Indicators**: Users are notified when in offline mode with options to reconnect

## WebSocket Real-time Updates

Widgets can receive real-time updates via WebSocket in two ways:

1. **Full Dashboard Update**:
   ```javascript
   // Listen for dashboard updates
   dashboardWs.on('dashboard_update', (data) => {
     queryClient.setQueryData(['/api/dashboard/config'], data.config);
   });
   ```

2. **Individual Widget Update**:
   ```javascript
   // Listen for widget-specific updates
   dashboardWs.on('widget_data_update', (data) => {
     // Find the specific widget query to update
     if (data.widgetType === 'stats') {
       queryClient.setQueryData(['/api/dashboard/stats'], data.widgetData);
     }
   });
   ```

## Developing New Widget Types

To add a new widget type to the system:

1. **Define the Type**: Add the new type to the `WidgetType` enum:
   ```typescript
   type WidgetType = 'stats' | 'chart' | 'activity' | 'quickActions' | 'myNewType';
   ```

2. **Create the Component**: Create a new component that renders the widget content:
   ```typescript
   const MyNewWidget = ({ data, isLoading, error, settings }) => {
     // Implement widget rendering logic here
     return (
       <div className="...">
         {/* Widget content */}
       </div>
     );
   };
   ```

3. **Add Data Fetching**: Implement the data fetching function:
   ```typescript
   export async function fetchMyNewTypeData(): Promise<MyNewTypeData> {
     const res = await fetch('/api/dashboard/my-new-type');
     return res.json();
   }
   ```

4. **Register the Query**: Add to the `dashboardQueryOptions` object:
   ```typescript
   myNewTypeData: {
     queryKey: ['/api/dashboard/my-new-type'],
     queryFn: fetchMyNewTypeData,
   }
   ```

5. **Add to Factory**: Update the widget factory in `Dashboard.tsx`:
   ```typescript
   const getWidgetComponent = (widget: Widget, isEditing: boolean = false) => {
     switch (widget.type) {
       // ...existing types
       case 'myNewType':
         return <MyNewWidget />
       default:
         return <div>Unknown widget type: {widget.type}</div>;
     }
   };
   ```

6. **Add to Default Config**: Include in the default config generation:
   ```typescript
   if (userRole === 'athlete') {
     widgets.push({
       id: uuidv4(),
       type: 'myNewType',
       title: 'My New Widget',
       position: widgets.length,
       size: 'md',
       visible: true,
     });
   }
   ```

## API Reference for Widget Operations

### Add Widget
```javascript
const addWidgetMutation = useMutation({
  mutationFn: addWidget,
  onSuccess: () => {
    queryClient.invalidateQueries(['/api/dashboard/config']);
  },
});

// Usage
addWidgetMutation.mutate({
  type: 'stats',
  title: 'My Stats',
  position: 0,
  size: 'md',
  visible: true,
});
```

### Update Widget
```javascript
const updateWidgetMutation = useMutation({
  mutationFn: (params) => updateWidget(params.widgetId, params.data),
  onSuccess: () => {
    queryClient.invalidateQueries(['/api/dashboard/config']);
  },
});

// Usage
updateWidgetMutation.mutate({
  widgetId: 'widget-123',
  data: { title: 'Updated Title', size: 'lg' },
});
```

### Remove Widget
```javascript
const removeWidgetMutation = useMutation({
  mutationFn: removeWidget,
  onSuccess: () => {
    queryClient.invalidateQueries(['/api/dashboard/config']);
  },
});

// Usage
removeWidgetMutation.mutate('widget-123');
```

### Reorder Widgets
```javascript
const reorderWidgetsMutation = useMutation({
  mutationFn: reorderWidgets,
  onSuccess: () => {
    queryClient.invalidateQueries(['/api/dashboard/config']);
  },
});

// Usage
reorderWidgetsMutation.mutate(['widget-2', 'widget-1', 'widget-3']);
```

## Troubleshooting Widget Issues

### Widget Not Appearing
- Check if widget's `visible` property is set to `true`
- Verify widget has a valid `type` that is registered
- Check console for fetch errors in widget data

### Widget Not Updating
- Verify WebSocket connection is active
- Check query invalidation after mutations
- Ensure widget data follows expected format

### Widget Data Incorrect
- Validate API response format 
- Check data transformations in component
- Verify data source connection status