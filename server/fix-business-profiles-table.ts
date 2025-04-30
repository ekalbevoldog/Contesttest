/**
 * Table Migration: Add ID column to business_profiles
 * 
 * This script adds an 'id' column to the business_profiles table if it doesn't already exist.
 * Helps with compatibility between different parts of the application.
 */
import { Request, Response } from 'express';
import { supabase } from './supabase';

/**
 * Adds an 'id' column to the business_profiles table if it doesn't already exist.
 * This helps with compatibility between different parts of the application.
 */
export async function addIdColumnToBusinessProfiles() {
  try {
    // First check if the column exists
    const { data: columnExists, error: columnCheckError } = await supabase
      .from('business_profiles')
      .select('id')
      .limit(1);

    // If the query works without error, the column exists
    if (!columnCheckError) {
      return { 
        success: true, 
        message: "ID column already exists in business_profiles table." 
      };
    }

    // If we get here, the column doesn't exist, so we add it
    // Use raw SQL to add the column
    const { error } = await supabase.rpc('execute_sql', {
      query: `
        ALTER TABLE business_profiles 
        ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
      `
    });

    if (error) {
      console.error("Error adding ID column:", error);
      return { 
        success: false, 
        error: `Failed to add ID column: ${error.message}` 
      };
    }

    return { 
      success: true, 
      message: "Successfully added ID column to business_profiles table." 
    };
  } catch (error) {
    console.error("Error in addIdColumnToBusinessProfiles:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
}

/**
 * Express endpoint to trigger the business profiles table fix
 */
export async function fixBusinessProfilesTableEndpoint(req: Request, res: Response) {
  try {
    console.log("Fixing business_profiles table structure...");
    const result = await addIdColumnToBusinessProfiles();
    
    if (result.success) {
      console.log("Successfully fixed business_profiles table:", result.message);
      return res.status(200).json(result);
    } else {
      console.error("Failed to fix business_profiles table:", result.error);
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error("Error in fixBusinessProfilesTableEndpoint:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
}