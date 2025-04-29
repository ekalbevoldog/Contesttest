
import { supabaseAdmin } from './supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to check if a table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
    
    return !error;
  } catch (error) {
    console.error(`Exception checking if table ${tableName} exists:`, error);
    return false;
  }
}

// Function to execute SQL with better error reporting
async function executeSql(sql: string): Promise<boolean> {
  try {
    console.log('Executing SQL statement (preview):', sql.substring(0, 100) + '...');
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
      sql: sql 
    });
    
    if (error) {
      console.error('Error executing SQL statement:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception executing SQL statement:', error);
    return false;
  }
}

// Function to run the complete migration
export async function runCompleteMigration() {
  try {
    console.log('Starting complete database schema migration...');
    
    // Read the SQL file
    const migrationFilePath = path.join(__dirname, 'complete-schema-migration.sql');
    if (!fs.existsSync(migrationFilePath)) {
      console.error(`Migration SQL file not found at path: ${migrationFilePath}`);
      return false;
    }
    
    const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Split the SQL statements for better error reporting
    // This handles SQL that contains semicolons within functions/triggers
    const statements: string[] = [];
    let currentStatement = '';
    let inFunction = false;
    
    sqlContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      
      // Check if we're entering a function or trigger definition
      if (trimmedLine.includes('FUNCTION') || trimmedLine.includes('TRIGGER') && trimmedLine.includes('$$')) {
        inFunction = true;
      }
      
      // Check if we're exiting a function definition
      if (inFunction && trimmedLine.includes('$$;')) {
        inFunction = false;
        currentStatement += line + '\n';
        statements.push(currentStatement.trim());
        currentStatement = '';
        return;
      }
      
      // If we're in a function/trigger or the line doesn't end with semicolon, accumulate
      if (inFunction || !trimmedLine.endsWith(';')) {
        currentStatement += line + '\n';
        return;
      }
      
      // Regular statement ending with semicolon
      if (trimmedLine.endsWith(';')) {
        currentStatement += line + '\n';
        statements.push(currentStatement.trim());
        currentStatement = '';
        return;
      }
      
      // Just add the line to the current statement
      currentStatement += line + '\n';
    });
    
    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }
    
    console.log(`Successfully loaded migration file with ${statements.length} statements`);
    
    // Execute each statement sequentially
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.trim().length === 0) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}`);
      const success = await executeSql(statement);
      
      if (!success) {
        console.error(`Failed to execute statement ${i + 1}/${statements.length}`);
        // Continue with next statement even if one fails
      } else {
        console.log(`Successfully executed statement ${i + 1}/${statements.length}`);
      }
    }
    
    // Verify key tables were created
    const tables = [
      'users', 'sessions', 'athlete_profiles', 'business_profiles', 
      'campaigns', 'match_scores', 'partnership_offers', 'feedbacks'
    ];
    
    console.log('Verifying tables were created...');
    const tablesStatus = await Promise.all(
      tables.map(async tableName => {
        const exists = await tableExists(tableName);
        return { tableName, exists };
      })
    );
    
    tablesStatus.forEach(status => {
      console.log(`Table ${status.tableName}: ${status.exists ? 'Created ✅' : 'Failed ❌'}`);
    });
    
    const allTablesCreated = tablesStatus.every(status => status.exists);
    
    if (allTablesCreated) {
      console.log('✅ All tables created successfully!');
    } else {
      console.log('⚠️ Some tables were not created successfully.');
    }
    
    // Update users table to ensure auth_id is properly set
    console.log('Checking existing Auth users to ensure they are in the public users table...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching Auth users:', authError);
    } else if (authUsers && authUsers.users.length > 0) {
      console.log(`Found ${authUsers.users.length} Auth users to sync`);
      
      // Sync each Auth user to the public users table
      for (const authUser of authUsers.users) {
        const { data: existingUser, error: userCheckError } = await supabaseAdmin
          .from('users')
          .select('id, auth_id')
          .eq('auth_id', authUser.id)
          .single();
        
        if (userCheckError && userCheckError.code !== 'PGRST116') {
          console.error(`Error checking user with auth_id ${authUser.id}:`, userCheckError);
          continue;
        }
        
        if (!existingUser) {
          console.log(`Creating user record for auth_id ${authUser.id} (${authUser.email})`);
          
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              auth_id: authUser.id,
              email: authUser.email,
              username: authUser.user_metadata.preferred_username || authUser.email.split('@')[0],
              role: authUser.user_metadata.role || 'athlete',
              created_at: authUser.created_at
            });
          
          if (insertError) {
            console.error(`Error creating user for auth_id ${authUser.id}:`, insertError);
          } else {
            console.log(`Created user for auth_id ${authUser.id}`);
          }
        } else {
          console.log(`User already exists for auth_id ${authUser.id}`);
        }
      }
    }
    
    console.log('✅ Complete schema migration finished');
    return true;
  } catch (error) {
    console.error('Exception during complete schema migration:', error);
    return false;
  }
}

// Run the migration if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCompleteMigration()
    .then(success => {
      if (success) {
        console.log('Migration completed successfully');
        process.exit(0);
      } else {
        console.error('Migration failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error during migration:', error);
      process.exit(1);
    });
}
