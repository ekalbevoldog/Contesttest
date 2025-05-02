// Apply subscription_cancel_at_period_end column migration
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function applyMigration() {
  console.log('🔄 Applying subscription_cancel_at_period_end column migration...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  try {
    // Connect to the database
    const client = postgres(process.env.DATABASE_URL);
    const db = drizzle(client);
    
    // Read the migration SQL
    const migrationPath = path.join(process.cwd(), 'migrations', 'add_subscription_cancel_column.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    console.log('📄 Executing SQL migration...');
    await client.unsafe(migrationSql);
    
    console.log('✅ Migration applied successfully');
    
    // Close the database connection
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();