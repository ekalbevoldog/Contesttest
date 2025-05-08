import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import {
  Menu,
  BarChart,
  Trophy,
  LogIn,
  LogOut,
  UserCircle,
  Briefcase,
  Settings,
  Webhook,
  User,
  MessageSquare,
  Shield,
  ExternalLink,
  ChevronDown, // Added for dropdown indicator
  Info, // Example for Solutions
  DollarSign, // Example for Pricing
  BookOpen, // Example for Case Studies
  Zap, // Example for Get Started / AI Assistant
  ArrowRight, // For Get Started button
  Crown, // For subscription management
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { ReactNode } from "react";
// Remove the legacy auth hook and only use Supabase
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils"; // Import cn for conditional classes

// Remove duplicate imports block
// --- Types ---
type UserType = "athlete" | "business" | "compliance" | "admin" | null;

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  condition?: (user: any, userType: UserType) => boolean; // Condition to display the item
  isDropdown?: boolean;
  dropdownItems?: NavItem[]; // Sub-items for dropdowns
  isButton?: boolean; // For special buttons like AI Assistant / Get Started
  buttonVariant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link"; // shadcn button variants
  buttonClassName?: string;
  hideInMobile?: boolean; // Option to hide certain items in mobile drawer
  hideInDesktop?: boolean; // Option to hide certain items in desktop nav
  mobileOnly?: boolean; // Only show in mobile
  desktopOnly?: boolean; // Only show in desktop
}

// --- Helper Components ---

