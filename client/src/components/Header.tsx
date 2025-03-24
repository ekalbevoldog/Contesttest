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
  Users,
  Trophy,
  LogIn,
  User,
  UserCircle,
  Briefcase
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
  
  return (
    <header className="bg-white border-b border-[#e0f2ff] shadow-sm backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <img src="/contested-logo.png" alt="Contested" className="h-10 w-auto" />
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                location === "/" ? "tech-text" : "text-gray-600 hover:text-[#003366]"
              }`}>
                <Users className="mr-1 h-4 w-4" />
                Home
              </span>
            </Link>
            <Link href="/dashboard">
              <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer flex items-center ${
                location === "/dashboard" ? "tech-text" : "text-gray-600 hover:text-[#003366]"
              }`}>
                <BarChart className="mr-1 h-4 w-4" />
                Dashboard
              </span>
            </Link>
            <a href="#" className="text-gray-600 hover:text-[#003366] px-3 py-2 rounded-md text-sm font-medium flex items-center">
              <Trophy className="mr-1 h-4 w-4" />
              Matches
            </a>
            
            {/* Account Sign In Dropdown */}
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
                    <img src="/contested-logo.png" alt="Contested" className="h-10 w-auto" />
                  </div>
                  
                  <Link href="/">
                    <span 
                      className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer flex items-center ${
                        location === "/" ? "bg-[rgba(0,163,255,0.1)] tech-text" : "text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366]"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Home
                    </span>
                  </Link>
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
                  <a 
                    href="#" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-[rgba(0,163,255,0.05)] hover:text-[#003366] flex items-center"
                    onClick={() => setOpen(false)}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Matches
                  </a>
                  
                  <div className="border-t border-gray-200 my-4 pt-4">
                    <div className="px-3 py-2 text-sm font-medium text-gray-500">Account</div>
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
