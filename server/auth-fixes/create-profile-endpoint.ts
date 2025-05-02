/**
 * This is a placeholder file to satisfy TypeScript imports during build.
 * The actual implementation is in server/archive/create-profile-endpoint.ts
 * 
 * NOTE: This file is excluded from the production build in tsconfig.build.json
 * and is only here to prevent build errors.
 */

import express from 'express';

// Create a dummy router that won't be used in production
export const createProfileEndpoint = express.Router();