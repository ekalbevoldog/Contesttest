
// TypeScript Error Fix Script
// This script fixes common TypeScript errors in the codebase

import fs from 'fs';
import path from 'path';

// Fix getUserByUsername error in auth.ts
function fixAuthFile() {
  const authFilePath = path.join(process.cwd(), 'server/auth.ts');
  
  if (!fs.existsSync(authFilePath)) {
    console.error('Auth file not found at:', authFilePath);
    return false;
  }
  
  let authContent = fs.readFileSync(authFilePath, 'utf8');
  
  // Fix the getUserByUsername method
  if (authContent.includes('storage.getUserByUsername')) {
    console.log('Fixing getUserByUsername method in auth.ts');
    authContent = authContent.replace(
      /storage\.getUserByUsername/g, 
      'storage.getUserByEmail' // Replace with the correct method that exists
    );
    
    fs.writeFileSync(authFilePath, authContent);
    console.log('Fixed getUserByUsername in auth.ts');
    return true;
  } else {
    console.log('Did not find getUserByUsername reference in auth.ts');
    return false;
  }
}

// Fix the type definitions in routes.ts
function fixRoutesFile() {
  const routesFilePath = path.join(process.cwd(), 'server/routes.ts');
  
  if (!fs.existsSync(routesFilePath)) {
    console.error('Routes file not found at:', routesFilePath);
    return false;
  }
  
  let routesContent = fs.readFileSync(routesFilePath, 'utf8');
  
  // Fix the preferences field error
  if (routesContent.includes('preferences') && routesContent.includes('TS2353')) {
    console.log('Fixing preferences field type definition in routes.ts');
    
    // Add preferences to the type definition
    routesContent = routesContent.replace(
      /type '{ email\?: string; values\?: string; sessionId\?: string; name\?: string; productType\?: string; audienceGoals\?: string; campaignVibe\?: string; targetSchoolsSports\?: string; }'/g,
      "type '{ email?: string; values?: string; sessionId?: string; name?: string; productType?: string; audienceGoals?: string; campaignVibe?: string; targetSchoolsSports?: string; preferences?: any; }'"
    );
    
    // Fix personalValues field errors
    routesContent = routesContent.replace(
      /profile\.personalValues/g,
      'profile.preferences?.personalValues || []'
    );
    
    // Fix contentTypes field error
    routesContent = routesContent.replace(
      /profile\.contentTypes/g,
      'profile.contentStyle'  // Replace with the correct field that exists
    );
    
    fs.writeFileSync(routesFilePath, routesContent);
    console.log('Fixed type definitions in routes.ts');
    return true;
  } else {
    console.log('Did not find type issues in routes.ts or they have different patterns than expected');
    return false;
  }
}

// Update the schema.ts file to include missing fields
function updateSchemaFile() {
  const schemaFilePath = path.join(process.cwd(), 'shared/schema.ts');
  
  if (!fs.existsSync(schemaFilePath)) {
    console.error('Schema file not found at:', schemaFilePath);
    return false;
  }
  
  let schemaContent = fs.readFileSync(schemaFilePath, 'utf8');
  
  // Add missing fields to athleteSchema
  if (schemaContent.includes('athleteSchema') && !schemaContent.includes('personalValues')) {
    console.log('Adding missing fields to athleteSchema in schema.ts');
    
    // Look for the athleteSchema definition and add missing fields
    const athleteSchemaPattern = /export const athleteSchema = z\.object\(\{([^}]*)\}\);/s;
    const athleteSchemaMatch = schemaContent.match(athleteSchemaPattern);
    
    if (athleteSchemaMatch) {
      const existingFields = athleteSchemaMatch[1];
      const updatedFields = existingFields + `
  contentTypes: z.array(z.string()).optional(),
  personalValues: z.array(z.string()).optional(),
  preferences: z.record(z.any()).optional(),`;
      
      schemaContent = schemaContent.replace(
        athleteSchemaPattern,
        `export const athleteSchema = z.object({${updatedFields}});`
      );
      
      fs.writeFileSync(schemaFilePath, schemaContent);
      console.log('Added missing fields to athleteSchema in schema.ts');
      return true;
    } else {
      console.log('Could not find athleteSchema definition pattern in schema.ts');
      return false;
    }
  } else {
    console.log('Either athleteSchema not found or personalValues field already exists');
    return false;
  }
}

// Main function to run all fixes
async function main() {
  console.log('Starting TypeScript error fixes...');
  
  let authFixed = fixAuthFile();
  let routesFixed = fixRoutesFile();
  let schemaUpdated = updateSchemaFile();
  
  console.log('\nSummary of fixes:');
  console.log('- Auth file fixed:', authFixed ? 'Yes' : 'No');
  console.log('- Routes file fixed:', routesFixed ? 'Yes' : 'No');
  console.log('- Schema file updated:', schemaUpdated ? 'Yes' : 'No');
  
  console.log('\nTo apply these fixes to the build, run:');
  console.log('npm run build:fallback');
  
  if (!authFixed && !routesFixed && !schemaUpdated) {
    console.log('\nNo fixes were applied. The issues might have been already fixed or are different than expected.');
  }
}

main().catch(error => {
  console.error('Error fixing TypeScript errors:', error);
  process.exit(1);
});
