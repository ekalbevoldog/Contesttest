import { supabase } from "./supabase";

async function checkBusinessProfilesForeignKeys() {
  console.log("Checking foreign key constraints on business_profiles table...");
  
  // This query gets foreign key constraints for the business_profiles table
  const query = `
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM
      information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'business_profiles';
  `;
  
  try {
    const { data, error } = await supabase.rpc('execute_sql', { query });
    
    if (error) {
      console.error("Error fetching foreign key constraints:", error);
      
      // Try alternate approach using SELECT query if RPC fails
      console.log("Trying to query a row to see if insert works now...");
      const { data: testData, error: testError } = await supabase
        .from('business_profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Test Business',
          session_id: '00000000-0000-0000-0000-000000000001',
          email: 'test@example.com',
          product_type: 'Test',
          campaign_vibe: 'Test',
          values: 'Test',
          audience_goals: 'Test'
        })
        .select();
        
      if (testError) {
        console.log("Test insert failed:", testError.message);
        if (testError.details) {
          console.log("Error details:", testError.details);
        }
      } else {
        console.log("Test insert succeeded. Foreign key constraint may have been removed.");
        
        // Clean up test data
        await supabase
          .from('business_profiles')
          .delete()
          .eq('id', '00000000-0000-0000-0000-000000000001');
      }
      
      return;
    }
    
    if (data && data.length > 0) {
      console.log("Found foreign key constraints:", data);
    } else {
      console.log("No foreign key constraints found on business_profiles table");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

// Run the check
checkBusinessProfilesForeignKeys();