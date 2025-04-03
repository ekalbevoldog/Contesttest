import { z } from "zod";

// Define response schemas for Gemini
const userClassificationSchema = z.object({
  userType: z.enum(["athlete", "business"]),
  reply: z.string()
});

const formPromptSchema = z.object({
  showForm: z.boolean(),
  reason: z.string()
});

const conversationResponseSchema = z.object({
  reply: z.string(),
  isFormPrompt: z.boolean().optional().default(false),
  showAthleteForm: z.boolean().optional().default(false),
  showBusinessForm: z.boolean().optional().default(false),
  showMatchResults: z.boolean().optional().default(false),
  matchData: z.any().optional()
});

const campaignResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  deliverables: z.array(z.string())
});

const matchScoreSchema = z.object({
  score: z.number().min(0).max(100),
  reason: z.string(),
  // Detailed scoring dimensions
  audienceFitScore: z.number().min(0).max(100),
  contentStyleFitScore: z.number().min(0).max(100), 
  brandValueAlignmentScore: z.number().min(0).max(100),
  engagementPotentialScore: z.number().min(0).max(100),
  compensationFitScore: z.number().min(0).max(100),
  // Strength and weakness areas
  strengthAreas: z.array(z.string()),
  weaknessAreas: z.array(z.string()),
  // Improvement suggestions
  improvementSuggestions: z.array(z.string())
});

// New schema for processing and storing onboarding profile data
const onboardingProfileSchema = z.object({
  enrichedData: z.object({
    profileStrengths: z.array(z.string()),
    idealPartnerTraits: z.array(z.string()),
    contentSuggestions: z.array(z.string()),
    audienceInsights: z.object({
      primaryDemographics: z.array(z.string()),
      engagementFactors: z.array(z.string()),
      reachEstimate: z.string()
    }),
    brandCompatibility: z.array(z.object({
      category: z.string(),
      compatibilityScore: z.number().min(0).max(100),
      reason: z.string()
    }))
  }),
  recommendations: z.array(z.string()),
  accountType: z.enum(["athlete", "business"]),
  storedPreferences: z.record(z.any())
});

