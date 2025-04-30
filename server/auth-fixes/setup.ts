import express, { Express } from 'express';
import { createProfileEndpoint } from './create-profile-endpoint';
import { deployProfileTypeFunction } from './deploy-profile-type-function';

/**
 * Sets up all the authentication fixes needed for Contested
 * 
 * Usage in routes.ts:
 * ```
 * import { setupAuthFixes } from './auth-fixes/setup';
 * // ...
 * setupAuthFixes(app);
 * ```
 */
export async function setupAuthFixes(app: Express): Promise<void> {
  console.log('Setting up authentication fixes...');
  
  // Add the create-profile endpoint
  app.use('/api', createProfileEndpoint);
  
  // Deploy the profile type function to Supabase
  // We make this non-blocking so it doesn't hold up server startup
  deployProfileTypeFunction()
    .then(() => console.log('Profile type function deployed'))
    .catch(err => console.error('Error deploying profile type function:', err));
    
  console.log('Authentication fixes setup complete');
}