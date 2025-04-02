#!/bin/bash
# Database Operations Script

# Available commands
# ./db-tasks.sh push     - Push schema changes to database
# ./db-tasks.sh generate - Generate migration files
# ./db-tasks.sh status   - Check migration status
# ./db-tasks.sh test     - Test database connection
# ./db-tasks.sh health   - Check database health
# ./db-tasks.sh info     - Display database information

# Ensure script is executable
# chmod +x db-tasks.sh

command=$1

if [ -z "$command" ]; then
  echo "❌ No command specified"
  echo ""
  echo "Available commands:"
  echo "  push     - Push schema changes to database"
  echo "  generate - Generate migration files"
  echo "  status   - Check migration status"
  echo "  test     - Test database connection"
  echo "  health   - Check database health"
  echo "  info     - Display database information"
  exit 1
fi

case $command in
  push)
    node --experimental-specifier-resolution=node scripts/db-migrate.js push
    ;;
  generate)
    node --experimental-specifier-resolution=node scripts/db-migrate.js generate
    ;;
  status)
    node --experimental-specifier-resolution=node scripts/db-migrate.js status
    ;;
  test)
    node --experimental-specifier-resolution=node scripts/db-utils.js test
    ;;
  health)
    node --experimental-specifier-resolution=node scripts/db-utils.js health
    ;;
  info)
    node --experimental-specifier-resolution=node scripts/db-utils.js info
    ;;
  *)
    echo "❌ Unknown command: $command"
    echo ""
    echo "Available commands:"
    echo "  push     - Push schema changes to database"
    echo "  generate - Generate migration files"
    echo "  status   - Check migration status"
    echo "  test     - Test database connection"
    echo "  health   - Check database health"
    echo "  info     - Display database information"
    exit 1
    ;;
esac