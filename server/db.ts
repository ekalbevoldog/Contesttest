import { supabase, supabaseAdmin } from './supabase.js';

// We avoid using Neon database completely as required

// Verify Supabase environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error("Supabase environment variables are not set");
  if (process.env.NODE_ENV === 'production') {
    throw new Error("Supabase configuration must be set");
  }
}

// Create a proxy object that mimics the Pool interface but uses Supabase
export const pool = {
  query: async (text: string, params: any[] = []) => {
    console.log('Running SQL query via Supabase:', text.substring(0, 50) + '...');
    
    try {
      // IMPORTANT: Parameter should be 'sql' not 'sql_statement'
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
        sql: text 
      });
      
      if (error) throw error;
      
      return {
        rows: data || [],
        rowCount: data ? data.length : 0
      };
    } catch (error: any) {
      console.error('Error executing SQL via database client:', error.message);
      throw error;
    }
  }
};

// Export Supabase clients directly for proper usage
export const db = supabase;
export const adminDb = supabaseAdmin;

// Export a function to check the database connection
export async function testConnection() {
  try {
    console.log("Testing database connection...");
    
    // Simple query to test connection using Supabase
    const { data, error } = await supabase.from('sessions').select('*').limit(1);
    
    if (error) {
      console.error("Database connection error:", error);
      return false;
    }
    
    console.log("Successfully connected to Supabase database");
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

/**
 * This function ensures essential database tables exist via Supabase
 */
export async function createEssentialTables() {
  try {
    // Check if tables exist first
    let existingTables = {
      sessions: false,
      users: false,
      athleteProfiles: false,
      businessProfiles: false
    };
    
    // Check sessions table
    console.log("Checking if table sessions exists...");
    const sessionsResult = await supabase.from('sessions').select('count');
    existingTables.sessions = !sessionsResult.error;
    
    if (existingTables.sessions) {
      console.log("Table sessions exists (verified by selecting data)");
    } else {
      console.log("Table sessions does not exist or is not accessible");
    }
    
    // Check users table
    console.log("Checking if table users exists...");
    const usersResult = await supabase.from('users').select('count');
    existingTables.users = !usersResult.error;
    
    if (existingTables.users) {
      console.log("Table users exists (verified by selecting data)");
    } else {
      console.log("Table users does not exist or is not accessible");
    }
    
    // Check athlete_profiles table
    console.log("Checking if table athlete_profiles exists...");
    const athleteResult = await supabase.from('athlete_profiles').select('count');
    existingTables.athleteProfiles = !athleteResult.error;
    
    if (existingTables.athleteProfiles) {
      console.log("Table athlete_profiles exists (verified by selecting data)");
    } else {
      console.log("Table athlete_profiles does not exist or is not accessible");
    }
    
    // Check business_profiles table
    console.log("Checking if table business_profiles exists...");
    const businessResult = await supabase.from('business_profiles').select('count');
    existingTables.businessProfiles = !businessResult.error;
    
    if (existingTables.businessProfiles) {
      console.log("Table business_profiles exists (verified by selecting data)");
    } else {
      console.log("Table business_profiles does not exist or is not accessible");
    }
    
    console.log("Tables after migration:", existingTables);
    
    // If all tables exist, skip creation
    if (existingTables.sessions && existingTables.users && existingTables.athleteProfiles && existingTables.businessProfiles) {
      console.log("Core tables already exist, skipping table creation...");
      return true;
    }
    
    console.log("Some tables not created, running complete schema migration...");
    
    // Import the comprehensive migration dynamically to avoid circular dependencies
    const { runCompleteMigration } = await import('./runCompleteMigration.js');
    await runCompleteMigration();
    
    console.log("Table initialization complete");
    return true;
  } catch (error) {
    console.error("Error creating database tables:", error);
    return false;
  }
}

// Initialize the database and create essential tables when this module is imported
(async function() {
  try {
    if (await testConnection()) {
      console.log("Creating essential database tables...");
      await createEssentialTables();
    }
  } catch (error) {
    console.error("Error during database initialization:", error);
  }
})();