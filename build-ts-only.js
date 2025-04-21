// Simple TypeScript compiler script that ignores errors
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('Starting TypeScript compilation...');

// Build TypeScript files
try {
  execSync('npx tsc -p tsconfig.build.json --skipLibCheck', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      TS_NODE_TRANSPILE_ONLY: 'true',
      NODE_ENV: 'production'
    }
  });
  console.log('TypeScript compilation completed successfully.');
} catch (error) {
  console.warn('TypeScript compilation had errors, but continuing with build...');
  
  // Check if any JS files were generated
  const hasJsFiles = fs.existsSync(path.join(distDir, 'server')) && 
                    fs.readdirSync(path.join(distDir, 'server'))
                      .some(file => file.endsWith('.js'));
  
  if (!hasJsFiles) {
    console.error('No JavaScript files were generated. Using fallback compilation...');
    
    // Copy TypeScript files to dist and use ts-node in production
    const copyServer = () => {
      if (!fs.existsSync(path.join(distDir, 'server'))) {
        fs.mkdirSync(path.join(distDir, 'server'), { recursive: true });
      }
      
      const copyDir = (src, dest) => {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        
        const entries = fs.readdirSync(src, { withFileTypes: true });
        
        for (const entry of entries) {
          const srcPath = path.join(src, entry.name);
          const destPath = path.join(dest, entry.name);
          
          if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };
      
      copyDir(path.join(__dirname, 'server'), path.join(distDir, 'server'));
      copyDir(path.join(__dirname, 'shared'), path.join(distDir, 'shared'));
      
      // Create a simple server entry point that uses ts-node
      const serverEntry = `
// Fallback server entry point that uses ts-node
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
});

// Load actual server
require('./server/index.ts');
      `;
      
      fs.writeFileSync(path.join(distDir, 'server-ts.js'), serverEntry);
      console.log('Created fallback server entry using ts-node.');
    };
    
    copyServer();
  }
}

// Copy necessary files
console.log('Copying additional files...');
const filesToCopy = [
  'server/supabase-migration.sql',
  '.env',
  '.env.production',
  'server.js',
  'Procfile'
];

// Use deployment-specific package.json
if (fs.existsSync('deploy-package.json')) {
  fs.copyFileSync('deploy-package.json', path.join(distDir, 'package.json'));
  console.log('Copied deploy-package.json to dist/package.json');
} else {
  filesToCopy.push('package.json');
}

for (const file of filesToCopy) {
  try {
    if (fs.existsSync(file)) {
      const destPath = path.join(distDir, path.basename(file));
      fs.copyFileSync(file, destPath);
      console.log(`Copied ${file} to ${destPath}`);
    }
  } catch (err) {
    console.warn(`Failed to copy ${file}: ${err.message}`);
  }
}

console.log('Build process completed!');