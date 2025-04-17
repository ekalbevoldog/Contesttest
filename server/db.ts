import * as schema from "../shared/schema";

console.log("REMOVED NEON: Setting up memory storage only");

// Create a fake drizzle interface without Neon/Postgres to satisfy types
class MemoryDb {
  async query() {
    return { rows: [{ connected: 1 }] };
  }
}

// Not actually connecting to any database
const fakePool = new MemoryDb();

// Export a fake db object with minimal implementation
export const db = {
  select: () => ({
    from: () => ({
      where: () => [],
      orderBy: () => ({
        limit: () => ({
          offset: () => []
        })
      }),
      get: () => null
    })
  }),
  insert: () => ({
    values: () => ({
      returning: () => []
    })
  }),
  update: () => ({
    set: () => ({
      where: () => ({
        returning: () => []
      })
    })
  }),
  delete: () => ({
    where: () => null
  })
};

// Export a function to check the database connection
export async function testConnection() {
  try {
    console.log("Database not connected - using memory storage only");
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}