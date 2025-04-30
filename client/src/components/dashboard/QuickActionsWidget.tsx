import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import DashboardWidget from './DashboardWidget';
import * as LucideIcons from 'lucide-react';
import type { 
  QuickActionsWidget as QuickActionsWidgetType, 
  QuickActionsData 
} from '../../../shared/dashboard-schema';
import { fetchQuickActionsData } from '@/lib/dashboard-service';

interface QuickActionsWidgetProps {
  widget: QuickActionsWidgetType;
  className?: string;
}

// Dynamic icon component
const DynamicIcon: React.FC<{ iconName: string, className?: string }> = ({ iconName, className }) => {
  // @ts-ignore - Using dynamic import from lucide-react
  const LucideIcon = LucideIcons[iconName] || LucideIcons.Sparkles;
  return <LucideIcon className={className || "h-5 w-5"} />;
};

// Loading skeleton for quick actions
const QuickActionsSkeletonLoader: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 border border-gray-800">
          <Skeleton className="h-8 w-8 rounded-md bg-gray-700" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-24 bg-gray-700" />
            <Skeleton className="h-3 w-32 bg-gray-700" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md bg-gray-700" />
        </div>
      ))}
    </div>
  );
};

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ widget, className }) => {
  // Fetch quick actions data from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/dashboard/data/quickActions'],
    queryFn: fetchQuickActionsData,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // When there's an error, display a message
  if (error) {
    return (
      <DashboardWidget widget={widget} className={className} onRefresh={() => refetch()}>
        <div className="h-full flex items-center justify-center text-red-400 text-sm">
          Error loading quick actions: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </DashboardWidget>
    );
  }

  return (
    <DashboardWidget widget={widget} className={className} isLoading={isLoading} onRefresh={() => refetch()}>
      <div className="pb-4">
        {isLoading ? (
          <QuickActionsSkeletonLoader />
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {data.map((action) => (
              <Card 
                key={action.id} 
                className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 
                  transition-colors cursor-pointer border-gray-800"
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 p-2 rounded-md bg-${action.color || 'indigo'}-500/20 
                    text-${action.color || 'indigo'}-500`}
                  >
                    {action.icon ? (
                      <DynamicIcon iconName={action.icon} />
                    ) : (
                      <LucideIcons.Sparkles className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{action.label}</h4>
                    {action.description && (
                      <p className="text-xs text-gray-400">{action.description}</p>
                    )}
                  </div>
                </div>
                {action.link ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                    asChild
                  >
                    <Link to={action.link}>
                      <ArrowRight className="h-4 w-4" />
                      <span className="sr-only">Go to {action.label}</span>
                    </Link>
                  </Button>
                ) : action.action ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800"
                    // Action would be implemented via a custom callback handler in a real application
                    onClick={() => console.log(`Action triggered: ${action.action}`)}
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">Execute {action.label}</span>
                  </Button>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No quick actions available
          </div>
        )}
      </div>
    </DashboardWidget>
  );
};

export default QuickActionsWidget;