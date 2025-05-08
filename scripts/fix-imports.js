/**
 * Script to fix path aliases in import statements
 * 
 * This script fixes the most problematic path alias imports (@/*)
 * to use relative paths instead, allowing the build to complete
 * without modifying the Vite configuration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get proper __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const clientSrcDir = path.resolve(rootDir, 'client', 'src');

console.log('🔍 Finding files with path alias imports...');

// Files with known import issues that need to be fixed
const filesToFix = [
  {
    path: path.join(clientSrcDir, 'lib', 'unified-protected-route.tsx'),
    replacements: [
      {
        from: `import { useAuth } from "@/hooks/use-auth";`,
        to: `import { useAuth } from "../hooks/use-auth";`
      }
    ]
  },
  {
    path: path.join(clientSrcDir, 'hooks', 'use-auth.tsx'),
    replacements: [
      {
        from: `import { queryClient } from "@/lib/queryClient";`,
        to: `import { queryClient } from "../lib/queryClient";`
      },
      {
        from: `import { useToast } from "@/hooks/use-toast";`,
        to: `import { useToast } from "./use-toast";`
      },
      {
        from: `import { 
  loginWithEmail, 
  registerWithEmail, 
  logout as logoutUser, 
  getCurrentUser 
} from "@/lib/auth-utils";`,
        to: `import { 
  loginWithEmail, 
  registerWithEmail, 
  logout as logoutUser, 
  getCurrentUser 
} from "../lib/auth-utils";`
      }
    ]
  }
];

// Process each file and make the specified replacements
let totalFixed = 0;

for (const file of filesToFix) {
  console.log(`🔧 Processing ${path.relative(rootDir, file.path)}`);
  
  if (!fs.existsSync(file.path)) {
    console.log(`  ⚠️ File not found, skipping`);
    continue;
  }
  
  let content = fs.readFileSync(file.path, 'utf8');
  let fixCount = 0;
  
  for (const replacement of file.replacements) {
    if (content.includes(replacement.from)) {
      content = content.replace(replacement.from, replacement.to);
      fixCount++;
      totalFixed++;
    }
  }
  
  if (fixCount > 0) {
    fs.writeFileSync(file.path, content);
    console.log(`  ✅ Fixed ${fixCount} import${fixCount !== 1 ? 's' : ''}`);
  } else {
    console.log(`  ✓ No issues found, already fixed`);
  }
}

console.log(`\n✅ Fixed ${totalFixed} import${totalFixed !== 1 ? 's' : ''} in ${filesToFix.length} file${filesToFix.length !== 1 ? 's' : ''}`);