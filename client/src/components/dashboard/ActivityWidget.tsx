import React from 'react';
import { DashboardWidget, WidgetSize } from './DashboardWidget';
import { Activity, MessageSquare, User, Briefcase, DollarSign, Award, Clock, CalendarClock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type ActivityItemType = 'message' | 'athlete' | 'campaign' | 'payment' | 'match' | 'system';

export interface ActivityItem {
  id: string;
  type: ActivityItemType;
  title: string;
  description?: string;
  timestamp: string | Date;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  status?: 'pending' | 'completed' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
  link?: string;
}

export interface ActivityWidgetProps {
  id: string;
  title: string;
  description?: string;
  size?: WidgetSize;
  loading?: boolean;
  error?: boolean;
  onRefresh?: () => void;
  onRemove?: () => void;
  onResize?: (size: WidgetSize) => void;
  activities: ActivityItem[];
  maxItems?: number;
  showViewAll?: boolean;
  viewAllLink?: string;
  emptyMessage?: string;
  actionLabel?: string;
  actionLink?: string;
}

export function ActivityWidget({
  id,
  title,
  description,
  size = 'md',
  loading = false,
  error = false,
  onRefresh,
  onRemove,
  onResize,
  activities,
  maxItems = 5,
  showViewAll = true,
  viewAllLink = '/activities',
  emptyMessage = 'No recent activity',
  actionLabel,
  actionLink,
}: ActivityWidgetProps) {
  // Get appropriate icon based on activity type
  const getActivityIcon = (type: ActivityItemType) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case 'athlete':
        return <User className="h-4 w-4 text-green-400" />;
      case 'campaign':
        return <Award className="h-4 w-4 text-amber-400" />;
      case 'payment':
        return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case 'match':
        return <Briefcase className="h-4 w-4 text-purple-400" />;
      case 'system':
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  // Format a timestamp (can be string or Date)
  const formatTimestamp = (timestamp: string | Date) => {
    if (!timestamp) return '';
    
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    // For recent activity (less than 24 hours), show relative time
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 0 ? 'Just now' : `${diffMinutes}m ago`;
      }
      return `${Math.floor(diffHours)}h ago`;
    }
    
    // For older activity, show the date
    return date.toLocaleDateString('en-US', {
      month: 'short', 
      day: 'numeric'
    });
  };

  // Limit the number of activities to display
  const displayActivities = activities.slice(0, maxItems);

  return (
    <DashboardWidget
      id={id}
      title={title}
      description={description}
      size={size}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      onRemove={onRemove}
      onResize={onResize}
      icon={<Activity className="h-5 w-5" />}
      actionLabel={actionLabel}
      actionLink={actionLink}
      contentClassName="p-0"
    >
      {displayActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-zinc-800/50 p-3 text-gray-400 mb-4">
            <CalendarClock className="h-6 w-6" />
          </div>
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <ScrollArea className="h-[340px]">
          <div className="p-4 pt-2">
            {displayActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                {index > 0 && <Separator className="my-3 bg-zinc-800" />}
                <div className="flex items-start space-x-4">
                  {activity.user ? (
                    <Avatar className="h-8 w-8 border border-zinc-700">
                      <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                      <AvatarFallback className="bg-amber-900/20 text-amber-500">
                        {activity.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                      {getActivityIcon(activity.type)}
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">
                        {activity.title}
                      </p>
                      <div className="flex items-center">
                        {activity.status && (
                          <Badge 
                            className={cn(
                              "mr-2 px-1 text-xs", 
                              activity.status === 'completed' ? "bg-green-900/20 text-green-500" : 
                              activity.status === 'error' ? "bg-red-900/20 text-red-500" : 
                              "bg-amber-900/20 text-amber-500"
                            )}
                          >
                            {activity.status}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-400">
                        {activity.description}
                      </p>
                    )}
                    {activity.action && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={activity.action.onClick}
                        className="mt-2 h-7 text-xs border-zinc-700 bg-black/40"
                      >
                        {activity.action.label}
                      </Button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </ScrollArea>
      )}
      
      {showViewAll && activities.length > 0 && (
        <div className="p-3 bg-zinc-900/80 border-t border-zinc-800">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-amber-500 hover:text-amber-400 hover:bg-zinc-800/50"
            asChild
          >
            <a href={viewAllLink}>View all activity</a>
          </Button>
        </div>
      )}
    </DashboardWidget>
  );
}