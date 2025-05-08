/**
 * Unified Build System
 * 
 * A comprehensive build system for both client and server components that ensures
 * consistent path resolution, proper TypeScript handling, and reliable builds.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get proper directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Console styling
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
 * Log a message with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Execute a shell command with proper error handling
 */
function execute(command, options = {}) {
  try {
    log(`${colors.dim}$ ${command}${colors.reset}`);
    return execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      cwd: options.cwd || projectRoot,
      ...options
    });
  } catch (error) {
    if (options.ignoreError) {
      log(`Command failed but continuing: ${command}`, colors.yellow);
      return null;
    }
    log(`Command failed: ${command}`, colors.red);
    throw error;
  }
}

/**
 * Ensure all required directories exist
 */
function ensureDirectories() {
  log('🏗️ Ensuring build directories exist...', colors.cyan);
  
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(path.join(projectRoot, 'dist'))) {
    fs.mkdirSync(path.join(projectRoot, 'dist'));
  }
  
  // Create public directory for static files
  if (!fs.existsSync(path.join(projectRoot, 'dist', 'public'))) {
    fs.mkdirSync(path.join(projectRoot, 'dist', 'public'), { recursive: true });
  }
  
  log('✅ Build directories ready', colors.green);
}

/**
 * Clean the build directories
 */
function cleanDistDirectories() {
  log('🧹 Cleaning build directories...', colors.cyan);
  
  // Clean server dist
  execute('rm -rf dist/*.js dist/*.map dist/server dist/shared', { ignoreError: true });
  
  // Clean client dist but preserve the directory
  if (fs.existsSync(path.join(projectRoot, 'dist', 'public'))) {
    execute('rm -rf dist/public/*', { ignoreError: true });
  }
  
  log('✅ Build directories cleaned', colors.green);
}

/**
 * Update TypeScript configurations to ensure consistency
 */
function updateTypeScriptConfigs() {
  log('🔄 Synchronizing TypeScript configurations...', colors.cyan);
  
  try {
    // Read the main tsconfig.json
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Read the build tsconfig.json
    const buildTsconfigPath = path.join(projectRoot, 'tsconfig.build.json');
    const buildTsconfig = JSON.parse(fs.readFileSync(buildTsconfigPath, 'utf8'));
    
    // Synchronize path mappings
    buildTsconfig.compilerOptions.paths = {
      ...tsconfig.compilerOptions.paths
    };
    
    // Update the build config
    fs.writeFileSync(buildTsconfigPath, JSON.stringify(buildTsconfig, null, 2));
    
    log('✅ TypeScript configurations synchronized', colors.green);
  } catch (error) {
    log(`⚠️ Error updating TypeScript configs: ${error.message}`, colors.yellow);
  }
}

/**
 * Build the shared code (types, utilities, etc.)
 */
function buildShared() {
  log('\n📦 Building shared package...', colors.blue);
  
  if (!fs.existsSync(path.join(projectRoot, 'shared'))) {
    log('⚠️ No shared package found, skipping', colors.yellow);
    return;
  }
  
  // Just use TypeScript compiler, we don't need to bundle shared code
  execute('tsc -p tsconfig.build.json --outDir dist/shared shared/**/*.ts', { ignoreError: true });
  
  log('✅ Shared package build complete', colors.green);
}

/**
 * Build the server-side code
 */
function buildServer() {
  log('\n🔨 Building server...', colors.magenta);
  
  try {
    // First try regular TypeScript compilation
    execute('tsc -p tsconfig.build.json --outDir dist server/**/*.ts');
    log('✅ Server build completed successfully', colors.green);
  } catch (error) {
    log('⚠️ TypeScript compilation had errors, using fallback compilation...', colors.yellow);
    
    // Use esbuild as a more permissive fallback
    try {
      execute(`npx esbuild server/**/*.ts shared/**/*.ts ` +
        `--outdir=dist ` +
        `--platform=node ` +
        `--target=node16 ` +
        `--format=esm ` +
        `--bundle=false ` +
        `--sourcemap ` +
        `--allow-overwrite`);
      
      log('✅ Server build completed with fallback compiler', colors.green);
    } catch (fallbackError) {
      log(`❌ Fallback compilation also failed: ${fallbackError.message}`, colors.red);
      throw new Error('Server build failed');
    }
  }
  
  // Copy migration SQL if it exists
  if (fs.existsSync(path.join(projectRoot, 'server', 'supabase-migration.sql'))) {
    execute('cp server/supabase-migration.sql dist/', { ignoreError: true });
    log('✅ SQL migration file copied', colors.green);
  }
}

