
/**
 * Unified Login Page
 * 
 * This page provides a consolidated authentication entry point:
 * - Uses unified auth as the primary authentication mechanism
 * - Provides login and registration functionality in a single interface
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { AnimatedFormTransition } from '@/components/animations/AnimatedFormTransition';

// Schema for login form
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Schema for registration form
const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required').optional(),
  role: z.enum(['athlete', 'business', 'compliance', 'admin']).default('athlete')
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, isLoading } = useAuth();

  // Get the redirect path from the URL
  const searchParams = new URLSearchParams(window.location.search);
  const redirectTo = searchParams.get('redirectTo') || '/';

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      role: 'athlete'
    }
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const result = await signIn(values.email, values.password);
      
      if (!result.error) {
        console.log('Login successful, redirecting to:', redirectTo);
        navigate(redirectTo);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const result = await signUp(values.email, values.password, {
        fullName: values.fullName,
        role: values.role
      });
      
      if (!result.error) {
        console.log('Registration successful, redirecting to onboarding');
        
        if (values.role === 'athlete') {
          navigate('/athlete-onboarding');
        } else if (values.role === 'business') {
          navigate('/business-onboarding');
        } else {
          navigate('/onboarding');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <div className="w-full max-w-md">
        <AnimatedFormTransition step={activeTab} direction="forward">
          <Card className="border-0 shadow-xl bg-black/70 backdrop-blur-md">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'login' 
                  ? 'Enter your credentials to access your account' 
                  : 'Fill out the form to create your account'}
              </CardDescription>
            </CardHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <CardContent className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="name@example.com" 
                                type="email" 
                                {...field} 
                                className="bg-black/40"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="••••••••" 
                                type="password" 
                                {...field} 
                                className="bg-black/40"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || isLoading} 
                        className="w-full bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600"
                      >
                        {(isSubmitting || isLoading) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <CardContent className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="name@example.com" 
                                type="email" 
                                {...field} 
                                className="bg-black/40"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="••••••••" 
                                type="password" 
                                {...field} 
                                className="bg-black/40"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="John Doe" 
                                {...field} 
                                className="bg-black/40"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>I am a</FormLabel>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <Button
                                type="button"
                                variant={field.value === 'athlete' ? 'default' : 'outline'}
                                onClick={() => registerForm.setValue('role', 'athlete')}
                                className={field.value === 'athlete' 
                                  ? 'bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600' 
                                  : 'bg-black/40'}
                              >
                                Athlete
                              </Button>
                              <Button
                                type="button"
                                variant={field.value === 'business' ? 'default' : 'outline'}
                                onClick={() => registerForm.setValue('role', 'business')}
                                className={field.value === 'business' 
                                  ? 'bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600' 
                                  : 'bg-black/40'}
                              >
                                Business
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting || isLoading}
                        className="w-full bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600"
                      >
                        {(isSubmitting || isLoading) ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
            
            <div className="px-8 pb-6 pt-2">
              <Separator className="my-4" />
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  {activeTab === 'login' 
                    ? "Don't have an account? " 
                    : "Already have an account? "}
                  <Button 
                    variant="link" 
                    className="p-0 text-primary underline" 
                    onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
                  >
                    {activeTab === 'login' ? 'Register' : 'Sign In'}
                  </Button>
                </p>
              </div>
            </div>
          </Card>
        </AnimatedFormTransition>
      </div>
    </div>
  );
}
