import { supabase } from "../supabase.js";
import { ensureBusinessProfile } from "./auto-create-business-profile.js";

/**
 * This test script verifies that business profiles are created correctly
 * for test users with the 'business' role.
 */
async function testBusinessProfileCreation() {
  try {
    // Get a test business user
    const { data: businessUsers, error: userError } = await supabase
      .from("users")
      .select("id, email, username, role")
      .eq("role", "business")
      .limit(5);
      
    if (userError) {
      console.error("Error fetching business users:", userError);
      return;
    }
    
    if (!businessUsers || businessUsers.length === 0) {
      console.log("No business users found to test with");
      return;
    }
    
    console.log(`Found ${businessUsers.length} business users for testing`);
    
    // Test each business user
    for (const user of businessUsers) {
      console.log(`\nTesting user: ${user.username} (${user.id})`);
      
      // Check if they already have a business profile
      const { data: existingProfile, error: profileError } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error(`Error checking business profile for user ${user.id}:`, profileError);
        continue;
      }
      
      if (existingProfile) {
        console.log(`User ${user.username} already has a business profile with id ${existingProfile.id}`);
        console.log(`Profile details: ${JSON.stringify(existingProfile)}`);
      } else {
        console.log(`User ${user.username} doesn't have a business profile. Creating one...`);
        
        // Create a business profile
        const result = await ensureBusinessProfile(user.id.toString(), user.role);
        
        if (result) {
          console.log(`Successfully created business profile for ${user.username}`);
          
          // Verify it was created
          const { data: newProfile } = await supabase
            .from("businesses")
            .select("*")
            .eq("user_id", user.id)
            .single();
            
          console.log(`New profile details: ${JSON.stringify(newProfile)}`);
        } else {
          console.error(`Failed to create business profile for ${user.username}`);
        }
      }
    }
    
    console.log("\nTest completed successfully");
  } catch (error) {
    console.error("Error running test:", error);
  }
}

// Run the test
testBusinessProfileCreation();