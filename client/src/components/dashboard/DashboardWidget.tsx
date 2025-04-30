import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, X, MoreVertical, Info } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Widget, WidgetSize } from '../../../shared/dashboard-schema';
import { removeWidget, updateWidget } from '@/lib/dashboard-service';

// Map widget size to Tailwind column span classes
const sizeToColumnSpan = (size: WidgetSize): string => {
  switch (size) {
    case 'sm': return 'col-span-3'; // 3/12 = 1/4 of the grid
    case 'md': return 'col-span-4'; // 4/12 = 1/3 of the grid
    case 'lg': return 'col-span-6'; // 6/12 = 1/2 of the grid
    case 'xl': return 'col-span-8'; // 8/12 = 2/3 of the grid
    case 'full': return 'col-span-12'; // 12/12 = full width
    default: return 'col-span-4';
  }
};

interface DashboardWidgetProps {
  widget: Widget;
  children: ReactNode;
  isLoading?: boolean;
  onRefresh?: () => void;
  onRemove?: () => void;
  isEditing?: boolean;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  children,
  isLoading = false,
  onRefresh,
  onRemove,
  isEditing = false
}) => {
  // Handle widget removal
  const handleRemove = async () => {
    if (onRemove) {
      onRemove();
    } else {
      try {
        await removeWidget(widget.id);
      } catch (error) {
        console.error(`Error removing widget ${widget.id}:`, error);
      }
    }
  };
  
  // Handle size change
  const handleSizeChange = async (newSize: WidgetSize) => {
    try {
      await updateWidget(widget.id, { size: newSize });
    } catch (error) {
      console.error(`Error updating widget ${widget.id} size:`, error);
    }
  };
  
  return (
    <div className={`${sizeToColumnSpan(widget.size)} transition-all duration-300`}>
      <Card className="overflow-hidden h-full shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-4 px-4 flex flex-row justify-between items-start">
          <div>
            <div className="flex items-center">
              <CardTitle className="text-lg font-semibold">{widget.title}</CardTitle>
              {widget.description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="ml-2 h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{widget.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {widget.description && <CardDescription className="text-xs mt-1">{widget.description}</CardDescription>}
          </div>
          
          <div className="flex items-center">
            {onRefresh && (
              <Button
                variant="ghost" 
                size="icon" 
                onClick={onRefresh}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            
            {isEditing && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSizeChange('sm')}>
                      Small Size
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSizeChange('md')}>
                      Medium Size
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSizeChange('lg')}>
                      Large Size
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSizeChange('xl')}>
                      Extra Large Size
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSizeChange('full')}>
                      Full Width
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant="ghost" 
                  size="icon" 
                  onClick={handleRemove}
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardWidget;