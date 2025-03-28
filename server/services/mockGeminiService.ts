// This is a temporary mock replacement for geminiService to help debug server startup issues

class MockGeminiService {
  async classifyUser(message: string) {
    return {
      userType: "athlete",
      reply: "Thanks for letting me know you're an athlete!"
    };
  }

  async generateFollowUpQuestions(userType: string, baseReply: string) {
    return {
      reply: "Could you tell me more about yourself? This will help us find the best matches for you."
    };
  }

  async shouldShowForm(message: string, userType: string) {
    return true;
  }

  async continueConversation(message: string, sessionData: any, messageHistory: any[]) {
    return {
      reply: "I understand. Let's continue our conversation."
    };
  }

  async generateProfileConfirmation(userType: string, name: string) {
    return `Thanks for completing your profile, ${name}!`;
  }

  async generateCampaign(businessData: any) {
    return {
      title: "Mock Campaign",
      description: "This is a mock campaign description",
      deliverables: ["Post 1", "Post 2"]
    };
  }

  async generateMatchAnnouncement(score: number) {
    return "We've found a match for you!";
  }

  async processOnboardingProfile(profileData: any) {
    return {
      enrichedData: {
        profileStrengths: ["Strength 1", "Strength 2"],
        idealPartnerTraits: ["Trait 1", "Trait 2"],
        contentSuggestions: ["Suggestion 1", "Suggestion 2"],
        audienceInsights: {
          primaryDemographics: ["Demo 1"],
          engagementFactors: ["Factor 1"],
          reachEstimate: "Medium"
        },
        brandCompatibility: [
          {
            category: "Sports",
            compatibilityScore: 85,
            reason: "Good fit"
          }
        ]
      },
      recommendations: ["Recommendation 1"],
      accountType: "athlete",
      storedPreferences: {}
    };
  }

  async generateMatchScore(athlete: any, business: any, campaign: any) {
    return {
      score: 85,
      reason: "Good match",
      audienceFitScore: 80,
      contentStyleFitScore: 90,
      brandValueAlignmentScore: 85,
      engagementPotentialScore: 80,
      compensationFitScore: 90,
      strengthAreas: ["Area 1", "Area 2"],
      weaknessAreas: ["Area 3"],
      improvementSuggestions: ["Suggestion 1"]
    };
  }
}

export const geminiService = new MockGeminiService();