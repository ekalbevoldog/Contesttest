# Authentication and Profile System Migration Guide

This document outlines the changes made to fix enum and metadata errors in the signup and onboarding flow.

## Changes Made

1. **AuthService.register Method Refactored**
   - Separated user signup and metadata updates into discrete steps
   - Removed metadata from initial signUp call
   - Added explicit casting for user roles

2. **RLS Trigger Fixed**
   - Created a new trigger handler that properly casts TEXT role values to user_role enum
   - Improved error handling in role update functions

3. **Profile Endpoints Consolidated**
   - Added a unified `/api/supabase/profile` endpoint in profileService
   - Ensured proper session_id/UUID migration support
   - Removed dependency on any external supabaseprofile.ts file

4. **Client-Side Updates**
   - Updated auth-utils.ts to avoid sending metadata during initial registration

## Implementation Details

### Refactored Registration Process

The registration process now follows these steps:

1. Create the auth user with ONLY email & password (no metadata)
2. Update user_metadata via admin API in a separate call
3. Update the role in the users table with explicit casting
4. Create placeholder profiles as needed

### Role Enum Handling

The system now uses several approaches to handle role enum casting:

1. First tries the `update_user_role_safely` function
2. Falls back to direct SQL with explicit casting: `SET role = 'business'::user_role`
3. Includes a new trigger that safely handles role updates from auth.users to public.users

### Migration Endpoints

Added/updated the following migration endpoints:

- `/api/supabase/athlete-profile/migrate` - Migrates athlete profiles from session ID to UUID
- `/api/supabase/business-profile/migrate` - Migrates business profiles from session ID to UUID

## Applying the Fixes

To apply these fixes to your Supabase database:

1. Run the SQL migration in `server/database/fix-role-enum-triggers.sql`:

```sql
-- Execute this in the Supabase SQL Editor
\i server/database/fix-role-enum-triggers.sql
```

2. Restart your application server to ensure all changes take effect

3. If you encounter any issues with existing profiles, you can use the migration endpoints to reassociate them with the correct user IDs:

```json
POST /api/supabase/athlete-profile/migrate
{
  "sessionId": "old-session-id",
  "newId": "user-uuid"
}
```

## Troubleshooting

If you continue to experience issues:

1. Check Supabase logs for any SQL errors
2. Verify that the user_role enum type exists in your database
3. Ensure the RLS policies are correctly configured
4. Try explicit casting in your queries: `role = 'business'::user_role`