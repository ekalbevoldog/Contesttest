import { db } from "../db.js";

class SessionService {
  // Create a new session
  async createSession(sessionId: string) {
    try {
      return await db.createSession({
        session_id: sessionId,
        data: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date(),
        last_login: new Date()
      });
    } catch (error) {
      console.error('Error creating session:', error);
      // Fallback in-memory session
      const fallbackSession = {
        id: Math.floor(Math.random() * 10000),
        sessionId,
        userType: null,
        data: {},
        profileCompleted: false,
        athleteId: null,
        businessId: null,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('Using fallback in-memory session:', fallbackSession);
      return fallbackSession;
    }
  }
  
  // Get session data
  async getSession(sessionId: string) {
    try {
      const session = await db.getSession(sessionId);
      if (!session) return null;
      
      // Convert database names to camelCase for consistency
      return {
        id: session.id,
        sessionId: session.session_id,
        userType: session.user_type,
        data: session.data ? JSON.parse(session.data) : {},
        profileCompleted: session.profile_completed,
        athleteId: session.athlete_id,
        businessId: session.business_id,
        lastLogin: session.last_login,
        createdAt: session.created_at,
        updatedAt: session.updated_at
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }
  
  // Update session data
  async updateSession(sessionId: string, data: any) {
    try {
      const currentSession = await this.getSession(sessionId);
      
      if (!currentSession) {
        console.warn(`Session with ID ${sessionId} not found, creating a new one`);
        // Create a new session if it doesn't exist
        return this.createSession(sessionId);
      }
      
      try {
        // Try to update via API first
        // Merge new data with existing data
        const updatedData = {
          ...currentSession.data,
          ...data.data
        };
        
        // Prepare update payload
        const updatePayload: any = {
          data: updatedData
        };
        
        // Add other fields if provided
        if (data.userType) updatePayload.user_type = data.userType;
        if (data.profileCompleted !== undefined) updatePayload.profile_completed = data.profileCompleted;
        if (data.athleteId) updatePayload.athlete_id = data.athleteId;
        if (data.businessId) updatePayload.business_id = data.businessId;
        
        // Try to use the API method if available
        const updated = await db.updateSession(sessionId, updatePayload);
        if (updated) {
          return {
            id: updated.id,
            sessionId: updated.session_id,
            userType: updated.user_type,
            data: updated.data ? (typeof updated.data === 'string' ? JSON.parse(updated.data) : updated.data) : {},
            profileCompleted: updated.profile_completed,
            athleteId: updated.athlete_id,
            businessId: updated.business_id,
            lastLogin: updated.last_login,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at
          };
        }
      } catch (apiError) {
        console.warn('Failed to update session via API, falling back to memory update:', apiError);
      }
      
      // If API update fails, return in-memory updated session
      console.log('Using in-memory session update fallback');
      return { 
        ...currentSession,
        ...data,
        data: {
          ...currentSession.data,
          ...(data.data || {})
        }
      };
    } catch (error) {
      console.error('Error updating session:', error);
      // Return data as a new session-like object
      return { 
        id: Math.floor(Math.random() * 10000),
        sessionId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }
  
  // Reset session
  async resetSession(sessionId: string) {
    try {
      // Try to delete existing session using safer API first
      try {
        await db.deleteSession(sessionId);
      } catch (deleteError) {
        console.warn('Could not delete session via API, session may not exist:', deleteError);
        // Continue with session creation regardless
      }
      
      // Create a new session with the same ID
      return this.createSession(sessionId);
    } catch (error) {
      console.error('Error resetting session:', error);
      return this.createSession(sessionId);
    }
  }
  
  // Get conversation history
  async getConversationHistory(sessionId: string) {
    try {
      const result = await db.query(
        'SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at DESC',
        [sessionId]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        sessionId: row.session_id,
        role: row.role,
        content: row.content,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }
}

export const sessionService = new SessionService();
