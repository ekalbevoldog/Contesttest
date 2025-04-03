import { 
  InsertSession, InsertAthlete, InsertBusiness, 
  InsertCampaign, InsertMatch, InsertMessage, InsertUser, InsertFeedback, InsertPartnershipOffer,
  Session, Athlete, Business, Campaign, Match, Message, User, Feedback, PartnershipOffer, MessageMetadata,
  users, sessions, athletes, businesses, campaigns, matches, messages, feedbacks, partnershipOffers
} from "./schema";
import { db, testConnection } from "./db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { neon } from "@neondatabase/serverless";

const scryptAsync = promisify(scrypt);

// Interface for storage operations
export interface IStorage {
  // Session operations
  getSession(sessionId: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(sessionId: string, data: Partial<Session>): Promise<Session>;
  deleteSession(sessionId: string): Promise<void>;

  // Athlete operations
  getAthlete(id: number): Promise<Athlete | undefined>;
  getAthleteBySession(sessionId: string): Promise<Athlete | undefined>;
  storeAthleteProfile(athlete: InsertAthlete): Promise<Athlete>;
  getAllAthletes(): Promise<Athlete[]>;

  // Business operations
  getBusiness(id: number): Promise<Business | undefined>;
  getBusinessBySession(sessionId: string): Promise<Business | undefined>;
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
  storeMessage(sessionId: string, role: string, content: string, metadata?: MessageMetadata, senderId?: number, recipientId?: number): Promise<Message>;
  getUnreadMessageCounts(userId: number): Promise<{ [sessionId: string]: number }>;
  markMessagesRead(sessionId: string, messageIds: number[]): Promise<void>;

  // Auth operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(userId: number, userData: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, data: { customerId: string, subscriptionId: string }): Promise<User>;

  // Feedback operations
  getFeedback(id: number): Promise<Feedback | undefined>;
  getFeedbackByUser(userId: number): Promise<Feedback[]>;
  getFeedbackByMatch(matchId: number): Promise<Feedback[]>;
  getFeedbackByType(feedbackType: string): Promise<Feedback[]>;
  getPublicFeedback(): Promise<Feedback[]>;
  storeFeedback(feedback: InsertFeedback): Promise<Feedback>;
  updateFeedbackStatus(feedbackId: number, status: string): Promise<Feedback>;
  addAdminResponse(feedbackId: number, response: string): Promise<Feedback>;

  // Session Store for Express Session
  sessionStore: session.Store;
}

// PostgreSQL implementation of IStorage
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Create session store for Express sessions using memorystore for now due to Neon compatibility issues
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
    