class GeminiService {
  private apiKey: string;
  private geminiEndpoint: string;
  private retryCount: number = 3;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "default_key";
    this.geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    console.log("Gemini API Key status:", this.apiKey === "default_key" ? "not loaded" : "loaded successfully");
  }

  // Helper method to make API calls to Gemini
  private async callGemini<T>(prompt: string, responseSchema: z.ZodType<T>, retry: number = this.retryCount): Promise<T> {
    // Check if we're in development mode or don't have a valid API key
    if (this.apiKey === "default_key" || process.env.NODE_ENV === "development") {
      console.log("Using mock response for Gemini API as no valid API key is provided");
      
      // Determine what kind of response to mock based on the prompt
      if (prompt.includes("determine if the user is a college athlete or a business")) {
        const userMessage = prompt.match(/Here's the user's message: "(.*?)"/)?.[1] || "";
        console.log(`Mock classification processing message: "${userMessage}"`);
        
        // Look for business indicators
        if (userMessage.toLowerCase().includes("business") || 
            userMessage.toLowerCase().match(/i'?m\s+a\s+business/i) ||
            userMessage.toLowerCase().includes("company") ||
            userMessage.toLowerCase().includes("brand") ||
            userMessage.toLowerCase().includes("marketing")) {
          console.log("Mock classification detected business");
          return responseSchema.parse({
            userType: "business",
            reply: "Thanks for letting me know you're a business! I'd love to help connect you with student athletes for NIL partnerships. What type of products or services does your business offer?"
          });
        }
        // Look for athlete indicators 
        else if (userMessage.toLowerCase().includes("athlete") || 
                userMessage.toLowerCase().includes("sports") ||
                userMessage.toLowerCase().includes("player") ||
                userMessage.toLowerCase().includes("college") ||
                userMessage.toLowerCase().includes("team")) {
          console.log("Mock classification detected athlete");
          return responseSchema.parse({
            userType: "athlete",
            reply: "Thanks for letting me know you're an athlete! I'd love to help connect you with potential NIL opportunities. What sport do you play, and which school do you attend?"
          });
        }
        // Default cases
        else if (prompt.toLowerCase().includes("athlete")) {
          return responseSchema.parse({
            userType: "athlete",
            reply: "Thanks for reaching out! I'd love to help connect you with potential NIL opportunities. What sport do you play, and which school do you attend?"
          });
        } else {
          return responseSchema.parse({
            userType: "business",
            reply: "Thanks for reaching out! I'd love to help connect you with student athletes for NIL partnerships. What type of products or services does your business offer?"
          });
        }
      } else if (prompt.includes("generate a follow-up question")) {
        return responseSchema.parse({
          reply: "Could you tell me more about yourself? This will help us find the best matches for you."
        });
      } else if (prompt.includes("should see a form")) {
        // Form prompts need to be handled differently based on schema type
        try {
          // First try to parse as a form prompt
          return responseSchema.parse({
            showForm: true,
            reason: "User has expressed interest in creating a profile"
          });
        } catch (e) {
          // If that fails, it's probably a conversation response schema
          return responseSchema.parse({
            reply: "Let me help you set up your profile. Would you like to proceed?",
            isFormPrompt: true
          });
        }
      } else if (prompt.includes("create a NIL campaign concept")) {
        return responseSchema.parse({
          title: "Campus Ambassador Program",
          description: "A seasonal partnership highlighting authentic student-athlete experiences with our products in daily campus life.",
          deliverables: [
            "2 social media posts per month",
            "1 Instagram/TikTok story per week",
            "Participation in one promotional event per semester"
          ]
        });
      } else if (prompt.includes("generate a match score")) {
        return responseSchema.parse({
          score: 85,
          reason: "Strong alignment between the athlete's content style and the brand's campaign needs. The demographic overlap between the athlete's followers and the business target audience is significant.",
          audienceFitScore: 90,
          contentStyleFitScore: 85,
          brandValueAlignmentScore: 80,
          engagementPotentialScore: 88,
          compensationFitScore: 78,
          strengthAreas: [
            "Strong audience demographic overlap",
            "Content style is highly compatible with campaign needs",
            "Authentic voice matches brand values"
          ],
          weaknessAreas: [
            "Compensation expectations may be slightly higher than budget",
            "Limited experience with similar campaign types"
          ],
          improvementSuggestions: [
            "Consider adjusting deliverable requirements to better match athlete's content style",
            "Explore ways to highlight athlete's unique strengths in campaign execution"
          ]
        });
      } else if (prompt.includes("Previous conversation history:")) {
        // This is a conversation with message history
        
        // Try to extract the latest message from the prompt
        const latestMessageMatch = prompt.match(/Their latest message is: "([^"]+)"/);
        const latestMessage = latestMessageMatch ? latestMessageMatch[1] : "No message found";
        
        // Mock different responses based on the content of the latest message
        if (latestMessage.toLowerCase().includes("profile") || latestMessage.toLowerCase().includes("sign up")) {
          return responseSchema.parse({
            reply: "I'd be happy to help you set up your profile! Just tell me whether you're an athlete looking for partnerships or a business seeking athlete connections, and we'll get started.",
            isFormPrompt: false
          });
        } else if (latestMessage.toLowerCase().includes("match") || latestMessage.toLowerCase().includes("partnership")) {
          return responseSchema.parse({
            reply: "Finding the right match is what we do best! Our AI-powered algorithm analyzes multiple dimensions including audience fit, content style, brand values, engagement potential, and compensation alignment to find your ideal partnerships.",
            isFormPrompt: false
          });
        } else if (latestMessage.toLowerCase().includes("price") || latestMessage.toLowerCase().includes("cost")) {
          return responseSchema.parse({
            reply: "Our pricing depends on your needs. We offer flexible plans for both athletes and businesses. Athletes can join free and pay only when they accept partnerships, while businesses can choose from several subscription tiers based on campaign volume.",
            isFormPrompt: false
          });
        } else {
          return responseSchema.parse({
            reply: "Thanks for your message! I'm here to help you navigate the Contested platform. Would you like to learn more about how our matching algorithm works, or are you ready to create a profile?",
            isFormPrompt: false
          });
        }
      } else {
        // Generic response
        return responseSchema.parse({
          reply: "I'm here to help connect college athletes with businesses for NIL opportunities. How can I assist you today?"
        });
      }
    }

    // If we have a valid API key, make the actual API call
    try {
      const response = await fetch(`${this.geminiEndpoint}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topP: 0.95,
            topK: 40
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract the text from the response
      const text = data.candidates[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error("Invalid response format from Gemini API");
      }
      
      // Parse JSON from text response if it contains JSON
      if (text.includes("{") && text.includes("}")) {
        // Extract JSON part from the text
        const jsonMatch = text.match(/({[\s\S]*})/);
        if (jsonMatch) {
          let jsonString = jsonMatch[0];
          
          // Parse the JSON
          try {
            const parsedData = JSON.parse(jsonString);
            return responseSchema.parse(parsedData);
          } catch (jsonError) {
            console.error("Error parsing JSON from Gemini response:", jsonError);
            // Fallback to return a structured response
            return responseSchema.parse({
              reply: text
            });
          }
        }
      }
      
      // Fallback for non-JSON response
      return responseSchema.parse({
        reply: text
      });
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      
      if (retry > 0) {
        console.log(`Retrying Gemini API call. Attempts remaining: ${retry-1}`);
        return this.callGemini(prompt, responseSchema, retry - 1);
      }
      
      throw error;
    }
  }

  // Classify user as athlete or business
  async classifyUser(message: string) {
    console.log(`Classifying user based on message: "${message}"`);
    
    // First try a direct pattern-matching approach for common indicators
    const messageLC = message.toLowerCase();
    
    // Business identification patterns
    const businessKeywords = [
      'business', 'company', 'brand', 'organization', 'enterprise', 
      'corporation', 'firm', 'startup', 'marketing', 'advertiser',
      'sponsor', 'partnership', 'hire', 'recruit', 'find athletes',
      'looking for athletes', 'work with athletes', 'promote', 'promote my',
      'promote our', 'my business', 'our business', 'my company',
      'our company', 'i own', 'we own', 'i run', 'we run', 
      'i manage', 'we manage', 'ceo', 'founder', 'owner',
      'sell', 'selling', 'product', 'service', 'audience',
      'customers', 'market', 'advertise', 'advertising', 'campaign',
      'promotion', 'launch', 'brand awareness'
    ];
    
    // Check for direct "I'm a business" statement
    const businessRegex = /(?:i'?m|i\s+am)\s+a\s+business/i;
    if (businessRegex.test(messageLC)) {
      console.log(`Direct business identification found in: "${message}"`);
      return {
        userType: "business", 
        reply: "Thanks for letting me know you're a business! I'd love to help connect you with student athletes for NIL partnerships. What type of products or services does your business offer?"
      };
    }
    
    // Check for business keywords
    if (businessKeywords.some(keyword => messageLC.includes(keyword))) {
      console.log(`Business keyword found in: "${message}"`);
      return {
        userType: "business", 
        reply: "Thanks for reaching out! Based on your message, it seems you're representing a business interested in NIL partnerships. I'd love to help connect you with student athletes. Could you tell me more about your business and what you're looking for in a partnership?"
      };
    }
    
    // Athlete identification patterns
    const athleteKeywords = [
      'athlete', 'player', 'team', 'sport', 'sports', 'game', 'games',
      'play', 'playing', 'compete', 'competing', 'competition',
      'college', 'university', 'school', 'NCAA', 'division', 
      'scholarship', 'recruit', 'recruiting', 'coach', 'coaching',
      'practice', 'training', 'workout', 'my sport', 'my team',
      'student athlete', 'varsity', 'amateur', 'professional',
      'tournament', 'championship', 'league', 'conference'
    ];
    
    // Check for direct "I'm an athlete" statement
    const athleteRegex = /(?:i'?m|i\s+am)\s+(?:an|a)\s+athlete/i;
    if (athleteRegex.test(messageLC)) {
      console.log(`Direct athlete identification found in: "${message}"`);
      return {
        userType: "athlete", 
        reply: "Thanks for letting me know you're an athlete! I'd love to help connect you with potential NIL opportunities. What sport do you play, and which school do you attend?"
      };
    }
    
    // Check for athlete keywords
    if (athleteKeywords.some(keyword => messageLC.includes(keyword))) {
      console.log(`Athlete keyword found in: "${message}"`);
      return {
        userType: "athlete", 
        reply: "Thanks for reaching out! It sounds like you're an athlete interested in NIL opportunities. I'd love to help connect you with businesses. Could you tell me more about your sport and which school you attend?"
      };
    }
    
    // If no clear pattern is found, use the AI model
    const prompt = `
      You are an AI assistant for NIL Connect, a platform that matches college athletes with businesses for Name, Image, and Likeness (NIL) partnerships.
      
      Your task is to determine if the user is a college athlete or a business based on their message. 
      Always return your answer in the following JSON format:
      {
        "userType": "athlete" or "business",
        "reply": "Your friendly, conversational response acknowledging their type and asking for more information"
      }
      
      Here's the user's message: "${message}"
    `;
    
    try {
      return await this.callGemini(prompt, userClassificationSchema);
    } catch (error) {
      console.error("Error classifying user:", error);
      // Fallback response if classification fails
      return {
        userType: "athlete", // Default to athlete
        reply: "Thanks for reaching out to Contested! I'm here to help match college athletes with businesses. Could you tell me a bit more about yourself? Are you a college athlete looking for NIL opportunities, or a business looking to connect with athletes?"
      };
    }
  }

  // Generate follow-up questions based on user type
  async generateFollowUpQuestions(userType: string, previousReply: string) {
    const prompt = `
      You are an AI assistant for NIL Connect, a platform that matches college athletes with businesses for Name, Image, and Likeness (NIL) partnerships.
      
      The user has been identified as a ${userType}. I'll provide you with the last message you sent them.
      
      Your previous message: "${previousReply}"
      
      Now, generate a follow-up question to learn more about the ${userType}. If they're an athlete, ask about their sport, school, or social media following. If they're a business, ask about their products, target audience, or campaign goals.
      
      Return your answer in the following JSON format:
      {
        "reply": "Your friendly, conversational follow-up question"
      }
    `;
    
    try {
      return await this.callGemini(prompt, conversationResponseSchema);
    } catch (error) {
      console.error("Error generating follow-up questions:", error);
      // Fallback response
      return {
        reply: userType === "athlete"
          ? "Could you tell me more about yourself as an athlete? What sport do you play, and which school do you attend?"
          : "Could you tell me more about your business? What products or services do you offer, and who is your target audience?"
      };
    }
  }

  // Determine if a form should be shown based on the conversation
  async shouldShowForm(message: string, userType: string) {
    console.log(`shouldShowForm called with message: "${message}", userType: "${userType}"`);
    
    // Check for common keywords that might indicate the user wants to proceed
    const affirmativeKeywords = ['yes', 'sure', 'proceed', 'ok', 'okay', 'go ahead', 'submit', 'profile', 'form', 'register', 'signup', 'sign up', 'sign me up', 'continue', 'next', 'business', 'athlete', 'partner', 'i am', 'start', 'ready'];
    
    // Simple keyword matching instead of relying on the AI for this determination
    const messageLC = message.toLowerCase();
    
    // More comprehensive business identification patterns
    const businessKeywords = [
      'business', 'company', 'brand', 'organization', 'enterprise', 
      'corporation', 'firm', 'startup', 'marketing', 'advertiser',
      'sponsor', 'partnership', 'hire', 'recruit', 'find athletes',
      'looking for athletes', 'work with athletes', 'promote', 'promote my',
      'promote our', 'my business', 'our business', 'my company',
      'our company', 'i own', 'we own', 'i run', 'we run', 
      'i manage', 'we manage', 'ceo', 'founder', 'owner',
      'sell', 'selling', 'product', 'service', 'audience',
      'customers', 'market', 'advertise', 'advertising', 'campaign',
      'promotion', 'launch', 'brand awareness', 'im a business'
    ];
    
    // Check for business identification
    if (businessKeywords.some(keyword => messageLC.includes(keyword))) {
      console.log(`Form display triggered for business: "${message}" (matched business keyword)`);
      return true;
    }
    
    // Check specifically for "I'm a business" variants
    if (messageLC.match(/i'?m\s+a\s+business/i) || messageLC.match(/i\s+am\s+a\s+business/i)) {
      console.log(`Form display triggered for direct business identification: "${message}"`);
      return true;
    }
    
    // Special handling for athlete identification
    if (messageLC.includes('athlete') || messageLC.includes('player') || messageLC.includes('sports') || 
        messageLC.includes('team') || messageLC.includes('college') || 
        messageLC.includes('university') || messageLC.includes('school')) {
      console.log(`Form display triggered for athlete: "${message}"`);
      return true;
    }
    
    // Check for any affirmative keywords
    if (affirmativeKeywords.some(keyword => messageLC.includes(keyword))) {
      console.log(`Form display triggered by keyword match: "${message}"`);
      return true;
    }
    
    // Short affirmative responses
    if (['yes', 'y', 'sure', 'ok', 'yeah'].includes(messageLC.trim())) {
      console.log(`Form display triggered by short affirmative: "${message}"`);
      return true;
    }
    
    // For longer or more complex messages, use AI-based determination
    const prompt = `
      You are an AI assistant for NIL Connect, a platform that matches college athletes with businesses for Name, Image, and Likeness (NIL) partnerships.
      
      Analyze the following message from a ${userType} and determine if they are ready to fill out a detailed profile form.
      The user would be ready if they express interest in creating a profile, finding matches, or registering with the platform.
      
      User message: "${message}"
      
      Return your answer in the following JSON format:
      {
        "showForm": true or false,
        "reason": "Brief explanation of your decision"
      }
    `;
    
    try {
      // First, try using the formPromptSchema
      try {
        const result = await this.callGemini(prompt, formPromptSchema);
        console.log(`AI form decision for "${message}": ${result.showForm ? "show form" : "don't show form"}`);
        return result.showForm;
      } catch (formError) {
        console.log("Error with form prompt schema, trying fallback method", formError);
        
        // Fallback to a simpler check using conversationResponseSchema
        const conversationResult = await this.callGemini(prompt, conversationResponseSchema);
        
        // If we got any response, check for positive indicators
        if (conversationResult && conversationResult.reply) {
          const shouldShow = conversationResult.reply.toLowerCase().includes('yes') || 
                            conversationResult.reply.toLowerCase().includes('profile') ||
                            conversationResult.reply.toLowerCase().includes('form');
          console.log(`Fallback form decision for "${message}": ${shouldShow ? "show form" : "don't show form"}`);
          return shouldShow;
        }
      }
      
      // If we reached here, default to false
      console.log(`No determination made for "${message}", defaulting to false`);
      return false;
    } catch (error) {
      console.error("Error determining if form should be shown:", error);
      // Check if the original message directly indicates readiness
      const fallbackDecision = messageLC === 'yes' || 
                             messageLC === 'yes please' || 
                             messageLC.includes('proceed');
      console.log(`Error fallback for "${message}": ${fallbackDecision ? "show form" : "don't show form"}`);
      return fallbackDecision;
    }
  }

  // Continue the conversation based on session data
  async continueConversation(message: string, sessionData: any, messageHistory: any[] = []) {
    // Check if we have enough message history (at least 2 messages)
    if (messageHistory.length < 2) {
      console.log("Not enough message history, using simplified response");
      
      // If the user just said "yes" or similar to our profile setup question, 
      // let's respond appropriately
      const affirmativeKeywords = ['yes', 'sure', 'ok', 'okay', 'proceed', 'go ahead', 'sign me up'];
      if (affirmativeKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
        return {
          reply: "Great! Let me guide you through setting up your profile. First, tell me whether you're an athlete looking for partnerships or a business seeking athlete connections.",
          isFormPrompt: false
        };
      }
      
      // Default new conversation response
      return {
        reply: `Thanks for reaching out to Contested! I'm here to help ${sessionData.userType === 'athlete' ? 'athletes find brand partnerships' : 'businesses connect with college athletes'}. What specific aspects of NIL partnerships are you interested in?`,
        isFormPrompt: false
      };
    }
    
    // Format the message history for the prompt, but only use the last 5 exchanges to keep context manageable
    const recentMessages = messageHistory.slice(-10); // Keep last 10 messages max
    
    const formattedHistory = recentMessages.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');
    
    console.log(`Processing conversation with ${recentMessages.length} recent messages`);
    
    const userInfo = sessionData.userType ? 
      `${sessionData.userType}${sessionData.name ? ` named ${sessionData.name}` : ''}` : 
      'user whose type is still unknown';
    
    const profileStatus = sessionData.profileCompleted ? 
      "They've already completed their profile." : 
      "They haven't completed their profile yet.";
    
    const prompt = `
      You are an AI assistant for Contested, a platform that matches college athletes with businesses for Name, Image, and Likeness (NIL) partnerships.
      
      You're talking to a ${userInfo}. ${profileStatus}
      
      Here's what you know about this user:
      ${JSON.stringify(sessionData)}
      
      Previous conversation history:
      ${formattedHistory}
      
      Their latest message is: "${message}"
      
      Respond in a helpful, conversational way, making sure your response is relevant to their latest message and doesn't repeat previous responses.
      
      If they have not completed their profile yet and seem interested:
      - Ask specific questions to gather their information, like sport/school (for athletes) or product/audience (for businesses)
      - Eventually suggest they complete a full profile form when appropriate
      
      If they've already completed their profile:
      - Discuss potential matches and next steps based on their profile information
      - Offer insights about effective NIL partnerships
      
      Return your answer in the following JSON format:
      {
        "reply": "Your friendly, conversational response that addresses their specific question or message",
        "isFormPrompt": boolean (true if they should see a form),
        "showAthleteForm": boolean (true if they should see athlete form),
        "showBusinessForm": boolean (true if they should see business form)
      }
    `;
    
    try {
      return await this.callGemini(prompt, conversationResponseSchema);
    } catch (error) {
      console.error("Error continuing conversation:", error);
      
      // Fallback response - check if the message history has a pattern we can use
      // Look for a recent assistant message to avoid repeating
      const lastAssistantMsg = messageHistory
        .filter(msg => msg.role === 'assistant')
        .pop();
      
      // Provide a varied response based on last message to avoid repetition
      if (lastAssistantMsg && lastAssistantMsg.content.includes("profile")) {
        return {
          reply: "Thanks for your interest! To find the best matches for you on Contested, we need to know a bit more about you. What specific goals are you hoping to achieve with NIL partnerships?",
          isFormPrompt: false
        };
      } else {
        return {
          reply: "I'm here to help you navigate NIL partnerships on Contested. Could you tell me more about what you're looking for specifically?",
          isFormPrompt: false
        };
      }
    }
  }

  // Generate campaign concepts for a business
  async generateCampaign(businessProfile: any) {
    const prompt = `
      You are an AI assistant for NIL Connect, a platform that matches college athletes with businesses for Name, Image, and Likeness (NIL) partnerships.
      
      Based on the following business profile, create a NIL campaign concept with a title, description, and specific deliverables:
      
      Business Name: ${businessProfile.name}
      Product Type: ${businessProfile.productType}
      Audience Goals: ${businessProfile.audienceGoals}
      Campaign Vibe: ${businessProfile.campaignVibe}
      Brand Values: ${businessProfile.values}
      Target Schools/Sports: ${businessProfile.targetSchoolsSports}
      Budget: ${businessProfile.budget || "Not specified"}
      
      Return your answer in the following JSON format:
      {
        "title": "Campaign title (short and catchy)",
        "description": "Detailed description of the campaign concept (2-3 sentences)",
        "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"]
      }
    `;
    
    try {
      return await this.callGemini(prompt, campaignResponseSchema);
    } catch (error) {
      console.error("Error generating campaign:", error);
      // Fallback campaign
      return {
        title: `${businessProfile.name} Ambassador Program`,
        description: `A partnership program that showcases how ${businessProfile.productType} integrates into the authentic lifestyle of student athletes. Highlighting brand values of ${businessProfile.values}.`,
        deliverables: [
          "2 social media posts per month",
          "1 story/reel per week",
          "Brand mention in post-game interviews"
        ]
      };
    }
  }

  // Generate match score between athlete and business
  async generateMatchScore(athlete: any, business: any, campaign: any) {
    const prompt = `
      You are an AI assistant for Contested, a platform that matches college athletes with businesses for Name, Image, and Likeness (NIL) partnerships.
      
      Analyze the potential partnership match between the following athlete and business/campaign in detail.
      Use your expertise in sports marketing, influencer partnerships, and brand alignment to generate a 
      comprehensive, multi-dimensional matching analysis.
      
      ATHLETE:
      Name: ${athlete.name}
      Sport: ${athlete.sport}
      School: ${athlete.school}
      Division: ${athlete.division}
      Follower Count: ${athlete.followerCount}
      Content Style: ${athlete.contentStyle}
      Compensation Goals: ${athlete.compensationGoals}
      ${athlete.socialMediaMetrics ? `Social Media Metrics: ${JSON.stringify(athlete.socialMediaMetrics)}` : ''}
      
      BUSINESS:
      Name: ${business.name}
      Product Type: ${business.productType}
      Audience Goals: ${business.audienceGoals}
      Campaign Vibe: ${business.campaignVibe}
      Brand Values: ${business.values}
      Target Schools/Sports: ${business.targetSchoolsSports}
      
      CAMPAIGN:
      Title: ${campaign.title}
      Description: ${campaign.description}
      Deliverables: ${JSON.stringify(campaign.deliverables)}
      
      Generate a sophisticated multi-dimensional matching score with the following components:
      
      1. OVERALL MATCH SCORE: A weighted average (0-100) that considers all factors below.
      
      2. DIMENSION SCORES (0-100 each):
         - Audience Fit: How well the athlete's followers match the business's target audience
         - Content Style Fit: Compatibility between athlete's content style and campaign needs
         - Brand Value Alignment: How well the athlete's personal brand aligns with business values
         - Engagement Potential: Predicted engagement rates for the campaign content
         - Compensation Fit: How well campaign budget matches athlete's compensation expectations
      
      3. STRENGTH & WEAKNESS ANALYSIS:
         - Identify 2-4 specific partnership strengths (specific areas of high compatibility)
         - Identify 1-3 potential challenges or areas of concern
         
      4. IMPROVEMENT SUGGESTIONS:
         - Provide 2-3 actionable recommendations to improve match quality
      
      Return your comprehensive analysis in the following JSON format:
      {
        "score": number between 0-100,
        "reason": "2-3 sentences explaining overall match quality",
        "audienceFitScore": number between 0-100,
        "contentStyleFitScore": number between 0-100,
        "brandValueAlignmentScore": number between 0-100,
        "engagementPotentialScore": number between 0-100,
        "compensationFitScore": number between 0-100,
        "academicAlignmentScore": number between 0-100,
        "geographicFitScore": number between 0-100,
        "timingCompatibilityScore": number between 0-100,
        "platformSpecializationScore": number between 0-100,
        "strengthAreas": ["strength1", "strength2", "strength3", "strength4"],
        "weaknessAreas": ["weakness1", "weakness2", "weakness3"],
        "improvementSuggestions": ["suggestion1", "suggestion2", "suggestion3"]
      }
    `;
    
    try {
      return await this.callGemini(prompt, matchScoreSchema);
    } catch (error) {
      console.error("Error generating match score:", error);
      // Fallback match score
      return {
        score: 75,
        reason: `${athlete.name}'s content style appears to align with ${business.name}'s campaign needs. The athlete's audience demographic and the business's target audience have potential overlap.`,
        audienceFitScore: 78,
        contentStyleFitScore: 80,
        brandValueAlignmentScore: 72,
        engagementPotentialScore: 75,
        compensationFitScore: 70,
        strengthAreas: [
          "Audience demographic alignment",
          "Content style compatibility",
          "Brand voice synergy"
        ],
        weaknessAreas: [
          "Limited experience with similar partnerships",
          "Potential scheduling conflicts"
        ],
        improvementSuggestions: [
          "Focus on highlighting shared brand values in content",
          "Consider flexible deliverable timeline to accommodate athlete schedule"
        ]
      };
    }
  }

  // Generate profile confirmation message
  async generateProfileConfirmation(userType: string, name: string) {
    const prompt = `
      You are an AI assistant for NIL Connect, a platform that matches college athletes with businesses for Name, Image, and Likeness (NIL) partnerships.
      
      Generate a friendly confirmation message for a ${userType} named ${name} who just completed their profile.
      Thank them for their information and explain what happens next (looking for matches).
      
      Keep your response conversational and under 3 sentences.
    `;
    
    try {
      const response = await this.callGemini(prompt, z.object({ reply: z.string() }));
      return response.reply;
    } catch (error) {
      console.error("Error generating profile confirmation:", error);
      // Fallback confirmation
      return userType === "athlete"
        ? `Thanks for completing your profile, ${name}! We've recorded your information and will start looking for businesses that match your sport, following, and content style. I'll let you know when we find potential partnerships!`
        : `Thanks for completing your business profile, ${name}! We've recorded your information and will start looking for athletes who match your brand values and campaign needs. I'll notify you when we find potential partnerships!`;
    }
  }

  // Generate match announcement
  async generateMatchAnnouncement(score: number) {
    const prompt = `
      You are an AI assistant for NIL Connect, a platform that matches college athletes with businesses for Name, Image, and Likeness (NIL) partnerships.
      
      Generate an exciting announcement for a user that we found a match with a score of ${score}/100.
      Be enthusiastic but professional, and explain that they can view the match details below.
      
      Keep your response conversational and under 3 sentences.
    `;
    
    try {
      const response = await this.callGemini(prompt, z.object({ reply: z.string() }));
      return response.reply;
    } catch (error) {
      console.error("Error generating match announcement:", error);
      // Fallback announcement
      return `Great news! We've found a potential match with a compatibility score of ${score}%. Check out the details below to see why we think this partnership could work well for you.`;
    }
  }

  // Process and store personalized onboarding profile data
  async processOnboardingProfile(profileData: any) {
    const prompt = `
      You are an AI assistant for Contested, a platform that matches college athletes with businesses for Name, Image, and Likeness (NIL) partnerships.
      
      Analyze the following detailed onboarding profile data and extract valuable insights to enhance our matching system.
      The data was collected through our personalized onboarding wizard.
      
      USER PROFILE DATA:
      ${JSON.stringify(profileData, null, 2)}
      
      Based on this information:
      1. Identify the user's core profile strengths (3-5 points)
      2. Define what makes an ideal partner for this user (3-5 traits)
      3. Suggest content ideas that would work well for this profile (3-5 ideas)
      4. Provide audience insights including primary demographics, engagement factors, and estimated reach
      5. Identify 3-5 brand/industry categories this profile would be compatible with and assign a compatibility score (0-100)
      6. Provide 2-3 recommendations for the user to improve their partnership potential
      
      Return your analysis in the following JSON format:
      {
        "enrichedData": {
          "profileStrengths": ["strength1", "strength2", "strength3"],
          "idealPartnerTraits": ["trait1", "trait2", "trait3"],
          "contentSuggestions": ["suggestion1", "suggestion2", "suggestion3"],
          "audienceInsights": {
            "primaryDemographics": ["demo1", "demo2"],
            "engagementFactors": ["factor1", "factor2"],
            "reachEstimate": "Descriptive estimate"
          },
          "brandCompatibility": [
            {
              "category": "Industry/Brand Category",
              "compatibilityScore": number between 0-100,
              "reason": "Brief explanation"
            }
          ]
        },
        "recommendations": ["recommendation1", "recommendation2"],
        "accountType": "athlete" or "business",
        "storedPreferences": The complete profile data for storage
      }
    `;
    
    try {
      return await this.callGemini(prompt, onboardingProfileSchema);
    } catch (error) {
      console.error("Error processing onboarding profile:", error);
      // Fallback profile processing
      return {
        enrichedData: {
          profileStrengths: [
            "Strong personal brand identity",
            "Clear content preferences and style",
            "Well-defined audience targeting"
          ],
          idealPartnerTraits: [
            "Value alignment with user's core principles",
            "Budget compatible with user's expectations",
            "Content style that matches user preferences"
          ],
          contentSuggestions: [
            "Authentic day-in-the-life content",
            "Product integration into normal routines",
            "Behind-the-scenes partnership content"
          ],
          audienceInsights: {
            primaryDemographics: ["18-24 year olds", "College students", "Sports enthusiasts"],
            engagementFactors: ["Authenticity", "Relatability", "Consistent posting"],
            reachEstimate: "Medium reach potential with high engagement in niche communities"
          },
          brandCompatibility: [
            {
              category: "Sports Apparel",
              compatibilityScore: 85,
              reason: "Strong alignment with user's athletic profile and content style"
            },
            {
              category: "Nutrition/Supplements",
              compatibilityScore: 75,
              reason: "Relevant to user's lifestyle and audience demographics"
            },
            {
              category: "Tech/Electronics",
              compatibilityScore: 65,
              reason: "Potential for lifestyle integration in content"
            }
          ]
        },
        recommendations: [
          "Consider expanding content variety to attract diverse partnership opportunities",
          "Highlight specific achievements to increase brand value perception"
        ],
        accountType: profileData.userType || "athlete",
        storedPreferences: profileData
      };
    }
  }
}

export const geminiService = new GeminiService();
