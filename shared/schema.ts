
import { z } from "zod";

// Schema for session creation
export const sessionCreateSchema = z.object({});

// Schema for message sending
export const messageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  sessionId: z.string().min(1, "Session ID is required"),
});

// Schema for session reset
export const sessionResetSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

// Schema for feedback submission
export const insertFeedbackSchema = z.object({
  userId: z.number(),
  userType: z.string(),
  feedbackType: z.string(),
  matchId: z.number().optional(),
  rating: z.number().optional(),
  title: z.string(),
  content: z.string(),
  isPublic: z.boolean().optional()
});

export type Feedback = {
  id: number;
  userId: number;
  userType: string;
  feedbackType: string;
  matchId?: number;
  rating?: number;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};
