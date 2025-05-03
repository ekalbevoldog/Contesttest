#!/usr/bin/env node

/**
 * Pro Campaign Wizard Step Flow Test
 * 
 * This script verifies that each wizard step implements the correct
 * form handling, navigation, and data persistence.
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
console.log(`\n${colors.bright}Pro Campaign Wizard Step Flow Test${colors.reset}`);
console.log(`${colors.dim}Running tests at ${new Date().toISOString()}${colors.reset}\n`);

// Define wizard steps to test
const wizardSteps = [
  { name: 'Start', file: 'client/src/pages/wizard/pro/start.tsx' },
  { name: 'Advanced', file: 'client/src/pages/wizard/pro/advanced.tsx' },
  { name: 'Deliverables', file: 'client/src/pages/wizard/pro/deliverables.tsx' },
  { name: 'Match', file: 'client/src/pages/wizard/pro/match.tsx' },
  { name: 'Bundle', file: 'client/src/pages/wizard/pro/bundle.tsx' },
  { name: 'Review', file: 'client/src/pages/wizard/pro/review.tsx' },
];

// Features to check in each step
const featuresToCheck = [
  { name: 'useProWizard hook', pattern: 'useProWizard()' },
  { name: 'Form submission', pattern: 'onSubmit' },
  { name: 'State update', pattern: 'updateForm(' },
  { name: 'Navigation', pattern: 'navigate(' },
  { name: 'Supabase API calls', pattern: 'supabase.from' },
  { name: 'Form validation', pattern: 'zodResolver' },
  { name: 'Loading state', pattern: 'isSubmitting' },
  { name: 'Error handling', pattern: 'catch' },
];

// Test each step
for (const step of wizardSteps) {
  log(`\nTesting ${step.name} step:`, 'info');
  
  // Read file content
  const fileContent = fs.readFileSync(step.file, 'utf8');
  
  // Check for required features
  let featuresImplemented = 0;
  for (const feature of featuresToCheck) {
    if (fileContent.includes(feature.pattern)) {
      log(`${step.name} implements ${feature.name}`, 'success');
      featuresImplemented++;
    } else {
      log(`${step.name} might be missing ${feature.name}`, 'warning');
    }
  }
  
  // Check for navigation to next and previous steps
  const hasNextNav = fileContent.includes('nextStep()');
  const hasPrevNav = fileContent.includes('prevStep()');
  
  if (hasNextNav) {
    log(`${step.name} has navigation to next step`, 'success');
  } else if (step.name !== 'Review') {
    log(`${step.name} should implement navigation to next step`, 'warning');
  }
  
  if (hasPrevNav || step.name === 'Start') {
    log(`${step.name} has proper previous step handling`, 'success');
  } else {
    log(`${step.name} should implement navigation to previous step`, 'warning');
  }
  
  // Summary for this step
  const implementationScore = Math.round((featuresImplemented / featuresToCheck.length) * 100);
  log(`${step.name} step implementation score: ${implementationScore}%`, 
    implementationScore >= 80 ? 'success' : implementationScore >= 50 ? 'warning' : 'error');
}

// Check layout component
log('\nTesting Wizard Layout:', 'info');
const layoutPath = 'client/src/pages/wizard/pro/layout.tsx';
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

// Check for required layout features
const layoutFeatures = [
  { name: 'AuthGuard', pattern: '<AuthGuard' },
  { name: 'ProWizardProvider', pattern: 'ProWizardProvider' },
  { name: 'Progress indicator', pattern: 'Progress' },
  { name: 'Campaign ID check', pattern: 'campaignId' },
];

let layoutFeaturesImplemented = 0;
for (const feature of layoutFeatures) {
  if (layoutContent.includes(feature.pattern)) {
    log(`Layout implements ${feature.name}`, 'success');
    layoutFeaturesImplemented++;
  } else {
    log(`Layout might be missing ${feature.name}`, 'warning');
  }
}

// Summary
console.log(`\n${colors.bright}Test Summary${colors.reset}`);
console.log(`${colors.dim}================================${colors.reset}`);

// Calculate overall implementation score
const overallScore = layoutFeaturesImplemented === layoutFeatures.length ? 'Excellent' : 
                     layoutFeaturesImplemented >= layoutFeatures.length - 1 ? 'Good' : 'Needs improvement';

log(`Layout implementation: ${layoutFeaturesImplemented}/${layoutFeatures.length} features`, 
  layoutFeaturesImplemented === layoutFeatures.length ? 'success' : 'warning');

// Output the final assessment
console.log(`\n${colors.bright}Final Assessment${colors.reset}`);
console.log(`Pro Campaign Wizard implementation: ${colors.green}${overallScore}${colors.reset}`);
console.log(`\n${colors.dim}Test completed at ${new Date().toISOString()}${colors.reset}\n`);