    // Validate database connection
    if (!db) {
      console.error("❌ Database instance is null, operations will fail");
    }
  }
  
  /**
   * Checks if the database connection is available and returns the Drizzle ORM instance
   * @returns The Drizzle ORM instance
   * @throws Error if the database connection is not available
   */
  private checkDbConnection() {
    if (!db) {
      throw new Error("Database connection not available");
    }
    return db;
  }

  // Session operations
  async getSession(sessionId: string): Promise<Session | undefined> {
    if (!db) {
      console.error("❌ Database not available for getSession operation");
      throw new Error("Database connection not available");
    }
    
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId));
    return session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  async updateSession(sessionId: string, data: Partial<Session>): Promise<Session> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    
    const [updatedSession] = await db
      .update(sessions)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(sessions.sessionId, sessionId))
      .returning();

    if (!updatedSession) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }

    return updatedSession;
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    
    await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
  }

  // Athlete operations
  async getAthlete(id: number): Promise<Athlete | undefined> {
    const dbConn = this.checkDbConnection();
    const [athlete] = await dbConn.select().from(athletes).where(eq(athletes.id, id));
    return athlete;
  }

  async getAthleteBySession(sessionId: string): Promise<Athlete | undefined> {
    const dbConn = this.checkDbConnection();
    const [athlete] = await dbConn.select().from(athletes).where(eq(athletes.sessionId, sessionId));
    return athlete;
  }

  async storeAthleteProfile(athlete: InsertAthlete): Promise<Athlete> {
    const dbConn = this.checkDbConnection();
    const [newAthlete] = await dbConn.insert(athletes).values(athlete).returning();
    return newAthlete;
  }

  async getAllAthletes(): Promise<Athlete[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(athletes);
  }

  // Business operations
  async getBusiness(id: number): Promise<Business | undefined> {
    const dbConn = this.checkDbConnection();
    const [business] = await dbConn.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async getBusinessBySession(sessionId: string): Promise<Business | undefined> {
    const dbConn = this.checkDbConnection();
    const [business] = await dbConn.select().from(businesses).where(eq(businesses.sessionId, sessionId));
    return business;
  }

  async storeBusinessProfile(business: InsertBusiness): Promise<Business> {
    const dbConn = this.checkDbConnection();
    const [newBusiness] = await dbConn.insert(businesses).values(business).returning();
    return newBusiness;
  }

  async getAllBusinesses(): Promise<Business[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(businesses);
  }

  // Campaign operations
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const dbConn = this.checkDbConnection();
    const [campaign] = await dbConn.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaignsByBusiness(businessId: number): Promise<Campaign[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(campaigns).where(eq(campaigns.businessId, businessId));
  }

  async storeCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const dbConn = this.checkDbConnection();
    const [newCampaign] = await dbConn.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }

  // Match operations
  async getMatch(id: number): Promise<Match | undefined> {
    const dbConn = this.checkDbConnection();
    const [match] = await dbConn.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async getMatchesForAthlete(athleteId: number): Promise<Match[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(matches).where(eq(matches.athleteId, athleteId));
  }

  async getMatchesForBusiness(businessId: number): Promise<Match[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(matches).where(eq(matches.businessId, businessId));
  }

  async storeMatch(match: InsertMatch): Promise<Match> {
    const dbConn = this.checkDbConnection();
    const [newMatch] = await dbConn.insert(matches).values(match).returning();
    return newMatch;
  }

  async getAllMatches(): Promise<Match[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(matches);
  }

  // Message operations
  async getMessages(sessionId: string, limit = 50, offset = 0): Promise<Message[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async storeMessage(sessionId: string, role: string, content: string, metadata?: MessageMetadata, senderId?: number, recipientId?: number): Promise<Message> {
    const dbConn = this.checkDbConnection();
    const [message] = await dbConn.insert(messages).values({
      sessionId,
      role,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      unread: true,
      read: false,
      senderId: senderId || null,
      recipientId: recipientId || null
    }).returning();

    return message;
  }

  async getUnreadMessageCounts(userId: number): Promise<{ [sessionId: string]: number }> {
    const dbConn = this.checkDbConnection();
    const messagesResult = await dbConn.select()
      .from(messages)
      .where(and(
        eq(messages.recipientId, userId),
        eq(messages.unread, true)
      ));

    const counts: { [sessionId: string]: number } = {};
    messagesResult.forEach(message => {
      if (message.sessionId) {
        if (!counts[message.sessionId]) {
          counts[message.sessionId] = 0;
        }
        counts[message.sessionId]++;
      }
    });

    return counts;
  }

  async markMessagesRead(sessionId: string, messageIds: number[]): Promise<void> {
    const dbConn = this.checkDbConnection();
    await dbConn.update(messages)
      .set({ 
        unread: false,
        read: true 
      })
      .where(and(
        eq(messages.sessionId, sessionId),
        inArray(messages.id, messageIds)
      ));
  }


  // Auth operations
  async getUser(id: number): Promise<User | undefined> {
    const dbConn = this.checkDbConnection();
    const [user] = await dbConn.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const dbConn = this.checkDbConnection();
    const [user] = await dbConn.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const dbConn = this.checkDbConnection();
    const [user] = await dbConn.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User | undefined> {
    const dbConn = this.checkDbConnection();
    // Remove properties that shouldn't be directly updated
    const { id, createdAt, ...safeUserData } = userData as any;

    const [updatedUser] = await dbConn
      .update(users)
      .set({
        ...safeUserData,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const dbConn = this.checkDbConnection();
    const [updatedUser] = await dbConn
      .update(users)
      .set({
        stripeCustomerId: customerId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return updatedUser;
  }

  async updateUserStripeInfo(userId: number, data: { customerId: string, subscriptionId: string }): Promise<User> {
    const dbConn = this.checkDbConnection();
    const [updatedUser] = await dbConn
      .update(users)
      .set({
        stripeCustomerId: data.customerId,
        stripeSubscriptionId: data.subscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found`);
    }

    return updatedUser;
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    const dbConn = this.checkDbConnection();
    const [feedback] = await dbConn.select().from(feedbacks).where(eq(feedbacks.id, id));
    return feedback;
  }

  async getFeedbackByUser(userId: number): Promise<Feedback[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(feedbacks).where(eq(feedbacks.userId, userId));
  }

  async getFeedbackByMatch(matchId: number): Promise<Feedback[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(feedbacks).where(eq(feedbacks.matchId, matchId));
  }

  async getFeedbackByType(feedbackType: string): Promise<Feedback[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(feedbacks).where(eq(feedbacks.feedbackType, feedbackType));
  }

  async getPublicFeedback(): Promise<Feedback[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(feedbacks).where(eq(feedbacks.isPublic, true));
  }

  async storeFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const dbConn = this.checkDbConnection();
    const [newFeedback] = await dbConn.insert(feedbacks).values(feedback).returning();
    return newFeedback;
  }

  async updateFeedbackStatus(feedbackId: number, status: string): Promise<Feedback> {
    const dbConn = this.checkDbConnection();
    const [updatedFeedback] = await dbConn
      .update(feedbacks)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(feedbacks.id, feedbackId))
      .returning();

    if (!updatedFeedback) {
      throw new Error(`Feedback with ID ${feedbackId} not found`);
    }

    return updatedFeedback;
  }

  async addAdminResponse(feedbackId: number, response: string): Promise<Feedback> {
    const dbConn = this.checkDbConnection();
    const [updatedFeedback] = await dbConn
      .update(feedbacks)
      .set({
        adminResponse: response,
        updatedAt: new Date()
      })
      .where(eq(feedbacks.id, feedbackId))
      .returning();

    if (!updatedFeedback) {
      throw new Error(`Feedback with ID ${feedbackId} not found`);
    }

    return updatedFeedback;
  }

  // Partnership Offer operations
  async getPartnershipOffer(id: number): Promise<PartnershipOffer | undefined> {
    const dbConn = this.checkDbConnection();
    const [offer] = await dbConn.select().from(partnershipOffers).where(eq(partnershipOffers.id, id));
    return offer;
  }

  async getPartnershipOffersByAthlete(athleteId: number): Promise<PartnershipOffer[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(partnershipOffers).where(eq(partnershipOffers.athleteId, athleteId));
  }

  async getPartnershipOffersByBusiness(businessId: number): Promise<PartnershipOffer[]> {
    const dbConn = this.checkDbConnection();
    return await dbConn.select().from(partnershipOffers).where(eq(partnershipOffers.businessId, businessId));
  }

  async getPartnershipOffersByMatch(matchId: number): Promise<PartnershipOffer | undefined> {
    const dbConn = this.checkDbConnection();
    const [offer] = await dbConn.select().from(partnershipOffers).where(eq(partnershipOffers.matchId, matchId));
    return offer;
  }

  async createPartnershipOffer(offer: InsertPartnershipOffer): Promise<PartnershipOffer> {
    const dbConn = this.checkDbConnection();
    const [newOffer] = await dbConn.insert(partnershipOffers).values(offer).returning();
    return newOffer;
  }

  async updatePartnershipOfferStatus(id: number, status: string): Promise<PartnershipOffer> {
    const dbConn = this.checkDbConnection();
    const now = new Date();
    const [updatedOffer] = await dbConn
      .update(partnershipOffers)
      .set({
        status,
        athleteRespondedAt: status !== "pending" ? now : undefined,
        updatedAt: now
      })
      .where(eq(partnershipOffers.id, id))
      .returning();

    if (!updatedOffer) {
      throw new Error(`Partnership offer with ID ${id} not found`);
    }

    return updatedOffer;
  }

  async markPartnershipOfferViewed(id: number): Promise<PartnershipOffer> {
    const dbConn = this.checkDbConnection();
    const now = new Date();
    const [updatedOffer] = await dbConn
      .update(partnershipOffers)
      .set({
        athleteViewedAt: now,
        updatedAt: now
      })
      .where(eq(partnershipOffers.id, id))
      .returning();

    if (!updatedOffer) {
      throw new Error(`Partnership offer with ID ${id} not found`);
    }

    return updatedOffer;
  }

  async updatePartnershipOfferComplianceStatus(id: number, status: string, notes?: string): Promise<PartnershipOffer> {
    const dbConn = this.checkDbConnection();
    const now = new Date();
    const [updatedOffer] = await dbConn
      .update(partnershipOffers)
      .set({
        complianceStatus: status,
        complianceNotes: notes,
        complianceReviewedAt: now,
        updatedAt: now
      })
      .where(eq(partnershipOffers.id, id))
      .returning();

    if (!updatedOffer) {
      throw new Error(`Partnership offer with ID ${id} not found`);
    }

    return updatedOffer;
  }
}

// For backwards compatibility and fallback
export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private athletes: Map<number, Athlete>;
  private businesses: Map<number, Business>;
  private campaigns: Map<number, Campaign>;
  private matches: Map<number, Match>;
  private partnershipOffers: Map<number, PartnershipOffer>;
  private messages: Map<string, Message[]>;
  private users: Map<number, User>;
  private feedbacks: Map<number, Feedback>;
  private currentSessionId: number;
  private currentAthleteId: number;
  private currentBusinessId: number;
  private currentCampaignId: number;
  private currentMatchId: number;
  private currentPartnershipOfferId: number;
  private currentMessageId: number;
  private currentUserId: number;
  private currentFeedbackId: number;
  sessionStore: session.Store;

  constructor() {
    this.sessions = new Map();
    this.athletes = new Map();
    this.businesses = new Map();
    this.campaigns = new Map();
    this.matches = new Map();
    this.partnershipOffers = new Map();
    this.messages = new Map();
    this.users = new Map();
    this.feedbacks = new Map();
    this.currentSessionId = 1;
    this.currentAthleteId = 1;
    this.currentBusinessId = 1;
    this.currentCampaignId = 1;
    this.currentMatchId = 1;
    this.currentPartnershipOfferId = 1;
    this.currentMessageId = 1;
    this.currentUserId = 1;
    this.currentFeedbackId = 1;

    // Create a memory store for Express sessions
    // Initialize with basic memory store until the import completes
    this.sessionStore = new session.MemoryStore();
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    return this.sessions.get(sessionId);
  }

  async createSession(session: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;

    const newSession: Session = {
      id,
      sessionId: session.sessionId,
      userType: session.userType || null,
      data: session.data || null,
      profileCompleted: session.profileCompleted || false,
      athleteId: session.athleteId || null,
      businessId: session.businessId || null,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(session.sessionId, newSession);
    return newSession;
  }

  async updateSession(sessionId: string, data: Partial<Session>): Promise<Session> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }

    const updatedSession: Session = {
      ...session,
      ...data,
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async getAthlete(id: number): Promise<Athlete | undefined> {
    return this.athletes.get(id);
  }

  async getAthleteBySession(sessionId: string): Promise<Athlete | undefined> {
    const athletes = Array.from(this.athletes.values());
    return athletes.find(athlete => athlete.sessionId === sessionId);
  }

  async storeAthleteProfile(athlete: InsertAthlete): Promise<Athlete> {
    const id = this.currentAthleteId++;

    const newAthlete: Athlete = {
      id,
      ...athlete,
      userId: null,
      email: null,
      phone: null,
      birthdate: null,
      gender: null,
      bio: null,
      graduationYear: null,
      major: null,
      gpa: null,
      academicHonors: null,
      position: null,
      sportAchievements: null,
      stats: null,
      socialHandles: null,
      averageEngagementRate: null,
      contentQuality: null,
      postFrequency: null,
      contentTypes: null,
      topPerformingContentThemes: null,
      mediaKit: null,
      preferredProductCategories: null,
      previousBrandDeals: null,
      availableForTravel: null,
      exclusivityRequirements: null,
      personalValues: null,
      causes: null,
      brandPersonality: null,
      availabilityTimeframe: null,
      minimumCompensation: null,
      preferences: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.athletes.set(id, newAthlete);
    return newAthlete;
  }

  async getAllAthletes(): Promise<Athlete[]> {
    return Array.from(this.athletes.values());
  }

  async getBusiness(id: number): Promise<Business | undefined> {
    return this.businesses.get(id);
  }

  async getBusinessBySession(sessionId: string): Promise<Business | undefined> {
    const businesses = Array.from(this.businesses.values());
    return businesses.find(business => business.sessionId === sessionId);
  }

  async storeBusinessProfile(business: InsertBusiness): Promise<Business> {
    const id = this.currentBusinessId++;

    const newBusiness: Business = {
      id,
      ...business,
      userId: null,
      email: null,
      phone: null,
      industry: null,
      companySize: null,
      foundedYear: null,
      website: null,
      logo: null,
      productDescription: null,
      productImages: null,
      pricingTier: null,
      audienceDemographics: null,
      primaryAudienceAgeRange: null,
      secondaryAudienceAgeRange: null,
      campaignGoals: null,
      campaignFrequency: null,
      campaignDuration: null,
      campaignSeasonality: null,
      campaignTimeline: null,
      brandVoice: null,
      brandColors: null,
      brandGuidelines: null,
      sustainabilityFocus: null,
      preferredSports: null,
      preferredDivisions: null,
      preferredRegions: null,
      budget: null,
      compensationModel: null,
      budgetPerAthlete: null,
      previousInfluencerCampaigns: null,
      campaignSuccessMetrics: null,
      preferences: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.businesses.set(id, newBusiness);
    return newBusiness;
  }

  async getAllBusinesses(): Promise<Business[]> {
    return Array.from(this.businesses.values());
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByBusiness(businessId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values())
      .filter(campaign => campaign.businessId === businessId);
  }

  async storeCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentCampaignId++;

    const newCampaign: Campaign = {
      id,
      ...campaign,
      status: null,
      budget: null,
      campaignBrief: null,
      contentTypes: null,
      athleteRequirements: null,
      audienceTargeting: null,
      deliveryTimeline: null,
      compensationDetails: null,
      messageGuidelines: null,
      trackingMetrics: null,
      approvalWorkflow: null,
      legalDisclosures: null,
      exclusivityTerms: null,
      contentRights: null,
      paymentTerms: null,
      cancellationPolicy: null,
      creativeAssets: null,
      goals: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.campaigns.set(id, newCampaign);
    return newCampaign;
  }

  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getMatchesForAthlete(athleteId: number): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(match => match.athleteId === athleteId);
  }

  async getMatchesForBusiness(businessId: number): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(match => match.businessId === businessId);
  }

  async storeMatch(match: InsertMatch): Promise<Match> {
    const id = this.currentMatchId++;

    const newMatch: Match = {
      id,
      ...match,
      status: null,
      strengthAreas: null,
      weaknessAreas: null,
      potentialCollaboration: null,
      riskFactors: null,
      deliverables: null,
      compensation: null,
      platformPreferences: null,
      contentType: null,
      contentRequirements: null,
      timeline: null,
      complianceRequirements: null,
      contactDetails: null,
      nextSteps: null,
      matchedAt: null,
      respondedAt: null,
      approvedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };

    this.matches.set(id, newMatch);
    return newMatch;
  }

  async getAllMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    return this.messages.get(sessionId) || [];
  }

  async storeMessage(sessionId: string, role: string, content: string, metadata?: MessageMetadata, senderId?: number, recipientId?: number): Promise<Message> {
    const id = this.currentMessageId++;

    const message: Message = {
      id,
      sessionId,
      role,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      unread: true,
      read: false,
      senderId: senderId || null,
      recipientId: recipientId || null,
      createdAt: new Date(),
    };

    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(sessionId, sessionMessages);

    return message;
  }

  async getUnreadMessageCounts(userId: number): Promise<{ [sessionId: string]: number }> {
    const counts: { [sessionId: string]: number } = {};
    
    // Iterate through all sessions
    for (const [sessionId, sessionMessages] of this.messages.entries()) {
      // Count unread messages for this user in this session
      const unreadCount = sessionMessages.filter(msg => 
        msg.recipientId === userId && msg.unread === true
      ).length;
      
      if (unreadCount > 0) {
        counts[sessionId] = unreadCount;
      }
    }
    
    return counts;
  }

  async markMessagesRead(sessionId: string, messageIds: number[]): Promise<void> {
    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.forEach(msg => {
      if (messageIds.includes(msg.id)) {
        msg.unread = false;
        msg.read = true;
      }
    });
    this.messages.set(sessionId, sessionMessages);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;

    const newUser: User = {
      id,
      ...insertUser,
      verified: false,
      sessionId: null,
      avatar: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(userId);

    if (!user) {
      return undefined;
    }

    // Remove properties that shouldn't be directly updated
    const { id, createdAt, ...safeUserData } = userData as any;

    const updatedUser: User = {
      ...user,
      ...safeUserData,
      updatedAt: new Date(),
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const updatedUser: User = {
      ...user,
      stripeCustomerId: customerId,
      updatedAt: new Date(),
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(userId: number, data: { customerId: string, subscriptionId: string }): Promise<User> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const updatedUser: User = {
      ...user,
      stripeCustomerId: data.customerId,
      stripeSubscriptionId: data.subscriptionId,
      updatedAt: new Date(),
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    return this.feedbacks.get(id);
  }

  async getFeedbackByUser(userId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.userId === userId);
  }

  async getFeedbackByMatch(matchId: number): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.matchId === matchId);
  }

  async getFeedbackByType(feedbackType: string): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.feedbackType === feedbackType);
  }

  async getPublicFeedback(): Promise<Feedback[]> {
    return Array.from(this.feedbacks.values())
      .filter(feedback => feedback.isPublic);
  }

  async storeFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const id = this.currentFeedbackId++;

    const newFeedback: Feedback = {
      id,
      ...feedback,
      sentiment: null,
      status: 'pending',
      adminResponse: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.feedbacks.set(id, newFeedback);
    return newFeedback;
  }

  async updateFeedbackStatus(feedbackId: number, status: string): Promise<Feedback> {
    const feedback = this.feedbacks.get(feedbackId);
    if (!feedback) {
      throw new Error(`Feedback with ID ${feedbackId} not found`);
    }

    const updatedFeedback: Feedback = {
      ...feedback,
      status,
      updatedAt: new Date(),
    };

    this.feedbacks.set(feedbackId, updatedFeedback);
    return updatedFeedback;
  }

  async addAdminResponse(feedbackId: number, response: string): Promise<Feedback> {
    const feedback = this.feedbacks.get(feedbackId);
    if (!feedback) {
      throw new Error(`Feedback with ID ${feedbackId} not found`);
    }

    const updatedFeedback: Feedback = {
      ...feedback,
      adminResponse: response,
      updatedAt: new Date(),
    };

    this.feedbacks.set(feedbackId, updatedFeedback);
    return updatedFeedback;
  }

  // Partnership Offer operations
  async getPartnershipOffer(id: number): Promise<PartnershipOffer | undefined> {
    return this.partnershipOffers.get(id);
  }

  async getPartnershipOffersByAthlete(athleteId: number): Promise<PartnershipOffer[]> {
    return Array.from(this.partnershipOffers.values())
      .filter(offer => offer.athleteId === athleteId);
  }

  async getPartnershipOffersByBusiness(businessId: number): Promise<PartnershipOffer[]> {
    return Array.from(this.partnershipOffers.values())
      .filter(offer => offer.businessId === businessId);
  }

  async getPartnershipOffersByMatch(matchId: number): Promise<PartnershipOffer | undefined> {
    return Array.from(this.partnershipOffers.values())
      .find(offer => offer.matchId === matchId);
  }

  async createPartnershipOffer(offer: InsertPartnershipOffer): Promise<PartnershipOffer> {
    const id = this.currentPartnershipOfferId++;

    const newOffer: PartnershipOffer = {
      id,
      ...offer,
      status: "pending",
      athleteViewedAt: null,
      athleteRespondedAt: null,
      businessUpdatedAt: new Date(),
      complianceStatus: "pending",
      complianceNotes: null,
      complianceReviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: offer.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days expiry
    };

    this.partnershipOffers.set(id, newOffer);
    return newOffer;
  }

  async updatePartnershipOfferStatus(id: number, status: string): Promise<PartnershipOffer> {
    const offer = this.partnershipOffers.get(id);
    if (!offer) {
      throw new Error(`Partnership offer with ID ${id} not found`);
    }

    const updatedOffer: PartnershipOffer = {
      ...offer,
      status,
      athleteRespondedAt: status !== "pending" ? new Date() : offer.athleteRespondedAt,
      updatedAt: new Date(),
    };

    this.partnershipOffers.set(id, updatedOffer);
    return updatedOffer;
  }

  async markPartnershipOfferViewed(id: number): Promise<PartnershipOffer> {
    const offer = this.partnershipOffers.get(id);
    if (!offer) {
      throw new Error(`Partnership offer with ID ${id} not found`);
    }

    const updatedOffer: PartnershipOffer = {
      ...offer,
      athleteViewedAt: new Date(),
      updatedAt: new Date(),
    };

    this.partnershipOffers.set(id, updatedOffer);
    return updatedOffer;
  }

  async updatePartnershipOfferComplianceStatus(id: number, status: string, notes?: string): Promise<PartnershipOffer> {
    const offer = this.partnershipOffers.get(id);
    if (!offer) {
      throw new Error(`Partnership offer with ID ${id} not found`);
    }

    const updatedOffer: PartnershipOffer = {
      ...offer,
      complianceStatus: status,
      complianceNotes: notes || offer.complianceNotes,
      complianceReviewedAt: new Date(),
      updatedAt: new Date(),
    };

    this.partnershipOffers.set(id, updatedOffer);
    return updatedOffer;
  }
}

// Import Supabase storage implementation
import { SupabaseStorage, getSupabaseStorage } from "./supabaseStorage";
import supabaseClient from "./supabaseClient";

// Create and export storage instance
// We'll try to use Supabase first, then PostgreSQL direct connection if available
// otherwise fall back to in-memory storage

// Initialize with memory storage as default
let storage: IStorage = new MemStorage();

// Try to set up storage with appropriate implementation
(async () => {
  try {
    // First, try to use Supabase client if available
    if (supabaseClient) {
      try {
        console.log('🔍 Attempting to use Supabase client...');
        storage = getSupabaseStorage();
        console.log('✅ Successfully initialized Supabase storage');
        return; // Exit early if Supabase client works
      } catch (supabaseError) {
        console.error('❌ Supabase client initialization failed:', supabaseError);
        console.log('⚠️ Falling back to direct PostgreSQL connection...');
      }
    }
    
    // Next, try direct PostgreSQL connection if Supabase client fails
    const isConnected = await testConnection();
    if (isConnected && db) {
      console.log('✅ Direct PostgreSQL connection successful - using DatabaseStorage implementation');
      storage = new DatabaseStorage();
    } else {
      console.warn('⚠️ Both Supabase and direct database connections failed');
      console.warn('⚠️ Using in-memory storage as last resort fallback');
    }
  } catch (error) {
    console.error('❌ Error during storage initialization:', error);
    console.warn('⚠️ Using in-memory storage as fallback due to connection errors');
  }
})();

export { storage };