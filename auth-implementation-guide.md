# Unified Authentication Implementation Guide

This guide provides step-by-step instructions for migrating from the current dual authentication system to the new unified Supabase-based authentication system.

## Server-Side Integration

### Step 1: Update the Server Entry Point
Modify the server entry point to use the new unified auth routes:

```typescript
// Import the new unified auth routes
import { setupUnifiedAuthRoutes } from "./routes/unifiedAuthRoutes.js";

// Inside your server initialization function:
function setupServer() {
  // ... existing code ...
  
  // Replace both auth setup functions with the unified version
  // setupAuth(app); // Comment out or remove this legacy setup
  // setupSupabaseAuth(app); // Comment out or remove this legacy setup
  
  // Use the new unified auth routes
  setupUnifiedAuthRoutes(app);
  
  // ... rest of your server initialization ...
}
```

### Step 2: Update Protected Route Middleware
Replace any existing authentication middleware with the new verifyAuthToken:

```typescript
// Import the middleware
import { verifyAuthToken } from "./routes/unifiedAuthRoutes.js";

// For any protected route:
app.get("/api/protected-resource", verifyAuthToken, (req, res) => {
  // The user is now available in req.user
  res.json({ data: "Protected data", user: req.user });
});
```

## Client-Side Integration

### Step 1: Add the Unified Auth Provider
In your client-side entry point (e.g., App.tsx):

```tsx
import { UnifiedAuthProvider } from "@/hooks/use-unified-auth";

function App() {
  return (
    <UnifiedAuthProvider>
      {/* Your existing app content */}
    </UnifiedAuthProvider>
  );
}
```

### Step 2: Update Login Components
Replace the existing auth hooks with the new unified auth hook:

```tsx
import { useUnifiedAuth } from "@/hooks/use-unified-auth";

function LoginForm() {
  const { login, isLoading, error } = useUnifiedAuth();
  
  const handleSubmit = async (values) => {
    await login(values.email, values.password);
  };
  
  // Rest of your component
}
```

### Step 3: Update Registration Components
Similar to login, update registration forms:

```tsx
import { useUnifiedAuth } from "@/hooks/use-unified-auth";

function RegistrationForm() {
  const { register, isLoading, error } = useUnifiedAuth();
  
  const handleSubmit = async (values) => {
    await register({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      role: values.role
    });
  };
  
  // Rest of your component
}
```

### Step 4: Update Protected Components
For components that need authentication status:

```tsx
import { useUnifiedAuth } from "@/hooks/use-unified-auth";

function ProtectedComponent() {
  const { user, isLoading, logout } = useUnifiedAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={logout}>Logout</button>
      {/* Component content */}
    </div>
  );
}
```

### Step 5: Update Protected Routes
For route protection:

```tsx
import { useUnifiedAuth } from "@/hooks/use-unified-auth";
import { Route, Redirect } from "wouter";

function ProtectedRoute({ component: Component, ...rest }) {
  const { user, isLoading } = useUnifiedAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Route
      {...rest}
      component={props =>
        user ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
}
```

## Database Considerations

The unified authentication system is designed to work with your existing Supabase database structure. No migrations should be necessary, but ensure your database has:

1. A `users` table with at least:
   - `auth_id` (string) - The Supabase auth user ID
   - `email` (string) - User's email
   - `role` (string) - User's role (athlete, business, admin, etc.)
   - `last_login` (timestamp) - Last login date/time

## Phased Rollout Recommendations

For a smooth transition, we recommend:

1. **Phase 1**: Add the new unified authentication system alongside the existing systems
2. **Phase 2**: Migrate one user type (e.g., athletes) to the new system
3. **Phase 3**: Migrate all users to the new system
4. **Phase 4**: Remove the legacy authentication systems

## Testing

Test all authentication flows thoroughly:

1. Login
2. Registration
3. Session persistence
4. Token refresh
5. Logout
6. Access to protected resources

## Security Considerations

1. Use HTTPS in production
2. Set proper cookie security attributes
3. Implement rate limiting for authentication endpoints
4. Log authentication events for auditing