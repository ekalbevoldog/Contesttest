import { 
  InsertSession, InsertAthlete, InsertBusiness, 
  InsertCampaign, InsertMatch, InsertMessage, InsertUser, InsertFeedback, InsertPartnershipOffer,
  Session, Athlete, Business, Campaign, Match, Message, User, Feedback, PartnershipOffer, 
  users, sessions, athletes, businesses, campaigns, matches, messages, feedbacks, partnershipOffers
} from "@shared/schema";
import session from "express-session";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { IStorage } from "./storage";
import MemoryStore from "memorystore";
import { db } from "./db-drizzle";
import { eq, and } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

// Drizzle implementation of IStorage
export class DrizzleStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize with MemoryStore for Express sessions
    const MemStore = MemoryStore(session);
    this.sessionStore = new MemStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
  }

  // Session operations
  async getSession(sessionId: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId));
    return result[0];
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [result] = await db.insert(sessions).values(session).returning();
    return result;
  }

  async updateSession(sessionId: string, data: Partial<Session>): Promise<Session> {
    const [result] = await db.update(sessions)
      .set({...data, updatedAt: new Date()})
      .where(eq(sessions.sessionId, sessionId))
      .returning();
    return result;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
  }

  // Athlete operations
  async getAthlete(id: number): Promise<Athlete | undefined> {
    const result = await db.select().from(athletes).where(eq(athletes.id, id));
    return result[0];
  }

  async getAthleteBySession(sessionId: string): Promise<Athlete | undefined> {
    const result = await db.select().from(athletes).where(eq(athletes.sessionId, sessionId));
    return result[0];
  }

  async storeAthleteProfile(athlete: InsertAthlete): Promise<Athlete> {
    const [result] = await db.insert(athletes).values(athlete).returning();
    return result;
  }

  async getAllAthletes(): Promise<Athlete[]> {
    return await db.select().from(athletes);
  }

  // Business operations
  async getBusiness(id: number): Promise<Business | undefined> {
    const result = await db.select().from(businesses).where(eq(businesses.id, id));
    return result[0];
  }

  async getBusinessBySession(sessionId: string): Promise<Business | undefined> {
    const result = await db.select().from(businesses).where(eq(businesses.sessionId, sessionId));
    return result[0];
  }

  async storeBusinessProfile(business: InsertBusiness): Promise<Business> {
    const [result] = await db.insert(businesses).values(business).returning();
    return result;
  }

  async getAllBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses);
  }

  // Campaign operations
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return result[0];
  }

  async getCampaignsByBusiness(businessId: number): Promise<Campaign[]> {
    return await db.select().from(campaigns).where(eq(campaigns.businessId, businessId));
  }

  async storeCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [result] = await db.insert(campaigns).values(campaign).returning();
    return result;
  }

  // Match operations
  async getMatch(id: number): Promise<Match | undefined> {
    const result = await db.select().from(matches).where(eq(matches.id, id));
    return result[0];
  }

  async getMatchesForAthlete(athleteId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.athleteId, athleteId));
  }

  async getMatchesForBusiness(businessId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.businessId, businessId));
  }

  async storeMatch(match: InsertMatch): Promise<Match> {
    const [result] = await db.insert(matches).values(match).returning();
    return result;
  }

  async getAllMatches(): Promise<Match[]> {
    return await db.select().from(matches);
  }

  // Partnership operations
  async getPartnershipOffer(id: number): Promise<PartnershipOffer | undefined> {
    const result = await db.select().from(partnershipOffers).where(eq(partnershipOffers.id, id));
    return result[0];
  }

  async getPartnershipOffersForAthlete(athleteId: number): Promise<PartnershipOffer[]> {
    return await db.select().from(partnershipOffers).where(eq(partnershipOffers.athleteId, athleteId));
  }

  async getPartnershipOffersForBusiness(businessId: number): Promise<PartnershipOffer[]> {
    return await db.select().from(partnershipOffers).where(eq(partnershipOffers.businessId, businessId));
  }

  async updatePartnershipOfferStatus(id: number, status: string): Promise<PartnershipOffer> {
    const [result] = await db.update(partnershipOffers)
      .set({ status, updatedAt: new Date() })
      .where(eq(partnershipOffers.id, id))
      .returning();
    return result;
  }

  async storePartnershipOffer(offer: InsertPartnershipOffer): Promise<PartnershipOffer> {
    const [result] = await db.insert(partnershipOffers).values(offer).returning();
    return result;
  }

  // Message operations
  async getMessages(sessionId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.sessionId, sessionId));
  }

  async storeMessage(sessionId: string, role: string, content: string): Promise<Message> {
    const [result] = await db.insert(messages).values({
      sessionId,
      role,
      content
    }).returning();
    return result;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(insertUser).returning();
    return result;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User | undefined> {
    const [result] = await db.update(users)
      .set({...userData, updatedAt: new Date()})
      .where(eq(users.id, userId))
      .returning();
    return result;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [result] = await db.update(users)
      .set({
        stripeCustomerId: customerId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result;
  }

  async updateUserStripeInfo(userId: number, data: { customerId: string, subscriptionId: string }): Promise<User> {
    const [result] = await db.update(users)
      .set({
        stripeCustomerId: data.customerId,
        stripeSubscriptionId: data.subscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result;
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    const result = await db.select().from(feedbacks).where(eq(feedbacks.id, id));
    return result[0];
  }

  async getFeedbackByUser(userId: number): Promise<Feedback[]> {
    return await db.select().from(feedbacks).where(eq(feedbacks.userId, userId));
  }

  async getFeedbackByMatch(matchId: number): Promise<Feedback[]> {
    return await db.select().from(feedbacks).where(eq(feedbacks.matchId, matchId));
  }
  
  async getFeedbackByType(feedbackType: string): Promise<Feedback[]> {
    return await db.select().from(feedbacks).where(eq(feedbacks.feedbackType, feedbackType));
  }

  async getPublicFeedback(): Promise<Feedback[]> {
    return await db.select().from(feedbacks).where(eq(feedbacks.isPublic, true));
  }

  async storeFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const [result] = await db.insert(feedbacks).values(feedback).returning();
    return result;
  }

  async updateFeedbackStatus(feedbackId: number, status: string): Promise<Feedback> {
    const [result] = await db.update(feedbacks)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(feedbacks.id, feedbackId))
      .returning();
    return result;
  }

  async addAdminResponse(feedbackId: number, response: string): Promise<Feedback> {
    const [result] = await db.update(feedbacks)
      .set({
        adminResponse: response,
        updatedAt: new Date()
      })
      .where(eq(feedbacks.id, feedbackId))
      .returning();
    return result;
  }
}