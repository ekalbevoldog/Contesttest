import React from 'react';
import { DashboardWidget, WidgetSize } from './DashboardWidget';
import { BarChart3, Users, TrendingUp, DollarSign, Eye, ShoppingBag } from 'lucide-react';

export type StatItem = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
};

export interface StatsWidgetProps {
  id: string;
  title: string;
  description?: string;
  size?: WidgetSize;
  loading?: boolean;
  error?: boolean;
  onRefresh?: () => void;
  onRemove?: () => void;
  onResize?: (size: WidgetSize) => void;
  stats: StatItem[];
  columns?: 1 | 2 | 3 | 4;
}

// Map of common stat icons
export const StatIcons = {
  campaigns: <BarChart3 className="h-6 w-6 text-amber-500" />,
  athletes: <Users className="h-6 w-6 text-amber-500" />,
  engagement: <TrendingUp className="h-6 w-6 text-amber-500" />,
  revenue: <DollarSign className="h-6 w-6 text-amber-500" />,
  views: <Eye className="h-6 w-6 text-amber-500" />,
  products: <ShoppingBag className="h-6 w-6 text-amber-500" />,
};

export function StatsWidget({
  id,
  title,
  description,
  size = 'full',
  loading = false,
  error = false,
  onRefresh,
  onRemove,
  onResize,
  stats,
  columns = 3,
}: StatsWidgetProps) {
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
      icon={<BarChart3 className="h-5 w-5" />}
    >
      <div className={`grid grid-cols-1 ${
        columns === 1 ? 'md:grid-cols-1' : 
        columns === 2 ? 'md:grid-cols-2' : 
        columns === 4 ? 'md:grid-cols-4' : 
        'md:grid-cols-3'
      } gap-4`}>
        {stats.map((stat, index) => (
          <div 
            key={`${id}-stat-${index}`}
            className="flex items-center p-4 border border-zinc-800 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 group"
          >
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 flex items-center justify-center mr-4 group-hover:from-amber-500/30 group-hover:to-red-500/30 transition-all duration-300">
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-400">{stat.label}</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                {stat.change !== undefined && (
                  <span className={`text-xs pb-1 ${
                    stat.change > 0 ? 'text-green-500' : 
                    stat.change < 0 ? 'text-red-500' : 
                    'text-gray-500'
                  }`}>
                    {stat.change > 0 ? '↑' : stat.change < 0 ? '↓' : '•'} 
                    {Math.abs(stat.change)}% {stat.changeLabel || ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}