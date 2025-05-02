/**
 * This is a placeholder file to satisfy TypeScript imports during build.
 * The actual implementation is in server/archive/deploy-profile-type-function.ts
 * 
 * NOTE: This file is excluded from the production build in tsconfig.build.json
 * and is only here to prevent build errors.
 */

// Create a dummy function that won't be used in production
export async function deployProfileTypeFunction(): Promise<void> {
  console.log('[Auth] Profile type function deployment skipped in production build');
  return Promise.resolve();
}