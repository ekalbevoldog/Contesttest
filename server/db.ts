import * as schema from "../shared/schema";
import { supabase } from "./supabase";

console.log("Using Supabase for storage and authentication");

// Export a function to check the database connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('sessions').select('count').limit(1);
    
    if (error) {
      console.error("Supabase connection error:", error.message);
      return false;
    }
    
    console.log("Successfully connected to Supabase");
    return true;
  } catch (error) {
    console.error("Supabase connection error:", error);
    return false;
  }
}