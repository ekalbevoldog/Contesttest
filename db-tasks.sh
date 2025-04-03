#!/bin/bash

# Database Tasks Helper Script

# Function to display help
show_help() {
  echo "==================================================="
  echo "🛠️  Database Tasks Helper Script 🛠️"
  echo "==================================================="
  echo "Usage: ./db-tasks.sh [command]"
  echo ""
  echo "Available commands:"
  echo "  diagnose              Run comprehensive database diagnostics"
  echo "  migrate-to-supabase   Migrate database schema to Supabase"
  echo "  push                  Push schema changes to database (uses db:push)"
  echo "  status                Check basic database connection status"
  echo "  clear                 Drop all tables in the database"
  echo "  help                  Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./db-tasks.sh diagnose        # Run detailed connection diagnostics"
  echo "  ./db-tasks.sh status          # Check connection status only"
  echo "  ./db-tasks.sh push            # Push schema changes to database"
  echo "==================================================="
}

# Check if a command was provided
if [ $# -eq 0 ]; then
  show_help
  exit 1
fi

# Process commands
case "$1" in
  diagnose)
    echo "🔍 Running comprehensive database diagnostics..."
    node debug-db-connection.js
    ;;
  migrate-to-supabase)
    echo "🔄 Starting migration to Supabase..."
    echo "⚠️  This will ERASE all existing data in your Supabase database!"
    read -p "Are you sure you want to continue? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
      node scripts/migrate-to-supabase.js
    else
      echo "Operation cancelled"
    fi
    ;;
  push)
    echo "🔄 Pushing schema changes to database..."
    npm run db:push
    ;;
  status)
    echo "🔍 Checking basic database connection status..."
    # Create a temporary file for the test script
    cat << EOF > .temp-db-status.js
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database URLs
const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;
const regularDbUrl = process.env.DATABASE_URL;
const dbUrl = supabaseDbUrl || regularDbUrl;

console.log('=================================================');
console.log('📊 DATABASE CONNECTION STATUS CHECK 📊');
console.log('=================================================');

// Simple connection check
async function testConnection(url, description) {
  if (!url) {
    console.log(\`\${description}: ❌ No URL configured\`);
    return false;
  }
  
  console.log(\`Testing \${description} connection...\`);
  
  let client;
  try {
    client = postgres(url, { 
      max: 1, 
      idle_timeout: 5,
      connect_timeout: 8,
    });
    
    const result = await client\`SELECT 1 as connected\`;
    if (result[0]?.connected === 1) {
      console.log(\`\${description}: ✅ Connected\`);
      return true;
    }
    
    console.log(\`\${description}: ❌ Failed (unknown error)\`);
    return false;
  } catch (error) {
    console.log(\`\${description}: ❌ Failed - \${error.message}\`);
    return false;
  } finally {
    if (client) {
      await client.end();
    }
  }
}

async function run() {
  // Check database availability
  if (!dbUrl) {
    console.log('❌ No database URLs configured. Set SUPABASE_DATABASE_URL or DATABASE_URL');
    return;
  }
  
  // Test connection to the selected database
  const connected = await testConnection(dbUrl, 'Primary database');
  
  // Test Supabase specifically if configured
  if (supabaseDbUrl) {
    console.log('');
    console.log('✅ Supabase database URL is configured');
    
    if (supabaseDbUrl === dbUrl) {
      if (connected) {
        console.log('✅ Successfully connected to Supabase database');
      } else {
        console.log('❌ Unable to connect to Supabase database');
        console.log('⚠️ Run ./db-tasks.sh diagnose for detailed diagnostics');
      }
    } else {
      await testConnection(supabaseDbUrl, 'Supabase database');
    }
  } else {
    console.log('');
    console.log('⚠️ No Supabase database URL configured');
    
    if (connected) {
      console.log('ℹ️ Using local PostgreSQL database instead');
    }
  }
  
  console.log('=================================================');
}

run().catch(error => {
  console.error('Error in database status check:', error);
  process.exit(1);
});
EOF

    # Run the temporary script
    node .temp-db-status.js
    
    # Clean up
    rm .temp-db-status.js
    ;;
  clear)
    echo "⚠️ WARNING: This will DROP ALL TABLES in your database!"
    echo "⚠️ ALL DATA WILL BE PERMANENTLY DELETED!"
    read -p "Are you absolutely sure you want to continue? (yes/NO): " confirm
    if [[ $confirm == "yes" ]]; then
      echo "🗑️ Dropping all tables from database..."
      node -e "
      import postgres from 'postgres';
      import dotenv from 'dotenv';
      
      dotenv.config();
      
      async function dropAllTables() {
        const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
        
        if (!dbUrl) {
          console.error('❌ No database URL environment variable is set');
          process.exit(1);
        }
        
        const client = postgres(dbUrl, { max: 1 });
        
        try {
          // Get all tables in the public schema
          const tables = await client\`
            SELECT tablename FROM pg_catalog.pg_tables 
            WHERE schemaname = 'public'
          \`;
          
          if (tables.length === 0) {
            console.log('ℹ️ No tables found to drop');
            return;
          }
          
          console.log(\`ℹ️ Found \${tables.length} tables to drop: \${tables.map(t => t.tablename).join(', ')}\`);
          
          // Disable foreign key checks
          await client\`SET session_replication_role = 'replica'\`;
          
          // Drop all tables
          for (const table of tables) {
            console.log(\`🗑️ Dropping table: \${table.tablename}\`);
            await client\`DROP TABLE IF EXISTS \"\${table.tablename}\" CASCADE\`;
          }
          
          // Re-enable foreign key checks
          await client\`SET session_replication_role = 'origin'\`;
          
          console.log('✅ Successfully dropped all tables');
        } catch (error) {
          console.error('❌ Failed to drop tables:', error);
        } finally {
          await client.end();
        }
      }
      
      dropAllTables();
      "
    else
      echo "Operation cancelled"
    fi
    ;;
  help)
    show_help
    ;;
  *)
    echo "❌ Unknown command: $1"
    show_help
    exit 1
    ;;
esac