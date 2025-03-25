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
  User
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
    <header className="bg-white border-b border-[#e0f2ff] shadow-sm backdrop-blur-md">
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
            {/* Only show dashboard and matches when logged in */}
            {isLoggedIn && (
              <>
                {userType === 'athlete' ? (
                  <Link href="/athlete/dashboard">
                    <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                      location === "/athlete/dashboard" ? "tech-text" : "text-gray-600 hover:text-[#003366]"
                    }`}>
                      <BarChart className="mr-1 h-4 w-4" />
                      Athlete Dashboard
                    </span>
                  </Link>
                ) : userType === 'business' ? (
                  <Link href="/business/dashboard">
                    <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                      location === "/business/dashboard" ? "tech-text" : "text-gray-600 hover:text-[#003366]"
                    }`}>
                      <BarChart className="mr-1 h-4 w-4" />
                      Business Dashboard
                    </span>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                      location === "/dashboard" ? "tech-text" : "text-gray-600 hover:text-[#003366]"
                    }`}>
                      <BarChart className="mr-1 h-4 w-4" />
                      Dashboard
                    </span>
                  </Link>
                )}
                <Link href="/matches">
                  <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                    location === "/matches" ? "tech-text" : "text-gray-600 hover:text-[#003366]"
                  }`}>
                    <Trophy className="mr-1 h-4 w-4" />
                    Matches
                  </span>
                </Link>
              </>
            )}
            
            {/* Admin Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#003366]">
                  <Settings className="mr-1 h-4 w-4" />
                  Admin
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/admin/n8n-config" className="cursor-pointer w-full flex items-center">
                    <Webhook className="mr-2 h-4 w-4" />
                    <span>n8n Webhook Config</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Sign In Dropdown or Profile Button */}
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 border-[#00a3ff] text-[#003366]">
                    <User className="mr-1 h-4 w-4" />
                    Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full flex items-center">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer w-full flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button 
                      className="cursor-pointer w-full flex items-center text-left" 
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
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 border-[#00a3ff] text-[#003366]">
                    <LogIn className="mr-1 h-4 w-4" />
                    Sign In
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/athlete/login" className="cursor-pointer w-full flex items-center">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Sign in as Athlete</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/business/login" className="cursor-pointer w-full flex items-center">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span>Sign in as Business</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Link href="/find-athlete-match">
              <Button size="sm" className="bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]">
                Get Started
              </Button>
            </Link>
          </div>
          
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border-[#00a3ff]">
                  <Menu className="h-6 w-6 text-[#003366]" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="border-l-[#00a3ff]">
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
                              location === "/athlete/dashboard" ? "bg-[rgba(0,163,255,0.1)] tech-text" : "text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366]"
                            }`}
                            onClick={() => setOpen(false)}
                          >
                            <BarChart className="mr-2 h-4 w-4" />
                            Athlete Dashboard
                          </span>
                        </Link>
                      ) : userType === 'business' ? (
                        <Link href="/business/dashboard">
                          <span 
                            className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                              location === "/business/dashboard" ? "bg-[rgba(0,163,255,0.1)] tech-text" : "text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366]"
                            }`}
                            onClick={() => setOpen(false)}
                          >
                            <BarChart className="mr-2 h-4 w-4" />
                            Business Dashboard
                          </span>
                        </Link>
                      ) : (
                        <Link href="/dashboard">
                          <span 
                            className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                              location === "/dashboard" ? "bg-[rgba(0,163,255,0.1)] tech-text" : "text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366]"
                            }`}
                            onClick={() => setOpen(false)}
                          >
                            <BarChart className="mr-2 h-4 w-4" />
                            Dashboard
                          </span>
                        </Link>
                      )}
                      <Link href="/matches">
                        <span 
                          className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                            location === "/matches" ? "bg-[rgba(0,163,255,0.1)] tech-text" : "text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366]"
                          }`}
                          onClick={() => setOpen(false)}
                        >
                          <Trophy className="mr-2 h-4 w-4" />
                          Matches
                        </span>
                      </Link>
                    </>
                  )}
                  
                  <div className="border-t border-gray-200 my-4 pt-4">
                    <div className="px-3 py-2 text-sm font-medium text-gray-500">Admin</div>
                    <Link href="/admin/n8n-config">
                      <span
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366] flex items-center"
                        onClick={() => setOpen(false)}
                      >
                        <Webhook className="mr-2 h-4 w-4" />
                        n8n Webhook Config
                      </span>
                    </Link>
                  </div>
                  
                  <div className="border-t border-gray-200 my-4 pt-4">
                    <div className="px-3 py-2 text-sm font-medium text-gray-500">Account</div>
                    {isLoggedIn ? (
                      <>
                        <Link href="/profile">
                          <span
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366] flex items-center"
                            onClick={() => setOpen(false)}
                          >
                            <UserCircle className="mr-2 h-4 w-4" />
                            My Profile
                          </span>
                        </Link>
                        <Link href="/settings">
                          <span
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366] flex items-center"
                            onClick={() => setOpen(false)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </span>
                        </Link>
                        <button
                          className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366] flex items-center"
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
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/athlete/login">
                          <span
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366] flex items-center"
                            onClick={() => setOpen(false)}
                          >
                            <UserCircle className="mr-2 h-4 w-4" />
                            Sign in as Athlete
                          </span>
                        </Link>
                        <Link href="/business/login">
                          <span
                            className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366] flex items-center"
                            onClick={() => setOpen(false)}
                          >
                            <Briefcase className="mr-2 h-4 w-4" />
                            Sign in as Business
                          </span>
                        </Link>
                      </>
                    )}
                  </div>
                  
                  <Link href="/find-athlete-match">
                    <Button 
                      className="w-full mt-6 bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]" 
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
