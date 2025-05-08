/** 050825 1506CST
 * Database Interface
 * 
 * Provides a unified interface for database operations.
 * Abstracts Supabase-specific implementation details.
 */

import { supabase, supabaseAdmin } from './lib/supabase';

interface SessionRecord {
  id?: number;
  session_id: string;
  user_type?: string;
  data: string | object;
  profile_completed?: boolean;
  athlete_id?: number;
  business_id?: number;
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface MessageRecord {
  id?: number;
  session_id: string;
  role: string;
  content: string;
  created_at?: Date;
}

/**
 * Database operations for the application
 */
class DB {
  /**
   * Create a new session record
   */
  async createSession(session: SessionRecord): Promise<any> {
    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get a session by its ID
   */
  async getSession(sessionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Error getting session:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update an existing session
   */
  async updateSession(sessionId: string, updates: Partial<SessionRecord>): Promise<any> {
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Add a message to the conversation history
   */
  async createMessage(message: MessageRecord): Promise<any> {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get messages for a specific session
   */
  async getMessages(sessionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting messages:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Execute raw SQL query (admin only)
   */
  async query(sql: string, params?: any[]): Promise<any> {
    if (!supabaseAdmin) {
      throw new Error('Admin access required for raw SQL queries');
    }

    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql,
      params
    });

    if (error) {
      console.error('Error executing SQL query:', error);
      throw error;
    }

    return data;
  }
}

// Export singleton instance
export const db = new DB();
export default db;