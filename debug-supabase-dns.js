import 'dotenv/config';
import dns from 'dns';
import { promisify } from 'util';
import net from 'net';

const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);

async function testSupabaseDNS() {
  console.log('🔍 Testing Supabase DNS Resolution');
  
  const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;
  
  if (!supabaseDbUrl) {
    console.error('❌ SUPABASE_DATABASE_URL environment variable is not set');
    return;
  }
  
  try {
    const url = new URL(supabaseDbUrl);
    const hostname = url.hostname;
    console.log(`Testing DNS resolution for: ${hostname}`);
    
    // Try DNS Lookup (getaddrinfo)
    try {
      console.log('\n1. Testing DNS lookup via getaddrinfo (standard Node.js hostname resolution):');
      const lookupResult = await dnsLookup(hostname);
      console.log(`✅ DNS lookup successful: ${hostname} → ${lookupResult.address}`);
    } catch (err) {
      console.error(`❌ DNS lookup failed: ${err.message}`);
      console.log('This suggests the host cannot be resolved through the standard system resolver.');
    }
    
    // Try DNS Resolve (DNS specific resolution)
    try {
      console.log('\n2. Testing DNS resolution via dns.resolve:');
      const resolveResult = await dnsResolve(hostname);
      console.log(`✅ DNS resolution successful: ${hostname} → ${resolveResult.join(', ')}`);
    } catch (err) {
      console.error(`❌ DNS resolution failed: ${err.message}`);
      console.log('This suggests DNS-specific resolution issues.');
    }
    
    // Try TCP connection
    try {
      console.log('\n3. Testing TCP connection to the database port:');
      const port = url.port || 5432;
      const socket = new net.Socket();
      
      const connectPromise = new Promise((resolve, reject) => {
        socket.connect(port, hostname, () => {
          resolve(`✅ TCP connection successful to ${hostname}:${port}`);
          socket.destroy();
        });
        
        socket.on('error', (err) => {
          reject(`❌ TCP connection failed: ${err.message}`);
        });
      });
      
      const result = await connectPromise;
      console.log(result);
    } catch (err) {
      console.error(err);
    }
    
    // DNS Analysis and Recommendations
    console.log('\n📊 DNS Analysis and Recommendations:');
    
    console.log('1. If DNS lookup fails but the hostname appears correct:');
    console.log('   - Check if the Supabase hostname is correct');
    console.log('   - Ensure Replit can access external DNS services');
    console.log('   - Try setting up a direct IP connection if DNS is consistently failing');
    
    console.log('\n2. Testing with alternative DNS resolution method:');
    console.log('   - When standard Node.js DNS resolution fails, sometimes using specific resolvers helps');
    
    // Alternative resolution suggestions
    console.log('\n🛠️ Potential Solutions:');
    console.log('1. Update your Supabase database connection string to use the IP address directly, if available');
    console.log('2. Verify the Supabase database service is properly configured and running');
    console.log('3. If using Supabase\'s JavaScript client, it might bypass these DNS issues');
    
  } catch (err) {
    console.error('❌ Overall error:', err.message);
  }
}

testSupabaseDNS().catch(err => {
  console.error('Unhandled error:', err);
});