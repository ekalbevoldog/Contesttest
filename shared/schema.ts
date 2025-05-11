
// schema.ts - Type definitions for the data model

import { z } from "zod";

// User type definitions
export const userSchema = z.object({
  
  id: z.string().uuid().optional(), // Supabase auth id reference
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

// Create User type from schema with additional fields for compatibility
export type User = z.infer<typeof userSchema> & DateFields & {
  stripe_id?: string;  // Additional field
  sessionId?: string;  // Alternative to session_id
};

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
  user_type: z.enum().optional(),
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

// Session types
export type Session = z.infer<typeof sessionSchema> & DateFields & {
  sessionId?: string; // Alternative to session_id
  userId?: string | number; // Alternative to user_id
  userType?: string; // Alternative to user_type
  profileCompleted?: boolean; // Alternative to profile_completed
  athleteId?: number; // Additional field
  businessId?: number; // Additional field
};
export type InsertSession = z.infer<typeof insertSessionSchema>;

// Athlete profile type definitions
export const athleteSchema = z.object({
  id: z.number(),
  auth_id: z.string().uuid().optional(), // Use auth_id to reference Supabase user
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

// Athlete types
export type Athlete = z.infer<typeof athleteSchema> & DateFields & {
  userId?: string | number;  // Additional field for compatibility
  sessionId?: string;  // Alternative to session_id
  followerCount?: number;  // Alternative to follower_count
  contentStyle?: string;  // Alternative to content_style
  compensationGoals?: string;  // Alternative to compensation_goals
};
export type InsertAthlete = z.infer<typeof insertAthleteSchema> & {
  sessionId?: string;
  followerCount?: number;
  contentStyle?: string;
  compensationGoals?: string;
};

// Business profile type definitions
export const businessSchema = z.object({
  id: z.number(),
  auth_id: z.string().uuid().optional(), // Use auth_id to reference Supabase user
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
  budgetmin: z.number().optional(),
  budgetmax: z.number().optional(),
  compensation_model: z.string().optional(),
  budget_per_athlete: z.string().optional(),
  
  // Previous Experience
  haspreviouspartnerships: z.boolean().optional(),
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

// Business types - with camelCase alternatives 
export type Business = z.infer<typeof businessSchema> & DateFields & {
  userId?: string | number;  // Alternative to auth_id
  sessionId?: string;  // Alternative to session_id
  productType?: string;  // Alternative to product_type
  audienceGoals?: string;  // Alternative to audience_goals
  campaignVibe?: string;  // Alternative to campaign_vibe
  targetSchoolsSports?: string;  // Alternative to target_schools_sports
};
export type InsertBusiness = z.infer<typeof insertBusinessSchema> & {
  sessionId?: string;  // Alternative to session_id
  productType?: string;  // Alternative to product_type
  audienceGoals?: string;  // Alternative to audience_goals
  campaignVibe?: string;  // Alternative to campaign_vibe
  targetSchoolsSports?: string;  // Alternative to target_schools_sports
};

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
  auth_id: z.string().uuid().optional(), // Use auth_id to reference Supabase user
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
  auth_id: z.string().uuid().optional(), // Use auth_id to reference Supabase user
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

// Update Campaign type with camelCase alternative
export type Campaign = z.infer<typeof campaignSchema> & DateFields & {
  businessId?: number;  // Alternative to business_id
  createdAt?: Date;  // Alternative to created_at
  updatedAt?: Date;  // Alternative to updated_at
};
export type InsertCampaign = z.infer<typeof insertCampaignSchema> & {
  businessId?: number;  // Alternative to business_id
};

// Update Match type with camelCase alternatives
export type Match = z.infer<typeof matchSchema> & DateFields & {
  athleteId?: number;  // Alternative to athlete_id
  businessId?: number;  // Alternative to business_id
  campaignId?: number;  // Alternative to campaign_id
};
export type InsertMatch = z.infer<typeof insertMatchSchema> & {
  athleteId?: number;  // Alternative to athlete_id
  businessId?: number;  // Alternative to business_id
  campaignId?: number;  // Alternative to campaign_id
};

// Update Message type with camelCase alternative
export type Message = z.infer<typeof messageSchema> & DateFields & {
  sessionId?: string;  // Alternative to session_id
};
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Update PartnershipOffer type with camelCase alternatives
export type PartnershipOffer = z.infer<typeof partnershipOfferSchema> & DateFields & {
  matchId?: number;  // Alternative to match_id
  businessId?: number;  // Alternative to business_id
  athleteId?: number;  // Alternative to athlete_id
  campaignId?: number;  // Alternative to campaign_id
  compensationType?: string;  // Alternative to compensation_type
  offerAmount?: string;  // Alternative to offer_amount
  usageRights?: string;  // Alternative to usage_rights
};
export type InsertPartnershipOffer = z.infer<typeof insertPartnershipOfferSchema> & {
  matchId?: number;  // Alternative to match_id
  businessId?: number;  // Alternative to business_id
  athleteId?: number;  // Alternative to athlete_id
  campaignId?: number;  // Alternative to campaign_id
  compensationType?: string;  // Alternative to compensation_type
  offerAmount?: string;  // Alternative to offer_amount
  usageRights?: string;  // Alternative to usage_rights
};

// Update Feedback type with camelCase alternatives
export type Feedback = z.infer<typeof feedbackSchema> & DateFields & {
  userId?: number;  // Additional field
  userType?: string;  // Alternative to user_type
  matchId?: number;  // Alternative to match_id
  feedbackType?: string;  // Additional field
};
export type InsertFeedback = z.infer<typeof insertFeedbackSchema> & {
  userId?: number;  // Additional field
  userType?: string;  // Alternative to user_type
  matchId?: number;  // Alternative to match_id
  feedbackType?: string;  // Additional field
};

// Add interface for Stripe-related code
export interface StripeInterface {
  // Basic interface to help TypeScript with Stripe-related code
  id: string;
  object: string;
  [key: string]: any;
}

// Add generic interface for datetime compatibility
export interface DateFields {
  createdAt?: Date;  // camelCase alternative to created_at
  updatedAt?: Date;  // camelCase alternative to updated_at
  lastLogin?: Date;  // camelCase alternative to last_login
}

// Add InsertUser type that was previously removed
export type InsertUser = z.infer<typeof insertUserSchema>;

export interface MessageMetadata {
  [key: string]: unknown;
  unread?: boolean;
  sessionData?: unknown;
  userId?: number | null;
  userType?: string | null;
}
