import { supabase } from "./supabase";

async function checkBusinessesTable() {
  console.log("Checking businesses table structure...");
  
  try {
    // First, try to get a sample record to see the structure
    const { data: sample, error: sampleError } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error("Error fetching sample business:", sampleError.message);
    } else if (sample && sample.length > 0) {
      console.log("Sample business record:", sample[0]);
      console.log("Column names:", Object.keys(sample[0]));
      
      // Check company_type value specifically
      if (sample[0].company_type) {
        console.log("Example company_type value:", sample[0].company_type);
      }
    } else {
      console.log("No business records found");
    }
    
    // Try a raw SQL query to get information about the company_type column
    const { data: typeInfo, error: typeError } = await supabase.rpc('exec_sql', { 
      query: `
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable,
          column_default,
          udt_name
        FROM 
          information_schema.columns 
        WHERE 
          table_name = 'businesses' 
          AND column_name = 'company_type'
      `
    });
    
    if (typeError) {
      console.error("Error fetching column info:", typeError);
    } else {
      console.log("company_type column info:", typeInfo);
    }
    
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

checkBusinessesTable();