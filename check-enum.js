const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

async function tryEnumValues() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Try values that might work
    const possibleTypes = ['Agency', 'Retail', 'Service', 'Tech', 'CPG', 'B2B', 'B2C', 'Financial', 'Non-profit', 'Healthcare', 'products', 'service', 'app'];
    
    console.log('Will try these possible enum values:', possibleTypes);
    
    // Try a direct insert with each value
    for (const type of possibleTypes) {
      console.log(`Trying to create business profile with company_type = '${type}'`);
      
      const { data: tryInsert, error: tryError } = await supabase
        .from('businesses')
        .insert({
          user_id: 'f9a17d43-cdd4-4981-9361-661928796e1d',
          company_name: 'Test Company',
          company_type: type
        })
        .select();
      
      if (tryError) {
        console.log(`Failed with '${type}':`, tryError.message);
      } else {
        console.log(`Success with '${type}':`, tryInsert);
        // Break once we find a working value
        break;
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

tryEnumValues();
