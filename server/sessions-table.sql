-- Create sessions table for Express PostgreSQL session storage
CREATE TABLE IF NOT EXISTS "public"."sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "public"."sessions" ("expire");