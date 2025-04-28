
/**
 * This file contains public API routes for exposing 
 * necessary environment variables to the client.
 */
import express, { Request, Response } from 'express';
import crypto from 'crypto';

// Store active sessions in memory for simplicity
const activeSessions: Record<string, {
  id: string;
  createdAt: Date;
  userType?: string;
  currentStep?: string;
  data?: any;
}> = {};

export function registerPublicRoutes(app: express.Express) {
  // Route to provide client-side Supabase credentials
  app.get('/api/config/supabase', (req: Request, res: Response) => {
    res.json({
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY
    });
  });
  
  // Route to generate a new session ID for onboarding
  app.get('/api/session/new', (req: Request, res: Response) => {
    const sessionId = crypto.randomUUID();
    activeSessions[sessionId] = {
      id: sessionId,
      createdAt: new Date()
    };
    res.json({
      sessionId,
      success: true
    });
  });
  
  // Route to check session status - useful for debugging
  app.get('/api/session/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (activeSessions[id]) {
      res.json({
        session: activeSessions[id],
        exists: true
      });
    } else {
      res.status(404).json({
        message: "Session not found",
        exists: false
      });
    }
  });
  
  // Route to set session user type
  app.post('/api/session/:id/user-type', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userType } = req.body;
    
    if (!activeSessions[id]) {
      activeSessions[id] = {
        id,
        createdAt: new Date()
      };
    }
    
    activeSessions[id].userType = userType;
    
    res.json({
      session: activeSessions[id],
      success: true
    });
  });
  
  // Route to update current step
  app.post('/api/session/:id/step', (req: Request, res: Response) => {
    const { id } = req.params;
    const { step } = req.body;
    
    if (!activeSessions[id]) {
      // Create session if it doesn't exist (supports local fallback sessions)
      activeSessions[id] = {
        id,
        createdAt: new Date()
      };
    }
    
    activeSessions[id].currentStep = step;
    
    res.json({
      session: activeSessions[id],
      success: true
    });
  });
  
  // Route to update form data
  app.post('/api/session/:id/data', (req: Request, res: Response) => {
    const { id } = req.params;
    const { userType, data } = req.body;
    
    if (!activeSessions[id]) {
      // Create session if it doesn't exist (supports local fallback sessions)
      activeSessions[id] = {
        id,
        createdAt: new Date()
      };
    }
    
    activeSessions[id].userType = userType;
    activeSessions[id].data = data;
    
    res.json({
      session: activeSessions[id],
      success: true
    });
  });
  
  // Debug endpoint to test profile creation
  app.post('/api/debug/profile', (req: Request, res: Response) => {
    const { userId, userType, sessionId, name, email } = req.body;
    
    // Log the received data
    console.log("Debug profile creation request:", {
      userId,
      userType,
      sessionId,
      name,
      email
    });
    
    // Check if all required fields are present
    const missingFields = [];
    if (!userId) missingFields.push("userId");
    if (!userType) missingFields.push("userType");
    if (!sessionId) missingFields.push("sessionId");
    if (!name) missingFields.push("name");
    if (!email) missingFields.push("email");
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
        received: req.body
      });
    }
    
    // Return success if all fields are present
    return res.status(200).json({
      success: true,
      message: "All required fields present for profile creation",
      receivedData: {
        userId,
        userType,
        sessionId,
        name,
        email
      }
    });
  });
}
