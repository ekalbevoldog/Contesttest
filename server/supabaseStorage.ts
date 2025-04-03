import supabaseClient from './supabaseClient';
import { IStorage } from './storage';
import session from 'express-session';
import memorystore from 'memorystore';
import { 
  users, sessions, athletes, businesses, campaigns, 
  matches, messages, complianceOfficers, partnershipOffers, feedbacks
} from './schema';

// Import types from server/schema.ts
import type { 
  User, InsertUser,
  Athlete, InsertAthlete,
  Business, InsertBusiness,
  Campaign, InsertCampaign,
  Match, InsertMatch,
  Message, InsertMessage,
  ComplianceOfficer, InsertComplianceOfficer,
  PartnershipOffer, InsertPartnershipOffer,
  Feedback, InsertFeedback,
  Session, InsertSession,
  MessageMetadata
} from './schema';

/**
 * Implementation of storage interface using Supabase client
 * 
 * This class handles all database operations through the Supabase JavaScript client
 * instead of direct PostgreSQL connections
 */
export class SupabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  // Create Express session store
  constructor() {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }
    
    // Initialize memory store for session storage
    const MemoryStore = memorystore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    console.log('✅ SupabaseStorage initialized with Supabase client');
  }

  // ================= SESSION OPERATIONS =================
  async createSession(session: InsertSession): Promise<Session> {
    const { data, error } = await supabaseClient
      .from('sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return data as Session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const { data, error } = await supabaseClient
      .from('sessions')
      .select()
      .eq('sessionId', sessionId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get session: ${error.message}`);
    }
    
    return data as Session || undefined;
  }

  async updateSession(sessionId: string, session: Partial<Session>): Promise<Session> {
    const { data, error } = await supabaseClient
      .from('sessions')
      .update(session)
      .eq('sessionId', sessionId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update session: ${error.message}`);
    return data as Session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('sessions')
      .delete()
      .eq('sessionId', sessionId);
    
    if (error) throw new Error(`Failed to delete session: ${error.message}`);
  }

  // ================= USER OPERATIONS =================
  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabaseClient
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return data as User;
  }

  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabaseClient
      .from('users')
      .select()
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get user by ID: ${error.message}`);
    }
    
    return data as User || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabaseClient
      .from('users')
      .select()
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get user by username: ${error.message}`);
    }
    
    return data as User || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabaseClient
      .from('users')
      .select()
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }
    
    return data as User || undefined;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const { data, error } = await supabaseClient
      .from('users')
      .update({ stripeCustomerId: customerId })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update Stripe customer ID: ${error.message}`);
    return data as User;
  }
  
  async updateUserStripeInfo(userId: number, data: { customerId: string, subscriptionId: string }): Promise<User> {
    const { data: userData, error } = await supabaseClient
      .from('users')
      .update({ 
        stripeCustomerId: data.customerId,
        stripeSubscriptionId: data.subscriptionId
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update user Stripe information: ${error.message}`);
    return userData as User;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    const { data, error } = await supabaseClient
      .from('users')
      .update(user)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update user: ${error.message}`);
    return data as User;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabaseClient
      .from('users')
      .select();
    
    if (error) throw new Error(`Failed to get all users: ${error.message}`);
    return data as User[];
  }

  // ================= ATHLETE OPERATIONS =================
  async storeAthleteProfile(athlete: InsertAthlete): Promise<Athlete> {
    const { data, error } = await supabaseClient
      .from('athlete_profiles')
      .insert(athlete)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create athlete profile: ${error.message}`);
    return data as Athlete;
  }

  async getAthlete(id: number): Promise<Athlete | undefined> {
    const { data, error } = await supabaseClient
      .from('athlete_profiles')
      .select()
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get athlete by ID: ${error.message}`);
    }
    
    return data as Athlete || undefined;
  }

  async getAthleteByUserId(userId: number): Promise<Athlete | null> {
    const { data, error } = await supabaseClient
      .from('athlete_profiles')
      .select()
      .eq('userId', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get athlete by user ID: ${error.message}`);
    }
    
    return data as Athlete || null;
  }

  async getAthleteBySession(sessionId: string): Promise<Athlete | undefined> {
    const { data, error } = await supabaseClient
      .from('athlete_profiles')
      .select()
      .eq('sessionId', sessionId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get athlete by session ID: ${error.message}`);
    }
    
    return data as Athlete || undefined;
  }

  async getAthleteByProfileLink(profileLinkId: string): Promise<Athlete | null> {
    const { data, error } = await supabaseClient
      .from('athlete_profiles')
      .select()
      .eq('profileLinkId', profileLinkId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get athlete by profile link: ${error.message}`);
    }
    
    return data as Athlete || null;
  }

  async updateAthlete(id: number, athlete: Partial<Athlete>): Promise<Athlete> {
    const { data, error } = await supabaseClient
      .from('athlete_profiles')
      .update(athlete)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update athlete profile: ${error.message}`);
    return data as Athlete;
  }

  async getAllAthletes(): Promise<Athlete[]> {
    const { data, error } = await supabaseClient
      .from('athlete_profiles')
      .select();
    
    if (error) throw new Error(`Failed to get all athletes: ${error.message}`);
    return data as Athlete[];
  }

  // ================= BUSINESS OPERATIONS =================
  async storeBusinessProfile(business: InsertBusiness): Promise<Business> {
    const { data, error } = await supabaseClient
      .from('business_profiles')
      .insert(business)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create business profile: ${error.message}`);
    return data as Business;
  }

  async getBusiness(id: number): Promise<Business | undefined> {
    const { data, error } = await supabaseClient
      .from('business_profiles')
      .select()
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get business by ID: ${error.message}`);
    }
    
    return data as Business || undefined;
  }

  async getBusinessBySession(sessionId: string): Promise<Business | undefined> {
    const { data, error } = await supabaseClient
      .from('business_profiles')
      .select()
      .eq('sessionId', sessionId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get business by session ID: ${error.message}`);
    }
    
    return data as Business || undefined;
  }

  async getBusinessByUserId(userId: number): Promise<Business | null> {
    const { data, error } = await supabaseClient
      .from('business_profiles')
      .select()
      .eq('userId', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get business by user ID: ${error.message}`);
    }
    
    return data as Business || null;
  }

  async updateBusiness(id: number, business: Partial<Business>): Promise<Business> {
    const { data, error } = await supabaseClient
      .from('business_profiles')
      .update(business)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update business profile: ${error.message}`);
    return data as Business;
  }

  async getAllBusinesses(): Promise<Business[]> {
    const { data, error } = await supabaseClient
      .from('business_profiles')
      .select();
    
    if (error) throw new Error(`Failed to get all businesses: ${error.message}`);
    return data as Business[];
  }

  // ================= CAMPAIGN OPERATIONS =================
  async storeCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const { data, error } = await supabaseClient
      .from('campaigns')
      .insert(campaign)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create campaign: ${error.message}`);
    return data as Campaign;
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const { data, error } = await supabaseClient
      .from('campaigns')
      .select()
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get campaign by ID: ${error.message}`);
    }
    
    return data as Campaign || undefined;
  }

  async getCampaignsByBusiness(businessId: number): Promise<Campaign[]> {
    const { data, error } = await supabaseClient
      .from('campaigns')
      .select()
      .eq('businessId', businessId);
    
    if (error) throw new Error(`Failed to get campaigns by business ID: ${error.message}`);
    return data as Campaign[];
  }

  async updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign> {
    const { data, error } = await supabaseClient
      .from('campaigns')
      .update(campaign)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update campaign: ${error.message}`);
    return data as Campaign;
  }

  // ================= MATCH OPERATIONS =================
  async storeMatch(match: InsertMatch): Promise<Match> {
    const { data, error } = await supabaseClient
      .from('match_scores')
      .insert(match)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create match: ${error.message}`);
    return data as Match;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const { data, error } = await supabaseClient
      .from('match_scores')
      .select()
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get match by ID: ${error.message}`);
    }
    
    return data as Match || undefined;
  }

  async getMatchesForAthlete(athleteId: number): Promise<Match[]> {
    const { data, error } = await supabaseClient
      .from('match_scores')
      .select()
      .eq('athleteId', athleteId)
      .order('score', { ascending: false });
    
    if (error) throw new Error(`Failed to get matches by athlete ID: ${error.message}`);
    return data as Match[];
  }

  async getMatchesForBusiness(businessId: number): Promise<Match[]> {
    const { data, error } = await supabaseClient
      .from('match_scores')
      .select()
      .eq('businessId', businessId)
      .order('score', { ascending: false });
    
    if (error) throw new Error(`Failed to get matches by business ID: ${error.message}`);
    return data as Match[];
  }
  
  async getAllMatches(): Promise<Match[]> {
    const { data, error } = await supabaseClient
      .from('match_scores')
      .select()
      .order('createdAt', { ascending: false });
    
    if (error) throw new Error(`Failed to get all matches: ${error.message}`);
    return data as Match[];
  }

  async getMatchesByCampaignId(campaignId: number): Promise<Match[]> {
    const { data, error } = await supabaseClient
      .from('match_scores')
      .select()
      .eq('campaignId', campaignId)
      .order('score', { ascending: false });
    
    if (error) throw new Error(`Failed to get matches by campaign ID: ${error.message}`);
    return data as Match[];
  }

  // ================= MESSAGE OPERATIONS =================
  async storeMessage(sessionId: string, role: string, content: string, metadata?: MessageMetadata, senderId?: number, recipientId?: number): Promise<Message> {
    const message: InsertMessage = {
      sessionId,
      role,
      content,
      metadata: metadata || null,
      unread: true,
      senderId: senderId || null,
      recipientId: recipientId || null
    };
    
    const { data, error } = await supabaseClient
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to store message: ${error.message}`);
    return data as Message;
  }
  
  async getMessages(sessionId: string, limit = 50, offset = 0): Promise<Message[]> {
    const query = supabaseClient
      .from('messages')
      .select()
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: true })
      .limit(limit);
    
    // Add offset if needed
    if (offset > 0) {
      query.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to get messages: ${error.message}`);
    return data as Message[];
  }

  async getUnreadMessageCounts(userId: number): Promise<Record<string, number>> {
    // With Supabase client, we need to handle this differently since we can't use PostgreSQL group by directly
    // First, get all unread messages for the user
    const { data, error } = await supabaseClient
      .from('messages')
      .select('sessionId')
      .eq('recipientId', userId)
      .eq('unread', true);
    
    if (error) throw new Error(`Failed to get unread message counts: ${error.message}`);
    
    // Manually count messages by sessionId
    const counts: Record<string, number> = {};
    if (data && Array.isArray(data)) {
      data.forEach((message: any) => {
        if (message.sessionId) {
          counts[message.sessionId] = (counts[message.sessionId] || 0) + 1;
        }
      });
    }
    
    return counts;
  }

  async markMessagesRead(sessionId: string, messageIds: number[]): Promise<void> {
    if (messageIds.length === 0) return;
    
    const { error } = await supabaseClient
      .from('messages')
      .update({ unread: false, read: true })
      .eq('sessionId', sessionId)
      .in('id', messageIds);
    
    if (error) throw new Error(`Failed to mark messages as read: ${error.message}`);
  }
  
  async getMessagesBySessionId(sessionId: string): Promise<Message[]> {
    const { data, error } = await supabaseClient
      .from('messages')
      .select()
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: true });
    
    if (error) throw new Error(`Failed to get messages by session ID: ${error.message}`);
    return data as Message[];
  }

  // ================= COMPLIANCE OFFICER OPERATIONS =================
  async createComplianceOfficer(officer: InsertComplianceOfficer): Promise<ComplianceOfficer> {
    const { data, error } = await supabaseClient
      .from('compliance_officers')
      .insert(officer)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create compliance officer: ${error.message}`);
    return data as ComplianceOfficer;
  }

  async getComplianceOfficerByUserId(userId: number): Promise<ComplianceOfficer | null> {
    const { data, error } = await supabaseClient
      .from('compliance_officers')
      .select()
      .eq('userId', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get compliance officer by user ID: ${error.message}`);
    }
    
    return data as ComplianceOfficer || null;
  }

  // ================= PARTNERSHIP OFFER OPERATIONS =================
  async createPartnershipOffer(offer: InsertPartnershipOffer): Promise<PartnershipOffer> {
    const { data, error } = await supabaseClient
      .from('partnership_offers')
      .insert(offer)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create partnership offer: ${error.message}`);
    return data as PartnershipOffer;
  }

  async getPartnershipOffer(id: number): Promise<PartnershipOffer | undefined> {
    const { data, error } = await supabaseClient
      .from('partnership_offers')
      .select()
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get partnership offer by ID: ${error.message}`);
    }
    
    return data as PartnershipOffer || undefined;
  }

  async getPartnershipOffersByAthlete(athleteId: number): Promise<PartnershipOffer[]> {
    const { data, error } = await supabaseClient
      .from('partnership_offers')
      .select()
      .eq('athleteId', athleteId)
      .order('createdAt', { ascending: false });
    
    if (error) throw new Error(`Failed to get partnership offers by athlete ID: ${error.message}`);
    return data as PartnershipOffer[];
  }

  async getPartnershipOffersByBusiness(businessId: number): Promise<PartnershipOffer[]> {
    const { data, error } = await supabaseClient
      .from('partnership_offers')
      .select()
      .eq('businessId', businessId)
      .order('createdAt', { ascending: false });
    
    if (error) throw new Error(`Failed to get partnership offers by business ID: ${error.message}`);
    return data as PartnershipOffer[];
  }

  async getPartnershipOffersByMatch(matchId: number): Promise<PartnershipOffer | undefined> {
    const { data, error } = await supabaseClient
      .from('partnership_offers')
      .select()
      .eq('matchId', matchId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get partnership offer by match ID: ${error.message}`);
    }
    
    return data as PartnershipOffer || undefined;
  }

  async updatePartnershipOfferStatus(id: number, status: string): Promise<PartnershipOffer> {
    const { data, error } = await supabaseClient
      .from('partnership_offers')
      .update({ status, updatedAt: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update partnership offer status: ${error.message}`);
    return data as PartnershipOffer;
  }

  async markPartnershipOfferViewed(id: number): Promise<PartnershipOffer> {
    const { data, error } = await supabaseClient
      .from('partnership_offers')
      .update({ athleteViewedAt: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to mark partnership offer as viewed: ${error.message}`);
    return data as PartnershipOffer;
  }
  
  async updatePartnershipOfferComplianceStatus(id: number, status: string, notes?: string): Promise<PartnershipOffer> {
    const updateData: any = { 
      complianceStatus: status, 
      complianceReviewedAt: new Date() 
    };
    
    if (notes) {
      updateData.complianceNotes = notes;
    }
    
    const { data, error } = await supabaseClient
      .from('partnership_offers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update partnership offer compliance status: ${error.message}`);
    return data as PartnershipOffer;
  }

  async updatePartnershipOffer(id: number, offer: Partial<PartnershipOffer>): Promise<PartnershipOffer> {
    const { data, error } = await supabaseClient
      .from('partnership_offers')
      .update(offer)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update partnership offer: ${error.message}`);
    return data as PartnershipOffer;
  }

  // ================= FEEDBACK OPERATIONS =================
  async storeFeedback(feedback: InsertFeedback): Promise<Feedback> {
    return this.createFeedback(feedback);
  }
  
  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const { data, error } = await supabaseClient
      .from('feedbacks')
      .insert(feedback)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create feedback: ${error.message}`);
    return data as Feedback;
  }

  async getFeedback(id: number): Promise<Feedback | undefined> {
    const { data, error } = await supabaseClient
      .from('feedbacks')
      .select()
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get feedback by ID: ${error.message}`);
    }
    
    return data as Feedback || undefined;
  }

  async getFeedbackByUser(userId: number): Promise<Feedback[]> {
    return this.getFeedbackByUserId(userId);
  }
  
  async getFeedbackByUserId(userId: number): Promise<Feedback[]> {
    const { data, error } = await supabaseClient
      .from('feedbacks')
      .select()
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    
    if (error) throw new Error(`Failed to get feedback by user ID: ${error.message}`);
    return data as Feedback[];
  }

  async getFeedbackByMatch(matchId: number): Promise<Feedback[]> {
    return this.getFeedbackByMatchId(matchId);
  }
  
  async getFeedbackByMatchId(matchId: number): Promise<Feedback[]> {
    const { data, error } = await supabaseClient
      .from('feedbacks')
      .select()
      .eq('matchId', matchId)
      .order('createdAt', { ascending: false });
    
    if (error) throw new Error(`Failed to get feedback by match ID: ${error.message}`);
    return data as Feedback[];
  }

  async getPublicFeedback(): Promise<Feedback[]> {
    const { data, error } = await supabaseClient
      .from('feedbacks')
      .select()
      .eq('isPublic', true)
      .order('createdAt', { ascending: false });
    
    if (error) throw new Error(`Failed to get public feedback: ${error.message}`);
    return data as Feedback[];
  }

  async updateFeedback(id: number, feedback: Partial<Feedback>): Promise<Feedback> {
    const { data, error } = await supabaseClient
      .from('feedbacks')
      .update(feedback)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`Failed to update feedback: ${error.message}`);
    return data as Feedback;
  }
}

// Create and export a singleton instance of SupabaseStorage
let supabaseStorage: SupabaseStorage | null = null;

export function getSupabaseStorage(): SupabaseStorage {
  if (!supabaseStorage) {
    try {
      supabaseStorage = new SupabaseStorage();
    } catch (error) {
      console.error('❌ Failed to initialize SupabaseStorage:', error);
      throw error;
    }
  }
  return supabaseStorage;
}