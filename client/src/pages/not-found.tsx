import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 futuristic-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-6">
                <AlertCircle className="h-16 w-16 text-[#003366]" />
                <Zap className="h-8 w-8 text-[#00ffcc] absolute bottom-0 right-0" />
              </div>
              <h1 className="text-3xl font-bold">
                <span className="sports-highlight">
                  404 - Partnership Not Found
                </span>
              </h1>
              <p className="mt-4 dark-contrast">
                Unlike our athlete-business matches, this page doesn't exist.
              </p>
              <p className="mt-2 text-gray-500">
                Let's get you back to where the real connections happen.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
              <Link href="/">
                <Button className="w-full bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]">
                  Back to Home
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full border-[#00a3ff] text-[#003366] hover:bg-[rgba(0,163,255,0.1)]">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
