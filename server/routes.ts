import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
// Temporarily use mock service to debug server startup issues
import { geminiService } from "./services/mockGeminiService";
import { bigQueryService } from "./services/bigQueryService";
import { sessionService } from "./services/sessionService";
import { z } from "zod";
import { createHash } from "crypto";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./tempAuth";
import { insertFeedbackSchema, Feedback } from "@shared/schema";

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
  // Setup authentication
  setupAuth(app);
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
        
        // Send profile creation event to n8n webhook (non-blocking)
        if (process.env.N8N_WEBHOOK_URL) {
          const webhookData = {
            event_type: "business_profile_created",
            timestamp: new Date().toISOString(),
            data: {
              businessId: business.id,
              name: profileData.name,
              productType: profileData.productType,
              audienceGoals: profileData.audienceGoals,
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
      const sessionData = await sessionService.getSession(profileData.sessionId);
      if (!sessionData) {
        return res.status(404).json({
          message: "Session not found",
        });
      }
      
      console.log("Processing personalized onboarding data for session:", profileData.sessionId);
      
      // Process the profile data through Gemini AI to extract insights
      const processedProfile = await geminiService.processOnboardingProfile(profileData);
      
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
      const userType = req.query.userType || 'athlete';
      
      // If there's an actual stored profile, use that
      if (userType === 'athlete') {
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
        
        // No stored athlete profile, return mock data for demonstration
        return res.status(200).json({
          id: 1,
          name: "Jordan Mitchell",
          userType: "athlete",
          sport: "Basketball",
          school: "State University",
          division: "Division I",
          followerCount: "15.2K",
          contentStyle: "Athletic lifestyle",
          email: "jordan.mitchell@example.com",
          phone: "555-123-4567",
          socialMedia: {
            instagram: "@jordanmitchell",
            twitter: "@jmitch_hoops", 
            tiktok: "@jordanmitchell"
          },
          // Profile link data
          profileLinkEnabled: true,
          profileLinkId: "jordanmitchell",
          profileLinkBio: "State University Basketball | Computer Science Major | Content Creator",
          profileLinkPhotoUrl: "",
          profileLinkTheme: "gradient",
          profileLinkBackgroundColor: "#1e293b",
          profileLinkTextColor: "#ffffff",
          profileLinkAccentColor: "#3b82f6",
          profileLinkButtons: [
            {
              id: "1",
              label: "Instagram",
              url: "https://instagram.com/jordanmitchell",
              type: "social"
            },
            {
              id: "2",
              label: "Twitter",
              url: "https://twitter.com/jmitch_hoops",
              type: "social"
            },
            {
              id: "3",
              label: "TikTok",
              url: "https://tiktok.com/@jordanmitchell",
              type: "social"
            },
            {
              id: "4",
              label: "Watch My Highlights",
              url: "https://youtube.com/c/jordanmitchell",
              type: "video"
            }
          ]
        });
      }
      
      // If it's a business profile
      if (userType === 'business') {
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
        
        // No stored business profile, return mock data
        return res.status(200).json({
          id: 1,
          name: "Urban Athletics Co.",
          userType: "business",
          productType: "Athletic Apparel",
          audienceGoals: "Young adults interested in fitness and sports",
          values: "Sustainability, Quality, Innovation"
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

  // User registration endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, userType } = req.body;
      
      if (!email || !password || !fullName || !userType) {
        return res.status(400).json({
          message: "Missing required fields",
        });
      }
      
      // In a real application, you would:
      // 1. Hash the password
      // 2. Check for existing user with the same email
      // 3. Create user in database
      
      // For now, we'll simulate a successful registration
      const sessionId = createHash('sha256').update(Date.now().toString()).digest('hex').substring(0, 16);
      
      // Create a session for the new user
      await sessionService.createSession(sessionId);
      await sessionService.updateSession(sessionId, {
        userType,
        profileCompleted: true,
      });
      
      return res.status(201).json({
        message: "User registered successfully",
        sessionId,
        userType,
      });
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({
        message: "Failed to register user",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  
  // User login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password, userType } = req.body;
      
      if (!email || !password || !userType) {
        return res.status(400).json({
          message: "Missing required fields",
        });
      }
      
      // In a real application, you would:
      // 1. Verify credentials against database
      // 2. Handle login failures
      
      // For now, simulate a successful login
      const sessionId = createHash('sha256').update(Date.now().toString()).digest('hex').substring(0, 16);
      
      // Create a session for the logged-in user
      await sessionService.createSession(sessionId);
      await sessionService.updateSession(sessionId, {
        userType,
        profileCompleted: true,
      });
      
      return res.status(200).json({
        message: "Login successful",
        sessionId,
        userType,
      });
    } catch (error) {
      console.error("Error logging in:", error);
      return res.status(500).json({
        message: "Failed to log in",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

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
      // Use Array.from to avoid the MapIterator issue
      Array.from(connectedClients.entries()).forEach(([sessionId, client]) => {
        if (client === ws) {
          connectedClients.delete(sessionId);
          console.log(`Removed client with session ID: ${sessionId}`);
        }
      });
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
        userType: req.user.userType,
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
            return socket['userData'] && socket['userData'].userType === 'compliance';
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
      return res.status(200).json({ feedbacks });
    } catch (error) {
      console.error("Error retrieving public feedback:", error);
      return res.status(500).json({
        message: "Failed to retrieve public feedback",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Update feedback status (admin/compliance only)
  app.patch("/api/feedback/:feedbackId/status", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and has admin/compliance role
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== 'compliance') {
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
  app.patch("/api/feedback/:feedbackId/response", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated and has admin/compliance role
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      if (req.user.userType !== 'compliance') {
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
        const user = await storage.getUser(originalFeedback.userId);
        if (user && user.sessionId) {
          const clientSocket = connectedClients.get(user.sessionId);
          if (clientSocket && clientSocket.readyState === WebSocket.OPEN) {
            sendWebSocketMessage(user.sessionId, {
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
            weeklyGrowth: parseFloat((2.3 * (1 + randomVariance())).toFixed(1))
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
  // Check if the user is an admin
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = req.user as Express.User;
    if (user.userType !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  };
  
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
      // This is just a placeholder - in a real application, you would update the user in the database
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      // Validate the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Update the user
      // This would typically call a storage method like storage.updateUser(userId, userData)
      // For now, just return the original user with the updated data
      res.json({ ...user, ...userData });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  
  return httpServer;
}
