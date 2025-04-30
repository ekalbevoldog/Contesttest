import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget, ActivityItem } from '../../../shared/dashboard-schema';
import { Skeleton } from '@/components/ui/skeleton';
import * as Icons from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

// Dynamic icon component
const getDynamicIcon = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
};

// Format date for activity items
const formatActivityDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d, yyyy');
    }
  } catch (e) {
    return dateStr;
  }
};

// Status indicator component
const StatusIndicator = ({ status }: { status?: string }) => {
  if (!status) return null;
  
  const statusColorMap: Record<string, string> = {
    success: 'bg-green-500',
    pending: 'bg-yellow-500',
    warning: 'bg-orange-500',
    error: 'bg-red-500'
  };
  
  const colorClass = statusColorMap[status] || 'bg-gray-500';
  
  return <div className={cn('h-2 w-2 rounded-full', colorClass)} />;
};

// Single activity item component
const ActivityItemComponent = ({ item }: { item: ActivityItem }) => {
  const statusColorMap: Record<string, string> = {
    success: 'text-green-600',
    pending: 'text-yellow-600',
    warning: 'text-orange-600',
    error: 'text-red-600'
  };
  
  const iconColorClass = item.status ? statusColorMap[item.status] : 'text-gray-600';
  
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      {item.icon && (
        <div className={cn('p-2 rounded-full bg-gray-100', iconColorClass)}>
          {getDynamicIcon(item.icon)}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{item.title}</h4>
          <StatusIndicator status={item.status} />
        </div>
        <p className="text-muted-foreground text-xs mt-1">{item.description}</p>
        {item.link && (
          <Link href={item.link}>
            <span className="text-xs text-primary hover:underline cursor-pointer mt-1 inline-block">
              View details
            </span>
          </Link>
        )}
      </div>
      
      <div className="text-muted-foreground text-xs whitespace-nowrap">
        {formatActivityDate(item.timestamp)}
      </div>
    </div>
  );
};

// Loading skeleton for activity items
const ActivityLoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map(index => (
      <div key={index} className="flex items-start gap-3 py-3 border-b last:border-0">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-20 mt-1" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    ))}
  </div>
);

interface ActivityWidgetProps {
  widget: Widget;
  onRefresh?: () => void;
  isEditing?: boolean;
}

const ActivityWidget: React.FC<ActivityWidgetProps> = ({ 
  widget, 
  onRefresh,
  isEditing = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch activity data
  const { 
    data: activityData, 
    isLoading,
    isError,
    refetch
  } = useQuery(dashboardQueryOptions.activityData);
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    if (onRefresh) onRefresh();
  };
  
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
        <div className="max-h-[400px] overflow-y-auto">
          {activityData.map((activity) => (
            <ActivityItemComponent key={activity.id} item={activity} />
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          No recent activity.
        </div>
      )}
    </DashboardWidget>
  );
};

export default ActivityWidget;