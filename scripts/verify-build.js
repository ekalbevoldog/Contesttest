
// Script to verify that build directories and files exist
import fs from 'fs';
import path from 'path';

function checkPath(filePath, description) {
  try {
    const exists = fs.existsSync(filePath);
    const stats = exists ? fs.statSync(filePath) : null;
    const isDirectory = stats ? stats.isDirectory() : false;
    
    console.log(`✓ ${description}: ${exists ? 'EXISTS' : 'MISSING'} ${isDirectory ? '(directory)' : '(file)'}`);
    
    if (!exists) {
      console.log(`  Path not found: ${filePath}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`✗ Error checking ${description}:`, error.message);
    return false;
  }
}

// Check important paths for deployment
console.log('---------- BUILD VERIFICATION ----------');
const baseDir = process.cwd();

// Check dist directory
const distDir = path.join(baseDir, 'dist');
checkPath(distDir, 'Dist directory');

// Check public directory
const publicDir = path.join(distDir, 'public');
const publicExists = checkPath(publicDir, 'Public directory');

// Check for index.html
if (publicExists) {
  const indexPath = path.join(publicDir, 'index.html');
  checkPath(indexPath, 'Index.html');
  
  // List files in public directory
  console.log('\nFiles in public directory:');
  try {
    const files = fs.readdirSync(publicDir);
    files.forEach(file => console.log(`  - ${file}`));
  } catch (err) {
    console.error('Error listing files:', err.message);
  }
}

console.log('\n---------- SERVER FILE CHECK ----------');
// Check server.js exists
checkPath(path.join(baseDir, 'server.js'), 'Server.js');

console.log('\n---------- BUILD VERIFICATION COMPLETE ----------');
