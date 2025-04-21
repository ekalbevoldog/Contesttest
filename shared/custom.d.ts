// Global utility types
declare type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
declare type JsonObject = { [key: string]: Json };
declare type JsonArray = Json[];

// Add MessageMetadata type that's missing from server/storage.ts and causing errors
declare interface MessageMetadata {
  [key: string]: unknown;
}

// Make TypeScript more permissive about missing fields
declare interface AnyObject {
  [key: string]: any;
}

// Fix Express session type augmentation
declare namespace Express {
  interface Session {
    passport?: {
      user: string;
    };
    userId?: string;
    role?: string;
  }
}

// Fix WebSocket type augmentation
declare interface CustomWebSocket extends WebSocket {
  userData?: {
    role: 'athlete' | 'business' | 'compliance' | 'admin';
    userId?: string;
  };
}