import { supabase } from "./supabase";

// Simple script to check the actual structure of critical tables
async function checkTables() {
  try {
    console.log("Checking businesses table...");
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);
      
    if (businessError) {
      console.error("Error querying businesses table:", businessError.message);
    } else {
      if (businesses && businesses.length > 0) {
        console.log("Businesses table structure:", Object.keys(businesses[0]));
      } else {
        console.log("No data in businesses table");
      }
    }
    
    console.log("\nChecking business_profiles table...");
    const { data: profiles, error: profileError } = await supabase
      .from('business_profiles')
      .select('*')
      .limit(1);
      
    if (profileError) {
      console.error("Error querying business_profiles table:", profileError.message);
    } else {
      if (profiles && profiles.length > 0) {
        console.log("Business profiles table structure:", Object.keys(profiles[0]));
      } else {
        console.log("No data in business_profiles table");
      }
    }
    
    console.log("\nRunning database introspection query...");
    const { data: allTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.error("Error in introspection query:", tablesError.message);
    } else {
      console.log("All tables:", allTables.map(t => t.table_name));
    }
    
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkTables();