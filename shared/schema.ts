import { relations } from "drizzle-orm";
import { pgTable, serial, text, varchar, timestamp, uuid, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the users table
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: text("role", { enum: ["athlete", "business", "compliance", "admin"] }).notNull(),
    created_at: timestamp("created_at").defaultNow(),
    last_login: timestamp("last_login"),
    auth_id: varchar("auth_id", { length: 255 }),
  },
  (table) => {
    return {
      emailIdx: uniqueIndex("email_idx").on(table.email),
      usernameIdx: uniqueIndex("username_idx").on(table.username),
    };
  }
);

export const insertUserSchema = createInsertSchema(users)
  .extend({
    // Add confirmPassword for registration validation
    confirmPassword: z.string().optional(),
  })
  .omit({ 
    id: true, 
    created_at: true, 
    last_login: true,
    auth_id: true 
  });

// Define the sessions table for user session management
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: text("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => {
    return {
      expireIdx: index("expire_idx").on(table.expire),
    };
  }
);

// Define athlete profiles
export const athleteProfiles = pgTable(
  "athlete_profiles",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    sport: varchar("sport", { length: 100 }).notNull(),
    division: varchar("division", { length: 100 }).notNull(),
    school: varchar("school", { length: 255 }).notNull(),
    followerCount: serial("follower_count").notNull(),
    contentStyle: varchar("content_style", { length: 255 }).notNull(),
    compensationGoals: varchar("compensation_goals", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    sessionId: varchar("session_id", { length: 255 })
  },
  (table) => {
    return {
      userIdIdx: uniqueIndex("idx_athlete_profiles_user_id").on(table.userId),
    };
  }
);

export const insertAthleteProfileSchema = createInsertSchema(athleteProfiles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  userId: true 
});

// Define business profiles
export const businessProfiles = pgTable(
  "business_profiles",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    values: text("values").notNull(),
    productType: varchar("product_type", { length: 100 }).notNull(),
    audienceGoals: varchar("audience_goals", { length: 255 }).notNull(),
    campaignVibe: varchar("campaign_vibe", { length: 255 }).notNull(),
    targetSchoolsSports: varchar("target_schools_sports", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
    email: varchar("email", { length: 255 }),
    sessionId: varchar("session_id", { length: 255 })
  },
  (table) => {
    return {
      userIdIdx: uniqueIndex("idx_business_profiles_user_id").on(table.userId),
    };
  }
);

export const insertBusinessProfileSchema = createInsertSchema(businessProfiles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  userId: true 
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AthleteProfile = typeof athleteProfiles.$inferSelect;
export type InsertAthleteProfile = z.infer<typeof insertAthleteProfileSchema>;

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;