import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget } from '../../../shared/dashboard-schema';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Loading skeleton for chart
const ChartLoadingSkeleton = () => (
  <div className="w-full h-[300px] flex items-center justify-center">
    <Skeleton className="h-[250px] w-full rounded-md" />
  </div>
);

interface ChartWidgetProps {
  widget: Widget;
  onRefresh?: () => void;
  isEditing?: boolean;
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ 
  widget, 
  onRefresh,
  isEditing = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartType, setChartType] = useState<string>(
    widget.settings?.chartType || 'line'
  );
  
  // Get data source from widget settings or use default
  const dataSource = widget.settings?.dataSource || 'default';
  
  // Fetch chart data
  const { 
    data: chartData, 
    isLoading,
    isError,
    refetch
  } = useQuery(dashboardQueryOptions.chartData(dataSource));
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    if (onRefresh) onRefresh();
  };
  
  // Function to determine chart colors
  const getChartColors = () => {
    // Use custom colors from widget settings, or fallback to defaults
    return widget.settings?.colors || ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];
  };

  // Function to render the appropriate chart based on selected type
  const renderChart = () => {
    if (!chartData || !chartData.data || !chartData.data.length) {
      return <div className="text-center text-gray-500 h-[300px] flex items-center justify-center">No data available</div>;
    }
    
    const colors = getChartColors();
    
    switch (chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={chartData.data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartData.xAxis} 
                stroke="#888888"
                fontSize={12}
              />
              <YAxis 
                stroke="#888888"
                fontSize={12}
              />
              <Tooltip />
              <Legend />
              {chartData.series.map((series, index) => (
                <Area
                  key={series}
                  type="monotone"
                  dataKey={series}
                  fill={colors[index % colors.length]}
                  stroke={colors[index % colors.length]}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData.data}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartData.xAxis} 
                stroke="#888888"
                fontSize={12}
              />
              <YAxis 
                stroke="#888888"
                fontSize={12}
              />
              <Tooltip />
              <Legend />
              {chartData.series.map((series, index) => (
                <Bar 
                  key={series} 
                  dataKey={series} 
                  fill={colors[index % colors.length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData.data}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartData.xAxis} 
                stroke="#888888"
                fontSize={12}
              />
              <YAxis 
                stroke="#888888"
                fontSize={12}
              />
              <Tooltip />
              <Legend />
              {chartData.series.map((series, index) => (
                <Line
                  key={series}
                  type="monotone"
                  dataKey={series}
                  stroke={colors[index % colors.length]}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };
  
  return (
    <DashboardWidget 
      widget={widget} 
      onRefresh={handleRefresh}
      isLoading={isLoading || isRefreshing}
      isEditing={isEditing}
    >
      {isEditing && (
        <div className="mb-4">
          <Select
            value={chartType}
            onValueChange={(value) => setChartType(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="area">Area Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {isLoading || isRefreshing ? (
        <ChartLoadingSkeleton />
      ) : isError ? (
        <div className="p-4 text-center text-red-500 h-[300px] flex items-center justify-center">
          Failed to load chart data. Please try refreshing.
        </div>
      ) : (
        renderChart()
      )}
    </DashboardWidget>
  );
};

export default ChartWidget;