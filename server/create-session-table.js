import { supabaseAdmin } from './db.js';

async function createSessionTable() {
  console.log('Creating session table for connect-pg-simple...');
  
  // First check if the table already exists
  const { data: existingTable, error: tableError } = await supabaseAdmin
    .from('session')
    .select('sid')
    .limit(1);
    
  if (!tableError) {
    console.log('Session table already exists, skipping creation');
    return;
  }
  
  console.log('Session table does not exist, creating it...');
  
  // Using supabaseAdmin to execute raw SQL
  const { error } = await supabaseAdmin.rpc('exec_sql', { 
    sql: `
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
    `
  });
  
  if (error) {
    console.error('Error creating session table:', error);
    throw error;
  }
  
  console.log('Session table created successfully');
}

// Run the function
createSessionTable()
  .then(() => console.log('Session table creation complete'))
  .catch(err => console.error('Error in session table creation script:', err));