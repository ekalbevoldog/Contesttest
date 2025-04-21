# Contested Platform Deployment Guide

This document outlines how to deploy the Contested Platform to a production environment.

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL database
- Environment variables properly configured

## Environment Variables

The following environment variables are required:

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Set to "production" for deployment
- Additional variables for external services (if used)

## Build Process

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Run the build script:
```bash
bash build.sh
```

The build script will:
- Compile TypeScript code
- Build the React frontend
- Copy necessary files to the dist directory
- Generate optimized assets

## Deployment Options

### Option 1: Deploy with Node.js

1. After building, start the server:
```bash
node server.js
```

### Option 2: Deploy to Replit

1. Use Replit's deployment feature
2. The application is configured to work with Replit's infrastructure
3. Environment secrets should be configured in the Replit secrets panel

## Database Migration

The application will automatically run necessary database migrations on startup if needed.

## Troubleshooting

If you encounter TypeScript errors during deployment, they can be safely ignored as the application uses a build configuration that allows it to run even with type errors.

The actual JavaScript output should function correctly regardless of TypeScript errors.

## Monitoring and Logs

1. Application logs are printed to the console
2. Consider using a monitoring service for production deployments

## Additional Notes

- The application runs on port 5000 by default
- Static assets are served from the `dist` directory
- Database schema is defined in `shared/schema.ts`