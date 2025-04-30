import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget, QuickActionItem } from '../../../shared/dashboard-schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

// Dynamic icon component
const getDynamicIcon = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
};

// Quick action button component
const QuickActionButton = ({ item }: { item: QuickActionItem }) => {
  // Color mapping
  const colorMap: Record<string, string> = {
    'blue': 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    'green': 'bg-green-50 text-green-600 hover:bg-green-100',
    'red': 'bg-red-50 text-red-600 hover:bg-red-100',
    'purple': 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    'amber': 'bg-amber-50 text-amber-600 hover:bg-amber-100',
    'indigo': 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    'pink': 'bg-pink-50 text-pink-600 hover:bg-pink-100',
    'teal': 'bg-teal-50 text-teal-600 hover:bg-teal-100',
    'cyan': 'bg-cyan-50 text-cyan-600 hover:bg-cyan-100',
    'gray': 'bg-gray-50 text-gray-600 hover:bg-gray-100'
  };
  
  // Get color class or use default
  const colorClass = item.color ? colorMap[item.color] || colorMap.gray : colorMap.gray;
  
  return (
    <Link href={item.link}>
      <Button
        variant="outline"
        className={cn(
          "h-auto w-full justify-start gap-2 p-3 flex flex-col items-center border rounded-lg hover:shadow-sm transition-all duration-200",
          colorClass
        )}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white">
          {item.icon ? getDynamicIcon(item.icon) : null}
        </div>
        <div className="text-sm font-medium mt-1">{item.label}</div>
        {item.description && <div className="text-xs text-muted-foreground text-center mt-1">{item.description}</div>}
      </Button>
    </Link>
  );
};

// Loading skeleton for quick actions
const QuickActionsLoadingSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
    {[1, 2, 3, 4, 5, 6].map(index => (
      <div key={index} className="flex flex-col items-center p-3 border rounded-lg">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="h-4 w-20 mt-2" />
        <Skeleton className="h-3 w-full mt-1" />
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
    data: quickActionsData, 
    isLoading,
    isError,
    refetch
  } = useQuery(dashboardQueryOptions.quickActionsData);
  
  // Columns for the grid layout
  const columns = widget.settings?.columns || 3;
  
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
        <QuickActionsLoadingSkeleton />
      ) : isError ? (
        <div className="p-4 text-center text-red-500">
          Failed to load quick actions. Please try refreshing.
        </div>
      ) : quickActionsData && quickActionsData.length > 0 ? (
        <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(columns, 4)} gap-4`}>
          {quickActionsData.map(action => (
            <QuickActionButton key={action.id} item={action} />
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