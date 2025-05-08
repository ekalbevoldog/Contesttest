/**
 * TypeScript Import Helper
 * 
 * This utility provides a consistent way to import TypeScript modules
 * across different execution environments.
 */

/**
 * Import a TypeScript module dynamically
 * @param {string} modulePath - Path to the TypeScript module
 * @returns {Promise<any>} - The imported module
 */
export async function importTsModule(modulePath) {
  try {
    // Try to use tsx for direct TypeScript execution
    const { createRequire } = await import('module');
    const { resolve } = await import('path');
    const require = createRequire(import.meta.url);
    
    // Convert relative path to absolute path
    const absPath = resolve(process.cwd(), modulePath);
    
    // Use Node.js ESM loader to load the TypeScript file
    // This approach ensures that the module is properly loaded with all TypeScript features
    const { register } = await import('tsx/cjs');
    register();
    
    // Now require the module after registering tsx
    return require(absPath);
  } catch (error) {
    console.error(`Failed to import TypeScript module ${modulePath}:`, error);
    throw error;
  }
}