import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth.js";

export function registerRoutes(app: Express): Server {
  // Set up auth routes with Passport.js
  setupAuth(app);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}