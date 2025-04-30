import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget, StatItem } from '../../../shared/dashboard-schema';
import { Skeleton } from '@/components/ui/skeleton';
import * as Icons from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Dynamic icon component
const getDynamicIcon = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
};

// Trend indicator component
const TrendIndicator = ({ trend, change }: { trend?: string; change?: number }) => {
  if (!trend || change === undefined) return null;
  
  let Icon;
  let colorClass;
  
  switch (trend) {
    case 'up':
      Icon = Icons.TrendingUp;
      colorClass = 'text-green-600';
      break;
    case 'down':
      Icon = Icons.TrendingDown;
      colorClass = 'text-red-600';
      break;
    default:
      Icon = Icons.Minus;
      colorClass = 'text-gray-600';
  }
  
  return (
    <div className={cn("flex items-center gap-1 text-xs", colorClass)}>
      <Icon className="h-3 w-3" />
      <span>{Math.abs(change)}%</span>
    </div>
  );
};

// Single stat item component
const StatItemComponent = ({ item }: { item: StatItem }) => {
  return (
    <div className="p-3 bg-card border rounded-md flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {item.icon && (
            <div className={cn(
              "p-2 rounded-full",
              item.color ? `bg-${item.color}-100 text-${item.color}-600` : "bg-gray-100 text-gray-600"
            )}>
              {getDynamicIcon(item.icon)}
            </div>
          )}
          <span className="text-sm text-muted-foreground">{item.label}</span>
        </div>
        <TrendIndicator trend={item.trend} change={item.change} />
      </div>
      
      <div className="mt-1">
        <div className="text-2xl font-semibold">{item.value}</div>
      </div>
      
      {item.link && (
        <div className="mt-auto pt-2">
          <Link href={item.link}>
            <span className="text-xs text-primary hover:underline cursor-pointer">View details</span>
          </Link>
        </div>
      )}
    </div>
  );
};

// Loading skeleton for stat items
const StatsLoadingSkeleton = () => (
  <div className="grid grid-cols-2 gap-4">
    {[1, 2, 3, 4].map(index => (
      <div key={index} className="p-3 border rounded-md flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="mt-1">
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="mt-auto pt-2">
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    ))}
  </div>
);

interface StatsWidgetProps {
  widget: Widget;
  onRefresh?: () => void;
  isEditing?: boolean;
}

const StatsWidget: React.FC<StatsWidgetProps> = ({ 
  widget, 
  onRefresh,
  isEditing = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch stats data
  const { 
    data: statsData, 
    isLoading,
    isError,
    refetch
  } = useQuery(dashboardQueryOptions.statsData);
  
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
      {isLoading || isRefreshing ? (
        <StatsLoadingSkeleton />
      ) : isError ? (
        <div className="p-4 text-center text-red-500">
          Failed to load stats data. Please try refreshing.
        </div>
      ) : statsData && statsData.items && statsData.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {statsData.items.map((item) => (
            <StatItemComponent key={item.key} item={item} />
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          No stats available.
        </div>
      )}
    </DashboardWidget>
  );
};

export default StatsWidget;