// Reusable Nav Link Item
const NavLinkItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  isMobile?: boolean;
  closeSheet?: () => void;
}> = ({ item, isActive, isMobile = false, closeSheet }) => {
  const commonClasses = `px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center`;
  const mobileBaseClasses = `block text-base`;
  const desktopBaseClasses = `text-sm`;
  const activeBg = isMobile ? "bg-primary/25" : "bg-primary/15"; // Use theme colors
  const hoverBg = isMobile ? "hover:bg-primary/15" : "hover:bg-primary/10"; // Use theme colors
  const activeText = "text-white";
  const inactiveText = "text-gray-300 hover:text-white";

  const className = cn(
    commonClasses,
    isMobile ? mobileBaseClasses : desktopBaseClasses,
    isActive ? `${activeBg} ${activeText}` : `${inactiveText} ${hoverBg}`
  );

  const content = (
    <>
      {item.icon && <item.icon className={cn("mr-2 h-4 w-4", isActive ? "text-primary-foreground" : "text-primary")} />}
      <span>{item.label}</span>
    </>
  );

  const handleClick = () => {
    if (item.onClick) item.onClick();
    if (closeSheet) closeSheet();
  };

  if (item.href) {
    return (
      <Link href={item.href} onClick={handleClick}>
        <span className={className}>{content}</span>
      </Link>
    );
  }

  if (item.onClick) {
    return (
      <button className={cn(className, "w-full text-left")} onClick={handleClick}>
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>; // Fallback for non-interactive items if needed
};

// Reusable Dropdown Menu
const NavDropdown: React.FC<{
  triggerItem: NavItem;
  items: NavItem[];
  isActive: boolean;
  isMobile?: boolean;
  closeSheet?: () => void;
  user: any;
  userType: UserType;
}> = ({ triggerItem, items, isActive, isMobile = false, closeSheet, user, userType }) => {
  const triggerClasses = cn(
    "px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center",
    isActive ? "bg-primary/15 text-white" : "text-gray-300 hover:text-white hover:bg-primary/10"
  );

  const filteredItems = items.filter(subItem => !subItem.condition || subItem.condition(user, userType));

  if (isMobile) {
    // Render as expandable section in mobile sheet
    return (
      <div>
        <div className="border-b border-gray-700 pb-2 mb-2">
          <p className="px-3 py-1 text-sm text-gray-400 flex items-center">
            {triggerItem.icon && <triggerItem.icon className="mr-2 h-4 w-4 text-primary" />}
            {triggerItem.label}
          </p>
        </div>
        {filteredItems.map((subItem, index) => (
          <NavLinkItem
            key={index}
            item={subItem}
            isActive={false} // Active state handled by parent link in mobile for simplicity
            isMobile={true}
            closeSheet={closeSheet}
          />
        ))}
      </div>
    );
  }

  // Render as DropdownMenu on desktop
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className={triggerClasses}>
          {triggerItem.icon && <triggerItem.icon className="mr-1 h-4 w-4 text-primary" />}
          {triggerItem.label}
          <ChevronDown className="ml-1 h-4 w-4" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-gray-900 border-primary/50 text-white">
        {filteredItems.map((subItem, index) => (
          <DropdownMenuItem key={index} asChild className="hover:bg-primary/15 focus:bg-primary/15 cursor-pointer">
            {subItem.href ? (
              <Link href={subItem.href} className="w-full flex items-center">
                {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 text-primary" />}
                <span>{subItem.label}</span>
              </Link>
            ) : subItem.onClick ? (
              <button onClick={subItem.onClick} className="w-full flex items-center text-left">
                {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 text-primary" />}
                <span>{subItem.label}</span>
              </button>
            ) : (
               <span className="w-full flex items-center"> {/* Fallback for non-interactive */}
                 {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 text-primary" />}
                 <span>{subItem.label}</span>
               </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


export default function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  // Use the centralized auth hook as the single source of truth
  const { user, profile: userData, logoutMutation } = useAuth();
  
  // Set user type from userData with fallback options
  const userType = (userData?.role || user?.role || user?.user_metadata?.role) as UserType || null;
  
  // Debug user information
  console.log('Header user info:', { 
    user: user ? `${user.id} (${user.email})` : 'No user',
    userData: userData ? `${JSON.stringify(userData)}` : 'No userData',
    userType,
    userMetadata: user?.user_metadata,
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setOpen(false); // Close sheet on logout
  };

  // --- Navigation Data ---
  const navItems: NavItem[] = [
    // --- Marketing Links (Not Logged In) ---
    { label: "For Athletes", href: "/athletes", icon: Trophy, condition: (user) => !user, desktopOnly: true },
    { label: "For Businesses", href: "/businesses", icon: Briefcase, condition: (user) => !user, desktopOnly: true },

    // --- App Navigation (Logged In) ---
    // Dashboard Links (Conditional)
    { label: "Athlete Dashboard", href: "/athlete/dashboard", icon: BarChart, condition: (_, userType) => userType === 'athlete' },
    { label: "Business Dashboard", href: "/business/dashboard", icon: BarChart, condition: (_, userType) => userType === 'business' },
    { label: "Compliance Dashboard", href: "/compliance", icon: Shield, condition: (_, userType) => userType === 'compliance' },
    // Admin Dashboard Dropdown
    {
      label: "Dashboards", icon: BarChart, isDropdown: true, condition: (_, userType) => userType === 'admin',
      dropdownItems: [
        { label: "Admin Dashboard", href: "/admin/dashboard", icon: Settings },
        { label: "Athlete Dashboard", href: "/athlete/dashboard", icon: Trophy },
        { label: "Business Dashboard", href: "/business/dashboard", icon: Briefcase },
        { label: "Compliance Dashboard", href: "/compliance", icon: Shield },
      ]
    },
    // Messages Link
    { label: "Messages", href: "/messages", icon: MessageSquare, condition: (user) => !!user },
    
    

    // --- Admin Section (Admin Only) ---
    {
      label: "Admin", icon: Settings, isDropdown: true, condition: (_, userType) => userType === 'admin', desktopOnly: true, // Desktop only for this specific trigger style
      dropdownItems: [
        { label: "n8n Webhook Config", href: "/admin/n8n-config", icon: Webhook },
      ]
    },
    // Mobile Admin Section Header
    { label: "Admin", condition: (_, userType) => userType === 'admin', mobileOnly: true, isButton: false }, // Just a header for mobile
    { label: "n8n Webhook Config", href: "/admin/n8n-config", icon: Webhook, condition: (_, userType) => userType === 'admin', mobileOnly: true },


    // --- Profile / Auth Section ---
    {
      label: "Profile", icon: User, isDropdown: true, condition: (user) => !!user, desktopOnly: true, // Desktop only for this specific trigger style
      dropdownItems: [
        { label: "My Profile", href: "/profile", icon: UserCircle },
        { label: "Messages", href: "/messages", icon: MessageSquare },
        { label: "My Public Profile", href: "/athlete/profile-link", icon: ExternalLink, condition: (_, userType) => userType === 'athlete' },
        { label: "Manage Subscription", href: "/account/subscription", icon: Crown },
        { label: "Settings", href: "/settings", icon: Settings },
        { label: "Sign Out", icon: LogOut, onClick: handleLogout },
      ]
    },
    {
      label: "Sign In", icon: LogIn, isDropdown: true, condition: (user) => !user, desktopOnly: true, // Desktop only for this specific trigger style
      dropdownItems: [
        { label: "Sign in or Register", href: "/sign-in", icon: UserCircle },
      ]
    },

    // Mobile Account Section Header
    { label: "Account", condition: () => true, mobileOnly: true, isButton: false }, // Header for mobile
    // Mobile Account Links (Logged In)
    { label: "My Profile", href: "/profile", icon: UserCircle, condition: (user) => !!user, mobileOnly: true },
    { label: "Messages", href: "/messages", icon: MessageSquare, condition: (user) => !!user, mobileOnly: true },
    { 
      label: "Dashboard", 
      icon: BarChart, 
      condition: (user) => !!user, 
      mobileOnly: true,
      isButton: true,
      buttonVariant: 'outline',
      buttonClassName: "mt-2 border-primary bg-transparent hover:bg-primary/15 text-white",
      href: "/dashboard", // Added href to trigger proper routing
    },
    { label: "My Public Profile", href: "/athlete/profile-link", icon: ExternalLink, condition: (user, userType) => !!user && userType === 'athlete', mobileOnly: true },
    { label: "Manage Subscription", href: "/account/subscription", icon: Crown, condition: (user) => !!user, mobileOnly: true },
    { label: "Settings", href: "/settings", icon: Settings, condition: (user) => !!user, mobileOnly: true },
    { label: "Sign Out", icon: LogOut, onClick: handleLogout, condition: (user) => !!user, mobileOnly: true },
    // Mobile Account Links (Logged Out)
    { label: "Sign in or Register", href: "/sign-in", icon: UserCircle, condition: (user) => !user, mobileOnly: true },
    { label: "Get Started", href: "/onboarding", icon: Zap, condition: (user) => !user, mobileOnly: true }, // Mobile Get Started
    
    // Mobile New Campaign Button for Business Users
    { label: "New Campaign", href: "/wizard/pro/start", icon: Zap, 
      condition: (user, userType) => {
        // More flexible check for business users - same as desktop
        const isBusinessUser = 
          userType === 'business' || 
          user?.role === 'business' || 
          user?.user_metadata?.role === 'business' ||
          (user?.email && (user.email.includes('@business') || user.email.includes('business@')));
        
        // Log in mobile condition for debugging
        console.log('Mobile New Campaign button condition:', { isBusinessUser, userType, userRole: user?.role, userMetaRole: user?.user_metadata?.role });
        return isBusinessUser;
      }, 
      mobileOnly: true, 
      isButton: true, buttonVariant: 'default', 
      buttonClassName: "mt-2 bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-black font-medium transition-all duration-300" },

    // --- Special Buttons ---
    {
      label: "Get Started",
      icon: ArrowRight,
      isButton: true,
      buttonVariant: 'default',
      buttonClassName: "relative overflow-hidden ml-2 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl",
      href: "/onboarding",
      condition: (user) => !user, // Only show when not logged in
      desktopOnly: true, // Specific styling for desktop button
    },
    
    // --- New Campaign Button for Business Users ---
    {
      label: "New Campaign",
      icon: Zap,
      isButton: true,
      buttonVariant: 'default',
      buttonClassName: "relative overflow-hidden ml-2 bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-black font-medium transition-all duration-300 shadow-lg hover:shadow-xl",
      href: "/wizard/pro/start",
      condition: (user, userType) => {
        // More flexible check for business users
        const isBusinessUser = 
          userType === 'business' || 
          user?.role === 'business' || 
          user?.user_metadata?.role === 'business' ||
          (user?.email && (user.email.includes('@business') || user.email.includes('business@')));
        
        console.log('New Campaign button condition check:', { isBusinessUser, userType, userRole: user?.role, userMetaRole: user?.user_metadata?.role });
        return isBusinessUser;
      },
      desktopOnly: true, // Specific styling for desktop button
    },

  ];

  // Filter items based on conditions and context (desktop/mobile)
  const getVisibleItems = (isMobile: boolean) => {
    return navItems.filter(item => {
      const conditionMet = !item.condition || item.condition(user, userType);
      const contextMatch = isMobile
        ? (!item.desktopOnly && !item.hideInMobile)
        : (!item.mobileOnly && !item.hideInDesktop);
      return conditionMet && contextMatch;
    });
  };

  const desktopNavItems = getVisibleItems(false);
  const mobileNavItems = getVisibleItems(true);

  // Helper to check if a dropdown trigger path is active
  const isDropdownActive = (item: NavItem) => {
    return item.isDropdown && item.dropdownItems?.some(sub => sub.href && location.startsWith(sub.href));
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/50 border-b border-zinc-800/50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/30 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-md"></div>
                  <img src="/contested-logo.png" alt="Contested" className="h-10 w-auto relative z-10" />
                </div>
              </Link>
              {/* Subscription badge - display next to logo when user is logged in */}
              {user && <div className="ml-3"><SubscriptionBadge size="sm" /></div>}
            </div>
          </div>

          {/* --- Desktop Navigation --- */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {desktopNavItems.map((item, index) => {
              const isActive = item.href ? location === item.href : isDropdownActive(item);

              if (item.isButton) {
                // Special handling for Dashboard button - dynamically determine the right URL based on user type
                if (item.label === "Dashboard" && user) {
                  // Get the correct dashboard URL based on user type
                  let dashboardUrl = "/dashboard"; // Redirect to dashboard redirection component
                  console.log("Dashboard button clicked, userType:", userType);
                  
                  // Direct linking to dashboard based on role
                  if (userType === 'athlete') dashboardUrl = "/athlete/dashboard";
                  else if (userType === 'business') dashboardUrl = "/business/dashboard";
                  else if (userType === 'compliance') dashboardUrl = "/compliance/dashboard";
                  else if (userType === 'admin') dashboardUrl = "/admin/dashboard";
                  
                  return (
                    <Button
                      key={index}
                      size="sm"
                      variant={item.buttonVariant || 'default'}
                      className={cn(item.buttonClassName)}
                      asChild
                    >
                      <Link href={dashboardUrl}>
                        <span className="flex items-center">
                          {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                          {item.label}
                        </span>
                      </Link>
                    </Button>
                  );
                }
                
                // Regular button handling
                return (
                  <Button
                    key={index}
                    size="sm"
                    variant={item.buttonVariant || 'default'}
                    className={cn(item.buttonClassName)}
                    onClick={item.onClick}
                    asChild={!!item.href}
                  >
                    {item.href ? (
                      <Link href={item.href}>
                        <span className="flex items-center">
                          {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                          {item.label}
                        </span>
                      </Link>
                    ) : (
                      <span className="flex items-center">
                        {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                        {item.label}
                      </span>
                    )}
                  </Button>
                );
              } else if (item.isDropdown && item.dropdownItems) {
                // Special handling for Profile/Sign In buttons using DropdownMenuTrigger style
                if (item.label === "Profile" || item.label === "Sign In" || item.label === "Admin") {
                   const TriggerButton = (
                     <Button
                       variant={item.label === "Admin" ? "ghost" : "outline"}
                       size="sm"
                       className={cn(
                         "ml-2 text-white",
                         item.label !== "Admin" && "border-primary bg-transparent", // Use theme color
                         item.label === "Admin" && "hover:bg-primary/15 hover:text-white" // Use theme color
                       )}
                     >
                       {item.icon && <item.icon className="mr-1 h-4 w-4 text-primary" />}
                       {item.label}
                     </Button>
                   );
                   return (
                     <DropdownMenu key={index}>
                       <DropdownMenuTrigger asChild>{TriggerButton}</DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-primary/50 text-white">
                         {item.dropdownItems.filter(sub => !sub.condition || sub.condition(user, userType)).map((subItem, subIndex) => (
                           <DropdownMenuItem key={subIndex} asChild className="hover:bg-primary/15 focus:bg-primary/15 cursor-pointer">
                             {subItem.href ? (
                               <Link href={subItem.href} className="w-full flex items-center">
                                 {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 text-primary" />}
                                 <span>{subItem.label}</span>
                               </Link>
                             ) : subItem.onClick ? (
                               <button onClick={subItem.onClick} className="w-full flex items-center text-left">
                                 {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 text-primary" />}
                                 <span>{subItem.label}</span>
                               </button>
                             ) : (
                               <span className="w-full flex items-center"> {/* Fallback */}
                                 {subItem.icon && <subItem.icon className="mr-2 h-4 w-4 text-primary" />}
                                 <span>{subItem.label}</span>
                               </span>
                             )}
                           </DropdownMenuItem>
                         ))}
                       </DropdownMenuContent>
                     </DropdownMenu>
                   );
                } else {
                  // Standard NavDropdown for other dropdowns (like Admin Dashboards)
                  return (
                    <NavDropdown
                      key={index}
                      triggerItem={item}
                      items={item.dropdownItems || []}
                      isActive={isActive || false}
                      user={user}
                      userType={userType || null}
                    />
                  );
                }
              } else {
                // Regular NavLinkItem
                return <NavLinkItem key={index} item={item} isActive={isActive || false} />;
              }
            })}
          </div>

          {/* --- Mobile Navigation Trigger --- */}
          <div className="md:hidden flex items-center">

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border border-zinc-800 hover:border-red-500/50 bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-900/60 relative overflow-hidden transition-all duration-300 shadow-lg hover:shadow-red-500/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-md"></div>
                  <Menu className="h-5 w-5 text-white" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="border-l border-zinc-800/50 bg-gradient-to-b from-black/95 to-zinc-900/95 text-white w-[280px] sm:w-[320px] shadow-2xl backdrop-blur-xl">
                <div className="pt-6 pb-3 space-y-1 flex flex-col h-full">
                  {/* Header with subtle gradient background */}
                  <div className="flex items-center mb-6 px-3 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/30 via-red-500/10 to-black/0 opacity-70"></div>
                    <div className="flex items-center relative z-10">
                      <Link href="/" onClick={() => setOpen(false)}>
                        <img src="/contested-logo.png" alt="Contested" className="h-10 w-auto" />
                      </Link>
                      {user && <div className="ml-3"><SubscriptionBadge size="sm" /></div>}
                    </div>
                  </div>

                  {/* Scrollable Navigation Area */}
                  <div className="flex-grow overflow-y-auto space-y-2 pr-2"> {/* Added padding-right */}
                    {mobileNavItems.map((item, index) => {
                      // Group items logically (e.g., separate sections for Admin, Account)
                      // This logic assumes items are ordered correctly in the navItems array
                      const isDivider = (item.label === "Admin" || item.label === "Account") && item.mobileOnly && !item.isButton && !item.href && !item.onClick;
                      const isButton = item.isButton && item.mobileOnly;

                      if (isDivider) {
                        return (
                          <div key={index} className="relative my-5 pt-4">
                            <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-zinc-800/50 via-red-500/30 to-zinc-800/50"></div>
                            <div className="px-3 py-1 text-sm font-semibold text-red-400/90 flex items-center">
                              {item.icon && <item.icon className="mr-2 h-4 w-4 text-red-400/90" />}
                              {item.label}
                            </div>
                          </div>
                        );
                      }

                      if (isButton) {
                        // Skip rendering buttons here, handle them at the bottom
                        return null;
                      }

                      // Render regular links or dropdown sections
                      const isActive = item.href ? location === item.href : false; // Simple active check for mobile links
                      if (item.isDropdown && item.dropdownItems) {
                        // Render dropdown as a section in mobile
                        return (
                          <NavDropdown
                            key={index}
                            triggerItem={item}
                            items={item.dropdownItems || []}
                            isActive={false} // Active state not highlighted on dropdown trigger in mobile
                            isMobile={true}
                            closeSheet={() => setOpen(false)}
                            user={user}
                            userType={userType || null}
                          />
                        );
                      } else {
                        // Render standard NavLinkItem
                        return (
                          <NavLinkItem
                            key={index}
                            item={item}
                            isActive={isActive}
                            isMobile={true}
                            closeSheet={() => setOpen(false)}
                          />
                        );
                      }
                    })}
                  </div>

                  {/* Footer Buttons */}
                  <div className="mt-auto pt-4 px-1"> {/* Stick to bottom */}
                    
                    
                    {/* Other Mobile Buttons */}
                    {mobileNavItems.filter(item => item.isButton && item.mobileOnly).map((item, index) => (
                       <Button
                         key={`mobile-btn-${index}`}
                         size="sm"
                         variant={item.buttonVariant || 'default'}
                         className={cn("w-full justify-center", item.buttonClassName)}
                         onClick={() => {
                           if(item.onClick) item.onClick();
                           // No need to close sheet here if onClick already does it
                           setOpen(false);
                         }}
                         asChild={!!item.href}
                       >
                         {item.href ? (
                           <Link href={item.href}>
                             <span className="flex items-center">
                               {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                               {item.label}
                             </span>
                           </Link>
                         ) : (
                           <span className="flex items-center">
                             {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                             {item.label}
                           </span>
                         )}
                       </Button>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
