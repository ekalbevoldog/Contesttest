
#!/usr/bin/env node
// Script to fix user schema issues

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Starting user schema fix...');

try {
  // Run user schema check
  console.log('\n🔍 Checking users table schema...');
  execSync('npx tsx server/check-users-schema.ts', { stdio: 'inherit' });
  
  // Run migration to ensure proper auth integration
  console.log('\n🔄 Ensuring proper auth integration...');
  execSync('npx tsx server/runCompleteMigration.ts', { stdio: 'inherit' });
  
  console.log('\n✅ User schema fix completed!');
} catch (error) {
  console.error('\n❌ Error during fix process:', error.message);
  process.exit(1);
}
