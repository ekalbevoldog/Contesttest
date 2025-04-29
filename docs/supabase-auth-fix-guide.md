# Supabase Authentication System Fix Guide

## Overview

This document provides a comprehensive guide to fixing and maintaining the Supabase authentication system integration. It addresses common issues related to user registration, authentication flow, and database integration.

## Background

The application uses Supabase for authentication and database operations. A critical aspect of this integration is the relationship between Supabase Auth users and our application's `users` table. When this relationship breaks, users may experience authentication issues, particularly during registration with the error "Database error updating user".

## Key Components

1. **Supabase Auth**: Handles user authentication (signup, login, sessions)
2. **Database Users Table**: Stores application-specific user data
3. **Auth Triggers**: Database triggers that automatically create `users` records when Auth users are created
4. **Foreign Key Constraint**: Ensures data integrity between Auth users and application users

## Common Issues

1. **Missing auth_id**: Database users without a corresponding `auth_id` can't be linked to their authentication data
2. **Schema Issues**: Missing columns, constraints, or triggers in the database
3. **Orphaned Auth Users**: Auth users without corresponding database records
4. **Registration Flow Errors**: Failures during the user registration process

## The Fix Script

We've created a comprehensive fix script that addresses these issues:

```bash
node scripts/fix-supabase-auth.js
```

This script runs several diagnostic and repair modules:

1. **Schema Verification**: Ensures the database schema is correctly configured
2. **Auth Diagnostics**: Identifies authentication issues
3. **Auth ID Mapping**: Fixes mismatches between Auth users and database users
4. **Route Updates**: Installs enhanced authentication routes with better error handling
5. **Final Verification**: Confirms all issues have been resolved

## Running the Fix

### Prerequisites

- Node.js 16+ installed
- Project dependencies installed (`npm install`)
- Supabase credentials configured in environment

### Running the Script

From the project root directory:

```bash
# Dry run (shows what would be fixed without making changes)
node scripts/fix-supabase-auth.js --dry-run

# Live run (applies all fixes)
node scripts/fix-supabase-auth.js

# Force run (applies all fixes without confirmation prompts)
node scripts/fix-supabase-auth.js --force

# Verbose output
node scripts/fix-supabase-auth.js --verbose
```

## Manual Fixes

If you need to run individual fixes manually, use these commands:

### Schema Verification and Repair

```bash
npx tsx server/enhanced-users-schema.ts
```

This script:
- Ensures the `users` table exists with correct structure
- Adds or updates necessary columns, including `auth_id`
- Creates required indexes and constraints
- Sets up database triggers for automatic user creation
- Maps existing users to their Auth counterparts

### Authentication Diagnostics

```bash
npx tsx server/auth-diagnostic.ts
```

This script:
- Identifies issues in the authentication system
- Reports unmapped users and other problems
- Provides recommendations for fixes

### Fix Auth ID Mappings

```bash
# Fix all unmapped users
npx tsx server/fix-auth-mapping.ts --fix-all

# Fix a specific user
npx tsx server/fix-auth-mapping.ts --user-id=<id>

# Specify an auth ID to use
npx tsx server/fix-auth-mapping.ts --user-id=<id> --auth-id=<auth_id>
```

## Prevention Measures

To prevent these issues in the future:

1. **Schema Migrations**: Always ensure schema changes maintain the `auth_id` foreign key
2. **Error Handling**: The enhanced `supabaseAuth.ts` file includes robust error handling
3. **Regular Diagnostics**: Run the diagnostic script periodically to catch issues early
4. **Triggering**: The database trigger ensures new Auth users are automatically added to the `users` table
5. **Logging**: Additional logging has been added to identify authentication issues more easily

## Architecture Overview

The authentication system works as follows:

1. **User Registration**:
   - User signs up via the frontend
   - Supabase Auth creates an auth user
   - Database trigger automatically creates a corresponding users record
   - If the trigger fails, the registration process falls back to manual creation

2. **User Login**:
   - User logs in via the frontend
   - Supabase Auth validates credentials
   - Application looks up the user by auth_id or email
   - Session is established with proper cookies

## Troubleshooting

If you encounter issues, check these common problems:

### Registration Fails with "Database error updating user"

This indicates a problem with the database integration. Run the diagnostic:

```bash
npx tsx server/auth-diagnostic.ts
```

### Users Can't Log In After Registration

This might be due to missing database records. Check for orphaned Auth users:

```bash
npx tsx server/auth-diagnostic.ts
```

If found, fix with:

```bash
npx tsx server/fix-auth-mapping.ts --fix-all
```

### Database Error "Foreign Key Constraint Failed"

This indicates an issue with the auth_id constraint. Verify the schema:

```bash
npx tsx server/enhanced-users-schema.ts
```

## Database Schema Reference

The `users` table should have these key columns:

```sql
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  -- Additional columns...
);
```

The database trigger should create users records automatically:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a user with this email already exists
  DECLARE existing_user_id INTEGER;
  BEGIN
    SELECT id INTO existing_user_id FROM public.users 
    WHERE email = NEW.email;
    
    IF existing_user_id IS NOT NULL THEN
      -- Update existing user with auth_id
      UPDATE public.users
      SET auth_id = NEW.id
      WHERE id = existing_user_id AND (auth_id IS NULL OR auth_id != NEW.id);
    ELSE
      -- Insert new user
      INSERT INTO public.users (
        auth_id, 
        email, 
        username, 
        role, 
        created_at
      )
      VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'preferred_username', SPLIT_PART(NEW.email, '@', 1)), 
        COALESCE(NEW.raw_user_meta_data->>'role', 'athlete'),
        NOW()
      )
      ON CONFLICT (auth_id) DO NOTHING
      ON CONFLICT (email) DO UPDATE
      SET auth_id = NEW.id;
    END IF;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
```

## Conclusion

By following this guide and using the provided scripts, you should be able to fix and maintain the Supabase authentication system integration. If you encounter persistent issues, please contact the development team.

---

*Documentation last updated: April 29, 2024*