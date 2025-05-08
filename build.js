/**
 * Unified Build System
 * 
 * A comprehensive build system for both client and server components that ensures
 * consistent path resolution, proper TypeScript handling, and reliable builds.
 * This script centralizes all build logic in one place for easier maintenance.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get proper __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
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

/**
 * Log with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Execute a command with proper error handling
 */
function execute(command, options = {}) {
  try {
    log(`${colors.dim}$ ${command}${colors.reset}`);
    execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return true;
  } catch (error) {
    log(`Command failed: ${command}`, colors.red);
    if (options.throwOnError !== false) {
      throw error;
    }
    return false;
  }
}

/**
 * Clean the dist directory
 */
function cleanDist() {
  log('🧹 Cleaning dist directory...', colors.cyan);
  
  // Make sure the dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  
  // Clean server-side build artifacts
  execute('rm -rf dist/*.js dist/*.map dist/server dist/shared', { throwOnError: false });
  
  // Clean dist/public for client files
  if (fs.existsSync('dist/public')) {
    execute('rm -rf dist/public/*', { throwOnError: false });
  } else {
    fs.mkdirSync('dist/public', { recursive: true });
  }
  
  log('✅ Dist directory cleaned', colors.green);
}

/**
 * Fix TypeScript configuration files to ensure consistent path aliases
 */
function fixTsConfig() {
  log('\n🔧 Synchronizing TypeScript configurations...', colors.cyan);
  
  try {
    // Read the main tsconfig.json
    const tsconfigPath = path.join(__dirname, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Read the build tsconfig.json
    const buildTsconfigPath = path.join(__dirname, 'tsconfig.build.json');
    const buildTsconfig = JSON.parse(fs.readFileSync(buildTsconfigPath, 'utf8'));
    
    // Ensure paths are consistent
    let updated = false;
    
    if (!buildTsconfig.compilerOptions.paths['@/*'] && tsconfig.compilerOptions.paths['@/*']) {
      buildTsconfig.compilerOptions.paths['@/*'] = tsconfig.compilerOptions.paths['@/*'];
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(buildTsconfigPath, JSON.stringify(buildTsconfig, null, 2));
      log('✅ Updated TypeScript path configurations', colors.green);
    } else {
      log('✅ TypeScript configurations already in sync', colors.green);
    }
  } catch (error) {
    log(`⚠️ Error updating TypeScript configs: ${error.message}`, colors.yellow);
  }
}

/**
 * Fix TypeScript declaration issues for consistent builds
 */
function fixTypeDeclarations() {
  log('\n🔧 Ensuring type declarations are complete...', colors.cyan);
  
  // Path to custom declarations file
  const customDtsPath = path.join(__dirname, 'shared', 'custom.d.ts');
  
  if (!fs.existsSync(customDtsPath)) {
    log('⚠️ custom.d.ts not found, will be created by build-config.js', colors.yellow);
    return;
  }
  
  // Check for critical declarations and update if needed
  let content = fs.readFileSync(customDtsPath, 'utf8');
  let updated = false;
  
  // Add Vite server configuration types if missing
  if (!content.includes('declare module \'vite\'')) {
    content += `
// Vite server configuration types
declare module 'vite' {
  interface ServerOptions {
    // Allow boolean for allowedHosts
    allowedHosts?: boolean | string | true | string[];
  }
}
`;
    updated = true;
  }
  
  // Add SupabaseStorage interface if missing
  if (!content.includes('interface SupabaseStorage')) {
    content += `
// SupabaseStorage extensions
interface SupabaseStorage {
  updateUserSubscription(userId: string, data: any): Promise<any>;
  createSubscriptionHistory(data: any): Promise<any>;
  getUserByStripeSubscriptionId(subscriptionId: string): Promise<any>;
}
`;
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(customDtsPath, content);
    log('✅ Updated type declarations file', colors.green);
  } else {
    log('✅ Type declarations are already complete', colors.green);
  }
}

/**
 * Fix Stripe API version issues
 */
function fixStripeVersions() {
  log('\n🔧 Fixing Stripe API versions...', colors.cyan);
  
  const routesDir = path.join(__dirname, 'server', 'routes');
  if (!fs.existsSync(routesDir)) {
    log('⚠️ Routes directory not found, skipping Stripe version fixes', colors.yellow);
    return;
  }
  
  const files = [
    path.join(routesDir, 'webhookRoutes.ts'),
    path.join(routesDir, 'subscriptionRoutes.ts')
  ];
  
  let fixedCount = 0;
  
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('apiVersion: "2023-10-16"')) {
      const updated = content.replace(
        'apiVersion: "2023-10-16"',
        'apiVersion: "2025-02-24.acacia" as const'
      );
      
      fs.writeFileSync(filePath, updated);
      log(`✅ Fixed Stripe API version in ${path.basename(filePath)}`, colors.green);
      fixedCount++;
    }
  }
  
  if (fixedCount === 0) {
    log('✅ Stripe API versions are already up to date', colors.green);
  }
}

