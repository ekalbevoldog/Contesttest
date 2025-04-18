import React from 'react';
import { FadeIn, AnimatedGradient } from '@/components/animations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const N8nConfig: React.FC = () => {
  return (
    <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background */}
      <AnimatedGradient 
        className="absolute inset-0 z-0"
        colors={['hsl(345, 90%, 55%)', 'hsl(235, 80%, 60%)', 'hsl(195, 80%, 60%)']}
      />
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <FadeIn className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-white">
            n8n Integration Configuration
          </h1>
          <p className="text-xl text-gray-200">
            Connect Contested to your n8n workflow automation instance
          </p>
        </FadeIn>

        <Card className="backdrop-blur-xl bg-white/10 border-none shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Connection Details</CardTitle>
            <CardDescription className="text-gray-200">
              Enter your n8n webhook details to enable automated workflows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhook_url" className="text-white">Webhook URL</Label>
                <Input 
                  id="webhook_url" 
                  placeholder="https://n8n.example.com/webhook/..." 
                  className="bg-white/20 border-gray-500 text-white placeholder-gray-400" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api_key" className="text-white">API Key</Label>
                <Input 
                  id="api_key" 
                  type="password" 
                  placeholder="Your n8n API key" 
                  className="bg-white/20 border-gray-500 text-white placeholder-gray-400" 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="workflow_id" className="text-white">Workflow ID</Label>
                <Input 
                  id="workflow_id" 
                  placeholder="123e4567-e89b-12d3-a456-426614174000" 
                  className="bg-white/20 border-gray-500 text-white placeholder-gray-400" 
                />
              </div>
              
              <div className="pt-4">
                <Button 
                  type="button" 
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white"
                >
                  Save Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default N8nConfig;