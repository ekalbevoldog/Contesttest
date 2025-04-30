import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Database, Wrench } from 'lucide-react';

/**
 * AdminFixTools Component
 * 
 * This component provides admin-only tools to fix various issues in the system.
 * Currently includes:
 * - Fix business profiles table structure (adds id column if missing)
 */
export default function AdminFixTools() {
  const [isFixingBusinessProfiles, setIsFixingBusinessProfiles] = useState(false);
  const [businessProfilesResult, setBusinessProfilesResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  
  const { toast } = useToast();
  
  const fixBusinessProfilesTable = async () => {
    try {
      setIsFixingBusinessProfiles(true);
      setBusinessProfilesResult(null);
      
      const response = await fetch('/api/fix-business-profiles-table', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      setBusinessProfilesResult(result);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Fixed business profiles table successfully",
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fix business profiles table",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fixing business profiles table:', error);
      setBusinessProfilesResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast({
        title: "Operation Failed",
        description: "Could not complete the table fix operation",
        variant: "destructive"
      });
    } finally {
      setIsFixingBusinessProfiles(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          System Repair Tools
        </CardTitle>
        <CardDescription>
          Tools to fix structural issues with the database and application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" />
                Fix Business Profiles Table
              </h3>
              <p className="text-sm text-gray-500">
                Adds an ID column to the business_profiles table if it's missing
              </p>
            </div>
            <Button 
              onClick={fixBusinessProfilesTable}
              disabled={isFixingBusinessProfiles}
              variant="outline"
            >
              {isFixingBusinessProfiles ? 'Fixing...' : 'Fix Table'}
            </Button>
          </div>
          
          {businessProfilesResult && (
            <div className={`p-3 rounded-lg ${businessProfilesResult.success ? 'bg-green-50' : 'bg-red-50'} mt-2`}>
              <div className="flex items-start gap-2">
                {businessProfilesResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">
                    {businessProfilesResult.success ? 'Success' : 'Error'}
                  </p>
                  <p className="text-sm">
                    {businessProfilesResult.message || businessProfilesResult.error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}