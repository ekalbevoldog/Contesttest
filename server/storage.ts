import { db } from "./db.js";
import { users, athleteProfiles, businessProfiles } from "../shared/schema.js";
import { User, InsertUser, AthleteProfile, BusinessProfile } from "../shared/schema.js";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db.js";

// Storage interface definition
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<void>;
  
  // Profile management
  getAthleteProfile(userId: string): Promise<AthleteProfile | undefined>;
  getBusinessProfile(userId: string): Promise<BusinessProfile | undefined>;
  
  // Session store
  sessionStore: session.Store;
}

// PostgreSQL Session Store
const PostgresSessionStore = connectPg(session);

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true 
    });
  }
  
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return undefined;
    }
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    try {
      const { username, email, password, role } = userData;
      const result = await pool.query(
        'INSERT INTO users (username, email, password, role, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [username, email, password, role, new Date()]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async updateUserLastLogin(id: number): Promise<void> {
    try {
      await pool.query('UPDATE users SET last_login = $1 WHERE id = $2', [new Date(), id]);
    } catch (error) {
      console.error('Error updating user last login:', error);
      throw error;
    }
  }
  
  async getAthleteProfile(userId: string): Promise<AthleteProfile | undefined> {
    try {
      const result = await pool.query('SELECT * FROM athlete_profiles WHERE user_id = $1', [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching athlete profile:', error);
      return undefined;
    }
  }
  
  async getBusinessProfile(userId: string): Promise<BusinessProfile | undefined> {
    try {
      const result = await pool.query('SELECT * FROM business_profiles WHERE user_id = $1', [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching business profile:', error);
      return undefined;
    }
  }
}

// Export a single instance of the storage
export const storage = new DatabaseStorage();