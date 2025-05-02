
// schema.ts - Type definitions for the data model

import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, uuid, timestamp, serial, integer, boolean, json } from "drizzle-orm/pg-core";

// =========== DRIZZLE SCHEMA DEFINITIONS ===========

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  auth_id: uuid("auth_id"),
  email: text("email").notNull(),
  username: text("username").notNull(),
  password: text("password"),
  role: text("role", { enum: ["athlete", "business", "compliance", "admin"] }).notNull(),
  created_at: timestamp("created_at").defaultNow(),
  last_login: timestamp("last_login"),
  metadata: json("metadata"),
  // Stripe subscription fields
  stripe_customer_id: text("stripe_customer_id"),
  stripe_subscription_id: text("stripe_subscription_id"),
  subscription_status: text("subscription_status"),
  subscription_plan: text("subscription_plan"),
  subscription_current_period_end: timestamp("subscription_current_period_end"),
  subscription_cancel_at_period_end: boolean("subscription_cancel_at_period_end")
});

// Sessions table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  session_id: text("session_id").notNull(),
  user_id: integer("user_id").references(() => users.id),
  user_type: text("user_type"),
  data: json("data"),
  profile_completed: boolean("profile_completed").default(false),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Athlete profiles table
export const athleteProfiles = pgTable("athlete_profiles", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  session_id: text("session_id").notNull(),
  
  // Basic Information
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  birthdate: timestamp("birthdate"),
  gender: text("gender"),
  bio: text("bio"),
  zipcode: text("zipcode"),
  
  // Academic Information
  school: text("school").notNull(),
  division: text("division").notNull(),
  graduation_year: integer("graduation_year"),
  major: text("major"),
  gpa: integer("gpa"),
  academic_honors: text("academic_honors"),
  
  // Athletic Information
  sport: text("sport").notNull(),
  position: text("position"),
  sport_achievements: text("sport_achievements"),
  stats: json("stats"),
  
  // Social Media
  social_handles: json("social_handles"),
  follower_count: integer("follower_count").default(0),
  average_engagement_rate: integer("average_engagement_rate"),
  
  // Social Media OAuth Connections
  social_connections: json("social_connections"),
  instagram_metrics: json("instagram_metrics"),
  twitter_metrics: json("twitter_metrics"),
  tiktok_metrics: json("tiktok_metrics"),
  last_metrics_update: timestamp("last_metrics_update"),
  
  // Profile Link Settings
  profile_link_enabled: boolean("profile_link_enabled"),
  profile_link_id: text("profile_link_id"),
  profile_link_theme: text("profile_link_theme"),
  profile_link_background_color: text("profile_link_background_color"),
  profile_link_text_color: text("profile_link_text_color"),
  profile_link_accent_color: text("profile_link_accent_color"),
  profile_link_bio: text("profile_link_bio"),
  profile_link_photo_url: text("profile_link_photo_url"),
  profile_link_buttons: json("profile_link_buttons"),
  
  // Content Creation
  content_style: text("content_style").notNull(),
  content_types: json("content_types"),
  top_performing_content_themes: json("top_performing_content_themes"),
  media_kit_url: text("media_kit_url"),
  
  // Brand Preferences
  compensation_goals: text("compensation_goals").notNull(),
  preferred_product_categories: json("preferred_product_categories"),
  previous_brand_deals: json("previous_brand_deals"),
  available_for_travel: boolean("available_for_travel"),
  exclusivity_requirements: text("exclusivity_requirements"),
  
  // Personal Brand
  personal_values: json("personal_values"),
  causes: json("causes"),
  brand_personality: json("brand_personality"),
  
  // Availability & Requirements
  availability_timeframe: text("availability_timeframe"),
  minimum_compensation: text("minimum_compensation"),
  
  // Preferences and Algorithm Data
  preferences: json("preferences"),
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Business profiles table
export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  session_id: text("session_id").notNull(),
  
  // Basic Information
  name: text("name").notNull(),
  email: text("email"),
  industry: text("industry"),
  business_type: text("business_type"),
  company_size: text("company_size"),
  founded_year: integer("founded_year"),
  website: text("website"),
  logo: text("logo"),
  zipcode: text("zipcode"),
  
  // Product Information
  product_type: text("product_type").notNull(),
  product_description: text("product_description"),
  product_images: json("product_images"),
  pricing_tier: text("pricing_tier"),
  
  // Marketing Information
  audience_goals: text("audience_goals").notNull(),
  audience_demographics: json("audience_demographics"),
  primary_audience_age_range: text("primary_audience_age_range"),
  secondary_audience_age_range: text("secondary_audience_age_range"),
  
  // Campaign Details
  campaign_vibe: text("campaign_vibe").notNull(),
  campaign_goals: json("campaign_goals"),
  campaign_frequency: text("campaign_frequency"),
  campaign_duration: text("campaign_duration"),
  campaign_seasonality: text("campaign_seasonality"),
  campaign_timeline: text("campaign_timeline"),
  
  // Brand Information
  values: text("values").notNull(),
  brand_voice: text("brand_voice"),
  brand_colors: json("brand_colors"),
  brand_guidelines: text("brand_guidelines"),
  sustainability_focus: boolean("sustainability_focus"),
  
  // Athletic Targeting
  target_schools_sports: text("target_schools_sports").notNull(),
  preferred_sports: json("preferred_sports"),
  preferred_divisions: json("preferred_divisions"),
  preferred_regions: json("preferred_regions"),
  
  // Budget and Compensation
  budget: text("budget"),
  budget_min: integer("budget_min"),
  budget_max: integer("budget_max"),
  compensation_model: text("compensation_model"),
  budget_per_athlete: text("budget_per_athlete"),
  
  // Previous Experience
  has_previous_partnerships: boolean("has_previous_partnerships"),
  previous_influencer_campaigns: json("previous_influencer_campaigns"),
  campaign_success_metrics: json("campaign_success_metrics"),
  
  // Goals
  goals: json("goals"),
  
  // Preferences and Algorithm Data
  preferences: json("preferences"),
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  business_id: integer("business_id").notNull().references(() => businessProfiles.id),
  
  title: text("title").notNull(),
  description: text("description").notNull(),
  campaign_brief: text("campaign_brief"),
  campaign_type: text("campaign_type"),
  
  deliverables: json("deliverables").notNull(),
  content_requirements: json("content_requirements"),
  brand_mention_requirements: text("brand_mention_requirements"),
  hashtag_requirements: json("hashtag_requirements"),
  exclusivity_clause: text("exclusivity_clause"),
  
  start_date: timestamp("start_date"),
  end_date: timestamp("end_date"),
  submission_deadlines: json("submission_deadlines"),
  
  target_audience: json("target_audience"),
  target_sports: json("target_sports"),
  target_divisions: json("target_divisions"),
  target_regions: json("target_regions"),
  target_follower_counts: json("target_follower_counts"),
  target_engagement_rates: json("target_engagement_rates"),
  
  budget: text("budget"),
  compensation_details: json("compensation_details"),
  
  kpis: json("kpis"),
  goals: json("goals"),
  
  status: text("status", { enum: ["draft", "active", "completed", "cancelled"] }).default("draft"),
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// Matches table
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  athlete_id: integer("athlete_id").notNull().references(() => athleteProfiles.id),
  business_id: integer("business_id").notNull().references(() => businessProfiles.id),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id),
  
  score: integer("score").notNull(),
  reason: text("reason").notNull(),
  strength_areas: json("strength_areas"),
  weakness_areas: json("weakness_areas"),
  
  audience_fit_score: integer("audience_fit_score"),
  content_style_fit_score: integer("content_style_fit_score"),
  brand_value_alignment_score: integer("brand_value_alignment_score"),
  engagement_potential_score: integer("engagement_potential_score"),
  compensation_fit_score: integer("compensation_fit_score"),
  academic_alignment_score: integer("academic_alignment_score"),
  geographic_fit_score: integer("geographic_fit_score"),
  timing_compatibility_score: integer("timing_compatibility_score"),
  platform_specialization_score: integer("platform_specialization_score"),
  
  status: text("status", { enum: ["pending", "accepted", "declined", "completed"] }).default("pending"),
  athlete_response: text("athlete_response"),
  business_response: text("business_response"),
  compliance_status: text("compliance_status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  compliance_officer_id: integer("compliance_officer_id"),
  compliance_notes: text("compliance_notes"),
  
  matched_at: timestamp("matched_at"),
  responded_at: timestamp("responded_at"),
  approved_at: timestamp("approved_at"),
  completed_at: timestamp("completed_at"),
  created_at: timestamp("created_at").defaultNow()
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  session_id: text("session_id").notNull(),
  user_id: integer("user_id").references(() => users.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  created_at: timestamp("created_at").defaultNow()
});

