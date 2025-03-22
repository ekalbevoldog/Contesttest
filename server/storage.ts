import { 
  InsertSession, InsertAthlete, InsertBusiness, 
  InsertCampaign, InsertMatch, InsertMessage,
  Session, Athlete, Business, Campaign, Match, Message
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private athletes: Map<number, Athlete>;
  private businesses: Map<number, Business>;
  private campaigns: Map<number, Campaign>;
  private matches: Map<number, Match>;
  private messages: Map<string, Message[]>;
  private currentSessionId: number;
  private currentAthleteId: number;
  private currentBusinessId: number;
  private currentCampaignId: number;
  private currentMatchId: number;
  private currentMessageId: number;
  
  constructor() {
    this.sessions = new Map();
    this.athletes = new Map();
    this.businesses = new Map();
    this.campaigns = new Map();
    this.matches = new Map();
    this.messages = new Map();
    this.currentSessionId = 1;
    this.currentAthleteId = 1;
    this.currentBusinessId = 1;
    this.currentCampaignId = 1;
    this.currentMatchId = 1;
    this.currentMessageId = 1;
  }
  
  // Session operations
  async getSession(sessionId: string): Promise<Session | undefined> {
    return this.sessions.get(sessionId);
  }
  
  async createSession(session: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const newSession: Session = {
      ...session,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
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
      updatedAt: new Date()
    };
    
    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }
  
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
  
  // Athlete operations
  async getAthlete(id: number): Promise<Athlete | undefined> {
    return this.athletes.get(id);
  }
  
  async getAthleteBySession(sessionId: string): Promise<Athlete | undefined> {
    return Array.from(this.athletes.values()).find(
      (athlete) => athlete.sessionId === sessionId
    );
  }
  
  async storeAthleteProfile(athlete: InsertAthlete): Promise<Athlete> {
    const id = this.currentAthleteId++;
    const newAthlete: Athlete = {
      ...athlete,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.athletes.set(id, newAthlete);
    return newAthlete;
  }
  
  async getAllAthletes(): Promise<Athlete[]> {
    return Array.from(this.athletes.values());
  }
  
  // Business operations
  async getBusiness(id: number): Promise<Business | undefined> {
    return this.businesses.get(id);
  }
  
  async getBusinessBySession(sessionId: string): Promise<Business | undefined> {
    return Array.from(this.businesses.values()).find(
      (business) => business.sessionId === sessionId
    );
  }
  
  async storeBusinessProfile(business: InsertBusiness): Promise<Business> {
    const id = this.currentBusinessId++;
    const newBusiness: Business = {
      ...business,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.businesses.set(id, newBusiness);
    return newBusiness;
  }
  
  async getAllBusinesses(): Promise<Business[]> {
    return Array.from(this.businesses.values());
  }
  
  // Campaign operations
  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }
  
  async getCampaignsByBusiness(businessId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.businessId === businessId
    );
  }
  
  async storeCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentCampaignId++;
    const newCampaign: Campaign = {
      ...campaign,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.campaigns.set(id, newCampaign);
    return newCampaign;
  }
  
  // Match operations
  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }
  
  async getMatchesForAthlete(athleteId: number): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      (match) => match.athleteId === athleteId
    );
  }
  
  async getMatchesForBusiness(businessId: number): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      (match) => match.businessId === businessId
    );
  }
  
  async storeMatch(match: InsertMatch): Promise<Match> {
    const id = this.currentMatchId++;
    const newMatch: Match = {
      ...match,
      id,
      createdAt: new Date()
    };
    this.matches.set(id, newMatch);
    return newMatch;
  }
  
  async getAllMatches(): Promise<Match[]> {
    return Array.from(this.matches.values());
  }
  
  // Message operations
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
      createdAt: new Date()
    };
    
    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(message);
    this.messages.set(sessionId, sessionMessages);
    
    return message;
  }
}

// Create and export storage instance
export const storage = new MemStorage();
