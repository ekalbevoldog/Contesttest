#!/usr/bin/env node

/**
 * Pro Campaign Wizard Functionality Test Script
 * 
 * This script tests various parts of the Pro Campaign Wizard to verify
 * that all components and routes are working as expected.
 */

import fs from 'fs';
import path from 'path';

// ANSI color codes for better visual output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper for formatted logging
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  let prefix = '';
  
  switch (type) {
    case 'success':
      prefix = `${colors.green}✓${colors.reset} `;
      break;
    case 'error':
      prefix = `${colors.red}✗${colors.reset} `;
      break;
    case 'warning':
      prefix = `${colors.yellow}!${colors.reset} `;
      break;
    case 'info':
    default:
      prefix = `${colors.blue}i${colors.reset} `;
  }
  
  console.log(`${prefix}${message}`);
}

// Print header
console.log(`\n${colors.bright}Pro Campaign Wizard Functionality Test${colors.reset}`);
console.log(`${colors.dim}Running tests at ${new Date().toISOString()}${colors.reset}\n`);

// Test 1: Verify required files exist
log('Verifying required files', 'info');
const requiredFiles = [
  'client/src/components/AuthGuard.tsx',
  'client/src/contexts/ProWizardProvider.tsx',
  'client/src/pages/wizard/pro/layout.tsx',
  'client/src/pages/wizard/pro/start.tsx',
  'client/src/pages/wizard/pro/advanced.tsx',
  'client/src/pages/wizard/pro/deliverables.tsx',
  'client/src/pages/wizard/pro/match.tsx',
  'client/src/pages/wizard/pro/bundle.tsx',
  'client/src/pages/wizard/pro/review.tsx',
  'client/src/pages/wizard/pro/test.tsx'
];

let missingFiles = [];
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    log(`Found ${file}`, 'success');
  } else {
    log(`Missing ${file}`, 'error');
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  log(`${missingFiles.length} required files are missing!`, 'error');
} else {
  log('All required files are present', 'success');
}

// Test 2: Verify AuthGuard implementation
log('\nVerifying AuthGuard implementation', 'info');
const authGuardPath = 'client/src/components/AuthGuard.tsx';
const authGuardContent = fs.readFileSync(authGuardPath, 'utf8');

// Check if AuthGuard has business role detection
if (authGuardContent.includes('requiredRole === \'business\'')) {
  log('AuthGuard has business role detection logic', 'success');
} else {
  log('AuthGuard is missing business role detection', 'error');
}

// Check for multiple fallback methods
const fallbackMethods = [
  'userType === \'business\'',
  'user.role === \'business\'',
  'user.user_metadata?.role === \'business\''
];

let implementedFallbacks = 0;
for (const method of fallbackMethods) {
  if (authGuardContent.includes(method)) {
    implementedFallbacks++;
    log(`Found fallback method: ${method}`, 'success');
  }
}

if (implementedFallbacks >= 2) {
  log(`AuthGuard implements ${implementedFallbacks} fallback methods for role detection`, 'success');
} else {
  log('AuthGuard should implement more fallback methods for role detection', 'warning');
}

// Test 3: Verify ProWizardProvider implementation
log('\nVerifying ProWizardProvider implementation', 'info');
const providerPath = 'client/src/contexts/ProWizardProvider.tsx';
const providerContent = fs.readFileSync(providerPath, 'utf8');

// Check if using Zustand
if (providerContent.includes('import { create }')) {
  log('ProWizardProvider uses Zustand store', 'success');
} else {
  log('ProWizardProvider should use Zustand for state management', 'error');
}

// Check for persistence
if (providerContent.includes('persist(')) {
  log('ProWizardProvider implements persistence', 'success');
} else {
  log('ProWizardProvider should implement persistence for better UX', 'warning');
}

// Test 4: Verify App.tsx routing
log('\nVerifying App.tsx routing structure', 'info');
const appPath = 'client/src/App.tsx';
const appContent = fs.readFileSync(appPath, 'utf8');

// Check for direct imports
if (appContent.includes('require(\'./pages/wizard/pro/')) {
  log('App.tsx uses direct component imports', 'success');
} else {
  log('App.tsx should use direct component imports instead of lazy loading', 'warning');
}

// Check for test routes
if (appContent.includes('/wizard/pro/test') && appContent.includes('/wizard-entry')) {
  log('App.tsx implements test routes for easier debugging', 'success');
} else {
  log('App.tsx should include test routes for easier debugging', 'warning');
}

// Summary
console.log(`\n${colors.bright}Test Summary${colors.reset}`);
console.log(`${colors.dim}================================${colors.reset}`);
log('Required files verification complete', missingFiles.length === 0 ? 'success' : 'error');
log('AuthGuard implementation verification complete', implementedFallbacks >= 2 ? 'success' : 'warning');
log('ProWizardProvider implementation verification complete', providerContent.includes('persist(') ? 'success' : 'warning');
log('App.tsx routing verification complete', appContent.includes('/wizard-entry') ? 'success' : 'warning');

console.log(`\n${colors.dim}Test completed at ${new Date().toISOString()}${colors.reset}\n`);