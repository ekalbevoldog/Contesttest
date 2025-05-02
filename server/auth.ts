import passport from "passport";
import { Strategy as LocalStrategy, IVerifyOptions } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
// Import a renamed version of User to avoid naming conflicts
import { User as SchemaUser } from "../shared/schema.js";

declare global {
  namespace Express {
    interface User extends SchemaUser {}
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
        
        // Cast to SchemaUser to ensure all required properties are present
        return done(null, user as SchemaUser);
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
      done(null, user as SchemaUser);
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
      
      // Log the user in
      req.login(user as SchemaUser, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SchemaUser | false, info?: IVerifyOptions) => {
      if (err) return next(err);
      
      if (!user) {
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }
      
      req.login(user as SchemaUser, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Update the last login timestamp
        storage.updateUser(user.id.toString(), { 
          last_login: new Date() 
        }).catch(err => console.error("Failed to update last login:", err));
        
        return res.status(200).json(user);
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