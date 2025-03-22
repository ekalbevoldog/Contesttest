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
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <Link href="/">
                <a className="ml-2 text-xl font-bold text-gray-900">NIL Connect</a>
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/">
              <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                location === "/" ? "text-primary-600" : "text-gray-600 hover:text-gray-900"
              }`}>
                Home
              </a>
            </Link>
            <Link href="/dashboard">
              <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                location === "/dashboard" ? "text-primary-600" : "text-gray-600 hover:text-gray-900"
              }`}>
                Dashboard
              </a>
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
                    <a 
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        location === "/" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      Home
                    </a>
                  </Link>
                  <Link href="/dashboard">
                    <a 
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        location === "/dashboard" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      Dashboard
                    </a>
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
