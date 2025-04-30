import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { db } from "./db.js";
// Use local schema module instead of @shared to fix production build path resolution
import * as schema from "../shared/schema.js";
// Use services
import { geminiService } from "./services/geminiService.js";
import { sessionService } from "./services/sessionService.js";
// Import Supabase auth
import { supabase } from "./supabase.js";
import { setupSupabaseAuth, verifySupabaseToken } from "./supabaseAuth.js";
import { pool, db as supabaseAdmin } from "./db.js";
// Import auth fixes
import { ensureBusinessProfile } from "./auth-fixes/auto-create-business-profile.js";
// Import dashboard API router
import { dashboardRouter } from "./dashboard-api.js";

// Mock service for BigQuery
const bigQueryService = {
  insertAthleteProfile: async (data: any) => {
    console.log("BigQuery: Inserted athlete profile", data);
    return true;
  },
  insertBusinessProfile: async (data: any) => {
    console.log("BigQuery: Inserted business profile", data);
    return true;
  },
  insertCampaign: async (data: any) => {
    console.log("BigQuery: Inserted campaign", data);
    return true;
  },
  insertMatchScore: async (data: any) => {
    console.log("BigQuery: Inserted match score", data);
    return true;
  }
};
import { z } from "zod";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { WebSocketServer, WebSocket } from "ws";

// Extend the WebSocket type to include userData
interface CustomWebSocket extends WebSocket {
  userData?: {
    role: 'athlete' | 'business' | 'compliance' | 'admin';
    userId?: string;
    sessionId?: string; // Add sessionId to track connections by session
  };
}

// Helper for password hashing
const scryptAsync = promisify(scrypt);

// Password hashing function
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Password comparison function
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    // Check if the password includes a salt
    if (stored.includes('.')) {
      const [hashed, salt] = stored.split('.');
      const hashedBuf = Buffer.from(hashed, 'hex');
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } else {
      // Legacy format or plain-text comparison (for testing)
      return supplied === stored;
    }
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}
import { setupAuth } from "./auth";
// Use local schema import instead of @shared alias to fix production build
import { insertFeedbackSchema, Feedback } from "../shared/schema.js";

// Map to store active WebSocket connections by session ID
import { websocketService } from './services/websocketService';

// Map to store connected WebSocket clients (legacy approach)
// Store WebSocket connections - old method (legacy)
const connectedClients = new Map<string, CustomWebSocket>();

// Store WebSocket connections - new method (supports multiple connections per session)
const wsConnections = new Map<string, Set<CustomWebSocket>>();

// Map to store pending messages for sessions without active connections
const pendingMessageQueue = new Map<string, any[]>();

// Helper function to broadcast a message to all connections for a session
function broadcastToSession(sessionId: string, message: any): boolean {
  let delivered = false;

  try {
    // Check new connection map first 
    const connections = wsConnections.get(sessionId);
    if (connections && connections.size > 0) {
      console.log(`Broadcasting message to ${connections.size} clients for session ${sessionId}`);

      connections.forEach((conn: CustomWebSocket) => {
        if (conn.readyState === WebSocket.OPEN) {
          try {
            conn.send(JSON.stringify(message));
            delivered = true;
          } catch (error) {
            console.error('Error sending message to client:', error);
          }
        }
      });
    }

    // Also try legacy connection map
    const legacyConnection = connectedClients.get(sessionId);
    if (legacyConnection && legacyConnection.readyState === WebSocket.OPEN) {
      try {
        legacyConnection.send(JSON.stringify(message));
        delivered = true;
      } catch (error) {
        console.error('Error sending message to legacy client:', error);
      }
    }

    // If we couldn't deliver, queue the message for later delivery
    if (!delivered) {
      console.log(`No active connections for session ${sessionId}, queueing message`);

      if (!pendingMessageQueue.has(sessionId)) {
        pendingMessageQueue.set(sessionId, []);
      }

      // Add to pending queue with a timestamp
      pendingMessageQueue.get(sessionId)?.push({
        ...message,
        _queuedAt: new Date().toISOString()
      });

      // Limit queue size to prevent memory issues
      const queue = pendingMessageQueue.get(sessionId);
      if (queue && queue.length > 50) {
        queue.shift(); // Remove oldest message if queue gets too large
      }
    }

    return delivered;
  } catch (error) {
    console.error('Error broadcasting message:', error);

    return false;
  }
}

// Schema for session creation
const sessionCreateSchema = z.object({});

// Schema for message sending
const messageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  sessionId: z.string().min(1, "Session ID is required"),
});

// Schema for session reset
const sessionResetSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

// Schema for profile submission
const profileSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  userType: z.enum(["athlete", "business"], { 
    required_error: "User type must be either 'athlete' or 'business'" 
  }),
  name: z.string().min(2, "Name is required"),
}).and(
  z.union([
    // Athlete specific fields
    z.object({
      userType: z.literal("athlete"),
      sport: z.string().min(1, "Sport is required"),
      division: z.string().min(1, "Division is required"),
      school: z.string().min(2, "School is required"),
      socialHandles: z.string().optional(),
      followerCount: z.string().transform(val => parseInt(val)),
      contentStyle: z.string().min(10, "Content style description is required"),
      compensationGoals: z.string().min(10, "Compensation goals are required"),
    }),
    // Business specific fields
    z.object({
      userType: z.literal("business"),
      businessType: z.string().optional(),
      industry: z.string().optional(),
      goals: z.array(z.string()).optional().or(z.string()),
      hasPreviousPartnerships: z.boolean().optional(),
      zipCode: z.string().optional(),
      budgetMin: z.number().optional().or(z.string().transform(Number)),
      budgetMax: z.number().optional().or(z.string().transform(Number)),
      contactName: z.string().optional(),
      contactTitle: z.string().optional(),
      businessSize: z.string().optional(),
      // Keep backward compatibility with old fields
      productType: z.string().optional(),
      audienceGoals: z.string().optional(),
      campaignVibe: z.string().optional(),
      values: z.string().optional(),
      targetSchoolsSports: z.string().optional(),
      budget: z.string().optional(),
    })
  ])
);