// Partnership Offers table
export const partnershipOffers = pgTable("partnership_offers", {
  id: serial("id").primaryKey(),
  match_id: integer("match_id").notNull().references(() => matches.id),
  business_id: integer("business_id").notNull().references(() => businessProfiles.id),
  athlete_id: integer("athlete_id").notNull().references(() => athleteProfiles.id),
  campaign_id: integer("campaign_id").notNull().references(() => campaigns.id),
  
  compensation_type: text("compensation_type", { enum: ['monetary', 'product', 'affiliate', 'hybrid'] }).notNull(),
  offer_amount: text("offer_amount").notNull(),
  payment_schedule: text("payment_schedule"),
  bonus_structure: text("bonus_structure"),
  
  deliverables: json("deliverables").notNull(),
  content_specifications: text("content_specifications"),
  post_frequency: text("post_frequency"),
  approval_process: text("approval_process"),
  
  usage_rights: text("usage_rights").notNull(),
  term: text("term").notNull(),
  exclusivity: text("exclusivity"),
  geographic_restrictions: text("geographic_restrictions"),
  
  status: text("status", { enum: ["pending", "accepted", "declined", "expired"] }).default("pending"),
  athlete_viewed_at: timestamp("athlete_viewed_at"),
  athlete_responded_at: timestamp("athlete_responded_at"),
  business_updated_at: timestamp("business_updated_at"),
  
  compliance_status: text("compliance_status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  compliance_notes: text("compliance_notes"),
  compliance_reviewed_at: timestamp("compliance_reviewed_at"),
  
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  expires_at: timestamp("expires_at")
});

// Feedback table
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  user_type: text("user_type", { enum: ["athlete", "business", "compliance", "admin"] }).notNull(),
  match_id: integer("match_id").references(() => matches.id),
  partnership_id: integer("partnership_id").references(() => partnershipOffers.id),
  rating: integer("rating").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  response: text("response"),
  status: text("status", { enum: ["pending", "resolved", "rejected"] }).default("pending"),
  public: boolean("public").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  response_by: integer("response_by").references(() => users.id)
});

