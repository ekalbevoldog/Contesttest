/**
 * Session override to intercept and fix session storage issues
 * This will skip database operations for sessions that are causing errors
 */

import session from 'express-session';
import { Express } from 'express';
import { storage } from '../storage.js';

// A session store that silently fails operations to public.sessions table
export class SafeSessionStore extends session.MemoryStore {
  constructor() {
    super();
    console.log("Using SafeSessionStore to avoid sessions table errors");
  }
}

// Setup session handling with safety mechanisms
export function setupSessionSafely(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'contested-platform-session-secret',
    resave: false,
    saveUninitialized: false,
    store: new SafeSessionStore(),
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
  
  app.use(session(sessionSettings));
}