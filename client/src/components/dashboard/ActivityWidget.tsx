import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget, ActivityItem } from '../../../shared/dashboard-schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import * as Icons from 'lucide-react';
import { Link } from 'wouter';

// Format relative time
const formatRelativeDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  } else if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  } else if (isThisWeek(date)) {
    return format(date, 'EEEE');
  } else {
    return format(date, 'MMM d, yyyy');
  }
};

// Icon mapping function (dynamic icon rendering)
const getDynamicIcon = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
};

// Status badge component
const StatusBadge = ({ status }: { status?: string }) => {
  if (!status) return null;
  
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
    case 'success':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Success</Badge>;
    case 'warning':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Warning</Badge>;
    case 'error':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
    default:
      return null;
  }
};

// Activity item component
const ActivityItemComponent = ({ item }: { item: ActivityItem }) => {
  const iconColorMap: Record<string, string> = {
    'message': 'text-blue-500',
    'alert': 'text-red-500',
    'notification': 'text-purple-500',
    'update': 'text-green-500',
    'match': 'text-indigo-500',
    'payment': 'text-amber-500',
    'campaign': 'text-emerald-500',
    'partnership': 'text-teal-500',
    'review': 'text-cyan-500',
    'user': 'text-gray-500'
  };
  
  const iconColor = iconColorMap[item.type] || 'text-gray-500';
  
  return (
    <div className="flex items-start gap-3 p-3 border-b last:border-b-0 hover:bg-gray-50">
      <div className={`p-2 rounded-full ${iconColor.replace('text-', 'bg-').replace('500', '100')}`}>
        {item.icon && <div className={iconColor}>{getDynamicIcon(item.icon)}</div>}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-sm">{item.title}</h4>
            <p className="text-gray-500 text-xs mt-1">{item.description}</p>
          </div>
          <StatusBadge status={item.status} />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-400">{formatRelativeDate(item.timestamp)}</span>
          {item.link && (
            <Link href={item.link}>
              <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                View Details
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading skeleton for activity feed
const ActivityLoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map(index => (
      <div key={index} className="flex items-start gap-3 p-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex justify-between mt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

interface ActivityWidgetProps {
  widget: Widget;
  onRefresh?: () => void;
  isEditing?: boolean;
}

const ActivityWidget: React.FC<ActivityWidgetProps> = ({ widget, onRefresh, isEditing = false }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch activity data using TanStack Query
  const { 
    data: activityData, 
    isLoading,
    isError,
    refetch
  } = useQuery(dashboardQueryOptions.activityData);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    if (onRefresh) onRefresh();
  };
  
  // Get the max number of items from settings or default to 5
  const maxItems = widget.settings?.maxItems || 5;
  
  return (
    <DashboardWidget 
      widget={widget} 
      onRefresh={handleRefresh}
      isLoading={isLoading || isRefreshing}
      isEditing={isEditing}
    >
      {isLoading || isRefreshing ? (
        <ActivityLoadingSkeleton />
      ) : isError ? (
        <div className="p-4 text-center text-red-500">
          Failed to load activity data. Please try refreshing.
        </div>
      ) : activityData && activityData.length > 0 ? (
        <div className="divide-y">
          {activityData.slice(0, maxItems).map(item => (
            <ActivityItemComponent key={item.id} item={item} />
          ))}
          
          {activityData.length > maxItems && (
            <div className="pt-3 text-center">
              <Link href="/activities">
                <Button variant="link" size="sm">
                  View all activities
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          No recent activity to display.
        </div>
      )}
    </DashboardWidget>
  );
};

export default ActivityWidget;