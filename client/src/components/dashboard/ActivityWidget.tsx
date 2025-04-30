import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  Bell, 
  Calendar, 
  Check, 
  X, 
  AlertCircle,
  Award,
  FileText,
  User,
  Users,
  Clock,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardWidget from './DashboardWidget';
import type { ActivityWidget as ActivityWidgetType, ActivityItem } from '../../../shared/dashboard-schema';
import { fetchActivityData } from '@/lib/dashboard-service';

interface ActivityWidgetProps {
  widget: ActivityWidgetType;
  className?: string;
}

// Activity item component
const ActivityItemComponent: React.FC<{ item: ActivityItem }> = ({ item }) => {
  // Format timestamp to relative time (e.g. "2 hours ago")
  const getRelativeTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Select icon based on activity type
  const getIcon = () => {
    const iconMap: Record<string, React.ReactNode> = {
      message: <MessageSquare className="h-4 w-4" />,
      notification: <Bell className="h-4 w-4" />,
      event: <Calendar className="h-4 w-4" />,
      completion: <Check className="h-4 w-4" />,
      error: <X className="h-4 w-4" />,
      warning: <AlertCircle className="h-4 w-4" />,
      achievement: <Award className="h-4 w-4" />,
      document: <FileText className="h-4 w-4" />,
      user: <User className="h-4 w-4" />,
      team: <Users className="h-4 w-4" />,
      reminder: <Clock className="h-4 w-4" />,
      activity: <Activity className="h-4 w-4" />
    };

    return item.icon ? 
      iconMap[item.icon] || <Activity className="h-4 w-4" /> : 
      iconMap[item.type] || <Activity className="h-4 w-4" />;
  };

  // Select color based on status
  const getStatusColor = () => {
    if (!item.status) return '';
    
    const statusColorMap: Record<string, string> = {
      success: 'bg-emerald-400/20 text-emerald-400',
      error: 'bg-red-400/20 text-red-400',
      warning: 'bg-amber-400/20 text-amber-400',
      info: 'bg-blue-400/20 text-blue-400',
      pending: 'bg-gray-400/20 text-gray-400'
    };

    return statusColorMap[item.status] || '';
  };

  return (
    <div className="flex items-start space-x-3 py-3 hover:bg-white/5 px-2 rounded-md transition-colors">
      <div className={cn(
        "mt-0.5 rounded-full p-1.5 flex-shrink-0",
        getStatusColor() || "bg-gray-700 text-gray-300"
      )}>
        {getIcon()}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium leading-none">{item.title}</p>
          <span className="text-xs text-gray-400">{getRelativeTime(item.timestamp)}</span>
        </div>
        <p className="text-xs text-gray-400">{item.description}</p>
        {item.user && (
          <div className="flex items-center mt-1">
            {item.user.avatar && (
              <div className="h-5 w-5 rounded-full overflow-hidden mr-1.5">
                <img src={item.user.avatar} alt={item.user.name || 'User'} className="w-full h-full object-cover" />
              </div>
            )}
            <span className="text-xs text-gray-300">{item.user.name}</span>
          </div>
        )}
        {item.link && (
          <a 
            href={item.link} 
            className="text-xs text-blue-400 hover:text-blue-300 inline-block mt-1"
          >
            View details
          </a>
        )}
      </div>
    </div>
  );
};

// Loading skeleton for activities
const ActivitySkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start space-x-3 py-3">
          <Skeleton className="h-8 w-8 rounded-full bg-gray-700" />
          <div className="space-y-2 flex-1">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24 bg-gray-700" />
              <Skeleton className="h-3 w-12 bg-gray-700" />
            </div>
            <Skeleton className="h-3 w-full bg-gray-700" />
            <Skeleton className="h-3 w-2/3 bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
};

const ActivityWidget: React.FC<ActivityWidgetProps> = ({ widget, className }) => {
  // Get settings from widget
  const maxItems = widget.settings?.maxItems || 5;
  const filter = widget.settings?.filter;
  
  // Fetch activity data from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/dashboard/data/activities', filter],
    queryFn: fetchActivityData,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Filter activities if needed
  const getFilteredActivities = () => {
    if (!data) return [];
    if (!filter) return data.slice(0, maxItems);
    
    return data
      .filter(item => item.status === filter || item.type === filter)
      .slice(0, maxItems);
  };

  // When there's an error, display a message
  if (error) {
    return (
      <DashboardWidget widget={widget} className={className} onRefresh={() => refetch()}>
        <div className="h-full flex items-center justify-center text-red-400 text-sm">
          Error loading activities: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </DashboardWidget>
    );
  }

  return (
    <DashboardWidget widget={widget} className={className} isLoading={isLoading} onRefresh={() => refetch()}>
      <ScrollArea className="h-[300px] pr-3 -mr-3">
        {isLoading ? (
          <ActivitySkeletonLoader />
        ) : data && data.length > 0 ? (
          <div className="space-y-1 divide-y divide-gray-800/50">
            {getFilteredActivities().map((item) => (
              <ActivityItemComponent key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No activity data available
          </div>
        )}
      </ScrollArea>
    </DashboardWidget>
  );
};

export default ActivityWidget;