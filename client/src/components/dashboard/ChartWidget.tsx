import React from 'react';
import { DashboardWidget, WidgetSize } from './DashboardWidget';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BarChart4, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';

export type ChartType = 'area' | 'bar' | 'line' | 'pie';

export interface ChartSeries {
  name: string;
  dataKey: string; 
  color: string;
  gradient?: {
    id: string;
    startColor: string;
    endColor: string;
    startOpacity?: number;
    endOpacity?: number;
  };
}

export interface ChartWidgetProps {
  id: string;
  title: string;
  description?: string;
  size?: WidgetSize;
  loading?: boolean;
  error?: boolean;
  onRefresh?: () => void;
  onRemove?: () => void;
  onResize?: (size: WidgetSize) => void;
  chartType: ChartType;
  data: any[];
  series: ChartSeries[];
  xAxisKey?: string;
  height?: number;
  stacked?: boolean;
  actionLabel?: string;
  actionLink?: string;
}

export function ChartWidget({
  id,
  title,
  description,
  size = 'lg',
  loading = false,
  error = false,
  onRefresh,
  onRemove,
  onResize,
  chartType,
  data,
  series,
  xAxisKey = 'name',
  height = 300,
  stacked = false,
  actionLabel,
  actionLink,
}: ChartWidgetProps) {
  // Get appropriate icon based on chart type
  const getChartIcon = () => {
    switch (chartType) {
      case 'area':
      case 'line':
        return <LineChartIcon className="h-5 w-5" />;
      case 'bar':
        return <BarChart4 className="h-5 w-5" />;
      case 'pie':
        return <PieChartIcon className="h-5 w-5" />;
      default:
        return <BarChart4 className="h-5 w-5" />;
    }
  };

  // Render appropriate chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <defs>
                {series.map(s => s.gradient && (
                  <linearGradient key={s.gradient.id} id={s.gradient.id} x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={s.gradient.startColor} 
                      stopOpacity={s.gradient.startOpacity || 0.8}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={s.gradient.endColor} 
                      stopOpacity={s.gradient.endOpacity || 0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={xAxisKey} stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444', color: 'white' }} />
              <Legend />
              {series.map(s => (
                <Area 
                  key={s.dataKey}
                  type="monotone" 
                  dataKey={s.dataKey} 
                  stroke={s.color} 
                  fillOpacity={1} 
                  fill={s.gradient ? `url(#${s.gradient.id})` : s.color}
                  stackId={stacked ? "1" : undefined}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={xAxisKey} stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444', color: 'white' }} />
              <Legend />
              {series.map(s => (
                <Bar 
                  key={s.dataKey}
                  dataKey={s.dataKey} 
                  fill={s.color} 
                  stackId={stacked ? "1" : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey={xAxisKey} stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444', color: 'white' }} />
              <Legend />
              {series.map(s => (
                <Line 
                  key={s.dataKey}
                  type="monotone" 
                  dataKey={s.dataKey} 
                  stroke={s.color}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={2}
                dataKey={series[0].dataKey}
                label
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={series[index % series.length]?.color || '#8884d8'} 
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#444', color: 'white' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default:
        return <div>Unsupported chart type</div>;
    }
  };

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
      icon={getChartIcon()}
      actionLabel={actionLabel}
      actionLink={actionLink}
    >
      {renderChart()}
    </DashboardWidget>
  );
}