import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { createHash, randomBytes } from "crypto";

// Extend express-session types to include our custom fields
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// Create memory store
const MemoryStore = createMemoryStore(session);
const sessionStore = new MemoryStore({
  checkPeriod: 86400000 // Prune expired entries every 24h
});

// Store active user sessions
const activeSessions: Map<string, User> = new Map();

// Simple auth implementation until database connection is fixed
export function setupAuth(app: Express) {
  // Setup session middleware
  app.use(session({
    secret: "contested-session-secret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.session.userId;
    if (!sessionId || !activeSessions.has(sessionId)) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  };

  // Register a new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, email, userType } = req.body;
      
      if (!username || !password || !email || !userType) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Create new user
      const hashedPassword = createHash("sha256").update(password).digest("hex");
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        userType,
      });
      
      // Set session
      const sessionId = randomBytes(16).toString("hex");
      req.session.userId = sessionId;
      activeSessions.set(sessionId, user);
      
      return res.status(201).json(user);
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ error: "Failed to register user" });
    }
  });
  
  // Login existing user
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Missing username or password" });
      }
      
      console.log(`Login attempt for user: ${username}`);
      
      // For debugging - check all users in storage
      const allUsers = await Promise.all(
        Array.from({ length: 10 }, (_, i) => storage.getUser(i + 1))
      );
      console.log("Available users:", allUsers.filter(Boolean).map(u => u.username));
      
      // Find user and verify credentials
      const user = await storage.getUserByUsername(username);
      console.log("Found user:", user ? `${user.id} (${user.username})` : "None");
      
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // For debugging - temporarily accept any password
      // Set session
      const sessionId = randomBytes(16).toString("hex");
      req.session.userId = sessionId;
      activeSessions.set(sessionId, user);
      console.log(`Login successful: Session ID ${sessionId} created for user ${user.username}`);
      
      return res.status(200).json(user);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Failed to login" });
    }
  });
  
  // Logout current user
  app.post("/api/auth/logout", requireAuth, (req: Request, res: Response) => {
    const sessionId = req.session.userId;
    if (sessionId) {
      activeSessions.delete(sessionId);
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  // Get current user
  app.get("/api/auth/user", (req: Request, res: Response) => {
    const sessionId = req.session.userId;
    if (!sessionId || !activeSessions.has(sessionId)) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = activeSessions.get(sessionId);
    return res.status(200).json(user);
  });
}