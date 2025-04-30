import { Router } from 'express';
import { supabase, supabaseAdmin } from '../supabase';

const router = Router();

// Route to update all users with missing auth_id
router.get('/update-auth-ids', async (req, res) => {
  try {
    // Get all users that have missing auth_id values
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .is('auth_id', null);
      
    if (usersError) {
      console.error("Error fetching users with missing auth_id:", usersError);
      return res.status(500).json({ error: "Error fetching users" });
    }
    
    console.log(`Found ${users?.length || 0} users with missing auth_id`);
    
    if (!users || users.length === 0) {
      return res.json({ 
        message: "No users found with missing auth_id",
        updated: 0
      });
    }
    
    // For each user, find their auth_id in the auth.users table and update
    const updates = [];
    for (const user of users) {
      if (!user.email) continue;
      
      // Look up the user in auth.users by email
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error(`Error fetching auth user for ${user.email}:`, authError);
        continue;
      }
      
      // Find the matching user by email
      const matchingAuthUser = authUser.users.find(u => u.email === user.email);
      
      if (matchingAuthUser) {
        console.log(`Found auth match for ${user.email}: ${matchingAuthUser.id}`);
        
        // Update the user record with the auth_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_id: matchingAuthUser.id })
          .eq('id', user.id);
          
        if (updateError) {
          console.error(`Error updating auth_id for user ${user.id}:`, updateError);
          updates.push({ id: user.id, success: false, error: updateError.message });
        } else {
          console.log(`Successfully updated auth_id for user ${user.id}`);
          updates.push({ id: user.id, success: true, auth_id: matchingAuthUser.id });
        }
      } else {
        console.log(`No auth match found for ${user.email}`);
        updates.push({ id: user.id, success: false, error: "No auth match found" });
      }
    }
    
    // Return the results
    const successful = updates.filter(u => u.success).length;
    const failed = updates.filter(u => !u.success).length;
    
    return res.json({
      message: `Updated ${successful} users, ${failed} failed`,
      total: users.length,
      updated: successful,
      failed: failed,
      details: updates
    });
    
  } catch (error) {
    console.error("Error updating auth_ids:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;