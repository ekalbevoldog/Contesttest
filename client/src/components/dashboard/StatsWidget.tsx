import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget, StatItem } from '../../../shared/dashboard-schema';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import * as Icons from 'lucide-react';

// Icon mapping function (dynamic icon rendering)
const getDynamicIcon = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
};

// Trend indicator component
const TrendIndicator = ({ trend, change }: { trend?: string; change?: number }) => {
  if (!trend || !change) return null;
  
  return (
    <div className="flex items-center">
      {trend === 'up' && <ArrowUp className="h-3 w-3 text-green-500 mr-1" />}
      {trend === 'down' && <ArrowDown className="h-3 w-3 text-red-500 mr-1" />}
      {trend === 'neutral' && <Minus className="h-3 w-3 text-gray-500 mr-1" />}
      <span className={`text-xs font-medium ${
        trend === 'up' ? 'text-green-500' : 
        trend === 'down' ? 'text-red-500' : 
        'text-gray-500'
      }`}>
        {change}%
      </span>
    </div>
  );
};

// Stat item component
const StatItemComponent = ({ item }: { item: StatItem }) => {
  const bgColorMap: Record<string, string> = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    amber: 'bg-amber-100',
    indigo: 'bg-indigo-100',
    purple: 'bg-purple-100',
    pink: 'bg-pink-100',
    gray: 'bg-gray-100'
  };
  
  const textColorMap: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    indigo: 'text-indigo-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600',
    gray: 'text-gray-600'
  };
  
  const bgColor = item.color ? bgColorMap[item.color] || 'bg-gray-100' : 'bg-gray-100';
  const textColor = item.color ? textColorMap[item.color] || 'text-gray-600' : 'text-gray-600';
  
  return (
    <div className="flex flex-col p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="flex justify-between mb-2">
        <div className={`${bgColor} p-2 rounded-md`}>
          {item.icon && <div className={textColor}>{getDynamicIcon(item.icon)}</div>}
        </div>
        <TrendIndicator trend={item.trend} change={item.change} />
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold">{item.value}</div>
        <div className="text-sm text-gray-500">{item.label}</div>
      </div>
    </div>
  );
};

// Loading skeleton for stats
const StatsLoadingSkeleton = () => (
  <div className="grid grid-cols-2 gap-4">
    {[1, 2, 3, 4].map(index => (
      <div key={index} className="flex flex-col p-4 rounded-lg border border-gray-100">
        <div className="flex justify-between mb-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="mt-2">
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-24" />
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

const StatsWidget: React.FC<StatsWidgetProps> = ({ widget, onRefresh, isEditing = false }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch stats data using TanStack Query
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
          Failed to load stats. Please try refreshing.
        </div>
      ) : statsData?.items && statsData.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {statsData.items.map(item => (
            <StatItemComponent key={item.key} item={item} />
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          No stats available to display.
        </div>
      )}
    </DashboardWidget>
  );
};

export default StatsWidget;