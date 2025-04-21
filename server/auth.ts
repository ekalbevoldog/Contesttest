import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// Extend Express session type to include passport property
declare module 'express-session' {
  interface Session {
    passport?: {
      user: number;
    };
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Create admin user if it doesn't exist
  (async () => {
    try {
      // Check if admin exists by email instead of username
      const existingAdmin = await storage.getUserByEmail('admin@contested.com');
      if (!existingAdmin) {
        const adminUser = await storage.createUser({
          email: 'admin@contested.com',
          password: await hashPassword('adminpassword123'),
          userType: 'admin',
        });
        console.log('Created admin user: admin@contested.com (admin)');
      }
    } catch (error) {
      console.error('Error checking/creating admin user:', error);
    }
  })();
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'contested-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax'
    },
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      // Configure LocalStrategy to use email field instead of username
      { usernameField: 'email' },
      async (email: string, password: string, done: (error: Error | null, user?: Express.User | false, options?: { message: string }) => void) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          // Get the password hash from a separate secure storage
          const passwordHash = await storage.getPasswordHash(user.id);
          if (!passwordHash || !(await comparePasswords(password, passwordHash))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          return done(null, user);
        } catch (error) {
          console.error("Authentication error:", error);
          return done(error as Error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Register a new user
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      // Check if user exists by email
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(req.body.password);
      
      // Create user in database (without password in the main record)
      const user = await storage.createUser({
        email: req.body.email,
        userType: req.body.userType || 'athlete',
      });
      
      // Store the password hash separately
      await storage.storePasswordHash(user.id, hashedPassword);

      // Log in the user
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Return the user data (never include password)
        return res.status(201).json({ 
          id: user.id,
          email: user.email,
          userType: user.userType 
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  // Login an existing user
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err: Error | null) => {
        if (err) {
          return next(err);
        }
        
        // Dispatch login event
        const loginEvent = new CustomEvent("contestedLogin", { detail: user });
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Logout the current user
  app.post("/api/auth/logout", (req, res, next) => {
    // Dispatch logout event
    const logoutEvent = new CustomEvent("contestedLogout");
    
    // Destroy the session to log out
    req.session.destroy((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  // Alternative logout endpoint that doesn't rely on session
  app.post("/api/auth/logout-direct", (req, res) => {
    // Simply return success - client will handle the state cleanup
    res.status(200).json({ message: "Logged out successfully" });
  });

  // Get the current logged-in user
  app.get("/api/auth/user", (req, res) => {
    if (!req.session || !req.session.passport || !req.session.passport.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    storage.getUser(req.session.passport.user)
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }
        res.json(user);
      })
      .catch(err => {
        console.error("Error fetching user:", err);
        res.status(500).json({ error: "Server error" });
      });
  });

  // Update user profile
  app.put("/api/auth/user", (req, res, next) => {
    if (!req.session || !req.session.passport || !req.session.passport.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const userId = req.session.passport.user;
    
    // Update user profile with the data from the request
    storage.updateUser(userId, req.body)
      .then(updatedUser => {
        if (!updatedUser) {
          return res.status(400).json({ error: "Failed to update user" });
        }
        res.json(updatedUser);
      })
      .catch(err => {
        console.error("Error updating user:", err);
        res.status(500).json({ error: "Server error" });
      });
  });
}