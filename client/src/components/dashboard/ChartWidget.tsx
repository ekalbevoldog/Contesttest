import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import DashboardWidget from './DashboardWidget';
import type { ChartWidget as ChartWidgetType, ChartData } from '../../../shared/dashboard-schema';
import { fetchChartData } from '@/lib/dashboard-service';

interface ChartWidgetProps {
  widget: ChartWidgetType;
  className?: string;
}

// Loading skeleton for charts
const ChartSkeletonLoader: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[200px] flex items-center justify-center">
      <Skeleton className="h-48 w-full rounded-md bg-gray-700" />
    </div>
  );
};

const ChartWidget: React.FC<ChartWidgetProps> = ({ widget, className }) => {
  // Default settings
  const chartType = widget.settings?.chartType || 'line';
  const dataSource = widget.settings?.dataSource || 'default';
  const showLegend = widget.settings?.showLegend ?? true;
  const colors = widget.settings?.colors || ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'];

  // Fetch chart data from the API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/dashboard/data', dataSource],
    queryFn: () => fetchChartData(dataSource),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // When there's an error, display a message
  if (error) {
    return (
      <DashboardWidget widget={widget} className={className} onRefresh={() => refetch()}>
        <div className="h-full min-h-[200px] flex items-center justify-center text-red-400 text-sm">
          Error loading chart: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </DashboardWidget>
    );
  }

  // Render the appropriate chart based on chartType
  const renderChart = () => {
    if (!data || !data.data || data.data.length === 0) {
      return (
        <div className="h-full min-h-[200px] flex items-center justify-center text-gray-400 text-sm">
          No chart data available
        </div>
      );
    }

    const chartData = data.data;
    const series = data.series || [];

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis dataKey={data.xAxis || 'name'} stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              {showLegend && <Legend />}
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} 
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              {series.map((s, i) => (
                <Line 
                  key={s} 
                  type="monotone" 
                  dataKey={s} 
                  stroke={colors[i % colors.length]} 
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis dataKey={data.xAxis || 'name'} stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              {showLegend && <Legend />}
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} 
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              {series.map((s, i) => (
                <Bar 
                  key={s} 
                  dataKey={s} 
                  fill={colors[i % colors.length]} 
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                {series.map((s, i) => (
                  <linearGradient key={`gradient-${s}`} id={`color-${s}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0.2}/>
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey={data.xAxis || 'name'} stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              {showLegend && <Legend />}
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} 
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              {series.map((s, i) => (
                <Area 
                  key={s} 
                  type="monotone" 
                  dataKey={s} 
                  stroke={colors[i % colors.length]} 
                  fillOpacity={1} 
                  fill={`url(#color-${s})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey={series[0] || 'value'}
                nameKey={data.xAxis || 'name'}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              {showLegend && <Legend />}
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} 
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#9ca3af' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius={90} data={chartData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey={data.xAxis || 'name'} stroke="#9ca3af" />
              <PolarRadiusAxis stroke="#9ca3af" />
              {series.map((s, i) => (
                <Radar 
                  key={s} 
                  name={s} 
                  dataKey={s} 
                  stroke={colors[i % colors.length]} 
                  fill={colors[i % colors.length]} 
                  fillOpacity={0.3} 
                />
              ))}
              {showLegend && <Legend />}
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} 
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#9ca3af' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis 
                dataKey={data.xAxis || 'x'} 
                type="number" 
                name={data.xAxis || 'x'} 
                stroke="#6b7280" 
                fontSize={12} 
              />
              <YAxis 
                dataKey={series[0] || 'y'} 
                type="number" 
                name={series[0] || 'y'} 
                stroke="#6b7280" 
                fontSize={12} 
              />
              {series.length > 1 && (
                <ZAxis 
                  dataKey={series[1] || 'z'} 
                  type="number" 
                  range={[50, 500]} 
                  name={series[1] || 'z'} 
                />
              )}
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} 
                itemStyle={{ color: '#fff' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              {showLegend && <Legend />}
              <Scatter name="Data" data={chartData} fill={colors[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="h-full min-h-[200px] flex items-center justify-center text-gray-400 text-sm">
            Unsupported chart type: {chartType}
          </div>
        );
    }
  };

  return (
    <DashboardWidget widget={widget} className={className} isLoading={isLoading} onRefresh={() => refetch()}>
      <div className="pb-4">
        {isLoading ? <ChartSkeletonLoader /> : renderChart()}
      </div>
    </DashboardWidget>
  );
};

export default ChartWidget;