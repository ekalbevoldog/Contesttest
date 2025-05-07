// Type definitions for Express session
import { User as AppUser } from '../../../shared/schema';

declare global {
  namespace Express {
    // User is already defined in auth.ts, but we'll provide an external reference here
    // to avoid type clashes in other parts of the code
    interface User {
      id: string;
    }
    
    interface Session {
      passport?: {
        user: string;
      };
      userType?: string;
      profileId?: number | string;
      profileCompleted?: boolean;
      // Additional fields for compatibility
      Id?: string | number;
      sessionId?: string;
      athleteId?: number;
      businessId?: number;
      data?: Record<string, any>;
      // DateFields compatibility
      lastLogin?: Date;
      createdAt?: Date;
      updatedAt?: Date;
    }
  }
}