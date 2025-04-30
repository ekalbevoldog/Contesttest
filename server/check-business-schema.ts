import { supabase } from "./supabase";

async function checkBusinessProfilesSchema() {
  console.log("Checking business_profiles table schema...");
  
  try {
    // This will show us error details if there's a problem with the query
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error("Error querying business_profiles:", error.message);
      console.error("Error details:", error.details);
      
      // Try to get the column names directly from PostgreSQL
      const { data: columns, error: columnsError } = await supabase.rpc('get_columns', { 
        table_name: 'business_profiles' 
      });
      
      if (columnsError) {
        console.error("Failed to get columns:", columnsError.message);
      } else {
        console.log("Columns in business_profiles:", columns);
      }
    } else {
      if (data && data.length > 0) {
        const sample = data[0];
        console.log("Sample business profile:", sample);
        console.log("Column names:", Object.keys(sample));
      } else {
        console.log("No data found in business_profiles table");
        
        // Try to insert with specific fields to see which ones are valid
        const testInsert = await supabase
          .from('business_profiles')
          .insert({
            // Try different combinations to see what works
            name: 'Test Business',
            session_id: 'test-session',
            values: 'Test values',
            audience_goals: 'Test goals',
            campaign_vibe: 'Professional',
            product_type: 'Test product',
            // Try with both user_id and id
            user_id: '00000000-0000-0000-0000-000000000000',
            id: '00000000-0000-0000-0000-000000000000',
            business_id: '00000000-0000-0000-0000-000000000000'
          })
          .select();
          
        if (testInsert.error) {
          console.error("Test insert error:", testInsert.error.message);
          console.error("Test insert error details:", testInsert.error.details);
        }
      }
    }
    
    // Check for Supabase metadata on the table
    const { data: tables, error: tablesError } = await supabase.rpc('get_tables');
    if (tablesError) {
      console.error("Failed to get tables:", tablesError.message);
    } else {
      console.log("Tables in database:", tables);
    }
    
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

// Run the check
checkBusinessProfilesSchema();