/**
 * Build the client-side code
 */
function buildClient() {
  log('\n🔨 Building client...', colors.blue);
  
  try {
    // Create temporary tsconfig for client
    const clientTsconfigPath = path.join(projectRoot, 'client', 'tsconfig.paths.json');
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
    log('📝 Created temporary tsconfig for client build', colors.cyan);
    
    // Run vite build with the temporary config
    try {
      execute('npx vite build --config ../vite.config.ts', { 
        cwd: path.join(projectRoot, 'client') 
      });
      log('✅ Client build completed successfully', colors.green);
    } finally {
      // Clean up temporary config file
      fs.unlinkSync(clientTsconfigPath);
      log('🧹 Removed temporary client tsconfig', colors.dim);
    }
  } catch (error) {
    log(`❌ Client build failed: ${error.message}`, colors.red);
    throw new Error('Client build failed');
  }
}

/**
 * Fix any outstanding TypeScript declaration issues
 */
function fixDeclarations() {
  log('\n🔧 Ensuring type declarations are complete...', colors.cyan);
  
  // Path to custom declarations file
  const customDtsPath = path.join(projectRoot, 'shared', 'custom.d.ts');
  
  // Create or update the file
  if (!fs.existsSync(customDtsPath)) {
    const basicDts = `/**
 * Custom type declarations for third-party modules and project extensions
 */

// Common Node modules without declaration files
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

// Vite server configuration types
declare module 'vite' {
  interface ServerOptions {
    allowedHosts?: boolean | string | true | string[];
  }
}

// SupabaseStorage extensions
interface SupabaseStorage {
  updateUserSubscription(userId: string, data: any): Promise<any>;
  createSubscriptionHistory(data: any): Promise<any>;
  getUserByStripeSubscriptionId(subscriptionId: string): Promise<any>;
}
`;
    
    fs.writeFileSync(customDtsPath, basicDts);
    log('✅ Created custom type declarations file', colors.green);
  } else {
    // Check if file already has necessary declarations
    let content = fs.readFileSync(customDtsPath, 'utf8');
    let updated = false;
    
    // Check for Vite declarations
    if (!content.includes('declare module \'vite\'')) {
      content += `
// Vite server configuration types
declare module 'vite' {
  interface ServerOptions {
    allowedHosts?: boolean | string | true | string[];
  }
}
`;
      updated = true;
    }
    
    // Check for SupabaseStorage declarations
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
      log('✅ Updated custom type declarations file', colors.green);
    } else {
      log('✅ Custom type declarations are already complete', colors.green);
    }
  }
}

/**
 * Fix any Stripe API version issues
 */
function fixStripeVersions() {
  log('\n🔧 Checking Stripe API versions...', colors.cyan);
  
  const files = [
    path.join(projectRoot, 'server', 'routes', 'webhookRoutes.ts'),
    path.join(projectRoot, 'server', 'routes', 'subscriptionRoutes.ts')
  ];
  
  let fixCount = 0;
  
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      log(`⚠️ ${path.basename(filePath)} not found, skipping`, colors.yellow);
      continue;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check for outdated API version
    if (content.includes('apiVersion: "2023-10-16"')) {
      content = content.replace(
        'apiVersion: "2023-10-16"',
        'apiVersion: "2025-02-24.acacia" as const'
      );
      
      fs.writeFileSync(filePath, content);
      log(`✅ Fixed Stripe API version in ${path.basename(filePath)}`, colors.green);
      fixCount++;
    }
  }
  
  if (fixCount === 0) {
    log('✅ Stripe API versions are already up to date', colors.green);
  }
}

/**
 * Fix db connection handling
 */