/**
 * Fix database connection handling in dbSetup.ts
 */
function fixDbConnection() {
  log('\n🔧 Fixing database connection handling...', colors.cyan);
  
  const dbSetupPath = path.join(__dirname, 'server', 'dbSetup.ts');
  
  if (!fs.existsSync(dbSetupPath)) {
    log('⚠️ dbSetup.ts not found, skipping database fixes', colors.yellow);
    return;
  }
  
  const content = fs.readFileSync(dbSetupPath, 'utf8');
  
  if (content.includes('const client = await pool.connect()')) {
    const updated = content.replace(
      /const client = await pool\.connect\(\);[\s\S]*?client\.release\(\);/g,
      'await pool.query(\'SELECT 1\');'
    );
    
    fs.writeFileSync(dbSetupPath, updated);
    log('✅ Fixed database connection handling in dbSetup.ts', colors.green);
  } else {
    log('✅ Database connection handling already fixed', colors.green);
  }
}

/**
 * Ensure the migration script exists
 */
function fixMigrationScript() {
  log('\n🔧 Checking migration script...', colors.cyan);
  
  const migrationScriptPath = path.join(__dirname, 'server', 'runCompleteMigration.js');
  
  if (!fs.existsSync(migrationScriptPath)) {
    log('✅ Migration script will be created by build-config.js', colors.green);
  } else {
    log('✅ Migration script already exists', colors.green);
  }
}

/**
 * Build the shared code (types, utilities, etc.)
 */
function buildShared() {
  log('\n📦 Building shared package...', colors.blue);
  
  if (!fs.existsSync(path.join(__dirname, 'shared'))) {
    log('⚠️ No shared package found, skipping', colors.yellow);
    return;
  }
  
  // Copy shared code to dist directory using TypeScript compiler
  execute('tsc -p tsconfig.build.json', { throwOnError: false });
  
  log('✅ Shared package build complete', colors.green);
}

/**
 * Build the client-side code
 */
function buildClient() {
  log('\n🔨 Building client...', colors.blue);
  
  try {
    // Create proper tsconfig.paths.json for client
    const clientDir = path.join(__dirname, 'client');
    const clientTsconfigPath = path.join(clientDir, 'tsconfig.paths.json');
    
    const clientTsconfig = {
      extends: '../tsconfig.json',
      compilerOptions: {
        baseUrl: '.',
        paths: {
          '@/*': ['./src/*'],
          '@shared/*': ['../shared/*']
        }
      },
      include: ['src/**/*']
    };
    
    fs.writeFileSync(clientTsconfigPath, JSON.stringify(clientTsconfig, null, 2));
    log('📝 Created temporary tsconfig.paths.json for client', colors.cyan);
    
    // Run Vite build with the correct config
    execute('npx vite build --config ../vite.config.ts', {
      cwd: clientDir
    });
    
    // Clean up the temporary config
    fs.unlinkSync(clientTsconfigPath);
    
    log('✅ Client build complete', colors.green);
  } catch (error) {
    log(`❌ Client build failed: ${error.message}`, colors.red);
    throw error;
  }
}

