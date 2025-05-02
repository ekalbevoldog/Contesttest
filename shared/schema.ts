
// schema.ts - Type definitions for the data model

import { z } from "zod";

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
