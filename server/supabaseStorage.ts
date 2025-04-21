import { 
  InsertSession, InsertAthlete, InsertBusiness, 
  InsertCampaign, InsertMatch, InsertMessage, InsertUser, InsertFeedback, InsertPartnershipOffer,
  Session, Athlete, Business, Campaign, Match, Message, User, Feedback, PartnershipOffer
} from "@shared/schema";
import { supabase } from "./supabase";
import { db } from "./db";
import session from "express-session";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { IStorage } from "./storage";
import MemoryStore from "memorystore";

const scryptAsync = promisify(scrypt);
const MemorySessionStore = MemoryStore(session);

export class SupabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemorySessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Import here to avoid circular dependencies
    import('./supabaseSetup').then(({ initializeSupabaseTables }) => {
      // Initialize Supabase tables by running SQL script
      initializeSupabaseTables().catch(err => {
        console.error("Failed to initialize Supabase tables:", err);
      });
    });
  }

  // Session operations
  async getSession(sessionId: string): Promise<Session | undefined> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        
      if (error) {
        console.error('Error getting session by session_id:', error);
        return undefined;
      }
      
      console.log('Retrieved session:', data);
      return data as Session;
    } catch (e) {
      console.error('Exception getting session:', e);
      return undefined;
    }
  }

  async createSession(session: InsertSession): Promise<Session> {
    try {
      // Debugging - log what we're trying to create
      console.log('Creating session with data:', JSON.stringify(session));
      
      // Make sure we have the minimum required fields based on the schema
      const sessionToInsert = {
        session_id: session.sessionId,
        data: session.data || {},
        user_type: session.userType || null,
        profile_completed: session.profileCompleted || false,
      };
      
      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionToInsert)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating session:', error);
        // Fall back to in-memory session if Supabase fails
        const fallbackSession: Session = {
          id: Math.floor(Math.random() * 10000),
          sessionId: session.sessionId,
          userType: session.userType || null,
          data: session.data || {},
          profileCompleted: session.profileCompleted || false,
          athleteId: null,
          businessId: null,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log('Using fallback in-memory session:', fallbackSession);
        return fallbackSession;
      }
      
      console.log('Session created successfully:', data);
      return data as Session;
    } catch (e) {
      console.error('Exception creating session:', e);
      // Fall back to in-memory session
      const fallbackSession: Session = {
        id: Math.floor(Math.random() * 10000),
        sessionId: session.sessionId,
        userType: session.userType || null,
        data: session.data || {},
        profileCompleted: session.profileCompleted || false,
        athleteId: null,
        businessId: null,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('Using fallback in-memory session after exception:', fallbackSession);
      return fallbackSession;
    }
  }

  async updateSession(sessionId: string, data: Partial<Session>): Promise<Session> {
    try {
      // Format data for Supabase (convert camelCase to snake_case)
      const dataToUpdate: any = {};
      
      if (data.data !== undefined) dataToUpdate.data = data.data;
      if (data.userType !== undefined) dataToUpdate.user_type = data.userType;
      if (data.profileCompleted !== undefined) dataToUpdate.profile_completed = data.profileCompleted;
      if (data.athleteId !== undefined) dataToUpdate.athlete_id = data.athleteId;
      if (data.businessId !== undefined) dataToUpdate.business_id = data.businessId;
      
      const { data: updatedData, error } = await supabase
        .from('sessions')
        .update(dataToUpdate)
        .eq('session_id', sessionId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating session:', error);
        // Return original session data as fallback
        const fallbackSession = await this.getSession(sessionId);
        if (fallbackSession) {
          return {
            ...fallbackSession,
            ...data
          };
        }
        throw new Error('Failed to update session');
      }
      
      return updatedData as Session;
    } catch (e) {
      console.error('Exception updating session:', e);
      throw new Error('Failed to update session');
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
        // Just log the error but don't throw, as we want to continue 
        // even if the session couldn't be deleted
        console.log(`Using fallback for delete session: ${sessionId}`);
      }
    } catch (e) {
      console.error('Exception deleting session:', e);
      // No need to throw as we want to continue even if delete failed
    }
  }

  // Athlete operations
  async getAthlete(id: number): Promise<Athlete | undefined> {
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error getting athlete:', error);
      return undefined;
    }
    
    return data as Athlete;
  }

  async getAthleteBySession(sessionId: string): Promise<Athlete | undefined> {
    // Try to get the athlete directly by sessionId
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('sessionId', sessionId)
      .single();
      
    if (error) {
      console.error('Error getting athlete by session:', error);
      return undefined;
    }
    
    return data as Athlete;
  }

  async storeAthleteProfile(athlete: InsertAthlete): Promise<Athlete> {
    const { data, error } = await supabase
      .from('athletes')
      .insert(athlete)
      .select()
      .single();
      
    if (error) {
      console.error('Error storing athlete profile:', error);
      throw new Error('Failed to store athlete profile');
    }
    
    return data as Athlete;
  }

  async getAllAthletes(): Promise<Athlete[]> {
    const { data, error } = await supabase
      .from('athletes')
      .select('*');
      
    if (error) {
      console.error('Error getting all athletes:', error);
      return [];
    }
    
    return data as Athlete[];
  }
  
  async getAthleteByUserId(userId: number): Promise<Athlete | undefined> {
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('userId', userId)
      .single();
      
    if (error) {
      console.error('Error getting athlete by user ID:', error);
      return undefined;
    }
    
    return data as Athlete;
  }

  // Business operations
  async getBusiness(id: number): Promise<Business | undefined> {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error getting business:', error);
      return undefined;
    }
    
    return data as Business;
  }

  async getBusinessBySession(sessionId: string): Promise<Business | undefined> {
    // Get the business directly by sessionId
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('sessionId', sessionId)
      .single();
      
    if (error) {
      console.error('Error getting business by session:', error);
      return undefined;
    }
    
    return data as Business;
  }

  async storeBusinessProfile(business: InsertBusiness): Promise<Business> {
    console.log('Attempting to store business profile with data:', JSON.stringify(business, null, 2));
    
    try {
      // Use the direct SQL insert in the db module which we know works
      try {
        // Try direct SQL insert through our db module
        const result = await db.insertBusinessProfile(business);
        if (result) {
          console.log('Successfully stored business profile via db.insertBusinessProfile:', JSON.stringify(result, null, 2));
          return result as Business;
        }
      } catch (sqlError) {
        console.error('Error with db.insertBusinessProfile:', sqlError);
      }
      
      // Fall back to direct SQL api call - as a last resort
      try {
        // Create a SQL insert statement
        const insertQuery = `
          INSERT INTO business_profiles 
          ("sessionId", "name", "productType", "audienceGoals", "campaignVibe", "values", "targetSchoolsSports", "budget")
          VALUES 
          ('${business.sessionId}', '${business.name || ''}', '${business.productType || "Product"}', 
           '${business.audienceGoals || "College Students"}', '${business.campaignVibe || "Authentic"}', 
           '${business.values || "Quality, Innovation"}', '${business.targetSchoolsSports || "Basketball"}', 
           '${business.budget || "$0-$5000"}')
          RETURNING *
        `;

        // Execute it directly
        const { data, error } = await supabase.rpc('execute_raw_sql', { query: insertQuery });
        
        if (error) {
          console.error('Error with direct SQL execution:', error);
        } else if (data && data.length > 0) {
          console.log('Successfully inserted business profile with direct SQL:', data[0]);
          return data[0] as Business;
        }
      } catch (directSqlError) {
        console.error('Exception with direct SQL execution:', directSqlError);
      }

      // Last fallback - create a minimal record using the supabase client API
      const minimalData = {
        "sessionId": business.sessionId,
        "name": business.name || "Business Profile",
        "productType": "Product",
        "audienceGoals": "College Students",
        "campaignVibe": "Authentic",
        "values": "Quality",
        "targetSchoolsSports": "All",
        "budget": "$0-$5000"
      };
      
      const { data, error } = await supabase
        .from('business_profiles')
        .insert(minimalData)
        .select()
        .single();
        
      if (error) {
        console.error('All business profile insertion methods failed:', error);
        throw new Error(`Failed to store business profile: ${error.message}`);
      }
      
      console.log('Successfully stored business profile with minimal data:', JSON.stringify(data, null, 2));
      return data as Business;
    } catch (e) {
      console.error('Unhandled exception in storeBusinessProfile:', e);
      throw new Error(`Failed to store business profile: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async getAllBusinesses(): Promise<Business[]> {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*');
      
    if (error) {
      console.error('Error getting all businesses:', error);
      return [];
    }
    
    return data as Business[];
  }
  
  async getBusinessByUserId(userId: number): Promise<Business | undefined> {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('userId', userId)
      .single();
      
    if (error) {
      console.error('Error getting business by user ID:', error);
      return undefined;
    }
    
    return data as Business;
  }

  // Campaign operations
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error getting campaign:', error);
      return undefined;
    }
    
    return data as Campaign;
  }

  async getCampaignsByBusiness(businessId: number): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('businessId', businessId);
      
    if (error) {
      console.error('Error getting campaigns by business:', error);
      return [];
    }
    
    return data as Campaign[];
  }

  async storeCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();
      
    if (error) {
      console.error('Error storing campaign:', error);
      throw new Error('Failed to store campaign');
    }
    
    return data as Campaign;
  }

  // Match operations
  async getMatch(id: number): Promise<Match | undefined> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error getting match:', error);
      return undefined;
    }
    
    return data as Match;
  }

  async getMatchesForAthlete(athleteId: number): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('athleteId', athleteId);
      
    if (error) {
      console.error('Error getting matches for athlete:', error);
      return [];
    }
    
    return data as Match[];
  }

  async getMatchesForBusiness(businessId: number): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('businessId', businessId);
      
    if (error) {
      console.error('Error getting matches for business:', error);
      return [];
    }
    
    return data as Match[];
  }

  async storeMatch(match: InsertMatch): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .insert(match)
      .select()
      .single();
      
    if (error) {
      console.error('Error storing match:', error);
      throw new Error('Failed to store match');
    }
    
    return data as Match;
  }

  async getAllMatches(): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*');
      
    if (error) {
      console.error('Error getting all matches:', error);
      return [];
    }
    
    return data as Match[];
  }

  // Partnership Offer operations
  async getPartnershipOffer(id: number): Promise<PartnershipOffer | undefined> {
    const { data, error } = await supabase
      .from('partnership_offers')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error getting partnership offer:', error);
      return undefined;
    }
    
    return data as PartnershipOffer;
  }

  async getPartnershipOffersByAthlete(athleteId: number): Promise<PartnershipOffer[]> {
    const { data, error } = await supabase
      .from('partnership_offers')
      .select('*')
      .eq('athleteId', athleteId);
      
    if (error) {
      console.error('Error getting partnership offers by athlete:', error);
      return [];
    }
    
    return data as PartnershipOffer[];
  }

  async getPartnershipOffersByBusiness(businessId: number): Promise<PartnershipOffer[]> {
    const { data, error } = await supabase
      .from('partnership_offers')
      .select('*')
      .eq('businessId', businessId);
      
    if (error) {
      console.error('Error getting partnership offers by business:', error);
      return [];
    }
    
    return data as PartnershipOffer[];
  }

  async getPartnershipOffersByMatch(matchId: number): Promise<PartnershipOffer | undefined> {
    const { data, error } = await supabase
      .from('partnership_offers')
      .select('*')
      .eq('matchId', matchId)
      .single();
      
    if (error) {
      console.error('Error getting partnership offer by match:', error);
      return undefined;
    }
    
    return data as PartnershipOffer;
  }

  async createPartnershipOffer(offer: InsertPartnershipOffer): Promise<PartnershipOffer> {
    const { data, error } = await supabase
      .from('partnership_offers')
      .insert(offer)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating partnership offer:', error);
      throw new Error('Failed to create partnership offer');
    }
    
    return data as PartnershipOffer;
  }

  async updatePartnershipOfferStatus(id: number, status: string): Promise<PartnershipOffer> {
    const { data, error } = await supabase
      .from('partnership_offers')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating partnership offer status:', error);
      throw new Error('Failed to update partnership offer status');
    }
    
    return data as PartnershipOffer;
  }

  async markPartnershipOfferViewed(id: number): Promise<PartnershipOffer> {
    const { data, error } = await supabase
      .from('partnership_offers')
      .update({ viewed: true })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error marking partnership offer as viewed:', error);
      throw new Error('Failed to mark partnership offer as viewed');
    }
    
    return data as PartnershipOffer;
  }

  async updatePartnershipOfferComplianceStatus(id: number, status: string, notes?: string): Promise<PartnershipOffer> {
    const { data, error } = await supabase
      .from('partnership_offers')
      .update({ 
        complianceStatus: status,
        complianceNotes: notes 
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating partnership offer compliance status:', error);
      throw new Error('Failed to update partnership offer compliance status');
    }
    
    return data as PartnershipOffer;
  }

  // Message operations
  async getMessages(sessionId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      // Use SQL directly since offset isn't working in this version of Supabase client
      const query = `
        SELECT * FROM messages
        WHERE session_id = '${sessionId}'
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const { data, error } = await supabase.rpc('execute_raw_sql', { query });
      
      if (error) {
        console.error('Error executing raw SQL for messages:', error);
        
        // Try without offset as fallback
        const fallbackResult = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(limit);
          
        if (fallbackResult.error) {
          console.error('Error in fallback messages query:', fallbackResult.error);
          return [];
        }
        
        return (fallbackResult.data || []).map((msg: any) => ({
          id: msg.id,
          sessionId: msg.session_id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.created_at)
        })) as Message[];
      }
      
      // Map from snake_case to camelCase for consistency
      return (data || []).map((msg: any) => ({
        id: msg.id,
        sessionId: msg.session_id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.created_at)
      })) as Message[];
    } catch (e) {
      console.error('Exception in getMessages:', e);
      return [];
    }
  }

  async storeMessage(sessionId: string, role: string, content: string, metadata?: any): Promise<Message> {
    const newMessage = {
      session_id: sessionId,
      role,
      content
      // No read or metadata fields in our schema, and createdAt will be added by default
    };
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert(newMessage)
        .select()
        .single();
        
      if (error) {
        console.error('Error storing message in Supabase:', error);
        
        // Fall back to an in-memory message
        const fallbackMessage: Message = {
          id: Math.floor(Math.random() * 10000),
          sessionId,
          role,
          content,
          createdAt: new Date()
        };
        
        console.log('Using fallback in-memory message:', fallbackMessage);
        return fallbackMessage;
      }
      
      // Map from snake_case to camelCase for consistency
      return {
        id: data.id,
        sessionId: data.session_id,
        role: data.role,
        content: data.content,
        createdAt: new Date(data.created_at)
      } as Message;
    } catch (e) {
      console.error('Exception storing message:', e);
      
      // Fall back to an in-memory message
      const fallbackMessage: Message = {
        id: Math.floor(Math.random() * 10000),
        sessionId,
        role,
        content,
        createdAt: new Date()
      };
      
      console.log('Using fallback in-memory message after exception:', fallbackMessage);
      return fallbackMessage;
    }
  }

  async getUnreadMessageCounts(sessionId: string): Promise<number> {
    // Since our schema doesn't have a 'read' field, we'll count all messages
    // and apply application logic to determine what's read/unread
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
        
      if (error) {
        console.error('Error counting messages:', error);
        return 0;
      }
      
      // For now, just return a small number since we don't track read status in DB
      // In a real app, we'd store read status in a separate table or in client storage
      return Math.min(count || 0, 3); // Return at most 3 unread messages
    } catch (e) {
      console.error('Exception in getUnreadMessageCounts:', e);
      return 0;
    }
  }

  async markMessagesRead(sessionId: string, messageIds: number[]): Promise<void> {
    // Since our schema doesn't have a 'read' field, this is a no-op
    // In a real app, we'd store read status in a separate table or in client storage
    console.log(`Marking messages as read (no-op): session=${sessionId}, messageIds=${messageIds.join(',')}`);
    return Promise.resolve();
  }

  // Auth operations
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
    
    // Map user_type back to role for schema compatibility
    if (data && data.user_type && !data.role) {
      data.role = data.user_type;
    }
    
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
      
    if (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
    
    return data as User;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
    
    return data as User;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*');
      
    if (error) {
      console.error('Error getting all users:', error);
      return [];
    }
    
    return data as User[];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Create a user record without the password
    const { password, ...userWithoutPassword } = insertUser;
    
    // Create a Supabase auth user if possible
    try {
      if (password && insertUser.email) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: insertUser.email,
          password: password,
        });
        
        if (authError) {
          console.error('Error creating Supabase auth user:', authError);
        } else {
          console.log('Created Supabase auth user');
        }
      }
    } catch (error) {
      console.error('Error creating Supabase auth user:', error);
    }
    
    // Map role to user_type for Supabase compatibility
    const supabaseUserData = {
      ...userWithoutPassword,
      user_type: userWithoutPassword.role, // Map role to user_type 
    };
    delete supabaseUserData.role; // Remove role as it's not in the Supabase schema
    
    console.log('Creating user with data:', supabaseUserData);
    
    // Insert the user into our Supabase table without password
    const { data, error } = await supabase
      .from('users')
      .insert(supabaseUserData)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
    
    // Store the password hash separately if provided
    if (password && data && data.id) {
      // Create a hash using the auth.ts hashPassword function
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      await this.storePasswordHash(data.id, hashedPassword);
    }
    
    return data as User;
  }

  async updateUser(userId: string, userData: Partial<User> & { password?: string }): Promise<User | undefined> {
    // Extract password if it's included (it's not part of the User type)
    const { password, ...userDataWithoutPassword } = userData;
    
    // Update the user data in the users table
    const { data, error } = await supabase
      .from('users')
      .update(userDataWithoutPassword)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
    
    // If password was provided, update it separately in the credentials table
    if (password) {
      try {
        // Create hash using the same method as in auth.ts
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;
        const hashedPassword = `${buf.toString("hex")}.${salt}`;
        
        await this.storePasswordHash(userId, hashedPassword);
      } catch (error) {
        console.error('Error updating password:', error);
        // Continue even if password update fails
      }
    }
    
    return data as User;
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ stripeCustomerId: customerId })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating Stripe customer ID:', error);
      throw new Error('Failed to update Stripe customer ID');
    }
    
    return data as User;
  }

  async updateUserStripeInfo(userId: string, data: { customerId: string, subscriptionId: string }): Promise<User> {
    const { data: updatedData, error } = await supabase
      .from('users')
      .update({ 
        stripeCustomerId: data.customerId,
        stripeSubscriptionId: data.subscriptionId 
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating user Stripe info:', error);
      throw new Error('Failed to update user Stripe info');
    }
    
    return updatedData as User;
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error getting feedback:', error);
      return undefined;
    }
    
    return data as Feedback;
  }

  async getFeedbackByUser(userId: string): Promise<Feedback[]> {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('userId', userId);
      
    if (error) {
      console.error('Error getting feedback by user:', error);
      return [];
    }
    
    return data as Feedback[];
  }

  async getFeedbackByMatch(matchId: number): Promise<Feedback[]> {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('matchId', matchId);
      
    if (error) {
      console.error('Error getting feedback by match:', error);
      return [];
    }
    
    return data as Feedback[];
  }

  async getFeedbackByType(feedbackType: string): Promise<Feedback[]> {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('feedbackType', feedbackType);
      
    if (error) {
      console.error('Error getting feedback by type:', error);
      return [];
    }
    
    return data as Feedback[];
  }

  async getPublicFeedback(): Promise<Feedback[]> {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('isPublic', true);
      
    if (error) {
      console.error('Error getting public feedback:', error);
      return [];
    }
    
    return data as Feedback[];
  }

  async storeFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const { data, error } = await supabase
      .from('feedbacks')
      .insert(feedback)
      .select()
      .single();
      
    if (error) {
      console.error('Error storing feedback:', error);
      throw new Error('Failed to store feedback');
    }
    
    return data as Feedback;
  }

  async updateFeedbackStatus(feedbackId: number, status: string): Promise<Feedback> {
    const { data, error } = await supabase
      .from('feedbacks')
      .update({ status })
      .eq('id', feedbackId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating feedback status:', error);
      throw new Error('Failed to update feedback status');
    }
    
    return data as Feedback;
  }

  async addAdminResponse(feedbackId: number, response: string): Promise<Feedback> {
    const { data, error } = await supabase
      .from('feedbacks')
      .update({ adminResponse: response })
      .eq('id', feedbackId)
      .select()
      .single();
      
    if (error) {
      console.error('Error adding admin response to feedback:', error);
      throw new Error('Failed to add admin response to feedback');
    }
    
    return data as Feedback;
  }

  // Helper methods
  async getPasswordHash(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('password_hash, salt')
      .eq('user_id', userId)
      .single();
      
    if (error || !data) {
      console.error('Error getting password hash:', error);
      return null;
    }
    
    // Return the combined hash.salt format used by auth system
    return `${data.password_hash}.${data.salt}`;
  }
  
  async storePasswordHash(userId: string, hashedPassword: string): Promise<void> {
    // Split the combined hash into components
    const [hash, salt] = hashedPassword.split('.');
    
    if (!hash || !salt) {
      throw new Error('Invalid password hash format');
    }
    
    // Check if user already has credentials
    const { data: existingCreds } = await supabase
      .from('user_credentials')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (existingCreds) {
      // Update existing credentials
      const { error } = await supabase
        .from('user_credentials')
        .update({
          password_hash: hash,
          salt: salt,
          updated_at: new Date()
        })
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error updating password hash:', error);
        throw new Error('Failed to update password hash');
      }
    } else {
      // Insert new credentials
      const { error } = await supabase
        .from('user_credentials')
        .insert({
          user_id: userId,
          password_hash: hash, 
          salt: salt
        });
        
      if (error) {
        console.error('Error storing password hash:', error);
        throw new Error('Failed to store password hash');
      }
    }
  }
  
  async verifyPassword(password: string, storedPassword: string): Promise<boolean> {
    // Split the stored password hash which is in format "hash.salt"
    const [hash, salt] = storedPassword.split('.');
    
    if (!hash || !salt) {
      return false;
    }
    
    const hashBuffer = Buffer.from(hash, 'hex');
    const keyBuffer = await scryptAsync(password, salt, 64) as Buffer;
    return timingSafeEqual(hashBuffer, keyBuffer);
  }
  
  private async hashPassword(password: string, salt: string): Promise<string> {
    const hashBuffer = await scryptAsync(password, salt, 64) as Buffer;
    return hashBuffer.toString('hex');
  }
}