import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget, QuickActionItem } from '../../../shared/dashboard-schema';
import { Skeleton } from '@/components/ui/skeleton';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';

// Dynamic icon component
const getDynamicIcon = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
};

// Single action item component
const ActionItem = ({ item }: { item: QuickActionItem }) => {
  return (
    <Link href={item.link}>
      <div className="p-4 bg-card border rounded-md flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer group">
        {item.icon && (
          <div className={cn(
            "p-2 rounded-full",
            item.color ? `bg-${item.color}-100 text-${item.color}-600` : "bg-primary/10 text-primary"
          )}>
            {getDynamicIcon(item.icon)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
            {item.label}
          </h4>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
        </div>
        <div className="text-muted-foreground">
          <Icons.ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
};

// Loading skeleton for action items
const ActionsLoadingSkeleton = () => (
  <div className="grid gap-3">
    {[1, 2, 3, 4].map(index => (
      <div key={index} className="p-4 border rounded-md flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-4 w-4" />
      </div>
    ))}
  </div>
);

interface QuickActionsWidgetProps {
  widget: Widget;
  onRefresh?: () => void;
  isEditing?: boolean;
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ 
  widget, 
  onRefresh,
  isEditing = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch quick actions data
  const { 
    data: actionData, 
    isLoading,
    isError,
    refetch
  } = useQuery(dashboardQueryOptions.quickActionsData);
  
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
        <ActionsLoadingSkeleton />
      ) : isError ? (
        <div className="p-4 text-center text-red-500">
          Failed to load quick actions. Please try refreshing.
        </div>
      ) : actionData && actionData.length > 0 ? (
        <div className="grid gap-3 max-h-[400px] overflow-y-auto">
          {actionData.map((action) => (
            <ActionItem key={action.id} item={action} />
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          No quick actions available.
        </div>
      )}
    </DashboardWidget>
  );
};

export default QuickActionsWidget;