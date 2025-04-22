import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import SupabaseConnectionTest from "@/components/SupabaseConnectionTest";

export default function SupabaseTest() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Supabase Connectivity Test</h1>
        <Button variant="outline" asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <div className="col-span-1">
          <SupabaseConnectionTest />
        </div>
        
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h2 className="text-xl font-semibold mb-4">About This Test</h2>
          <p className="text-zinc-400 mb-4">
            This page tests the connection between the client-side application and Supabase. 
            A successful connection indicates that your Supabase setup is working properly and 
            the frontend can communicate with your Supabase instance.
          </p>
          <h3 className="text-lg font-semibold mb-2">What We're Testing:</h3>
          <ul className="list-disc pl-5 text-zinc-400 space-y-2">
            <li>Client-side Supabase connection using environment variables</li>
            <li>Ability to query the sessions table</li>
            <li>Authentication of requests with Supabase API key</li>
          </ul>
        </div>
      </div>
    </div>
  );
}