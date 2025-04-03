#!/usr/bin/env node

/**
 * Enhanced Database Connection Debugging Tool
 * 
 * This script provides comprehensive diagnostics for database connections:
 * 1. Identifies the type of database (Supabase, local PostgreSQL, etc.)
 * 2. Performs DNS resolution checks on the hostname
 * 3. Tests connectivity with detailed error reporting
 * 4. Reports database version and configuration information
 * 5. Validates database permissions and capabilities
 * 
 * Usage:
 *   node debug-db-connection.js
 */

import dotenv from 'dotenv';
import postgres from 'postgres';
import dns from 'dns';
import { promisify } from 'util';
import { exec } from 'child_process';

// Promisify functions
const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);
const execPromise = promisify(exec);

// Load environment variables
dotenv.config();

console.log('======================================================');
console.log('📊 DATABASE CONNECTION DIAGNOSTIC TOOL 📊');
console.log('======================================================');

// Get the database URLs
const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;
const regularDbUrl = process.env.DATABASE_URL;
const dbUrl = supabaseDbUrl || regularDbUrl;

if (!dbUrl) {
  console.error('❌ Error: No database URL environment variable is set');
  process.exit(1);
}

// Check which database we're using
console.log('\n🔍 DATABASE TYPE DETECTION:');
if (supabaseDbUrl) {
  console.log('✅ Using Supabase database URL');
  console.log('   Priority: Primary (SUPABASE_DATABASE_URL)');
  
  if (supabaseDbUrl.includes('neon.tech')) {
    console.error('❌ ERROR: SUPABASE_DATABASE_URL contains "neon.tech"');
    console.error('   This indicates a Neon database, not Supabase');
    console.error('   Please provide a genuine Supabase database URL');
  } else if (!supabaseDbUrl.includes('supabase.co')) {
    console.warn('⚠️ Warning: SUPABASE_DATABASE_URL does not contain "supabase.co"');
    console.warn('   This might not be a genuine Supabase URL');
  }
} else if (regularDbUrl) {
  console.log('ℹ️ Using regular DATABASE_URL');
  console.log('   Priority: Secondary (fallback from SUPABASE_DATABASE_URL)');
  
  if (regularDbUrl.includes('neon.tech')) {
    console.error('❌ ERROR: DATABASE_URL contains "neon.tech"');
    console.error('   This indicates a Neon database, which is not allowed');
  } else if (regularDbUrl.includes('localhost') || regularDbUrl.includes('127.0.0.1')) {
    console.log('ℹ️ Using local PostgreSQL database');
  }
}

