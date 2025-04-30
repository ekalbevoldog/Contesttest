import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget, ActivityItem } from '../../../shared/dashboard-schema';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as Icons from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';

// Dynamic icon rendering based on icon name string
const getDynamicIcon = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons];
  return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
};

// Status badge component with appropriate color
const StatusBadge = ({ status }: { status: string }) => {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  
  switch (status) {
    case 'success':
      variant = 'default';
      break;
    case 'pending':
    case 'warning':
      variant = 'secondary';
      break;
    case 'error':
      variant = 'destructive';
      break;
    default:
      variant = 'outline';
  }
  
  return (
    <Badge variant={variant} className="text-xs">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

// Activity item component
const ActivityItemComponent = ({ item }: { item: ActivityItem }) => {
  // Format timestamp to relative time (e.g., "2 hours ago")
  const timeAgo = formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
  
  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 bg-muted rounded-full p-1.5">
          {item.icon && getDynamicIcon(item.icon)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="font-medium">{item.title}</div>
            {item.status && <StatusBadge status={item.status} />}
          </div>
          
          <p className="text-sm text-muted-foreground">{item.description}</p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            
            {item.link && (
              <Link href={item.link}>
                <span className="text-xs text-primary hover:underline cursor-pointer">
                  View Details
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton for activity items
const ActivityLoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(index => (
      <div key={index} className="py-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
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

const ActivityWidget: React.FC<ActivityWidgetProps> = ({ 
  widget, 
  onRefresh,
  isEditing = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Maximum activity items to display
  const maxItems = widget.settings?.maxItems || 5;
  
  // Fetch activity data
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
  
  return (
    <DashboardWidget 
      widget={widget} 
      onRefresh={handleRefresh}
      isLoading={isLoading || isRefreshing}
      isEditing={isEditing}
    >
      <ScrollArea className="h-[300px] pr-4">
        {isLoading || isRefreshing ? (
          <ActivityLoadingSkeleton />
        ) : isError ? (
          <div className="p-4 text-center text-red-500">
            Failed to load activity data. Please try refreshing.
          </div>
        ) : activityData && activityData.length > 0 ? (
          <div className="divide-y">
            {activityData.slice(0, maxItems).map((item, index) => (
              <ActivityItemComponent key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            No recent activity to display.
          </div>
        )}
      </ScrollArea>
    </DashboardWidget>
  );
};

export default ActivityWidget;