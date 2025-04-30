import { supabase } from "./supabase";
import { v4 as uuidv4 } from 'uuid';

async function tryInsertWithTypes() {
  const commonValues = [
    "service", "agency", "brand", "retailer", "manufacturer", 
    "technology", "other", "saas", "ecommerce", "marketplace", "platform"
  ];
  
  for (const value of commonValues) {
    try {
      console.log(`Testing '${value}'...`);
      
      // Create a proper UUID for each test
      const testId = uuidv4();
      
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
        console.log(`Value '${value}' WORKS! Created record with ID: ${testId}`);
        
        // Clean up
        await supabase
          .from('businesses')
          .delete()
          .eq('id', testId);
      }
    } catch (err) {
      console.error(`Error testing '${value}':`, err);
    }
  }
}

tryInsertWithTypes();