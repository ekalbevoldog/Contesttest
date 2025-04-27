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

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          userType: userType
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Successful login
        toast({
          title: "Login successful",
          description: `Welcome back to Contested!`,
        });
        
        // Check if user is already logged in
        const isUserLoggedIn = localStorage.getItem('contestedUserLoggedIn') === 'true';
        if (isUserLoggedIn) {
          // Clear previous user data
          localStorage.removeItem('contestedUserLoggedIn');
          localStorage.removeItem('contestedUserType');
          localStorage.removeItem('contestedUserData');
          localStorage.removeItem('contestedSessionId');
          
          // Dispatch logout event to update UI
          window.dispatchEvent(new Event('contestedLogout'));
        }
        
        // Store authentication data
        localStorage.setItem('contestedUserType', userType);
        localStorage.setItem('contestedSessionId', result.sessionId);
        localStorage.setItem('contestedUserLoggedIn', 'true');
        
        // Dispatch login event to update UI
        window.dispatchEvent(new Event('contestedLogin'));
        
        // Fetch user profile after successful login
        try {
          const profileResponse = await fetch(`/api/profile?userType=${userType}`);
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            // Store user profile data
            localStorage.setItem('contestedUserData', JSON.stringify(profileData));
          } else {
            console.error("Failed to fetch user profile");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
        
        // Navigate to the appropriate dashboard based on user type
        if (userType === "athlete") {
          navigate("/athlete/dashboard");
        } else {
          navigate("/business/dashboard");
        }
      } else {
        // Failed login
        toast({
          variant: "destructive",
          title: "Login failed",
          description: result.message || "Invalid email or password. Please try again.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "An error occurred during login. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
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