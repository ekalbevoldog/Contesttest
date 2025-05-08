
// #!/usr/bin/env tsx
import { runCompleteMigration } from '.server/runCompleteMigration.js ;

// Run the migration
console.log('Running complete database migration...');

runCompleteMigration()
  .then(success => {
    if (success) {
      console.log('✅ Database migration completed successfully');
      process.exit(0);
    } else {
      console.error('❌ Database migration failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unhandled error during migration:', error);
    process.exit(1);
  });
