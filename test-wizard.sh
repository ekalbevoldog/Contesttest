#!/bin/bash
# This script is for testing the Pro Campaign Wizard

echo "Starting the application for wizard testing..."
echo "To access the wizard, use the following routes:"
echo "- /wizard-entry (Easy redirect entry point)"
echo "- /wizard/pro/test (Test page without auth guard)"
echo "- /wizard/pro/start (Main wizard start page, requires business role)"
echo ""
echo "Running npm run dev..."
npm run dev