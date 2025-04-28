
// Fix schema.ts before build
import fs from 'fs';
import path from 'path';

const schemaFilePath = path.join(process.cwd(), 'shared/schema.ts');
let schemaContent = fs.readFileSync(schemaFilePath, 'utf8');

// Fix the athleteSchema definition
const fixedContent = schemaContent.replace(
  /updatedAt: z\.date\(\)\.optional\(\)\s*\n\s*contentTypes/,
  'updatedAt: z.date().optional(),\n  contentTypes'
);

fs.writeFileSync(schemaFilePath, fixedContent);
console.log('✅ Fixed schema.ts structure');
