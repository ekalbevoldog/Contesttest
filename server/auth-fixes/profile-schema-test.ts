import { supabase } from "../supabase";
import { v4 as uuidv4 } from 'uuid';

/**
 * This test script tries to understand the schema for business_profiles
 * by making API calls with different field combinations and logging the errors
 */
async function testBusinessProfileSchema() {
  console.log("===== Business Profile Schema Test =====");

  // First, let's try to get the field structure by checking an existing record
  console.log("Step 1: Attempting to query business_profiles table for field structure...");
  const { data: existingProfiles, error: queryError } = await supabase
    .from('business_profiles')
    .select('*')
    .limit(1);

  if (queryError) {
    console.error(`Query error:`, queryError);
  } else if (existingProfiles && existingProfiles.length > 0) {
    console.log(`Found existing profile with fields:`, Object.keys(existingProfiles[0]));
    console.log(`Sample data:`, existingProfiles[0]);
  } else {
    console.log(`No existing profiles found to inspect schema`);
  }

  // Create a test user ID
  const testUserId = uuidv4();
  console.log(`\nStep 2: Testing with test user ID: ${testUserId}`);

  // Test combinations of fields
  const testCases = [
    {
      name: "Minimal fields",
      data: { user_id: testUserId }
    },
    {
      name: "With email",
      data: { user_id: testUserId, email: "test@example.com" }
    },
    {
      name: "With name",
      data: { user_id: testUserId, name: "Test Business" }
    },
    {
      name: "With business_name",
      data: { user_id: testUserId, business_name: "Test Business" }
    },
    {
      name: "With session_id",
      data: { user_id: testUserId, session_id: uuidv4() }
    },
    {
      name: "With name and session_id",
      data: { user_id: testUserId, name: "Test Business", session_id: uuidv4() }
    },
    {
      name: "With business_name and session_id",
      data: { user_id: testUserId, business_name: "Test Business", session_id: uuidv4() }
    },
    {
      name: "With name and email",
      data: { user_id: testUserId, name: "Test Business", email: "test@example.com" }
    },
    {
      name: "With business_name and email",
      data: { user_id: testUserId, business_name: "Test Business", email: "test@example.com" }
    },
    {
      name: "Full set of fields", 
      data: {
        user_id: testUserId,
        name: "Test Business",
        business_name: "Test Business",
        email: "test@example.com",
        session_id: uuidv4(),
        audience_goals: "Reach new customers",
        campaign_vibe: "Professional",
        target_schools_sports: "All"
      }
    }
  ];

  console.log("\nStep 3: Testing different field combinations...");
  for (const testCase of testCases) {
    console.log(`\nTesting ${testCase.name}...`);
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .insert(testCase.data)
        .select();

      if (error) {
        console.log(`Failed: ${error.message}`);
        if (error.details) console.log(`Details: ${error.details}`);
      } else if (data && data.length > 0) {
        console.log(`Success! Created profile with ID: ${data[0].id}`);
        console.log(`Profile data: `, data[0]);
        
        // Clean up the test data if insertion was successful
        const { error: deleteError } = await supabase
          .from('business_profiles')
          .delete()
          .eq('user_id', testUserId);
          
        if (deleteError) {
          console.log(`Warning: Could not clean up test data: ${deleteError.message}`);
        } else {
          console.log(`Test data cleaned up successfully`);
        }
        
        break; // Stop testing once we find a working combination
      } else {
        console.log(`No data returned but no error either`);
      }
    } catch (e) {
      console.log(`Exception: ${e}`);
    }
  }

  console.log("\n===== Test completed =====");
}

// Run the test
testBusinessProfileSchema().catch(console.error);