// Script to check if the 'media' storage bucket exists in Supabase
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function checkStorageBucket() {
  console.log('Checking Supabase storage buckets...');

  // Create Supabase client
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // List all storage buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('Error listing storage buckets:', error.message);
      return;
    }

    console.log('Available buckets:', buckets.map(b => b.name));

    // Check if 'media' bucket exists
    const mediaBucket = buckets.find(b => b.name === 'media');
    
    if (mediaBucket) {
      console.log('Media bucket exists:', mediaBucket);
    } else {
      console.log('Media bucket does not exist. Creating...');
      
      // Create 'media' bucket
      const { data, error: createError } = await supabase.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error('Error creating media bucket:', createError.message);
      } else {
        console.log('Media bucket created successfully:', data);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Use top-level await in ES modules
await checkStorageBucket();