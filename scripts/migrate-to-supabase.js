#!/usr/bin/env node

/**
 * Supabase Migration Script
 * 
 * This script:
 * 1. Checks connection to Supabase PostgreSQL
 * 2. Drops existing tables from the Supabase database (if any)
 * 3. Pushes the schema to the Supabase database
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
const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!supabaseDbUrl) {
  console.error('❌ No SUPABASE_DATABASE_URL environment variable is set');
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