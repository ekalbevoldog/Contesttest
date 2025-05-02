// Type definitions for Express session
import { User as AppUser } from '../../../shared/schema';

declare global {
  namespace Express {
    interface User extends AppUser {
      // Make sure id is required in Express.User
      id: string;
    }

    interface Session {
      passport?: {
        user: string;
      };
      userType?: string;
      profileId?: number;
      profileCompleted?: boolean;
    }
  }
}