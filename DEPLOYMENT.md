# Deployment Guide - No Fallback Approach

This document outlines the deployment process for the application using the strict no-fallback approach.

## Prerequisites

- Node.js 18+ installed
- Access to Supabase database (via DATABASE_URL environment variable)

## Building for Production

The application must be built using the strict build process that enforces proper TypeScript compliance with no fallbacks.

```bash
node unified-build-strict.js
```

This strict build:
- Enforces proper TypeScript typing
- Removes all fallback mechanisms
- Ensures consistent role detection
- Provides standardized authentication flows

## Key Files

- `unified-build-strict.js` - Builds the application with strict TypeScript checks
- `strict-deploy.js` - Deploys the application with no fallbacks
- `server.js` - Universal server launcher with robust error handling
- `server/middleware/auth.ts` - Strict JWT-only authentication
- `server/services/unifiedAuthService.ts` - Unified authentication service

## Authentication System

The authentication system uses a unified approach:

1. JWT-only authentication
2. Token provided exclusively via Authorization header
3. Standardized role detection using consistent fields
4. No fallback mechanisms (sessions, cookies, email lookups)

## Deployment Process

1. Run the strict build:
   ```bash
   node unified-build-strict.js
   ```

2. Verify the build:
   ```bash
   node check-deploy.js
   ```

3. Deploy the application:
   ```bash
   NODE_ENV=production node strict-deploy.js
   ```

4. Start the server in production mode:
   ```bash
   cd dist && NODE_ENV=production node index.js
   ```

## Environment Variables

Required environment variables:
- `DATABASE_URL` - Supabase database connection URL
- `NODE_ENV` - Set to 'production' for production deployment

## Verification Scripts

The following scripts can be used to verify the deployment:

- `test-server-build.sh` - Verifies server TypeScript builds correctly
- `verify-no-fallback.sh` - Checks for any fallback mechanisms
- `check-deploy.js` - Verifies the production build is ready for deployment

## System Architecture

The application uses a clean architecture with no fallbacks:

- Frontend: React with TypeScript
- Backend: Express.js with strict TypeScript
- Database: Supabase with direct access via SDK
- Authentication: JWT-only with standardized role detection
- WebSockets: Authenticated via JWT token only

## Troubleshooting

If the server fails to start:
1. Verify DATABASE_URL is properly set
2. Ensure the build completed successfully with `unified-build-strict.js`
3. Check the server logs for any TypeScript errors
4. Verify the JWT authentication system is properly configured