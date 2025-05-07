import { 
  InsertSession, InsertAthlete, InsertBusiness, 
  InsertCampaign, InsertMatch, InsertMessage, InsertUser, InsertFeedback, InsertPartnershipOffer,
  Session, Athlete, Business, Campaign, Match, Message, User, Feedback, PartnershipOffer
} from "@shared/schema.js";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import { supabase, supabaseAdmin } from "./supabase.js";
// NEW — right under your other imports
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

// Helper for password hashing
const scryptAsync = promisify(scrypt);

// Password hashing function
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Interface for storage operations
export interface IStorage {
  // Session operations
  getSession(sessionId: string): Promise<Session | undefined>;
  getSessionByUserId(userId: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(sessionId: string, data: Partial<Session>): Promise<Session>;
  deleteSession(sessionId: string): Promise<void>;

  // Athlete operations
  getAthlete(id: number): Promise<Athlete | undefined>;
  getAthleteBySession(sessionId: string): Promise<Athlete | undefined>;
  getAthleteByUserId(userId: string): Promise<Athlete | undefined>;
  storeAthleteProfile(athlete: InsertAthlete): Promise<Athlete>;
  getAllAthletes(): Promise<Athlete[]>;

  // Business operations
  getBusiness(id: number): Promise<Business | undefined>;
  getBusinessBySession(sessionId: string): Promise<Business | undefined>;
  getBusinessByUserId(userId: string): Promise<Business | undefined>;
  storeBusinessProfile(business: InsertBusiness): Promise<Business>;
  getAllBusinesses(): Promise<Business[]>;

  // Campaign operations
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaignsByBusiness(businessId: number): Promise<Campaign[]>;
  storeCampaign(campaign: InsertCampaign): Promise<Campaign>;

  // Match operations
  getMatch(id: number): Promise<Match | undefined>;
  getMatchesForAthlete(athleteId: number): Promise<Match[]>;
  getMatchesForBusiness(businessId: number): Promise<Match[]>;
  storeMatch(match: InsertMatch): Promise<Match>;
  getAllMatches(): Promise<Match[]>;

  // Partnership Offer operations
  getPartnershipOffer(id: number): Promise<PartnershipOffer | undefined>;
  getPartnershipOffersByAthlete(athleteId: number): Promise<PartnershipOffer[]>;
  getPartnershipOffersByBusiness(businessId: number): Promise<PartnershipOffer[]>;
  getPartnershipOffersByMatch(matchId: number): Promise<PartnershipOffer | undefined>;
  createPartnershipOffer(offer: InsertPartnershipOffer): Promise<PartnershipOffer>;
  updatePartnershipOfferStatus(id: number, status: string): Promise<PartnershipOffer>;
  markPartnershipOfferViewed(id: number): Promise<PartnershipOffer>;
  updatePartnershipOfferComplianceStatus(id: number, status: string, notes?: string): Promise<PartnershipOffer>;

  // Message operations
  getMessages(sessionId: string, limit?: number, offset?: number): Promise<Message[]>;
  storeMessage(sessionId: string, role: string, content: string, metadata?: any): Promise<Message>;
  getUnreadMessageCounts(sessionId: string): Promise<number>;
  markMessagesRead(sessionId: string, messageIds: number[]): Promise<void>;

  // Auth operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAuthId(authId: string): Promise<User | undefined>; // New method to find user by Supabase Auth ID
  getAllUsers(): Promise<User[]>;
  createUser(insertUser: Partial<InsertUser>): Promise<User>;
  updateUser(userId: string, userData: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: string, data: { customerId: string, subscriptionId: string }): Promise<User>;
  // Password-related operations (separate from user table)
  getPasswordHash(userId: string): Promise<string | null>;
  storePasswordHash(userId: string, passwordHash: string): Promise<void>;
  verifyPassword(password: string, storedPassword: string): Promise<boolean>;

  // Feedback operations
  getFeedback(id: number): Promise<Feedback | undefined>;
  getFeedbackByUser(userId: string): Promise<Feedback[]>; // Updated to use string IDs
  getFeedbackByMatch(matchId: number): Promise<Feedback[]>;
  getFeedbackByType(feedbackType: string): Promise<Feedback[]>;
  getPublicFeedback(): Promise<Feedback[]>;
  storeFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(feedbackId: number, status: string): Promise<Feedback>;
  addAdminResponse(feedbackId: number, response: string): Promise<Feedback>;

  // Session Store for Express Session
  sessionStore: session.Store;
}

/**
 * SupabaseStorage provides an implementation of the IStorage interface using Supabase client APIs
 */
export class SupabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    try {
      // Initialize in-memory session store by default
      this.sessionStore = new session.MemoryStore();
      console.log("Using in-memory session store initially");
      
