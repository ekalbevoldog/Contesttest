import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Widget } from '../../../shared/dashboard-schema';
import { 
  MoreHorizontal, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  X, 
  Edit, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { updateWidget, removeWidget } from '@/lib/dashboard-service';
import { useToast } from '@/hooks/use-toast';

interface DashboardWidgetProps {
  widget: Widget;
  children: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

// Helper function to get column span based on widget size
const getSizeClass = (size: string): string => {
  switch (size) {
    case 'sm':
      return 'col-span-12 sm:col-span-6 lg:col-span-3';
    case 'md':
      return 'col-span-12 sm:col-span-6';
    case 'lg':
      return 'col-span-12 lg:col-span-8';
    case 'xl':
      return 'col-span-12 lg:col-span-9';
    case 'full':
      return 'col-span-12';
    default:
      return 'col-span-12 sm:col-span-6';
  }
};

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ 
  widget, 
  children, 
  onRefresh, 
  isLoading = false,
  isEditing = false
}) => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [widgetTitle, setWidgetTitle] = useState(widget.title);
  const [widgetDescription, setWidgetDescription] = useState(widget.description || '');
  const [isVisible, setIsVisible] = useState(widget.visible);
  const [size, setSize] = useState(widget.size);
  
  // Get column span class based on widget size
  const sizeClass = getSizeClass(size);
  
  // Handle refresh click
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };
  
  // Handle size toggle
  const handleSizeChange = async (newSize: 'sm' | 'md' | 'lg' | 'xl' | 'full') => {
    setSize(newSize);
    
    if (isEditing) {
      try {
        await updateWidget(widget.id, { size: newSize });
      } catch (error) {
        console.error('Failed to update widget size:', error);
        toast({
          title: 'Failed to update widget size',
          description: 'There was an error saving your changes.',
          variant: 'destructive',
        });
      }
    }
  };
  
  // Handle visibility toggle
  const handleVisibilityToggle = async () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    
    if (isEditing) {
      try {
        await updateWidget(widget.id, { visible: newVisibility });
        toast({
          title: newVisibility ? 'Widget visible' : 'Widget hidden',
          description: newVisibility ? 'Widget is now visible on the dashboard.' : 'Widget is now hidden from the dashboard.',
        });
      } catch (error) {
        console.error('Failed to update widget visibility:', error);
        toast({
          title: 'Failed to update widget visibility',
          description: 'There was an error saving your changes.',
          variant: 'destructive',
        });
        // Revert state change on error
        setIsVisible(!newVisibility);
      }
    }
  };
  
  // Handle widget removal
  const handleRemoveWidget = async () => {
    try {
      await removeWidget(widget.id);
      toast({
        title: 'Widget removed',
        description: 'The widget has been removed from your dashboard.',
      });
    } catch (error) {
      console.error('Failed to remove widget:', error);
      toast({
        title: 'Failed to remove widget',
        description: 'There was an error removing the widget.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle widget settings save
  const handleSaveSettings = async () => {
    try {
      await updateWidget(widget.id, {
        title: widgetTitle,
        description: widgetDescription || undefined
      });
      
      toast({
        title: 'Settings saved',
        description: 'Widget settings have been updated successfully.',
      });
      
      setOpenSettingsDialog(false);
    } catch (error) {
      console.error('Failed to save widget settings:', error);
      toast({
        title: 'Failed to save settings',
        description: 'There was an error saving your changes.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className={sizeClass}>
      <Card 
        className={`h-full transition-all duration-200 ${isEditing ? 'border-dashed border-2' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{widget.title}</CardTitle>
              {widget.description && <CardDescription>{widget.description}</CardDescription>}
            </div>
            
            <div className="flex items-center space-x-2">
              {(isHovered || isEditing) && !isLoading && onRefresh && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Widget Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => setOpenSettingsDialog(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Settings
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuLabel>Widget Size</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleSizeChange('sm')}>
                      <Minimize2 className="h-4 w-4 mr-2" />
                      Small
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSizeChange('md')}>
                      <Minimize2 className="h-4 w-4 mr-2" />
                      Medium
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSizeChange('lg')}>
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Large
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSizeChange('full')}>
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Full Width
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleVisibilityToggle}>
                      {isVisible ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Widget
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Show Widget
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={handleRemoveWidget}
                      className="text-red-600 focus:text-red-500"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Widget
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {children}
        </CardContent>
      </Card>
      
      {/* Widget Settings Dialog */}
      <Dialog open={openSettingsDialog} onOpenChange={setOpenSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Widget Settings</DialogTitle>
            <DialogDescription>
              Customize how this widget appears on your dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={widgetTitle}
                onChange={(e) => setWidgetTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={widgetDescription}
                onChange={(e) => setWidgetDescription(e.target.value)}
                className="col-span-3"
                placeholder="Optional widget description"
              />
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveSettings}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardWidget;