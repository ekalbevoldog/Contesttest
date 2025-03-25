import { useState, useEffect } from "react";
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
  Shield
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  
  // Check if user is logged in based on localStorage
  useEffect(() => {
    const checkLoginStatus = () => {
      const isUserLoggedIn = localStorage.getItem('contestedUserLoggedIn') === 'true';
      const storedUserType = localStorage.getItem('contestedUserType');
      
      setIsLoggedIn(isUserLoggedIn);
      setUserType(isUserLoggedIn ? storedUserType : null);
    };
    
    // Check on component mount
    checkLoginStatus();
    
    // Add a listener for custom login/logout events
    const handleLoginEvent = () => checkLoginStatus();
    
    // Also set up event listener for storage changes (in case user logs in/out in another tab)
    const handleStorageChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('contestedLogin', handleLoginEvent);
    window.addEventListener('contestedLogout', handleLoginEvent);
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up
    return () => {
      window.removeEventListener('contestedLogin', handleLoginEvent);
      window.removeEventListener('contestedLogout', handleLoginEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
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
            {/* Main Navigation Links */}
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
            
            {/* Only show dashboard and matches when logged in */}
            {isLoggedIn && (
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
                  <Link href="/compliance/dashboard">
                    <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                      location === "/compliance/dashboard" ? "bg-[rgba(240,60,60,0.15)] text-white" : "text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.1)]"
                    }`}>
                      <BarChart className="mr-1 h-4 w-4 text-[#f03c3c]" />
                      Compliance Dashboard
                    </span>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                      location === "/dashboard" ? "bg-[rgba(240,60,60,0.15)] text-white" : "text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.1)]"
                    }`}>
                      <BarChart className="mr-1 h-4 w-4 text-[#f03c3c]" />
                      Dashboard
                    </span>
                  </Link>
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
            
            {/* Admin Dropdown */}
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
            
            {/* Sign In Dropdown or Profile Button */}
            {isLoggedIn ? (
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
                    <Link href="/settings" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                      <Settings className="mr-2 h-4 w-4 text-[#f03c3c]" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button 
                      className="cursor-pointer w-full flex items-center text-left hover:bg-[rgba(240,60,60,0.15)]" 
                      onClick={() => {
                        // Handle logout - clear all user data from localStorage
                        localStorage.removeItem('contestedUserLoggedIn');
                        localStorage.removeItem('contestedUserType');
                        localStorage.removeItem('contestedUserData');
                        localStorage.removeItem('contestedSessionId');
                        
                        // Dispatch custom event for logout
                        window.dispatchEvent(new Event('contestedLogout'));
                        
                        // Update component state
                        setIsLoggedIn(false);
                        setUserType(null);
                        
                        // Redirect to home page
                        window.location.href = '/';
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
                    <Link href="/athlete/login" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                      <UserCircle className="mr-2 h-4 w-4 text-[#f03c3c]" />
                      <span>Sign in as Athlete</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/business/login" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                      <Briefcase className="mr-2 h-4 w-4 text-[#f03c3c]" />
                      <span>Sign in as Business</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/compliance/login" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
                      <Shield className="mr-2 h-4 w-4 text-[#f03c3c]" />
                      <span>Sign in as Compliance Officer</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Link href="/find-athlete-match">
              <Button size="sm" className="bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] hover:from-[#d42e2e] hover:to-[#e34c4c] text-white font-medium">
                Get Started
              </Button>
            </Link>
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
                  
                  {/* Only show dashboard and matches when logged in */}
                  {isLoggedIn && (
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
                        <Link href="/compliance/dashboard">
                          <span 
                            className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                              location === "/compliance/dashboard" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                            }`}
                            onClick={() => setOpen(false)}
                          >
                            <BarChart className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            Compliance Dashboard
                          </span>
                        </Link>
                      ) : (
                        <Link href="/dashboard">
                          <span 
                            className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                              location === "/dashboard" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
                            }`}
                            onClick={() => setOpen(false)}
                          >
                            <BarChart className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            Dashboard
                          </span>
                        </Link>
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
                  
                  <div className="border-t border-gray-700 my-4 pt-4">
                    <div className="px-3 py-2 text-sm font-medium text-gray-300">Account</div>
                    {isLoggedIn ? (
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
                            // Handle logout - clear all user data from localStorage
                            localStorage.removeItem('contestedUserLoggedIn');
                            localStorage.removeItem('contestedUserType');
                            localStorage.removeItem('contestedUserData');
                            localStorage.removeItem('contestedSessionId');
                            
                            // Dispatch custom event for logout
                            window.dispatchEvent(new Event('contestedLogout'));
                            
                            // Update component state
                            setIsLoggedIn(false);
                            setUserType(null);
                            setOpen(false);
                            
                            // Redirect to home page
                            window.location.href = '/';
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4 text-[#f03c3c]" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/athlete/login">
                          <span
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white flex items-center"
                            onClick={() => setOpen(false)}
                          >
                            <UserCircle className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            Sign in as Athlete
                          </span>
                        </Link>
                        <Link href="/business/login">
                          <span
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white flex items-center"
                            onClick={() => setOpen(false)}
                          >
                            <Briefcase className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            Sign in as Business
                          </span>
                        </Link>
                        <Link href="/compliance/login">
                          <span
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white flex items-center"
                            onClick={() => setOpen(false)}
                          >
                            <Shield className="mr-2 h-4 w-4 text-[#f03c3c]" />
                            Sign in as Compliance Officer
                          </span>
                        </Link>
                      </>
                    )}
                  </div>
                  
                  <Link href="/find-athlete-match">
                    <Button 
                      className="w-full mt-6 bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] hover:from-[#d42e2e] hover:to-[#e34c4c] text-white font-medium" 
                      onClick={() => setOpen(false)}
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
