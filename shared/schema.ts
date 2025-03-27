import { pgTable, text, serial, integer, jsonb, timestamp, real, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Sessions
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userType: text("user_type"),
  data: jsonb("data"),
  profileCompleted: boolean("profile_completed").default(false),
  athleteId: integer("athlete_id"),
  businessId: integer("business_id"),
  lastLogin: timestamp("last_login").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

// Authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  userType: text("user_type").notNull(),
  sessionId: text("session_id"),
  verified: boolean("verified").default(false),
  avatar: text("avatar"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verified: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

// Athlete Profiles
export const athletes = pgTable("athlete_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  sessionId: text("session_id").notNull(),
  name: text("name").notNull(),
  
  // Basic Information
  email: text("email"),
  phone: text("phone"),
  birthdate: date("birthdate"),
  gender: text("gender"),
  bio: text("bio"),
  
  // Academic Information
  school: text("school").notNull(),
  division: text("division").notNull(),
  graduationYear: integer("graduation_year"),
  major: text("major"),
  gpa: real("gpa"),
  academicHonors: text("academic_honors"),
  
  // Athletic Information
  sport: text("sport").notNull(),
  position: text("position"),
  sportAchievements: text("sport_achievements"),
  stats: jsonb("stats"),
  
  // Social Media
  socialHandles: jsonb("social_handles"),
  
  // Social Media OAuth Connections
  socialConnections: jsonb("social_connections"), // Store OAuth tokens and connection status
  instagramMetrics: jsonb("instagram_metrics"), // Store cached metrics from Instagram
  twitterMetrics: jsonb("twitter_metrics"), // Store cached metrics from Twitter
  tiktokMetrics: jsonb("tiktok_metrics"), // Store cached metrics from TikTok
  lastMetricsUpdate: timestamp("last_metrics_update"), // Timestamp of last metrics update
  
  // Profile Link Settings
  profileLinkEnabled: boolean("profile_link_enabled").default(false),
  profileLinkId: text("profile_link_id"),
  profileLinkTheme: text("profile_link_theme").default("default"),
  profileLinkBackgroundColor: text("profile_link_background_color").default("#111111"),
  profileLinkTextColor: text("profile_link_text_color").default("#ffffff"),
  profileLinkAccentColor: text("profile_link_accent_color").default("#ff4500"),
  profileLinkBio: text("profile_link_bio"),
  profileLinkPhotoUrl: text("profile_link_photo_url"),
  profileLinkButtons: jsonb("profile_link_buttons"),
  followerCount: integer("follower_count").notNull(),
  averageEngagementRate: real("average_engagement_rate"),
  contentQuality: integer("content_quality"), // 1-10 rating
  postFrequency: text("post_frequency"), // daily, weekly, etc.
  
  // Content Creation
  contentStyle: text("content_style").notNull(),
  contentTypes: jsonb("content_types"), // video, photo, blog, etc
  topPerformingContentThemes: jsonb("top_performing_content_themes"),
  mediaKit: text("media_kit_url"),
  
  // Brand Preferences
  compensationGoals: text("compensation_goals").notNull(),
  preferredProductCategories: jsonb("preferred_product_categories"),
  previousBrandDeals: jsonb("previous_brand_deals"),
  availableForTravel: boolean("available_for_travel"),
  exclusivityRequirements: text("exclusivity_requirements"),
  
  // Personal Brand
  personalValues: jsonb("personal_values"),
  causes: jsonb("causes"),
  brandPersonality: jsonb("brand_personality"), // assessments of personality traits
  
  // Availability & Requirements
  availabilityTimeframe: text("availability_timeframe"),
  minimumCompensation: text("minimum_compensation"),
  
  // Preferences and Algorithm Data
  preferences: jsonb("preferences"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

// Business Profiles
export const businesses = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  sessionId: text("session_id").notNull(),
  
  // Basic Information
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  industry: text("industry"),
  companySize: text("company_size"),
  foundedYear: integer("founded_year"),
  website: text("website"),
  logo: text("logo_url"),
  
  // Product Information
  productType: text("product_type").notNull(),
  productDescription: text("product_description"),
  productImages: jsonb("product_images"),
  pricingTier: text("pricing_tier"), // premium, mid-range, budget
  
  // Marketing Information
  audienceGoals: text("audience_goals").notNull(),
  audienceDemographics: jsonb("audience_demographics"),
  primaryAudienceAgeRange: text("primary_audience_age_range"),
  secondaryAudienceAgeRange: text("secondary_audience_age_range"),
  
  // Campaign Details
  campaignVibe: text("campaign_vibe").notNull(),
  campaignGoals: jsonb("campaign_goals"),
  campaignFrequency: text("campaign_frequency"),
  campaignDuration: text("campaign_duration"),
  campaignSeasonality: text("campaign_seasonality"),
  campaignTimeline: text("campaign_timeline"),
  
  // Brand Information
  values: text("values").notNull(),
  brandVoice: text("brand_voice"),
  brandColors: jsonb("brand_colors"),
  brandGuidelines: text("brand_guidelines_url"),
  sustainabilityFocus: boolean("sustainability_focus"),
  
  // Athletic Targeting
  targetSchoolsSports: text("target_schools_sports").notNull(),
  preferredSports: jsonb("preferred_sports"),
  preferredDivisions: jsonb("preferred_divisions"),
  preferredRegions: jsonb("preferred_regions"),
  
  // Budget and Compensation
  budget: text("budget"),
  compensationModel: text("compensation_model"), // monetary, product, affiliate, etc.
  budgetPerAthlete: text("budget_per_athlete"),
  
  // Previous Experience
  previousInfluencerCampaigns: jsonb("previous_influencer_campaigns"),
  campaignSuccessMetrics: jsonb("campaign_success_metrics"),
  
  // Preferences and Algorithm Data
  preferences: jsonb("preferences"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

// Campaigns
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id").notNull(),
  
  // Campaign Overview
  title: text("title").notNull(),
  description: text("description").notNull(),
  campaignBrief: text("campaign_brief"),
  campaignType: text("campaign_type"), // ongoing, one-time, seasonal
  
  // Deliverables and Requirements
  deliverables: jsonb("deliverables").notNull(),
  contentRequirements: jsonb("content_requirements"),
  brandMentionRequirements: text("brand_mention_requirements"),
  hashtagRequirements: jsonb("hashtag_requirements"),
  exclusivityClause: text("exclusivity_clause"),
  
  // Timeline
  startDate: date("start_date"),
  endDate: date("end_date"),
  submissionDeadlines: jsonb("submission_deadlines"),
  
  // Targeting
  targetAudience: jsonb("target_audience"),
  targetSports: jsonb("target_sports"),
  targetDivisions: jsonb("target_divisions"),
  targetRegions: jsonb("target_regions"),
  targetFollowerCounts: jsonb("target_follower_counts"),
  targetEngagementRates: jsonb("target_engagement_rates"),
  
  // Budget
  budget: text("budget"),
  compensationDetails: jsonb("compensation_details"),
  
  // Performance
  kpis: jsonb("kpis"), // Key Performance Indicators
  goals: jsonb("goals"),
  
  // Status
  status: text("status").default("draft"), // draft, active, completed, cancelled
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

// Match Scores
export const matches = pgTable("match_scores", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  businessId: integer("business_id").notNull(),
  campaignId: integer("campaign_id").notNull(),
  
  // Match Details
  score: real("score").notNull(),
  reason: text("reason").notNull(),
  strengthAreas: jsonb("strength_areas"),
  weaknessAreas: jsonb("weakness_areas"),
  
  // AI Analysis
  audienceFitScore: real("audience_fit_score"),
  contentStyleFitScore: real("content_style_fit_score"),
  brandValueAlignmentScore: real("brand_value_alignment_score"),
  engagementPotentialScore: real("engagement_potential_score"),
  compensationFitScore: real("compensation_fit_score"),
  
  // Status
  status: text("status").default("pending"), // pending, accepted, declined, completed
  athleteResponse: text("athlete_response"),
  businessResponse: text("business_response"),
  complianceStatus: text("compliance_status").default("pending"), // pending, approved, rejected
  complianceOfficerId: integer("compliance_officer_id"),
  complianceNotes: text("compliance_notes"),
  
  // Timestamps
  matchedAt: timestamp("matched_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  approvedAt: timestamp("approved_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
  status: true,
  matchedAt: true,
  respondedAt: true,
  approvedAt: true,
  completedAt: true,
});

// Messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Compliance Officer Profiles
export const complianceOfficers = pgTable("compliance_officers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  institution: text("institution").notNull(),
  department: text("department").notNull(),
  title: text("title").notNull(),
  permissions: jsonb("permissions"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertComplianceOfficerSchema = createInsertSchema(complianceOfficers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

// Type definitions
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Athlete = typeof athletes.$inferSelect;
export type InsertAthlete = z.infer<typeof insertAthleteSchema>;

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = z.infer<typeof insertBusinessSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type ComplianceOfficer = typeof complianceOfficers.$inferSelect;
export type InsertComplianceOfficer = z.infer<typeof insertComplianceOfficerSchema>;

// Feedback system
export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  userType: text("user_type").notNull(), // athlete, business, compliance
  feedbackType: text("feedback_type").notNull(), // general, match, feature, bug, other
  matchId: integer("match_id").references(() => matches.id),
  rating: integer("rating"), // 1-5 star rating
  title: text("title").notNull(),
  content: text("content").notNull(),
  sentiment: text("sentiment"), // positive, negative, neutral (can be generated via AI)
  status: text("status").default("pending").notNull(), // pending, reviewed, implemented, rejected
  isPublic: boolean("is_public").default(false), // whether this feedback can be shown publicly
  adminResponse: text("admin_response"), // response from admin to the feedback
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({
  id: true,
  sentiment: true,
  status: true,
  adminResponse: true,
  createdAt: true,
  updatedAt: true,
});

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
