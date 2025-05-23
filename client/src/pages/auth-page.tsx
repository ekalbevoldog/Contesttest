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
import { useAuth } from '@/hooks/use-auth';
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
  const [activeTab, setActiveTab] = useState<string>('login');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  // Use the pending state directly from the mutations for better UX
  
  // Redirect if already logged in based on role
  useEffect(() => {
    console.log('[AuthPage] Auth check for redirection...');
    
    // If we're still loading auth data, don't redirect yet
    if (isLoading) {
      console.log('[AuthPage] Auth data still loading, waiting...');
      return;
    }
    
    // Enhanced redirection function that centralizes logic for cleaner code
    const redirectBasedOnRole = (role: string) => {
      console.log('[AuthPage] Redirecting based on role:', role);
      
      if (role === 'athlete') {
        navigate('/athlete/dashboard');
      } else if (role === 'business') {
        navigate('/business/dashboard');
      } else if (role === 'compliance') {
        navigate('/compliance/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        // If no specific role match, navigate to profile which has its own routing logic
        navigate('/profile');
      }
    };
    
    // First check if the user is authenticated from the auth provider
    if (user) {
      console.log('[AuthPage] User authenticated from auth provider');
      // We have a logged-in user, redirect based on role
      // Check for both role and userType properties since the API returns userType
      const userRole = user.role || user.userType || 'visitor';
      console.log('[AuthPage] Detected user role/type from auth provider:', userRole);
      redirectBasedOnRole(userRole);
      return;
    }
    
    // Check simple auth as a fallback
    const isLoggedIn = isAuthenticated();
    console.log('[AuthPage] Simple auth check:', isLoggedIn);
    
    if (isLoggedIn) {
      console.log('[AuthPage] User is authenticated via simple auth, checking role...');
      // Get the stored role if available
      const authData = localStorage.getItem('contestedUserData');
      if (authData) {
        try {
          const userData = JSON.parse(authData);
          
          // Handle cases where we have authenticated flag from our improved auth utilities
          if (userData.authenticated === false) {
            console.log('[AuthPage] userData.authenticated is explicitly false, ignoring cached data');
            return; // Stay on auth page
          }
          
          const role = userData.userType || userData.role;
          if (role) {
            console.log('[AuthPage] Found role in cached data:', role);
            redirectBasedOnRole(role);
            return;
          }
          
          // If we have user data but no role, check if there's a user object
          if (userData.user) {
            const userRole = userData.user.role || userData.user.userType || 'visitor';
            console.log('[AuthPage] Found role in user object:', userRole);
            redirectBasedOnRole(userRole);
            return;
          }
          
          // If we have id but no role information, just go to profile
          if (userData.id) {
            console.log('[AuthPage] User data has ID but no role, redirecting to profile');
            navigate('/profile');
            return;
          }
        } catch (e) {
          console.error('[AuthPage] Error parsing stored user data:', e);
        }
      }
    }
    
    // User is not authenticated, stay on auth page
    console.log('[AuthPage] No valid authentication found, staying on auth page');
  }, [user, navigate, isLoading]);
  
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
      // Use the loginMutation from useAuth hook
      loginMutation.mutate({
        email: values.email,
        password: values.password
      }, {
        onSuccess: (data) => {
          console.log('[AuthPage] Login successful, directing to dashboard');
          console.log('[AuthPage] Login response data keys:', Object.keys(data || {}));
          
          // Check if authentication was successful
          if (!data?.authenticated) {
            console.error('[AuthPage] Login response indicates not authenticated');
            toast({
              title: "Login error",
              description: "Authentication failed. Please try again.",
              variant: "destructive",
            });
            return;
          }
          
          // Handle different response formats
          let user = null;
          if (data.user) {
            user = data.user;
          }
          
          // Determine role from various possible locations in the response
          let role = null;
          
          // First try to get it from the user object
          if (user) {
            role = user.role || 
                   user.userType || 
                   user.user_metadata?.role || 
                   user.user_metadata?.userType;
          }
          
          // If no role found in user object, check the redirectTo property
          if (!role && data.redirectTo) {
            // Extract role from redirect URL if it follows pattern /role/dashboard
            const match = data.redirectTo.match(/^\/([^\/]+)\/dashboard/);
            if (match && match[1]) {
              role = match[1];
            }
          }
          
          // Last resort - check localStorage
          if (!role) {
            role = localStorage.getItem('userRole');
          }
          
          console.log('[AuthPage] Detected role for redirect:', role);
          
          // Redirect based on role or use redirectTo if provided
          if (data.redirectTo) {
            console.log('[AuthPage] Using provided redirectTo:', data.redirectTo);
            navigate(data.redirectTo);
          } else if (role) {
            console.log('[AuthPage] Redirecting based on role:', role);
            if (role === 'athlete') {
              navigate('/athlete/dashboard');
            } else if (role === 'business') {
              navigate('/business/dashboard');
            } else if (role === 'compliance') {
              navigate('/compliance/dashboard');
            } else if (role === 'admin') {
              navigate('/admin/dashboard');
            } else {
              // Fallback
              navigate('/profile');
            }
          } else {
            // No role found, go to profile page
            console.log('[AuthPage] No role found, redirecting to profile');
            navigate('/profile');
          }
          
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
        },
        onError: (error) => {
          console.error('Login error in component:', error);
          toast({
            title: "Login failed",
            description: error.message || "Unable to log in. Please check your credentials and try again.",
            variant: "destructive",
          });
        }
      });
    } catch (error: any) {
      console.error('Unexpected login error in component:', error);
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
      // Use the registerMutation from useAuth hook
      registerMutation.mutate({
        email: values.email,
        password: values.password,
        fullName: `${values.firstName} ${values.lastName}`,
        role: values.role
      }, {
        onSuccess: (data) => {
          console.log('[AuthPage] Registration successful, response keys:', Object.keys(data || {}));
          
          // Check if authentication was successful
          if (!data?.authenticated) {
            console.error('[AuthPage] Registration response indicates not authenticated');
            toast({
              title: "Registration error",
              description: "Account created but authentication failed. Please try logging in.",
              variant: "destructive",
            });
            // Switch to login tab
            setActiveTab('login');
            return;
          }
          
          // Get user information from response
          const user = data?.user;
          
          // Store the user role in localStorage for persistence
          localStorage.setItem('userRole', values.role);
          
          toast({
            title: "Registration successful",
            description: "Your account has been created. Welcome!",
          });
          
          // Determine where to redirect - use provided redirect URL if available
          if (data.redirectTo) {
            console.log('[AuthPage] Using provided redirectTo:', data.redirectTo);
            navigate(data.redirectTo);
          } else {
            // Redirect based on role
            if (values.role === 'athlete') {
              navigate('/athlete/dashboard');
            } else if (values.role === 'business') {
              navigate('/business/dashboard');
            } else if (values.role === 'compliance') {
              navigate('/compliance/dashboard');
            } else if (values.role === 'admin') {
              navigate('/admin/dashboard');
            } else {
              // Fallback
              navigate('/profile');
            }
          }
        },
        onError: (error) => {
          console.error('Registration error in component:', error);
          toast({
            title: "Registration failed",
            description: error.message || "Unable to create account. Please try again.",
            variant: "destructive",
          });
        }
      });
    } catch (error: any) {
      console.error('Unexpected registration error in component:', error);
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