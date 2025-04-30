import React from 'react';
import { DashboardWidget, WidgetSize } from './DashboardWidget';
import { LucideIcon, Zap, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  color?: string;
  variant?: 'default' | 'outline' | 'ghost';
  disabled?: boolean;
}

export interface QuickActionsWidgetProps {
  id: string;
  title: string;
  description?: string;
  size?: WidgetSize;
  loading?: boolean;
  error?: boolean;
  onRefresh?: () => void;
  onRemove?: () => void;
  onResize?: (size: WidgetSize) => void;
  actions: QuickAction[];
  columns?: 1 | 2 | 3 | 4;
  layout?: 'grid' | 'list';
  actionLabel?: string;
  actionLink?: string;
}

export function QuickActionsWidget({
  id,
  title,
  description,
  size = 'md',
  loading = false,
  error = false,
  onRefresh,
  onRemove,
  onResize,
  actions,
  columns = 2,
  layout = 'grid',
  actionLabel,
  actionLink,
}: QuickActionsWidgetProps) {
  const renderGridLayout = () => (
    <div className={`grid grid-cols-1 ${
      columns === 1 ? 'md:grid-cols-1' : 
      columns === 3 ? 'md:grid-cols-3' : 
      columns === 4 ? 'md:grid-cols-4' : 
      'md:grid-cols-2'
    } gap-4`}>
      {actions.map(action => (
        <Button
          key={action.id}
          variant={action.variant || "outline"}
          className={cn(
            "h-auto flex flex-col items-center justify-center p-4 space-y-2 border border-zinc-800 bg-black/40 hover:bg-black/60 text-white",
            action.disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={action.onClick}
          asChild={!!action.href}
          disabled={action.disabled}
        >
          {action.href ? (
            <a href={action.href}>
              <div className={cn(
                "p-2 rounded-full mb-2",
                action.color ? `bg-${action.color}-900/20 text-${action.color}-500` : "bg-amber-900/20 text-amber-500"
              )}>
                {action.icon || <Zap className="h-5 w-5" />}
              </div>
              <span className="font-medium">{action.label}</span>
              {action.description && (
                <span className="text-xs text-gray-400 text-center">{action.description}</span>
              )}
            </a>
          ) : (
            <>
              <div className={cn(
                "p-2 rounded-full mb-2",
                action.color ? `bg-${action.color}-900/20 text-${action.color}-500` : "bg-amber-900/20 text-amber-500"
              )}>
                {action.icon || <Zap className="h-5 w-5" />}
              </div>
              <span className="font-medium">{action.label}</span>
              {action.description && (
                <span className="text-xs text-gray-400 text-center">{action.description}</span>
              )}
            </>
          )}
        </Button>
      ))}
    </div>
  );

  const renderListLayout = () => (
    <div className="space-y-2">
      {actions.map(action => (
        <Button
          key={action.id}
          variant={action.variant || "ghost"}
          className={cn(
            "w-full justify-start border border-zinc-800 bg-black/20 hover:bg-black/40 text-white h-auto py-3",
            action.disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={action.onClick}
          asChild={!!action.href}
          disabled={action.disabled}
        >
          {action.href ? (
            <a href={action.href} className="flex items-center">
              <div className={cn(
                "p-1.5 rounded-full mr-3",
                action.color ? `bg-${action.color}-900/20 text-${action.color}-500` : "bg-amber-900/20 text-amber-500"
              )}>
                {action.icon || <Zap className="h-4 w-4" />}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">{action.label}</span>
                {action.description && (
                  <span className="text-xs text-gray-400">{action.description}</span>
                )}
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-500" />
            </a>
          ) : (
            <>
              <div className={cn(
                "p-1.5 rounded-full mr-3",
                action.color ? `bg-${action.color}-900/20 text-${action.color}-500` : "bg-amber-900/20 text-amber-500"
              )}>
                {action.icon || <Zap className="h-4 w-4" />}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">{action.label}</span>
                {action.description && (
                  <span className="text-xs text-gray-400">{action.description}</span>
                )}
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-500" />
            </>
          )}
        </Button>
      ))}
    </div>
  );

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
      icon={<Zap className="h-5 w-5" />}
      actionLabel={actionLabel}
      actionLink={actionLink}
    >
      {layout === 'grid' ? renderGridLayout() : renderListLayout()}
    </DashboardWidget>
  );
}