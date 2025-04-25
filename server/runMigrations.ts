import { runProfileMigration } from './runProfileMigration.js';
import { runUuidMigration } from './runUuidMigration.js';

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

// For direct execution, this check needs to be done differently in ESM
// We'll just export the function for now