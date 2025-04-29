// Fix path issue with proper relative imports
import { supabase } from "../supabase";
import { ensureBusinessProfile } from "./auto-create-business-profile";

/**
 * This test simulates creating a new business user and verifying 
 * that a business profile is automatically created.
 */
async function testNewBusinessUserCreation() {
  try {
    // Generate a unique email to prevent conflicts
    const testEmail = `test-business-${Date.now()}@example.com`;
    
    console.log(`Creating test business user with email: ${testEmail}`);
    
    // 1. Create a test user with business role directly in the users table
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email: testEmail,
        role: "business",
        created_at: new Date()
      })
      .select()
      .single();
      
    if (insertError || !newUser) {
      console.error("Error creating test user:", insertError);
      return;
    }
    
    console.log(`Successfully created test user with ID: ${newUser.id}`);
    
    // 2. Now call our function to create a business profile for this user
    console.log("Ensuring business profile exists...");
    const result = await ensureBusinessProfile(newUser.id.toString(), newUser.role);
    
    if (result) {
      console.log("Successfully created business profile");
      
      // 3. Verify the business profile was created
      const { data: profile, error: profileError } = await supabase
        .from("businesses")
        .select("*")
        .eq("user_id", newUser.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching created profile:", profileError);
      } else if (profile) {
        console.log("Business profile successfully created:");
        console.log(JSON.stringify(profile, null, 2));
        
        // 4. Clean up test data
        console.log("Cleaning up test data...");
        await supabase.from("businesses").delete().eq("user_id", newUser.id);
        await supabase.from("users").delete().eq("id", newUser.id);
        console.log("Test data cleaned up successfully");
      } else {
        console.error("No business profile was found after creation attempt");
      }
    } else {
      console.error("Failed to create business profile");
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

// Run the test
testNewBusinessUserCreation();