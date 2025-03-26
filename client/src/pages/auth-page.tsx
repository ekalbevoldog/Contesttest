import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, Lock, Mail, User, UserPlus } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUserType, setRegisterUserType] = useState<"athlete" | "business" | "compliance" | "">("");
  
  // Set up event listeners for redirection
  useEffect(() => {
    // Handle registration - redirect to onboarding
    const handleRegistration = (event: CustomEvent) => {
      navigate("/dynamic-onboarding");
    };

    // Handle login - redirect to dashboard
    const handleLogin = (event: CustomEvent) => {
      navigate("/dashboard");
    };

    // Add event listeners for both events
    window.addEventListener("contestedRegistration", handleRegistration as EventListener);
    window.addEventListener("contestedLogin", handleLogin as EventListener);

    // If user is already logged in (from a previous session), redirect to dashboard
    if (user) {
      navigate("/dashboard");
    }

    // Clean up event listeners
    return () => {
      window.removeEventListener("contestedRegistration", handleRegistration as EventListener);
      window.removeEventListener("contestedLogin", handleLogin as EventListener);
    };
  }, [user, navigate]);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username: loginUsername,
      password: loginPassword,
    });
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUserType) {
      return;
    }
    
    registerMutation.mutate({
      username: registerUsername,
      password: registerPassword,
      email: registerEmail,
      userType: registerUserType as "athlete" | "business" | "compliance",
    });
  };
  
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Hero Section */}
      <div className="hidden md:flex flex-col p-10 text-white bg-black">
        <div className="grow flex flex-col items-start justify-center space-y-8 max-w-md">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">Contested</span> - Elevate Your NIL Game
            </h1>
            <p className="text-zinc-400 text-lg">
              Connect mid-tier athletes with SMBs for authentic, meaningful partnerships
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 bg-red-500/20 p-1 rounded-full">
                <ChevronRight className="h-5 w-5 text-red-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Smart Matching</h3>
                <p className="text-zinc-400 text-sm">Our AI-powered algorithm connects the right athletes with the right brands.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 bg-red-500/20 p-1 rounded-full">
                <ChevronRight className="h-5 w-5 text-red-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Streamlined Compliance</h3>
                <p className="text-zinc-400 text-sm">Built-in tools for NIL compliance officers to review and approve partnerships.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 bg-red-500/20 p-1 rounded-full">
                <ChevronRight className="h-5 w-5 text-red-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Real Growth, Real Results</h3>
                <p className="text-zinc-400 text-sm">Create authentic partnerships that drive measurable value for both parties.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Forms */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2 md:hidden">
            <h1 className="text-3xl font-bold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
                Contested
              </span>
            </h1>
            <p className="text-muted-foreground">The NIL platform for mid-tier athletes and SMBs</p>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login to Contested</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs text-amber-600 dark:text-amber-400">
                    <strong>Demo Accounts:</strong> Use username "athlete1", "business1", or "compliance1" with password "password123"
                  </div>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username or Email</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="login-username"
                          type="text"
                          placeholder="Your username or email"
                          className="pl-10"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Your password"
                          className="pl-10"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Fill out the form to join Contested</CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="register-username"
                          type="text"
                          placeholder="Choose a username"
                          className="pl-10"
                          value={registerUsername}
                          onChange={(e) => setRegisterUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Your email address"
                          className="pl-10"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Create a password"
                          className="pl-10"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-user-type">I am a</Label>
                      <Select 
                        value={registerUserType} 
                        onValueChange={(value) => setRegisterUserType(value as any)}
                        required
                      >
                        <SelectTrigger id="register-user-type" className="w-full">
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="athlete">College Athlete</SelectItem>
                          <SelectItem value="business">Business/Brand</SelectItem>
                          <SelectItem value="compliance">Compliance Officer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600"
                      disabled={registerMutation.isPending || !registerUserType}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}