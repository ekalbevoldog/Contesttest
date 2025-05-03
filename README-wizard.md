# Pro Campaign Wizard Implementation

This document outlines the key changes made to implement the Pro Campaign Wizard feature with proper authentication guards.

## Key Changes

1. **Authentication Flow**
   - Enhanced the `AuthGuard` component to properly detect business users
   - Improved the `UnifiedProtectedRoute` component for better role-based routing
   - Added additional business role validation (checking multiple data sources)

2. **Wizard State Management**
   - Implemented a `ProWizardProvider` context using Zustand
   - State persists in localStorage for better user experience
   - Automatic campaign creation on wizard start

3. **Routing Changes**
   - Modified App.tsx routing to use direct component imports
   - Restructured wizard routes to properly utilize layout component
   - Created a test route at `/wizard/pro/test` for troubleshooting  

4. **Step Implementation**
   - Start page: basic campaign info & channels
   - Advanced page: targets, budget & timeline
   - Deliverables page: content creation requirements
   - Match page: athlete selection interface
   - Bundle page: offers and compensation setup
   - Review page: final campaign overview

## Running and Testing the Application

To test the Pro Campaign Wizard feature:

1. **Start the application** (use one of these methods)
   ```bash
   # Option 1: Using the test script (recommended)
   ./test-wizard.sh
   
   # Option 2: Direct command
   npm run dev
   ```

2. **Access entry points (in order of reliability)**:
   - `/wizard-entry` - Direct entry point with automatic redirect
   - `/wizard/pro/test` - Test page without auth guard 
   - `/wizard/pro/start` - Initial wizard step (requires business role)

3. **Check business role detection**:
   - Open browser console (F12)
   - Look for "AuthGuard Check:" and "business role check:" entries
   - Verify your user account has the business role detected

4. **Verify wizard state management**:
   - Open Application tab in browser DevTools
   - Check Local Storage for "pro-campaign-wizard" entry
   - Ensure state is being properly saved between steps

## Assigning Business Role To Your Account

If your account isn't recognized as a business account, run this SQL in Supabase:

```sql
-- Option 1: Update user metadata (preferred)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "business"}'
WHERE email = 'your.email@example.com';

-- Option 2: Update user_type field directly (if available)
UPDATE users
SET user_type = 'business'
WHERE email = 'your.email@example.com';
```

## Troubleshooting Common Issues

If encountering issues with the Pro Campaign Wizard:

1. **Routing problems**
   - Clear browser cache or try incognito window
   - Visit `/wizard/pro/test` first to verify basic routing
   - Check console for routing/navigation errors

2. **Authentication issues**
   - Verify user role in console logs (should show "business")
   - Try updating user role in database using SQL above
   - Check for "Unauthorized" messages in console

3. **State persistence problems**
   - Clear localStorage if wizard gets stuck in a particular state:
     ```javascript
     localStorage.removeItem('pro-campaign-wizard')
     ```
   - Reload the page after clearing storage