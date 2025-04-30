# Profile Type Detection and Auto-Creation Solution

## Problem Summary

The Contested platform was experiencing an issue where business users couldn't access their dashboard due to missing profile records. This happens because:

1. The authentication system assigns users a role (business, athlete, etc.)
2. But users with a "business" role may not always have a corresponding record in the business_profiles table
3. The client-side code relies on proper profile type detection to redirect users to the appropriate dashboard

## Solution Components

Our solution takes a comprehensive approach with multiple layers of reliability:

### 1. SQL Function for Profile Type Detection

We've created a PostgreSQL function (`get_user_profile_type`) that runs on Supabase and reliably determines a user's profile type by:

- Checking the user's role in the users table
- Verifying the existence of the corresponding profile record
- Returning the validated profile type or null if invalid

This provides a single source of truth accessible from both client and server.

### 2. Client-Side Hook with Fallbacks

The `useProfileType` hook in the React application has been enhanced to:

- Try the SQL function first for reliable type detection
- Fall back to checking user metadata if the function is unavailable
- Verify profile existence for role-based profile types
- Automatically trigger profile creation when a business user is missing a profile

### 3. Express Endpoint for Profile Creation

A secure endpoint (`/api/create-business-profile`) that:

- Requires authentication
- Creates a minimal business profile for a user if one doesn't exist
- Prevents duplicate profiles
- Can be called from the client when needed

### 4. Deployment Tools

Scripts to easily deploy the SQL function:

- `install-sql-function.js` - standalone Node.js script for manual deployment
- `deploy-profile-type-function.ts` - TypeScript module for integration with the server

### 5. Integration Helpers

The `setup.ts` file provides an easy way to integrate all these components with a single function call in the main routes file.

## Implementation

The components have been designed to work together seamlessly:

1. When a user logs in, the `useProfileType` hook is called
2. The hook attempts to determine the profile type using the SQL function
3. If that fails, it falls back to checking the user's role and profile existence
4. For business users without a profile, it triggers automatic profile creation
5. Once the profile type is determined, the user is correctly redirected to their dashboard

## Benefits

This solution provides several key benefits:

1. **Reliability**: Multiple layers of fallbacks ensure users can always access their dashboard
2. **Performance**: The SQL function is fast and runs close to the data
3. **Maintainability**: Centralized profile type logic in a SQL function
4. **Security**: All operations require proper authentication
5. **User Experience**: No "Profile not found" errors for business users

## Usage

The solution can be integrated following the instructions in the README.md file in the server/auth-fixes directory.