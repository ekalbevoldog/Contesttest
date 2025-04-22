import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { FadeIn } from '@/components/animations/FadeIn';

// Form validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['athlete', 'business', 'compliance', 'admin']).default('athlete'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      role: 'athlete',
    },
  });
  
  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };
  
  // Handle register form submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };
  
  return (
    <FadeIn>
      <div className="flex min-h-[calc(100vh-180px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8">
          {/* Left column: Authentication forms */}
          <div className="flex flex-col justify-center">
            <div className="mx-auto w-full max-w-md space-y-6">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Welcome to Contested</h1>
                <p className="text-muted-foreground">Sign in to access your account or create a new one</p>
              </div>
              
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                {/* Login Tab */}
                <TabsContent value="login">
                  <Card>
                    <CardHeader>
                      <CardTitle>Login to your account</CardTitle>
                      <CardDescription>Enter your username and password to access your dashboard</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                          <FormField
                            control={loginForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="username" className="pl-10" {...field} />
                                  </div>
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
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                            {loginMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                              </>
                            ) : (
                              "Sign In"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                      <div className="text-sm text-muted-foreground text-center">
                        Don't have an account?{" "}
                        <button 
                          onClick={() => setActiveTab('register')} 
                          className="text-primary hover:underline"
                        >
                          Register here
                        </button>
                      </div>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                {/* Register Tab */}
                <TabsContent value="register">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create a new account</CardTitle>
                      <CardDescription>Fill in the form below to create your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...registerForm}>
                        <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="username" className="pl-10" {...field} />
                                  </div>
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
                                <FormLabel>Account Type</FormLabel>
                                <div className="grid grid-cols-3 gap-3">
                                  <Button
                                    type="button"
                                    variant={field.value === 'athlete' ? 'default' : 'outline'}
                                    className={`flex flex-col items-center justify-center h-20 ${field.value === 'athlete' ? 'ring-2 ring-primary' : ''}`}
                                    onClick={() => registerForm.setValue('role', 'athlete')}
                                  >
                                    <span className="text-xs">Athlete</span>
                                  </Button>
                                  
                                  <Button
                                    type="button"
                                    variant={field.value === 'business' ? 'default' : 'outline'}
                                    className={`flex flex-col items-center justify-center h-20 ${field.value === 'business' ? 'ring-2 ring-primary' : ''}`}
                                    onClick={() => registerForm.setValue('role', 'business')}
                                  >
                                    <span className="text-xs">Business</span>
                                  </Button>
                                  
                                  <Button
                                    type="button"
                                    variant={field.value === 'compliance' ? 'default' : 'outline'}
                                    className={`flex flex-col items-center justify-center h-20 ${field.value === 'compliance' ? 'ring-2 ring-primary' : ''}`}
                                    onClick={() => registerForm.setValue('role', 'compliance')}
                                  >
                                    <span className="text-xs">Compliance</span>
                                  </Button>
                                </div>
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
                                  <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input type="password" placeholder="••••••••" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                            {registerMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating account...
                              </>
                            ) : (
                              "Create Account"
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                      <div className="text-sm text-muted-foreground text-center">
                        Already have an account?{" "}
                        <button 
                          onClick={() => setActiveTab('login')} 
                          className="text-primary hover:underline"
                        >
                          Sign in here
                        </button>
                      </div>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Right column: Hero content */}
          <div className="hidden md:flex flex-col items-center justify-center bg-muted rounded-lg p-8">
            <div className="max-w-md space-y-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Connect. Partner. Prosper.</h2>
                <p className="text-muted-foreground">
                  Contested is the premier platform connecting college athletes with businesses 
                  for authentic partnerships. Join us today and start building meaningful marketing 
                  collaborations.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <span className="h-5 w-5 text-primary">🏆</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">For Athletes</h3>
                    <p className="text-sm text-muted-foreground">
                      Showcase your personal brand and connect with businesses looking for authentic partnerships.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <span className="h-5 w-5 text-primary">💼</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">For Businesses</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect with student athletes who align with your brand values and audience demographics.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <span className="h-5 w-5 text-primary">🔒</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">For Compliance Officers</h3>
                    <p className="text-sm text-muted-foreground">
                      Ensure all partnerships meet institutional and regulatory requirements with our dedicated tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}