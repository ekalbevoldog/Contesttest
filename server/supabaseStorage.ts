import { IStorage } from './storage';
import supabase from './supabaseClient';
import { eq, and, not, isNull, like, desc, asc } from 'drizzle-orm';
import { 
  User, InsertUser,
  Athlete, InsertAthlete,
  Business, InsertBusiness,
  Campaign, InsertCampaign,
  Match, InsertMatch,
  Message, InsertMessage, MessageMetadata,
  ComplianceOfficer, InsertComplianceOfficer,
  PartnershipOffer, InsertPartnershipOffer,
  Feedback, InsertFeedback
} from './schema';

export class SupabaseStorage implements IStorage {
  // Tracks if Supabase client is initialized and working
  private initialized = false;

  constructor() {
    // Check if supabase client is available
    if (!supabase) {
      console.error('❌ Supabase client is not initialized - SupabaseStorage will not work');
      return;
    }

    // Verify connection on instantiation
    this.testConnection().then(connected => {
      this.initialized = connected;
      if (connected) {
        console.log('✅ SupabaseStorage initialized successfully');
      } else {
        console.error('❌ SupabaseStorage failed to connect to Supabase');
      }
    });
  }

  /**
   * Test the Supabase connection
   */
  private async testConnection(): Promise<boolean> {
    try {
      if (!supabase) return false;
      
      // Simple test query
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Supabase connection test failed with exception:', error);
      return false;
    }
  }

