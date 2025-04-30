import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Grip, X, ArrowUpRight, ExternalLink, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';

export type WidgetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface DashboardWidgetProps {
  id: string;
  title: string;
  description?: string;
  size?: WidgetSize;
  icon?: React.ReactNode;
  draggable?: boolean;
  loading?: boolean;
  error?: boolean;
  onRefresh?: () => void;
  onRemove?: () => void;
  onResize?: (size: WidgetSize) => void;
  actionLabel?: string;
  actionLink?: string;
  actionIcon?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  children: React.ReactNode;
}

export function DashboardWidget({
  id,
  title,
  description,
  size = 'md',
  icon,
  draggable = true,
  loading = false,
  error = false,
  onRefresh,
  onRemove,
  onResize,
  actionLabel,
  actionLink,
  actionIcon = <ArrowUpRight className="h-4 w-4" />,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  children,
}: DashboardWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      
      // Call the refresh handler
      Promise.resolve(onRefresh())
        .finally(() => {
          setTimeout(() => setIsRefreshing(false), 500); // Add minimum refresh time for better UX
        });
    }
  };

  // Map size to column span class
  const sizeToClass = {
    sm: 'col-span-1',
    md: 'col-span-1 md:col-span-4',
    lg: 'col-span-1 md:col-span-6',
    xl: 'col-span-1 md:col-span-8',
    full: 'col-span-full',
  };

  return (
    <Card 
      className={cn(
        "bg-zinc-900/40 backdrop-blur-sm border border-zinc-800 shadow-lg hover:shadow-amber-500/5 transition-all duration-300",
        sizeToClass[size],
        className
      )}
      id={`widget-${id}`}
    >
      <CardHeader className={cn("flex flex-row items-center justify-between pb-2", headerClassName)}>
        <div className="flex items-center gap-2">
          {draggable && (
            <span className="cursor-move text-gray-500 hover:text-gray-300">
              <Grip className="h-4 w-4" />
            </span>
          )}
          {icon && <span className="text-amber-500">{icon}</span>}
          <div>
            <CardTitle className="text-white font-heading">{title}</CardTitle>
            {description && (
              <CardDescription className="text-gray-400">{description}</CardDescription>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border border-zinc-700 text-white">
            <DropdownMenuLabel>Widget Options</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-700" />
            
            {onRefresh && (
              <DropdownMenuItem 
                onClick={handleRefresh}
                className="text-gray-200 hover:text-white focus:text-white cursor-pointer"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </DropdownMenuItem>
            )}
            
            {onResize && (
              <>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuLabel>Resize</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => onResize('sm')}
                  className="text-gray-200 hover:text-white focus:text-white cursor-pointer"
                >
                  Small
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onResize('md')}
                  className="text-gray-200 hover:text-white focus:text-white cursor-pointer"
                >
                  Medium
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onResize('lg')}
                  className="text-gray-200 hover:text-white focus:text-white cursor-pointer"
                >
                  Large
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onResize('full')}
                  className="text-gray-200 hover:text-white focus:text-white cursor-pointer"
                >
                  Full Width
                </DropdownMenuItem>
              </>
            )}
            
            {onRemove && (
              <>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem 
                  onClick={onRemove}
                  className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove Widget
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className={cn("", contentClassName)}>
        {loading || isRefreshing ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-zinc-800" />
            <Skeleton className="h-4 w-5/6 bg-zinc-800" />
            <Skeleton className="h-4 w-3/4 bg-zinc-800" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-red-400/10 p-3 text-red-400 mb-4">
              <X className="h-6 w-6" />
            </div>
            <p className="mb-2 text-sm text-red-400">Failed to load widget data</p>
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="mt-2 border-zinc-700 hover:border-red-400 bg-zinc-800/50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>

      {actionLabel && actionLink && (
        <CardFooter className={cn("pt-0", footerClassName)}>
          <Button 
            variant="link" 
            asChild 
            className="px-0 text-amber-500 hover:text-amber-400"
          >
            <a href={actionLink} target="_blank" rel="noopener noreferrer">
              {actionLabel}
              {actionIcon}
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}