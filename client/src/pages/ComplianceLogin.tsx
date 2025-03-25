import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock } from 'lucide-react';
import { useLocation } from 'wouter';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function ComplianceLogin() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would make an API call to verify credentials
      // For now, we'll simulate a successful login
      setTimeout(() => {
        // Store login status
        localStorage.setItem('contestedUserLoggedIn', 'true');
        localStorage.setItem('contestedUserType', 'compliance');
        localStorage.setItem('contestedUserData', JSON.stringify({
          id: 100,
          email: data.email,
          name: 'NIL Compliance Officer',
          school: 'University Athletics',
          role: 'compliance',
        }));
        
        // Dispatch custom login event
        window.dispatchEvent(new Event('contestedLogin'));
        
        // Show success message
        toast({
          title: "Login successful",
          description: "Welcome to the NIL Compliance Dashboard",
        });
        
        // Redirect to compliance dashboard
        navigate('/compliance/dashboard');
      }, 1000);
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md bg-[#1a1a1a] border-[#333] text-white">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-[rgba(240,60,60,0.15)] p-3 rounded-full">
              <Shield className="h-8 w-8 text-[#f03c3c]" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Compliance Officer Login</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Login to review and approve NIL partnerships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">School Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="name@school.edu" 
                        {...field} 
                        className="bg-[#222] border-[#333] text-white"
                      />
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
                    <FormLabel className="text-gray-300">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="password" 
                          placeholder="Your password" 
                          {...field} 
                          className="bg-[#222] border-[#333] text-white pl-10"
                        />
                        <Lock className="absolute top-[50%] transform translate-y-[-50%] left-3 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full mt-6 bg-gradient-to-r from-[#f03c3c] to-[#ff5c5c] hover:from-[#d42e2e] hover:to-[#e34c4c]" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="border-t border-[#333] pt-4 flex flex-col space-y-2">
          <p className="text-sm text-center text-gray-400">
            Only authorized compliance officers may access this portal. All actions are logged and audited.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}