// Parse the URL to display info without showing sensitive parts
try {
  const parsedUrl = new URL(dbUrl);
  console.log('\n🔐 DATABASE URL INFO (sensitive parts hidden):');
  console.log('- Protocol:', parsedUrl.protocol);
  console.log('- Host:', parsedUrl.hostname);
  console.log('- Port:', parsedUrl.port || '(default)');
  console.log('- Username:', '********');
  console.log('- Password:', '********');
  console.log('- Database:', parsedUrl.pathname.substring(1));
  
  // Check SSL parameters
  const sslMode = parsedUrl.searchParams.get('sslmode');
  console.log('- SSL Mode:', sslMode || '(not specified)');
  
  // Validate the hostname with DNS lookup
  const hostname = parsedUrl.hostname;
  console.log('\n🌐 DNS RESOLUTION CHECKS:');
  console.log(`Checking DNS resolution for: ${hostname}`);
  
  try {
    // Try a simple DNS lookup first
    console.log('Performing DNS lookup...');
    const lookupResult = await dnsLookup(hostname);
    console.log('✅ Hostname resolves successfully');
    console.log(`- IP Address: ${lookupResult.address}`);
    console.log(`- IP Version: IPv${lookupResult.family}`);
    
    // Try to get more complete DNS information
    try {
      console.log('Performing additional DNS resolution...');
      const aRecords = await dnsResolve(hostname, 'A');
      console.log(`✅ Found ${aRecords.length} A record(s):`);
      aRecords.forEach((ip, i) => console.log(`  ${i+1}. ${ip}`));
    } catch (dnsError) {
      console.warn('⚠️ Could not perform additional DNS resolution');
      console.warn(`   Error: ${dnsError.message}`);
    }
    
    // For additional diagnostics, try a ping
    try {
      console.log('\nPinging hostname to verify network connectivity...');
      const { stdout } = await execPromise(`ping -c 1 ${hostname}`);
      console.log('✅ Ping successful:');
      
      // Extract the time from ping output (approximate)
      const timeLine = stdout.split('\n').find(line => line.includes('time='));
      if (timeLine) {
        console.log(`- ${timeLine.trim()}`);
      }
    } catch (pingError) {
      console.warn('⚠️ Ping failed:');
      console.warn(`   Error: ${pingError.message}`);
    }
  } catch (dnsError) {
    console.error('❌ Hostname DNS resolution failed');
    console.error(`   Error: ${dnsError.message}`);
    
    // If using Supabase but it's not resolving, provide specific advice
    if (hostname.includes('supabase.co')) {
      console.error('\n❌ CRITICAL ERROR: Supabase hostname not resolving');
      console.error('   This likely indicates an incorrect or outdated Supabase URL');
      console.error('   Please verify your Supabase project details and update the URL');
    }
  }
  
  // Test the database connection
  console.log('\n🔄 DATABASE CONNECTION TEST:');
  console.log('Attempting to connect to the database...');
  
  const client = postgres(dbUrl, { 
    max: 1,
    idle_timeout: 10, 
    connect_timeout: 15, // Slightly longer timeout for thorough testing
  });
  
  async function testConnection() {
    try {
      console.log('Sending test query...');
      const result = await client`SELECT current_database(), current_user, version(), current_schema, current_timestamp`;
      
      console.log('\n✅ CONNECTION SUCCESSFUL!');
      console.log('- Database:', result[0].current_database);
      console.log('- User:', result[0].current_user);
      console.log('- Schema:', result[0].current_schema);
      console.log('- Server Time:', result[0].current_timestamp);
      console.log('- Version:', result[0].version);
      
      // Check database size and tables
      try {
        const dbSizeResult = await client`
          SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
        `;
        console.log('- Database Size:', dbSizeResult[0].db_size);
        
        const tablesResult = await client`
          SELECT count(*) as table_count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;
        console.log('- Table Count:', tablesResult[0].table_count);
        
        // List tables if there are any
        if (tablesResult[0].table_count > 0) {
          const tableListResult = await client`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
          `;
          
          console.log('\n📋 EXISTING TABLES:');
          tableListResult.forEach((table, i) => {
            console.log(`  ${i+1}. ${table.table_name}`);
          });
        }
      } catch (infoError) {
        console.warn('⚠️ Could not retrieve additional database information');
        console.warn(`   Error: ${infoError.message}`);
      }
      
      return true;
    } catch (error) {
      console.error('\n❌ CONNECTION FAILED:');
      console.error(`   Error: ${error.message}`);
      
      // Provide more context based on error type
      if (error.code === 'ENOTFOUND') {
        console.error('\n📍 ERROR DIAGNOSIS: Hostname not found');
        console.error('   The database hostname could not be resolved to an IP address.');
        console.error('   This suggests the URL is incorrect or DNS is misconfigured.');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('\n📍 ERROR DIAGNOSIS: Connection refused');
        console.error('   The host was found, but it actively refused the connection.');
        console.error('   This suggests the database server is down or blocking connections.');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('\n📍 ERROR DIAGNOSIS: Connection timeout');
        console.error('   The connection attempt timed out.');
        console.error('   This suggests network issues or firewall restrictions.');
      } else if (error.message.includes('password authentication failed')) {
        console.error('\n📍 ERROR DIAGNOSIS: Authentication failure');
        console.error('   The database rejected the provided credentials.');
        console.error('   This suggests incorrect username or password in the connection URL.');
      }
      
      return false;
    } finally {
      await client.end();
    }
  }
  
  await testConnection()
    .then(success => {
      if (!success) {
        console.log('\n🔧 TROUBLESHOOTING TIPS:');
        console.log('1. Verify the database URL is correct and up-to-date');
        console.log('2. Check if the database server is running and accessible');
        console.log('3. Ensure network allows connections (check firewall settings)');
        console.log('4. Verify the database user has proper connection permissions');
        console.log('5. For Supabase: Check if your project is active and properly configured');
        console.log('6. Try getting fresh connection details from Supabase dashboard');
        
        console.log('\n🔄 NEXT STEPS:');
        console.log('1. Update your environment variables with the correct database URL');
        console.log('2. Restart your application after updating the URL');
        console.log('3. If using Supabase, verify project status in Supabase dashboard');
      }
      
      console.log('\n======================================================');
      console.log('📊 DATABASE DIAGNOSTIC COMPLETED 📊');
      console.log('======================================================');
    });
} catch (error) {
  console.error('❌ Error parsing database URL:', error.message);
  process.exit(1);
}