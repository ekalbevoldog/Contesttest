import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminFixTools from "@/components/AdminFixTools";

export default function SystemTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Configure platform parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="text-sm font-medium">Matching Algorithm Sensitivity</p>
                <p className="text-xs text-gray-500">Controls how strict matching criteria are applied</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Medium</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="text-sm font-medium">Notification Settings</p>
                <p className="text-xs text-gray-500">Email and push notification preferences</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="text-sm font-medium">API Rate Limiting</p>
                <p className="text-xs text-gray-500">Set maximum request rates for API endpoints</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">100/min</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="text-sm font-medium">Session Timeout</p>
                <p className="text-xs text-gray-500">Maximum inactive session duration</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">24 hours</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Access Controls</CardTitle>
          <CardDescription>Admin privileges and security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-gray-500">Require 2FA for admin accounts</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Enabled</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="text-sm font-medium">Admin Roles</p>
                <p className="text-xs text-gray-500">Configure access levels for admin users</p>
              </div>
              <Button variant="outline" size="sm">Manage Roles</Button>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="text-sm font-medium">Password Policy</p>
                <p className="text-xs text-gray-500">Requirements for password complexity</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Strong</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-md">
              <div>
                <p className="text-sm font-medium">Login Restrictions</p>
                <p className="text-xs text-gray-500">IP and device-based restrictions</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* System Repair Tools */}
      <div className="col-span-1 lg:col-span-2 mt-6">
        <AdminFixTools />
      </div>
    </div>
  );
}