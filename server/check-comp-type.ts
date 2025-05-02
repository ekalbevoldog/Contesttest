import { supabase } from "./supabase.js";

async function checkCompanyType() {
  try {
    // Let's try to query using SQL to get enum values
    const { data, error } = await supabase.rpc('exec_sql', {
      query: "SELECT pg_enum.enumlabel FROM pg_type JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'company_type'"
    });
    
    if (error) {
      console.error("RPC error:", error);
      
      // Let's try DIRECT inserts with known enum values for PostgreSQL
      console.log("Trying common enum values...");
      const commonValues = [
        "service", "agency", "brand", "retailer", "manufacturer", 
        "technology", "other", "direct_to_consumer", "b2c", "b2b"
      ];
      
      for (const value of commonValues) {
        console.log(`Testing '${value}'...`);
        
        // Using a random UUID for each test
        const testId = `test-${Math.random().toString(36).substring(2, 10)}`;
        
        const { data, error } = await supabase
          .from('businesses')
          .insert({
            id: testId,
            company_name: 'Test Company',
            company_type: value,
            description: 'Test record'
          })
          .select();
          
        if (error) {
          console.log(`Value '${value}' failed: ${error.message}`);
        } else {
          console.log(`Value '${value}' WORKS! Created record with ID: ${data?.[0]?.id}`);
          
          // Delete the test record
          await supabase
            .from('businesses')
            .delete()
            .eq('id', testId);
        }
      }
    } else {
      console.log("Enum values:", data);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkCompanyType();