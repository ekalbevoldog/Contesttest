import 'dotenv/config';
import pg from 'pg';

async function testLocalPostgresConnection() {
  console.log('🔍 Testing Local PostgreSQL Connection');
  
  // Check environment variables
  console.log('Checking environment variables:');
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    return;
  }
  
  // Parse the URL to display without sensitive parts
  try {
    const url = new URL(databaseUrl);
    console.log(`✅ Database URL protocol: ${url.protocol}`);
    console.log(`✅ Database URL hostname: ${url.hostname}`);
    console.log(`✅ Database URL port: ${url.port || 'default'}`);
    console.log(`✅ Database URL pathname: ${url.pathname}`);
    console.log(`✅ Database URL SSL mode: ${url.searchParams.get('sslmode') || 'not specified'}`);
  } catch (err) {
    console.error('❌ Failed to parse database URL:', err.message);
    return;
  }
  
  // Create a client
  const client = new pg.Client({
    connectionString: databaseUrl,
  });
  
  try {
    console.log('\nAttempting to connect to PostgreSQL...');
    await client.connect();
    console.log('✅ Connection successful!');
    
    // Test with a simple query
    console.log('\nExecuting test query...');
    const result = await client.query('SELECT current_database() as db, current_user as user');
    console.log(`✅ Query successful. Connected to database: ${result.rows[0].db} as user: ${result.rows[0].user}`);
    
    // List all tables
    console.log('\nListing tables in the public schema...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the public schema.');
    } else {
      console.log('Tables in the database:');
      tablesResult.rows.forEach((row, i) => {
        console.log(`${i+1}. ${row.table_name}`);
      });
    }
    
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
  } finally {
    // Close the connection
    try {
      await client.end();
      console.log('\nConnection closed.');
    } catch (err) {
      console.error('Error closing connection:', err.message);
    }
  }
}

testLocalPostgresConnection().catch(err => {
  console.error('Unhandled error:', err);
});