  // User methods
  async getUserById(id: number): Promise<User | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error || !data) return null;
    return data as User;
  }

  async storeUser(user: InsertUser): Promise<User | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to store user:', error);
      return null;
    }
    
    return data as User;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to update user:', error);
      return null;
    }
    
    return data as User;
  }

  async getAllUsers(): Promise<User[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error || !data) return [];
    return data as User[];
  }

  // Athlete methods
  async getAthleteById(id: number): Promise<Athlete | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as Athlete;
  }

  async getAthleteByUserId(userId: number): Promise<Athlete | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return null;
    return data as Athlete;
  }

  async storeAthlete(athlete: InsertAthlete): Promise<Athlete | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('athlete_profiles')
      .insert([athlete])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to store athlete:', error);
      return null;
    }
    
    return data as Athlete;
  }

  async updateAthlete(id: number, updates: Partial<Athlete>): Promise<Athlete | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('athlete_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to update athlete:', error);
      return null;
    }
    
    return data as Athlete;
  }

  async getAllAthletes(): Promise<Athlete[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('athlete_profiles')
      .select('*');
    
    if (error || !data) return [];
    return data as Athlete[];
  }

  // Business methods
  async getBusinessById(id: number): Promise<Business | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as Business;
  }

  async getBusinessByUserId(userId: number): Promise<Business | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return null;
    return data as Business;
  }

  async storeBusiness(business: InsertBusiness): Promise<Business | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('business_profiles')
      .insert([business])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to store business:', error);
      return null;
    }
    
    return data as Business;
  }

  async updateBusiness(id: number, updates: Partial<Business>): Promise<Business | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('business_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to update business:', error);
      return null;
    }
    
    return data as Business;
  }

  async getAllBusinesses(): Promise<Business[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*');
    
    if (error || !data) return [];
    return data as Business[];
  }

  // Campaign methods
  async getCampaignById(id: number): Promise<Campaign | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as Campaign;
  }

  async getCampaignsByBusinessId(businessId: number): Promise<Campaign[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('business_id', businessId);
    
    if (error || !data) return [];
    return data as Campaign[];
  }

  async storeCampaign(campaign: InsertCampaign): Promise<Campaign | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('campaigns')
      .insert([campaign])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to store campaign:', error);
      return null;
    }
    
    return data as Campaign;
  }

  async updateCampaign(id: number, updates: Partial<Campaign>): Promise<Campaign | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to update campaign:', error);
      return null;
    }
    
    return data as Campaign;
  }

  // Match methods
  async getMatchById(id: number): Promise<Match | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('match_scores')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as Match;
  }

  async getMatchesByAthleteId(athleteId: number): Promise<Match[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('match_scores')
      .select('*')
      .eq('athlete_id', athleteId);
    
    if (error || !data) return [];
    return data as Match[];
  }

  async getMatchesByCampaignId(campaignId: number): Promise<Match[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('match_scores')
      .select('*')
      .eq('campaign_id', campaignId);
    
    if (error || !data) return [];
    return data as Match[];
  }

  async storeMatch(match: InsertMatch): Promise<Match | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('match_scores')
      .insert([match])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to store match:', error);
      return null;
    }
    
    return data as Match;
  }

  async updateMatch(id: number, updates: Partial<Match>): Promise<Match | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('match_scores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to update match:', error);
      return null;
    }
    
    return data as Match;
  }

  // Message methods
  async getMessageById(id: number): Promise<Message | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as Message;
  }

  async getMessagesBySessionId(sessionId: string): Promise<Message[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error || !data) return [];
    return data as Message[];
  }

  async storeMessage(message: InsertMessage): Promise<Message | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to store message:', error);
      return null;
    }
    
    return data as Message;
  }

  // Compliance Officer methods
  async getComplianceOfficerById(id: number): Promise<ComplianceOfficer | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('compliance_officers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as ComplianceOfficer;
  }

  async getComplianceOfficerByUserId(userId: number): Promise<ComplianceOfficer | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('compliance_officers')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return null;
    return data as ComplianceOfficer;
  }

  async storeComplianceOfficer(officer: InsertComplianceOfficer): Promise<ComplianceOfficer | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('compliance_officers')
      .insert([officer])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to store compliance officer:', error);
      return null;
    }
    
    return data as ComplianceOfficer;
  }

  // Partnership Offer methods
  async getPartnershipOfferById(id: number): Promise<PartnershipOffer | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('partnership_offers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as PartnershipOffer;
  }

  async getPartnershipOffersByAthleteId(athleteId: number): Promise<PartnershipOffer[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('partnership_offers')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data as PartnershipOffer[];
  }

  async getPartnershipOffersByBusinessId(businessId: number): Promise<PartnershipOffer[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('partnership_offers')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data as PartnershipOffer[];
  }

  async storePartnershipOffer(offer: InsertPartnershipOffer): Promise<PartnershipOffer | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('partnership_offers')
      .insert([offer])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to store partnership offer:', error);
      return null;
    }
    
    return data as PartnershipOffer;
  }

  async updatePartnershipOffer(id: number, updates: Partial<PartnershipOffer>): Promise<PartnershipOffer | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('partnership_offers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to update partnership offer:', error);
      return null;
    }
    
    return data as PartnershipOffer;
  }

  // Feedback methods
  async getFeedbackById(id: number): Promise<Feedback | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as Feedback;
  }

  async getFeedbackByUserId(userId: number): Promise<Feedback[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data as Feedback[];
  }

  async getFeedbackByMatchId(matchId: number): Promise<Feedback[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data as Feedback[];
  }

  async getFeedbackByType(feedbackType: string): Promise<Feedback[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('feedback_type', feedbackType)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data as Feedback[];
  }

  async getPublicFeedback(): Promise<Feedback[]> {
    if (!supabase || !this.initialized) return [];
    
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data as Feedback[];
  }

  async storeFeedback(feedback: InsertFeedback): Promise<Feedback | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('feedbacks')
      .insert([feedback])
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to store feedback:', error);
      return null;
    }
    
    return data as Feedback;
  }

  async updateFeedback(id: number, updates: Partial<Feedback>): Promise<Feedback | null> {
    if (!supabase || !this.initialized) return null;
    
    const { data, error } = await supabase
      .from('feedbacks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Failed to update feedback:', error);
      return null;
    }
    
    return data as Feedback;
  }
}

// Export a function to get a Supabase storage instance
export function getSupabaseStorage(): SupabaseStorage {
  return new SupabaseStorage();
}