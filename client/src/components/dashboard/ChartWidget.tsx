import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/lib/dashboard-service';
import DashboardWidget from './DashboardWidget';
import { Widget } from '../../../shared/dashboard-schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';

// Available chart types
const CHART_TYPES = ['line', 'bar', 'area', 'pie'];

// Chart colors palette
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00C49F', '#FFBB28', '#FF8042'];

// Available data sources
const DATA_SOURCES = [
  { value: 'engagement', label: 'Engagement' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'performance', label: 'Performance' }
];

// Time range options
const TIME_RANGES = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' }
];

// Loading skeleton for charts
const ChartLoadingSkeleton = () => (
  <div className="w-full">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-24" />
    </div>
    <Skeleton className="h-64 w-full" />
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
  
  // Extract settings with defaults
  const chartSettings = widget.settings || {};
  const [chartType, setChartType] = useState(chartSettings.chartType || 'line');
  const [dataSource, setDataSource] = useState(chartSettings.dataSource || 'engagement');
  const [timeRange, setTimeRange] = useState(chartSettings.timeRange || '30d');
  
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
  
  // Get formatted data based on chart type and data source
  const formattedData = useMemo(() => {
    if (!chartData || !chartData.data) return [];
    
    // For pie chart, transform the data to work with Recharts PieChart
    if (chartType === 'pie') {
      const latestEntry = chartData.data[chartData.data.length - 1];
      if (!latestEntry) return [];
      
      return Object.keys(latestEntry)
        .filter(key => key !== 'date' && key !== chartData.xAxis)
        .map(key => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: latestEntry[key]
        }));
    }
    
    // For line, bar, and area charts, use the data as is
    return chartData.data;
  }, [chartData, chartType]);
  
  // Generate chart based on type
  const renderChart = () => {
    if (isLoading || isRefreshing) {
      return <ChartLoadingSkeleton />;
    }
    
    if (isError || !chartData) {
      return (
        <div className="p-4 text-center text-red-500 h-64 flex items-center justify-center">
          Failed to load chart data. Please try refreshing.
        </div>
      );
    }
    
    if (!formattedData || formattedData.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500 h-64 flex items-center justify-center">
          No data available for the selected chart type.
        </div>
      );
    }
    
    // Render appropriate chart based on chartType
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartData.xAxis || 'date'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {chartData.series.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
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
            <BarChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartData.xAxis || 'date'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {chartData.series.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartData.xAxis || 'date'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {chartData.series.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.6}
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
                data={formattedData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Chart type not supported.
          </div>
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
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Select 
              value={chartType} 
              onValueChange={setChartType}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={dataSource} 
              onValueChange={setDataSource}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Data Source" />
              </SelectTrigger>
              <SelectContent>
                {DATA_SOURCES.map(source => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Select 
            value={timeRange} 
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="chart-container">
          {renderChart()}
        </div>
      </div>
    </DashboardWidget>
  );
};

export default ChartWidget;