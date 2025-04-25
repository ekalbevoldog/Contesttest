import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { User as UserType } from "../shared/schema.js";

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

// Hash password using scrypt with a salt
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare a provided password against a stored hashed password
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Set up the session middleware
  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  // Enable proxy and secure cookies in production
  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Initialize session and passport
  app.use(session(sessionOptions));
  app.use(passport.initialize());
  app.use(passport.session());

  // Set up the LocalStrategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // First try finding by username
        let user = await storage.getUserByUsername(username);
        
        // If not found by username, try email
        if (!user) {
          user = await storage.getUserByEmail(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Update last login timestamp
        await storage.updateUserLastLogin(user.id);
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Define how to serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Define how to deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // User registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(req.body.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Validate passwords match
      if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }

      // Create the user with a hashed password
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json({ 
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // User login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ 
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        });
      });
    })(req, res, next);
  });

  // User logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = req.user as User;
    res.json({ 
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  });
}