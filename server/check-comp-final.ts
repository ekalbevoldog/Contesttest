
import { supabase } from "./supabase.js";
import { v4 as uuidv4 } from 'uuid';

interface BusinessRecord {
  id: string;
  company_name: string;
  company_type: string;
  description: string;
}

async function tryInsertWithTypes() {
  const commonValues = [
    "service", "agency", "brand", "retailer", "manufacturer", 
    "technology", "other", "saas", "ecommerce", "marketplace", "platform"
  ] as const;
  
  for (const value of commonValues) {
    try {
      console.log(`Testing '${value}'...`);
      
      const testId = uuidv4();
      
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          id: testId,
          company_name: 'Test Company',
          company_type: value,
          description: 'Test record'
        } satisfies Omit<BusinessRecord, 'id'>)
        .select<'*', BusinessRecord>();
        
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
