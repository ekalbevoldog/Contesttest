import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { randomBytes } from "crypto";
import { User } from "@shared/schema";

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

// In-memory user storage for testing (completely standalone)
const testUsers = new Map<string, User>();
const activeSessions: Map<string, User> = new Map();

// Create some test users
const createTestUser = (username: string, userType: "athlete" | "business" | "compliance" | "admin"): User => {
  const id = testUsers.size + 1;
  const user: User = {
    id,
    username,
    password: "password123", // Plain text for testing
    email: `${username}@example.com`,
    userType,
    sessionId: null,
    verified: false,
    avatar: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };
  testUsers.set(username, user);
  console.log(`Created test user: ${username} (${userType})`);
  return user;
};

// Initialize test users
createTestUser("athlete1", "athlete");
createTestUser("business1", "business");
createTestUser("compliance1", "compliance");
createTestUser("blake", "business");
createTestUser("admin", "admin");

// Simple auth implementation with in-memory test users
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
      if (testUsers.has(username)) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Create new user
      if (userType !== "athlete" && userType !== "business" && userType !== "compliance" && userType !== "admin") {
        return res.status(400).json({ error: "Invalid user type" });
      }
      const user = createTestUser(username, userType);
      
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
      const usersList = Array.from(testUsers.keys());
      console.log("Available users:", usersList);
      
      // Find user by username or email
      let user = testUsers.get(username);
      
      // If not found by username, check if it's an email
      if (!user) {
        // Check all users to find one with matching email
        const allUsers = Array.from(testUsers.values());
        for (const userObj of allUsers) {
          if (userObj.email.toLowerCase() === username.toLowerCase()) {
            user = userObj;
            break;
          }
        }
      }
      
      console.log("Found user:", user ? `${user.id} (${user.username})` : "None");
      
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Accept any password for testing
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