import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { Loader2, Crown, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

interface SubscriptionBadgeProps {
  showTooltip?: boolean;
  redirectToUpgrade?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const SubscriptionBadge = ({ 
  showTooltip = true, 
  redirectToUpgrade = false,
  size = 'default'
}: SubscriptionBadgeProps) => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Get subscription status
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['/api/subscription/status'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/subscription/status');
      if (!res.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      return res.json();
    },
    enabled: !!user,
  });
  
  // Redirect if requested and no active subscription
  useEffect(() => {
    if (redirectToUpgrade && 
        subscription && 
        subscription.status !== 'active' && 
        !isLoading) {
      navigate('/subscribe');
    }
  }, [subscription, redirectToUpgrade, navigate, isLoading]);
  
  // Formats for different sizes
  const sizeClasses = {
    sm: 'text-xs py-0 px-2',
    default: 'text-sm py-1 px-2',
    lg: 'text-base py-1.5 px-3',
  };
  
  // For empty state
  if (!user) {
    return null;
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Badge variant="outline" className={`${sizeClasses[size]} flex items-center gap-1`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Loading</span>
      </Badge>
    );
  }
  
  // No subscription
  if (!subscription || subscription.status === 'none') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`${sizeClasses[size]} cursor-pointer`}
              onClick={() => redirectToUpgrade && navigate('/subscribe')}
            >
              Free Plan
            </Badge>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent side="bottom">
              <p>Upgrade to access premium features</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Active subscription
  if (subscription.status === 'active') {
    const expirationDate = subscription.currentPeriodEnd ? 
      new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString() : 
      'Unknown';
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="default" 
              className={`${sizeClasses[size]} flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-600 hover:to-amber-400 cursor-default`}
            >
              <Crown className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} text-amber-100`} />
              <span>{subscription.plan || 'Premium'}</span>
            </Badge>
          </TooltipTrigger>
          {showTooltip && (
            <TooltipContent side="bottom">
              <p className="text-sm font-medium">
                {subscription.cancelAtPeriodEnd ? 
                  `Your subscription will end on ${expirationDate}` : 
                  `Your subscription renews on ${expirationDate}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Manage in account settings
              </p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Other subscription states (past_due, canceled, etc.)
  const getStatusInfo = () => {
    switch (subscription.status) {
      case 'past_due':
        return {
          label: 'Payment Due',
          tooltip: 'Your payment is past due. Please update your payment method.',
          variant: 'destructive' as const,
          icon: <AlertCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />,
        };
      case 'canceled':
        return {
          label: 'Canceled',
          tooltip: `Your subscription has been canceled and will end on ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}`,
          variant: 'outline' as const,
          icon: null,
        };
      case 'unpaid':
        return {
          label: 'Unpaid',
          tooltip: 'Your subscription is unpaid. Please update your payment method.',
          variant: 'destructive' as const,
          icon: <AlertCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />,
        };
      case 'incomplete':
      case 'incomplete_expired':
        return {
          label: 'Incomplete',
          tooltip: 'Your subscription setup is incomplete. Please complete the payment process.',
          variant: 'outline' as const,
          icon: <AlertCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />,
        };
      default:
        return {
          label: subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1) || 'Unknown',
          tooltip: 'Your subscription status is unknown. Please contact support.',
          variant: 'outline' as const,
          icon: null,
        };
    }
  };
  
  const { label, tooltip, variant, icon } = getStatusInfo();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={variant} 
            className={`${sizeClasses[size]} flex items-center gap-1 cursor-pointer`}
            onClick={() => navigate('/account/subscription')}
          >
            {icon}
            <span>{label}</span>
          </Badge>
        </TooltipTrigger>
        {showTooltip && (
          <TooltipContent side="bottom">
            <p>{tooltip}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default SubscriptionBadge;