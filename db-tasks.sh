#!/bin/bash

# Database Tasks Helper Script

# Function to display help
show_help() {
  echo "Database Tasks Helper Script"
  echo "Usage: ./db-tasks.sh [command]"
  echo ""
  echo "Available commands:"
  echo "  migrate-to-supabase   Migrate database schema to Supabase"
  echo "  push                  Push schema changes to database (uses db:push)"
  echo "  status                Check database connection status"
  echo "  help                  Show this help message"
  echo ""
}

# Check if a command was provided
if [ $# -eq 0 ]; then
  show_help
  exit 1
fi

# Process commands
case "$1" in
  migrate-to-supabase)
    echo "🔄 Starting migration to Supabase..."
    node scripts/migrate-to-supabase.js
    ;;
  push)
    echo "🔄 Pushing schema changes to database..."
    npm run db:push
    ;;
  status)
    echo "🔍 Checking database connection status..."
    # Add a simple script to check database status
    node -e "
    import('./server/db.js').then(async ({ testConnection, testSupabaseConnection }) => {
      console.log('Testing database connections...');
      
      const dbConnected = await testConnection();
      console.log('Main database connection:', dbConnected ? '✅ Connected' : '❌ Failed');
      
      const supabaseConnected = await testSupabaseConnection();
      console.log('Supabase connection:', supabaseConnected ? '✅ Connected' : '❌ Failed');
      
      process.exit(0);
    }).catch(error => {
      console.error('Error testing connections:', error);
      process.exit(1);
    })
    "
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