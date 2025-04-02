// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
   schema: "./schema.ts",         // points to schema in server directory
  out: "./drizzle/migrations",   // folder for migration files
  dialect: "postgresql",         // the actual SQL dialect
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
