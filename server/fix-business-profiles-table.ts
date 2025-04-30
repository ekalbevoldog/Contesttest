/**
 * Table Migration: Add ID column to business_profiles
 * 
 * This script adds an 'id' column to the business_profiles table if it doesn't already exist.
 * Helps with compatibility between different parts of the application.
 */

import { supabaseAdmin } from './supabase.js';

export async function addIdColumnToBusinessProfiles() {
  try {
    console.log('Starting business_profiles table fix: adding id column');
    
    // Check if the column already exists
    const { error: testError } = await supabaseAdmin
      .from('business_profiles')
      .select('id')
      .limit(1);
    
    // If we didn't get an error, the column likely exists
    if (!testError) {
      console.log('id column already exists on business_profiles table');
      return {
        success: true,
        message: 'id column already exists'
      };
    }
    
    console.log('id column not found, attempting to add it');
    
    // Get access to raw SQL for table modification
    const { error: alterError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        -- Add id column
        ALTER TABLE business_profiles 
        ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;
        
        -- Update comment on the table
        COMMENT ON TABLE business_profiles IS 'Business profile information with primary key';
      `
    });
    
    if (alterError) {
      console.error('Error adding id column:', alterError);
      return {
        success: false,
        error: alterError.message
      };
    }
    
    console.log('Successfully added id column to business_profiles table');
    return {
      success: true,
      message: 'Successfully added id column'
    };
  } catch (error) {
    console.error('Unexpected error in addIdColumnToBusinessProfiles:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// API endpoint to add the id column
import { Request, Response } from 'express';

export async function fixBusinessProfilesTableEndpoint(req: Request, res: Response) {
  try {
    const result = await addIdColumnToBusinessProfiles();
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error('Error in fixBusinessProfilesTableEndpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}