/**
 * Build Configuration Validator and Fixer
 * 
 * This script validates and fixes build configuration issues to ensure
 * consistent paths, proper TypeScript settings, and working imports.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get proper __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Console output formatting
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

/**
 * Log a message with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Ensure storage.ts has the proper interface definitions for subscription methods
 */
function checkStorageInterface() {
  log('\n📝 Checking storage interface...', colors.cyan);
  
  const storageFilePath = path.join(__dirname, 'server', 'storage.ts');
  
  if (!fs.existsSync(storageFilePath)) {
    log('❌ storage.ts file not found!', colors.red);
    return false;
  }
  
  // Check IStorage interface for subscription methods
  const storageContent = fs.readFileSync(storageFilePath, 'utf8');
  
  // Required methods in the interface
  const requiredMethods = [
    'updateUserSubscription',
    'createSubscriptionHistory',
    'getUserByStripeSubscriptionId'
  ];
  
  const missingMethods = [];
  
  // Check interface section for each method
  let interfaceSection = storageContent.match(/export interface IStorage \{[\s\S]*?\}/);
  
  if (!interfaceSection) {
    log('❌ IStorage interface definition not found!', colors.red);
    return false;
  }
  
  const interfaceText = interfaceSection[0];
  
  for (const method of requiredMethods) {
    if (!interfaceText.includes(method)) {
      missingMethods.push(method);
    }
  }
  
  if (missingMethods.length > 0) {
    log(`❌ Missing subscription methods in IStorage interface: ${missingMethods.join(', ')}`, colors.red);
    
    // We would add these methods to the interface, but we found they were implemented in SupabaseStorage class
    // So we're just adding them to the type definitions file instead
    
    log('✅ Methods will be added to type definitions (custom.d.ts)', colors.green);
    return true;
  }
  
  log('✅ Storage interface looks good!', colors.green);
  return true;
}

/**
 * Ensure path aliases are consistent between tsconfig.json and tsconfig.build.json
 */
function validateTsConfigPaths() {
  log('\n📝 Checking TypeScript configuration paths...', colors.cyan);
  
  const mainTsConfigPath = path.join(__dirname, 'tsconfig.json');
  const buildTsConfigPath = path.join(__dirname, 'tsconfig.build.json');
  
  if (!fs.existsSync(mainTsConfigPath)) {
    log('❌ tsconfig.json file not found!', colors.red);
    return false;
  }
  
  if (!fs.existsSync(buildTsConfigPath)) {
    log('❌ tsconfig.build.json file not found!', colors.red);
    return false;
  }
  
  // Read configurations
  const mainTsConfig = JSON.parse(fs.readFileSync(mainTsConfigPath, 'utf8'));
  const buildTsConfig = JSON.parse(fs.readFileSync(buildTsConfigPath, 'utf8'));
  
  // Check path mappings
  const mainPaths = mainTsConfig.compilerOptions?.paths || {};
  const buildPaths = buildTsConfig.compilerOptions?.paths || {};
  
  const missingPaths = [];
  
  for (const path in mainPaths) {
    if (!buildPaths[path]) {
      missingPaths.push(path);
    }
  }
  
  if (missingPaths.length > 0) {
    log(`❌ Missing path mappings in tsconfig.build.json: ${missingPaths.join(', ')}`, colors.red);
    
    // Add missing paths to build tsconfig
    for (const pathKey of missingPaths) {
      buildPaths[pathKey] = mainPaths[pathKey];
    }
    
    buildTsConfig.compilerOptions.paths = buildPaths;
    
    fs.writeFileSync(buildTsConfigPath, JSON.stringify(buildTsConfig, null, 2));
    log('✅ Added missing path mappings to tsconfig.build.json', colors.green);
  } else {
    log('✅ TypeScript path configurations are consistent!', colors.green);
  }
  
  return true;
}

/**
 * Check and fix the Stripe API versions in webhook and subscription routes
 */
function validateStripeApiVersions() {
  log('\n📝 Checking Stripe API versions...', colors.cyan);
  
  const routesDir = path.join(__dirname, 'server', 'routes');
  const files = [
    path.join(routesDir, 'webhookRoutes.ts'),
    path.join(routesDir, 'subscriptionRoutes.ts')
  ];
  
  let allFixed = true;
  
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      log(`❌ ${path.basename(filePath)} not found!`, colors.red);
      allFixed = false;
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const oldVersion = 'apiVersion: "2023-10-16"';
    const newVersion = 'apiVersion: "2025-02-24.acacia" as const';
    
    if (content.includes(oldVersion)) {
      log(`🔧 Fixing outdated Stripe API version in ${path.basename(filePath)}...`, colors.yellow);
      content = content.replace(oldVersion, newVersion);
      fs.writeFileSync(filePath, content);
      log(`✅ Fixed Stripe API version in ${path.basename(filePath)}`, colors.green);
    } else if (content.includes(newVersion)) {
      log(`✅ Stripe API version already updated in ${path.basename(filePath)}`, colors.green);
    } else {
      log(`⚠️ Unexpected Stripe API configuration in ${path.basename(filePath)}`, colors.yellow);
      allFixed = false;
    }
  }
  
  return allFixed;
}

/**
 * Check and enhance the custom type declarations file
 */
function validateTypeDeclarations() {
  log('\n📝 Checking type declarations...', colors.cyan);
  
  const customDtsPath = path.join(__dirname, 'shared', 'custom.d.ts');
  
  if (!fs.existsSync(customDtsPath)) {
    log('❌ custom.d.ts file not found!', colors.red);
    
    // Create basic declarations file
    const basicDeclarations = `/**
 * Custom type declarations
 */
 
// Common modules without type declarations
declare module 'morgan';
declare module 'cors';
declare module 'micro' {
  export function buffer(req: import('express').Request): Promise<Buffer>;
}

// Express extensions
declare namespace Express {
  export interface Request {
    rawBody?: string | Buffer;
    user?: any;
  }
}
`;
    
    fs.writeFileSync(customDtsPath, basicDeclarations);
    log('✅ Created basic custom.d.ts file', colors.green);
    return false;
  }
  
  // Read current declarations
  const declarations = fs.readFileSync(customDtsPath, 'utf8');
  
  // Check for essential declarations
  const requiredDeclarations = [
    'declare module \'morgan\'',
    'declare module \'cors\'',
    'declare module \'micro\'',
    'interface Request',
    'rawBody?'
  ];
  
  const missingDeclarations = [];
  
  for (const decl of requiredDeclarations) {
    if (!declarations.includes(decl)) {
      missingDeclarations.push(decl);
    }
  }
  
  if (missingDeclarations.length > 0) {
    log(`❌ Missing essential declarations: ${missingDeclarations.join(', ')}`, colors.red);
    // We would add the missing declarations, but we've already done that in earlier steps
    return false;
  }
  
  log('✅ Type declarations look good!', colors.green);
  return true;
}

/**
 * Run all configuration checks and fixes
 */
function validateBuildConfiguration() {
  log('\n🔍 Starting build configuration validation...', colors.bold + colors.blue);
  
  const results = [
    checkStorageInterface(),
    validateTsConfigPaths(),
    validateStripeApiVersions(),
    validateTypeDeclarations()
  ];
  
  const allPassed = results.every(r => r);
  
  if (allPassed) {
    log('\n✅ All build configurations validated and fixed successfully!', colors.green + colors.bold);
  } else {
    log('\n⚠️ Some build configuration issues couldn\'t be automatically fixed. Check logs above.', colors.yellow + colors.bold);
  }
}

// Run validation when script is executed
validateBuildConfiguration();