import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <svg className="h-8 w-auto text-primary-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8v8h-2V8h2zm-4-4v16h-2V4h2zm-4 7v9H6v-9h2zm12-7h-2v16h2V4z"></path>
              </svg>
              <Link href="/">
                <span className="ml-2 text-xl font-bold text-gray-900 cursor-pointer">
                  <span className="text-primary-600">Contested</span>
                </span>
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                location === "/" ? "text-primary-600" : "text-gray-600 hover:text-gray-900"
              }`}>
                Home
              </span>
            </Link>
            <Link href="/dashboard">
              <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                location === "/dashboard" ? "text-primary-600" : "text-gray-600 hover:text-gray-900"
              }`}>
                Dashboard
              </span>
            </Link>
            <a href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Matches</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Analytics</a>
            <Link href="/">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
          
          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="px-2 pt-2 pb-3 space-y-1">
                  <Link href="/">
                    <span 
                      className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                        location === "/" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      Home
                    </span>
                  </Link>
                  <Link href="/dashboard">
                    <span 
                      className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                        location === "/dashboard" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      Dashboard
                    </span>
                  </Link>
                  <a 
                    href="#" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => setOpen(false)}
                  >
                    Matches
                  </a>
                  <a 
                    href="#" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    onClick={() => setOpen(false)}
                  >
                    Analytics
                  </a>
                  <Link href="/">
                    <Button className="w-full mt-3" onClick={() => setOpen(false)}>
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
