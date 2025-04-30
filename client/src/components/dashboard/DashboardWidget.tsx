import { useState } from 'react';
import { Widget } from '@shared/dashboard-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Maximize2, Minimize2, X } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import StatsWidget from './StatsWidget';
import ChartWidget from './ChartWidget';
import ActivityWidget from './ActivityWidget';
import QuickActionsWidget from './QuickActionsWidget';
import { updateWidget, removeWidget } from '@/lib/dashboard-service';

interface DashboardWidgetProps {
  widget: Widget;
  isEditing?: boolean;
  onEdit?: (widget: Widget) => void;
  onRemove?: (widgetId: string) => void;
  onSizeChange?: (widgetId: string, newSize: Widget['size']) => void;
}

const sizeMap = {
  'sm': 'col-span-1 row-span-1',
  'md': 'col-span-2 row-span-1',
  'lg': 'col-span-2 row-span-2',
  'xl': 'col-span-3 row-span-2',
  'full': 'col-span-4 row-span-2'
};

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  isEditing = false,
  onEdit,
  onRemove,
  onSizeChange
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove this widget?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await removeWidget(widget.id);
      if (onRemove) {
        onRemove(widget.id);
      }
    } catch (error) {
      console.error('Error removing widget:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSizeChange = async (newSize: Widget['size']) => {
    try {
      await updateWidget(widget.id, { size: newSize });
      if (onSizeChange) {
        onSizeChange(widget.id, newSize);
      }
    } catch (error) {
      console.error('Error updating widget size:', error);
    }
  };
  
  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Get the appropriate size class based on widget size and expanded state
  const getSizeClass = () => {
    if (isExpanded) {
      return 'col-span-4 row-span-3 z-50';
    }
    return sizeMap[widget.size];
  };
  
  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'stats':
        return <StatsWidget widgetId={widget.id} />;
      case 'chart':
        return <ChartWidget widgetId={widget.id} settings={widget.settings} />;
      case 'activity':
        return <ActivityWidget widgetId={widget.id} />;
      case 'quickActions':
        return <QuickActionsWidget widgetId={widget.id} />;
      default:
        return <div>Unknown widget type</div>;
    }
  };
  
  return (
    <Card 
      className={`${getSizeClass()} transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'fixed top-12 left-0 right-0 m-auto h-[80vh] w-[90vw] max-w-6xl' : 'relative'}`}
    >
      <CardHeader className="px-4 py-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-md font-medium">{widget.title}</CardTitle>
        <div className="flex items-center space-x-1">
          {isEditing && (
            <Button variant="ghost" size="icon" onClick={handleExpand}>
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(widget)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!isEditing} onClick={() => handleSizeChange('sm')}>
                Small Size
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isEditing} onClick={() => handleSizeChange('md')}>
                Medium Size
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isEditing} onClick={() => handleSizeChange('lg')}>
                Large Size
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isEditing} onClick={() => handleSizeChange('xl')}>
                Extra Large Size
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isEditing} onClick={() => handleSizeChange('full')}>
                Full Width
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                disabled={!isEditing || isLoading} 
                onClick={handleRemove}
                className="text-red-500"
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isExpanded && (
            <Button variant="ghost" size="icon" onClick={handleExpand}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 h-[calc(100%-2.5rem)] overflow-y-auto">
        {renderWidgetContent()}
      </CardContent>
    </Card>
  );
};

export default DashboardWidget;