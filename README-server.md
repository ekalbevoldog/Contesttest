# Server Setup and Development Guide

This document provides instructions for running and developing the server application.

## Prerequisites

- Node.js (v16+)
- npm (v7+)

## Getting Started

1. **Install Dependencies**
   ```
   npm install
   ```

2. **Build the Application**
   This will build both the client and server components:
   ```
   node scripts/clean-build.js
   ```

3. **Start the Development Server**
   ```
   npm run dev
   ```
   The server will start on port 5000 by default.

## Project Structure

- `/client` - React frontend application
- `/server` - Express backend application
- `/dist/public` - Built frontend assets (generated from Vite)
- `/dist` - Compiled server code

## Key Files

- `vite.config.ts` - Vite configuration for the client build
- `server/index.ts` - Main server entry point
- `server/routes.ts` - API routes registration
- `server/routes/Routes-public.ts` - Static file and SPA serving

## Building for Production

To build for production:
```
NODE_ENV=production node scripts/clean-build.js
```

Then start the production server:
```
npm run start
```

## Notes

- The server serves static assets from the `/dist/public` directory, which is where Vite outputs the client build
- Authentication is handled through Supabase
- All API endpoints are prefixed with `/api`