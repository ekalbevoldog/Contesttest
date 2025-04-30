import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { StatItem } from '@shared/dashboard-schema';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { fetchStatsData } from '@/lib/dashboard-service';

interface StatsWidgetProps {
  widgetId: string;
}

const StatsWidget: React.FC<StatsWidgetProps> = ({ widgetId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/stats', widgetId],
    queryFn: fetchStatsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <StatsLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load stats data
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No stats available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {data.items.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
};

const StatCard: React.FC<{ stat: StatItem }> = ({ stat }) => {
  const { label, value, change, changeType, changeLabel, icon } = stat;

  return (
    <div className="rounded-lg border p-3 shadow-sm">
      <div className="flex items-center gap-2">
        {icon && (
          <div className="text-muted-foreground">
            {/* Use a simple icon representation for now */}
            <span className="rounded-md bg-primary/10 p-1.5 text-xs">{icon.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              <span
                className={
                  changeType === 'increase'
                    ? 'text-green-500'
                    : changeType === 'decrease'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
                }
              >
                {changeType === 'increase' ? (
                  <ArrowUp className="h-3 w-3" />
                ) : changeType === 'decrease' ? (
                  <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowRight className="h-3 w-3" />
                )}
              </span>
              <span
                className={
                  changeType === 'increase'
                    ? 'text-green-500'
                    : changeType === 'decrease'
                    ? 'text-red-500'
                    : 'text-muted-foreground'
                }
              >
                {change > 0 ? '+' : ''}
                {change}%
              </span>
              {changeLabel && (
                <span className="text-muted-foreground ml-1">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatsLoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="mt-2">
            <Skeleton className="h-8 w-16" />
            <div className="mt-1 flex items-center gap-1">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsWidget;