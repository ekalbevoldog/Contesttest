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
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  
  // Extract user type from user object if available
  const userType = user?.userType || null;
  
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
                  <Link href="/compliance/dashboard">
                    <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                      location === "/compliance/dashboard" ? "bg-[rgba(240,60,60,0.15)] text-white" : "text-gray-300 hover:text-white hover:bg-[rgba(240,60,60,0.1)]"
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
                        <Link href="/compliance/dashboard" className="cursor-pointer w-full flex items-center hover:bg-[rgba(240,60,60,0.15)]">
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
                          
                          <Link href="/compliance/dashboard">
                            <span 
                              className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                                location === "/compliance/dashboard" ? "bg-[rgba(240,60,60,0.25)] text-white" : "text-gray-300 hover:bg-[rgba(240,60,60,0.15)] hover:text-white"
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
