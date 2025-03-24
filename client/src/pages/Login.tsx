import { useState } from "react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { UserCircle, Briefcase, KeyRound, Mail } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine if this is the athlete or business login page
  const userType = location.includes("/athlete") ? "athlete" : "business";
  const icon = userType === "athlete" ? <UserCircle className="h-8 w-8" /> : <Briefcase className="h-8 w-8" />;
  const title = userType === "athlete" ? "Athlete Login" : "Business Login";
  const description = userType === "athlete" 
    ? "Sign in to access your athlete dashboard, manage your profile, and view partnership opportunities."
    : "Sign in to access your business dashboard, manage campaigns, and connect with athletes.";
  const dashboardPath = userType === "athlete" ? "/athlete/dashboard" : "/business/dashboard";
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    
    // Mock authentication - would connect to a proper backend authentication endpoint
    setTimeout(() => {
      setIsLoading(false);
      
      // In a real app, this would verify credentials against the backend
      if (data.email && data.password) {
        // Successful login - redirect to appropriate dashboard
        toast({
          title: "Login successful",
          description: `Welcome back to Contested!`,
        });
        
        // Store user type in localStorage to maintain session state
        localStorage.setItem('contestedUserType', userType);
        
        // Navigate to the appropriate dashboard
        navigate(dashboardPath);
      } else {
        // Failed login
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
        });
      }
    }, 1500);
  }

  return (
    <div className="container flex items-center justify-center min-h-[80vh] py-10">
      <Card className="w-full max-w-md shadow-lg border-[#e0f2ff]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            {icon}
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="your@email.com" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#0066cc] to-[#00a3ff] hover:from-[#005bb8] hover:to-[#0091e6]"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center text-sm">
            <p className="text-gray-500">
              Don't have an account?{" "}
              <Link href="/find-athlete-match" className="text-[#0066cc] hover:underline">
                Get started
              </Link>
            </p>
            <p className="mt-2 text-gray-500">
              <Link href={userType === "athlete" ? "/business/login" : "/athlete/login"} className="text-[#0066cc] hover:underline">
                {userType === "athlete" ? "Business login" : "Athlete login"}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}