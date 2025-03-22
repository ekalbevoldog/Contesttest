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
  isFormPrompt: z.boolean().optional(),
  showAthleteForm: z.boolean().optional(),
  showBusinessForm: z.boolean().optional(),
  showMatchResults: z.boolean().optional(),
  matchData: z.any().optional()
});

const campaignResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  deliverables: z.array(z.string())
});

const matchScoreSchema = z.object({
  score: z.number().min(0).max(100),
  reason: z.string()
});

class GeminiService {
  private apiKey: string;
  private geminiEndpoint: string;
  private retryCount: number = 3;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "default_key";
    this.geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  }

  // Helper method to make API calls to Gemini
  private async callGemini(prompt: string, responseSchema: any, retry: number = this.retryCount) {
    // Check if we're in development mode or don't have a valid API key
    if (this.apiKey === "default_key" || process.env.NODE_ENV === "development") {
      console.log("Using mock response for Gemini API as no valid API key is provided");
      
      // Determine what kind of response to mock based on the prompt
      if (prompt.includes("determine if the user is a college athlete or a business")) {
        if (prompt.toLowerCase().includes("athlete")) {
          return responseSchema.parse({
            userType: "athlete",
            reply: "Thanks for letting me know you're an athlete! I'd love to help connect you with potential NIL opportunities."
          });
        } else {
          return responseSchema.parse({
            userType: "business",
            reply: "Thanks for letting me know you're a business! I'd love to help connect you with student athletes for NIL partnerships."
          });
        }
      } else if (prompt.includes("generate a follow-up question")) {
        return responseSchema.parse({
          reply: "Could you tell me more about yourself? This will help us find the best matches for you."
        });
      } else if (prompt.includes("should see a form")) {
        return responseSchema.parse({
          showForm: true,
          reason: "User has expressed interest in creating a profile"
        });
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
          reason: "Strong alignment between the athlete's content style and the brand's campaign needs. The demographic overlap between the athlete's followers and the business target audience is significant."
        });
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
        reply: "Thanks for reaching out to NIL Connect! I'm here to help match college athletes with businesses. Could you tell me a bit more about yourself? Are you a college athlete looking for NIL opportunities, or a business looking to connect with athletes?"
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
      const result = await this.callGemini(prompt, formPromptSchema);
      return result.showForm;
    } catch (error) {
      console.error("Error determining if form should be shown:", error);
      // Default behavior - don't show form if there's an error
      return false;
    }
  }

  // Continue the conversation based on session data
  async continueConversation(message: string, sessionData: any) {
    const prompt = `
      You are an AI assistant for NIL Connect, a platform that matches college athletes with businesses for Name, Image, and Likeness (NIL) partnerships.
      
      You're talking to a ${sessionData.userType}.
      
      Here's what you know about this user:
      ${JSON.stringify(sessionData)}
      
      Their latest message is: "${message}"
      
      Respond in a helpful, conversational way. If they seem ready to create a profile, suggest they complete a profile form.
      If they've already completed their profile, discuss potential matches and next steps.
      
      Return your answer in the following JSON format:
      {
        "reply": "Your friendly, conversational response",
        "isFormPrompt": boolean (true if they should see a form),
        "showAthleteForm": boolean (true if they should see athlete form),
        "showBusinessForm": boolean (true if they should see business form)
      }
    `;
    
    try {
      return await this.callGemini(prompt, conversationResponseSchema);
    } catch (error) {
      console.error("Error continuing conversation:", error);
      // Fallback response
      return {
        reply: "I'm here to help you find the right NIL partnerships. Could you tell me more about what you're looking for?"
      };
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
      You are an AI assistant for NIL Connect, a platform that matches college athletes with businesses for Name, Image, and Likeness (NIL) partnerships.
      
      Assess the match between the following athlete and business/campaign:
      
      ATHLETE:
      Name: ${athlete.name}
      Sport: ${athlete.sport}
      School: ${athlete.school}
      Division: ${athlete.division}
      Follower Count: ${athlete.followerCount}
      Content Style: ${athlete.contentStyle}
      Compensation Goals: ${athlete.compensationGoals}
      
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
      
      Based on this information, generate a match score from 0-100, where 100 is a perfect fit.
      Consider factors like audience alignment, content style match, brand values, and compensation goals.
      
      Return your answer in the following JSON format:
      {
        "score": number between 0-100,
        "reason": "2-3 sentences explaining why this match works (or doesn't)"
      }
    `;
    
    try {
      return await this.callGemini(prompt, matchScoreSchema);
    } catch (error) {
      console.error("Error generating match score:", error);
      // Fallback match score
      return {
        score: 75,
        reason: `${athlete.name}'s content style appears to align with ${business.name}'s campaign needs. The athlete's audience demographic and the business's target audience have potential overlap.`
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
}

export const geminiService = new GeminiService();
