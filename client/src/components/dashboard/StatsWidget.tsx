import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ArrowRightIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BarChart
} from 'lucide-react';
import DashboardWidget from './DashboardWidget';
import type { StatsWidget as StatsWidgetType, StatsData, StatsDataItem } from '../../../shared/dashboard-schema';
import { fetchStatsData } from '@/lib/dashboard-service';
import { cn } from '@/lib/utils';

interface StatsWidgetProps {
  widget: StatsWidgetType;
  className?: string;
}

// Renders individual stat items
const StatItem: React.FC<{ item: StatsDataItem }> = ({ item }) => {
  // Determine trend indicator
  const getTrendIndicator = () => {
    if (!item.trend) return null;
    
    const trendIcons = {
      up: <ArrowUpIcon className="h-4 w-4 text-emerald-500" />,
      down: <ArrowDownIcon className="h-4 w-4 text-red-500" />,
      neutral: <ArrowRightIcon className="h-4 w-4 text-gray-400" />
    };
    
    return trendIcons[item.trend];
  };

  // Format the change value
  const formatChange = () => {
    if (item.change === undefined) return null;
    
    const isPositive = item.change > 0;
    const color = isPositive ? 'text-emerald-500' : item.change < 0 ? 'text-red-500' : 'text-gray-400';
    const value = `${isPositive ? '+' : ''}${item.change}%`;
    
    return <span className={color}>{value}</span>;
  };

  return (
    <div className="flex flex-col px-3 py-2 rounded-lg backdrop-blur-sm bg-white/5 border border-gray-800">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{item.label}</span>
        <div className="flex items-center space-x-1">
          {getTrendIndicator()}
          <span className="text-xs">{formatChange()}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {item.icon && (
          <div className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center",
            item.color ? `bg-${item.color}-500/20 text-${item.color}-500` : "bg-primary/20 text-primary"
          )}>
            {item.icon === 'trending-up' && <TrendingUpIcon className="h-4 w-4" />}
            {item.icon === 'trending-down' && <TrendingDownIcon className="h-4 w-4" />}
            {item.icon === 'bar-chart' && <BarChart className="h-4 w-4" />}
          </div>
        )}
        <div className={cn("text-lg font-semibold", !item.icon && "ml-1")}>
          {item.value}
        </div>
      </div>
    </div>
  );
};

// Loading skeleton for stats
const StatsSkeletonLoader: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col p-3 rounded-lg backdrop-blur-sm bg-white/5 border border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-3 w-16 bg-gray-700" />
            <Skeleton className="h-3 w-8 bg-gray-700" />
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <Skeleton className="h-8 w-8 rounded-md bg-gray-700" />
            <Skeleton className="h-6 w-16 bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
};

const StatsWidget: React.FC<StatsWidgetProps> = ({ widget, className }) => {
  // Fetch stats data from the API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/dashboard/data/stats', widget.id],
    queryFn: fetchStatsData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // When there's an error, display a message
  if (error) {
    return (
      <DashboardWidget widget={widget} className={className} onRefresh={() => refetch()}>
        <div className="h-full flex items-center justify-center text-red-400 text-sm">
          Error loading stats: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </DashboardWidget>
    );
  }

  return (
    <DashboardWidget widget={widget} className={className} isLoading={isLoading} onRefresh={() => refetch()}>
      {isLoading ? (
        <StatsSkeletonLoader />
      ) : data && data.items && data.items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.items.map((item) => (
            <StatItem key={item.key} item={item} />
          ))}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
          No stats data available
        </div>
      )}
    </DashboardWidget>
  );
};

export default StatsWidget;