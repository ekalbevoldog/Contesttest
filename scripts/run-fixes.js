
#!/usr/bin/env node
// Script to run all fixes in sequence

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Starting comprehensive database and code fixes...');

try {
  // 1. Run TypeScript error fixes
  console.log('\n🔍 Running TypeScript error fixes...');
  execSync('npx tsx scripts/fix-typescript-errors.ts', { stdio: 'inherit' });
  
  // 2. Run database diagnostic
  console.log('\n🔍 Running database diagnostic...');
  execSync('npx tsx scripts/db-diagnostic.ts', { stdio: 'inherit' });
  
  // 3. Run targeted migration
  console.log('\n🔍 Running targeted database migration...');
  execSync('npx tsx scripts/profile-fields-migration.ts', { stdio: 'inherit' });
  
  // 4. Rebuild the project with the fallback method
  console.log('\n🔍 Rebuilding the project...');
  execSync('node scripts/build-with-fallback.js', { stdio: 'inherit' });
  
  console.log('\n✅ All fixes completed successfully!');
  console.log('\nYou can now restart the server to apply the changes.');
} catch (error) {
  console.error('\n❌ Error during fix process:', error.message);
  process.exit(1);
}
