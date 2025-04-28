// schema.ts - Type definitions for the data model

import { z } from "zod";

// User type definitions
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  username: z.string(),
  password: z.string(),
  role: z.enum(["athlete", "business", "compliance", "admin"]),
  created_at: z.date().optional(),
  last_login: z.date().optional(),
  auth_id: z.string().optional()
});

export const insertUserSchema = userSchema.omit({ 
  id: true, 
  created_at: true, 
  last_login: true,
  auth_id: true 
}).extend({
  confirmPassword: z.string().min(8, "Password must be at least 8 characters")
});

// Session type definitions
export const sessionSchema = z.object({
  id: z.number(),
  sessionId: z.string(),
  userType: z.string().optional(),
  data: z.record(z.any()).optional(),
  profileCompleted: z.boolean().default(false),
  athleteId: z.number().optional(),
  businessId: z.number().optional(),
  lastLogin: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const insertSessionSchema = sessionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true
});

// Athlete profile type definitions
export const athleteSchema = z.object({
  id: z.number(),
  userId: z.string().uuid().optional(), // UUID string from Supabase Auth
  sessionId: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  school: z.string(),
  division: z.string(),
  sport: z.string(),
  followerCount: z.number().default(0),
  contentStyle: z.string(),
  compensationGoals: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  contentTypes: z.array(z.string()).optional(),
  personalValues: z.array(z.string()).optional(),
  preferences: z.record(z.any()).optional(),
});

export const insertAthleteSchema = athleteSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true
});

// Business profile type definitions
export const businessSchema = z.object({
  id: z.number(),
  userId: z.string().uuid().optional(), // UUID string from Supabase Auth
  sessionId: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  productType: z.string(),
  audienceGoals: z.string(),
  campaignVibe: z.string(),
  values: z.string(),
  targetSchoolsSports: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const insertBusinessSchema = businessSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true
});

// Campaign type definitions
export const campaignSchema = z.object({
  id: z.number(),
  businessId: z.number(),
  title: z.string(),
  description: z.string(),
  deliverables: z.array(z.string()),
  status: z.enum(["draft", "active", "completed", "cancelled"]).default("draft"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const insertCampaignSchema = campaignSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true
});

// Match type definitions
export const matchSchema = z.object({
  id: z.number(),
  athleteId: z.number(),
  businessId: z.number(),
  campaignId: z.number(),
  score: z.number(),
  reason: z.string(),
  status: z.enum(["pending", "accepted", "declined", "completed"]).default("pending"),
  createdAt: z.date().optional()
});

export const insertMatchSchema = matchSchema.omit({
  id: true,
  createdAt: true,
  status: true
});

// Message type definitions
export const messageSchema = z.object({
  id: z.number(),
  sessionId: z.string(),
  role: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date().optional()
});

export const insertMessageSchema = messageSchema.omit({
  id: true,
  createdAt: true
});

// Compliance Officer type definitions
export const complianceOfficerSchema = z.object({
  id: z.number(),
  userId: z.string().uuid().optional(), // UUID string from Supabase Auth
  name: z.string(),
  email: z.string().email(),
  institution: z.string(),
  department: z.string(),
  title: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const insertComplianceOfficerSchema = complianceOfficerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true
});

// Partnership Offer type definitions
export const partnershipOfferSchema = z.object({
  id: z.number(),
  matchId: z.number(),
  businessId: z.number(),
  athleteId: z.number(),
  campaignId: z.number(),
  compensationType: z.string(),
  offerAmount: z.string(),
  usageRights: z.string(),
  term: z.string(),
  status: z.enum(["pending", "accepted", "declined", "expired"]).default("pending"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const insertPartnershipOfferSchema = partnershipOfferSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true
});

// Feedback type definitions
export const feedbackSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(), // UUID string from Supabase Auth
  userType: z.string(),
  matchId: z.number().optional(),
  feedbackType: z.string(),
  content: z.string(),
  status: z.enum(["pending", "reviewed", "addressed"]).default("pending"),
  createdAt: z.date().optional()
});

export const insertFeedbackSchema = feedbackSchema.omit({
  id: true,
  status: true,
  createdAt: true
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
  userId?: string | null;
  userType?: string | null;
}