// Define relations
export const relations = {
  users: {
    athlete: {
      relation: '1:1',
      source: users.id,
      target: athleteProfiles.user_id
    },
    business: {
      relation: '1:1',
      source: users.id,
      target: businessProfiles.user_id
    },
    sessions: {
      relation: '1:m',
      source: users.id,
      target: sessions.user_id
    },
    messages: {
      relation: '1:m',
      source: users.id,
      target: messages.user_id
    }
  },
  athleteProfiles: {
    user: {
      relation: '1:1',
      source: athleteProfiles.user_id,
      target: users.id
    },
    matches: {
      relation: '1:m',
      source: athleteProfiles.id,
      target: matches.athlete_id
    },
    offers: {
      relation: '1:m',
      source: athleteProfiles.id,
      target: partnershipOffers.athlete_id
    }
  },
  businessProfiles: {
    user: {
      relation: '1:1',
      source: businessProfiles.user_id,
      target: users.id
    },
    campaigns: {
      relation: '1:m',
      source: businessProfiles.id,
      target: campaigns.business_id
    },
    matches: {
      relation: '1:m',
      source: businessProfiles.id,
      target: matches.business_id
    },
    offers: {
      relation: '1:m',
      source: businessProfiles.id,
      target: partnershipOffers.business_id
    }
  },
  campaigns: {
    business: {
      relation: '1:1',
      source: campaigns.business_id,
      target: businessProfiles.id
    },
    matches: {
      relation: '1:m',
      source: campaigns.id,
      target: matches.campaign_id
    }
  },
  matches: {
    athlete: {
      relation: '1:1',
      source: matches.athlete_id,
      target: athleteProfiles.id
    },
    business: {
      relation: '1:1',
      source: matches.business_id,
      target: businessProfiles.id
    },
    campaign: {
      relation: '1:1',
      source: matches.campaign_id,
      target: campaigns.id
    },
    offers: {
      relation: '1:m',
      source: matches.id,
      target: partnershipOffers.match_id
    }
  }
};

