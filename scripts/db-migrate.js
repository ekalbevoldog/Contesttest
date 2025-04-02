/**
 * Database migration script
 * 
 * This script helps manage database migrations using drizzle-kit.
 * It provides functionality to:
 * 1. Generate migration files based on schema changes
 * 2. Apply pending migrations to the database
 * 3. Display migration status
 * 
 * Usage:
 *   node scripts/db-migrate.js generate     # Generate migrations based on schema changes
 *   node scripts/db-migrate.js push         # Push schema changes directly to the database
 *   node scripts/db-migrate.js status       # Check migration status
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Available commands
const COMMANDS = {
  GENERATE: 'generate',
  PUSH: 'push',
  STATUS: 'status'
};

// Command handlers
const commandHandlers = {
  [COMMANDS.GENERATE]: () => {
    console.log('📝 Generating migration files...');
    try {
      execSync('npx drizzle-kit generate:pg', { stdio: 'inherit' });
      console.log('✅ Migration files generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate migration files', error.message);
      process.exit(1);
    }
  },
  
  [COMMANDS.PUSH]: () => {
    console.log('⬆️ Pushing schema changes to database...');
    try {
      execSync('npx drizzle-kit push:pg', { stdio: 'inherit' });
      console.log('✅ Schema changes applied successfully');
    } catch (error) {
      console.error('❌ Failed to push schema changes', error.message);
      process.exit(1);
    }
  },
  
  [COMMANDS.STATUS]: () => {
    console.log('🔍 Checking migration status...');
    try {
      execSync('npx drizzle-kit check:pg', { stdio: 'inherit' });
      console.log('✅ Migration status check completed');
    } catch (error) {
      console.error('❌ Failed to check migration status', error.message);
      process.exit(1);
    }
  }
};

// Get command from arguments
const command = process.argv[2]?.toLowerCase();

// Validate command
if (!command || !Object.values(COMMANDS).includes(command)) {
  console.error(`❌ Invalid command: ${command}`);
  console.log('\nAvailable commands:');
  console.log(`  ${COMMANDS.GENERATE} - Generate migration files based on schema changes`);
  console.log(`  ${COMMANDS.PUSH}     - Push schema changes directly to the database`);
  console.log(`  ${COMMANDS.STATUS}   - Check migration status`);
  process.exit(1);
}

// Execute command
const handler = commandHandlers[command];
if (handler) {
  handler();
} else {
  console.error(`❌ Command not implemented: ${command}`);
  process.exit(1);
}