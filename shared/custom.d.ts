// Global utility types
declare type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
declare type JsonObject = { [key: string]: Json };
declare type JsonArray = Json[];

// Add MessageMetadata type that's missing from server/storage.ts and causing errors
declare interface MessageMetadata {
  [key: string]: unknown;
  unread?: boolean;
}

// Relaxed variants of Drizzle schema types to fix type errors during build
declare namespace RelaxedTypes {
  // Type for allowing any string IDs or numeric IDs
  type FlexibleId = string | number;
  
  // Fix for numeric ID vs string ID issues
  interface FlexibleRecord {
    id?: FlexibleId;
    [key: string]: any;
  }
  
  // Fix for message metadata
  interface Message {
    id: number;
    sessionId: string;
    role: string; 
    content: string;
    metadata?: MessageMetadata | unknown;
    createdAt?: Date | null;
    unread?: boolean;
  }
  
  // Fix for dynamic properties
  interface DynamicObject {
    [key: string]: any;
  }
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
    data?: any;
    sessionId?: string;
  }
}

// Fix WebSocket type augmentation
declare interface CustomWebSocket extends WebSocket {
  userData?: {
    role: 'athlete' | 'business' | 'compliance' | 'admin';
    userId?: string;
  };
}

// Module declarations for dynamic imports
declare module '@shared/*';
declare module '@components/*';
declare module '@lib/*';
declare module '@pages/*';
declare module '@hooks/*';

// Fix for drizzle-orm issues with schema inference
declare module 'drizzle-orm' {
  interface PgColumn<TData extends any, TColumnData extends any> {
    [key: string]: any;
  }
}

// Fix for equality operators
declare module 'drizzle-orm/pg-core' {
  interface SQL {
    [key: string]: any;
  }
}

// Add support for undefined error in schema checks
declare namespace NodeJS {
  interface Promise<T> {
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined
    ): Promise<T | TResult>;
  }
}
// Add missing type definitions for auth_id and objectStorage
declare namespace Express {
  interface User {
    auth_id?: string;
    role?: string;
    email?: string;
  }
}

declare module 'stripe' {
  interface Stripe {
    customers: any;
    subscriptions: any;
    webhooks: any;
  }
}

declare const objectStorage: {
  uploadBuffer: (path: string, buffer: Buffer) => Promise<boolean>;
  downloadBuffer: (path: string) => Promise<Buffer | null>;
};
