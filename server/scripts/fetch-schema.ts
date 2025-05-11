
import { supabaseAdmin } from '../lib/supabase';
import fs from 'fs';
import path from 'path';

async function fetchDatabaseSchema() {
  console.log('Fetching Supabase database schema...');
  
  try {
    // First, let's check the connection
    const { data: connectionTest, error: connectionError } = await supabaseAdmin.from('_schema').select('*').limit(1);
    
    if (connectionError) {
      console.error('❌ Connection to Supabase failed:', connectionError);
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully');
    
    // Query to get tables
    const { data: tables, error: tablesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          table_schema, 
          table_name, 
          table_type 
        FROM 
          information_schema.tables 
        WHERE 
          table_schema IN ('public', 'auth') 
          AND table_name NOT LIKE 'pg_%' 
          AND table_name NOT LIKE '_prisma_%'
        ORDER BY 
          table_schema, 
          table_name
      `
    });
    
    if (tablesError) {
      console.error('❌ Failed to fetch tables:', tablesError);
      return false;
    }
    
    console.log(`Found ${tables.length} tables`);
    
    // Initialize schema object
    const schema: Record<string, any> = {
      tables: {},
      enums: {}
    };
    
    // Fetch enum types
    const { data: enumTypes, error: enumError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          n.nspname as schema,
          t.typname as name,
          array_agg(e.enumlabel) as values
        FROM 
          pg_type t 
          JOIN pg_enum e ON t.oid = e.enumtypid  
          JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
        WHERE 
          n.nspname = 'public'
        GROUP BY 
          schema, name
      `
    });
    
    if (enumError) {
      console.error('❌ Failed to fetch enum types:', enumError);
    } else {
      console.log(`Found ${enumTypes.length} enum types`);
      
      // Add enums to schema
      for (const enumType of enumTypes) {
        schema.enums[enumType.name] = enumType.values;
      }
    }
    
    // Fetch details for each table
    for (const table of tables) {
      const tableName = table.table_name;
      const tableSchema = table.table_schema;
      const fullTableName = `${tableSchema}.${tableName}`;
      
      console.log(`Fetching schema for ${fullTableName}...`);
      
      // Get columns
      const { data: columns, error: columnsError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default,
            character_maximum_length
          FROM 
            information_schema.columns 
          WHERE 
            table_schema = '${tableSchema}' 
            AND table_name = '${tableName}'
          ORDER BY 
            ordinal_position
        `
      });
      
      if (columnsError) {
        console.error(`❌ Failed to fetch columns for ${fullTableName}:`, columnsError);
        continue;
      }
      
      // Get constraints
      const { data: constraints, error: constraintsError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          SELECT
            c.conname as constraint_name,
            c.contype as constraint_type,
            array_agg(a.attname) as columns,
            CASE 
              WHEN c.contype = 'f' THEN (
                SELECT relname FROM pg_class WHERE oid = c.confrelid
              )
              ELSE NULL
            END as referenced_table
          FROM
            pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            JOIN pg_class cl ON cl.oid = c.conrelid
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
          WHERE
            n.nspname = '${tableSchema}'
            AND cl.relname = '${tableName}'
          GROUP BY
            c.conname, c.contype, c.confrelid
        `
      });
      
      if (constraintsError) {
        console.error(`❌ Failed to fetch constraints for ${fullTableName}:`, constraintsError);
      }
      
      // Add table to schema
      schema.tables[fullTableName] = {
        columns: columns || [],
        constraints: constraints || []
      };
    }
    
    // Save schema to file
    const schemaFilePath = path.join(__dirname, '..', '..', 'supabase-schema.json');
    fs.writeFileSync(schemaFilePath, JSON.stringify(schema, null, 2));
    
    console.log(`✅ Schema written to ${schemaFilePath}`);
    return true;
  } catch (error) {
    console.error('❌ Unhandled error during schema fetch:', error);
    return false;
  }
}

// Execute the function
fetchDatabaseSchema()
  .then(success => {
    if (success) {
      console.log('✅ Schema fetch completed successfully');
      process.exit(0);
    } else {
      console.error('❌ Schema fetch failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
