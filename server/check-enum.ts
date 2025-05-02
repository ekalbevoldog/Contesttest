import { supabase } from "./supabase.js";

async function checkEnumValue() {
  try {
    console.log("Checking valid company_type values...");
    
    // This query fetches the possible enum values for company_type
    const { data, error } = await supabase.rpc('get_enum_values', {
      enum_name: 'company_type'
    });
    
    if (error) {
      console.error("Error fetching enum values:", error);
      
      // Try an alternative approach
      console.log("Trying to query with different company_type values...");
      
      const possibleValues = [
        "Agency", "Brand", "Retailer", "Service", "Technology", "Other"
      ];
      
      for (const value of possibleValues) {
        console.log(`Testing "${value}"...`);
        const { error: testError } = await supabase
          .from('businesses')
          .insert({
            id: `00000000-0000-0000-0000-00000000000${possibleValues.indexOf(value)}`,
            company_name: 'Test',
            company_type: value,
            industry_id: 1,
            description: 'Test'
          });
          
        if (testError) {
          console.log(`Error with "${value}": ${testError.message}`);
        } else {
          console.log(`"${value}" is valid!`);
          
          // Clean up the test entry
          await supabase
            .from('businesses')
            .delete()
            .eq('id', `00000000-0000-0000-0000-00000000000${possibleValues.indexOf(value)}`);
        }
      }
    } else {
      console.log("Valid company_type values:", data);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkEnumValue();