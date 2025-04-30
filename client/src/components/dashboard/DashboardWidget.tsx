import React, { useState } from 'react';
import { Widget } from '../../../shared/dashboard-schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw, X, Pencil, Check, GripVertical, Maximize, Minimize } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { updateWidget, removeWidget } from '@/lib/dashboard-service';

interface DashboardWidgetProps {
  widget: Widget;
  children: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
  isDragging?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onResize?: (size: Widget['size']) => void;
  dragHandleProps?: any;
}

const sizeMap = {
  'sm': 'col-span-1',
  'md': 'col-span-1 md:col-span-2',
  'lg': 'col-span-1 md:col-span-3',
  'xl': 'col-span-1 md:col-span-3 lg:col-span-4',
  'full': 'col-span-full',
};

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  widget,
  children,
  onRefresh,
  isLoading = false,
  isEditing = false,
  isDragging = false,
  onEdit,
  onDelete,
  onResize,
  dragHandleProps
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(widget.title);
  const [isResizing, setIsResizing] = useState(false);
  
  // Handle refresh
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    try {
      if (window.confirm(`Are you sure you want to remove the "${widget.title}" widget?`)) {
        if (onDelete) {
          onDelete();
        } else {
          await removeWidget(widget.id);
        }
      }
    } catch (error) {
      console.error('Error removing widget:', error);
    }
  };
  
  // Handle title update
  const handleTitleUpdate = async () => {
    if (newTitle !== widget.title) {
      try {
        await updateWidget(widget.id, { title: newTitle });
      } catch (error) {
        console.error('Error updating widget title:', error);
      }
    }
    setIsEditingTitle(false);
  };
  
  // Handle size update
  const handleSizeUpdate = async (size: Widget['size']) => {
    if (size !== widget.size) {
      try {
        if (onResize) {
          onResize(size);
        } else {
          await updateWidget(widget.id, { size });
        }
      } catch (error) {
        console.error('Error updating widget size:', error);
      }
    }
    setIsResizing(false);
  };
  
  return (
    <Card className={`
      h-full flex flex-col relative 
      ${isDragging ? 'ring-2 ring-primary ring-opacity-60 shadow-lg' : ''}
    `}>
      {isEditing && (
        <div 
          className="absolute top-0 left-0 h-full w-full cursor-move z-10 opacity-0"
          {...dragHandleProps}
        />
      )}
      
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        {isEditing && (
          <div className="mr-1 cursor-grab" {...dragHandleProps}>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        
        {isEditingTitle ? (
          <div className="flex-1 flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 p-1 border rounded"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleTitleUpdate}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => {
              setNewTitle(widget.title);
              setIsEditingTitle(false);
            }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {widget.title}
              {isEditing && (
                <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(true)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </CardTitle>
            {widget.description && (
              <CardDescription>{widget.description}</CardDescription>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-1">
          {onRefresh && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={handleRefresh} 
                    disabled={isLoading || isRefreshing}
                  >
                    {(isLoading || isRefreshing) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isEditing && (
            <>
              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Widget settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setIsResizing(true)}>
                    Resize
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onSelect={handleDelete}
                    className="text-red-600 focus:text-red-600"
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {isResizing && (
                <DropdownMenu open={isResizing} onOpenChange={setIsResizing}>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleSizeUpdate('sm')}>
                      Small (1x1)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleSizeUpdate('md')}>
                      Medium (2x1)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleSizeUpdate('lg')}>
                      Large (3x1)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleSizeUpdate('xl')}>
                      Extra Large (4x1)
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleSizeUpdate('full')}>
                      Full Width
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 flex-1 overflow-hidden">
        {isRefreshing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
};

export default DashboardWidget;