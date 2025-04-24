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
        throw new Error(`Session with ID ${sessionId} not found`);
      }
      
      // Merge new data with existing data
      const updatedData = {
        ...currentSession.data,
        ...data.data
      };
      
      // Convert camelCase to snake_case for database
      const dbData: any = {};
      if (data.userType) dbData.user_type = data.userType;
      if (data.profileCompleted !== undefined) dbData.profile_completed = data.profileCompleted;
      if (data.athleteId) dbData.athlete_id = data.athleteId;
      if (data.businessId) dbData.business_id = data.businessId;
      if (updatedData) dbData.data = JSON.stringify(updatedData);
      
      dbData.updated_at = new Date();
      
      const result = await db.query(
        `UPDATE sessions SET ${Object.keys(dbData).map((k, i) => `${k} = $${i+2}`).join(', ')} 
         WHERE session_id = $1 RETURNING *`,
        [sessionId, ...Object.values(dbData)]
      );
      
      const updatedSession = result.rows[0];
      if (!updatedSession) {
        throw new Error(`Failed to update session ${sessionId}`);
      }
      
      // Convert back to camelCase for API consistency
      return {
        id: updatedSession.id,
        sessionId: updatedSession.session_id,
        userType: updatedSession.user_type,
        data: updatedSession.data ? JSON.parse(updatedSession.data) : {},
        profileCompleted: updatedSession.profile_completed,
        athleteId: updatedSession.athlete_id,
        businessId: updatedSession.business_id,
        lastLogin: updatedSession.last_login,
        createdAt: updatedSession.created_at,
        updatedAt: updatedSession.updated_at
      };
    } catch (error) {
      console.error('Error updating session:', error);
      // Return original session with updated values
      return { 
        ...await this.getSession(sessionId),
        ...data
      };
    }
  }
  
  // Reset session
  async resetSession(sessionId: string) {
    try {
      // Delete existing session
      await db.query('DELETE FROM sessions WHERE session_id = $1', [sessionId]);
      
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