// Helper middleware to check if user is authenticated and has specific role
const checkUserAuth = (requiredRole: string | null = null) => async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.passport || !req.session.passport.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (requiredRole) {
    try {
      const user = await storage.getUser(req.session.passport.user);
      if (!user || user.role !== requiredRole) {
        return res.status(403).json({ error: `${requiredRole} access required` });
      }

      // Attach the user to the request for convenience in route handlers
      req.user = user;
    } catch (err) {
      console.error("Error checking user role:", err);
      return res.status(500).json({ error: "Server error checking permissions" });
    }
  }

  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Debug middleware to log all requests and their bodies
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[DEBUG] ${req.method} ${req.path}`);
    if (req.method === 'POST' && req.path.includes('/api/auth/')) {
      console.log('[DEBUG] Request headers:', req.headers);
      console.log('[DEBUG] Request body:', req.body);
      console.log('[DEBUG] Request body type:', typeof req.body);
      if (req.body === null || req.body === undefined) {
        console.log('[DEBUG] Body parser may not be properly set up');
      }
    }
    next();
  });

  // Setup both authentication methods
  // 1. Traditional passport-local authentication
  setupAuth(app);
  
  // 2. Supabase authentication (JWT)
  setupSupabaseAuth(app);
  
  // Register dashboard API endpoints
  app.use('/api/dashboard', dashboardRouter);
  
  // Register the business profile auto-creation endpoint
  app.post('/api/create-business-profile', async (req: Request, res: Response) => {
    try {
      const { userId, role, email } = req.body;
      
      if (!userId || !role) {
        return res.status(400).json({ error: 'userId and role are required' });
      }
      
      console.log(`[API] Attempting to ensure business profile for user ${userId} with role ${role}`);
      
      const success = await ensureBusinessProfile(userId, role);
      
      if (success) {
        return res.status(200).json({ success: true, message: 'Business profile created/verified' });
      } else {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create business profile',
          message: 'The system was unable to create or verify the business profile'
        });
      }
    } catch (error) {
      console.error('[API] Error creating business profile:', error);
      return res.status(500).json({ error: 'Unexpected error creating business profile' });
    }
  });
  
  // Get business profile by user ID
  app.get('/api/business-profile/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      
      console.log(`[API] Fetching business profile for user ${userId}`);
      
      // First, find the user by auth_id to get the internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();
        
      if (userError) {
        console.error('[API] Error finding user by auth_id:', userError);
        return res.status(500).json({ error: 'Error finding user' });
      }
      
      if (!userData) {
        console.log(`[API] No user found with auth_id: ${userId}`);
        return res.status(404).json({
          error: 'User not found',
          message: 'No user exists with this ID',
          userId
        });
      }
      
      // Now look up business profile with the internal user ID
      let { data: profile, error: profileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('[API] Error fetching business profile with id field:', profileError);
        return res.status(500).json({ error: 'Error fetching business profile' });
      }
      
      if (!profile) {
        console.log(`[API] No business profile found for user ${userId} with either user_id or id field`);
        return res.status(404).json({ 
          error: 'Business profile not found',
          message: 'No business profile exists for this user',
          userId 
        });
      }
      
      console.log(`[API] Found business profile for user ${userId}:`, profile);
      return res.status(200).json({ profile });
    } catch (error) {
      console.error('[API] Unexpected error fetching business profile:', error);
      return res.status(500).json({ error: 'Unexpected error fetching business profile' });
    }
  });
  
  // API diagnostic health check
  app.get('/api/diagnostic/check', async (req: Request, res: Response) => {
    try {
      console.log('Diagnostic API health check');
      
      // Check Supabase connection
      const { data: health, error: healthError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (healthError) {
        console.error('Supabase connection error:', healthError);
        return res.status(500).json({ 
          status: 'error', 
          supabase: false,
          error: healthError.message 
        });
      }
      
      // Check business_profiles table structure
      const { data: profilesCheck, error: profilesError } = await supabase
        .from('business_profiles')
        .select('*')
        .limit(1);
      
      return res.status(200).json({
        status: 'ok',
        supabase: true,
        businessProfilesAccessible: !profilesError,
        timestamp: new Date().toISOString(),
        profilesError: profilesError ? profilesError.message : null
      });
    } catch (error) {
      console.error('Error in diagnostic endpoint:', error);
      return res.status(500).json({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Health check endpoint to verify Supabase connectivity
  app.get("/api/health-check", async (req: Request, res: Response) => {
    try {
      // Check basic server health
      const serverHealth = { status: "ok", timestamp: new Date().toISOString() };
      
      // Check Supabase connection
      let supabaseHealth = { status: "unknown", error: null };
      try {
        const { data, error } = await supabase.from('users').select('*').limit(1);
        supabaseHealth = {
          status: error ? "error" : "ok",
          error: error ? error.message : null,
          usersTableAccessible: !error
        };
      } catch (err) {
        supabaseHealth = {
          status: "error",
          error: err instanceof Error ? err.message : String(err)
        };
      }

      // Check auth service
      let authHealth = { status: "unknown", error: null };
      try {
        const { data, error } = await supabase.auth.getSession();
        authHealth = {
          status: error ? "error" : "ok",
          error: error ? error.message : null,
          hasSession: !!data.session
        };
      } catch (err) {
        authHealth = {
          status: "error",
          error: err instanceof Error ? err.message : String(err)
        };
      }

      return res.status(200).json({
        server: serverHealth,
        supabase: supabaseHealth,
        auth: authHealth,
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY
        }
      });
    } catch (error) {
      console.error("Health check error:", error);
      return res.status(500).json({
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to list all business profiles - DEBUG ONLY
  app.get('/api/admin/business-profiles', async (req: Request, res: Response) => {
    try {
      console.log('Listing all business profiles - debug mode');
      
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .limit(50);
      
      if (error) {
        console.error('Error fetching business profiles list:', error);
        return res.status(500).json({ error: 'Failed to fetch business profiles' });
      }
      
      return res.status(200).json({ profiles: data || [] });
    } catch (error) {
      console.error('Error in business profiles list endpoint:', error);
      return res.status(500).json({ error: 'Server error processing request' });
    }
  });

  // Endpoint to get business profile from Supabase directly
  app.get('/api/supabase/business-profile/:userId', async (req: Request, res: Response) => {
    try {
      console.log('Business profile endpoint hit!');
      console.log('Request params:', req.params);
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      
      console.log(`[API] Fetching business profile for user ID: ${userId}`);
      
      // Check if user exists in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .maybeSingle();
      
      if (userError) {
        console.error(`Error fetching user ${userId}:`, userError);
      } else {
        console.log(`User ${userId} exists:`, !!userData);
      }
      
      // First check if the user exists
      if (!userData) {
        console.log(`No user found with ID: ${userId}`);
        return res.status(404).json({
          error: 'User not found',
          message: 'No user exists with this ID',
          userId
        });
      }
      
      // Use the user_id field to find the business profile
      console.log('Querying Supabase for business profile with user_id field...');
      let { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching business profile with id field:', error);
        return res.status(500).json({ error: 'Failed to fetch business profile' });
      }
      
      if (!data) {
        console.log(`No business profile found for user ID: ${userId} using either field`);
        return res.status(404).json({ 
          error: 'Business profile not found',
          message: 'No business profile exists for this user. Please complete onboarding first.',
          userId 
        });
      }
      
      console.log('Found business profile:', data);
      return res.status(200).json({ profile: data });
    } catch (error) {
      console.error('Error in business profile endpoint:', error);
      return res.status(500).json({ error: 'Server error processing request' });
    }
  });

  // Database schema diagnostic endpoint
  app.get("/api/db/schema/check", async (req: Request, res: Response) => {
    try {
      console.log("Checking database schema...");

      // Check if users table has auth_id column
      const { data: usersColumns, error: columnsError } = await supabase
        .from('users')
        .select('auth_id')
        .limit(1);

      let hasAuthIdColumn = !columnsError;

      console.log(`auth_id column exists: ${hasAuthIdColumn}`);

      if (!hasAuthIdColumn) {
        console.log("Attempting to add auth_id column to users table...");

        try {
          // Try to add the auth_id column using raw SQL
          const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
            sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id TEXT UNIQUE"
          });

          if (alterError) {
            console.error("Error adding auth_id column:", alterError);
            return res.status(500).json({
              message: "Failed to add auth_id column to users table",
              error: alterError
            });
          }

          console.log("auth_id column added successfully!");

          return res.status(200).json({
            message: "Database schema updated: auth_id column added to users table",
            schema: {
              hasAuthIdColumn: true,
              fixed: true
            }
          });
        } catch (alterError) {
          console.error("Exception adding auth_id column:", alterError);
          return res.status(500).json({
            message: "Exception adding auth_id column to users table",
            error: alterError instanceof Error ? alterError.message : String(alterError)
          });
        }
      }

      return res.status(200).json({
        message: "Database schema check completed",
        schema: {
          hasAuthIdColumn
        }
      });
    } catch (error) {
      console.error("Error checking database schema:", error);
      return res.status(500).json({
        message: "Failed to check database schema",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  // Create a new session
  app.post("/api/chat/session", async (req: Request, res: Response) => {
    try {
      const sessionId = createHash('sha256').update(Date.now().toString()).digest('hex').substring(0, 16);
      await sessionService.createSession(sessionId);

      return res.status(200).json({
        sessionId,
        message: "Session created successfully",
      });
    } catch (error) {
      console.error("Error creating session:", error);
      return res.status(500).json({
        message: "Failed to create session",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Reset a session
  app.post("/api/chat/reset", async (req: Request, res: Response) => {
    try {
      const { sessionId } = sessionResetSchema.parse(req.body);
      await sessionService.resetSession(sessionId);

      return res.status(200).json({
        message: "Session reset successfully",
      });
    } catch (error) {
      console.error("Error resetting session:", error);
      return res.status(500).json({
        message: "Failed to reset session",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Send a message to the chat
  app.post("/api/chat/message", async (req: Request, res: Response) => {
    try {
      const { message, sessionId } = messageSchema.parse(req.body);

      // Get current session data
      const sessionData = await sessionService.getSession(sessionId);
      if (!sessionData) {
        return res.status(404).json({
          message: "Session not found",
        });
      }

      // Store user message
      await storage.storeMessage(sessionId, "user", message);

      // Process message with Gemini
      let response;

      // Check if user type has been determined
      if (!sessionData.userType) {
        console.log(`Classifying user based on message: "${message}"`);
        // Classify user as athlete or business
        response = await geminiService.classifyUser(message);

        console.log(`User classified as: ${response.userType}`);

        // Update session with user type
        if (response.userType) {
          await sessionService.updateSession(sessionId, {
            userType: response.userType
          });

          // Log session update for debugging
          console.log(`Session ${sessionId} updated with userType: ${response.userType}`);

          // Store this interaction for debugging
          await storage.storeMessage(sessionId, "system", `User classified as: ${response.userType}`);
        }

        // Handle follow-up questions based on user type
        console.log(`Generating follow-up for ${response.userType}`);
        response = await geminiService.generateFollowUpQuestions(response.userType, response.reply);
      } else {
        // User type already known, determine the next step in conversation
        const userType = sessionData.userType;

        // Check if we should show a form
        // This logic can be expanded based on conversation state
        if (!sessionData.profileCompleted) {
          // Determine if the user message indicates readiness to complete profile
          const shouldShowForm = await geminiService.shouldShowForm(message, userType);

          if (shouldShowForm) {
            // Return the form prompt with detailed logging
            console.log(`Showing ${userType} form for session ${sessionId}`);

            // Store this interaction for debugging purposes
            await storage.storeMessage(sessionId, "system", `Triggered ${userType} form display`);

            return res.status(200).json({
              reply: userType === "athlete" 
                ? "Great! Let's create your athlete profile. Please fill out the form below to help us match you with the right businesses:" 
                : "Fantastic! Let's set up your business profile. Please complete the following details to help us find suitable athletes for your marketing campaigns:",
              isFormPrompt: true,
              showAthleteForm: userType === "athlete",
              showBusinessForm: userType === "business",
            });
          } else {
            // Continue the conversation
            // Get previous messages for this session
            const messageHistory = await storage.getMessages(sessionId);

            // Pass message history to the geminiService for context
            response = await geminiService.continueConversation(message, sessionData, messageHistory);
          }
        } else {
          // Profile is completed, continue normal conversation
          // Get previous messages for this session
          const messageHistory = await storage.getMessages(sessionId);

          // Pass message history to the geminiService for context
          response = await geminiService.continueConversation(message, sessionData, messageHistory);
        }
      }

      // Store assistant response
      const savedMessage = await storage.storeMessage(sessionId, "assistant", response.reply);

      // Send chat data to n8n webhook
      const webhookData = {
        type: "chat_message",
        sessionId: sessionId,
        userType: sessionData.userType || "unknown",
        timestamp: new Date().toISOString(),
        conversation: {
          userMessage: {
            content: message,
            timestamp: new Date().toISOString()
          },
          assistantMessage: {
            content: response.reply,
            timestamp: new Date().toISOString(),
            messageId: savedMessage.id
          }
        },
        profileCompleted: sessionData.profileCompleted || false,
        n8n_webhook_url: req.body.n8n_webhook_url // Optional custom webhook URL passed in request
      };

      // Send to webhook (non-blocking)
      sendToN8nWebhook(webhookData, req.body.n8n_webhook_url)
        .then(success => {
          if (success) {
            console.log(`Successfully sent chat data to n8n webhook for session ${sessionId}`);
          }
        })
        .catch(error => {
          console.error(`Error sending chat data to n8n webhook: ${error}`);
        });

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error processing message:", error);
      return res.status(500).json({
        message: "Failed to process message",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Submit user profile
  app.post("/api/profile", async (req: Request, res: Response) => {
    try {
      const profileData = profileSchema.parse(req.body);
      const { sessionId, userType } = profileData;

      // Get current session
      const sessionData = await sessionService.getSession(sessionId);
      if (!sessionData) {
        return res.status(404).json({
          message: "Session not found",
        });
      }

      // Store profile in appropriate collection
      if (userType === "athlete") {
        const athleteData = {
          sessionId,
          name: profileData.name,
          sport: profileData.sport,
          division: profileData.division,
          school: profileData.school,
          socialHandles: profileData.socialHandles || "",
          followerCount: profileData.followerCount,
          contentStyle: profileData.contentStyle,
          compensationGoals: profileData.compensationGoals,
        };

        // Store in local storage
        const athlete = await storage.storeAthleteProfile(athleteData);

        // Store in BigQuery
        await bigQueryService.insertAthleteProfile(athleteData);

        // Update session
        await sessionService.updateSession(sessionId, {
          profileCompleted: true,
          athleteId: athlete.id
        });

        // Generate response message
        const reply = await geminiService.generateProfileConfirmation("athlete", profileData.name);

        // Send profile creation event to n8n webhook (non-blocking)
        if (process.env.N8N_WEBHOOK_URL) {
          const webhookData = {
            event_type: "athlete_profile_created",
            timestamp: new Date().toISOString(),
            data: {
              athleteId: athlete.id,
              name: profileData.name,
              sport: profileData.sport,
              school: profileData.school,
              followerCount: profileData.followerCount
            },
            platform: "Contested"
          };

          sendToN8nWebhook(webhookData)
            .then(success => {
              if (success) {
                console.log(`Successfully sent athlete profile data to n8n webhook`);
              }
            })
            .catch(error => {
              console.error(`Error sending athlete profile data to n8n webhook: ${error}`);
            });
        }

        return res.status(200).json({
          message: "Athlete profile created successfully",
          reply,
        });
      } else if (userType === "business") {
        // Create business profile from form data with backward compatibility
        const businessData = {
          sessionId,
          name: profileData.name,
          // New fields from our form
          businessType: profileData.businessType || "product", // "product" or "service"
          industry: profileData.industry || "",
          goals: profileData.goals || [],
          hasPreviousPartnerships: profileData.hasPreviousPartnerships || false,
          budgetMin: profileData.budgetMin || 0,
          budgetMax: profileData.budgetMax || 5000,
          zipCode: profileData.zipCode || "",
          // Old fields for compatibility
          productType: profileData.productType || profileData.businessType || "product",
          audienceGoals: profileData.audienceGoals || (Array.isArray(profileData.goals) ? profileData.goals.join(", ") : String(profileData.goals || "")),
          campaignVibe: profileData.campaignVibe || "Professional",
          values: profileData.values || "Quality, Authenticity",
          targetSchoolsSports: profileData.targetSchoolsSports || "All schools",
          budget: profileData.budget || `$${profileData.budgetMin || 0}-$${profileData.budgetMax || 5000}`,
          // Additional data in preferences JSON
          preferences: JSON.stringify({
            contactName: profileData.contactName || "",
            contactTitle: profileData.contactTitle || "",
            businessSize: profileData.businessSize || ""
          })
        };

        // Store in local storage
        const business = await storage.storeBusinessProfile(businessData);

        // Store in BigQuery
        await bigQueryService.insertBusinessProfile(businessData);

        // Generate campaign using Gemini
        const campaignResponse = await geminiService.generateCampaign(businessData);

        // Store campaign
        const campaignData = {
          businessId: business.id,
          title: campaignResponse.title,
          description: campaignResponse.description,
          deliverables: campaignResponse.deliverables,
        };

        const campaign = await storage.storeCampaign(campaignData);

        // Store in BigQuery
        await bigQueryService.insertCampaign({
          ...campaignData,
          businessId: business.id,
        });

        // Update session
        await sessionService.updateSession(sessionId, {
          profileCompleted: true,
          businessId: business.id,
          campaignId: campaign.id
        });

        // Find matches if there are any athletes
        const athletes = await storage.getAllAthletes();

        if (athletes.length > 0) {
          // Get best match
          const bestMatch = await findBestMatch(athletes[0], business, campaign);

          if (bestMatch) {
            // Store in BigQuery
            await bigQueryService.insertMatchScore(bestMatch);

            // Generate response with match
            const reply = await geminiService.generateMatchAnnouncement(bestMatch.score);

            // Format match data for frontend
            const matchData = {
              id: bestMatch.id,
              score: bestMatch.score,
              brand: business.name,
              campaign: {
                title: campaign.title,
                description: campaign.description,
                deliverables: campaign.deliverables,
              },
              reason: bestMatch.reason,
            };

            // Notify the athlete via WebSocket if they're connected
            if (athletes[0].sessionId) {
              sendWebSocketMessage(athletes[0].sessionId, {
                type: 'match',
                message: `Contested Match Alert: New partnership opportunity with ${business.name}!`,
                matchData: {
                  ...matchData,
                  business: {
                    name: business.name
                  }
                }
              });
            }

            return res.status(200).json({
              message: "Business profile created and match found",
              reply,
              showMatchResults: true,
              matchData,
            });
          }
        }

        // No matches or couldn't find a match
        const reply = await geminiService.generateProfileConfirmation("business", profileData.name);

        // Send profile creation event to n8n webhook (non-blocking)
        if (process.env.N8N_WEBHOOK_URL) {
          const webhookData = {
            event_type: "business_profile_created",
            timestamp: new Date().toISOString(),
            data: {
              businessId: business.id,
              name: profileData.name,
              businessType: profileData.businessType || "product",
              industry: profileData.industry || "",
              goals: profileData.goals || [],
              hasPreviousPartnerships: profileData.hasPreviousPartnerships || false,
              budgetMin: profileData.budgetMin || 0,
              budgetMax: profileData.budgetMax || 5000,
              zipCode: profileData.zipCode || "",
              campaign: {
                title: campaign.title,
                description: campaign.description
              }
            },
            platform: "Contested"
          };

          sendToN8nWebhook(webhookData)
            .then(success => {
              if (success) {
                console.log(`Successfully sent business profile data to n8n webhook`);
              }
            })
            .catch(error => {
              console.error(`Error sending business profile data to n8n webhook: ${error}`);
            });
        }

        return res.status(200).json({
          message: "Business profile created successfully",
          reply,
        });
      } else {
        return res.status(400).json({
          message: "Invalid user type",
        });
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      return res.status(500).json({
        message: "Failed to create profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get all athletes
  app.get("/api/athletes", async (req: Request, res: Response) => {
    try {
      const athletes = await storage.getAllAthletes();
      return res.status(200).json({ athletes });
    } catch (error) {
      console.error("Error getting athletes:", error);
      return res.status(500).json({
        message: "Failed to retrieve athletes",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get all businesses
  app.get("/api/businesses", async (req: Request, res: Response) => {
    try {
      const businesses = await storage.getAllBusinesses();
      return res.status(200).json({ businesses });
    } catch (error) {
      console.error("Error getting businesses:", error);
      return res.status(500).json({
        message: "Failed to retrieve businesses",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get matches for session
  app.get("/api/matches", async (req: Request, res: Response) => {
    try {
      // Check if the user is authenticated
      if (!req.session?.passport?.user) {
        return res.status(401).json({
          message: "Not authenticated",
        });
      }

      const userId = req.session.passport.user;

      // Get the user to determine their type
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      let matches = [];

      // Filter matches based on user role
      if (user.role === 'athlete') {
        // Get athlete profile
        const athlete = await storage.getAthleteByUserId(userId);

        if (!athlete) {
          return res.status(404).json({
            message: "Athlete profile not found",
          });
        }

        // Get matches for this athlete only
        matches = await storage.getMatchesForAthlete(athlete.id);
      } else if (user.role === 'business') {
        // Get business profile
        const business = await storage.getBusinessByUserId(userId);

        if (!business) {
          return res.status(404).json({
            message: "Business profile not found",
          });
        }

        // Get matches for this business only
        matches = await storage.getMatchesForBusiness(business.id);
      } else if (user.role === 'admin' || user.role === 'compliance') {
        // Admins and compliance officers can see all matches
        matches = await storage.getAllMatches();
      } else {
        return res.status(403).json({
          message: "Unauthorized user type",
        });
      }

      // Format matches for the frontend
      const formattedMatches = await Promise.all(matches.map(async (match) => {
        const athlete = await storage.getAthlete(match.athleteId);
        const business = await storage.getBusiness(match.businessId);
        const campaign = await storage.getCampaign(match.campaignId);

        return {
          id: match.id,
          score: match.score,
          athlete: athlete ? {
            id: athlete.id,
            name: athlete.name,
          } : undefined,
          business: business ? {
            id: business.id,
            name: business.name,
          } : undefined,
          campaign: campaign ? {
            title: campaign.title,
            description: campaign.description,
            deliverables: campaign.deliverables,
          } : undefined,
          reason: match.reason,
        };
      }));

      return res.status(200).json({ 
        matches: formattedMatches
      });
    } catch (error) {
      console.error("Error getting matches:", error);
      return res.status(500).json({
        message: "Failed to retrieve matches",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Partnership Offer endpoints
  app.post("/api/partnership-offers", async (req: Request, res: Response) => {
    try {
      const { athleteId, businessId, campaignId, matchId, compensationType, offerAmount, deliverables, usageRights, term } = req.body;

      // Validate required fields
      if (!athleteId || !businessId || !campaignId || !matchId || !compensationType || !offerAmount || !deliverables || !usageRights || !term) {
        return res.status(400).json({ error: "Missing required fields for partnership offer" });
      }

      // Create a new partnership offer
      const partnershipOffer = await storage.createPartnershipOffer({
        athleteId,
        businessId,
        campaignId,
        matchId,
        compensationType,
        offerAmount,
        deliverables,
        usageRights,
        term,
        paymentSchedule: req.body.paymentSchedule || null,
        bonusStructure: req.body.bonusStructure || null,
        contentSpecifications: req.body.contentSpecifications || null,
        postFrequency: req.body.postFrequency || null,
        approvalProcess: req.body.approvalProcess || null,
        exclusivity: req.body.exclusivity || null,
        geographicRestrictions: req.body.geographicRestrictions || null,
        expiresAt: req.body.expiresAt || null,
      });

      res.status(201).json(partnershipOffer);
    } catch (error) {
      console.error("Error creating partnership offer:", error);
      res.status(500).json({ error: "Failed to create partnership offer" });
    }
  });

  app.get("/api/partnership-offers/athlete/:athleteId", async (req: Request, res: Response) => {
    try {
      const { athleteId } = req.params;
      const offers = await storage.getPartnershipOffersByAthlete(parseInt(athleteId, 10));
      res.json(offers);
    } catch (error) {
      console.error("Error fetching athlete partnership offers:", error);
      res.status(500).json({ error: "Failed to fetch partnership offers" });
    }
  });

  app.get("/api/partnership-offers/business/:businessId", async (req: Request, res: Response) => {
    try {
      const { businessId } = req.params;
      const offers = await storage.getPartnershipOffersByBusiness(parseInt(businessId, 10));
      res.json(offers);
    } catch (error) {
      console.error("Error fetching business partnership offers:", error);
      res.status(500).json({ error: "Failed to fetch partnership offers" });
    }
  });

  app.get("/api/partnership-offers/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const offer = await storage.getPartnershipOffer(parseInt(id, 10));

      if (!offer) {
        return res.status(404).json({ error: "Partnership offer not found" });
      }

      res.json(offer);
    } catch (error) {
      console.error("Error fetching partnership offer:", error);
      res.status(500).json({ error: "Failed to fetch partnership offer" });
    }
  });

  app.patch("/api/partnership-offers/:id/viewed", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedOffer = await storage.markPartnershipOfferViewed(parseInt(id, 10));
      res.json(updatedOffer);
    } catch (error) {
      console.error("Error marking partnership offer as viewed:", error);
      res.status(500).json({ error: "Failed to update partnership offer" });
    }
  });

  app.patch("/api/partnership-offers/:id/status", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['pending', 'accepted', 'declined', 'expired'].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      const updatedOffer = await storage.updatePartnershipOfferStatus(parseInt(id, 10), status);
      res.json(updatedOffer);
    } catch (error) {
      console.error("Error updating partnership offer status:", error);
      res.status(500).json({ error: "Failed to update partnership offer status" });
    }
  });

  app.patch("/api/partnership-offers/:id/compliance", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid compliance status value" });
      }

      const updatedOffer = await storage.updatePartnershipOfferComplianceStatus(parseInt(id, 10), status, notes);
      res.json(updatedOffer);
    } catch (error) {
      console.error("Error updating partnership offer compliance status:", error);
      res.status(500).json({ error: "Failed to update partnership offer compliance status" });
    }
  });

  // Process personalized onboarding data
  app.post("/api/personalized-onboarding", async (req: Request, res: Response) => {
    try {
      // Extract profile data from request
      const profileData = req.body;

      if (!profileData.sessionId) {
        return res.status(400).json({ 
          message: "Missing session ID" 
        });
      }

      // Get current session
      let sessionData;
      try {
        sessionData = await sessionService.getSession(profileData.sessionId);
      } catch (error) {
        console.log("Error getting session, creating temporary one instead:", error);
        // Create a temporary session if one doesn't exist
        sessionData = {
          id: Math.floor(Math.random() * 10000),
          sessionId: profileData.sessionId,
          userType: profileData.userType || null,
          data: {},
          profileCompleted: false,
          athleteId: null,
          businessId: null,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      if (!sessionData) {
        console.log("Creating temporary session for onboarding:", profileData.sessionId);
        // Create a temporary session
        sessionData = {
          id: Math.floor(Math.random() * 10000),
          sessionId: profileData.sessionId,
          userType: profileData.userType || null,
          data: {},
          profileCompleted: false,
          athleteId: null,
          businessId: null,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      console.log("Processing personalized onboarding data for session:", profileData.sessionId);

      // Use a try-catch here to handle any Gemini API issues
      let processedProfile;
      try {
        // Process the profile data through Gemini AI to extract insights
        processedProfile = await geminiService.processOnboardingProfile(profileData);
      } catch (error) {
        console.error("Error processing with Gemini, using fallback:", error);
        // Fallback if Gemini AI processing fails
        processedProfile = {
          enrichedData: {
            contentSuggestions: ["Authentic content showcasing your talents", "Behind-the-scenes training footage", "Day-in-the-life content"],
            audienceInsights: {
              demographics: "College sports fans, 18-35",
              interests: "Sports, fitness, college athletics" 
            },
            marketingTips: ["Focus on authenticity", "Engage consistently", "Showcase your personality"]
          },
          recommendations: [
            "Focus on authentic content that showcases your unique personality",
            "Engage with brands that align with your personal values",
            "Build a consistent posting schedule to grow your audience"
          ]
        };
      }

      // Store the appropriate profile based on user type with enhanced AI insights
      if (profileData.userType === "athlete") {
        // Extract key information from the AI-processed data
        const aiInsights = processedProfile.enrichedData;
        const contentPreferences = aiInsights.contentSuggestions || [];
        const audienceInsights = aiInsights.audienceInsights || {};

        // Build follower count from form data if available
        const followerCount = parseInt(
          profileData.basicInfo?.followerCount || 
          (profileData.visualPreferences?.audienceSize === "large" ? "10000" : 
           profileData.visualPreferences?.audienceSize === "medium" ? "5000" : "1000"), 
          10
        );

        const athleteData = {
          sessionId: profileData.sessionId,
          name: profileData.basicInfo?.name || "",
          sport: profileData.basicInfo?.sport || "",
          division: profileData.basicInfo?.division || "Division I",
          school: profileData.basicInfo?.school || "",
          followerCount: followerCount,
          contentStyle: contentPreferences.join(", "),
          compensationGoals: `$${profileData.budgetValues?.budgetRange?.min || "1000"}-$${profileData.budgetValues?.budgetRange?.max || "5000"}`,
          email: profileData.basicInfo?.email || null,
          phone: profileData.basicInfo?.phone || null,
          socialHandles: JSON.stringify(profileData.basicInfo?.socialHandles) || "",
          // Store the complete wizard data and AI insights in preferences
          preferences: JSON.stringify({
            aiInsights: processedProfile.enrichedData,
            recommendations: processedProfile.recommendations,
            brandCompatibility: processedProfile.enrichedData.brandCompatibility,
            wizardData: profileData
          })
        };

        // Store in local storage
        const athlete = await storage.storeAthleteProfile(athleteData);

        // Store in BigQuery (if available)
        try {
          await bigQueryService.insertAthleteProfile(athleteData);
        } catch (bigQueryError) {
          console.warn("BigQuery storage failed, but continuing process:", bigQueryError);
        }

        // Update session
        await sessionService.updateSession(profileData.sessionId, {
          profileCompleted: true,
          athleteId: athlete.id
        });

        // Generate confirmation message
        const confirmationMessage = await geminiService.generateProfileConfirmation("athlete", athleteData.name);

        // Store message in chat history
        await storage.storeMessage(profileData.sessionId, "assistant", confirmationMessage);

        return res.status(201).json({
          message: "Athlete profile created successfully with AI insights",
          profile: athlete,
          aiInsights: processedProfile.enrichedData,
          recommendations: processedProfile.recommendations,
          confirmation: confirmationMessage
        });
      } else if (profileData.userType === "business") {
        // Extract key information from the AI-processed data
        const aiInsights = processedProfile.enrichedData;

        const businessData = {
          sessionId: profileData.sessionId,
          name: profileData.basicInfo?.name || profileData.basicInfo?.companyName || "",
          values: profileData.budgetValues?.valueAlignment?.join(", ") || "Quality, Innovation",
          productType: profileData.basicInfo?.industry || "Retail",
          audienceGoals: profileData.targetAudience?.demographics?.join(", ") || "College students",
          campaignVibe: profileData.stylePreferences?.communicationStyle || "Authentic",
          targetSchoolsSports: profileData.targetAudience?.geographicReach?.join(", ") || "All",
          email: profileData.basicInfo?.email || null,
          phone: profileData.basicInfo?.phone || null,
          website: profileData.basicInfo?.website || null,
          // Store the complete wizard data and AI insights in preferences
          preferences: JSON.stringify({
            aiInsights: processedProfile.enrichedData,
            recommendations: processedProfile.recommendations,
            idealAthleteTraits: processedProfile.enrichedData.idealPartnerTraits,
            wizardData: profileData
          })
        };

        // Store in local storage
        const business = await storage.storeBusinessProfile(businessData);

        // Store in BigQuery (if available)
        try {
          await bigQueryService.insertBusinessProfile(businessData);
        } catch (bigQueryError) {
          console.warn("BigQuery storage failed, but continuing process:", bigQueryError);
        }

        // Generate a campaign based on AI insights and business profile
        const enhancedBusinessProfile = {
          ...business,
          aiInsights: processedProfile.enrichedData
        };

        // Create a default campaign for the business
        const campaign = await geminiService.generateCampaign(enhancedBusinessProfile);

        // Prepare campaign data
        const campaignData = {
          businessId: business.id,
          title: campaign.title,
          description: campaign.description,
          deliverables: campaign.deliverables,
          status: "active",
          budget: `$${profileData.budgetValues?.budgetRange?.min || "1000"}-$${profileData.budgetValues?.budgetRange?.max || "5000"}`,
          duration: profileData.budgetValues?.campaignDuration || "Short-term",
          requirements: aiInsights.contentSuggestions?.join(", ") || "Authentic content creation",
          goals: profileData.goalsExpectations?.primaryGoals?.join(", ") || "Brand awareness",
          targetDemographics: profileData.targetAudience?.demographics?.join(", ") || "College students"
        };

        // Store campaign
        const storedCampaign = await storage.storeCampaign(campaignData);

        // Store in BigQuery (if available)
        try {
          await bigQueryService.insertCampaign(campaignData);
        } catch (bigQueryError) {
          console.warn("BigQuery campaign storage failed, but continuing process:", bigQueryError);
        }

        // Update session
        await sessionService.updateSession(profileData.sessionId, {
          profileCompleted: true,
          businessId: business.id,
          campaignId: storedCampaign.id
        });

        // Generate confirmation message
        const confirmationMessage = await geminiService.generateProfileConfirmation("business", businessData.name);

        // Store message in chat history
        await storage.storeMessage(profileData.sessionId, "assistant", confirmationMessage);

        return res.status(201).json({
          message: "Business profile created successfully with AI insights",
          profile: business,
          campaign: storedCampaign,
          aiInsights: processedProfile.enrichedData,
          recommendations: processedProfile.recommendations,
          confirmation: confirmationMessage
        });
      } else {
        return res.status(400).json({
          message: "Invalid user type"
        });
      }
    } catch (error) {
      console.error("Error processing personalized profile:", error);
      return res.status(500).json({
        message: "Failed to process personalized profile",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Handle user preferences submission
  app.post("/api/preferences", async (req: Request, res: Response) => {
    try {
      const { sessionId, userType, ...preferencesData } = req.body;

      if (userType === "athlete") {
        // Get the athlete ID from the session
        const session = await sessionService.getSession(sessionId);
        if (!session || !session.athleteId) {
          return res.status(400).json({ success: false, message: "Athlete profile not found" });
        }

        // Update the athlete profile with preferences
        const athlete = await storage.getAthlete(session.athleteId);
        if (!athlete) {
          return res.status(404).json({ success: false, message: "Athlete profile not found" });
        }

        const updatedAthlete = await storage.storeAthleteProfile({
          ...athlete,
          preferences: preferencesData
        });

        res.json({ success: true, athlete: updatedAthlete });
      } else if (userType === "business") {
        // Get the business ID from the session
        const session = await sessionService.getSession(sessionId);
        if (!session || !session.businessId) {
          return res.status(400).json({ success: false, message: "Business profile not found" });
        }

        // Update the business profile with preferences
        const business = await storage.getBusiness(session.businessId);
        if (!business) {
          return res.status(404).json({ success: false, message: "Business profile not found" });
        }

        const updatedBusiness = await storage.storeBusinessProfile({
          ...business,
          preferences: preferencesData
        });

        res.json({ success: true, business: updatedBusiness });
      } else {
        res.status(400).json({ success: false, message: "Invalid user type" });
      }
    } catch (error) {
      console.error("Error storing preferences:", error);
      res.status(500).json({ success: false, message: "Failed to store preferences" });
    }
  });

  // Get profile for current session
  app.get("/api/profile", async (req: Request, res: Response) => {
    try {
      // Check if the user is authenticated
      if (!req.session?.passport?.user) {
        return res.status(401).json({
          message: "Not authenticated",
        });
      }

      const userId = req.session.passport.user;

      // Get the user to determine their type
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const userRole = user.role;

      // Return the appropriate profile based on user role
      if (userRole === 'athlete') {
        // Get athlete profile for the authenticated user
        const athlete = await storage.getAthleteByUserId(userId);

        if (athlete) {
          return res.status(200).json({
            id: athlete.id,
            name: athlete.name,
            userType: "athlete",
            sport: athlete.sport,
            school: athlete.school,
            division: athlete.division,
            followerCount: athlete.followerCount,
            contentStyle: athlete.contentStyle,
            // Additional fields as needed
            email: athlete.email,
            phone: athlete.phone,
            // Parse JSON fields if they exist
            socialHandles: athlete.socialHandles ? JSON.parse(athlete.socialHandles) : {},
            personalValues: athlete.personalValues ? JSON.parse(athlete.personalValues) : [],
            contentTypes: athlete.contentTypes ? JSON.parse(athlete.contentTypes) : [],
          });
        }

        // Fallback to first athlete if no specific athlete profile found
        const athletes = await storage.getAllAthletes();
        if (athletes.length > 0) {
          return res.status(200).json({
            id: athletes[0].id,
            name: athletes[0].name,
            userType: "athlete",
            sport: athletes[0].sport,
            school: athletes[0].school,
            division: athletes[0].division,
            followerCount: athletes[0].followerCount,
            contentStyle: athletes[0].contentStyle,
          });
        }

        return res.status(404).json({
          message: "Athlete profile not found",
        });
      }

      if (userRole === 'business') {
        // Get business profile for the authenticated user
        const business = await storage.getBusinessByUserId(userId);

        if (business) {
          // Return business-specific profile data
          return res.status(200).json({
            id: business.id,
            name: business.name,
            userType: "business",
            productType: business.productType,
            audienceGoals: business.audienceGoals,
            values: business.values,
            industry: business.industry,
            email: business.email,
            // Parse the preferences if it exists
            preferences: business.preferences ? JSON.parse(business.preferences) : {},
          });
        }

        // Fallback to first business if no specific business profile found
        const businesses = await storage.getAllBusinesses();
        if (businesses.length > 0) {
          return res.status(200).json({
            id: businesses[0].id,
            name: businesses[0].name,
            userType: "business",
            productType: businesses[0].productType,
            audienceGoals: businesses[0].audienceGoals,
            values: businesses[0].values
          });
        }

        return res.status(404).json({
          message: "Business profile not found",
        });
      }

      // Handle other user types (admin, compliance, etc.)
      return res.status(404).json({
        message: "Profile type not supported",
      });
    } catch (error) {
      console.error("Error getting profile:", error);
      return res.status(500).json({
        message: "Failed to retrieve profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // New endpoints to directly fetch profiles by user ID without authentication

  // Get business profile by user ID
  app.get("/api/profile/business/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          message: "Missing user ID parameter",
        });
      }

      console.log(`Fetching business profile for user ID: ${userId}`);

      // First try to fetch directly from Supabase
      try {
        const { data, error } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          console.log('Found business profile via Supabase:', data);
          return res.status(200).json({
            id: data.id,
            name: data.name,
            userType: "business",
            productType: data.product_type,
            audienceGoals: data.audience_goals,
            values: data.values,
            industry: data.industry,
            email: data.email,
            // Parse the preferences if it exists
            preferences: data.preferences ? JSON.parse(data.preferences) : {},
          });
        }
      } catch (supabaseErr) {
        console.error('Supabase query error:', supabaseErr);
        // Continue to fallback method
      }

      // Fallback to storage method
      const business = await storage.getBusinessByUserId(userId);

      if (business) {
        console.log('Found business profile via storage:', business);
        return res.status(200).json({
          id: business.id,
          name: business.name,
          userType: "business",
          productType: business.productType,
          audienceGoals: business.audienceGoals,
          values: business.values,
          industry: business.industry,
          email: business.email,
          // Parse the preferences if it exists
          preferences: business.preferences ? JSON.parse(business.preferences) : {},
        });
      }

      return res.status(404).json({
        message: "Business profile not found",
      });
    } catch (error) {
      console.error("Error getting business profile by ID:", error);
      return res.status(500).json({
        message: "Failed to retrieve business profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get athlete profile by user ID
  app.get("/api/profile/athlete/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          message: "Missing user ID parameter",
        });
      }

      console.log(`Fetching athlete profile for user ID: ${userId}`);

      // First try to fetch directly from Supabase
      try {
        const { data, error } = await supabase
          .from('athlete_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          console.log('Found athlete profile via Supabase:', data);
          return res.status(200).json({
            id: data.id,
            name: data.name,
            userType: "athlete",
            sport: data.sport,
            school: data.school,
            division: data.division,
            followerCount: data.follower_count,
            contentStyle: data.content_style,
            email: data.email,
            // Parse JSON fields if they exist
            socialHandles: data.social_handles ? JSON.parse(data.social_handles) : {},
            personalValues: data.personal_values ? JSON.parse(data.personal_values) : [],
            contentTypes: data.content_types ? JSON.parse(data.content_types) : [],
          });
        }
      } catch (supabaseErr) {
        console.error('Supabase query error:', supabaseErr);
        // Continue to fallback method
      }

      // Fallback to storage method
      const athlete = await storage.getAthleteByUserId(userId);

      if (athlete) {
        console.log('Found athlete profile via storage:', athlete);
        return res.status(200).json({
          id: athlete.id,
          name: athlete.name,
          userType: "athlete",
          sport: athlete.sport,
          school: athlete.school,
          division: athlete.division,
          followerCount: athlete.followerCount,
          contentStyle: athlete.contentStyle,
          email: athlete.email,
          // Parse JSON fields if they exist
          socialHandles: athlete.socialHandles ? JSON.parse(athlete.socialHandles) : {},
          personalValues: athlete.personalValues ? JSON.parse(athlete.personalValues) : [],
          contentTypes: athlete.contentTypes ? JSON.parse(athlete.contentTypes) : [],
        });
      }

      return res.status(404).json({
        message: "Athlete profile not found",
      });
    } catch (error) {
      console.error("Error getting athlete profile by ID:", error);
      return res.status(500).json({
        message: "Failed to retrieve athlete profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Helper function to find the best match
  async function findBestMatch(athlete: any, business: any, campaign: any) {
    // Use Gemini to generate a comprehensive match score with multi-dimensional analysis
    const matchResponse = await geminiService.generateMatchScore(athlete, business, campaign);

    // Store the match with enhanced multi-dimensional data
    const matchData = {
      athleteId: athlete.id,
      businessId: business.id,
      campaignId: campaign.id,
      score: matchResponse.score,
      reason: matchResponse.reason,
      // Store all the multi-dimensional scores
      audienceFitScore: matchResponse.audienceFitScore,
      contentStyleFitScore: matchResponse.contentStyleFitScore,
      brandValueAlignmentScore: matchResponse.brandValueAlignmentScore,
      engagementPotentialScore: matchResponse.engagementPotentialScore,
      compensationFitScore: matchResponse.compensationFitScore,
      // Store strength and weakness areas as JSON
      strengthAreas: matchResponse.strengthAreas ? JSON.stringify(matchResponse.strengthAreas) : null,
      weaknessAreas: matchResponse.weaknessAreas ? JSON.stringify(matchResponse.weaknessAreas) : null
    };

    const match = await storage.storeMatch(matchData);

    // Send match creation event to n8n webhook (non-blocking)
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        const webhookData = {
          event_type: "match_created",
          timestamp: new Date().toISOString(),
          data: {
            matchId: match.id,
            score: match.score,
            athleteId: match.athleteId,
            businessId: match.businessId,
            campaignId: match.campaignId,
            reason: match.reason
          },
          platform: "Contested"
        };

        sendToN8nWebhook(webhookData)
          .then(success => {
            if (success) {
              console.log(`Successfully sent match data to n8n webhook`);
            }
          })
          .catch(error => {
            console.error(`Error sending match data to n8n webhook: ${error}`);
          });
      } catch (error) {
        // Log but don't fail the match creation if webhook fails
        console.error("Error preparing match webhook notification:", error);
      }
    }

    return match;
  }

  // User registration endpoint - Supabase Auth
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      console.log("Registration request body:", req.body);

      const { email, password, fullName, userType } = req.body;

      // Log each required field to identify which one might be missing
      console.log("Email:", email);
      console.log("Password:", password ? "***provided***" : "missing");
      console.log("Full Name:", fullName);
      console.log("User Type:", userType);

      if (!email || !password || !fullName || !userType) {
        const missingFields = [];
        if (!email) missingFields.push("email");
        if (!password) missingFields.push("password");
        if (!fullName) missingFields.push("fullName");
        if (!userType) missingFields.push("userType");

        console.log("Missing fields:", missingFields);

        return res.status(400).json({
          error: "Missing required fields",
          missingFields
        });
      }

      // Generate username from email (our schema requires username)
      const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
      console.log("Generated username:", username);

      try {
        // Hash the password before storing
        const hashedPassword = await hashPassword(password);

        // Create the user in our database using the storage interface
        const newUser = await storage.createUser({
          email,
          password: hashedPassword,
          role: userType, // Map userType to role
          sessionId: null, // Will be updated later,
        });

        console.log("Created user in storage:", newUser.id);

        // Create a session for the new user
        const sessionId = createHash('sha256').update(Date.now().toString()).digest('hex').substring(0, 16);
        await sessionService.createSession(sessionId);
        await sessionService.updateSession(sessionId, {
          userType,
          profileCompleted: false,
          userId: newUser.id
        });

        // Update the user with the session ID
        await storage.updateUser(newUser.id, { sessionId });

        return res.status(201).json({
          message: "User registered successfully",
          user: {
            id: newUser.id,
            email: newUser.email,
            userType: newUser.role, // Map role back to userType for client compatibility
          },
          sessionId
        });
      } catch (storageError) {
        console.error("Error creating user in storage:", storageError);

        // Fallback to Supabase Auth if our storage fails
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: fullName,
              user_type: userType,
              username: username,
            }
          }
        });

        if (authError) {
          console.error("Supabase auth error:", authError);
          return res.status(400).json({
            error: "Registration failed",
            details: authError.message
          });
        }

        // Create a session for the new user
        const sessionId = createHash('sha256').update(Date.now().toString()).digest('hex').substring(0, 16);
        await sessionService.createSession(sessionId);
        await sessionService.updateSession(sessionId, {
          userType,
          profileCompleted: false,
          supabaseUserId: authData.user?.id
        });

        return res.status(201).json({
          message: "User registered successfully with Supabase Auth",
          user: {
            id: authData.user?.id,
            email: authData.user?.email,
            userType: userType
          },
          sessionId
        });
      }
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({
        error: "Failed to register user",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // User login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: "Missing email or password"
        });
      }

      console.log(`Login attempt for email: ${email}`);

      try {
        // First try to find the user by email in our database
        const users = await db.query("users", "SELECT * FROM users WHERE email = $1", [email]);
        const user = users && users.length > 0 ? users[0] : null;

        if (user) {
          console.log(`Found user in our database: ${user.id}`);

          // Verify password
          try {
            const isPasswordValid = await comparePasswords(password, user.password);

            if (!isPasswordValid) {
              console.log("Password verification failed");
              return res.status(401).json({
                error: "Invalid email or password"
              });
            }
          } catch (passwordError) {
            console.error("Error verifying password:", passwordError);
            return res.status(401).json({
              error: "Authentication failed",
              details: "Password verification error"
            });
          }

          // Create a session for the logged-in user
          const sessionId = createHash('sha256').update(Date.now().toString()).digest('hex').substring(0, 16);
          await sessionService.createSession(sessionId);
          await sessionService.updateSession(sessionId, {
            userType: user.userType,
            profileCompleted: true, // Assume profile is completed for now
            userId: user.id
          });

          // Update user's sessionId
          await storage.updateUser(user.id, { sessionId });

          // Also sign in with Supabase to get a proper session token
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });

          if (authError) {
            console.warn("Warning: Couldn't get Supabase session during login:", authError);
          }

          return res.status(200).json({
            message: "Login successful",
            user: {
              id: user.id,
              email: user.email,
              userType: user.userType,
              username: user.username
            },
            sessionId,
            session: authData?.session || null
          });
        }
      } catch (storageError) {
        console.error("Error finding user in database:", storageError);
      }

      // Fallback to Supabase Auth if our database lookup fails
      console.log("Falling back to Supabase auth");
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        console.error("Supabase auth error:", authError);
        return res.status(401).json({
          error: "Authentication failed",
          details: authError.message
        });
      }

      const userType = authData.user?.user_metadata?.user_type || 'unknown';

      // Create a session for the logged-in user
      const sessionId = createHash('sha256').update(Date.now().toString()).digest('hex').substring(0, 16);
      await sessionService.createSession(sessionId);
      await sessionService.updateSession(sessionId, {
        userType,
        profileCompleted: true, // Assume profile is completed for now
        supabaseUserId: authData.user?.id
      });

      // Ensure we have a user record in our database for this Supabase user
      try {
        const existingUser = await storage.getUserByEmail(authData.user?.email || '');

        if (!existingUser) {
          console.log('Creating user record in database for Supabase Auth user:', authData.user?.id);
          // Create the user in our database
          await storage.createUser({
            email: authData.user?.email || '',
            password: 'SUPABASE_AUTH_USER', // This is a placeholder as auth is handled by Supabase
            role: userType,
            auth_id: authData.user?.id
          });
        }
      } catch (dbError) {
        console.warn('Warning: Could not ensure user record exists in database:', dbError);
      }

      return res.status(200).json({
        message: "Login successful with Supabase Auth",
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          userType: userType
        },
        sessionId,
        session: authData.session // Include complete session for client-side storage
      });
    } catch (error) {
      console.error("Error logging in:", error);
      return res.status(500).json({
        error: "Failed to log in",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get current authenticated user with profile data
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      // Check if there's a token in the request headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const token = authHeader.split(' ')[1];

      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userType = user.user_metadata?.user_type || user.app_metadata?.role || 'unknown';
      console.log(`Fetching profile data for user ${user.id} with type ${userType}`);

      // First, try to get user record from our database using auth_id
      try {
        // Check storage for user with matching auth_id
        const dbUser = await storage.getUserByAuthId(user.id);

        if (dbUser) {
          console.log(`Found user record in database with auth_id=${user.id}`);

          // Get associated profile based on role/user type
          let profileData = null;

          if (userType === 'athlete') {
            try {
              const { data: athleteProfile } = await supabase
                .from('athlete_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

              if (athleteProfile) {
                console.log(`Found athlete profile for user ${user.id}`);
                profileData = athleteProfile;
              }
            } catch (profileErr) {
              console.warn(`Error fetching athlete profile: ${profileErr}`);
            }
          } else if (userType === 'business') {
            try {
              // First try with auth_id directly
              const { data: directProfile } = await supabase
                .from('business_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

              if (directProfile) {
                console.log(`Found business profile for user with auth_id=${user.id}`);
                profileData = directProfile;
              } else {
                // Then try with database user ID
                console.log(`No business profile found with auth_id=${user.id}, trying database user_id=${dbUser.id}`);
                const { data: dbUserProfile } = await supabase
                  .from('business_profiles')
                  .select('*')
                  .eq('user_id', dbUser.id)
                  .maybeSingle();
                
                if (dbUserProfile) {
                  console.log(`Found business profile for database user_id=${dbUser.id}`);
                  profileData = dbUserProfile;
                } else {
                  // Try with string conversion (in case of UUID/string type mismatches)
                  console.log(`Trying string comparison fallback for user_id=${dbUser.id}`);
                  const { data: allProfiles } = await supabase
                    .from('business_profiles')
                    .select('*');
                    
                  if (allProfiles && allProfiles.length > 0) {
                    console.log(`Scanning ${allProfiles.length} business profiles for matching user_id`);
                    const matchingProfile = allProfiles.find(p => 
                      p.user_id === dbUser.id.toString() || 
                      p.user_id.toString() === dbUser.id ||
                      p.user_id === user.id.toString() ||
                      p.user_id.toString() === user.id
                    );
                    
                    if (matchingProfile) {
                      console.log(`Found matching business profile using string comparison`);
                      profileData = matchingProfile;
                    }
                  }
                }
              }
            } catch (profileErr) {
              console.warn(`Error fetching business profile: ${profileErr}`);
            }
          }

          // Return complete user data with profile
          return res.status(200).json({
            user: {
              id: user.id,
              email: user.email,
              userType: userType,
              ...dbUser
            },
            profile: profileData
          });
        } else {
          console.log(`No user record found with auth_id=${user.id}, trying email lookup`);

          // Try fallback to email search
          const emailUser = await storage.getUserByEmail(user.email || '');

          if (emailUser) {
            console.log(`Found user record by email: ${user.email}`);

            // Update the user record with auth_id for future lookups
            await storage.updateUser(emailUser.id, { auth_id: user.id });
            console.log(`Updated user record with auth_id=${user.id}`);

            // Get associated profile based on role/user type
            let profileData = null;

            if (userType === 'athlete') {
              try {
                const { data: athleteProfile } = await supabase
                  .from('athlete_profiles')
                  .select('*')
                  .eq('user_id', user.id)
                  .maybeSingle();

                if (athleteProfile) {
                  profileData = athleteProfile;
                }
              } catch (profileErr) {
                console.warn(`Error fetching athlete profile: ${profileErr}`);
              }
            } else if (userType === 'business') {
              try {
                // First try with auth_id directly
                const { data: directProfile } = await supabase
                  .from('business_profiles')
                  .select('*')
                  .eq('user_id', user.id)
                  .maybeSingle();

                if (directProfile) {
                  console.log(`Found business profile for user with auth_id=${user.id}`);
                  profileData = directProfile;
                } else {
                  // Then try with database user ID
                  console.log(`No business profile found with auth_id=${user.id}, trying database user_id=${emailUser.id}`);
                  const { data: dbUserProfile } = await supabase
                    .from('business_profiles')
                    .select('*')
                    .eq('user_id', emailUser.id)
                    .maybeSingle();
                  
                  if (dbUserProfile) {
                    console.log(`Found business profile for database user_id=${emailUser.id}`);
                    profileData = dbUserProfile;
                  } else {
                    // Try with string conversion (in case of UUID/string type mismatches)
                    console.log(`Trying string comparison fallback for user_id=${emailUser.id}`);
                    const { data: allProfiles } = await supabase
                      .from('business_profiles')
                      .select('*');
                      
                    if (allProfiles && allProfiles.length > 0) {
                      console.log(`Scanning ${allProfiles.length} business profiles for matching user_id`);
                      const matchingProfile = allProfiles.find(p => 
                        p.user_id === emailUser.id.toString() || 
                        p.user_id.toString() === emailUser.id ||
                        p.user_id === user.id.toString() ||
                        p.user_id.toString() === user.id
                      );
                      
                      if (matchingProfile) {
                        console.log(`Found matching business profile using string comparison`);
                        profileData = matchingProfile;
                      }
                    }
                  }
                }
              } catch (profileErr) {
                console.warn(`Error fetching business profile: ${profileErr}`);
              }
            }

            // Return complete user data with profile
            return res.status(200).json({
              user: {
                id: user.id,
                email: user.email,
                userType: userType,
                ...emailUser
              },
              profile: profileData
            });
          } else {
            // No user record found, create one
            console.log(`No user record found for ${user.email}, creating one`);

            try {
              const newUser = await storage.createUser({
                email: user.email || '',
                password: 'SUPABASE_AUTH_USER', // This is a placeholder as auth is handled by Supabase
                role: userType as any,
                auth_id: user.id
              });

              console.log(`Created new user record: ${newUser.id}`);

              // Return basic user data
              return res.status(200).json({
                user: {
                  id: user.id,
                  email: user.email,
                  userType: userType,
                  ...newUser
                },
                profile: null
              });
            } catch (createErr) {
              console.error(`Error creating user record: ${createErr}`);

              // Return basic auth user data if we can't create a user record
              return res.status(200).json({
                user: {
                  id: user.id,
                  email: user.email,
                  userType: userType
                },
                profile: null
              });
            }
          }
        }
      } catch (storageError) {
        console.error(`Error querying user storage: ${storageError}`);

        // Return basic auth user data on error
        return res.status(200).json({
          user: {
            id: user.id,
            email: user.email,
            userType: userType
          },
          profile: null
        });
      }
    } catch (error) {
      console.error("Error getting authenticated user:", error);
      return res.status(401).json({ error: "Not authenticated" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      // Get the token from the authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Supabase logout error:", error);
        return res.status(500).json({
          message: "Logout failed",
          error: error.message
        });
      }

      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error logging out:", error);
      return res.status(500).json({
        message: "Failed to log out",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);

  // Set up WebSocket server on a distinct path to avoid conflicts with Vite's HMR
  // Updated WebSocket server path to match client-side configuration
  // WebSockets have been disabled for compatibility with Supabase
  // Instead we use HTTP polling for real-time updates
  console.log('[Server] WebSocket server disabled - using HTTP polling for real-time updates');
  
  /* WEBSOCKET CODE DISABLED
  const wss = new WebSocketServer({ server: httpServer, path: '/api/contested-ws' });

  // Using the globally defined wsConnections Map (defined at the top of the file)
  // to store connected clients by sessionId

  wss.on('connection', (ws: CustomWebSocket) => {
    console.log('WebSocket client connected - waiting for registration');
  */

    /* WEBSOCKET CODE DISABLED
    // Handle incoming messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('WebSocket message received:', data.type);

        // Register the client with their session ID and role if available
        if (data.type === 'register' && data.sessionId) {
          const sessionId = data.sessionId;

          // Initialize userData
          ws.userData = {
            role: data.userData?.role || 'unknown',
            userId: data.userData?.userId,
            sessionId // Store sessionId in userData for reconnection handling
          };

          // Add to connected clients map
          if (!wsConnections.has(sessionId)) {
            wsConnections.set(sessionId, new Set());
          }
          wsConnections.get(sessionId)?.add(ws);

          // Also maintain compatibility with old code
          connectedClients.set(sessionId, ws);

          console.log(`Client registered with session ID: ${sessionId} (total connections for this session: ${wsConnections.get(sessionId)?.size || 0})`);

          // Send a welcome message
          ws.send(JSON.stringify({
            type: 'system',
            message: 'Connected to Contested real-time updates'
          }));

          // If we have any pending messages for this session, send them now
          const pendingMessages = pendingMessageQueue.get(sessionId);
          if (pendingMessages && pendingMessages.length > 0) {
            console.log(`Sending ${pendingMessages.length} pending messages for session ${sessionId}`);

            pendingMessages.forEach(pendingMsg => {
              try {
                ws.send(JSON.stringify(pendingMsg));
              } catch (sendError) {
                console.error('Error sending pending message:', sendError);
              }
            });

            // Clear the pending queue
            pendingMessageQueue.delete(sessionId);
          }
        }

        // Handle profile update message
        else if (data.type === 'profile_update' && data.sessionId) {
          console.log(`Received profile_update for session ${data.sessionId}`);
          // Forward to all clients for this session
          broadcastToSession(data.sessionId, {
            type: 'profile_update',
            data: data.data
          });

          // Save this data to the session storage if we have a session service
          try {
            if (data.data && typeof data.data === 'object' && Object.keys(data.data).length > 0) {
              const sessionData = await sessionService.getSession(data.sessionId);
              if (sessionData) {
                // Store form data in the session's formData field
                await sessionService.updateSession(data.sessionId, {
                  formData: {
                    ...(sessionData.formData || {}),
                    ...data.data
                  }
                });
                console.log(`Stored form data in session ${data.sessionId}`);
              }
            }
          } catch (error) {
            console.error('Error saving form data to session:', error);
          }
        }

        // Handle step change message
        else if (data.type === 'step_change' && data.sessionId && data.step) {
          console.log(`Received step_change for session ${data.sessionId} to step ${data.step}`);
          // Forward to all clients for this session
          broadcastToSession(data.sessionId, {
            type: 'step_change',
            step: data.step
          });

          // Save current step to the session storage
          try {
            await sessionService.updateSession(data.sessionId, {
              currentStep: data.step
            });
            console.log(`Stored current step (${data.step}) in session ${data.sessionId}`);
          } catch (error) {
            console.error('Error saving step to session:', error);
          }
        }

        // Handle test message
        else if (data.type === 'test') {
          console.log(`Received test message for session ${data.sessionId}`);
          const responseMessage = {
            type: 'test_response',
            message: 'Server received your test message successfully',
            receivedMessage: data,
            timestamp: new Date().toISOString()
          };

          // Echo back to the client
          ws.send(JSON.stringify(responseMessage));

          // Also broadcast to all clients in this session
          broadcastToSession(data.sessionId, responseMessage);
        }

        // Process other message types as needed
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');

      // Remove from the session-specific set if we have session info
      if (ws.userData?.sessionId) {
        const sessionId = ws.userData.sessionId;
        const connections = wsConnections.get(sessionId);

        if (connections) {
          // Remove this connection
          connections.delete(ws);

          // If no more connections for this session, clean up the map entry
          if (connections.size === 0) {
            wsConnections.delete(sessionId);

            // Also remove from old map for compatibility
            connectedClients.delete(sessionId);
          }

          console.log(`Client removed from session ${sessionId} (remaining connections: ${connections.size})`);
        }
      }

      // For backward compatibility with old code that doesn't track sessionId in userData
      for (const [sessionId, client] of connectedClients.entries()) {
        if (client === ws) {
          connectedClients.delete(sessionId);
          console.log(`Removed client from old map for session ${sessionId}`);
          break;
        }
      }
      Array.from(connectedClients.entries()).forEach(([sessionId, client]) => {
        if (client === ws) {
          connectedClients.delete(sessionId);
          console.log(`Removed client with session ID: ${sessionId}`);
        }
      });
    });
  }); */

  // Helper function to send a WebSocket message to a client
  const sendWebSocketMessage = (sessionId: string, data: any) => {
    const client = connectedClients.get(sessionId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  // Helper function to send data to n8n webhook
  const sendToN8nWebhook = async (data: any, webhookUrl?: string) => {
    try {
      // Use the provided webhook URL or a default one
      const url = webhookUrl || process.env.N8N_WEBHOOK_URL;

      if (!url) {
        console.warn('N8N webhook URL not provided and not set in environment variables');
        return false;
      }

      console.log(`Sending data to n8n webhook at URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response body');
        console.error(`Error response from n8n webhook: Status ${response.status} ${response.statusText}, Body: ${errorText}`);
        throw new Error(`Error sending data to n8n: ${response.status} ${response.statusText}`);
      }

      console.log('Successfully sent data to n8n webhook');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      console.error(`Failed to send data to n8n webhook: ${errorMessage}`);
      console.error(`Error details: ${errorStack}`);
      return false;
    }
  };

  // Test endpoint to simulate a match notification (for testing WebSocket)
  app.post("/api/test/simulate-match", async (req: Request, res: Response) => {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Simple mock match data
    const mockMatchData = {
      id: Date.now().toString(),
      score: 85,
      brand: "Urban Athletics Co.",
      athleteName: "Jordan Mitchell",
      reason: "Strong alignment between athlete's content style and brand's marketing goals. Jordan's audience demographics match Urban Athletics' target market perfectly.",
      campaign: {
        title: "SMB Instagram Partnership",
        description: "Collaborative marketing campaign targeting Gen Z consumers through authentic athlete endorsements",
        deliverables: ["Instagram Story Series", "TikTok Video", "Product Unboxing"]
      },
      business: {
        name: "Urban Athletics Co."
      },
      athlete: {
        name: "Jordan Mitchell"
      }
    };

    // Send WebSocket notification
    const sent = sendWebSocketMessage(sessionId, {
      type: "match",
      message: `Contested Match Alert: The perfect partnership with ${mockMatchData.business.name} has been identified for you!`,
      matchData: mockMatchData
    });

    if (sent) {
      res.json({ success: true, message: "Match notification sent" });
    } else {
      res.status(404).json({ 
        error: "Could not send notification. Client might be disconnected or session not found." 
      });
    }
  });

  // n8n webhook integration endpoints
  app.post("/api/n8n/webhook", async (req: Request, res: Response) => {
    try {
      const { webhook_url, event_type, data } = req.body;

      if (!webhook_url) {
        return res.status(400).json({ error: "webhook_url is required" });
      }

      if (!event_type) {
        return res.status(400).json({ error: "event_type is required" });
      }

      // Send data to n8n webhook
      const webhookData = {
        event_type,
        timestamp: new Date().toISOString(),
        data: data || {},
        platform: "Contested"
      };

      const success = await sendToN8nWebhook(webhookData, webhook_url);

      if (success) {
        return res.status(200).json({ 
          success: true, 
          message: `Data for event ${event_type} sent to n8n webhook successfully` 
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to send data to n8n webhook" 
        });
      }
    } catch (error) {
      console.error("Error sending data to n8n webhook:", error);
      return res.status(500).json({
        success: false,
        message: "Error processing webhook request",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // n8n webhook configuration endpoint
  app.post("/api/n8n/config", async (req: Request, res: Response) => {
    try {
      const { webhook_url } = req.body;

      if (!webhook_url) {
        return res.status(400).json({ error: "webhook_url is required" });
      }

      // Store the webhook URL in environment variable
      // Note: This is temporary for the current session only
      process.env.N8N_WEBHOOK_URL = webhook_url;

      return res.status(200).json({ 
        success: true, 
        message: "n8n webhook configuration updated successfully",
        webhook_url
      });
    } catch (error) {
      console.error("Error updating n8n webhook configuration:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating webhook configuration",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Feedback API endpoints

  // Create new feedback
  app.post("/api/feedback", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Validate feedback data
      const feedbackSchema = insertFeedbackSchema.extend({
        // Optional sentiment analysis prompt for Gemini to analyze
        sentimentPrompt: z.string().optional()
      });

      const feedbackData = feedbackSchema.parse(req.body);

      // Add user ID from authenticated session
      const userId = req.user.id;

      // Process sentiment if sentiment prompt is provided
      let sentiment = null;
      if (feedbackData.sentimentPrompt) {
        try {
          // Simple analysis - in a real app, call Gemini AI to analyze sentiment
          const text = feedbackData.content.toLowerCase();
          if (text.includes('great') || text.includes('excellent') || text.includes('amazing')) {
            sentiment = 'positive';
          } else if (text.includes('bad') || text.includes('terrible') || text.includes('awful')) {
            sentiment = 'negative';
          } else {
            sentiment = 'neutral';
          }
        } catch (error) {
          console.error("Error analyzing sentiment:", error);
          // Continue without sentiment if analysis fails
        }
      }

      // Store feedback
      const feedback = await storage.storeFeedback({
        userId,
        userType: req.user.role, // Changed from userType to role
        feedbackType: feedbackData.feedbackType,
        matchId: feedbackData.matchId || null,
        rating: feedbackData.rating || null,
        title: feedbackData.title,
        content: feedbackData.content,
        isPublic: feedbackData.isPublic || false,
      });

      // Notify administrators via WebSocket if a compliance officer is connected
      const complianceUser = Array.from(connectedClients.entries())
        .find(([_, socket]) => {
          if (socket.readyState === WebSocket.OPEN) {
            return socket.userData && socket.userData.role === 'compliance';
          }
          return false;
        });

      if (complianceUser) {
        const [sessionId, socket] = complianceUser;
        sendWebSocketMessage(sessionId, {
          type: 'new_feedback',
          message: `New feedback received: ${feedbackData.title}`,
          data: feedback
        });
      }

      return res.status(201).json({
        message: "Feedback submitted successfully",
        feedback
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      return res.status(500).json({
        message: "Failed to submit feedback",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get feedback by user
  app.get("/api/feedback/user", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const feedbacks = await storage.getFeedbackByUser(userId);

      return res.status(200).json({ feedbacks });
    } catch (error) {
      console.error("Error retrieving user feedback:", error);
      return res.status(500).json({
        message: "Failed to retrieve user feedback",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get feedback by match
  app.get("/api/feedback/match/:matchId", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const matchId = parseInt(req.params.matchId);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const feedbacks = await storage.getFeedbackByMatch(matchId);

      return res.status(200).json({ feedbacks });
    } catch (error) {
      console.error("Error retrieving match feedback:", error);
      return res.status(500).json({
        message: "Failed to retrieve match feedback",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get public feedback
  app.get("/api/feedback/public", async (req: Request, res: Response) => {
    try {
      const feedbacks = await storage.getPublicFeedback();
      return res.status(200).json(feedbacks); // Return array directly, not wrapped in object
    } catch (error) {
      console.error("Error retrieving public feedback:", error);
      return res.status(500).json({
        message: "Failed to retrieve public feedback",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update feedback status (admin/compliance only)
  app.patch("/api/feedback/:feedbackId/status", checkUserAuth("compliance"), async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and has admin/compliance role
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (req.user.role !== 'compliance') {
        return res.status(403).json({ message: "Not authorized" });
      }

      const feedbackId = parseInt(req.params.feedbackId);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }

      const { status } = z.object({
        status: z.enum(['pending', 'reviewed', 'implemented', 'rejected'])
      }).parse(req.body);

      const feedback = await storage.updateFeedbackStatus(feedbackId, status);

      return res.status(200).json({
        message: "Feedback status updated successfully",
        feedback
      });
    } catch (error) {
      console.error("Error updating feedback status:", error);
      return res.status(500).json({
        message: "Failed to update feedback status",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Add admin response to feedback
  app.patch("/api/feedback/:feedbackId/response", checkUserAuth("compliance"), async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and has admin/compliance role
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (req.user.role !== 'compliance') {
        return res.status(403).json({ message: "Not authorized" });
      }

      const feedbackId = parseInt(req.params.feedbackId);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }

      const { response } = z.object({
        response: z.string().min(1, "Response is required")
      }).parse(req.body);

      const feedback = await storage.addAdminResponse(feedbackId, response);

      // Notify the user if they are connected
      const originalFeedback = await storage.getFeedback(feedbackId);
      if (originalFeedback) {
        // Get the user's session based on userId
        const userSession = await storage.getSessionByUserId(originalFeedback.userId);
        if (userSession && userSession.sessionId) {
          const clientSocket = connectedClients.get(userSession.sessionId);
          if (clientSocket && clientSocket.readyState === WebSocket.OPEN) {
            sendWebSocketMessage(userSession.sessionId, {
              type: 'feedback_response',
              message: 'Your feedback has received a response',
              data: {
                feedbackId,
                feedbackTitle: originalFeedback.title,
                response
              }
            });
          }
        }
      }

      return res.status(200).json({
        message: "Admin response added successfully",
        feedback
      });
    } catch (error) {
      console.error("Error adding admin response:", error);
      return res.status(500).json({
        message: "Failed to add admin response",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get public athlete profile by profile link ID
  app.get("/api/athlete-profile/:profileLinkId", async (req: Request, res: Response) => {
    try {
      const { profileLinkId } = req.params;

      // In a real implementation, you would fetch this from the database
      // Mock data for demonstration purposes
      const athleteProfile = {
        id: 1,
        name: "Jordan Mitchell",
        sport: "Basketball",
        school: "State University",
        profileLinkEnabled: true,
        profileLinkId: "jordanmitchell",
        profileLinkBio: "State University Basketball | Computer Science Major | Content Creator",
        profileLinkPhotoUrl: "",
        profileLinkTheme: "gradient",
        profileLinkBackgroundColor: "#111111",
        profileLinkTextColor: "#ffffff",
        profileLinkAccentColor: "#e11d48",
        socialHandles: {
          instagram: "j.mitchell",
          twitter: "jordanmitchell",
          tiktok: "jmitch_hoops"
        },
        // Social metrics data
        metrics: {
          followerCount: 22750,
          engagement: 8.4,
          contentQuality: 9,
          instagramMetrics: {
            followers: 15200,
            engagement: 8.4,
            posts: 127,
            reachPerPost: 12300,
            impressions: 37500,
            savedPosts: 845,
            weeklyGrowth: 2.3
          },
          twitterMetrics: {
            followers: 3600,
            engagement: 2.1,
            tweets: 342,
            impressions: 15800,
            retweets: 210,
            likes: 1240,
            weeklyGrowth: 1.2
          },
          tiktokMetrics: {
            followers: 3950,
            engagement: 12.7,
            videos: 38,
            views: 245000,
            likes: 32100,
            shares: 5400,
            weeklyGrowth: 3.8
          }
        },
        profileLinkButtons: [
          {
            id: "1",
            label: "Instagram",
            url: "https://instagram.com/j.mitchell",
            type: "social"
          },
          {
            id: "2",
            label: "Twitter",
            url: "https://twitter.com/jordanmitchell",
            type: "social"
          },
          {
            id: "3",
            label: "TikTok",
            url: "https://tiktok.com/@jmitch_hoops",
            type: "social"
          },
          {
            id: "4",
            label: "Watch My Highlights",
            url: "https://youtube.com/c/jordanmitchell",
            type: "video"
          }
        ]
      };

      // Check if this is the requested profile or return 404
      if (profileLinkId.toLowerCase() === athleteProfile.profileLinkId.toLowerCase()) {
        res.json(athleteProfile);
      } else {
        res.status(404).json({ error: "Athlete profile not found" });
      }
    } catch (error) {
      console.error("Error fetching athlete profile:", error);
      res.status(500).json({ error: "Failed to fetch athlete profile" });
    }
  });

  // Refresh athlete metrics from social platforms
  app.get("/api/athlete-profile/:profileLinkId/refresh-metrics", async (req: Request, res: Response) => {
    try {
      const { profileLinkId } = req.params;

      // In a real implementation, this would fetch fresh data from social APIs
      // For demo purposes, we'll return slightly varied metrics

      const randomVariance = () => (Math.random() > 0.5 ? 1 : -1) * Math.random() * 0.1;

      // Check if profile exists
      if (profileLinkId.toLowerCase() === "jordanmitchell") {
        const updatedMetrics = {
          followerCount: Math.round(22750 * (1 + randomVariance())),
          engagement: parseFloat((8.4 * (1 + randomVariance())).toFixed(1)),
          contentQuality: 9,
          instagramMetrics: {
            followers: Math.round(15200 * (1 + randomVariance())),
            engagement: parseFloat((8.4 * (1 + randomVariance())).toFixed(1)),
            posts: 128, // One new post
            reachPerPost: Math.round(12300 * (1 + randomVariance())),
            impressions: Math.round(37500 * (1 + randomVariance())),
            savedPosts: Math.round(845 * (1 + randomVariance())),
            weeklyGrowth: parseFloat((2.3 * (1 +randomVariance())).toFixed(1))
          },
          twitterMetrics: {
            followers: Math.round(3600 * (1 + randomVariance())),
            engagement: parseFloat((2.1 * (1 + randomVariance())).toFixed(1)),
            tweets: 344, // Two new tweets
            impressions: Math.round(15800 * (1 + randomVariance())),
            retweets: Math.round(210 * (1 + randomVariance())),
            likes: Math.round(1240 * (1 + randomVariance())),
            weeklyGrowth: parseFloat((1.2 * (1 + randomVariance())).toFixed(1))
          },
          tiktokMetrics: {
            followers: Math.round(3950 * (1 + randomVariance())),
            engagement: parseFloat((12.7 * (1 + randomVariance())).toFixed(1)),
            videos: 39, // One new video
            views: Math.round(245000 * (1 + randomVariance())),
            likes: Math.round(32100 * (1 + randomVariance())),
            shares: Math.round(5400 * (1 + randomVariance())),
            weeklyGrowth: parseFloat((3.8 * (1 + randomVariance())).toFixed(1))
          }
        };

        res.json({
          success: true,
          metrics: updatedMetrics,
          lastUpdated: new Date()
        });
      } else {
        res.status(404).json({ error: "Athlete profile not found" });
      }
    } catch (error) {
      console.error("Error refreshing metrics:", error);
      res.status(500).json({ error: "Failed to refresh metrics" });
    }
  });

  // Update athlete profile link data
  app.post("/api/athlete-profile/:id/profile-link", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const profileLinkData = req.body;

      // In a real implementation, you would validate and update the database
      console.log(`Updating profile link data for athlete ID ${id}:`, profileLinkData);

      // Return updated profile data
      res.json({
        id: parseInt(id),
        ...profileLinkData,
        updated: true
      });
    } catch (error) {
      console.error("Error updating profile link:", error);
      res.status(500).json({ error: "Failed to update profile link" });
    }
  });

  // Admin API Routes - These should be properly secured in a production environment
  // Use our helper middleware for admin routes
  const requireAdmin = checkUserAuth("admin");

  // Admin routes
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;

      // Validate the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update the user with our new updateUser method
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ error: "Failed to update user" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  return httpServer;
}