// =========== ZOD SCHEMA DEFINITIONS ===========

// User type definitions
export const userSchema = z.object({
  id: z.number(),
  auth_id: z.string().uuid().optional(),
  email: z.string().email(),
  username: z.string(),
  password: z.string().optional(), // Add password field for auth purposes
  role: z.enum(["athlete", "business", "compliance", "admin"]),
  created_at: z.date().optional(),
  last_login: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  // Stripe subscription fields
  stripe_customer_id: z.string().optional(),
  stripe_subscription_id: z.string().optional(),
  subscription_status: z.string().optional(),
  subscription_plan: z.string().optional(),
  subscription_current_period_end: z.date().optional(),
  subscription_cancel_at_period_end: z.boolean().optional()
});

export const insertUserSchema = userSchema.omit({ 
  id: true, 
  created_at: true, 
  last_login: true,
  auth_id: true,
  metadata: true
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters")
});

// Session type definitions
export const sessionSchema = z.object({
  id: z.number(),
  session_id: z.string(),
  user_id: z.number().optional(),
  user_type: z.string().optional(),
  data: z.record(z.any()).optional(),
  profile_completed: z.boolean().default(false),
  last_login: z.date().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export const insertSessionSchema = sessionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  last_login: true
});

// Athlete profile type definitions
export const athleteSchema = z.object({
  id: z.number(),
  user_id: z.number().optional(),
  session_id: z.string(),
  
  // Basic Information
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  birthdate: z.date().optional(),
  gender: z.string().optional(),
  bio: z.string().optional(),
  zipcode: z.string().optional(),
  
  // Academic Information
  school: z.string(),
  division: z.string(),
  graduation_year: z.number().optional(),
  major: z.string().optional(),
  gpa: z.number().optional(),
  academic_honors: z.string().optional(),
  
  // Athletic Information
  sport: z.string(),
  position: z.string().optional(),
  sport_achievements: z.string().optional(),
  stats: z.record(z.any()).optional(),
  
  // Social Media
  social_handles: z.union([z.record(z.any()).optional(), z.string().optional()]),
  follower_count: z.number().default(0),
  average_engagement_rate: z.number().optional(),
  
  // Social Media OAuth Connections
  social_connections: z.record(z.any()).optional(),
  instagram_metrics: z.record(z.any()).optional(),
  twitter_metrics: z.record(z.any()).optional(),
  tiktok_metrics: z.record(z.any()).optional(),
  last_metrics_update: z.date().optional(),
  
  // Profile Link Settings
  profile_link_enabled: z.boolean().optional(),
  profile_link_id: z.string().optional(),
  profile_link_theme: z.string().optional(),
  profile_link_background_color: z.string().optional(),
  profile_link_text_color: z.string().optional(),
  profile_link_accent_color: z.string().optional(),
  profile_link_bio: z.string().optional(),
  profile_link_photo_url: z.string().optional(),
  profile_link_buttons: z.record(z.any()).optional(),
  
  // Content Creation
  content_style: z.string(),
  content_types: z.union([z.array(z.string()).optional(), z.string().optional()]),
  top_performing_content_themes: z.array(z.string()).optional(),
  media_kit_url: z.string().optional(),
  
  // Brand Preferences
  compensation_goals: z.string(),
  preferred_product_categories: z.array(z.string()).optional(),
  previous_brand_deals: z.record(z.any()).optional(),
  available_for_travel: z.boolean().optional(),
  exclusivity_requirements: z.string().optional(),
  
  // Personal Brand
  personal_values: z.union([z.array(z.string()).optional(), z.string().optional()]),
  causes: z.union([z.array(z.string()).optional(), z.string().optional()]),
  brand_personality: z.record(z.any()).optional(),
  
  // Availability & Requirements
  availability_timeframe: z.string().optional(),
  minimum_compensation: z.string().optional(),
  
  // Preferences and Algorithm Data
  preferences: z.record(z.any()).optional(),
  
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export const insertAthleteSchema = athleteSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Business profile type definitions
export const businessSchema = z.object({
  id: z.number(),
  user_id: z.number().optional(),
  session_id: z.string(),
  
  // Basic Information
  name: z.string(),
  email: z.string().email().optional(),
  industry: z.string().optional(),
  business_type: z.string().optional(),
  company_size: z.string().optional(),
  founded_year: z.number().optional(),
  website: z.string().optional(),
  logo: z.string().optional(),
  zipcode: z.string().optional(),
  
  // Product Information
  product_type: z.string(),
  product_description: z.string().optional(),
  product_images: z.array(z.string()).optional(),
  pricing_tier: z.string().optional(),
  
  // Marketing Information
  audience_goals: z.string(),
  audience_demographics: z.record(z.any()).optional(),
  primary_audience_age_range: z.string().optional(),
  secondary_audience_age_range: z.string().optional(),
  
  // Campaign Details
  campaign_vibe: z.string(),
  campaign_goals: z.union([z.array(z.string()).optional(), z.string().optional()]),
  campaign_frequency: z.string().optional(),
  campaign_duration: z.string().optional(),
  campaign_seasonality: z.string().optional(),
  campaign_timeline: z.string().optional(),
  
  // Brand Information
  values: z.string(),
  brand_voice: z.string().optional(),
  brand_colors: z.array(z.string()).optional(),
  brand_guidelines: z.string().optional(),
  sustainability_focus: z.boolean().optional(),
  
  // Athletic Targeting
  target_schools_sports: z.string(),
  preferred_sports: z.array(z.string()).optional(),
  preferred_divisions: z.array(z.string()).optional(),
  preferred_regions: z.array(z.string()).optional(),
  
  // Budget and Compensation
  budget: z.string().optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  compensation_model: z.string().optional(),
  budget_per_athlete: z.string().optional(),
  
  // Previous Experience
  has_previous_partnerships: z.boolean().optional(),
  previous_influencer_campaigns: z.array(z.any()).optional(),
  campaign_success_metrics: z.record(z.any()).optional(),
  
  // Goals
  goals: z.union([z.array(z.string()).optional(), z.string().optional()]),
  
  // Preferences and Algorithm Data
  preferences: z.record(z.any()).optional(),
  
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export const insertBusinessSchema = businessSchema.omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Campaign type definitions
export const campaignSchema = z.object({
  id: z.number(),
  business_id: z.number(),
  
  title: z.string(),
  description: z.string(),
  campaign_brief: z.string().optional(),
  campaign_type: z.string().optional(),
  
  deliverables: z.array(z.string()),
  content_requirements: z.record(z.any()).optional(),
  brand_mention_requirements: z.string().optional(),
  hashtag_requirements: z.array(z.string()).optional(),
  exclusivity_clause: z.string().optional(),
  
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  submission_deadlines: z.record(z.any()).optional(),
  
  target_audience: z.record(z.any()).optional(),
  target_sports: z.array(z.string()).optional(),
  target_divisions: z.array(z.string()).optional(),
  target_regions: z.array(z.string()).optional(),
  target_follower_counts: z.record(z.any()).optional(),
  target_engagement_rates: z.record(z.any()).optional(),
  
  budget: z.string().optional(),
  compensation_details: z.record(z.any()).optional(),
  
  kpis: z.record(z.any()).optional(),
  goals: z.union([z.array(z.string()).optional(), z.string().optional()]),
  
  status: z.enum(["draft", "active", "completed", "cancelled"]).default("draft"),
  
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export const insertCampaignSchema = campaignSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  status: true
});

// Match type definitions
export const matchSchema = z.object({
  id: z.number(),
  athlete_id: z.number(),
  business_id: z.number(),
  campaign_id: z.number(),
  
  score: z.number(),
  reason: z.string(),
  strength_areas: z.array(z.string()).optional(),
  weakness_areas: z.array(z.string()).optional(),
  
  audience_fit_score: z.number().optional(),
  content_style_fit_score: z.number().optional(),
  brand_value_alignment_score: z.number().optional(),
  engagement_potential_score: z.number().optional(),
  compensation_fit_score: z.number().optional(),
  academic_alignment_score: z.number().optional(),
  geographic_fit_score: z.number().optional(),
  timing_compatibility_score: z.number().optional(),
  platform_specialization_score: z.number().optional(),
  
  status: z.enum(["pending", "accepted", "declined", "completed"]).default("pending"),
  athlete_response: z.string().optional(),
  business_response: z.string().optional(),
  compliance_status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  compliance_officer_id: z.number().optional(),
  compliance_notes: z.string().optional(),
  
  matched_at: z.date().optional(),
  responded_at: z.date().optional(),
  approved_at: z.date().optional(),
  completed_at: z.date().optional(),
  created_at: z.date().optional()
});

export const insertMatchSchema = matchSchema.omit({
  id: true,
  created_at: true,
  status: true,
  compliance_status: true,
  matched_at: true,
  responded_at: true,
  approved_at: true,
  completed_at: true
});

// Message type definitions
export const messageSchema = z.object({
  id: z.number(),
  session_id: z.string(),
  user_id: z.number().optional(),
  role: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  created_at: z.date().optional()
});

export const insertMessageSchema = messageSchema.omit({
  id: true,
  created_at: true
});

// Compliance Officer type definitions
export const complianceOfficerSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  email: z.string().email(),
  institution: z.string(),
  department: z.string(),
  title: z.string(),
  permissions: z.record(z.any()).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export const insertComplianceOfficerSchema = complianceOfficerSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  permissions: true
});

// Partnership Offer type definitions
export const partnershipOfferSchema = z.object({
  id: z.number(),
  match_id: z.number(),
  business_id: z.number(),
  athlete_id: z.number(),
  campaign_id: z.number(),
  
  compensation_type: z.enum(['monetary', 'product', 'affiliate', 'hybrid']),
  offer_amount: z.string(),
  payment_schedule: z.string().optional(),
  bonus_structure: z.string().optional(),
  
  deliverables: z.array(z.string()),
  content_specifications: z.string().optional(),
  post_frequency: z.string().optional(),
  approval_process: z.string().optional(),
  
  usage_rights: z.string(),
  term: z.string(),
  exclusivity: z.string().optional(),
  geographic_restrictions: z.string().optional(),
  
  status: z.enum(["pending", "accepted", "declined", "expired"]).default("pending"),
  athlete_viewed_at: z.date().optional(),
  athlete_responded_at: z.date().optional(),
  business_updated_at: z.date().optional(),
  
  compliance_status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  compliance_notes: z.string().optional(),
  compliance_reviewed_at: z.date().optional(),
  
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  expires_at: z.date().optional()
});

export const insertPartnershipOfferSchema = partnershipOfferSchema.omit({
  id: true,
  status: true,
  compliance_status: true,
  created_at: true,
  updated_at: true,
  athlete_viewed_at: true,
  athlete_responded_at: true,
  business_updated_at: true,
  compliance_reviewed_at: true
});

// Feedback type definitions
export const feedbackSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  user_type: z.enum(["athlete", "business", "compliance", "admin"]),
  match_id: z.number().optional(),
  partnership_id: z.number().optional(),
  rating: z.number().min(1).max(5),
  category: z.string(),
  title: z.string(),
  content: z.string(),
  response: z.string().optional(),
  status: z.enum(["pending", "resolved", "rejected"]).default("pending"),
  public: z.boolean().default(false),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  response_by: z.number().optional()
});

export const insertFeedbackSchema = feedbackSchema.omit({
  id: true,
  status: true,
  created_at: true,
  updated_at: true,
  response: true,
  response_by: true
});

// Type inferences
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Session = z.infer<typeof sessionSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Athlete = z.infer<typeof athleteSchema>;
export type InsertAthlete = z.infer<typeof insertAthleteSchema>;

export type Business = z.infer<typeof businessSchema>;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;

export type Campaign = z.infer<typeof campaignSchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Match = z.infer<typeof matchSchema>;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type ComplianceOfficer = z.infer<typeof complianceOfficerSchema>;
export type InsertComplianceOfficer = z.infer<typeof insertComplianceOfficerSchema>;

export type PartnershipOffer = z.infer<typeof partnershipOfferSchema>;
export type InsertPartnershipOffer = z.infer<typeof insertPartnershipOfferSchema>;

export type Feedback = z.infer<typeof feedbackSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export interface MessageMetadata {
  [key: string]: unknown;
  unread?: boolean;
  sessionData?: unknown;
  userId?: number | null;
  userType?: string | null;
}
