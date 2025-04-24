
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('Starting TypeScript compilation...');

try {
  execSync('npx tsc -p tsconfig.build.json --skipLibCheck --noEmitOnError false', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  console.log('TypeScript compilation completed successfully.');
} catch (error) {
  console.warn('TypeScript compilation had errors, continuing with build...');
}

// Copy SQL migration file
try {
  const migrationSrc = path.join(__dirname, 'server', 'supabase-migration.sql');
  const migrationDest = path.join(distDir, 'supabase-migration.sql');
  fs.copyFileSync(migrationSrc, migrationDest);
  console.log('SQL migration file copied successfully.');
} catch (err) {
  console.warn('Failed to copy migration file:', err);
}

// Copy necessary files
console.log('Copying additional files...');
const filesToCopy = [
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
