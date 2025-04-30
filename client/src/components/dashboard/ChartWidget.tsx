import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget } from '../../../shared/dashboard-schema';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Chart types
type ChartType = 'line' | 'bar' | 'pie';

// Colors for chart elements
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ChartLoadingSkeleton = () => (
  <div className="w-full h-64">
    <Skeleton className="w-full h-full rounded-md" />
  </div>
);

interface ChartControlsProps {
  chartType: ChartType;
  timeRange?: string;
  onChartTypeChange: (type: ChartType) => void;
  onTimeRangeChange?: (range: string) => void;
  dataSource?: string;
  availableDataSources?: string[];
  onDataSourceChange?: (source: string) => void;
  showControls: boolean;
}

const ChartControls: React.FC<ChartControlsProps> = ({
  chartType,
  timeRange,
  onChartTypeChange,
  onTimeRangeChange,
  dataSource,
  availableDataSources,
  onDataSourceChange,
  showControls
}) => {
  if (!showControls) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Select value={chartType} onValueChange={(value) => onChartTypeChange(value as ChartType)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Chart Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="line">Line Chart</SelectItem>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="pie">Pie Chart</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      
      {timeRange && onTimeRangeChange && (
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
      
      {dataSource && onDataSourceChange && availableDataSources && (
        <Select value={dataSource} onValueChange={onDataSourceChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Data Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {availableDataSources.map(source => (
                <SelectItem key={source} value={source}>
                  {source.charAt(0).toUpperCase() + source.slice(1)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

interface ChartWidgetProps {
  widget: Widget;
  onRefresh?: () => void;
  isEditing?: boolean;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ widget, onRefresh, isEditing = false }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get chart settings from widget or defaults
  const dataSource = widget.settings?.dataSource || 'default';
  const [chartType, setChartType] = useState<ChartType>(widget.settings?.chartType || 'line');
  const [timeRange, setTimeRange] = useState<string>(widget.settings?.timeRange || '30d');
  
  // Fetch chart data using TanStack Query
  const { 
    data: chartData, 
    isLoading,
    isError,
    refetch
  } = useQuery(dashboardQueryOptions.chartData(dataSource));
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    if (onRefresh) onRefresh();
  };
  
  // Available data sources based on user role
  const availableDataSources = widget.settings?.availableDataSources || [
    'engagement', 'campaigns', 'revenue', 'performance'
  ];
  
  // Handle chart type change
  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };
  
  // Handle data source change
  const handleDataSourceChange = (source: string) => {
    // This would need to re-fetch data with the new source
    console.log('Changing data source to:', source);
  };
  
  // Render appropriate chart based on type
  const renderChart = () => {
    if (!chartData || !chartData.data || chartData.data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available for the selected chart.
        </div>
      );
    }
    
    const { data, series } = chartData;
    
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartData.xAxis || 'date'} />
              <YAxis />
              <Tooltip />
              {widget.settings?.showLegend && <Legend />}
              {series.map((seriesKey, index) => (
                <Line 
                  key={seriesKey}
                  type="monotone" 
                  dataKey={seriesKey} 
                  stroke={COLORS[index % COLORS.length]} 
                  activeDot={{ r: 8 }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartData.xAxis || 'date'} />
              <YAxis />
              <Tooltip />
              {widget.settings?.showLegend && <Legend />}
              {series.map((seriesKey, index) => (
                <Bar 
                  key={seriesKey}
                  dataKey={seriesKey} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        // For pie chart, transform the data
        const pieData = series.map((seriesKey, index) => {
          // Sum up values for this series across all data points
          const value = data.reduce((sum, item) => sum + (Number(item[seriesKey]) || 0), 0);
          return { name: seriesKey, value };
        });
        
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              {widget.settings?.showLegend && <Legend />}
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <DashboardWidget 
      widget={widget} 
      onRefresh={handleRefresh}
      isLoading={isLoading || isRefreshing}
      isEditing={isEditing}
    >
      <ChartControls 
        chartType={chartType}
        timeRange={timeRange}
        onChartTypeChange={handleChartTypeChange}
        onTimeRangeChange={handleTimeRangeChange}
        dataSource={dataSource}
        availableDataSources={availableDataSources}
        onDataSourceChange={handleDataSourceChange}
        showControls={Boolean(widget.settings?.showControls)}
      />
      
      {isLoading || isRefreshing ? (
        <ChartLoadingSkeleton />
      ) : isError ? (
        <div className="p-4 text-center text-red-500">
          Failed to load chart data. Please try refreshing.
        </div>
      ) : (
        renderChart()
      )}
    </DashboardWidget>
  );
};

export default ChartWidget;