import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { apiRequest } from '@/lib/queryClient';
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SubscriptionBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  redirectToUpgrade?: boolean;
}

export default function SubscriptionBadge({ 
  size = 'sm', 
  showTooltip = false, 
  redirectToUpgrade = true 
}: SubscriptionBadgeProps) {
  const [, navigate] = useLocation();
  const { user } = useSupabaseAuth();
  const [status, setStatus] = useState<'loading' | 'active' | 'free' | 'error'>('loading');
  const [planName, setPlanName] = useState<string>('');
  
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setStatus('free');
        return;
      }
      
      try {
        const response = await apiRequest('GET', '/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          
          if (data.subscription && data.subscription.status === 'active') {
            setStatus('active');
            setPlanName(data.subscription.plan || 'Premium');
          } else {
            setStatus('free');
          }
        } else {
          // Fallback to checking user data directly if API fails
          if (user.subscription_status === 'active') {
            setStatus('active');
            setPlanName(user.subscription_plan || 'Premium');
          } else {
            setStatus('free');
          }
        }
      } catch (error) {
        console.error('Failed to fetch subscription status:', error);
        
        // Last resort fallback to user object if available
        if (user && user.subscription_status === 'active') {
          setStatus('active');
          setPlanName(user.subscription_plan || 'Premium');
        } else {
          setStatus('free');
        }
      }
    };
    
    checkSubscription();
  }, [user]);
  
  const handleClick = () => {
    if (redirectToUpgrade && status === 'free') {
      navigate('/account/subscription');
    }
  };
  
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-2.5',
    lg: 'text-base py-1.5 px-3'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  if (status === 'loading') {
    return (
      <Badge 
        variant="outline" 
        className={`bg-transparent border-transparent ${sizeClasses[size]}`}
      >
        <span className="animate-pulse bg-neutral-800 h-4 w-16 rounded"></span>
      </Badge>
    );
  }
  
  if (status === 'active') {
    const badge = (
      <Badge 
        variant="default" 
        className={`bg-gradient-to-r from-amber-500 to-yellow-300 hover:from-amber-600 hover:to-yellow-400 text-black cursor-pointer ${sizeClasses[size]}`}
        onClick={handleClick}
      >
        <Crown className={`${iconSizes[size]} mr-1`} />
        {planName}
      </Badge>
    );
    
    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {badge}
            </TooltipTrigger>
            <TooltipContent>
              <p>You have an active {planName} subscription</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return badge;
  }
  
  // Free plan badge
  const freeBadge = (
    <Badge 
      variant="outline" 
      className={`hover:bg-primary/10 cursor-pointer ${sizeClasses[size]}`}
      onClick={handleClick}
    >
      Free Plan
    </Badge>
  );
  
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {freeBadge}
          </TooltipTrigger>
          <TooltipContent>
            <p>Upgrade to unlock premium features</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return freeBadge;
}