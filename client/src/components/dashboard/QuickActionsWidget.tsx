import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget, QuickActionItem } from '../../../shared/dashboard-schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';
import { Link } from 'wouter';

// Icon mapping function (dynamic icon rendering)
const getDynamicIcon = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
};

// Quick action item component
const QuickActionItemComponent = ({ item }: { item: QuickActionItem }) => {
  const colorMap: Record<string, string> = {
    'blue': 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    'green': 'bg-green-100 text-green-700 hover:bg-green-200',
    'red': 'bg-red-100 text-red-700 hover:bg-red-200',
    'amber': 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    'indigo': 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
    'purple': 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    'pink': 'bg-pink-100 text-pink-700 hover:bg-pink-200',
    'teal': 'bg-teal-100 text-teal-700 hover:bg-teal-200',
    'cyan': 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
    'gray': 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  };
  
  const bgColor = item.color ? colorMap[item.color] || 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  
  return (
    <div className="flex-1 min-w-0">
      <Link href={item.link}>
        <Button 
          variant="ghost" 
          className={`w-full h-full p-4 flex flex-col items-center justify-center rounded-lg transition-colors duration-200 ${bgColor}`}
        >
          <div className="mb-2">
            {item.icon ? getDynamicIcon(item.icon) : <Icons.ArrowRight className="h-5 w-5" />}
          </div>
          <span className="font-medium text-sm mb-1">{item.label}</span>
          {item.description && (
            <span className="text-xs opacity-80 text-center">{item.description}</span>
          )}
        </Button>
      </Link>
    </div>
  );
};

// Loading skeleton for quick actions
const QuickActionsLoadingSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {[1, 2, 3, 4, 5, 6].map(index => (
      <div key={index} className="p-4 rounded-lg">
        <div className="flex flex-col items-center">
          <Skeleton className="h-8 w-8 rounded-full mb-2" />
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    ))}
  </div>
);

interface QuickActionsWidgetProps {
  widget: Widget;
  onRefresh?: () => void;
  isEditing?: boolean;
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ widget, onRefresh, isEditing = false }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch quick actions data using TanStack Query
  const { 
    data: quickActionsData, 
    isLoading,
    isError,
    refetch
  } = useQuery(dashboardQueryOptions.quickActionsData);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    if (onRefresh) onRefresh();
  };
  
  // Get the number of columns from settings or default to 3
  const columns = widget.settings?.columns || 3;
  
  // Get the max number of quick actions to display
  const itemsToShow = quickActionsData?.length || 0;
  
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
        <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(columns, 4)} gap-3`}>
          {quickActionsData.slice(0, itemsToShow).map(item => (
            <QuickActionItemComponent key={item.id} item={item} />
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