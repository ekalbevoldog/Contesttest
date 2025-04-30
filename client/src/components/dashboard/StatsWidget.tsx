import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget, StatItem } from '../../../shared/dashboard-schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import * as Icons from 'lucide-react';
import { Link } from 'wouter';

// Icon mapping function (dynamic icon rendering)
const getDynamicIcon = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
};

// Stat card component
const StatCard = ({ item }: { item: StatItem }) => {
  const iconColorMap: Record<string, string> = {
    'blue': 'bg-blue-100 text-blue-600',
    'green': 'bg-green-100 text-green-600',
    'red': 'bg-red-100 text-red-600',
    'amber': 'bg-amber-100 text-amber-600',
    'indigo': 'bg-indigo-100 text-indigo-600',
    'purple': 'bg-purple-100 text-purple-600',
    'pink': 'bg-pink-100 text-pink-600',
    'teal': 'bg-teal-100 text-teal-600',
    'cyan': 'bg-cyan-100 text-cyan-600',
    'gray': 'bg-gray-100 text-gray-600'
  };
  
  const trendColorMap: Record<string, string> = {
    'up': 'text-green-600',
    'down': 'text-red-600',
    'neutral': 'text-gray-600'
  };
  
  const bgColor = item.color ? iconColorMap[item.color] || 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-600';
  const trendColor = item.trend ? trendColorMap[item.trend] || 'text-gray-600' : 'text-gray-600';
  
  return (
    <div className="flex-1 min-w-0">
      <Card 
        className={`h-full flex flex-col p-4 border rounded-lg ${item.link ? 'hover:shadow-md transition-shadow duration-200' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-full ${bgColor.split(' ')[0]}`}>
            {item.icon && getDynamicIcon(item.icon)}
          </div>
          {item.trend && (
            <div className={`flex items-center ${trendColor}`}>
              {item.trend === 'up' && <Icons.TrendingUp className="h-3 w-3 mr-1" />}
              {item.trend === 'down' && <Icons.TrendingDown className="h-3 w-3 mr-1" />}
              {item.trend === 'neutral' && <Icons.Minus className="h-3 w-3 mr-1" />}
              <span className="text-xs">
                {item.change && (item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : '')}
                {item.change}%
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-3">
          <div className="text-sm text-gray-500">{item.label}</div>
          <div className="text-2xl font-bold mt-1">{item.value}</div>
        </div>
        
        {item.link && (
          <div className="mt-auto pt-2">
            <Link href={item.link}>
              <span className="text-xs font-medium text-primary cursor-pointer">
                View Details →
              </span>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

// Loading skeleton for stats
const StatsLoadingSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map(index => (
      <div key={index} className="flex-1">
        <Card className="h-full p-4 border rounded-lg">
          <div className="flex items-start justify-between">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="mt-3">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        </Card>
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
          Failed to load stats data. Please try refreshing.
        </div>
      ) : statsData && statsData.items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsData.items.map(item => (
            <StatCard key={item.key} item={item} />
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500">
          No stats data available.
        </div>
      )}
    </DashboardWidget>
  );
};

export default StatsWidget;