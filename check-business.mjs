import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function checkBusinessRecords() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // List all current business records
    console.log('Checking all records in businesses table:');
    const { data: allBusinesses, error: allError } = await supabase
      .from('businesses')
      .select('*');
    
    if (allError) {
      console.error('Error fetching businesses:', allError.message);
    } else {
      console.log(`Found ${allBusinesses.length} businesses:`, allBusinesses);
    }
    
    // Check for the specific business profile for our user
    console.log('\nChecking if Blake has a business profile:');
    const { data: blakeBusiness, error: blakeError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', 'f9a17d43-cdd4-4981-9361-661928796e1d');
    
    if (blakeError) {
      console.error('Error fetching Blake\'s business:', blakeError.message);
    } else if (blakeBusiness.length > 0) {
      console.log('Blake\'s business profile exists:', blakeBusiness[0]);
    } else {
      console.log('Blake does not have a business profile');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkBusinessRecords();