      // Attempt to create Supabase-based session store asynchronously
      this.initSupabaseSessionStore();
    } catch (err) {
      console.error("Failed to initialize session store:", err);
      // Ensure we have a memory store as fallback
      this.sessionStore = new session.MemoryStore();
      console.log("Using in-memory session store as fallback");
    }
  }
  
  // Create a custom session store that uses Supabase
  private async initSupabaseSessionStore() {
    // Define a custom session store class that uses Supabase
    const SupabaseSessionStore = class extends session.Store {
      // Get a session by ID
      async get(sid: string, callback: (err: any, session?: any) => void) {
        try {
          const { data, error } = await supabase
            .from('session')
            .select('sess, expire')
            .eq('sid', sid)
            .single();
          
          if (error || !data) {
            return callback(null);
          }
          
          // Check if session is expired
          if (new Date(data.expire) < new Date()) {
            await this.destroy(sid, () => {});
            return callback(null);
          }
          
          return callback(null, data.sess);
        } catch (err) {
          return callback(err);
        }
      }
      
      // Set/update a session
      async set(sid: string, session: any, callback?: (err?: any) => void) {
        try {
          // Calculate expiration
          const expire = new Date(Date.now() + (session.cookie.maxAge || 86400000));
          
          const { error } = await supabaseAdmin.from('session').upsert({
            sid,
            sess: session,
            expire
          }, { onConflict: 'sid' });
          
          if (error) {
            console.error("Error saving session:", error);
            return callback?.(error);
          }
          
          return callback?.();
        } catch (err) {
          return callback?.(err);
        }
      }
      
      // Destroy a session
      async destroy(sid: string, callback?: (err?: any) => void) {
        try {
          const { error } = await supabaseAdmin
            .from('session')
            .delete()
            .eq('sid', sid);
          
          if (error) {
            console.error("Error destroying session:", error);
            return callback?.(error);
          }
          
          return callback?.();
        } catch (err) {
          return callback?.(err);
        }
      }
      
      // Touch/update a session's expiration
      async touch(sid: string, session: any, callback?: (err?: any) => void) {
        try {
          const expire = new Date(Date.now() + (session.cookie.maxAge || 86400000));
          
          const { error } = await supabaseAdmin
            .from('session')
            .update({ expire })
            .eq('sid', sid);
          
          if (error) {
            console.error("Error touching session:", error);
            return callback?.(error);
          }
          
          return callback?.();
        } catch (err) {
          return callback?.(err);
        }
      }
    };
    
    try {
      console.log("Checking if session table exists in Supabase...");
      
      let tableExists = false;
      
      try {
        // Check if the session table exists using Supabase API
        const { error: tableCheckError } = await supabase.from('session').select('count').limit(1);
        tableExists = !tableCheckError;
        console.log(`Session table exists check result: ${tableExists}`);
      } catch (supabaseError) {
        console.error("Error checking if session table exists with Supabase:", supabaseError);
      }
      
      if (!tableExists) {
        console.log("Session table does not exist, creating it via Supabase RPC...");
        
        try {
          // Try to create the table using Supabase RPC (admin access)
          const { error: createError } = await supabaseAdmin.rpc('exec_sql', { 
            sql: `
              CREATE TABLE IF NOT EXISTS "session" (
                "sid" varchar NOT NULL,
                "sess" json NOT NULL,
                "expire" timestamp(6) NOT NULL,
                CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
              );
              CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
            `
          });
          
          if (createError) {
            console.error("Error creating session table:", createError);
            // Continue using memory store
            return;
          }
          
          console.log("Session table created successfully via Supabase");
          
          // Now that table exists, create the custom session store
          this.sessionStore = new SupabaseSessionStore();
          console.log("Supabase session store initialized with table creation");
        } catch (err) {
          console.error("Exception creating session table:", err);
          // Continue using memory store
          return; 
        }
      } else {
        console.log("Session table exists in Supabase, connecting to it");
        
        // Table exists, use the custom session store
        this.sessionStore = new SupabaseSessionStore();
        console.log("Supabase session store initialized successfully");
      }
    } catch (err) {
      console.error("Failed to initialize Supabase session store:", err);
      console.log("Continuing with in-memory session store");
      // Memory store continues to be used (already set in constructor)
    }
  }

  // Session operations
  async getSession(sessionId: string): Promise<Session | undefined> {
    try {
      // First check the connect-pg-simple 'session' table (used for auth)
      const { data: sessionData, error: sessionError } = await supabase
        .from('session')
        .select('*')
        .eq('sid', sessionId)
        .single();
        
      if (!sessionError && sessionData) {
        console.log('Found session in connect-pg-simple table:', sessionData.sid);
        // This is a connect-pg-simple session, not our custom format
        // We don't map it to our Session type as it's handled by the session middleware
        return undefined;
      }
        
      // If not found in connect-pg-simple table, try our custom sessions table
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        
      if (error) {
        console.error('Error getting session:', error);
        return undefined;
      }
      
      return this.mapSessionFromDb(data);
    } catch (error) {
      console.error('Exception getting session:', error);
      return undefined;
    }
  }
  
  async getSessionByUserId(userId: string): Promise<Session | undefined> {
    try {
      // Try to find session with athlete_id
      const { data: athleteData, error: athleteError } = await supabase
        .from('sessions')
        .select('*')
        .eq('athlete_id', userId)
        .single();
        
      if (!athleteError && athleteData) {
        return this.mapSessionFromDb(athleteData);
      }
      
      // Try to find session with business_id
      const { data: businessData, error: businessError } = await supabase
        .from('sessions')
        .select('*')
        .eq('business_id', userId)
        .single();
        
      if (!businessError && businessData) {
        return this.mapSessionFromDb(businessData);
      }
      
      return undefined;
    } catch (error) {
      console.error('Exception getting session by user ID:', error);
      return undefined;
    }
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    try {
      // Build object with only properties that exist in the schema
      const insertData: any = {
          session_id: sessionData.session_id,
          user_type: sessionData.user_type,
          data: sessionData.data,
          profile_completed: sessionData.profile_completed,
          created_at: new Date(),
          updated_at: new Date(),
          last_login: new Date()
      };
      
      // Only add these if they exist in the schema
      if ('athlete_id' in sessionData) insertData.athlete_id = sessionData.athlete_id;
      if ('business_id' in sessionData) insertData.business_id = sessionData.business_id;
      
      const { data, error } = await supabase
        .from('sessions')
        .insert(insertData)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating session:', error);
        throw new Error(`Failed to create session: ${error.message}`);
      }
      
      return this.mapSessionFromDb(data);
    } catch (error) {
      console.error('Exception creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  async updateSession(sessionId: string, data: Partial<Session> & { athlete_id?: number, business_id?: number }): Promise<Session> {
    try {
      // Map to DB column names
      const dbData: any = {};
      if (data.user_type !== undefined) dbData.user_type = data.user_type;
      if (data.data !== undefined) dbData.data = data.data;
      if (data.profile_completed !== undefined) dbData.profile_completed = data.profile_completed;
      if (data.last_login !== undefined) dbData.last_login = data.last_login;
      
      // Handle extended fields that may not be in the Session type but are in the DB
      if (data.athlete_id !== undefined) dbData.athlete_id = data.athlete_id;
      if (data.business_id !== undefined) dbData.business_id = data.business_id;
      
      dbData.updated_at = new Date();
      
      const { data: updatedData, error } = await supabase
        .from('sessions')
        .update(dbData)
        .eq('session_id', sessionId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating session:', error);
        throw new Error(`Failed to update session: ${error.message}`);
      }
      
      return this.mapSessionFromDb(updatedData);
    } catch (error) {
      console.error('Exception updating session:', error);
      throw new Error(`Failed to update session ${sessionId}`);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('session_id', sessionId);
        
      if (error) {
        console.error('Error deleting session:', error);
        throw new Error(`Failed to delete session: ${error.message}`);
      }
    } catch (error) {
      console.error('Exception deleting session:', error);
      throw new Error(`Failed to delete session ${sessionId}`);
    }
  }

  // Athlete operations
  async getAthlete(id: number): Promise<Athlete | undefined> {
    try {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error getting athlete:', error);
        return undefined;
      }
      
      return this.mapAthleteFromDb(data);
    } catch (error) {
      console.error('Exception getting athlete:', error);
      return undefined;
    }
  }

  async getAthleteBySession(sessionId: string): Promise<Athlete | undefined> {
    try {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        
      if (error) {
        return undefined;
      }
      
      return this.mapAthleteFromDb(data);
    } catch (error) {
      console.error('Exception getting athlete by session:', error);
      return undefined;
    }
  }

  async getAthleteByUserId(userId: string): Promise<Athlete | undefined> {
    try {
      console.log(`Getting athlete profile for user ID ${userId}`);
      
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching athlete profile by user ID:', error);
        return undefined;
      }
      
      return this.mapAthleteFromDb(data);
    } catch (error) {
      console.error('Exception getting athlete by user ID:', error);
      return undefined;
    }
  }

  async storeAthleteProfile(athlete: InsertAthlete): Promise<Athlete> {
    try {
      const dbAthlete = this.mapAthleteToDb(athlete);
      
      const { data, error } = await supabase
        .from('athlete_profiles')
        .insert(dbAthlete)
        .select()
        .single();
        
      if (error) {
        console.error('Error storing athlete profile:', error);
        throw new Error(`Failed to store athlete profile: ${error.message}`);
      }
      
      return this.mapAthleteFromDb(data);
    } catch (error) {
      console.error('Exception storing athlete profile:', error);
      throw new Error('Failed to store athlete profile');
    }
  }

  async getAllAthletes(): Promise<Athlete[]> {
    try {
      const { data, error } = await supabase
        .from('athlete_profiles')
        .select('*');
        
      if (error) {
        console.error('Error getting all athletes:', error);
        return [];
      }
      
      return data.map(this.mapAthleteFromDb);
    } catch (error) {
      console.error('Exception getting all athletes:', error);
      return [];
    }
  }

  // Business operations
  async getBusiness(id: number): Promise<Business | undefined> {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error getting business:', error);
        return undefined;
      }
      
      return this.mapBusinessFromDb(data);
    } catch (error) {
      console.error('Exception getting business:', error);
      return undefined;
    }
  }

  async getBusinessBySession(sessionId: string): Promise<Business | undefined> {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        
      if (error) {
        return undefined;
      }
      
      return this.mapBusinessFromDb(data);
    } catch (error) {
      console.error('Exception getting business by session:', error);
      return undefined;
    }
  }
  
  async getBusinessByUserId(userId: string): Promise<Business | undefined> {
    try {
      console.log(`Getting business profile for user ID ${userId}`);
      
      // Look for business profile by ID field (not user_id)
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching business profile by user ID:', error);
        return undefined;
      }
      
      return this.mapBusinessFromDb(data);
    } catch (error) {
      console.error('Exception getting business by user ID:', error);
      return undefined;
    }
  }

  async storeBusinessProfile(business: InsertBusiness): Promise<Business> {
    try {
      const dbBusiness = this.mapBusinessToDb(business);
      
      const { data, error } = await supabase
        .from('business_profiles')
        .insert(dbBusiness)
        .select()
        .single();
        
      if (error) {
        console.error('Error storing business profile:', error);
        throw new Error(`Failed to store business profile: ${error.message}`);
      }
      
      return this.mapBusinessFromDb(data);
    } catch (error) {
      console.error('Exception storing business profile:', error);
      throw new Error('Failed to store business profile');
    }
  }

  async getAllBusinesses(): Promise<Business[]> {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*');
        
      if (error) {
        console.error('Error getting all businesses:', error);
        return [];
      }
      
      return data.map(this.mapBusinessFromDb);
    } catch (error) {
      console.error('Exception getting all businesses:', error);
      return [];
    }
  }

  // Auth operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error getting user:', error);
        return undefined;
      }
      
      return this.mapUserFromDb(data);
    } catch (error) {
      console.error('Exception getting user:', error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
        
      if (error) {
        console.error('Error getting user by email:', error);
        return undefined;
      }
      
      return this.mapUserFromDb(data);
    } catch (error) {
      console.error('Exception getting user by email:', error);
      return undefined;
    }
  }
  
  async getUserByAuthId(authId: string): Promise<User | undefined> {
    try {
      console.log(`Looking up user by auth_id: ${authId}`);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();
        
      if (error) {
        console.error('Error getting user by auth_id:', error);
        return undefined;
      }
      
      if (data) {
        console.log(`Found user with auth_id ${authId}: ${data.email}`);
        return this.mapUserFromDb(data);
      } else {
        console.log(`No user found with auth_id ${authId}`);
        return undefined;
      }
    } catch (error) {
      console.error('Exception getting user by auth_id:', error);
      return undefined;
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
        
      if (error) {
        console.error('Error getting all users:', error);
        return [];
      }
      
      return data.map(this.mapUserFromDb);
    } catch (error) {
      console.error('Exception getting all users:', error);
      return [];
    }
  }

  async createUser(userData: Partial<InsertUser>): Promise<User> {
    try {
      // Map the user data to the DB schema
      const dbUser: any = {
        email: userData.email,
        username: userData.username,
        role: userData.role,
        created_at: new Date()
      };
      
      // Create the user record
      const { data, error } = await supabase
        .from('users')
        .insert(dbUser)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating user:', error);
        throw new Error(`Failed to create user: ${error.message}`);
      }
      
      // If a password was provided, store it separately
      if (userData.password && data.id) {
        const passwordHash = await hashPassword(userData.password);
        await this.storePasswordHash(data.id.toString(), passwordHash);
      }
      
      return this.mapUserFromDb(data);
    } catch (error) {
      console.error('Exception creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User | undefined> {
    try {
      // Map the user data to the DB schema
      const dbUser: any = {};
      
      if (userData.email !== undefined) dbUser.email = userData.email;
      if (userData.username !== undefined) dbUser.username = userData.username;
      if (userData.role !== undefined) dbUser.role = userData.role;
      
      // Map Stripe subscription fields
      if (userData.stripe_customer_id !== undefined) dbUser.stripe_customer_id = userData.stripe_customer_id;
      if (userData.stripe_subscription_id !== undefined) dbUser.stripe_subscription_id = userData.stripe_subscription_id;
      if (userData.subscription_status !== undefined) dbUser.subscription_status = userData.subscription_status;
      if (userData.subscription_plan !== undefined) dbUser.subscription_plan = userData.subscription_plan;
      if (userData.subscription_current_period_end !== undefined) 
        dbUser.subscription_current_period_end = userData.subscription_current_period_end;
      
      // Create the user record
      const { data, error } = await supabase
        .from('users')
        .update(dbUser)
        .eq('id', userId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating user:', error);
        return undefined;
      }
      
      return this.mapUserFromDb(data);
    } catch (error) {
      console.error('Exception updating user:', error);
      return undefined;
    }
  }
  
  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating stripe customer ID:', error);
        throw new Error(`Failed to update stripe customer ID: ${error.message}`);
      }
      
      return this.mapUserFromDb(data);
    } catch (error) {
      console.error('Exception updating stripe customer ID:', error);
      throw new Error(`Failed to update stripe customer ID for user ${userId}`);
    }
  }
  
  async updateUserStripeInfo(userId: string, data: { 
    customerId: string, 
    subscriptionId: string, 
    status?: string, 
    plan?: string,
    currentPeriodEnd?: Date
  }): Promise<User> {
    try {
      const updateData: any = {
        stripe_customer_id: data.customerId,
        stripe_subscription_id: data.subscriptionId
      };
      
      // Add optional fields if provided
      if (data.status) updateData.subscription_status = data.status;
      if (data.plan) updateData.subscription_plan = data.plan;
      if (data.currentPeriodEnd) updateData.subscription_current_period_end = data.currentPeriodEnd;
      
      const { data: userData, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating stripe info:', error);
        throw new Error(`Failed to update stripe info: ${error.message}`);
      }
      
      return this.mapUserFromDb(userData);
    } catch (error) {
      console.error('Exception updating stripe info:', error);
      throw new Error(`Failed to update stripe info for user ${userId}`);
    }
  }
  
  // Password-related methods
  async getPasswordHash(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_credentials')
        .select('password_hash')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error('Error getting password hash:', error);
        return null;
      }
      
      return data.password_hash;
    } catch (error) {
      console.error('Exception getting password hash:', error);
      return null;
    }
  }
  
  async storePasswordHash(userId: string, passwordHash: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_credentials')
        .upsert({
          user_id: userId,
          password_hash: passwordHash,
          updated_at: new Date()
        });
        
      if (error) {
        console.error('Error storing password hash:', error);
        throw new Error(`Failed to store password hash: ${error.message}`);
      }
    } catch (error) {
      console.error('Exception storing password hash:', error);
      throw new Error(`Failed to store password hash for user ${userId}`);
    }
  }
  
  async verifyPassword(password: string, storedPassword: string): Promise<boolean> {
    try {
      const [hashedPart, salt] = storedPassword.split('.');
      const hashedBuf = Buffer.from(hashedPart, 'hex');
      const suppliedBuf = (await scryptAsync(password, salt, 64)) as Buffer;
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch (error) {
      console.error('Exception verifying password:', error);
      return false;
    }
  }

  // Campaigns
  async getCampaign(id: number): Promise<Campaign | undefined> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error getting campaign:', error);
        return undefined;
      }
      
      return this.mapCampaignFromDb(data);
    } catch (error) {
      console.error('Exception getting campaign:', error);
      return undefined;
    }
  }

  async getCampaignsByBusiness(businessId: number): Promise<Campaign[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('business_id', businessId);
        
      if (error) {
        console.error('Error getting campaigns by business:', error);
        return [];
      }
      
      return data.map(this.mapCampaignFromDb);
    } catch (error) {
      console.error('Exception getting campaigns by business:', error);
      return [];
    }
  }

  async storeCampaign(campaign: InsertCampaign): Promise<Campaign> {
    try {
      const dbCampaign = this.mapCampaignToDb(campaign);
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert(dbCampaign)
        .select()
        .single();
        
      if (error) {
        console.error('Error storing campaign:', error);
        throw new Error(`Failed to store campaign: ${error.message}`);
      }
      
      return this.mapCampaignFromDb(data);
    } catch (error) {
      console.error('Exception storing campaign:', error);
      throw new Error('Failed to store campaign');
    }
  }

  // Matches
  async getMatch(id: number): Promise<Match | undefined> {
    try {
      const { data, error } = await supabase
        .from('match_scores')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error getting match:', error);
        return undefined;
      }
      
      return this.mapMatchFromDb(data);
    } catch (error) {
      console.error('Exception getting match:', error);
      return undefined;
    }
  }

  async getMatchesForAthlete(athleteId: number): Promise<Match[]> {
    try {
      const { data, error } = await supabase
        .from('match_scores')
        .select('*')
        .eq('athlete_id', athleteId);
        
      if (error) {
        console.error('Error getting matches for athlete:', error);
        return [];
      }
      
      return data.map(this.mapMatchFromDb);
    } catch (error) {
      console.error('Exception getting matches for athlete:', error);
      return [];
    }
  }

  async getMatchesForBusiness(businessId: number): Promise<Match[]> {
    try {
      const { data, error } = await supabase
        .from('match_scores')
        .select('*')
        .eq('business_id', businessId);
        
      if (error) {
        console.error('Error getting matches for business:', error);
        return [];
      }
      
      return data.map(this.mapMatchFromDb);
    } catch (error) {
      console.error('Exception getting matches for business:', error);
      return [];
    }
  }

  async storeMatch(match: InsertMatch): Promise<Match> {
    try {
      const dbMatch = this.mapMatchToDb(match);
      
      const { data, error } = await supabase
        .from('match_scores')
        .insert(dbMatch)
        .select()
        .single();
        
      if (error) {
        console.error('Error storing match:', error);
        throw new Error(`Failed to store match: ${error.message}`);
      }
      
      return this.mapMatchFromDb(data);
    } catch (error) {
      console.error('Exception storing match:', error);
      throw new Error('Failed to store match');
    }
  }

  async getAllMatches(): Promise<Match[]> {
    try {
      const { data, error } = await supabase
        .from('match_scores')
        .select('*');
        
      if (error) {
        console.error('Error getting all matches:', error);
        return [];
      }
      
      return data.map(this.mapMatchFromDb);
    } catch (error) {
      console.error('Exception getting all matches:', error);
      return [];
    }
  }

  // Message operations
  async getMessages(sessionId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) {
        console.error('Error getting messages:', error);
        return [];
      }
      
      return data.map(this.mapMessageFromDb);
    } catch (error) {
      console.error('Exception getting messages:', error);
      return [];
    }
  }

  async storeMessage(sessionId: string, role: string, content: string, metadata?: any): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          metadata,
          created_at: new Date()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error storing message:', error);
        throw new Error(`Failed to store message: ${error.message}`);
      }
      
      return this.mapMessageFromDb(data);
    } catch (error) {
      console.error('Exception storing message:', error);
      throw new Error('Failed to store message');
    }
  }

  async getUnreadMessageCounts(sessionId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('count')
        .eq('session_id', sessionId)
        .eq('metadata->>unread', 'true');
        
      if (error) {
        console.error('Error getting unread message count:', error);
        return 0;
      }
      
      // For count operations, convert the count to number if needed
      return data && data.length > 0 ? parseInt(String(data[0].count), 10) : 0;
    } catch (error) {
      console.error('Exception getting unread message count:', error);
      return 0;
    }
  }

  async markMessagesRead(sessionId: string, messageIds: number[]): Promise<void> {
    if (messageIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 'metadata': { unread: false } })
        .eq('session_id', sessionId)
        .in('id', messageIds);
        
      if (error) {
        console.error('Error marking messages as read:', error);
        throw new Error(`Failed to mark messages as read: ${error.message}`);
      }
    } catch (error) {
      console.error('Exception marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  // Partnership Offers
  async getPartnershipOffer(id: number): Promise<PartnershipOffer | undefined> {
    try {
      const { data, error } = await supabase
        .from('partnership_offers')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error getting partnership offer:', error);
        return undefined;
      }
      
      return this.mapPartnershipOfferFromDb(data);
    } catch (error) {
      console.error('Exception getting partnership offer:', error);
      return undefined;
    }
  }

  async getPartnershipOffersByAthlete(athleteId: number): Promise<PartnershipOffer[]> {
    try {
      const { data, error } = await supabase
        .from('partnership_offers')
        .select('*')
        .eq('athlete_id', athleteId);
        
      if (error) {
        console.error('Error getting partnership offers by athlete:', error);
        return [];
      }
      
      return data.map(this.mapPartnershipOfferFromDb);
    } catch (error) {
      console.error('Exception getting partnership offers by athlete:', error);
      return [];
    }
  }

  async getPartnershipOffersByBusiness(businessId: number): Promise<PartnershipOffer[]> {
    try {
      const { data, error } = await supabase
        .from('partnership_offers')
        .select('*')
        .eq('business_id', businessId);
        
      if (error) {
        console.error('Error getting partnership offers by business:', error);
        return [];
      }
      
      return data.map(this.mapPartnershipOfferFromDb);
    } catch (error) {
      console.error('Exception getting partnership offers by business:', error);
      return [];
    }
  }

  async getPartnershipOffersByMatch(matchId: number): Promise<PartnershipOffer | undefined> {
    try {
      const { data, error } = await supabase
        .from('partnership_offers')
        .select('*')
        .eq('match_id', matchId)
        .single();
        
      if (error) {
        console.error('Error getting partnership offer by match:', error);
        return undefined;
      }
      
      return this.mapPartnershipOfferFromDb(data);
    } catch (error) {
      console.error('Exception getting partnership offer by match:', error);
      return undefined;
    }
  }

  async createPartnershipOffer(offer: InsertPartnershipOffer): Promise<PartnershipOffer> {
    try {
      const dbOffer = this.mapPartnershipOfferToDb(offer);
      
      const { data, error } = await supabase
        .from('partnership_offers')
        .insert(dbOffer)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating partnership offer:', error);
        throw new Error(`Failed to create partnership offer: ${error.message}`);
      }
      
      return this.mapPartnershipOfferFromDb(data);
    } catch (error) {
      console.error('Exception creating partnership offer:', error);
      throw new Error('Failed to create partnership offer');
    }
  }

  async updatePartnershipOfferStatus(id: number, status: string): Promise<PartnershipOffer> {
    try {
      const { data, error } = await supabase
        .from('partnership_offers')
        .update({ status, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating partnership offer status:', error);
        throw new Error(`Failed to update partnership offer status: ${error.message}`);
      }
      
      return this.mapPartnershipOfferFromDb(data);
    } catch (error) {
      console.error('Exception updating partnership offer status:', error);
      throw new Error(`Failed to update partnership offer status for offer ${id}`);
    }
  }

  async markPartnershipOfferViewed(id: number): Promise<PartnershipOffer> {
    try {
      const { data, error } = await supabase
        .from('partnership_offers')
        .update({ viewed: true, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error marking partnership offer as viewed:', error);
        throw new Error(`Failed to mark partnership offer as viewed: ${error.message}`);
      }
      
      return this.mapPartnershipOfferFromDb(data);
    } catch (error) {
      console.error('Exception marking partnership offer as viewed:', error);
      throw new Error(`Failed to mark partnership offer as viewed for offer ${id}`);
    }
  }

  async updatePartnershipOfferComplianceStatus(id: number, status: string, notes?: string): Promise<PartnershipOffer> {
    try {
      const updateData: any = {
        compliance_status: status,
        updated_at: new Date()
      };
      
      if (notes) {
        updateData.compliance_notes = notes;
      }
      
      const { data, error } = await supabase
        .from('partnership_offers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating partnership offer compliance status:', error);
        throw new Error(`Failed to update partnership offer compliance status: ${error.message}`);
      }
      
      return this.mapPartnershipOfferFromDb(data);
    } catch (error) {
      console.error('Exception updating partnership offer compliance status:', error);
      throw new Error(`Failed to update partnership offer compliance status for offer ${id}`);
    }
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error getting feedback:', error);
        return undefined;
      }
      
      return this.mapFeedbackFromDb(data);
    } catch (error) {
      console.error('Exception getting feedback:', error);
      return undefined;
    }
  }

  async getFeedbackByUser(userId: string): Promise<Feedback[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error getting feedback by user:', error);
        return [];
      }
      
      return data.map(this.mapFeedbackFromDb);
    } catch (error) {
      console.error('Exception getting feedback by user:', error);
      return [];
    }
  }

  async getFeedbackByMatch(matchId: number): Promise<Feedback[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('match_id', matchId);
        
      if (error) {
        console.error('Error getting feedback by match:', error);
        return [];
      }
      
      return data.map(this.mapFeedbackFromDb);
    } catch (error) {
      console.error('Exception getting feedback by match:', error);
      return [];
    }
  }

  async getFeedbackByType(feedbackType: string): Promise<Feedback[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('feedback_type', feedbackType);
        
      if (error) {
        console.error('Error getting feedback by type:', error);
        return [];
      }
      
      return data.map(this.mapFeedbackFromDb);
    } catch (error) {
      console.error('Exception getting feedback by type:', error);
      return [];
    }
  }

  async getPublicFeedback(): Promise<Feedback[]> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('public', true);
        
      if (error) {
        console.error('Error getting public feedback:', error);
        return [];
      }
      
      return data.map(this.mapFeedbackFromDb);
    } catch (error) {
      console.error('Exception getting public feedback:', error);
      return [];
    }
  }

  async storeFeedback(feedback: InsertFeedback): Promise<Feedback> {
    try {
      const dbFeedback = this.mapFeedbackToDb(feedback);
      
      const { data, error } = await supabase
        .from('feedback')
        .insert(dbFeedback)
        .select()
        .single();
        
      if (error) {
        console.error('Error storing feedback:', error);
        throw new Error(`Failed to store feedback: ${error.message}`);
      }
      
      return this.mapFeedbackFromDb(data);
    } catch (error) {
      console.error('Exception storing feedback:', error);
      throw new Error('Failed to store feedback');
    }
  }

  async updateFeedbackStatus(feedbackId: number, status: string): Promise<Feedback> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .update({ status })
        .eq('id', feedbackId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating feedback status:', error);
        throw new Error(`Failed to update feedback status: ${error.message}`);
      }
      
      return this.mapFeedbackFromDb(data);
    } catch (error) {
      console.error('Exception updating feedback status:', error);
      throw new Error(`Failed to update feedback status for feedback ${feedbackId}`);
    }
  }

  async addAdminResponse(feedbackId: number, response: string): Promise<Feedback> {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .update({ admin_response: response })
        .eq('id', feedbackId)
        .select()
        .single();
        
      if (error) {
        console.error('Error adding admin response to feedback:', error);
        throw new Error(`Failed to add admin response to feedback: ${error.message}`);
      }
      
      return this.mapFeedbackFromDb(data);
    } catch (error) {
      console.error('Exception adding admin response to feedback:', error);
      throw new Error(`Failed to add admin response to feedback ${feedbackId}`);
    }
  }

  // Helpers for mapping between app models and DB models
  private mapSessionFromDb(data: any): Session {
    return {
      id: data.id,
      session_id: data.session_id,
      user_type: data.user_type,
      data: data.data,
      profile_completed: data.profile_completed,
      // Include these if they exist in the schema
      user_id: data.user_id,
      // Only add these conditionally if they exist in the database object
      ...(data.athlete_id && { athlete_id: data.athlete_id }),
      ...(data.business_id && { business_id: data.business_id }),
      // Date fields
      last_login: data.last_login ? new Date(data.last_login) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    };
  }

  private mapUserFromDb(data: any): User {
    // Ensure all required fields are present with defaults if needed
    return {
      id: data.id,
      email: data.email || '',
      username: data.username || '',
      password: '', // Password is never returned from DB
      role: data.role || 'athlete', // Default role if not provided
      created_at: data.created_at ? new Date(data.created_at) : new Date(),
      last_login: data.last_login ? new Date(data.last_login) : undefined,
      auth_id: data.auth_id,
      // Include other required fields from User type with reasonable defaults
      metadata: data.metadata || {},
      stripe_customer_id: data.stripe_customer_id,
      stripe_subscription_id: data.stripe_subscription_id,
      subscription_status: data.subscription_status,
      subscription_plan: data.subscription_plan,
      subscription_current_period_end: data.subscription_current_period_end ? 
        new Date(data.subscription_current_period_end) : undefined,
      subscription_cancel_at_period_end: data.subscription_cancel_at_period_end
    };
  }

  private mapAthleteFromDb(data: any): Athlete {
    return {
      id: data.id,
      auth_id: data.auth_id,
      session_id: data.session_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      school: data.school,
      division: data.division,
      sport: data.sport,
      follower_count: data.follower_count,
      content_style: data.content_style,
      compensation_goals: data.compensation_goals,
      // Include both snake_case and camelCase for compatibility
      userId: data.user_id,
      sessionId: data.session_id,
      followerCount: data.follower_count,
      contentStyle: data.content_style,
      compensationGoals: data.compensation_goals,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // Add DateFields format as well
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    };
  }

  private mapAthleteToDb(data: InsertAthlete): any {
    return {
      session_id: data.sessionId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      school: data.school,
      division: data.division,
      sport: data.sport,
      follower_count: data.followerCount,
      content_style: data.contentStyle,
      compensation_goals: data.compensationGoals,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  private mapBusinessFromDb(data: any): Business {
    return {
      id: data.id,
      auth_id: data.auth_id,
      session_id: data.session_id,
      name: data.name,
      email: data.email,
      product_type: data.product_type,
      audience_goals: data.audience_goals,
      campaign_vibe: data.campaign_vibe,
      values: data.values,
      target_schools_sports: data.target_schools_sports,
      // Include camelCase alternatives for compatibility
      userId: data.user_id,
      sessionId: data.session_id,
      productType: data.product_type,
      audienceGoals: data.audience_goals,
      campaignVibe: data.campaign_vibe,
      targetSchoolsSports: data.target_schools_sports,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // DateFields format
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    };
  }

  private mapBusinessToDb(data: InsertBusiness): any {
    return {
      session_id: data.sessionId,
      name: data.name,
      email: data.email,
      product_type: data.productType,
      audience_goals: data.audienceGoals,
      campaign_vibe: data.campaignVibe,
      values: data.values,
      target_schools_sports: data.targetSchoolsSports,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  private mapCampaignFromDb(data: any): Campaign {
    return {
      id: data.id,
      business_id: data.business_id,
      title: data.title,
      description: data.description,
      deliverables: data.deliverables,
      status: data.status,
      // Include camelCase alternatives
      businessId: data.business_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // DateFields format
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    };
  }

  private mapCampaignToDb(data: InsertCampaign): any {
    return {
      business_id: data.businessId,
      title: data.title,
      description: data.description,
      deliverables: data.deliverables,
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  private mapMatchFromDb(data: any): Match {
    return {
      id: data.id,
      athlete_id: data.athlete_id,
      business_id: data.business_id,
      campaign_id: data.campaign_id,
      score: data.score,
      reason: data.reason,
      status: data.status,
      compliance_status: data.compliance_status || 'pending',
      // Include camelCase alternatives
      athleteId: data.athlete_id,
      businessId: data.business_id,
      campaignId: data.campaign_id,
      created_at: data.created_at,
      // DateFields format
      createdAt: data.created_at ? new Date(data.created_at) : undefined
    };
  }

  private mapMatchToDb(data: InsertMatch): any {
    return {
      athlete_id: data.athleteId,
      business_id: data.businessId,
      campaign_id: data.campaignId,
      score: data.score,
      reason: data.reason,
      status: 'pending',
      created_at: new Date()
    };
  }

  private mapMessageFromDb(data: any): Message {
    return {
      id: data.id,
      session_id: data.session_id,
      role: data.role,
      content: data.content,
      metadata: data.metadata,
      // Include camelCase alternatives
      sessionId: data.session_id,
      created_at: data.created_at,
      // DateFields format
      createdAt: data.created_at ? new Date(data.created_at) : undefined
    };
  }

  private mapPartnershipOfferFromDb(data: any): PartnershipOffer {
    return {
      id: data.id,
      business_id: data.business_id,
      athlete_id: data.athlete_id,
      campaign_id: data.campaign_id,
      match_id: data.match_id,
      status: data.status,
      deliverables: data.deliverables || [],
      compliance_status: data.compliance_status || 'pending',
      compensation_type: data.compensation_type, 
      offer_amount: data.offer_amount,
      usage_rights: data.usage_rights,
      term: data.term,
      // Include camelCase alternatives
      matchId: data.match_id,
      businessId: data.business_id,
      athleteId: data.athlete_id,
      campaignId: data.campaign_id,
      compensationType: data.compensation_type,
      offerAmount: data.offer_amount,
      usageRights: data.usage_rights,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // DateFields format
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    };
  }

  private mapPartnershipOfferToDb(data: InsertPartnershipOffer): any {
    return {
      match_id: data.matchId,
      business_id: data.businessId,
      athlete_id: data.athleteId,
      campaign_id: data.campaignId,
      compensation_type: data.compensationType,
      offer_amount: data.offerAmount,
      usage_rights: data.usageRights,
      term: data.term,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  private mapFeedbackFromDb(data: any): Feedback {
    return {
      id: data.id,
      user_type: data.user_type,
      match_id: data.match_id,
      status: data.status,
      title: data.title || '',
      content: data.content || '',
      rating: data.rating || 0,
      category: data.category || '',
      public: data.public || false,
      // Include camelCase alternatives
      userId: data.user_id,
      userType: data.user_type,
      matchId: data.match_id,
      feedbackType: data.feedback_type,
      created_at: data.created_at,
      // DateFields format
      createdAt: data.created_at ? new Date(data.created_at) : undefined
    };
  }

  private mapFeedbackToDb(data: InsertFeedback): any {
    return {
      user_id: data.userId,
      user_type: data.userType,
      match_id: data.matchId,
      feedback_type: data.feedbackType,
      content: data.content,
      status: 'pending',
      created_at: new Date()
    };
  }
}

// Memory storage implementation (simplified version)
export class MemStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    import('memorystore').then(memorystore => {
      const MemoryStore = memorystore.default(session);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
    }).catch(err => {
      console.error("Failed to initialize session store:", err);
      // Fallback to in-memory session
      this.sessionStore = new session.MemoryStore();
    });

    // Initialize with basic memory store until the import completes
    this.sessionStore = new session.MemoryStore();
  }

  // Simplified no-op implementations that return empty values
  async getSession(sessionId: string): Promise<Session | undefined> { return undefined; }
  async getSessionByUserId(userId: string): Promise<Session | undefined> { return undefined; }
  async createSession(session: InsertSession): Promise<Session> { 
    return { 
      id: 1, 
      session_id: session.session_id,
      profile_completed: session.profile_completed,
      user_type: session.user_type,
      data: session.data
    }; 
  }
  async updateSession(sessionId: string, data: Partial<Session> & { athlete_id?: number, business_id?: number }): Promise<Session> { 
    return { 
      id: 1, 
      session_id: sessionId,
      profile_completed: data.profile_completed || true,
      user_type: data.user_type || 'business',
      data: data.data,
      // Include these from extended type if provided
      ...(data.athlete_id !== undefined && { athlete_id: data.athlete_id }),
      ...(data.business_id !== undefined && { business_id: data.business_id })
    }; 
  }
  async deleteSession(sessionId: string): Promise<void> {}

  async getAthlete(id: number): Promise<Athlete | undefined> { return undefined; }
  async getAthleteBySession(sessionId: string): Promise<Athlete | undefined> { return undefined; }
  async getAthleteByUserId(userId: string): Promise<Athlete | undefined> { 
    console.log(`Getting athlete profile for user ID ${userId} from memory storage`);
    return undefined; 
  }
  async storeAthleteProfile(athlete: InsertAthlete): Promise<Athlete> { return { id: 1, ...athlete } as Athlete; }
  async getAllAthletes(): Promise<Athlete[]> { return []; }

  async getBusiness(id: number): Promise<Business | undefined> { return undefined; }
  async getBusinessBySession(sessionId: string): Promise<Business | undefined> { return undefined; }
  async getBusinessByUserId(userId: string): Promise<Business | undefined> { 
    console.log(`Getting business profile for user ID ${userId} from memory storage`);
    return undefined; 
  }
  async storeBusinessProfile(business: InsertBusiness): Promise<Business> { return { id: 1, ...business } as Business; }
  async getAllBusinesses(): Promise<Business[]> { return []; }

  async getCampaign(id: number): Promise<Campaign | undefined> { return undefined; }
  async getCampaignsByBusiness(businessId: number): Promise<Campaign[]> { return []; }
  async storeCampaign(campaign: InsertCampaign): Promise<Campaign> { return { id: 1, ...campaign, status: 'draft' } as Campaign; }

  async getMatch(id: number): Promise<Match | undefined> { return undefined; }
  async getMatchesForAthlete(athleteId: number): Promise<Match[]> { return []; }
  async getMatchesForBusiness(businessId: number): Promise<Match[]> { return []; }
  async storeMatch(match: InsertMatch): Promise<Match> { return { id: 1, ...match, status: 'pending' } as Match; }
  async getAllMatches(): Promise<Match[]> { return []; }

  async getPartnershipOffer(id: number): Promise<PartnershipOffer | undefined> { return undefined; }
  async getPartnershipOffersByAthlete(athleteId: number): Promise<PartnershipOffer[]> { return []; }
  async getPartnershipOffersByBusiness(businessId: number): Promise<PartnershipOffer[]> { return []; }
  async getPartnershipOffersByMatch(matchId: number): Promise<PartnershipOffer | undefined> { return undefined; }
  async createPartnershipOffer(offer: InsertPartnershipOffer): Promise<PartnershipOffer> { return { id: 1, ...offer, status: 'pending' } as PartnershipOffer; }
  async updatePartnershipOfferStatus(id: number, status: string): Promise<PartnershipOffer> { return { id, status } as PartnershipOffer; }
  async markPartnershipOfferViewed(id: number): Promise<PartnershipOffer> { return { id } as PartnershipOffer; }
  async updatePartnershipOfferComplianceStatus(id: number, status: string, notes?: string): Promise<PartnershipOffer> { return { id, compliance_status: status } as unknown as PartnershipOffer; }

  async getMessages(sessionId: string, limit?: number, offset?: number): Promise<Message[]> { return []; }
  async storeMessage(sessionId: string, role: string, content: string, metadata?: any): Promise<Message> { 
    return { 
      id: 1, 
      session_id: sessionId, 
      role, 
      content, 
      metadata,
      // Add camelCase alternatives
      sessionId: sessionId,
      // Add date fields
      created_at: new Date(),
      createdAt: new Date()
    }; 
  }
  async getUnreadMessageCounts(sessionId: string): Promise<number> { return 0; }
  async markMessagesRead(sessionId: string, messageIds: number[]): Promise<void> {}

  async getUser(id: string): Promise<User | undefined> { return undefined; }
  async getUserByEmail(email: string): Promise<User | undefined> { return undefined; }
  async getUserByAuthId(authId: string): Promise<User | undefined> { 
    console.log(`MemStorage.getUserByAuthId called with authId: ${authId}`);
    return undefined; 
  }
  async getAllUsers(): Promise<User[]> { return []; }
  async createUser(insertUser: Partial<InsertUser>): Promise<User> { 
    return { 
      id: '1', // Changed to string to match User schema
      email: insertUser.email || '', 
      username: insertUser.username || '', 
      password: '', 
      role: insertUser.role || 'athlete',
      created_at: new Date(),
      metadata: {},
      // Include all required fields with defaults
      auth_id: undefined,
      last_login: undefined,
      stripe_customer_id: undefined,
      stripe_subscription_id: undefined,
      subscription_status: undefined,
      subscription_plan: undefined,
      subscription_current_period_end: undefined,
      subscription_cancel_at_period_end: undefined
    }; 
  }
  async updateUser(userId: string, userData: Partial<User>): Promise<User | undefined> { 
    return { 
      id: userId, // Use string ID directly
      email: '',
      username: '',
      password: '',
      role: 'athlete',
      created_at: new Date(),
      metadata: {},
      // Include other required fields
      auth_id: undefined,
      last_login: undefined,
      stripe_customer_id: undefined,
      stripe_subscription_id: undefined,
      subscription_status: undefined,
      subscription_plan: undefined,
      subscription_current_period_end: undefined,
      subscription_cancel_at_period_end: undefined
    }; 
  }
  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> { 
    return { 
      id: userId, // Use string ID directly
      email: '',
      username: '',
      password: '',
      role: 'athlete',
      created_at: new Date(),
      metadata: {},
      stripe_customer_id: customerId,
      // Include other required fields with reasonable defaults
      auth_id: undefined,
      last_login: undefined,
      stripe_subscription_id: undefined,
      subscription_status: undefined,
      subscription_plan: undefined,
      subscription_current_period_end: undefined,
      subscription_cancel_at_period_end: undefined
    }; 
  }
  
  async updateUserStripeInfo(userId: string, data: { customerId: string, subscriptionId: string }): Promise<User> { 
    return { 
      id: userId, // Use string ID directly
      email: '',
      username: '',
      password: '',
      role: 'athlete',
      created_at: new Date(),
      metadata: {},
      // Include Stripe fields
      stripe_customer_id: data.customerId,
      stripe_subscription_id: data.subscriptionId,
      // Include other required fields
      auth_id: undefined,
      last_login: undefined,
      subscription_status: undefined,
      subscription_plan: undefined,
      subscription_current_period_end: undefined,
      subscription_cancel_at_period_end: undefined
    }; 
  }
  async getPasswordHash(userId: string): Promise<string | null> { return null; }
  async storePasswordHash(userId: string, passwordHash: string): Promise<void> {}
  async verifyPassword(password: string, storedPassword: string): Promise<boolean> { return false; }

  async getFeedback(id: number): Promise<Feedback | undefined> { return undefined; }
  async getFeedbackByUser(userId: string): Promise<Feedback[]> { return []; }
  async getFeedbackByMatch(matchId: number): Promise<Feedback[]> { return []; }
  async getFeedbackByType(feedbackType: string): Promise<Feedback[]> { return []; }
  async getPublicFeedback(): Promise<Feedback[]> { return []; }
  async storeFeedback(feedback: InsertFeedback): Promise<Feedback> { return { id: 1, ...feedback, status: 'pending' } as Feedback; }
  async updateFeedbackStatus(feedbackId: number, status: string): Promise<Feedback> { return { id: feedbackId, status } as Feedback; }
  async addAdminResponse(feedbackId: number, response: string): Promise<Feedback> { return { id: feedbackId } as Feedback; }

  // Subscription operations
  async updateUserSubscription(userId: string, data: {
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    subscription_plan?: string;
    subscription_current_period_end?: Date;
  }): Promise<any> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .update({
          stripe_customer_id: data.stripe_customer_id,
          stripe_subscription_id: data.stripe_subscription_id,
          subscription_status: data.subscription_status,
          subscription_plan: data.subscription_plan,
          subscription_current_period_end: data.subscription_current_period_end
        })
        .eq('auth_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user subscription:', error);
        throw error;
      }

      return user;
    } catch (error) {
      console.error('Error in updateUserSubscription:', error);
      throw error;
    }
  }

  async getUserSubscription(userId: string): Promise<any> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('stripe_customer_id, stripe_subscription_id, subscription_status, subscription_plan, subscription_current_period_end')
        .eq('auth_id', userId)
        .single();

      if (error) {
        console.error('Error getting user subscription:', error);
        throw error;
      }

      return user;
    } catch (error) {
      console.error('Error in getUserSubscription:', error);
      throw error;
    }
  }

  async createSubscriptionHistory(data: {
    user_id: string;
    stripe_subscription_id: string;
    plan_id: string;
    price_id: string;
    status: string;
    amount: number;
    currency: string;
    interval: string;
    current_period_start: Date;
    current_period_end: Date;
    cancel_at_period_end: boolean;
    canceled_at?: Date;
  }): Promise<any> {
    try {
      // First get the user's internal id from auth_id
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', data.user_id)
        .single();

      if (userError) {
        console.error('Error finding user for subscription history:', userError);
        throw userError;
      }

      const { data: history, error } = await supabase
        .from('subscription_history')
        .insert({
          user_id: user.id,
          stripe_subscription_id: data.stripe_subscription_id,
          plan_id: data.plan_id,
          price_id: data.price_id,
          status: data.status,
          amount: data.amount,
          currency: data.currency,
          interval: data.interval,
          current_period_start: data.current_period_start,
          current_period_end: data.current_period_end,
          cancel_at_period_end: data.cancel_at_period_end,
          canceled_at: data.canceled_at
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription history:', error);
        throw error;
      }

      return history;
    } catch (error) {
      console.error('Error in createSubscriptionHistory:', error);
      throw error;
    }
  }

  async getSubscriptionHistory(userId: string): Promise<any[]> {
    try {
      // First get the user's internal id from auth_id
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .single();

      if (userError) {
        console.error('Error finding user for subscription history:', userError);
        throw userError;
      }

      const { data: history, error } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting subscription history:', error);
        throw error;
      }

      return history || [];
    } catch (error) {
      console.error('Error in getSubscriptionHistory:', error);
      throw error;
    }
  }

  async getUserByStripeCustomerId(customerId: string): Promise<any> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('stripe_customer_id', customerId)
        .single();

      if (error) {
        console.error('Error getting user by Stripe customer ID:', error);
        throw error;
      }

      return user;
    } catch (error) {
      console.error('Error in getUserByStripeCustomerId:', error);
      throw error;
    }
  }

  async getUserByStripeSubscriptionId(subscriptionId: string): Promise<any> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (error) {
        console.error('Error getting user by Stripe subscription ID:', error);
        throw error;
      }

      return user;
    } catch (error) {
      console.error('Error in getUserByStripeSubscriptionId:', error);
      throw error;
    }
  }
}

// Import the object storage
import { objectStorage } from './objectStorage';

// Export the storage implementation
// export const storage = new DatabaseStorage();
export const storage = new SupabaseStorage();

// Export object storage for file operations
export { objectStorage };