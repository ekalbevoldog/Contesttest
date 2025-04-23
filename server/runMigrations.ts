import { runProfileMigration } from './runProfileMigration';
import { runUuidMigration } from './runUuidMigration';

/**
 * Run all migrations to prepare the database for use
 */
export async function runAllMigrations() {
  try {
    console.log('Starting all database migrations...');
    
    // First run the profile tables migration (create athlete_profiles and business_profiles)
    await runProfileMigration();
    console.log('Profile tables migration completed');
    
    // Then run the UUID migration to convert user_id columns to UUID type
    await runUuidMigration();
    console.log('UUID migration completed');
    
    console.log('All migrations completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during migrations:', error);
    throw error;
  }
}

// Allow direct execution of this script
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      console.log('Migrations completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migrations failed:', error);
      process.exit(1);
    });
}