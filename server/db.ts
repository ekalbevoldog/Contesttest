
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from './supabase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Export Supabase client for database operations
export const db = supabase;
export const adminDb = supabaseAdmin;

// Export a function to check the database connection
export async function testConnection() {
  try {
    if (!db) {
      console.error("Database connection not initialized yet");
      return false;
    }

    // Simple test query
    const result = await pool.query('SELECT NOW()');
    console.log("Successfully connected to database:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

/**
 * This function ensures essential database tables exist
 */
export async function createEssentialTables() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('athlete', 'business', 'compliance', 'admin')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        auth_id TEXT UNIQUE
      )
    `);
    console.log("Users table exists or was created");

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);
    console.log("Sessions table exists or was created");

    // Attempt to create athlete_profiles if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS athlete_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          session_id TEXT NOT NULL,
          name TEXT NOT NULL,
          school TEXT NOT NULL,
          division TEXT NOT NULL,
          sport TEXT NOT NULL,
          follower_count INTEGER NOT NULL DEFAULT 0,
          content_style TEXT NOT NULL,
          compensation_goals TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("Athlete profiles table exists or was created");
    } catch (athleteError) {
      console.error("Error creating athlete_profiles table:", athleteError);
    }

    // Attempt to create business_profiles if it doesn't exist
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS business_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          session_id TEXT NOT NULL,
          name TEXT NOT NULL,
          product_type TEXT NOT NULL,
          audience_goals TEXT NOT NULL,
          campaign_vibe TEXT NOT NULL,
          values TEXT NOT NULL,
          target_schools_sports TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("Business profiles table exists or was created");
    } catch (businessError) {
      console.error("Error creating business_profiles table:", businessError);
    }

    return true;
  } catch (error) {
    console.error("Error creating database tables:", error);
    return false;
  }
}

// Initialize the database and create essential tables when this module is imported
(async function() {
  try {
    console.log("Testing database connection...");
    if (await testConnection()) {
      console.log("Creating essential database tables...");
      await createEssentialTables();
    }
  } catch (error) {
    console.error("Error during database initialization:", error);
  }
})();
