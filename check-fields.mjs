import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function checkBusinessFields() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Try inserting with different fields to determine required fields
    const testCases = [
      // Just userId
      { user_id: 'f9a17d43-cdd4-4981-9361-661928796e1d' },
      
      // Basic fields
      { 
        user_id: 'f9a17d43-cdd4-4981-9361-661928796e1d',
        company_name: 'Test Company'
      },
      
      // Try with company_type fields
      { 
        user_id: 'f9a17d43-cdd4-4981-9361-661928796e1d',
        company_name: 'Test Company',
        company_type: 'tech' 
      },
      
      // Try with company_type fields capitalized
      { 
        user_id: 'f9a17d43-cdd4-4981-9361-661928796e1d',
        company_name: 'Test Company',
        company_type: 'Tech' 
      },
      
      // Try more values for company_type enum
      { 
        user_id: 'f9a17d43-cdd4-4981-9361-661928796e1d',
        company_name: 'Test Company',
        company_type: 'service' 
      },
      
      { 
        user_id: 'f9a17d43-cdd4-4981-9361-661928796e1d',
        company_name: 'Test Company',
        company_type: 'Service' 
      },
      
      { 
        user_id: 'f9a17d43-cdd4-4981-9361-661928796e1d',
        company_name: 'Test Company',
        company_type: 'product' 
      },
      
      { 
        user_id: 'f9a17d43-cdd4-4981-9361-661928796e1d',
        company_name: 'Test Company',
        company_type: 'app' 
      }
    ];
    
    // Try with the business_profile table
    console.log('Testing business_profiles table...');
    
    // Try inserting with required fields according to the schema
    const businessProfileTestData = {
      user_id: '1',
      session_id: 'test-session',
      name: 'Test Business',
      product_type: 'Test Product',
      audience_goals: 'Test Goals',
      campaign_vibe: 'Professional',
      values: 'Integrity, Excellence',
      target_schools_sports: 'Local universities'
    };
    
    const { data: profileData, error: profileError } = await supabase
      .from('business_profiles')
      .insert(businessProfileTestData)
      .select();
      
    if (profileError) {
      console.log('Error inserting into business_profiles:', profileError.message);
    } else {
      console.log('Successfully inserted into business_profiles:', profileData);
    }
    
    // Now try with the businesses table
    console.log('\nTesting businesses table with various field combinations:');
    
    for (const [index, testData] of testCases.entries()) {
      console.log(`\nTest case ${index + 1}:`, testData);
      
      const { data, error } = await supabase
        .from('businesses')
        .insert(testData)
        .select();
        
      if (error) {
        console.log('Error:', error.message);
      } else {
        console.log('Success:', data);
        // We found a working combination!
        break;
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkBusinessFields();