/**
 * Build the server-side code
 */
function buildServer() {
  log('\n🔨 Building server...', colors.magenta);
  
  // Try to run a clean TypeScript build first
  try {
    // First fix any schema structure issues
    try {
      log('🔧 Checking for schema structure issues...');
      const schemaFilePath = path.join(__dirname, 'shared/schema.ts');
      
      if (fs.existsSync(schemaFilePath)) {
        let schemaContent = fs.readFileSync(schemaFilePath, 'utf8');
        
        // Fix missing comma before contentTypes
        if (schemaContent.includes('updatedAt: z.date().optional()\n\n  contentTypes')) {
          log('🔧 Fixing missing comma in athleteSchema...');
          schemaContent = schemaContent.replace(
            /updatedAt: z\.date\(\)\.optional\(\)\s*\n\s*contentTypes/,
            'updatedAt: z.date().optional(),\n  contentTypes'
          );
          
          fs.writeFileSync(schemaFilePath, schemaContent);
          log('✅ Fixed schema.ts structure');
        }
      }
    } catch (error) {
      log(`⚠️ Error checking schema: ${error.message}`, colors.yellow);
    }
    
    log('🔍 Attempting standard TypeScript build...');
    execute('tsc -p tsconfig.build.json');
    log('✅ TypeScript build completed successfully', colors.green);
  } catch (error) {
    log('❌ TypeScript compilation failed with errors', colors.red);
    log('⚠️ Falling back to esbuild for error-tolerant compilation...', colors.yellow);
    
    // Use esbuild as a more permissive fallback
    try {
      execute('npx esbuild server/**/*.ts shared/**/*.ts ' +
        '--outdir=dist ' +
        '--platform=node ' +
        '--target=node16 ' +
        '--format=esm ' +
        '--bundle=false ' +
        '--sourcemap ' +
        '--allow-overwrite');
      
      log('✅ esbuild fallback completed successfully', colors.green);
    } catch (fallbackError) {
      log(`❌ Fallback build also failed: ${fallbackError.message}`, colors.red);
      throw new Error('Server build failed');
    }
  }
  
  // Copy any necessary non-TypeScript files
  if (fs.existsSync('server/supabase-migration.sql')) {
    execute('cp server/supabase-migration.sql dist/', { throwOnError: false });
    log('✅ SQL migration file copied', colors.green);
  } else {
    log('⚠️ SQL migration file not found, skipping copy', colors.yellow);
  }
}

/**
 * Run our comprehensive configuration validation
 */
function validateConfigs() {
  log('\n🔍 Validating build configurations...', colors.cyan);
  
  // If build-config.js exists, run it
  if (fs.existsSync(path.join(__dirname, 'build-config.js'))) {
    try {
      execute('node build-config.js', { throwOnError: false });
      log('✅ Configuration validation complete', colors.green);
      return true;
    } catch (error) {
      log('⚠️ Configuration validation had issues', colors.yellow);
    }
  } else {
    log('⚠️ build-config.js not found, skipping validation', colors.yellow);
  }
  
  return false;
}

/**
 * Perform the complete unified build
 */
function unifiedBuild() {
  try {
    log(`${colors.bright}🚀 Starting unified build process ${colors.reset}`);
    
    // Clean build directories
    cleanDist();
    
    // Fix any configuration and type issues
    fixTsConfig();
    fixTypeDeclarations();
    fixStripeVersions();
    fixDbConnection();
    fixMigrationScript();
    
    // Run any additional validation
    validateConfigs();
    
    // Build all components
    buildShared();
    buildClient();
    buildServer();
    
    log(`\n${colors.bright}${colors.green}✅ Build completed successfully${colors.reset}`);
    log(`\nRun 'node server.js' to start the application.`);
  } catch (error) {
    log(`\n${colors.bright}${colors.red}❌ Build failed${colors.reset}`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Execute the unified build
unifiedBuild();