import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Use require for TS files
const storage = new (require('./server/supabaseStorage.ts').SupabaseStorage)();

async function testSupabaseStorage() {
  console.log('🔍 Testing Supabase Storage Implementation');
  
  // Small delay to allow initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test user operations
  console.log('\n1. Testing user operations:');
  try {
    const users = await storage.getAllUsers();
    console.log(`✅ Successfully retrieved ${users.length} users`);
    
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`✅ Sample user: ID=${firstUser.id}, Email=${firstUser.email}`);
      
      // Test get by ID
      const user = await storage.getUserById(firstUser.id);
      if (user) {
        console.log(`✅ Successfully retrieved user by ID ${firstUser.id}`);
      } else {
        console.error('❌ Failed to retrieve user by ID');
      }
    } else {
      console.log('ℹ️ No users found in the database');
    }
  } catch (error) {
    console.error('❌ Error testing user operations:', error);
  }
  
  // Test athlete operations
  console.log('\n2. Testing athlete operations:');
  try {
    const athletes = await storage.getAllAthletes();
    console.log(`✅ Successfully retrieved ${athletes.length} athletes`);
    
    if (athletes.length > 0) {
      const firstAthlete = athletes[0];
      console.log(`✅ Sample athlete: ID=${firstAthlete.id}, UserID=${firstAthlete.user_id}`);
    } else {
      console.log('ℹ️ No athletes found in the database');
    }
  } catch (error) {
    console.error('❌ Error testing athlete operations:', error);
  }
  
  // Test business operations
  console.log('\n3. Testing business operations:');
  try {
    const businesses = await storage.getAllBusinesses();
    console.log(`✅ Successfully retrieved ${businesses.length} businesses`);
    
    if (businesses.length > 0) {
      const firstBusiness = businesses[0];
      console.log(`✅ Sample business: ID=${firstBusiness.id}, UserID=${firstBusiness.user_id}`);
    } else {
      console.log('ℹ️ No businesses found in the database');
    }
  } catch (error) {
    console.error('❌ Error testing business operations:', error);
  }
}

testSupabaseStorage().catch(err => {
  console.error('Unhandled error:', err);
});