import { storage } from "../storage";

class SessionService {
  // Create a new session
  async createSession(sessionId: string) {
    return storage.createSession({
      sessionId,
      data: {},
    });
  }
  
  // Get session data
  async getSession(sessionId: string) {
    return storage.getSession(sessionId);
  }
  
  // Update session data
  async updateSession(sessionId: string, data: any) {
    const currentSession = await storage.getSession(sessionId);
    
    if (!currentSession) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }
    
    // Merge new data with existing data
    const updatedData = {
      ...currentSession.data,
      ...data
    };
    
    return storage.updateSession(sessionId, {
      ...data,
      data: updatedData
    });
  }
  
  // Reset session
  async resetSession(sessionId: string) {
    // Delete existing session
    await storage.deleteSession(sessionId);
    
    // Create a new session with the same ID
    return storage.createSession({
      sessionId,
      data: {},
    });
  }
  
  // Get conversation history
  async getConversationHistory(sessionId: string) {
    return storage.getMessages(sessionId);
  }
}

export const sessionService = new SessionService();
