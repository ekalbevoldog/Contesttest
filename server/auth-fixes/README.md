# Authentication Fixes for Contested

This directory contains a set of files designed to solve authentication and profile management issues with Supabase, specifically focusing on ensuring business users always have a profile.

## Components

1. **SQL Function** (`get_profile_type_function.sql`)
   - Creates a PostgreSQL function that reliably determines a user's profile type
   - Takes into account both user roles and profile existence
   - Returns 'business', 'athlete', 'compliance', 'admin', or null

2. **Profile Creation Endpoint** (`create-profile-endpoint.ts`)
   - Express endpoint that creates a business profile for a user
   - Handles authentication and error checking
   - Prevents duplicate profiles

3. **Profile Type Hook** (in `client/src/hooks/use-profile-type.tsx`)
   - Provides client-side access to profile type
   - Uses multiple fallback mechanisms for reliability
   - Handles autoprovisioning of business profiles when needed

4. **Deployment Script** (`deploy-profile-type-function.ts`)
   - Deploys the SQL function to Supabase
   - Can be run manually or as part of server startup

5. **Setup Script** (`setup.ts`)
   - One-step configuration for all the auth fixes
   - Seamlessly integrates with the Express app

## Integration Steps

To integrate these fixes with the application:

1. Import the setup file in your Express routes:

```typescript
// In routes.ts
import { setupAuthFixes } from './auth-fixes/setup';

export async function registerRoutes(app: Express): Promise<Server> {
  // Other setup
  
  // Add this line early in the function, before defining routes
  await setupAuthFixes(app);
  
  // Rest of your routes
}
```

2. Deploy the SQL function to Supabase:

The function will be automatically deployed during server startup, but you can also deploy it manually:

```bash
# From the project root
npx ts-node server/auth-fixes/deploy-profile-type-function.ts
```

## Testing

To verify the fixes are working:

1. Log in as a business user
2. Check server logs for confirmation of profile creation
3. Use the `/api/profile` endpoint to see your user profile

## Troubleshooting

If you encounter issues:

1. Check the server logs for errors
2. Ensure Supabase connection is working properly
3. Verify that the SQL function was deployed correctly
4. Check browser console for client-side authentication errors