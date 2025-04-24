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
import { AlertCircle, ArrowRight, Mail, UserPlus, Lock, Briefcase, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { FadeIn } from '@/components/animations/FadeIn';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  userType: z.enum(['athlete', 'business', 'compliance']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], 
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function SignIn() {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, userData, signIn, signUp, isLoading } = useSupabaseAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user && userData) {
      const role = userData.role;
      if (role === 'athlete') {
        navigate('/athlete/dashboard');
      } else if (role === 'business') {
        navigate('/business/dashboard');
      } else if (role === 'compliance') {
        navigate('/compliance/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        // Default fallback
        navigate('/');
      }
    }
  }, [user, userData, navigate]);
  
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
      confirmPassword: '',
      userType: 'athlete',
    },
  });
  
  // Handle login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    try {
      console.log("Starting login process for:", values.email);
      const { error } = await signIn(values.email, values.password);
      
      if (!error) {
        // Login successful, redirect happens via the auth provider
        console.log("Login successful, form will be reset");
        loginForm.reset();
      } else {
        console.error("Login error returned:", error);
      }
    } catch (e) {
      console.error("Unexpected login error:", e);
    }
  };
  
  // Handle register form submission
  const onRegisterSubmit = async (values: RegisterFormValues) => {
    const userData = {
      role: values.userType,
      email: values.email,
      fullName: values.email.split('@')[0] // Basic fallback name from email
    };
    
    try {
      console.log("Starting registration process for:", values.email, "with role:", values.userType);
      const { error, user } = await signUp(values.email, values.password, userData);
      
      if (!error && user) {
        // Registration successful
        console.log("Registration successful, user created:", user.id);
        registerForm.reset();
        
        // Use the user role from the response if available
        const userRole = user.role || values.userType;
        console.log("User role for redirection:", userRole);
        
        if (userRole === values.userType) {
          // User exists with right role or new user successfully created
          toast({
            title: 'Account ready',
            description: 'Redirecting to onboarding...',
          });
          
          // Redirect to onboarding flow
          navigate(`/onboarding?userType=${values.userType}`);
        } else {
          // User exists but with different role
          console.log("Role mismatch - expected:", values.userType, "got:", userRole);
          toast({
            title: 'Account exists with different role',
            description: `This email is already registered as a ${userRole}. Please use a different email or login.`,
            variant: 'destructive'
          });
          
          // Switch to login tab
          setActiveTab('login');
        }
      } else {
        console.error("Registration returned error:", error);
      }
    } catch (e: any) {
      // Error is already handled by the hook, but might want to do something else here
      console.error('Registration error in component:', e);
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
                      <CardDescription>Enter your email and password to access your dashboard</CardDescription>
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
                                    <Input placeholder="your@email.com" className="pl-10" {...field} />
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
                            disabled={loginForm.formState.isSubmitting || isLoading}
                            onClick={(e) => {
                              if (!loginForm.formState.isValid) {
                                // If form is invalid, let the form validation handle it
                                return;
                              }
                              // Otherwise submit the form
                              loginForm.handleSubmit(onLoginSubmit)(e);
                            }}
                          >
                            {loginForm.formState.isSubmitting || isLoading ? "Signing in..." : "Sign In"}
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
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input placeholder="your@email.com" className="pl-10" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={registerForm.control}
                            name="userType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Type</FormLabel>
                                <div className="grid grid-cols-3 gap-3">
                                  <Button
                                    type="button"
                                    variant={field.value === 'athlete' ? 'default' : 'outline'}
                                    className={`flex flex-col items-center justify-center h-20 ${field.value === 'athlete' ? 'ring-2 ring-primary' : ''}`}
                                    onClick={() => registerForm.setValue('userType', 'athlete')}
                                  >
                                    <User className="h-6 w-6 mb-1" />
                                    <span className="text-xs">Athlete</span>
                                  </Button>
                                  
                                  <Button
                                    type="button"
                                    variant={field.value === 'business' ? 'default' : 'outline'}
                                    className={`flex flex-col items-center justify-center h-20 ${field.value === 'business' ? 'ring-2 ring-primary' : ''}`}
                                    onClick={() => registerForm.setValue('userType', 'business')}
                                  >
                                    <Briefcase className="h-6 w-6 mb-1" />
                                    <span className="text-xs">Business</span>
                                  </Button>
                                  
                                  <Button
                                    type="button"
                                    variant={field.value === 'compliance' ? 'default' : 'outline'}
                                    className={`flex flex-col items-center justify-center h-20 ${field.value === 'compliance' ? 'ring-2 ring-primary' : ''}`}
                                    onClick={() => registerForm.setValue('userType', 'compliance')}
                                  >
                                    <AlertCircle className="h-6 w-6 mb-1" />
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
                          
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
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
                            disabled={registerForm.formState.isSubmitting || isLoading}
                            onClick={(e) => {
                              if (!registerForm.formState.isValid) {
                                // If form is invalid, let the form validation handle it
                                return;
                              }
                              // Otherwise submit the form
                              registerForm.handleSubmit(onRegisterSubmit)(e);
                            }}
                          >
                            {registerForm.formState.isSubmitting || isLoading ? "Creating account..." : "Create Account"}
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
          <div className="hidden md:flex items-center justify-center bg-muted rounded-lg p-8">
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
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">For Athletes</h3>
                    <p className="text-sm text-muted-foreground">
                      Showcase your talents and connect with brands that align 
                      with your values and aspirations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">For Businesses</h3>
                    <p className="text-sm text-muted-foreground">
                      Discover motivated athletes who can authentically represent your brand 
                      and connect with their engaged audience.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/20 p-2 rounded-full">
                    <AlertCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Compliance-Focused</h3>
                    <p className="text-sm text-muted-foreground">
                      Our platform helps ensure all partnerships adhere to collegiate 
                      athletics regulations and guidelines.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full group" onClick={() => navigate('/')}>
                Learn more about Contested
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}