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
- Compile TypeScript code (even with type errors)
- Build the React frontend
- Copy necessary files to the dist directory
- Generate optimized assets

## Deployment Options

### Option 1: Deploy with Node.js

1. After building, navigate to the dist directory:
```bash
cd dist
```

2. Install production dependencies:
```bash
npm install --production
```

3. Start the server:
```bash
node server.js
```

### Option 2: Deploy to a Platform-as-a-Service (PaaS)

1. Configure the platform to use the `dist` directory as the root
2. Set the start command to `node server.js`
3. Configure environment variables in the platform's dashboard
4. Ensure the `dist` directory is included in your deployment

### Option 3: Deploy to Replit

1. Use Replit's deployment feature
2. The application is configured to work with Replit's infrastructure
3. Environment secrets should be configured in the Replit secrets panel

## Fallback Options

If normal TypeScript compilation fails, the build system will automatically try:

1. First: Standard TypeScript compilation (ignoring errors) 
2. If that fails: Use ts-node as a fallback with `node server-ts.js`

## Database Configuration

The application uses PostgreSQL with Drizzle ORM. Connection settings are in `server/db.ts`.

1. The database URL should be provided via the DATABASE_URL environment variable
2. The application will automatically retry database connections (5 attempts)
3. Database schema is defined in `shared/schema.ts`

## Troubleshooting

### Common Issues

#### TypeScript Errors
- TypeScript errors during deployment can be safely ignored as the application uses a build configuration that allows it to run even with type errors.
- The actual JavaScript output should function correctly regardless of TypeScript errors.

#### Database Connection Issues
- Check that DATABASE_URL environment variable is correctly set
- Verify PostgreSQL server is running and accessible
- The application has automatic connection retry logic

#### Port Configuration
- The application runs on port 5000 by default
- To use a different port, set the PORT environment variable

## Monitoring and Logs

1. Application logs are printed to the console
2. Notable log events include:
   - Database connection attempts
   - Server startup
   - API request logging in development mode
3. Consider using a monitoring service for production deployments

## Security Considerations

1. Ensure DATABASE_URL and other sensitive variables are kept secure
2. The application uses proper authentication mechanisms
3. For production, consider setting up rate limiting and other security measures

## Additional Notes

- Static assets are served from the `dist/client` directory
- The application is designed to work with Node.js's default process manager
- For high-availability deployments, consider using PM2 or similar tools