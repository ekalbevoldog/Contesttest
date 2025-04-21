import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon for WebSocket support
neonConfig.webSocketConstructor = ws;

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  // In production, we'll throw an error
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
}

// Define connection options with reasonable defaults
const connectionOptions = {
  connectionString: process.env.DATABASE_URL,
  max: process.env.NODE_ENV === 'production' ? 20 : 10, // More connections in production
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // How long to wait for a connection
};

// Setup connection retry logic
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

// Create connection pool with retry logic
export let pool: Pool;
export let db: ReturnType<typeof drizzle>;

function initializeDatabase() {
  try {
    console.log(`Initializing database connection (attempt ${retryCount + 1}/${MAX_RETRIES})`);
    pool = new Pool(connectionOptions);
    
    // Add error handler for pool
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Will retry database connection in ${RETRY_DELAY_MS}ms...`);
        setTimeout(initializeDatabase, RETRY_DELAY_MS);
      }
    });
    
    // Initialize Drizzle ORM with our schema
    db = drizzle(pool, { schema });
    
    console.log("Database connection pool initialized");
  } catch (error) {
    console.error("Error initializing database:", error);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Will retry database connection in ${RETRY_DELAY_MS}ms...`);
      setTimeout(initializeDatabase, RETRY_DELAY_MS);
    } else if (process.env.NODE_ENV === 'production') {
      console.error(`Failed to connect to database after ${MAX_RETRIES} attempts`);
      throw error;
    }
  }
}

// Initialize the database connection
initializeDatabase();

// Export a function to check the database connection
export async function testConnection() {
  try {
    if (!db) {
      console.error("Database connection not initialized yet");
      return false;
    }
    
    // Simple test query using Drizzle
    const result = await db.select().from(schema.users).limit(1);
    console.log("Successfully connected to database with Drizzle ORM");
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}