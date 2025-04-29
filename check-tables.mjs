import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function checkTables() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Use Raw SQL to list all tables
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    }).catch(err => {
      // If rpc doesn't exist, try a different approach
      console.log('RPC method not available, trying a different approach');
      return { data: null, error: err };
    });
    
    if (error || !data) {
      console.log('Error or no data using RPC, trying direct query...');
      
      // Try to query each potential table name
      const tables = ['businesses', 'business_profiles', 'users', 'athletes', 'athlete_profiles'];
      
      for (const table of tables) {
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.log(`Table '${table}' error:`, countError.message);
        } else {
          console.log(`Table '${table}' exists with approximately ${count} records`);
          
          // Get first row to see structure
          const { data: sampleRow, error: sampleError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
            
          if (!sampleError && sampleRow?.length) {
            console.log(`Sample columns for '${table}':`, Object.keys(sampleRow[0]));
          }
        }
      }
    } else {
      console.log('Database tables:', data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkTables();
