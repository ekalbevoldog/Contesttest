
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';

export default function TestOnboarding() {
  const [sessionId, setSessionId] = useState<string>('');
  const [userId, setUserId] = useState<string>('test-user-' + Date.now());
  const [userType, setUserType] = useState<string>('business');
  const [name, setName] = useState<string>('Test User');
  const [email, setEmail] = useState<string>('test@example.com');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  const { toast } = useToast();
  
  // Generate a session ID on load
  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await fetch('/api/session/new');
        const data = await response.json();
        if (data.sessionId) {
          setSessionId(data.sessionId);
          toast({
            title: "Session Created",
            description: `Created session: ${data.sessionId}`
          });
        }
      } catch (error) {
        console.error("Error creating session:", error);
        setSessionId(`local-${Date.now()}`);
      }
    };
    
    createSession();
  }, []);
  
  // Test profile creation
  const testProfileCreation = async () => {
    setLoading(true);
    try {
      // First test with debug endpoint
      const debugResponse = await fetch('/api/debug/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType, sessionId, name, email })
      });
      
      const debugResult = await debugResponse.json();
      setTestResult(debugResult);
      
      if (debugResponse.ok) {
        toast({
          title: "Debug Test Passed",
          description: "All required fields are present"
        });
        
        // Now attempt actual profile creation
        const profileData = {
          userId,
          userType,
          sessionId,
          name,
          email,
          // Add minimal required fields based on user type
          ...(userType === 'athlete' ? {
            sport: "Basketball",
            division: "Division I",
            school: "Test University",
            followerCount: "1000",
            contentStyle: "This is my content style for testing purposes. I create engaging content.",
            compensationGoals: "My compensation goals are to earn money through sponsored content."
          } : {
            businessType: "product",
            industry: "Retail",
            budgetMin: 500,
            budgetMax: 5000
          })
        };
        
        try {
          const profileResponse = await fetch('/api/supabase/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
          });
          
          if (profileResponse.ok) {
            const profileResult = await profileResponse.json();
            setTestResult({
              ...debugResult,
              profileCreation: {
                success: true,
                data: profileResult
              }
            });
            
            toast({
              title: "Profile Created",
              description: "Successfully created test profile"
            });
          } else {
            const errorText = await profileResponse.text();
            setTestResult({
              ...debugResult,
              profileCreation: {
                success: false,
                error: errorText
              }
            });
            
            toast({
              title: "Profile Creation Failed",
              description: errorText,
              variant: "destructive"
            });
          }
        } catch (profileError) {
          console.error("Error creating profile:", profileError);
          setTestResult({
            ...debugResult,
            profileCreation: {
              success: false,
              error: profileError instanceof Error ? profileError.message : String(profileError)
            }
          });
          
          toast({
            title: "Profile Creation Error",
            description: profileError instanceof Error ? profileError.message : String(profileError),
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Debug Test Failed",
          description: debugResult.error || "Missing required fields",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error testing profile creation:", error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Onboarding Flow</CardTitle>
          <CardDescription>
            Use this page to test the onboarding profile creation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionId">Session ID</Label>
            <Input 
              id="sessionId" 
              value={sessionId} 
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Session ID" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input 
              id="userId" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="userType">User Type</Label>
            <select 
              id="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-gray-800"
            >
              <option value="athlete">Athlete</option>
              <option value="business">Business</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Name" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email" 
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={testProfileCreation} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Testing..." : "Test Profile Creation"}
          </Button>
        </CardFooter>
      </Card>
      
      {testResult && (
        <Card className="max-w-md mx-auto mt-6">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
