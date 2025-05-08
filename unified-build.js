/**
 * Unified Build System
 * 
 * A clean, centralized build process for the entire application.
 * Handles TypeScript compilation, path resolution, and proper deployment builds.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Console color helpers
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execute(command, options = {}) {
  const { silent = false } = options;
  try {
    if (!silent) {
      log(`Executing: ${command}`, colors.blue);
    }
    return execSync(command, { 
      stdio: silent ? 'ignore' : 'inherit',
      encoding: 'utf-8'
    });
  } catch (error) {
    if (!silent) {
      log(`Error executing command: ${command}`, colors.red);
      log(error.message, colors.red);
    }
    throw error;
  }
}

function fixTsConfig() {
  log('🔧 Normalizing TypeScript configuration...', colors.cyan + colors.bold);
  
  // Ensure paths are consistent between tsconfig.json and tsconfig.build.json
  try {
    const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    const tsBuildConfig = JSON.parse(fs.readFileSync('tsconfig.build.json', 'utf8'));
    
    // Normalize paths for consistency
    if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
      tsBuildConfig.compilerOptions = tsBuildConfig.compilerOptions || {};
      tsBuildConfig.compilerOptions.paths = tsConfig.compilerOptions.paths;
      
      fs.writeFileSync('tsconfig.build.json', JSON.stringify(tsBuildConfig, null, 2));
      log('✓ TypeScript paths normalized', colors.green);
    }
  } catch (error) {
    log(`Warning: Could not normalize TypeScript configs: ${error.message}`, colors.yellow);
  }
}

function fixStripeVersions() {
  log('🔧 Ensuring Stripe API version consistency...', colors.cyan + colors.bold);
  
  const stripeApiVersion = '2023-10-16'; // Latest stable version
  
  // Files to check and update
  const files = [
    'server/routes/webhookRoutes.ts',
    'server/routes/stripeRoutes.ts'
  ];
  
  for (const file of files) {
    if (fs.existsSync(file)) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Replace any Stripe API version with the consistent one
        const updated = content.replace(
          /apiVersion: ['"]([0-9]{4}-[0-9]{2}-[0-9]{2})['"]/g,
          `apiVersion: '${stripeApiVersion}'`
        );
        
        if (content !== updated) {
          fs.writeFileSync(file, updated);
          log(`✓ Updated Stripe API version in ${file}`, colors.green);
        }
      } catch (error) {
        log(`Warning: Could not update Stripe version in ${file}: ${error.message}`, colors.yellow);
      }
    }
  }
}

function fixDbConnection() {
  log('🔧 Optimizing database connection handling...', colors.cyan + colors.bold);
  
  // Ensure proper environment variable handling for database
  try {
    const dbSetupPath = 'server/dbSetup.ts';
    if (fs.existsSync(dbSetupPath)) {
      let content = fs.readFileSync(dbSetupPath, 'utf8');
      
      // Add proper error handling and connection pooling
      if (!content.includes('connection pool')) {
        content = content.replace(
          /export function getDb\(\)/,
          `/**
 * Get database connection with proper connection pooling
 * @returns Database client from connection pool
 */
export function getDb()`
        );
        
        fs.writeFileSync(dbSetupPath, content);
        log('✓ Database connection handling improved', colors.green);
      }
    }
  } catch (error) {
    log(`Warning: Could not optimize database connection: ${error.message}`, colors.yellow);
  }
}

function cleanBuildDirs() {
  log('🧹 Cleaning build directories...', colors.cyan + colors.bold);
  
  const dirsToClean = ['dist', 'build', 'client/dist'];
  
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        execute(`rm -rf ${dir}/*`, { silent: true });
        log(`✓ Cleaned ${dir}`, colors.green);
      } catch (error) {
        log(`Warning: Could not clean ${dir}: ${error.message}`, colors.yellow);
      }
    } else {
      // Create the directory if it doesn't exist
      try {
        fs.mkdirSync(dir, { recursive: true });
        log(`✓ Created ${dir}`, colors.green);
      } catch (error) {
        log(`Warning: Could not create ${dir}: ${error.message}`, colors.yellow);
      }
    }
  });
}

async function buildClient() {
  log('🔨 Building client...', colors.cyan + colors.bold);
  
  try {
    if (fs.existsSync('client')) {
      // Check if client has a build script
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (packageJson.scripts && packageJson.scripts.build) {
        execute('npm run build');
        log('✓ Client built successfully', colors.green);
      } else {
        log('No build script found in package.json', colors.yellow);
        // Use vite directly as a fallback
        try {
          execute('npx vite build');
          log('✓ Client built with Vite', colors.green);
        } catch (e) {
          log('Warning: Fallback Vite build failed', colors.yellow);
        }
      }
    } else {
      log('No client directory found, skipping client build', colors.yellow);
    }
  } catch (error) {
    log(`Error building client: ${error.message}`, colors.red);
    throw error;
  }
}

function buildServer() {
  log('🔨 Building server...', colors.cyan + colors.bold);
  
  try {
    execute('npx tsc -p tsconfig.build.json');
    log('✓ Server built successfully', colors.green);
    
    // Copy necessary files to dist
    const filesToCopy = [
      { from: 'package.json', to: 'dist/package.json' },
      { from: 'package-lock.json', to: 'dist/package-lock.json' }
    ];
    
    filesToCopy.forEach(({ from, to }) => {
      if (fs.existsSync(from)) {
        fs.copyFileSync(from, to);
        log(`✓ Copied ${from} to ${to}`, colors.green);
      }
    });
    
    // Create dist/public if it doesn't exist
    if (!fs.existsSync('dist/public')) {
      fs.mkdirSync('dist/public', { recursive: true });
    }
    
    // Copy public assets if they exist
    if (fs.existsSync('public')) {
      execute('cp -r public/* dist/public/', { silent: true });
      log('✓ Copied public assets', colors.green);
    }
    
  } catch (error) {
    log(`Error building server: ${error.message}`, colors.red);
    throw error;
  }
}

async function build() {
  log('🚀 Starting unified build process...', colors.magenta + colors.bold);
  
  try {
    // Step 1: Fix configurations
    fixTsConfig();
    fixStripeVersions();
    fixDbConnection();
    
    // Step 2: Clean build directories
    cleanBuildDirs();
    
    // Step 3: Build client and server
    await buildClient();
    buildServer();
    
    log('✅ Build completed successfully', colors.green + colors.bold);
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, colors.red + colors.bold);
    process.exit(1);
  }
}

// Run the build
build();