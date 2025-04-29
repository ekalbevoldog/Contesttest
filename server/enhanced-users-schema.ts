/**
 * Enhanced Users Schema Verification and Repair
 * 
 * This script provides comprehensive verification and repair of the users table
 * to ensure compatibility with Supabase Auth.
 */

import { supabase, supabaseAdmin } from "./supabase.js";

/**
 * Verify and fix the users table schema
 */
export async function verifyAndFixUsersSchema(): Promise<boolean> {
  console.log("[Schema] Starting enhanced users schema verification...");

  try {
    // Step 1: Check if users table exists
    console.log("[Schema] Checking if users table exists...");
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "users");

    if (tablesError) {
      console.error("[Schema] Error checking for users table:", tablesError);
      return false;
    }

    if (!tables || tables.length === 0) {
      console.error("[Schema] Users table does not exist, creating it...");
      
      // Create the users table with proper auth_id reference
      const { error: createTableError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS public.users (
          id SERIAL PRIMARY KEY,
          auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL UNIQUE,
          username TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('athlete', 'business', 'compliance_officer', 'admin')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          last_login TIMESTAMP WITH TIME ZONE,
          metadata JSONB DEFAULT '{}'::jsonb
        );
      `);

      if (createTableError) {
        console.error("[Schema] Failed to create users table:", createTableError);
        return false;
      }
      
      console.log("[Schema] ✅ Users table created successfully");
    } else {
      console.log("[Schema] ✅ Users table exists");
    }

    // Step 2: Check table structure
    console.log("[Schema] Examining users table structure...");
    
    // 2.1 Check if auth_id column exists
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_schema", "public")
      .eq("table_name", "users");

    if (columnsError) {
      console.error("[Schema] Error checking table columns:", columnsError);
      return false;
    }

    // Convert to a map for easier lookup
    const columnMap = columns.reduce((acc, col) => {
      acc[col.column_name] = col;
      return acc;
    }, {} as Record<string, any>);

    // Check for required columns
    const requiredColumns = [
      { name: 'id', type: 'integer' },
      { name: 'auth_id', type: 'uuid' },
      { name: 'email', type: 'text' },
      { name: 'username', type: 'text' },
      { name: 'role', type: 'text' },
      { name: 'created_at', type: 'timestamp with time zone' },
      { name: 'last_login', type: 'timestamp with time zone' }
    ];

    // Check and fix missing columns
    for (const col of requiredColumns) {
      if (!columnMap[col.name]) {
        console.log(`[Schema] Column ${col.name} is missing, adding it...`);
        
        let alterSql = `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ${col.name}`;
        
        switch (col.name) {
          case 'id':
            alterSql += ` SERIAL PRIMARY KEY`;
            break;
          case 'auth_id':
            alterSql += ` UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE`;
            break;
          case 'email':
            alterSql += ` TEXT NOT NULL UNIQUE`;
            break;
          case 'username':
            alterSql += ` TEXT NOT NULL`;
            break;
          case 'role':
            alterSql += ` TEXT NOT NULL CHECK (role IN ('athlete', 'business', 'compliance_officer', 'admin'))`;
            break;
          case 'created_at':
            alterSql += ` TIMESTAMP WITH TIME ZONE DEFAULT now()`;
            break;
          case 'last_login':
            alterSql += ` TIMESTAMP WITH TIME ZONE`;
            break;
          default:
            alterSql += ` TEXT`;
            break;
        }
        
        alterSql += `;`;
        
        const { error: alterError } = await supabase.query(alterSql);
        
        if (alterError) {
          console.error(`[Schema] Failed to add column ${col.name}:`, alterError);
        } else {
          console.log(`[Schema] ✅ Added column ${col.name} successfully`);
        }
      } else {
        // Column exists, check type match
        if (!columnMap[col.name].data_type.toLowerCase().includes(col.type.toLowerCase())) {
          console.warn(`[Schema] Column ${col.name} has type ${columnMap[col.name].data_type}, expected ${col.type}`);
        }
      }
    }

    // Step 3: Check/create necessary indexes
    console.log("[Schema] Checking indexes on users table...");
    
    // Create index on auth_id if it doesn't exist
    const { error: indexError } = await supabase.query(`
      CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
    `);
    
    if (indexError) {
      console.error("[Schema] Failed to create auth_id index:", indexError);
    } else {
      console.log("[Schema] ✅ auth_id index created or already exists");
    }
    
    // Create index on email if it doesn't exist
    const { error: emailIndexError } = await supabase.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
    `);
    
    if (emailIndexError) {
      console.error("[Schema] Failed to create email index:", emailIndexError);
    } else {
      console.log("[Schema] ✅ email index created or already exists");
    }

    // Step 4: Check for auth_id foreign key constraint
    console.log("[Schema] Checking auth_id foreign key constraint...");
    
    const { data: fkConstraints, error: fkError } = await supabase
      .from("information_schema.table_constraints")
      .select("constraint_name, constraint_type")
      .eq("table_schema", "public")
      .eq("table_name", "users")
      .eq("constraint_type", "FOREIGN KEY");
      
    if (fkError) {
      console.error("[Schema] Error checking foreign key constraints:", fkError);
    } else if (!fkConstraints || fkConstraints.length === 0) {
      console.log("[Schema] No foreign key constraint found on auth_id, adding it...");
      
      // Add foreign key constraint
      const { error: addFkError } = await supabase.query(`
        ALTER TABLE public.users 
        ADD CONSTRAINT fk_users_auth_id FOREIGN KEY (auth_id) 
        REFERENCES auth.users(id) ON DELETE CASCADE;
      `);
      
      if (addFkError) {
        console.error("[Schema] Failed to add foreign key constraint:", addFkError);
      } else {
        console.log("[Schema] ✅ Foreign key constraint added successfully");
      }
    } else {
      console.log("[Schema] ✅ Foreign key constraint exists");
    }

    // Step 5: Check for trigger function
    console.log("[Schema] Checking for auth user trigger function...");
    
    // Create/update the trigger function
    const { error: triggerFnError } = await supabase.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Check if a user with this email already exists
        DECLARE existing_user_id INTEGER;
        BEGIN
          SELECT id INTO existing_user_id FROM public.users 
          WHERE email = NEW.email;
          
          IF existing_user_id IS NOT NULL THEN
            -- Update existing user with auth_id
            UPDATE public.users
            SET auth_id = NEW.id
            WHERE id = existing_user_id AND (auth_id IS NULL OR auth_id != NEW.id);
          ELSE
            -- Insert new user
            INSERT INTO public.users (
              auth_id, 
              email, 
              username, 
              role, 
              created_at
            )
            VALUES (
              NEW.id, 
              NEW.email, 
              COALESCE(NEW.raw_user_meta_data->>'preferred_username', SPLIT_PART(NEW.email, '@', 1)), 
              COALESCE(NEW.raw_user_meta_data->>'role', 'athlete'),
              NOW()
            )
            ON CONFLICT (auth_id) DO NOTHING
            ON CONFLICT (email) DO UPDATE
            SET auth_id = NEW.id;
          END IF;
        END;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    if (triggerFnError) {
      console.error("[Schema] Failed to create trigger function:", triggerFnError);
    } else {
      console.log("[Schema] ✅ Trigger function created/updated successfully");
    }
    
    // Step 6: Check for trigger
    console.log("[Schema] Checking for auth user trigger...");
    
    // Drop and recreate the trigger
    const { error: dropTriggerError } = await supabase.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `);
    
    if (dropTriggerError) {
      console.error("[Schema] Failed to drop trigger:", dropTriggerError);
    }
    
    const { error: createTriggerError } = await supabase.query(`
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
    `);
    
    if (createTriggerError) {
      console.error("[Schema] Failed to create trigger:", createTriggerError);
    } else {
      console.log("[Schema] ✅ Trigger created successfully");
    }

    // Step 7: Check for unmapped users
    console.log("[Schema] Checking for users with null auth_id...");
    
    const { data: unmappedUsers, error: unmappedError } = await supabase
      .from("users")
      .select("id, email")
      .is("auth_id", null);
      
    if (unmappedError) {
      console.error("[Schema] Error checking for unmapped users:", unmappedError);
    } else if (unmappedUsers && unmappedUsers.length > 0) {
      console.log(`[Schema] Found ${unmappedUsers.length} users with null auth_id`);
      
      // Get all auth users
      const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authUsersError) {
        console.error("[Schema] Error fetching auth users:", authUsersError);
      } else if (authUsers && authUsers.users.length > 0) {
        console.log(`[Schema] Found ${authUsers.users.length} auth users to check against`);
        
        // Create a map of email -> auth_id for faster lookup
        const emailToAuthId = new Map();
        authUsers.users.forEach(user => {
          if (user.email) {
            emailToAuthId.set(user.email.toLowerCase(), user.id);
          }
        });
        
        // Update each unmapped user
        let mappedCount = 0;
        for (const user of unmappedUsers) {
          if (user.email && emailToAuthId.has(user.email.toLowerCase())) {
            const auth_id = emailToAuthId.get(user.email.toLowerCase());
            console.log(`[Schema] Mapping user ${user.id} (${user.email}) to auth_id ${auth_id}`);
            
            const { error: updateError } = await supabase
              .from("users")
              .update({ auth_id })
              .eq("id", user.id);
              
            if (updateError) {
              console.error(`[Schema] Failed to update user ${user.id}:`, updateError);
            } else {
              mappedCount++;
            }
          }
        }
        
        console.log(`[Schema] ✅ Mapped ${mappedCount} users to their auth_id`);
      }
    } else {
      console.log("[Schema] ✅ All users have auth_id properly mapped");
    }

    // Step 8: Check for auth users without profiles
    console.log("[Schema] Checking for auth users without profiles...");
    
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authUsersError) {
      console.error("[Schema] Error fetching auth users:", authUsersError);
    } else if (authUsers && authUsers.users.length > 0) {
      let missingCount = 0;
      let createdCount = 0;
      
      for (const authUser of authUsers.users) {
        if (!authUser.email) continue;
        
        // Check if user exists in our table
        const { data: userRecord, error: userError } = await supabase
          .from("users")
          .select("id, auth_id, email")
          .eq("auth_id", authUser.id)
          .single();
          
        if (userError || !userRecord) {
          missingCount++;
          console.log(`[Schema] Auth user ${authUser.id} (${authUser.email}) has no profile`);
          
          // Check if a user exists with this email but no auth_id
          const { data: emailUser, error: emailError } = await supabase
            .from("users")
            .select("id, auth_id, email")
            .eq("email", authUser.email)
            .single();
            
          if (emailError && emailError.code === 'PGRST116') {
            // No user found with this email, create a new one
            console.log(`[Schema] Creating new user record for ${authUser.email}`);
            
            const userToInsert = {
              auth_id: authUser.id,
              email: authUser.email,
              username: authUser.user_metadata?.preferred_username || authUser.email.split('@')[0],
              role: authUser.user_metadata?.role || 'athlete',
              created_at: new Date(authUser.created_at || Date.now())
            };
            
            const { data: newUser, error: insertError } = await supabase
              .from("users")
              .insert(userToInsert)
              .select()
              .single();
              
            if (insertError) {
              if (insertError.code === '23505') {
                console.log(`[Schema] User with email ${authUser.email} or username already exists`);
              } else {
                console.error(`[Schema] Failed to create user for ${authUser.email}:`, insertError);
              }
            } else {
              createdCount++;
              console.log(`[Schema] ✅ Created user ${newUser.id} for auth user ${authUser.id}`);
            }
          } else if (!emailError && emailUser) {
            // User found with this email but no auth_id, update it
            console.log(`[Schema] Updating user ${emailUser.id} with auth_id ${authUser.id}`);
            
            const { error: updateError } = await supabase
              .from("users")
              .update({ auth_id: authUser.id })
              .eq("id", emailUser.id);
              
            if (updateError) {
              console.error(`[Schema] Failed to update user ${emailUser.id}:`, updateError);
            } else {
              createdCount++;
              console.log(`[Schema] ✅ Updated user ${emailUser.id} with auth_id ${authUser.id}`);
            }
          }
        }
      }
      
      console.log(`[Schema] Found ${missingCount} auth users without profiles`);
      console.log(`[Schema] Created/updated ${createdCount} user profiles`);
    }

    console.log("[Schema] ✅ Users schema verification and repair completed successfully");
    return true;
  } catch (error) {
    console.error("[Schema] Error during schema verification:", error);
    return false;
  }
}

// If this file is run directly, execute the verification
if (process.argv[1].endsWith("enhanced-users-schema.ts")) {
  verifyAndFixUsersSchema()
    .then(success => {
      if (success) {
        console.log("[Schema] Verification and repair completed successfully");
        process.exit(0);
      } else {
        console.error("[Schema] Verification and repair failed");
        process.exit(1);
      }
    })
    .catch(error => {
      console.error("[Schema] Unhandled error:", error);
      process.exit(1);
    });
}