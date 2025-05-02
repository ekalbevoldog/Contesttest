import passport from "passport";
import { Strategy as LocalStrategy, IVerifyOptions } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
// Import User schema
import { User, User as SchemaUser } from "../shared/schema.js";

// Define DateFields for Express.User compatibility
interface ExpressDateFields {
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

declare global {
  namespace Express {
    // Define User interface compatible with our schema
    interface User {
      // Required fields
      id: string;
      email: string;
      username: string;
      password: string;
      role: "athlete" | "business" | "compliance" | "admin";
      created_at: Date;
      metadata: Record<string, any>;
      
      // Optional fields
      auth_id?: string;
      last_login?: Date;
      stripe_customer_id?: string;
      stripe_subscription_id?: string;
      subscription_status?: string;
      subscription_plan?: string;
      subscription_current_period_end?: Date;
      subscription_cancel_at_period_end?: boolean;
      
      // Additional fields
      stripe_id?: string;
      sessionId?: string;
      
      // DateFields compatibility
      createdAt?: Date;
      updatedAt?: Date;
      lastLogin?: Date;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  try {
    // Now we can use the properly configured PostgreSQL session store or fallback
    const sessionSettings: session.SessionOptions = {
      secret: process.env.SESSION_SECRET || 'nil-connect-secret-key',
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore, // Using our memory store fallback if PostgreSQL fails
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      }
    };

    // Set trust proxy when in production
    if (process.env.NODE_ENV === 'production') {
      app.set("trust proxy", 1);
    }
    
    console.log("[Auth] Setting up Express session middleware");
    app.use(session(sessionSettings));
    
    console.log("[Auth] Initializing Passport authentication");
    app.use(passport.initialize());
    app.use(passport.session());
    
    console.log("[Auth] Auth middleware setup completed");
  } catch (error) {
    console.error("[Auth] Error setting up auth middleware:", error);
    
    // Fallback to a basic memory session store if the main setup fails
    console.log("[Auth] Using fallback memory session store");
    
    const fallbackSessionSettings: session.SessionOptions = {
      secret: process.env.SESSION_SECRET || 'nil-connect-fallback-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 1 day (shorter for fallback)
      }
    };
    
    app.use(session(fallbackSessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());
  }

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // In our system, username is actually an email
        const user = await storage.getUserByEmail(username);
        
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // Compare the provided password with the stored password
        const passwordsMatch = await comparePasswords(password, user.password);
        
        if (!passwordsMatch) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // Create a valid SchemaUser object with all required properties
        const validUser = {
          id: user.id.toString(), // Ensure id is a string
          email: user.email || '',
          username: user.username || '',
          password: user.password || '',
          role: user.role || 'business',
          created_at: user.created_at || new Date(),
          metadata: user.metadata || {},
          // Include all other fields
          auth_id: user.auth_id,
          last_login: user.last_login,
          stripe_customer_id: user.stripe_customer_id,
          stripe_subscription_id: user.stripe_subscription_id,
          subscription_status: user.subscription_status,
          subscription_plan: user.subscription_plan,
          subscription_current_period_end: user.subscription_current_period_end,
          subscription_cancel_at_period_end: user.subscription_cancel_at_period_end,
          // Add DateFields compatibility properties
          createdAt: user.created_at || new Date(),
          updatedAt: new Date()
        };
        return done(null, validUser);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      
      if (!user) {
        return done(null, false);
      }
      
      // Create a complete User object with all required properties
      const validUser = {
        id: user.id.toString(),
        email: user.email || '',
        username: user.username || '',
        password: user.password || '',
        role: user.role || 'business',
        created_at: user.created_at || new Date(),
        metadata: user.metadata || {},
        // Optional fields
        auth_id: user.auth_id,
        last_login: user.last_login,
        stripe_customer_id: user.stripe_customer_id,
        stripe_subscription_id: user.stripe_subscription_id,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        subscription_current_period_end: user.subscription_current_period_end,
        subscription_cancel_at_period_end: user.subscription_cancel_at_period_end,
        // Add DateFields compatibility properties
        createdAt: user.created_at || new Date(),
        updatedAt: new Date()
      };
      
      done(null, validUser);
    } catch (error) {
      done(error, null);
    }
  });

  // Register an endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, confirmPassword, role } = req.body;
      
      // Validate input data
      if (!username || !email || !password || !role) {
        return res.status(400).json({ 
          error: "Missing required fields",
          details: "Username, email, password, and role are required" 
        });
      }
      
      // Check if passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "Email already in use" });
      }
      
      const existingUserByUsername = await storage.getUserByEmail(username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Username already in use" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create the user with hashed password
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role
      });
      
      // Create a valid user object
      const validUser = {
        id: user.id.toString(),
        email: user.email || '',
        username: user.username || '',
        password: user.password || '',
        role: user.role || 'business',
        created_at: user.created_at || new Date(),
        metadata: user.metadata || {},
        // Include any other fields
        auth_id: user.auth_id,
        last_login: user.last_login,
        stripe_customer_id: user.stripe_customer_id,
        stripe_subscription_id: user.stripe_subscription_id,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        subscription_current_period_end: user.subscription_current_period_end,
        subscription_cancel_at_period_end: user.subscription_cancel_at_period_end,
        // Add DateFields compatibility properties
        createdAt: user.created_at || new Date(),
        updatedAt: new Date()
      };
      
      // Log the user in
      req.login(validUser, (err) => {
        if (err) return next(err);
        return res.status(201).json(validUser);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: User | false, info?: IVerifyOptions) => {
      if (err) return next(err);
      
      if (!user) {
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }
      
      // Create a complete user object for login
      const validUser = {
        id: user.id.toString(),
        email: user.email || '',
        username: user.username || '',
        password: user.password || '',
        role: user.role || 'business',
        created_at: user.created_at || new Date(),
        metadata: user.metadata || {},
        // Optional fields
        auth_id: user.auth_id,
        last_login: new Date(), // Set the last login to now
        stripe_customer_id: user.stripe_customer_id,
        stripe_subscription_id: user.stripe_subscription_id,
        subscription_status: user.subscription_status,
        subscription_plan: user.subscription_plan,
        subscription_current_period_end: user.subscription_current_period_end,
        subscription_cancel_at_period_end: user.subscription_cancel_at_period_end,
        // Add DateFields compatibility properties
        createdAt: user.created_at || new Date(),
        updatedAt: new Date()
      };
      
      req.login(validUser, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Update the last login timestamp
        storage.updateUser(validUser.id, { 
          last_login: new Date() 
        }).catch(err => console.error("Failed to update last login:", err));
        
        return res.status(200).json(validUser);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Error destroying session:", sessionErr);
        }
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    res.status(200).json(req.user);
  });
}