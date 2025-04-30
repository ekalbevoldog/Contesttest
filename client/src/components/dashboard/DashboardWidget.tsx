import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, X, Maximize2, Minimize2 } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Widget, WidgetSize } from '../../../shared/dashboard-schema';
import { updateWidget, removeWidget } from '@/lib/dashboard-service';

// Size classes for different widget sizes
const sizeClasses: Record<WidgetSize, string> = {
  'sm': 'col-span-1 md:col-span-3',
  'md': 'col-span-1 md:col-span-4',
  'lg': 'col-span-1 md:col-span-6',
  'xl': 'col-span-1 md:col-span-8',
  'full': 'col-span-12',
};

// Height classes for different widget sizes
const heightClasses: Record<WidgetSize, string> = {
  'sm': 'h-64',
  'md': 'h-64',
  'lg': 'h-72',
  'xl': 'h-80',
  'full': 'h-auto',
};

export interface DashboardWidgetProps {
  widget: Widget;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  onResize?: (size: WidgetSize) => void;
  onRemove?: () => void;
  footerContent?: ReactNode;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  children,
  className,
  isLoading = false,
  onRefresh,
  onResize,
  onRemove,
  footerContent
}) => {
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

  const handleResize = async (newSize: WidgetSize) => {
    if (onResize) {
      onResize(newSize);
    } else {
      try {
        await updateWidget(widget.id, { size: newSize });
      } catch (error) {
        console.error(`Error resizing widget ${widget.id}:`, error);
      }
    }
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // Only show the appropriate resize options for the current size
  const getSizeOptions = () => {
    switch (widget.size) {
      case 'sm':
        return [
          { size: 'md' as WidgetSize, label: 'Medium' },
          { size: 'lg' as WidgetSize, label: 'Large' }
        ];
      case 'md':
        return [
          { size: 'sm' as WidgetSize, label: 'Small' },
          { size: 'lg' as WidgetSize, label: 'Large' }
        ];
      case 'lg':
        return [
          { size: 'sm' as WidgetSize, label: 'Small' },
          { size: 'md' as WidgetSize, label: 'Medium' },
          { size: 'xl' as WidgetSize, label: 'Extra Large' }
        ];
      case 'xl':
        return [
          { size: 'lg' as WidgetSize, label: 'Large' },
          { size: 'full' as WidgetSize, label: 'Full Width' }
        ];
      case 'full':
        return [
          { size: 'lg' as WidgetSize, label: 'Large' },
          { size: 'xl' as WidgetSize, label: 'Extra Large' }
        ];
      default:
        return [];
    }
  };

  return (
    <Card className={cn(
      'shadow-md transition-all duration-200 backdrop-blur-sm bg-black/50 border-zinc-800 text-white',
      sizeClasses[widget.size],
      heightClasses[widget.size],
      isLoading && 'opacity-70 animate-pulse',
      className
    )}>
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">{widget.title}</CardTitle>
          {widget.description && (
            <CardDescription className="text-xs text-zinc-400">{widget.description}</CardDescription>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-700">
            {onRefresh && (
              <DropdownMenuItem onClick={handleRefresh} className="cursor-pointer hover:bg-zinc-800">
                Refresh
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem className="p-0 hover:bg-transparent">
              <div className="text-xs text-zinc-400 px-2 py-1 w-full">Resize</div>
            </DropdownMenuItem>
            
            {getSizeOptions().map((option) => (
              <DropdownMenuItem 
                key={option.size} 
                onClick={() => handleResize(option.size)}
                className="cursor-pointer hover:bg-zinc-800 pl-4"
              >
                {option.size === 'sm' && <Minimize2 className="h-3 w-3 mr-2" />}
                {option.size === 'full' && <Maximize2 className="h-3 w-3 mr-2" />}
                {option.label}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuItem 
              onClick={handleRemove} 
              className="text-red-400 cursor-pointer hover:bg-red-950 hover:text-red-300"
            >
              <X className="h-4 w-4 mr-2" />
              Remove Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className={cn(
        'p-4 pb-0',
        widget.size === 'full' ? 'max-h-96 overflow-y-auto' : 'overflow-hidden'
      )}>
        {children}
      </CardContent>
      {footerContent && (
        <CardFooter className="p-4 pt-2">
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
};

export default DashboardWidget;