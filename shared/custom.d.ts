/**
 * Custom type declarations for third-party modules and project extensions
 * 
 * This file provides TypeScript declarations for modules that don't have their own
 * declaration files or need augmentation for project-specific functionality.
 */

// ===== Common Node modules without declaration files =====
declare module 'morgan';
declare module 'cors';
declare module 'micro' {
  export function buffer(req: import('express').Request): Promise<Buffer>;
  export function text(req: import('express').Request): Promise<string>;
  export function json(req: import('express').Request): Promise<any>;
}

// ===== Extension to Express types =====
declare namespace Express {
  export interface Request {
    rawBody?: string | Buffer;
    user?: any; // User data from auth middleware
    userId?: string;
    userRole?: string;
    session?: any;
    isAuthenticated?: () => boolean;
  }
}

// ===== Local module declarations =====
declare module './runCompleteMigration.js' {
  export function runCompleteMigration(): Promise<boolean>;
}

// ===== Module augmentations =====
declare module 'connect-pg-simple' {
  import session from 'express-session';
  export default function(options?: any): (
    options?: session.SessionOptions
  ) => session.Store;
}

// ===== Supabase type extensions =====
import { SupabaseClient } from '@supabase/supabase-js';

declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    // Session-related methods
    createSession(session: any): Promise<any>;
    getSession(id: string): Promise<any>;
    updateSession(id: string, data: any): Promise<any>;
    deleteSession(id: string): Promise<any>;
  }
}

// ===== Storage interface extensions =====
interface SupabaseStorage {
  // User subscription methods
  updateUserSubscription(userId: string, data: any): Promise<any>;
  createSubscriptionHistory(data: any): Promise<any>;
  getUserByStripeSubscriptionId(subscriptionId: string): Promise<any>;
  
  // User management methods
  getUserById(id: string): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  createUser(userData: any): Promise<any>;
  updateUser(id: string, data: any): Promise<any>;
  deleteUser(id: string): Promise<any>;
  
  // Profile management methods
  getAthleteProfile(id: string): Promise<any>;
  getBusinessProfile(id: string): Promise<any>;
  updateAthleteProfile(id: string, data: any): Promise<any>;
  updateBusinessProfile(id: string, data: any): Promise<any>;
  
  // Session management
  createUserSession(userData: any): Promise<any>;
  deleteUserSession(sessionId: string): Promise<any>;
  
  // Administrative functions
  getAdminById(id: string): Promise<any>; 
  createAdmin(data: any): Promise<any>;
  updateAdmin(id: string, data: any): Promise<any>;
  deleteAdmin(id: string): Promise<any>;
  getAllAdmins(): Promise<any[]>;
  
  // Compliance officer functions
  getComplianceOfficerById(id: string): Promise<any>;
  createComplianceOfficer(data: any): Promise<any>;
  updateComplianceOfficer(id: string, data: any): Promise<any>;
  deleteComplianceOfficer(id: string): Promise<any>;
  getAllComplianceOfficers(): Promise<any[]>;
  
  // Campaign and content management
  createCampaign(data: any): Promise<any>;
  updateCampaign(id: string, data: any): Promise<any>;
  deleteCampaign(id: string): Promise<any>;
  getCampaignById(id: string): Promise<any>;
  getAllCampaigns(filters?: any): Promise<any[]>;
  getUserCampaigns(userId: string): Promise<any[]>;
  
  // Analytics methods
  recordAnalyticEvent(data: any): Promise<any>;
  getAnalyticsByUserId(userId: string): Promise<any[]>;
  getAnalyticsByCampaignId(campaignId: string): Promise<any[]>;
  getGlobalAnalytics(timeRange?: string): Promise<any>;
}

// Ensure access to Stripe's key version
declare module 'stripe' {
  interface StripeConstructorOptions {
    apiVersion?: string;
  }
}

// ===== Vite server configuration types =====
declare module 'vite' {
  interface ServerOptions {
    // Extend to allow boolean for allowedHosts
    allowedHosts?: boolean | string | true | string[];
  }
}

// Export the extended storage interface 
declare global {
  interface Window {
    SUPABASE_URL?: string;
    SUPABASE_KEY?: string;
  }
  
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      DATABASE_URL?: string;
      SUPABASE_URL?: string;
      SUPABASE_KEY?: string;
      SESSION_SECRET?: string;
      STRIPE_SECRET_KEY?: string;
      STRIPE_WEBHOOK_SECRET?: string;
    }
  }
}