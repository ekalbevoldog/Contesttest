import { 
  InsertSession, InsertAthlete, InsertBusiness, 
  InsertCampaign, InsertMatch, InsertMessage, InsertUser, InsertFeedback, InsertPartnershipOffer,
  Session, Athlete, Business, Campaign, Match, Message, User, Feedback, PartnershipOffer
} from "@shared/schema";
import { supabase } from "./supabase";
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
    
    // Ensure Supabase tables exist
    this.initSupabaseTables();
  }

  private async initSupabaseTables() {
    try {
      // Create tables if they don't exist
      const tables = [
        'sessions',
        'athletes',
        'businesses',
        'campaigns',
        'matches',
        'partnership_offers',
        'messages',
        'users',
        'feedbacks'
      ];
      
      console.log('Initializing Supabase tables...');
      
      // Log Supabase connection
      const { data: tableData, error: tableError } = await supabase
        .from('sessions')
        .select('id')
        .limit(1);
        
      if (tableError && tableError.code === '42P01') {
        console.log('Creating Supabase tables...');
        // Tables don't exist yet, create them
        await this.createTables();
      } else {
        console.log('Supabase tables already exist');
      }
    } catch (error) {
      console.error('Error initializing Supabase tables:', error);
    }
  }

  private async createTables() {
    // Create tables in Supabase SQL editor
    // This would typically be done through the Supabase UI
    console.log('Tables should be created through Supabase UI');
  }

  // Session operations
  async getSession(sessionId: string): Promise<Session | undefined> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
      
    if (error) {
      console.error('Error getting session:', error);
      return undefined;
    }
    
    return data as Session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
    
    return data as Session;
  }

  async updateSession(sessionId: string, data: Partial<Session>): Promise<Session> {
    const { data: updatedData, error } = await supabase
      .from('sessions')
      .update(data)
      .eq('id', sessionId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating session:', error);
      throw new Error('Failed to update session');
    }
    
    return updatedData as Session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);
      
    if (error) {
      console.error('Error deleting session:', error);
      throw new Error('Failed to delete session');
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
    // First get the user ID from the session
    const session = await this.getSession(sessionId);
    if (!session || !session.userId) return undefined;
    
    // Then get the athlete by user ID
    const { data, error } = await supabase
      .from('athletes')
      .select('*')
      .eq('userId', session.userId)
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

  // Business operations
  async getBusiness(id: number): Promise<Business | undefined> {
    const { data, error } = await supabase
      .from('businesses')
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
    // First get the user ID from the session
    const session = await this.getSession(sessionId);
    if (!session || !session.userId) return undefined;
    
    // Then get the business by user ID
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('userId', session.userId)
      .single();
      
    if (error) {
      console.error('Error getting business by session:', error);
      return undefined;
    }
    
    return data as Business;
  }

  async storeBusinessProfile(business: InsertBusiness): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .insert(business)
      .select()
      .single();
      
    if (error) {
      console.error('Error storing business profile:', error);
      throw new Error('Failed to store business profile');
    }
    
    return data as Business;
  }

  async getAllBusinesses(): Promise<Business[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*');
      
    if (error) {
      console.error('Error getting all businesses:', error);
      return [];
    }
    
    return data as Business[];
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
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: false })
      .limit(limit)
      .offset(offset);
      
    if (error) {
      console.error('Error getting messages:', error);
      return [];
    }
    
    return data as Message[];
  }

  async storeMessage(sessionId: string, role: string, content: string, metadata?: any): Promise<Message> {
    const newMessage = {
      sessionId,
      role,
      content,
      read: false,
      metadata,
      createdAt: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select()
      .single();
      
    if (error) {
      console.error('Error storing message:', error);
      throw new Error('Failed to store message');
    }
    
    return data as Message;
  }

  async getUnreadMessageCounts(sessionId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sessionId', sessionId)
      .eq('read', false);
      
    if (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
    
    return count || 0;
  }

  async markMessagesRead(sessionId: string, messageIds: number[]): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('sessionId', sessionId)
      .in('id', messageIds);
      
    if (error) {
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  // Auth operations
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error getting user:', error);
      return undefined;
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
    // Hash password if provided
    let userToInsert = { ...insertUser };
    
    if (userToInsert.password) {
      const salt = randomBytes(16).toString('hex');
      const passwordHash = await this.hashPassword(userToInsert.password, salt);
      userToInsert = {
        ...userToInsert,
        password: passwordHash,
        salt
      };
    }
    
    // Also create a Supabase auth user if possible
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userToInsert.email || `${userToInsert.username}@example.com`,
        password: insertUser.password || 'defaultPassword123',
      });
      
      if (authError) {
        console.error('Error creating Supabase auth user:', authError);
      } else {
        console.log('Created Supabase auth user');
        // Add the Supabase user ID to our user record
        if (authData.user) {
          userToInsert = {
            ...userToInsert,
            supabaseId: authData.user.id
          };
        }
      }
    } catch (error) {
      console.error('Error creating Supabase auth user:', error);
    }
    
    // Insert the user into our Supabase table
    const { data, error } = await supabase
      .from('users')
      .insert(userToInsert)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
    
    return data as User;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User | undefined> {
    // If updating password, hash it
    let updatedData = { ...userData };
    
    if (updatedData.password) {
      const salt = randomBytes(16).toString('hex');
      const passwordHash = await this.hashPassword(updatedData.password, salt);
      updatedData = {
        ...updatedData,
        password: passwordHash,
        salt
      };
    }
    
    const { data, error } = await supabase
      .from('users')
      .update(updatedData)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
    
    return data as User;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
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

  async updateUserStripeInfo(userId: number, data: { customerId: string, subscriptionId: string }): Promise<User> {
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

  async getFeedbackByUser(userId: number): Promise<Feedback[]> {
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
  private async hashPassword(password: string, salt: string): Promise<string> {
    const hashBuffer = await scryptAsync(password, salt, 64) as Buffer;
    return hashBuffer.toString('hex');
  }

  private async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const hashBuffer = Buffer.from(hash, 'hex');
    const keyBuffer = await scryptAsync(password, salt, 64) as Buffer;
    return timingSafeEqual(hashBuffer, keyBuffer);
  }
}