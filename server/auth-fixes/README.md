# Supabase Authentication System Fix Scripts

This directory contains scripts for diagnosing and fixing Supabase authentication integration issues, particularly around the linkage between Supabase Auth users and the application's database users.

## Overview

The main issue being addressed is the failure in the user registration flow due to missing or incorrect mappings between Supabase Auth users and our application's `users` table.

## Scripts

### 1. fix-supabase-auth.js

A comprehensive script that runs all necessary fixes in the correct order:

```bash
node scripts/fix-supabase-auth.js [--dry-run] [--force] [--verbose]
```

### 2. enhanced-users-schema.ts

Verifies and fixes the database schema to ensure it has all necessary columns, constraints, and triggers:

```bash
npx tsx server/enhanced-users-schema.ts
```

### 3. auth-diagnostic.ts

Diagnoses authentication issues and provides recommendations:

```bash
npx tsx server/auth-diagnostic.ts [--fix]
```

### 4. fix-auth-mapping.ts

Fixes mismatches between Auth users and database users:

```bash
npx tsx server/fix-auth-mapping.ts --user-id=<id> [--auth-id=<id>] [--email=<email>] [--dry-run]
npx tsx server/fix-auth-mapping.ts --fix-all [--dry-run]
```

### 5. fixed-auth-routes.ts

An enhanced version of `supabaseAuth.ts` with improved error handling and diagnostic logging.

## Detailed Documentation

For a comprehensive guide on fixing and maintaining the authentication system, refer to:

```
docs/supabase-auth-fix-guide.md
```

## Flow Diagram

```
User Registration
    |
    v
Supabase Auth creates auth user
    |
    v
Database trigger creates user record
    |
    v
Error/Failure?
    |     |
    |     v
    |  Fallback: Manual record creation
    v
Return response to client
```

## Common Issues Addressed

1. Missing `auth_id` column or foreign key constraint
2. Auth users without corresponding database records
3. Database users not linked to their auth counterparts
4. Missing or broken database triggers
5. Poor error handling in registration flow

## Contact

For questions or issues, please contact the development team.