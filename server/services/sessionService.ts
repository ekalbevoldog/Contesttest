import { db } from "../db.js";

export interface SessionData {
  id: number;
  sessionId: string;
  userType: string | null;
  data: any;
  profileCompleted: boolean;
  athleteId: number | null;
  businessId: number | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SessionService {
  /** Helper: map a raw DB record to our DTO */
  private map(record: any): SessionData {
    return {
      id: record.id,
      sessionId: record.session_id,
      userType: record.user_type,
      data:
        record.data == null
          ? {}
          : typeof record.data === "string"
          ? JSON.parse(record.data)
          : record.data,
      profileCompleted: Boolean(record.profile_completed),
      athleteId: record.athlete_id,
      businessId: record.business_id,
      lastLogin: record.last_login,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  /** Create a fresh session in the DB */
  async createSession(sessionId: string): Promise<SessionData> {
    const now = new Date();
    const record = await db.createSession({
      session_id: sessionId,
      data: JSON.stringify({}),
      profile_completed: false,
      last_login: now,
      created_at: now,
      updated_at: now,
    });
    return this.map(record);
  }

  /** Retrieve an existing session by its session_id */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const record = await db.getSession(sessionId);
    return record ? this.map(record) : null;
  }

  /** Merge in new fields and persist them */
  async updateSession(
    sessionId: string,
    updates: Partial<Omit<SessionData, "id" | "sessionId" | "createdAt">> & {
      data?: any;
    }
  ): Promise<SessionData> {
    // Fetch current, or throw if not found
    const existing = await this.getSession(sessionId);
    if (!existing) {
      throw new Error(`Session "${sessionId}" not found`);
    }

    // Merge JSON payloads
    const mergedData = {
      ...existing.data,
      ...(updates.data || {}),
    };

    const payload: any = {
      data: mergedData,
      updated_at: new Date(),
    };
    if (updates.userType !== undefined) payload.user_type = updates.userType;
    if (updates.profileCompleted !== undefined)
      payload.profile_completed = updates.profileCompleted;
    if (updates.athleteId !== undefined) payload.athlete_id = updates.athleteId;
    if (updates.businessId !== undefined)
      payload.business_id = updates.businessId;
    if (updates.lastLogin !== undefined) payload.last_login = updates.lastLogin;

    const record = await db.updateSession(sessionId, payload);
    return this.map(record);
  }

  /** Delete then re-create to reset */
  async resetSession(sessionId: string): Promise<SessionData> {
    try {
      await db.deleteSession(sessionId);
    } catch {
      // ignore if it didn’t exist
    }
    return this.createSession(sessionId);
  }

  /** Pull full message history */
  async getConversationHistory(
    sessionId: string
  ): Promise<{ id: number; sessionId: string; role: string; content: string; createdAt: Date }[]> {
    // Use the postgres client to execute the query instead of directly calling query on the SupabaseClient
    const { data: result, error } = await db
      .from('messages')
      .select('id, session_id, role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
    
    // Supabase query result is already an array, no need to access .rows
    return (result || []).map((row: any) => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    }));
  }
}

export const sessionService = new SessionService();
