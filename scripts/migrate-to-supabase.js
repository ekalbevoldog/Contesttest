#!/usr/bin/env node

/**
 * Supabase Migration Script
 * 
 * This script:
 * 1. Checks connection to Supabase PostgreSQL
 * 2. Validates the connection is to Supabase, not Neon
 * 3. Drops existing tables from the Supabase database (if any)
 * 4. Pushes the schema to the Supabase database
 * 
 * Usage:
 *   node scripts/migrate-to-supabase.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execPromise = promisify(exec);

// Get the Supabase database URL
const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;

if (!supabaseDbUrl) {
  console.error('❌ No SUPABASE_DATABASE_URL environment variable is set');
  console.error('❌ This script only works with Supabase, not with local PostgreSQL or Neon');
  process.exit(1);
}

// Check if the URL is for Supabase, not Neon
if (supabaseDbUrl.includes('neon.tech')) {
  console.error('❌ Error: Detected Neon database URL');
  console.error('❌ This script only works with Supabase databases');
  console.error('❌ Please provide a valid Supabase database URL');
  process.exit(1);
}

// Verify the URL contains supabase.co
if (!supabaseDbUrl.includes('supabase.co')) {
  console.error('❌ Error: The database URL does not appear to be a Supabase URL');
  console.error('❌ Supabase database URLs should contain "supabase.co"');
  console.error('❌ Please check your SUPABASE_DATABASE_URL environment variable');
  process.exit(1);
}

console.log('🔄 Starting migration to Supabase...');

// Step 1: Test connection to Supabase
async function testSupabaseConnection() {
  let client;
  try {
    console.log('🔌 Testing connection to Supabase PostgreSQL...');
    client = postgres(supabaseDbUrl, { 
      max: 1,
      idle_timeout: 10, 
      connect_timeout: 10,
    });
    
    const result = await client`SELECT current_user, current_database(), version() as version`;
    
    console.log('✅ Supabase connection successful:', {
      user: result[0].current_user,
      database: result[0].current_database,
      version: result[0].version
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error);
    return false;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Step 2: Drop existing tables if they exist
async function dropExistingTables() {
  let client;
  try {
    console.log('🧹 Dropping existing tables from Supabase database...');
    client = postgres(supabaseDbUrl, { 
      max: 1
    });
    
    // Get all tables in the public schema
    const tables = await client`
      SELECT tablename FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
    `;
    
    if (tables.length === 0) {
      console.log('ℹ️ No existing tables found in Supabase database');
      return;
    }
    
    console.log(`ℹ️ Found ${tables.length} tables to drop: ${tables.map(t => t.tablename).join(', ')}`);
    
    // Disable foreign key checks
    await client`SET session_replication_role = 'replica'`;
    
    // Drop all tables
    for (const table of tables) {
      console.log(`🗑️ Dropping table: ${table.tablename}`);
      await client`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`;
    }
    
    // Re-enable foreign key checks
    await client`SET session_replication_role = 'origin'`;
    
    console.log('✅ Successfully dropped all existing tables');
  } catch (error) {
    console.error('❌ Failed to drop existing tables:', error);
    throw error;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Step 3: Push schema to Supabase
async function pushSchemaToSupabase() {
  try {
    console.log('🔄 Pushing schema to Supabase database...');
    const { stdout, stderr } = await execPromise('npm run db:push');
    
    if (stderr && !stderr.includes('Generated')) {
      throw new Error(stderr);
    }
    
    console.log('✅ Successfully pushed schema to Supabase');
    console.log(stdout);
  } catch (error) {
    console.error('❌ Failed to push schema to Supabase:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    // Step 1: Test connection
    const connected = await testSupabaseConnection();
    if (!connected) {
      console.error('❌ Cannot proceed with migration due to connection issues');
      process.exit(1);
    }
    
    // Step 2: Drop existing tables
    await dropExistingTables();
    
    // Step 3: Push schema to Supabase
    await pushSchemaToSupabase();
    
    console.log('🎉 Migration to Supabase completed successfully!');
    console.log('ℹ️ Your application is now connected to Supabase PostgreSQL');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();