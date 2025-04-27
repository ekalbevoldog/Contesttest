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
import { Mail, Lock, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { storeAuthData, isAuthenticated } from '@/lib/simple-auth';
import { FadeIn } from '@/components/animations/FadeIn';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['athlete', 'business', 'compliance', 'admin']).default('athlete'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  
  // Redirect to the unified login page
  useEffect(() => {
    navigate('/login');
  }, [navigate]);
  
  // Return nothing since we're redirecting
  return null;
  
  // Keep these variables to prevent TypeScript errors in the rest of the component
  const [activeTab, setActiveTab] = useState<string>('login');
  const { toast } = useToast();
  const { user, isLoading, signIn, signUp } = useSupabaseAuth();
  // Use the pending state directly from the mutations for better UX
  
  // Redirect if already logged in based on role
  useEffect(() => {
    // First check using simple auth
    const isLoggedIn = isAuthenticated();
    console.log('[AuthPage] Simple auth check:', isLoggedIn);
    
    if (isLoggedIn) {
      console.log('[AuthPage] User is authenticated via simple auth, redirecting...');
      navigate('/profile');
      return;
    }
    
    // Fallback to Supabase auth
    if (!user) return;
    
    // We have a logged-in user, redirect based on role
    const userRole = user.role || 'visitor';
    
    if (userRole === 'athlete') {
      navigate('/athlete/dashboard');
    } else if (userRole === 'business') {
      navigate('/business/dashboard');
    } else if (userRole === 'compliance') {
      navigate('/compliance/dashboard');
    } else if (userRole === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
  }, [user, navigate]);
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'athlete',
    },
  });
  
  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      // Use the signIn method from useSupabaseAuth hook
      const { error } = await signIn(values.email, values.password);
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message || "Unable to log in. Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Login error in component:', error);
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred during login.",
        variant: "destructive",
      });
    }
  };
  
  // Handle register form submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    try {
      // Use the signUp method from useSupabaseAuth hook
      // Format the data according to the modified registerUser function in supabase-client.ts
      const { error } = await signUp(values.email, values.password, {
        fullName: `${values.firstName} ${values.lastName}`,
        role: values.role
      });
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message || "Unable to create account. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration successful",
          description: "We've created your account. You can now log in.",
        });
        setActiveTab('login');
      }
    } catch (error: any) {
      console.error('Registration error in component:', error);
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred during registration.",
        variant: "destructive",
      });
    }
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
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="your@email.com" type="email" className="pl-10" {...field} />
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
                          
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={isLoading}
                          >
                            {isLoading ? (
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
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="John" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="Doe" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input type="email" placeholder="your@email.com" className="pl-10" {...field} />
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
                          
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={isLoading}
                          >
                            {isLoading ? (
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