import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const N8nConfig = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Integration Configuration</CardTitle>
          <CardDescription>
            This feature has been disabled as part of database disconnection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            All external integrations have been disabled. No data will be sent to external services.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Back to Dashboard</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default N8nConfig;