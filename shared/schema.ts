// schema.ts - Type definitions accurately aligned with Supabase database structure
import { z } from "zod";

// USER-DEFINED types from database
// Note: These are guesses at the actual enum values - adjust if your actual enum values differ

// User role enum (matches USER-DEFINED type in database)
export const UserRole = z.enum(["user", "athlete", "business", "compliance", "admin"]);
export type UserRole = z.infer<typeof UserRole>;

// Social platform enum (for athlete_social_accounts platform column)
export const SocialPlatform = z.enum(["instagram", "twitter", "tiktok", "youtube", "facebook", "other"]);
export type SocialPlatform = z.infer<typeof SocialPlatform>;

// Gender enum (matches USER-DEFINED type in database)
export const Gender = z.enum(["male", "female", "other", "prefer_not_to_say"]);
export type Gender = z.infer<typeof Gender>;

// Company type enum (matches USER-DEFINED type in database)
export const CompanyType = z.enum(["brand", "agency", "other"]);
export type CompanyType = z.infer<typeof CompanyType>;

// Compliance status enum (matches USER-DEFINED type in database)
export const ComplianceStatus = z.enum(["pending", "approved", "rejected"]);
export type ComplianceStatus = z.infer<typeof ComplianceStatus>;

// Onboarding flow type enum (matches USER-DEFINED type in database)
export const FlowType = z.enum(["athlete", "business", "compliance"]);
export type FlowType = z.infer<typeof FlowType>;

// Users table schema
export const userSchema = z.object({
  id: z.string().uuid(), // Primary key, auto-generated
  email: z.string().email(), // Unique
  role: UserRole,
  created_at: z.string().datetime().optional(), // Defaults to now()
  last_login: z.string().datetime().optional(),
  stripe_customer_id: z.string().optional(),
  stripe_subscription_id: z.string().optional(),
  subscription_status: z.string().optional(),
  subscription_plan: z.string().optional(),
  subscription_current_period_end: z.string().datetime().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional()
});

export type User = z.infer<typeof userSchema>;

