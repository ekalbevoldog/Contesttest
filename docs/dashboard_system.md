# Dashboard System Documentation

## Overview

The dashboard system provides a personalized, real-time user interface for different user types (athletes, businesses, compliance officers, and administrators). It features configurable widgets with real-time updates via WebSockets, offline functionality through localStorage caching, and role-based default layouts.

## Architecture

The dashboard system consists of several key components:

1. **Frontend Components**
   - `Dashboard.tsx`: Main dashboard view with widget grid layout
   - `DashboardWidget.tsx`: Base widget component with common functionality
   - Specialized widget types (StatsWidget, ChartWidget, ActivityWidget, QuickActionsWidget)

2. **Services**
   - `dashboard-service.ts`: Frontend service for API interaction and WebSocket management
   - `dashboard-api.ts`: Backend API routes for dashboard operations
   - `dashboard-init.ts`: Backend initialization for database tables and default configurations

3. **Data Storage**
   - Database tables: `user_dashboard_configs` and `user_dashboard_preferences`
   - Local storage caching for offline functionality

## Real-time Updates with Polling

The dashboard features real-time data through a polling mechanism:

### Connection Setup

```javascript
// Set up polling interval (every 30 seconds)
this.pollingInterval = setInterval(() => {
  if (this.userId) {
    this.fetchDashboardData();
  }
}, 30000); // 30 seconds
```

The system uses a polling approach that's compatible with Supabase:

- Connection status is displayed in the UI with a "Live" badge
- Automatic reconnection attempts with exponential backoff
- User-specific data fetching based on user ID and role

### Event Types

The dashboard system supports the following event types:

| Event Type | Description | Purpose |
|------------|-------------|---------|
| `connection` | Connection status updates | Notify UI of online/offline status |
| `dashboard_update` | Dashboard configuration updates | Push updates to dashboard configuration |
| `widget_data_update` | Widget-specific data updates | Push updates to specific widget data |

## Fallback Mechanisms

The dashboard implements multiple fallback strategies to ensure a consistent user experience:

### 1. Local Storage Caching

Dashboard configurations are cached in browser localStorage:

```javascript
// Save configuration to localStorage
DashboardLocalStorageCache.saveConfig(config);

// Load configuration from localStorage
const cachedConfig = DashboardLocalStorageCache.loadConfig();
```

Key features:
- Automatic caching of successful API responses
- 24-hour cache expiration
- Automatic fallback when network requests fail

### 2. Default Widget Generation

When no configuration exists or can be loaded:

```javascript
// Create role-specific default widgets
const newConfig = createLocalDashboardConfig();
```

Default widgets are generated based on user role:
- **Athletes**: Performance metrics, activity feed, opportunity matches
- **Businesses**: Campaign performance, athlete matches, budget overview
- **Compliance**: Pending reviews, compliance metrics, recent actions
- **Administrators**: System health, user statistics, recent sign-ups

### 3. Connection Status Handling

The system displays connection status to users:

```jsx
{wsConnected && (
  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
    Live
  </Badge>
)}

{useOfflineMode && (
  <Alert variant="warning" className="mb-4">
    <WifiOff className="h-4 w-4" />
    <AlertTitle>Offline Mode Active</AlertTitle>
    <AlertDescription>
      You're currently using a locally cached version of your dashboard.
      Some features may be limited.
      <Button onClick={() => { setUseOfflineMode(false); refetch(); }}>
        Try reconnecting
      </Button>
    </AlertDescription>
  </Alert>
)}
```

## Widget System

### Widget Types

The system supports these widget types:

| Type | Component | Purpose |
|------|-----------|---------|
| `stats` | StatsWidget | Display key metrics and statistics |
| `chart` | ChartWidget | Visualize data trends with charts |
| `activity` | ActivityWidget | Show recent activity or history |
| `quickActions` | QuickActionsWidget | Provide shortcuts to common actions |

### Widget Properties

Each widget has the following properties:

```typescript
interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: number;
  size: 'sm' | 'md' | 'lg' | 'xl';
  visible: boolean;
  data?: any;
  settings?: Record<string, any>;
}
```

### Widget Sizing

Widgets use a responsive grid system with predefined size classes:

```javascript
const sizeClasses = {
  sm: 'col-span-1',
  md: 'col-span-2',
  lg: 'col-span-3',
  xl: 'col-span-4',
};
```

## API Endpoints

The dashboard system provides these API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dashboard/config` | GET | Retrieve user's dashboard configuration |
| `/api/dashboard/config` | POST | Update user's dashboard configuration |
| `/api/dashboard/widgets` | POST | Add a new widget |
| `/api/dashboard/widgets/:id` | PATCH | Update an existing widget |
| `/api/dashboard/widgets/:id` | DELETE | Remove a widget |
| `/api/dashboard/widgets/reorder` | POST | Reorder widgets |
| `/api/dashboard/health` | GET | Check dashboard system health |

## Database Schema

The dashboard system uses two main tables:

### user_dashboard_configs
```sql
CREATE TABLE IF NOT EXISTS user_dashboard_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB DEFAULT '{}',
  UNIQUE(user_id)
);
```

### user_dashboard_preferences
```sql
CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  color_scheme VARCHAR(50) DEFAULT 'system',
  refresh_interval INTEGER DEFAULT 300,
  collapsed_widgets JSONB DEFAULT '[]',
  favorite_widgets JSONB DEFAULT '[]',
  UNIQUE(user_id)
);
```

## Permissions and Security

Row-level security policies:
- Users can only read and modify their own dashboard configurations
- Administrators can view all dashboard configurations but only modify their own

```sql
-- Allow users to read their own dashboard configs
CREATE POLICY "Users can read own dashboard configs"
  ON user_dashboard_configs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own dashboard configs
CREATE POLICY "Users can update own dashboard configs"
  ON user_dashboard_configs
  FOR UPDATE
  USING (auth.uid() = user_id);
```

## Troubleshooting

Common issues and solutions:

1. **Connection failures**
   - Check for network connectivity issues
   - Verify API endpoints are accessible
   - Look for CORS issues in developer console

2. **Empty dashboard**
   - Check if default widgets generation is working properly
   - Verify localStorage access is not blocked
   - Check database permissions for the user

3. **Widget data not updating**
   - Check connection status in the UI
   - Verify data sources are accessible
   - Check console for API response errors

## Technical Implementation Notes

1. **Polling Approach**
   - Uses simple HTTP polling for dashboard updates
   - Compatible with Supabase's security model
   - Interval set to 30 seconds for balance between freshness and performance

2. **Query Invalidation**
   - After widget mutations, query cache is invalidated to refresh data
   - Uses TanStack Query's invalidation system
   - Example: `queryClient.invalidateQueries(['/api/dashboard/config'])`

3. **Default Widget Assignment**
   - Business users receive campaign performance and athlete match widgets
   - Athletes get performance metrics and opportunity cards
   - Fallback widgets are created when API calls fail or configuration is empty

4. **Real-time Updates Strategy**
   - System uses HTTP polling for standard updates
   - Falls back to localStorage caching when offline
   - UI indicates connection status to users