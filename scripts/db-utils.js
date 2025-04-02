/**
 * Database utilities script
 * 
 * This script provides utilities for interacting with the database:
 * 1. Test database connection
 * 2. Perform database health check
 * 3. Basic database operations
 * 
 * Usage:
 *   node scripts/db-utils.js test      # Test database connection
 *   node scripts/db-utils.js health    # Check database health
 *   node scripts/db-utils.js info      # Display database information
 */

import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Available commands
const COMMANDS = {
  TEST: 'test',
  HEALTH: 'health',
  INFO: 'info'
};

// Connect to the database
async function connectToDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
  }
}

// Command handlers
const commandHandlers = {
  [COMMANDS.TEST]: async () => {
    console.log('🔄 Testing database connection...');
    const client = await connectToDatabase();
    try {
      const result = await client.query('SELECT 1 as connected');
      if (result.rows[0].connected === 1) {
        console.log('✅ Database connection successful');
      } else {
        console.error('❌ Database connection test failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Database connection test failed:', error.message);
      process.exit(1);
    } finally {
      await client.end();
    }
  },
  
  [COMMANDS.HEALTH]: async () => {
    console.log('🔍 Checking database health...');
    const client = await connectToDatabase();
    try {
      // Check version
      const versionResult = await client.query('SELECT version()');
      console.log(`PostgreSQL Version: ${versionResult.rows[0].version}`);
      
      // Check active connections
      const connectionsResult = await client.query('SELECT count(*) FROM pg_stat_activity');
      console.log(`Active connections: ${connectionsResult.rows[0].count}`);
      
      // Check database size
      const sizeResult = await client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      console.log(`Database size: ${sizeResult.rows[0].size}`);
      
      // Check table count
      const tableCountResult = await client.query(`
        SELECT count(*) FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      console.log(`Table count: ${tableCountResult.rows[0].count}`);
      
      console.log('✅ Database health check completed');
    } catch (error) {
      console.error('❌ Database health check failed:', error.message);
      process.exit(1);
    } finally {
      await client.end();
    }
  },
  
  [COMMANDS.INFO]: async () => {
    console.log('ℹ️ Retrieving database information...');
    const client = await connectToDatabase();
    try {
      // Get tables
      const tablesResult = await client.query(`
        SELECT table_name, 
               (SELECT count(*) FROM information_schema.columns 
                WHERE table_name = t.table_name AND table_schema = 'public') as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      console.log('\nDatabase Tables:');
      console.log('----------------');
      if (tablesResult.rows.length === 0) {
        console.log('No tables found');
      } else {
        tablesResult.rows.forEach(table => {
          console.log(`${table.table_name} (${table.column_count} columns)`);
        });
      }
      
      // Check for any issues
      const tablesWithoutPKResult = await client.query(`
        SELECT t.table_name
        FROM information_schema.tables t
        LEFT JOIN information_schema.table_constraints c 
          ON c.table_name = t.table_name 
          AND c.constraint_type = 'PRIMARY KEY'
        WHERE t.table_schema = 'public'
          AND c.constraint_name IS NULL
      `);
      
      if (tablesWithoutPKResult.rows.length > 0) {
        console.log('\n⚠️ Tables without primary keys:');
        tablesWithoutPKResult.rows.forEach(table => {
          console.log(`- ${table.table_name}`);
        });
      }
      
      console.log('\n✅ Database information retrieved successfully');
    } catch (error) {
      console.error('❌ Failed to retrieve database information:', error.message);
      process.exit(1);
    } finally {
      await client.end();
    }
  }
};

// Get command from arguments
const command = process.argv[2]?.toLowerCase();

// Validate command
if (!command || !Object.values(COMMANDS).includes(command)) {
  console.error(`❌ Invalid command: ${command}`);
  console.log('\nAvailable commands:');
  console.log(`  ${COMMANDS.TEST}   - Test database connection`);
  console.log(`  ${COMMANDS.HEALTH} - Check database health`);
  console.log(`  ${COMMANDS.INFO}   - Display database information`);
  process.exit(1);
}

// Execute command
const handler = commandHandlers[command];
if (handler) {
  handler().catch(error => {
    console.error('❌ Command execution failed:', error.message);
    process.exit(1);
  });
} else {
  console.error(`❌ Command not implemented: ${command}`);
  process.exit(1);
}