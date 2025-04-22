// Simple script to test database connectivity
// Can be run with: node server/test-db.js

const { Pool } = require('pg');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // Test query
    console.log('Executing test query...');
    const result = await client.query('SELECT current_timestamp as time');
    console.log(`Database time: ${result.rows[0].time}`);
    
    // Check for required tables
    console.log('Checking database tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tables.rows.length === 0) {
      console.log('No tables found in the database. The application will create them on first run.');
    } else {
      console.log('Tables in database:');
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    client.release();
    await pool.end();
    
    console.log('Database connection test completed successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

testDatabaseConnection();