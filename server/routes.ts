import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { geminiService } from "./services/geminiService";
import { bigQueryService } from "./services/bigQueryService";
import { sessionService } from "./services/sessionService";
import { z } from "zod";
import { createHash } from "crypto";
import { WebSocketServer, WebSocket } from "ws";

// Map to store active WebSocket connections by session ID
const connectedClients = new Map<string, WebSocket>();

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
      productType: z.string().min(2, "Product type is required"),
      audienceGoals: z.string().min(10, "Audience goals are required"),
      campaignVibe: z.string().min(10, "Campaign vibe is required"),
      values: z.string().min(10, "Brand values are required"),
      targetSchoolsSports: z.string().min(5, "Target schools/sports are required"),
      budget: z.string().optional(),
    })
  ])
);

export async function registerRoutes(app: Express): Promise<Server> {
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
        // Classify user as athlete or business
        response = await geminiService.classifyUser(message);
        
        // Update session with user type
        if (response.userType) {
          await sessionService.updateSession(sessionId, {
            userType: response.userType
          });
        }
        
        // Handle follow-up questions based on user type
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
            // Return the form prompt
            return res.status(200).json({
              reply: userType === "athlete" 
                ? "Great! Let's create your mid-tier athlete profile. Please fill out the form below to help us match you with the right SMBs:" 
                : "Fantastic! Let's set up your SMB profile. Please complete the following details to help us find suitable athletes for your marketing campaigns:",
              isFormPrompt: true,
              showAthleteForm: userType === "athlete",
              showBusinessForm: userType === "business",
            });
          } else {
            // Continue the conversation
            response = await geminiService.continueConversation(message, sessionData);
          }
        } else {
          // Profile is completed, continue normal conversation
          response = await geminiService.continueConversation(message, sessionData);
        }
      }
      
      // Store assistant response
      await storage.storeMessage(sessionId, "assistant", response.reply);
      
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
        
        return res.status(200).json({
          message: "Athlete profile created successfully",
          reply,
        });
      } else if (userType === "business") {
        const businessData = {
          sessionId,
          name: profileData.name,
          productType: profileData.productType,
          audienceGoals: profileData.audienceGoals,
          campaignVibe: profileData.campaignVibe,
          values: profileData.values,
          targetSchoolsSports: profileData.targetSchoolsSports,
          budget: profileData.budget || "",
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
      // Get matches for the current session
      // This would normally use authentication, but for the demo we'll
      // just return a sample match
      
      const matches = await storage.getAllMatches();
      
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

  // Get profile for current session
  app.get("/api/profile", async (req: Request, res: Response) => {
    try {
      // This would normally use authentication, but for the demo
      // we'll just return a sample profile based on stored profiles
      
      // Check for athletes first
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
      
      // Check businesses
      const businesses = await storage.getAllBusinesses();
      if (businesses.length > 0) {
        return res.status(200).json({
          id: businesses[0].id,
          name: businesses[0].name,
          userType: "business",
          productType: businesses[0].productType,
          audienceGoals: businesses[0].audienceGoals,
          values: businesses[0].values,
        });
      }
      
      // No profiles found
      return res.status(404).json({
        message: "No profile found",
      });
    } catch (error) {
      console.error("Error getting profile:", error);
      return res.status(500).json({
        message: "Failed to retrieve profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Helper function to find the best match
  async function findBestMatch(athlete: any, business: any, campaign: any) {
    // Use Gemini to generate a match score
    const matchResponse = await geminiService.generateMatchScore(athlete, business, campaign);
    
    // Store the match
    const matchData = {
      athleteId: athlete.id,
      businessId: business.id,
      campaignId: campaign.id,
      score: matchResponse.score,
      reason: matchResponse.reason
    };
    
    const match = await storage.storeMatch(matchData);
    
    return match;
  }

  const httpServer = createServer(app);
  
  // Set up WebSocket server on a distinct path to avoid conflicts with Vite's HMR
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    // Handle incoming messages
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Register the client with their session ID
        if (data.type === 'register' && data.sessionId) {
          connectedClients.set(data.sessionId, ws);
          console.log(`Client registered with session ID: ${data.sessionId}`);
          
          // Send a welcome message
          ws.send(JSON.stringify({
            type: 'system',
            message: 'Connected to Contested real-time updates'
          }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Remove the client from the connected clients map
      for (const [sessionId, client] of connectedClients.entries()) {
        if (client === ws) {
          connectedClients.delete(sessionId);
          console.log(`Removed client with session ID: ${sessionId}`);
          break;
        }
      }
    });
  });
  
  // Helper function to send a WebSocket message to a client
  const sendWebSocketMessage = (sessionId: string, data: any) => {
    const client = connectedClients.get(sessionId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
      return true;
    }
    return false;
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
  
  return httpServer;
}
