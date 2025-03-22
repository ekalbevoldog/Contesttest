import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 border-t-4 border-primary shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center mb-6">
              <AlertCircle className="h-12 w-12 text-primary-500 mb-4" />
              <h1 className="text-3xl font-bold">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-400">
                  404 - Partnership Not Found
                </span>
              </h1>
              <p className="mt-4 text-gray-600">
                Unlike our athlete-business matches, this page doesn't exist.
              </p>
              <p className="mt-2 text-gray-500">
                Let's get you back to where the real connections happen.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
              <Link href="/">
                <Button className="w-full bg-gradient-to-r from-primary-600 to-primary-400 hover:from-primary-700 hover:to-primary-500">
                  Back to Home
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
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
