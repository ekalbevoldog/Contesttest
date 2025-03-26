import { 
  InsertSession, InsertAthlete, InsertBusiness, 
  InsertCampaign, InsertMatch, InsertMessage, InsertUser,
  Session, Athlete, Business, Campaign, Match, Message, User,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { sessions, athletes, businesses, campaigns, matches, messages } from "../shared/schema";
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
  
  // Message operations
  getMessages(sessionId: string): Promise<Message[]>;
  storeMessage(sessionId: string, role: string, content: string): Promise<Message>;
  
  // Auth operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, data: { customerId: string, subscriptionId: string }): Promise<User>;
  
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
  }
  
  // Session operations
  async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId));
    return session;
  }
  
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }
  
  async updateSession(sessionId: string, data: Partial<Session>): Promise<Session> {
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
    await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
  }
  
  // Athlete operations
  async getAthlete(id: number): Promise<Athlete | undefined> {
    const [athlete] = await db.select().from(athletes).where(eq(athletes.id, id));
    return athlete;
  }
  
  async getAthleteBySession(sessionId: string): Promise<Athlete | undefined> {
    const [athlete] = await db.select().from(athletes).where(eq(athletes.sessionId, sessionId));
    return athlete;
  }
  
  async storeAthleteProfile(athlete: InsertAthlete): Promise<Athlete> {
    const [newAthlete] = await db.insert(athletes).values(athlete).returning();
    return newAthlete;
  }
  
  async getAllAthletes(): Promise<Athlete[]> {
    return await db.select().from(athletes);
  }
  
  // Business operations
  async getBusiness(id: number): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }
  
  async getBusinessBySession(sessionId: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.sessionId, sessionId));
    return business;
  }
  
  async storeBusinessProfile(business: InsertBusiness): Promise<Business> {
    const [newBusiness] = await db.insert(businesses).values(business).returning();
    return newBusiness;
  }
  
  async getAllBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses);
  }
  
  // Campaign operations
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }
  
  async getCampaignsByBusiness(businessId: number): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.businessId, businessId));
  }
  
  async storeCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db.insert(campaigns).values(campaign).returning();
    return newCampaign;
  }
  
  // Match operations
  async getMatch(id: number): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }
  
  async getMatchesForAthlete(athleteId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.athleteId, athleteId));
  }
  
  async getMatchesForBusiness(businessId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.businessId, businessId));
  }
  
  async storeMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db.insert(matches).values(match).returning();
    return newMatch;
  }
  
  async getAllMatches(): Promise<Match[]> {
    return await db.select().from(matches);
  }
  
  // Message operations
  async getMessages(sessionId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.createdAt);
  }
  
  async storeMessage(sessionId: string, role: string, content: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        sessionId,
        role,
        content
      })
      .returning();
    
    return message;
  }
  
  // Auth operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [updatedUser] = await db
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
    const [updatedUser] = await db
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
}

// For backwards compatibility and fallback
export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private athletes: Map<number, Athlete>;
  private businesses: Map<number, Business>;
  private campaigns: Map<number, Campaign>;
  private matches: Map<number, Match>;
  private messages: Map<string, Message[]>;
  private users: Map<number, User>;
  private currentSessionId: number;
  private currentAthleteId: number;
  private currentBusinessId: number;
  private currentCampaignId: number;
  private currentMatchId: number;
  private currentMessageId: number;
  private currentUserId: number;
  sessionStore: session.Store;
  
  constructor() {
    this.sessions = new Map();
    this.athletes = new Map();
    this.businesses = new Map();
    this.campaigns = new Map();
    this.matches = new Map();
    this.messages = new Map();
    this.users = new Map();
    this.currentSessionId = 1;
    this.currentAthleteId = 1;
    this.currentBusinessId = 1;
    this.currentCampaignId = 1;
    this.currentMatchId = 1;
    this.currentMessageId = 1;
    this.currentUserId = 1;
    
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
  
  async storeMessage(sessionId: string, role: string, content: string): Promise<Message> {
    const id = this.currentMessageId++;
    
    const message: Message = {
      id,
      sessionId,
      role,
      content,
      createdAt: new Date(),
    };
    
    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(sessionId, sessionMessages);
    
    return message;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
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
}

// Create and export storage instance
// Temporarily using MemStorage until database connection issue is fixed
export const storage = new MemStorage();