import { createBusinessProfileIfNeeded } from "./create-business-profile.js";

/**
 * Called after a user is created or updated to ensure they have a business profile
 * if their role is 'business'
 * 
 * @param userId - The user's ID in the users table (not auth_id)
 * @param role - The user's role
 * @returns Promise resolving to boolean indicating success
 */
export async function ensureBusinessProfile(userId: string, role: string): Promise<boolean> {
  try {
    // Only proceed if the user is a business
    if (role !== 'business') {
      console.log(`[Profile] User ${userId} has role ${role}, not creating business profile`);
      return true;
    }
    
    console.log(`[Profile] Ensuring business profile exists for business user ${userId}`);
    return await createBusinessProfileIfNeeded(userId);
  } catch (error) {
    console.error(`[Profile] Error ensuring business profile: ${error.message}`);
    return false;
  }
}