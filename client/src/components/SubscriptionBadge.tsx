import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";

interface SubscriptionBadgeProps {
  showTooltip?: boolean;
  redirectToUpgrade?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

// This component displays a badge indicating the user's subscription status
// It includes a tooltip with information about the current plan
const SubscriptionBadge = ({
  showTooltip = true,
  redirectToUpgrade = true,
  size = 'default'
}: SubscriptionBadgeProps) => {
  const { user } = useSupabaseAuth();
  
  // Fetch subscription status from backend
  const { data: subscriptionData, isLoading } = useQuery<{
    status: {
      success: boolean;
      subscription: {
        id: string;
        status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid';
        planType: string;
        currentPeriodEnd: number;
      } | null;
    };
  }>({
    queryKey: ['/api/subscription/subscription'],
    // Only fetch if user is logged in
    enabled: !!user,
  });
  
  // Extract subscription information or use defaults
  const subscription = {
    status: subscriptionData?.status?.subscription?.status || 'none',
    plan: subscriptionData?.status?.subscription?.planType || 'Free',
    expiresAt: subscriptionData?.status?.subscription?.currentPeriodEnd 
      ? new Date(subscriptionData.status.subscription.currentPeriodEnd * 1000).toISOString()
      : null
  };

  if (isLoading) {
    return (
      <div className={cn(
        "animate-pulse rounded-full", 
        size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'
      )}>
        <div className="h-full w-full bg-gray-600 rounded-full opacity-30"></div>
      </div>
    )
  }

  // Default status when no subscription data is available
  const status = subscription?.status || 'none';
  const plan = subscription?.plan || 'Free';
  
  // Determine badge color based on subscription status
  let bgColor = "bg-gray-700"; // default non-subscriber color
  let iconColor = "text-gray-300";
  let borderColor = "border-gray-600";
  
  if (status === 'active' || status === 'trialing') {
    bgColor = "bg-gradient-to-r from-amber-600 to-amber-800";
    iconColor = "text-amber-200";
    borderColor = "border-amber-500";
  } else if (status === 'past_due' || status === 'incomplete') {
    bgColor = "bg-orange-800";
    iconColor = "text-orange-200";
    borderColor = "border-orange-500";
  } else if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
    bgColor = "bg-red-900";
    iconColor = "text-red-200";
    borderColor = "border-red-500";
  }

  // Size classes based on the size prop
  const sizeClasses = {
    sm: "h-5 w-5 border",
    default: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-2"
  }[size];

  // Icon size based on the size prop
  const iconSize = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  }[size];

  // Customize the badge content based on subscription status
  const Badge = (
    <div className={cn(
      "flex items-center justify-center rounded-full", 
      bgColor, 
      borderColor,
      sizeClasses,
      "hover:opacity-90 transition-opacity duration-200"
    )}>
      <Crown className={cn(iconColor, iconSize)} />
    </div>
  );

  // Format expiration date for display
  const formatExpirationDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Generate tooltip content based on subscription status
  const getTooltipContent = () => {
    switch (status) {
      case 'active':
        return (
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-semibold text-amber-300">{plan} Plan (Active)</p>
            <p className="text-gray-300">Your subscription is active and will renew on {formatExpirationDate(subscription?.expiresAt)}.</p>
          </div>
        );
      case 'trialing':
        return (
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-semibold text-amber-300">{plan} Trial</p>
            <p className="text-gray-300">Your trial ends on {formatExpirationDate(subscription?.expiresAt)}.</p>
          </div>
        );
      case 'past_due':
        return (
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-semibold text-orange-300">{plan} Plan (Payment Due)</p>
            <p className="text-gray-300">Your payment is past due. Please update your billing details.</p>
            {redirectToUpgrade && (
              <Button variant="outline" size="sm" className="mt-1" asChild>
                <Link href="/account/subscription">Update Payment</Link>
              </Button>
            )}
          </div>
        );
      case 'canceled':
      case 'unpaid':
      case 'incomplete_expired':
        return (
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-semibold text-red-300">{plan} Plan (Canceled)</p>
            <p className="text-gray-300">Your subscription has been canceled.</p>
            {redirectToUpgrade && (
              <Button variant="outline" size="sm" className="mt-1" asChild>
                <Link href="/account/subscription">Renew Subscription</Link>
              </Button>
            )}
          </div>
        );
      case 'incomplete':
        return (
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-semibold text-orange-300">{plan} Plan (Incomplete)</p>
            <p className="text-gray-300">Your subscription setup is incomplete.</p>
            {redirectToUpgrade && (
              <Button variant="outline" size="sm" className="mt-1" asChild>
                <Link href="/account/subscription">Complete Setup</Link>
              </Button>
            )}
          </div>
        );
      default:
        return (
          <div className="flex flex-col gap-1 text-xs">
            <p className="font-semibold text-gray-300">Free Plan</p>
            <p className="text-gray-400">Upgrade to unlock premium features.</p>
            {redirectToUpgrade && (
              <Button variant="outline" size="sm" className="mt-1" asChild>
                <Link href="/account/subscription">Upgrade Now</Link>
              </Button>
            )}
          </div>
        );
    }
  };

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {redirectToUpgrade ? (
              <Link href="/account/subscription">
                {Badge}
              </Link>
            ) : (
              Badge
            )}
          </TooltipTrigger>
          <TooltipContent className="w-64">
            {getTooltipContent()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Just the badge without tooltip if showTooltip is false
  return redirectToUpgrade ? (
    <Link href="/account/subscription">
      {Badge}
    </Link>
  ) : (
    Badge
  );
};

export default SubscriptionBadge;