export const insertUserSchema = userSchema.omit({ 
  id: true, 
  created_at: true, 
  last_login: true
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters")
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Athletes table schema
export const athleteSchema = z.object({
  id: z.string().uuid(), // Primary key, references users.id
  full_name: z.string(),
  date_of_birth: z.string().date(), // Date field (not datetime)
  gender: Gender.optional(),
  athlete_type_id: z.number().int().optional(),
  governing_body_id: z.number().int().optional(),
  primary_sport_id: z.number().int().optional(),
  position: z.string().optional(),
  school: z.string().optional(),
  school_division: z.string().optional(),
  graduation_year: z.number().int().optional(),
  zip_code: z.string().optional(),
  eligibility_expires_on: z.string().date().optional(), // Date field (not datetime)
  compliance_contact_email: z.string().optional(),
  bio: z.string().optional()
});

export type Athlete = z.infer<typeof athleteSchema>;

export const insertAthleteSchema = athleteSchema.omit({
  id: true // id comes from users table
});

export type InsertAthlete = z.infer<typeof insertAthleteSchema>;

// Athlete Profiles table schema
export const athleteProfileSchema = z.object({
  id: z.string().uuid(), // Primary key
  session_id: z.string(), // Unique
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  date_of_birth: z.string().date().optional(), // Date field (not datetime)
  gender: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  full_name: z.string().optional(),
  profile_image: z.string().optional(),

  // Academic Information
  school: z.string(),
  division: z.string(),
  graduation_year: z.number().int().optional(),
  major: z.string().optional(),
  gpa: z.number().optional(),
  academic_honors: z.string().optional(),

  // Athletic Information
  sport: z.string(),
  position: z.string().optional(),
  sport_achievements: z.string().optional(),
  stats: z.record(z.any()).optional(), // JSONB field

  // Social Media
  social_handles: z.record(z.any()).optional(), // JSONB field
  follower_count: z.number().int(),
  average_engagement_rate: z.number().optional(),

  // Content Creation
  content_style: z.string(),
  content_types: z.record(z.any()).optional(), // JSONB field

  // Brand Preferences
  compensation_goals: z.string(),
  preferred_product_categories: z.record(z.any()).optional(), // JSONB field
  previous_brand_deals: z.record(z.any()).optional(), // JSONB field

  // Personal Brand
  personal_values: z.record(z.any()).optional(), // JSONB field
  causes: z.record(z.any()).optional(), // JSONB field

  // Availability & Requirements
  availability_timeframe: z.string().optional(),
  minimum_compensation: z.string().optional(),

  // Preferences
  preferences: z.record(z.any()).optional(), // JSONB field

  created_at: z.string().datetime().optional(), // Defaults to now()
  updated_at: z.string().datetime().optional() // Defaults to now()
});

export type AthleteProfile = z.infer<typeof athleteProfileSchema>;

export const insertAthleteProfileSchema = athleteProfileSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export type InsertAthleteProfile = z.infer<typeof insertAthleteProfileSchema>;

// Athlete Social Accounts table schema
export const athleteSocialAccountSchema = z.object({
  id: z.string().uuid(), // Primary key, auto-generated
  athlete_id: z.string().uuid().optional(), // Foreign key to athletes.id
  platform: SocialPlatform, // Enum type
  handle: z.string(),
  url: z.string().optional(),
  followers_count: z.number().int().optional(),
  engagement_rate: z.number().optional() // numeric type in database
});

export type AthleteSocialAccount = z.infer<typeof athleteSocialAccountSchema>;

export const insertAthleteSocialAccountSchema = athleteSocialAccountSchema.omit({
  id: true // auto-generated
});

export type InsertAthleteSocialAccount = z.infer<typeof insertAthleteSocialAccountSchema>;

// Athlete Sports (junction table) schema
export const athleteSportSchema = z.object({
  athlete_id: z.string().uuid(), // Part of composite primary key
  sport_id: z.number().int(), // Part of composite primary key
  position: z.string().optional(),
  is_primary: z.boolean().optional().default(false)
});

export type AthleteSport = z.infer<typeof athleteSportSchema>;

// Sports reference table schema
export const sportSchema = z.object({
  id: z.number().int(), // Primary key, auto-incremented
  name: z.string() // Unique
});

export type Sport = z.infer<typeof sportSchema>;

// Athlete Types reference table schema
export const athleteTypeSchema = z.object({
  id: z.number().int(), // Primary key, auto-incremented
  name: z.string() // Unique
});

export type AthleteType = z.infer<typeof athleteTypeSchema>;

// Businesses table schema
export const businessSchema = z.object({
  id: z.string().uuid(), // Primary key
  company_name: z.string(),
  company_type: CompanyType, // Enum type
  industry_id: z.number().int().optional(), // Foreign key to industries.id
  description: z.string().optional(),
  website_url: z.string().optional(),
  zipCode: z.string().optional()
});

export type Business = z.infer<typeof businessSchema>;

export const insertBusinessSchema = businessSchema.omit({
  id: true // Links to users.id
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;

// Business Profiles table schema
export const businessProfileSchema = z.object({
  id: z.string().uuid(), // Primary key, linked to users.id via foreign key
  session_id: z.string(), // Unique
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  business_type: z.string().optional(),
  company_size: z.array(z.unknown()).optional(), // ARRAY type in database
  zipCode: z.string().optional(), // Note: camelCase in database
  bio: z.string().optional(),
  operatingLocation: z.string().optional(), // Note: camelCase in database
  company: z.string().optional(),
  position: z.string().optional(),
  full_name: z.string().optional(),
  profile_image: z.string().optional(),

  // Product Information
  product_type: z.string().optional(),

  // Budget Information
  budget: z.string().optional(),
  budgetmin: z.number().int().optional(),
  budgetmax: z.number().int().optional(),

  // Experience
  haspreviouspartnerships: z.boolean().optional(),

  created_at: z.string().datetime().optional(), // Defaults to now()
  updated_at: z.string().datetime().optional() // Defaults to now()
});

export type BusinessProfile = z.infer<typeof businessProfileSchema>;

export const insertBusinessProfileSchema = businessProfileSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;

// Industries reference table schema
export const industrySchema = z.object({
  id: z.number().int(), // Primary key, auto-incremented
  name: z.string() // Unique
});

export type Industry = z.infer<typeof industrySchema>;

// Sessions table schema
export const sessionSchema = z.object({
  id: z.number().int(), // Primary key, auto-incremented (integer, not uuid)
  session_id: z.string(), // Unique
  user_type: z.string().optional(),
  data: z.record(z.any()).optional(), // JSONB field
  profile_completed: z.boolean().optional().default(false),
  athlete_id: z.number().int().optional(), // Integer in database
  business_id: z.number().int().optional(), // Integer in database
  last_login: z.string().datetime().optional(), // Defaults to now()
  created_at: z.string().datetime().optional(), // Defaults to now()
  updated_at: z.string().datetime().optional() // Defaults to now()
});

export type Session = z.infer<typeof sessionSchema>;

export const insertSessionSchema = sessionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_login: true
});

export type InsertSession = z.infer<typeof insertSessionSchema>;

// Session table (Express session storage) schema
export const expressSessionSchema = z.object({
  sid: z.string(), // Primary key
  sess: z.record(z.any()), // JSON field
  expire: z.string().datetime()
});

export type ExpressSession = z.infer<typeof expressSessionSchema>;

// Compliance Officers table schema
export const complianceOfficerSchema = z.object({
  id: z.string().uuid(), // Primary key
  organization_name: z.string().optional(),
  phone: z.string().optional()
  // Additional fields would be added based on your requirements
});

export type ComplianceOfficer = z.infer<typeof complianceOfficerSchema>;

// Compliance Requests table schema
export const complianceRequestSchema = z.object({
  id: z.number().int(), // Primary key, auto-incremented
  match_id: z.number().int().optional(), // Foreign key to match_scores.id
  compliance_officer_id: z.string().uuid().optional(), // Foreign key to compliance_officers.id
  status: ComplianceStatus.optional().default("pending"), // Enum type
  requested_at: z.string().datetime().optional(), // Defaults to now()
  reviewed_at: z.string().datetime().optional(),
  notes: z.string().optional()
});

export type ComplianceRequest = z.infer<typeof complianceRequestSchema>;

// Match Scores table schema
export const matchScoreSchema = z.object({
  id: z.number().int(), // Primary key, auto-incremented
  athlete_id: z.string().uuid().optional(), // Foreign key to athletes.id
  business_id: z.string().uuid().optional(), // Foreign key to businesses.id
  score: z.number().optional(), // numeric type in database
  explanation: z.record(z.any()).optional(), // JSONB field
  created_at: z.string().datetime().optional() // Defaults to now()
});

export type MatchScore = z.infer<typeof matchScoreSchema>;

// Deal Types reference table schema
export const dealTypeSchema = z.object({
  id: z.number().int(), // Primary key, auto-incremented
  name: z.string(), // Unique
  description: z.string().optional()
});

export type DealType = z.infer<typeof dealTypeSchema>;

// Governing Bodies reference table schema
export const governingBodySchema = z.object({
  id: z.number().int(), // Primary key, auto-incremented
  name: z.string() // Unique
});

export type GoverningBody = z.infer<typeof governingBodySchema>;

// Onboarding Progress tracking table schema
export const onboardingProgressSchema = z.object({
  id: z.string().uuid(), // Primary key, linked to users.id
  flow_type: FlowType, // Enum type
  current_step: z.string().optional(),
  progress_json: z.record(z.any()).optional(), // JSONB field
  is_complete: z.boolean().optional().default(false),
  updated_at: z.string().datetime().optional() // Defaults to now()
});

export type OnboardingProgress = z.infer<typeof onboardingProgressSchema>;

// Subscription History table schema
export const subscriptionHistorySchema = z.object({
  Id: z.string().uuid().optional(), // Foreign key to users.id (note the capital 'I' in 'Id' matches DB)
  stripe_subscription_id: z.string(), // character varying in database
  plan_id: z.string(), // character varying in database
  price_id: z.string(), // character varying in database
  status: z.string(), // character varying in database
  amount: z.number().int(),
  currency: z.string().default("USD"), // character varying with default 'USD'
  interval: z.string().default("month"), // character varying with default 'month'
  created_at: z.string().datetime().optional(), // Defaults to now()
  updated_at: z.string().datetime().optional(), // Defaults to now()
  current_period_start: z.string().datetime(),
  current_period_end: z.string().datetime(),
  cancel_at_period_end: z.boolean().optional().default(false),
  canceled_at: z.string().datetime().optional()
});

export type SubscriptionHistory = z.infer<typeof subscriptionHistorySchema>;

// Define interface for Stripe-related code
export interface StripeInterface {
  id: string;
  object: string;
  [key: string]: any;
}

// Interface for message metadata (if needed in your application)
export interface MessageMetadata {
  [key: string]: unknown;
  unread?: boolean;
  sessionData?: unknown;
  userId?: string | null;
  userType?: string | null;
}