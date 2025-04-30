# Supabase Compatibility

## WebSockets and Supabase

This document explains why WebSockets have been disabled in this application to maintain compatibility with Supabase.

### Background

Supabase is a powerful PostgreSQL-based backend platform that provides authentication, database, storage, and other services. However, Supabase's architecture has specific limitations regarding WebSocket connections.

### Why WebSockets Are Disabled

1. **Conflict with Supabase Realtime**: Supabase has its own realtime functionality that works through the Supabase client. Having separate WebSocket connections alongside Supabase's built-in realtime capabilities can cause conflicts and connection issues.

2. **Security Model Compatibility**: Supabase uses Row-Level Security (RLS) policies to secure database access. Direct WebSocket connections may bypass these security mechanisms, potentially creating security vulnerabilities.

3. **Connection Management**: Managing multiple WebSocket connections (both from Supabase and our custom implementation) can lead to performance issues, especially on mobile devices.

### Current Implementation

All WebSocket functionality has been replaced with HTTP polling with the following characteristics:

1. **Regular API Polling**: Dashboard updates are fetched via HTTP requests at regular intervals (30 seconds by default).

2. **Efficient Caching**: Client-side caching is implemented to reduce unnecessary network traffic and improve user experience during connection issues.

3. **Connection Status Indicators**: The UI shows connection status to inform users when they're working offline or experiencing connectivity issues.

4. **Supabase Realtime Disabled**: We've explicitly disabled Supabase's realtime functionality by setting `eventsPerSecond: 0` in the Supabase client configuration to prevent any WebSocket connections.

### Files Modified

The following files were modified to disable WebSockets:

1. `server/supabase.ts` - Disabled realtime in Supabase client configuration
2. `server/routes.ts` - Commented out WebSocket server initialization
3. `server/services/websocketService.ts` - Disabled all WebSocket functionality
4. `client/src/hooks/use-websocket.tsx` - Disabled client-side WebSocket connections
5. `client/src/lib/dashboard-service.ts` - Implemented polling mechanism for dashboard updates

### Future Considerations

If real-time updates become critical in the future, consider:

1. Using Supabase's built-in realtime functionality instead of custom WebSockets
2. Using Server-Sent Events (SSE) as a unidirectional alternative
3. Keeping the HTTP polling approach but decreasing the interval for more frequent updates

### Maintainer Notes

- Do not re-enable WebSockets without thoroughly testing compatibility with Supabase
- If implementing real-time features, prefer using Supabase's native capabilities
- Any push notifications should be implemented using a dedicated service like FCM, not WebSockets