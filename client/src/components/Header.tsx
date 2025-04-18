import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  ExternalLink
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useState, ReactNode } from "react"; // Added ReactNode
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils"; // Import cn for conditional classes

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
  const { user, logoutMutation } = useAuth();
  const userType = user?.userType as UserType || null;

  const handleLogout = () => {
    logoutMutation.mutate();
    setOpen(false); // Close sheet on logout
  };

  // --- Navigation Data ---
  const navItems: NavItem[] = [
    // --- Marketing Links (Not Logged In) ---
    { label: "Solutions", href: "/solutions", icon: Info, condition: (user) => !user, desktopOnly: true },
    { label: "Pricing", href: "/pricing", icon: DollarSign, condition: (user) => !user, desktopOnly: true },
    { label: "Case Studies", href: "/case-studies", icon: BookOpen, condition: (user) => !user, desktopOnly: true },

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
        { label: "Settings", href: "/settings", icon: Settings },
        { label: "Sign Out", icon: LogOut, onClick: handleLogout },
      ]
    },
    {
      label: "Sign In", icon: LogIn, isDropdown: true, condition: (user) => !user, desktopOnly: true, // Desktop only for this specific trigger style
      dropdownItems: [
        { label: "Sign in or Register", href: "/auth", icon: UserCircle },
      ]
    },

    // Mobile Account Section Header
    { label: "Account", condition: () => true, mobileOnly: true, isButton: false }, // Header for mobile
    // Mobile Account Links (Logged In)
    { label: "My Profile", href: "/profile", icon: UserCircle, condition: (user) => !!user, mobileOnly: true },
    { label: "Messages", href: "/messages", icon: MessageSquare, condition: (user) => !!user, mobileOnly: true },
    { label: "My Public Profile", href: "/athlete/profile-link", icon: ExternalLink, condition: (user, userType) => !!user && userType === 'athlete', mobileOnly: true },
    { label: "Settings", href: "/settings", icon: Settings, condition: (user) => !!user, mobileOnly: true },
    { label: "Sign Out", icon: LogOut, onClick: handleLogout, condition: (user) => !!user, mobileOnly: true },
    // Mobile Account Links (Logged Out)
    { label: "Sign in or Register", href: "/auth", icon: UserCircle, condition: (user) => !user, mobileOnly: true },
    { label: "Get Started", href: "/dynamic-onboarding", icon: Zap, condition: (user) => !user, mobileOnly: true }, // Mobile Get Started

    // --- Special Buttons ---
    {
      label: "AI Assistant", icon: Zap, isButton: true, buttonVariant: 'default',
      buttonClassName: "bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-medium",
      onClick: () => window.dispatchEvent(new CustomEvent('toggle-ai-assistant')),
      condition: () => true, // Always show AI assistant button? Adjust if needed
      desktopOnly: true, // Specific styling for desktop button
    },
    {
      label: "Get Started", isButton: true, buttonVariant: 'default',
      buttonClassName: "bg-destructive hover:bg-destructive/90 text-white font-medium ml-2", // Use theme color
      href: "/dynamic-onboarding",
      condition: (user) => !user, // Only show when not logged in
      desktopOnly: true, // Specific styling for desktop button
    },
    // Mobile AI Assistant Button
    {
      label: "Chat with AI Assistant", icon: Zap, isButton: true, buttonVariant: 'default',
      buttonClassName: "w-full mt-6 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-medium",
      onClick: () => {
        setOpen(false);
        window.dispatchEvent(new CustomEvent('toggle-ai-assistant'));
      },
      condition: () => true, // Always show
      mobileOnly: true,
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
    <header className="bg-[#111111] border-b border-zinc-800 shadow-md backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <img src="/contested-logo.png" alt="Contested" className="h-10 w-auto" />
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {/* Marketing Navigation Links - Only show when not logged in */}
            {!user && (
              <>
                <Link href="/solutions">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                    location === "/solutions" ? "bg-[rgba(240,60,60,0.15)] text-white" : "text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.1)]"
                  }`}>
                    Solutions
                  </span>
                </Link>

                <Link href="/pricing">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                    location === "/pricing" ? "bg-[rgba(240,60,60,0.15)] text-white" : "text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.1)]"
                  }`}>
                    Pricing
                  </span>
                </Link>

                <Link href="/case-studies">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                    location === "/case-studies" ? "bg-[rgba(240,60,60,0.15)] text-white" : "text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.1)]"
                  }`}>
                    Case Studies
                  </span>
                </Link>
              </>
            )}

            {/* App Navigation - Only show when logged in */}
            {user && (
              <>
                {userType === 'athlete' ? (
                  <Link href="/athlete/dashboard">
                    <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                      location === "/athlete/dashboard" ? "bg-[rgba(240,60,60,0.15)] text-white" : "text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.1)]"
                    }`}>
                      <BarChart className="mr-1 h-4 w-4 text-[#f03c3c]" />
                      Athlete Dashboard
                    </span>
                  </Link>
                ) : userType === 'business' ? (
                  <Link href="/business/dashboard">
                    <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                      location === "/business/dashboard" ? "bg-[rgba(240,60,60,0.15)] text-white" : "text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.1)]"
                    }`}>
                      <BarChart className="mr-1 h-4 w-4 text-[#f03c3c]" />
                      Business Dashboard
                    </span>
                  </Link>
                ) : userType === 'compliance' ? (
                  <Link href="/compliance">
                    <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                      location === "/compliance" ? "bg-[rgba(240,60,60,0.15)] text-white" : "text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.1)]"
                    }`}>
                      <BarChart className="mr-1 h-4 w-4 text-[#f03c3c]" />
                      Compliance Dashboard
                    </span>
                  </Link>
                ) : userType === 'admin' ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                        location.includes("dashboard") ? "bg-[rgba(240,60,60,0.15)] text-white" : "text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.1)]"
                      }`}>
                        <BarChart className="mr-1 h-4 w-4 text-[#f03c3c]" />
                        Dashboards
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-gray-900 border-[#f03c3c]/50 text-white">
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                          <Settings className="mr-2 h-4 w-4 text-[#f03c3c]" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/athlete/dashboard" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                          <Trophy className="mr-2 h-4 w-4 text-[#f03c3c]" />
                          <span>Athlete Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/business/dashboard" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                          <Briefcase className="mr-2 h-4 w-4 text-[#f03c3c]" />
                          <span>Business Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/compliance" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                          <Shield className="mr-2 h-4 w-4 text-[#f03c3c]" />
                          <span>Compliance Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span></span> /* Default case - should not be visible as there's no longer a generic dashboard */
                )}

                <Link href="/messages">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                    location === "/messages" ? "bg-[rgba(240,60,60,0.15)] text-white" : "text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.1)]"
                  }`}>
                    <MessageSquare className="mr-1 h-4 w-4 text-[#f03c3c]" />
                    Messages
                  </span>
                </Link>
              </>
            )}

            {/* Admin Dropdown - Only shown for admins */}
            {user && (user.userType === 'admin' || user.username === 'admin') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.15)]">
                    <Settings className="mr-1 h-4 w-4 text-[#f03c3c]" />
                    Admin
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-[#f03c3c]/50 text-white">
                  <DropdownMenuItem asChild>
                    <Link href="/admin/n8n-config" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                      <Webhook className="mr-2 h-4 w-4 text-[#f03c3c]" />
                      <span>n8n Webhook Config</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Sign In Dropdown or Profile Button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 border-[#f03c3c] text-white bg-transparent">
                    <User className="mr-1 h-4 w-4 text-[#f03c3c]" />
                    Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-[#f03c3c]/50 text-white">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                      <UserCircle className="mr-2 h-4 w-4 text-[#f03c3c]" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                      <MessageSquare className="mr-2 h-4 w-4 text-[#f03c3c]" />
                      <span>Messages</span>
                    </Link>
                  </DropdownMenuItem>

                  {/* Profile Link Manager - Only shown for athletes */}
                  {userType === 'athlete' && (
                    <DropdownMenuItem asChild>
                      <Link href="/athlete/profile-link" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                        <ExternalLink className="mr-2 h-4 w-4 text-[#f03c3c]" />
                        <span>My Public Profile</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                      <Settings className="mr-2 h-4 w-4 text-[#f03c3c]" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button 
                      className="cursor-pointer w-full flex items-center text-left hover:bg-[rgba(240,60,60,0.15)]" 
                      onClick={() => {
                        // Execute our logout mutation
                        logoutMutation.mutate();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4 text-[#f03c3c]" />
                      <span>Sign Out</span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 border-[#f03c3c] text-white bg-transparent">
                    <LogIn className="mr-1 h-4 w-4 text-[#f03c3c]" />
                    Sign In
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-[#f03c3c]/50 text-white">
                  <DropdownMenuItem asChild>
                    <Link href="/auth" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                      <UserCircle className="mr-2 h-4 w-4 text-[#f03c3c]" />
                      <span>Sign in or Register</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button 
              size="sm" 
              className="bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-medium"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-ai-assistant'))}
            >
              <span className="flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                AI Assistant
              </span>
            </Button>

            {!user && (
              <Button
                size="sm"
                className="bg-[#9a0c0c] hover:bg-[#810a0a] text-white font-medium ml-2"
                asChild
              >
                <Link href="/dynamic-onboarding">
                  <span className="flex items-center">
                    Get Started
                  </span>
                </Link>
              </Button>
            )}
          </div>

          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border-[#f03c3c] bg-transparent">
                  <Menu className="h-6 w-6 text-[#f03c3c]" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="border-l-[#f03c3c] bg-black/95">
                <div className="pt-6 pb-3 space-y-1">
                  <div className="flex items-center mb-6">
                    <Link href="/" onClick={() => setOpen(false)}>
                      <img src="/contested-logo.png" alt="Contested" className="h-10 w-auto" />
                    </Link>
                  </div>

                  {/* Marketing Navigation Links - Only for non-logged in users */}
                  {!user && (
                    <>
                      <Link href="/solutions">
                        <span 
                          className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                            location === "/solutions" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                          }`}
                          onClick={() => setOpen(false)}
                        >
                          Solutions
                        </span>
                      </Link>

                      <Link href="/pricing">
                        <span 
                          className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                            location === "/pricing" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                          }`}
                          onClick={() => setOpen(false)}
                        >
                          Pricing
                        </span>
                      </Link>

                      <Link href="/case-studies">
                        <span 
                          className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                            location === "/case-studies" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                          }`}
                          onClick={() => setOpen(false)}
                        >
                          Case Studies
                        </span>
                      </Link>
                    </>
                  )}

                  {/* App Navigation - Only for logged in users */}
                  {user && (
                    <>
                      {userType === 'athlete' ? (
                        <Link href="/athlete/dashboard">
                          <span 
                            className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                              location === "/athlete/dashboard" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                            }`}
                            onClick={() => setOpen(false)}
                          >
                            <BarChart className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            Athlete Dashboard
                          </span>
                        </Link>
                      ) : userType === 'business' ? (
                        <Link href="/business/dashboard">
                          <span 
                            className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                              location === "/business/dashboard" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                            }`}
                            onClick={() => setOpen(false)}
                          >
                            <BarChart className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            Business Dashboard
                          </span>
                        </Link>
                      ) : userType === 'compliance' ? (
                        <Link href="/compliance">
                          <span 
                            className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                              location === "/compliance" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                            }`}
                            onClick={() => setOpen(false)}
                          >
                            <BarChart className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            Compliance Dashboard
                          </span>
                        </Link>
                      ) : userType === 'admin' ? (
                        <>
                          <div className="border-b border-gray-700 pb-2 mb-2">
                            <p className="px-3 py-1 text-sm text-gray-400">Dashboard Access</p>
                          </div>

                          <Link href="/admin/dashboard">
                            <span 
                              className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                                location === "/admin/dashboard" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                              }`}
                              onClick={() => setOpen(false)}
                            >
                              <Settings className="mr-2 h-4 w-4 text-[#f03c3c]" />
                              Admin Dashboard
                            </span>
                          </Link>

                          <Link href="/athlete/dashboard">
                            <span 
                              className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                                location === "/athlete/dashboard" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                              }`}
                              onClick={() => setOpen(false)}
                            >
                              <Trophy className="mr-2 h-4 w-4 text-[#f03c3c]" />
                              Athlete Dashboard
                            </span>
                          </Link>

                          <Link href="/business/dashboard">
                            <span 
                              className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                                location === "/business/dashboard" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                              }`}
                              onClick={() => setOpen(false)}
                            >
                              <Briefcase className="mr-2 h-4 w-4 text-[#f03c3c]" />
                              Business Dashboard
                            </span>
                          </Link>

                          <Link href="/compliance">
                            <span 
                              className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                                location === "/compliance" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                              }`}
                              onClick={() => setOpen(false)}
                            >
                              <Shield className="mr-2 h-4 w-4 text-[#f03c3c]" />
                              Compliance Dashboard
                            </span>
                          </Link>
                        </>
                      ) : (
                        <span></span> /* Default case - should not be visible as there's no longer a generic dashboard */
                      )}

                      <Link href="/messages">
                        <span 
                          className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                            location === "/messages" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                          }`}
                          onClick={() => setOpen(false)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4 text-[#f03c3c]" />
                          Messages
                        </span>
                      </Link>
                    </>
                  )}

                  {/* Admin section - Only for admin users */}
                  {user && (user.userType === 'admin' || user.username === 'admin') && (
                    <div className="border-t border-gray-700 my-4 pt-4">
                      <div className="px-3 py-2 text-sm font-medium text-gray-300">Admin</div>
                      <Link href="/admin/n8n-config">
                        <span
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white flex items-center"
                          onClick={() => setOpen(false)}
                        >
                          <Webhook className="mr-2 h-4 w-4 text-[#f03c3c]" />
                          n8n Webhook Config
                        </span>
                      </Link>
                    </div>
                  )}

                  <div className="border-t border-gray-700 my-4 pt-4">
                    <div className="px-3 py-2 text-sm font-medium text-gray-300">Account</div>
                    {!user && (
                      <Link href="/dynamic-onboarding">
                        <span
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white flex items-center"
                          onClick={() => setOpen(false)}
                        >
                          <svg className="h-4 w-4 mr-2 text-[#f03c3c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                          </svg>
                          Get Started
                        </span>
                      </Link>
                    )}
                    {user ? (
                      <>
                        <Link href="/profile">
                          <span
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white flex items-center"
                            onClick={() => setOpen(false)}
                          >
                            <UserCircle className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            My Profile
                          </span>
                        </Link>
                        <Link href="/messages">
                          <span
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white flex items-center"
                            onClick={() => setOpen(false)}
                          >
                            <MessageSquare className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            Messages
                          </span>
                        </Link>

                        {/* Public Profile Link for Athletes - mobile view */}
                        {userType === 'athlete' && (
                          <Link href="/athlete/profile-link">
                            <span
                              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white flex items-center"
                              onClick={() => setOpen(false)}
                            >
                              <ExternalLink className="mr-2 h-4 w-4 text-[#f03c3c]" />
                              My Public Profile
                            </span>
                          </Link>
                        )}

                        <Link href="/settings">
                          <span
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white flex items-center"
                            onClick={() => setOpen(false)}
                          >
                            <Settings className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            Settings
                          </span>
                        </Link>
                        <button
                          className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white flex items-center"
                          onClick={() => {
                            // Execute logout mutation and close mobile menu
                            logoutMutation.mutate();
                            setOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4 text-[#f03c3c]" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/auth">
                          <span
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white flex items-center"
                            onClick={() => setOpen(false)}
                          >
                            <UserCircle className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            Sign in or Register
                          </span>
                        </Link>
                      </>
                    )}
                  </div>

                  <Button 
                    className="w-full mt-6 bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white font-medium" 
                    onClick={() => {
                      setOpen(false);
                      window.dispatchEvent(new CustomEvent('toggle-ai-assistant'));
                    }}
                  >
                    <span className="flex items-center justify-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                      Chat with AI Assistant
                    </span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