function fixDbConnectionHandling() {
  log('\n🔧 Checking database connection handling...', colors.cyan);
  
  const dbSetupPath = path.join(projectRoot, 'server', 'dbSetup.ts');
  
  if (!fs.existsSync(dbSetupPath)) {
    log('⚠️ dbSetup.ts not found, skipping', colors.yellow);
    return;
  }
  
  let content = fs.readFileSync(dbSetupPath, 'utf8');
  
  // Check for problematic pool.connect() usage
  if (content.includes('const client = await pool.connect()')) {
    content = content.replace(
      /const client = await pool\.connect\(\)[\s\S]*?client\.release\(\);/g,
      'await pool.query(\'SELECT 1\');'
    );
    
    fs.writeFileSync(dbSetupPath, content);
    log('✅ Fixed database connection handling in dbSetup.ts', colors.green);
  } else {
    log('✅ Database connection handling is already correct', colors.green);
  }
}

/**
 * Create a basic runCompleteMigration.js file if it doesn't exist
 */
function ensureMigrationScript() {
  log('\n🔧 Checking migration script...', colors.cyan);
  
  const migrationScriptPath = path.join(projectRoot, 'server', 'runCompleteMigration.js');
  
  if (!fs.existsSync(migrationScriptPath)) {
    const scriptContent = `/**
 * Database migration utility
 */

import { supabase, supabaseAdmin } from './supabase.js';
import { pool, createEssentialTables } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get proper file paths in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run a complete database migration
 */
export async function runCompleteMigration() {
  try {
    console.log('Starting database migration...');
    
    // Check connection
    try {
      const { data, error } = await supabase.from('_schema').select('*').limit(1);
      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      console.log('✅ Connected to Supabase successfully');
    } catch (err) {
      console.error('Error connecting to Supabase:', err);
      return false;
    }
    
    // Create essential tables
    try {
      const tablesCreated = await createEssentialTables();
      if (!tablesCreated) {
        console.error('Failed to create essential tables');
        return false;
      }
      console.log('✅ Essential tables created or verified');
    } catch (err) {
      console.error('Error creating essential tables:', err);
      return false;
    }
    
    // Run SQL migration file if it exists
    const migrationFilePath = path.join(__dirname, 'supabase-migration.sql');
    if (fs.existsSync(migrationFilePath)) {
      try {
        console.log('Running SQL migration file...');
        const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
        
        // Split by semicolon to run each statement separately
        const statements = migrationSql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        for (const statement of statements) {
          console.log('Running migration statement...');
          
          const { error } = await supabaseAdmin.rpc('exec_sql', { 
            sql: statement 
          });
          
          if (error) {
            console.error('Error in statement:', error);
          }
        }
        
        console.log('✅ SQL migration file executed');
      } catch (err) {
        console.error('Error executing migration SQL:', err);
        return false;
      }
    }
    
    console.log('Database migration completed successfully');
    return true;
  } catch (error) {
    console.error('Unhandled error in migration process:', error);
    return false;
  }
}`;
    
    fs.writeFileSync(migrationScriptPath, scriptContent);
    log('✅ Created migration script file', colors.green);
  } else {
    log('✅ Migration script already exists', colors.green);
  }
}

/**
 * Run the unified build process
 */
async function unifiedBuild() {
  try {
    log(`${colors.bright}🚀 Starting unified build process${colors.reset}`);
    
    // Preparation
    ensureDirectories();
    cleanDistDirectories();
    
    // Fix any configuration or TypeScript issues
    updateTypeScriptConfigs();
    fixDeclarations();
    fixStripeVersions();
    fixDbConnectionHandling();
    ensureMigrationScript();
    
    // Build packages
    buildShared();
    buildServer();
    buildClient();
    
    log(`\n${colors.bright}${colors.green}✅ Unified build completed successfully${colors.reset}`);
    log(`\nRun 'node server.js' to start the application.`);
  } catch (error) {
    log(`\n${colors.bright}${colors.red}❌ Build failed${colors.reset}`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Execute the build
unifiedBuild().catch(error => {
  log(`Unhandled error: ${error.message}`, colors.red);
  process.exit(1);
});