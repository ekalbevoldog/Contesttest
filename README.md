# Contested Platform

An intelligent AI-powered platform connecting college athletes with business opportunities through advanced matching and networking technologies.

## Core Technologies

- **Google Gemini AI** for intelligent matching
- **BigQuery** for robust data processing
- **React** frontend with interactive interfaces
- **TypeScript REST API** backend
- **Supabase PostgreSQL** for data storage
- **Real-time** dynamic matching capabilities
- **Shadcn UI** for responsive design
- **Secure** authentication
- **Advanced** state management
- **Comprehensive** diagnostic logging
- **Detailed** matching and offer tracking database schema

## Database Configuration

### Supabase PostgreSQL

This application uses Supabase PostgreSQL for data storage. 

> ⚠️ **Important**: This application should ONLY use Supabase PostgreSQL. Neon PostgreSQL is NOT supported.

#### Required Environment Variables

The following environment variables must be configured to connect to Supabase:

- `SUPABASE_URL`: The URL of your Supabase instance
- `SUPABASE_KEY`: Your Supabase API key
- `SUPABASE_DATABASE_URL`: The PostgreSQL connection string for your Supabase database

#### Development Mode

During development, if Supabase is not configured, the application will fall back to using a local PostgreSQL database specified by `DATABASE_URL`. This is only for development purposes.

### Database Utilities

Several utility scripts are provided to help manage the database:

- `./db-tasks.sh diagnose`: Run comprehensive database connection diagnostics
- `./db-tasks.sh status`: Check basic database connection status
- `./db-tasks.sh push`: Push schema changes to the database
- `./db-tasks.sh migrate-to-supabase`: Migrate the schema to Supabase (WARNING: this will erase existing data)
- `./db-tasks.sh clear`: Drop all tables in the database (WARNING: this will erase all data)

### Schema Management

The database schema is defined in `server/schema.ts` using Drizzle ORM. Key tables include:

- Users and authentication
- Athlete and business profiles
- Campaigns and match scores
- Messages and partnership offers
- Feedback and compliance tracking

To apply schema changes, use the `db:push` npm script or the `./db-tasks.sh push` helper.

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Configure environment variables (see above)
4. Start the application with `npm run dev`

## Running the Application

The application consists of:

- A React frontend built with Vite
- An Express backend API
- WebSocket services for real-time messaging

During development, both the frontend and backend run on the same port using Vite's proxy capabilities.