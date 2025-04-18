import * as schema from "../shared/schema";
import { supabase } from "./supabase";

console.log("Using Supabase for storage and authentication");

// Simplified database interface using Supabase
export const db = {
  async query(table: string, query: string, params: any[] = []) {
    try {
      const { data, error } = await supabase.rpc(query, params);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Supabase query error (${table}):`, error);
      throw error;
    }
  },
  
  async getSession(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // Not found error
        console.error("Error getting session:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  },
  
  async createSession(data: any) {
    try {
      const { data: newSession, error } = await supabase
        .from('sessions')
        .insert(data)
        .select()
        .single();
        
      if (error) {
        console.error("Error creating session:", error);
        return null;
      }
      
      return newSession;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  },
  
  async updateSession(sessionId: string, data: any) {
    try {
      const { data: updated, error } = await supabase
        .from('sessions')
        .update(data)
        .eq('session_id', sessionId)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating session:", error);
        return null;
      }
      
      return updated;
    } catch (error) {
      console.error("Error updating session:", error);
      return null;
    }
  },
  
  async getTableData(table: string, column: string, value: any) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(column, value);
        
      if (error) {
        console.error(`Error getting ${table} data:`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error(`Error getting ${table} data:`, error);
      return null;
    }
  },
  
  async insertTableData(table: string, data: any) {
    try {
      const { data: inserted, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();
        
      if (error) {
        console.error(`Error inserting ${table} data:`, error);
        return null;
      }
      
      return inserted;
    } catch (error) {
      console.error(`Error inserting ${table} data:`, error);
      return null;
    }
  }
};

// Export a function to check the database connection
export async function testConnection() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('sessions').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // Not found error
      console.error("Supabase connection error:", error.message);
      return false;
    }
    
    console.log("Successfully connected to Supabase");
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}