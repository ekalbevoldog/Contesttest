import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function checkTables() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Try to query each potential table name
    const tables = ['businesses', 'business_profiles', 'users', 'athletes', 'athlete_profiles'];
    
    for (const table of tables) {
      try {
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (countError) {
          console.log(`Table '${table}' error:`, countError.message);
        } else {
          console.log(`Table '${table}' exists with approximately ${count} records`);
          
          // Get schema info by trying to insert with minimal fields
          const testData = { test_column: 'test_value' };
          const { error: insertError } = await supabase
            .from(table)
            .insert(testData);
            
          if (insertError) {
            console.log(`Schema info for '${table}' from error:`, insertError.message);
          }
        }
      } catch (tableErr) {
        console.log(`Error checking table '${table}':`, tableErr.message);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkTables();
