import 'dotenv/config';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Import using require to handle TypeScript modules
const { testConnection, testSupabaseConnection } = require('./server/db.ts');

async function runTests() {
  console.log('🔍 Running database connection tests');
  
  console.log('\n1. Testing basic database connection:');
  const connectionResult = await testConnection();
  if (connectionResult) {
    console.log('✅ Basic database connection successful');
  } else {
    console.error('❌ Basic database connection failed');
  }
  
  console.log('\n2. Testing Supabase-specific connection:');
  const supabaseResult = await testSupabaseConnection();
  if (supabaseResult) {
    console.log('✅ Supabase connection successful');
  } else {
    console.error('❌ Supabase connection failed');
  }
}

runTests().catch(err => {
  console.error('Unhandled error:', err);
});