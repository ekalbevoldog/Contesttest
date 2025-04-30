import { 
  InsertSession, InsertAthlete, InsertBusiness, 
  InsertCampaign, InsertMatch, InsertMessage, InsertUser, InsertFeedback, InsertPartnershipOffer,
  Session, Athlete, Business, Campaign, Match, Message, User, Feedback, PartnershipOffer
} from "@shared/schema.js";
import { DashboardPreferences } from "../shared/dashboard-schema.js";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";
import { supabase } from "./supabase.js";

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

  // User Preferences operations
  getUserPreferences(userId: string, preferenceType: string): Promise<{ user_id: string; preference_type: string; data: any } | undefined>;
  saveUserPreferences(preferences: { user_id: string; preference_type: string; data: any }): Promise<{ user_id: string; preference_type: string; data: any }>;
  deleteUserPreferences(userId: string, preferenceType: string): Promise<void>;
  
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
      // Set up PostgreSQL session store with the correct table name
      const PgStore = connectPgSimple(session);
      this.sessionStore = new PgStore({
        pool,
        tableName: 'session', // Use singular form (standard for connect-pg-simple)
        createTableIfMissing: false // We've already created the table
      });
      console.log("PostgreSQL session store initialized successfully");
    } catch (err) {
      console.error("Failed to initialize PostgreSQL session store:", err);
      // Fallback to in-memory session if PostgreSQL store fails
      console.log("Falling back to in-memory session store");
      this.sessionStore = new session.MemoryStore();
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
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          session_id: sessionData.sessionId,
          user_type: sessionData.userType,
          data: sessionData.data,
          profile_completed: sessionData.profileCompleted,
          athlete_id: sessionData.athleteId,
          business_id: sessionData.businessId,
          created_at: new Date(),
          updated_at: new Date(),
          last_login: new Date()
        })
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

  async updateSession(sessionId: string, data: Partial<Session>): Promise<Session> {
    try {
      // Map to DB column names
      const dbData: any = {};
      if (data.userType !== undefined) dbData.user_type = data.userType;
      if (data.data !== undefined) dbData.data = data.data;
      if (data.profileCompleted !== undefined) dbData.profile_completed = data.profileCompleted;
      if (data.athleteId !== undefined) dbData.athlete_id = data.athleteId;
      if (data.businessId !== undefined) dbData.business_id = data.businessId;
      if (data.lastLogin !== undefined) dbData.last_login = data.lastLogin;
      
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
  
  async updateUserStripeInfo(userId: string, data: { customerId: string, subscriptionId: string }): Promise<User> {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .update({ 
          stripe_customer_id: data.customerId,
          stripe_subscription_id: data.subscriptionId
        })
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
      sessionId: data.session_id,
      userType: data.user_type,
      data: data.data,
      profileCompleted: data.profile_completed,
      athleteId: data.athlete_id,
      businessId: data.business_id,
      lastLogin: new Date(data.last_login),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private mapUserFromDb(data: any): User {
    return {
      id: data.id,
      email: data.email,
      username: data.username,
      password: '', // Password is never returned from DB
      role: data.role,
      created_at: new Date(data.created_at),
      last_login: data.last_login ? new Date(data.last_login) : undefined,
      auth_id: data.auth_id
    };
  }

  private mapAthleteFromDb(data: any): Athlete {
    return {
      id: data.id,
      userId: data.user_id,
      sessionId: data.session_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      school: data.school,
      division: data.division,
      sport: data.sport,
      followerCount: data.follower_count,
      contentStyle: data.content_style,
      compensationGoals: data.compensation_goals,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
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
      userId: data.user_id,
      sessionId: data.session_id,
      name: data.name,
      email: data.email,
      productType: data.product_type,
      audienceGoals: data.audience_goals,
      campaignVibe: data.campaign_vibe,
      values: data.values,
      targetSchoolsSports: data.target_schools_sports,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
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
      businessId: data.business_id,
      title: data.title,
      description: data.description,
      deliverables: data.deliverables,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
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
      athleteId: data.athlete_id,
      businessId: data.business_id,
      campaignId: data.campaign_id,
      score: data.score,
      reason: data.reason,
      status: data.status,
      createdAt: new Date(data.created_at)
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
      sessionId: data.session_id,
      role: data.role,
      content: data.content,
      metadata: data.metadata,
      createdAt: new Date(data.created_at)
    };
  }

  private mapPartnershipOfferFromDb(data: any): PartnershipOffer {
    return {
      id: data.id,
      matchId: data.match_id,
      businessId: data.business_id,
      athleteId: data.athlete_id,
      campaignId: data.campaign_id,
      compensationType: data.compensation_type,
      offerAmount: data.offer_amount,
      usageRights: data.usage_rights,
      term: data.term,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
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
      userId: data.user_id,
      userType: data.user_type,
      matchId: data.match_id,
      feedbackType: data.feedback_type,
      content: data.content,
      status: data.status,
      createdAt: new Date(data.created_at)
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

  // User Preferences operations
  async getUserPreferences(userId: string, preferenceType: string): Promise<{ user_id: string; preference_type: string; data: any } | undefined> {
    try {
      console.log(`Getting user preferences for userId ${userId} and type ${preferenceType}`);
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('preference_type', preferenceType)
        .maybeSingle();
        
      if (error) {
        console.error(`Error getting user preferences for type ${preferenceType}:`, error);
        return undefined;
      }
      
      return data;
    } catch (error) {
      console.error(`Exception getting user preferences for type ${preferenceType}:`, error);
      return undefined;
    }
  }
  
  async saveUserPreferences(preferences: { user_id: string; preference_type: string; data: any }): Promise<{ user_id: string; preference_type: string; data: any }> {
    try {
      console.log(`Saving user preferences for userId ${preferences.user_id} and type ${preferences.preference_type}`);
      
      // Check if preferences already exist for this user and type
      const existingPrefs = await this.getUserPreferences(preferences.user_id, preferences.preference_type);
      
      let data, error;
      
      if (existingPrefs) {
        // Update existing preferences
        ({ data, error } = await supabase
          .from('user_preferences')
          .update({
            data: preferences.data,
            updated_at: new Date()
          })
          .eq('user_id', preferences.user_id)
          .eq('preference_type', preferences.preference_type)
          .select()
          .single());
      } else {
        // Insert new preferences
        ({ data, error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: preferences.user_id,
            preference_type: preferences.preference_type,
            data: preferences.data,
            created_at: new Date(),
            updated_at: new Date()
          })
          .select()
          .single());
      }
      
      if (error) {
        console.error('Error saving user preferences:', error);
        throw new Error(`Failed to save user preferences: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Exception saving user preferences:', error);
      throw new Error('Failed to save user preferences');
    }
  }
  
  async deleteUserPreferences(userId: string, preferenceType: string): Promise<void> {
    try {
      console.log(`Deleting user preferences for userId ${userId} and type ${preferenceType}`);
      
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId)
        .eq('preference_type', preferenceType);
        
      if (error) {
        console.error('Error deleting user preferences:', error);
        throw new Error(`Failed to delete user preferences: ${error.message}`);
      }
    } catch (error) {
      console.error('Exception deleting user preferences:', error);
      throw new Error(`Failed to delete user preferences for user ${userId} and type ${preferenceType}`);
    }
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
  async createSession(session: InsertSession): Promise<Session> { return { id: 1, sessionId: session.sessionId } as Session; }
  async updateSession(sessionId: string, data: Partial<Session>): Promise<Session> { return { id: 1, sessionId } as Session; }
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
  async storeMessage(sessionId: string, role: string, content: string, metadata?: any): Promise<Message> { return { id: 1, sessionId, role, content, metadata } as Message; }
  async getUnreadMessageCounts(sessionId: string): Promise<number> { return 0; }
  async markMessagesRead(sessionId: string, messageIds: number[]): Promise<void> {}

  async getUser(id: string): Promise<User | undefined> { return undefined; }
  async getUserByEmail(email: string): Promise<User | undefined> { return undefined; }
  async getUserByAuthId(authId: string): Promise<User | undefined> { 
    console.log(`MemStorage.getUserByAuthId called with authId: ${authId}`);
    return undefined; 
  }
  async getAllUsers(): Promise<User[]> { return []; }
  async createUser(insertUser: Partial<InsertUser>): Promise<User> { return { id: 1, email: insertUser.email || '', username: insertUser.username || '', password: '', role: 'athlete' } as User; }
  async updateUser(userId: string, userData: Partial<User>): Promise<User | undefined> { return { id: Number(userId) } as User; }
  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> { return { id: Number(userId) } as User; }
  async updateUserStripeInfo(userId: string, data: { customerId: string, subscriptionId: string }): Promise<User> { return { id: Number(userId) } as User; }
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

  // User Preferences operations
  async getUserPreferences(userId: string, preferenceType: string): Promise<{ user_id: string; preference_type: string; data: any } | undefined> {
    console.log(`MemStorage.getUserPreferences called with userId: ${userId}, preferenceType: ${preferenceType}`);
    return {
      user_id: userId,
      preference_type: preferenceType,
      data: {}
    };
  }
  
  async saveUserPreferences(preferences: { user_id: string; preference_type: string; data: any }): Promise<{ user_id: string; preference_type: string; data: any }> {
    console.log(`MemStorage.saveUserPreferences called`, preferences);
    return preferences;
  }
  
  async deleteUserPreferences(userId: string, preferenceType: string): Promise<void> {
    console.log(`MemStorage.deleteUserPreferences called with userId: ${userId}, preferenceType: ${preferenceType}`);
  }
}

// Import the object storage
import { objectStorage } from './objectStorage';

// Export the storage implementation
// export const storage = new DatabaseStorage();
export const storage = new SupabaseStorage();

// Export object storage for file operations
export { objectStorage };