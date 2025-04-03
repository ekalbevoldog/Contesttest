// debug-db-connection.js
import dotenv from 'dotenv';
import postgres from 'postgres';
import url from 'url';

// Load environment variables
dotenv.config();

console.log('=== Database Connection Debugging ===');

// Get the Supabase database URL
const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: No database URL environment variable is set');
  process.exit(1);
}

// Parse the URL to display info without showing sensitive parts
try {
  const parsedUrl = new URL(dbUrl);
  console.log('\nDatabase URL Info (sensitive parts hidden):');
  console.log('- Protocol:', parsedUrl.protocol);
  console.log('- Host:', parsedUrl.hostname);
  console.log('- Port:', parsedUrl.port || '(default)');
  console.log('- Username:', '********');
  console.log('- Password:', '********');
  console.log('- Database:', parsedUrl.pathname.substring(1));
  
  // Check SSL parameters
  const sslMode = parsedUrl.searchParams.get('sslmode');
  console.log('- SSL Mode:', sslMode || '(not specified)');
  
  // Test the database connection
  console.log('\nAttempting to connect to the database...');
  
  const client = postgres(dbUrl, { 
    max: 1,
    idle_timeout: 10, 
    connect_timeout: 10,
  });
  
  async function testConnection() {
    try {
      console.log('Sending test query...');
      const result = await client`SELECT current_database(), current_user, version()`;
      
      console.log('\n✅ Connection successful!');
      console.log('- Database:', result[0].current_database);
      console.log('- User:', result[0].current_user);
      console.log('- Version:', result[0].version);
      
      return true;
    } catch (error) {
      console.error('\n❌ Connection failed:', error);
      return false;
    } finally {
      await client.end();
    }
  }
  
  testConnection()
    .then(success => {
      if (!success) {
        console.log('\nTroubleshooting tips:');
        console.log('1. Verify the database URL is correct');
        console.log('2. Ensure the database server is running');
        console.log('3. Check that your IP is allowed in Supabase settings');
        console.log('4. Check that the database user has proper permissions');
      }
      process.exit(success ? 0 : 1);
    });
} catch (error) {
  console.error('❌ Error parsing database URL:', error);
  process.exit(1);
}