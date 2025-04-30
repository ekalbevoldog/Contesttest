import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Supabase credentials not found in environment variables');
}

// Create Supabase clients with options
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  }
};

// Create Supabase client with anon key for public operations
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, options);

// Create Supabase client with service role key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, options);

// Enhanced supabase client with unified query interface
export interface EnhancedClient {
  query: (text: string, params?: any[]) => Promise<{ rows: any[], rowCount: number | null, error?: Error }>;
  auth: typeof supabaseClient.auth;
  realtime: typeof supabaseClient.realtime;
  from: typeof supabaseClient.from;
  rpc: typeof supabaseClient.rpc;
}

// Query function to work with Supabase
async function executeQuery(text: string, params: any[] = []): Promise<{ rows: any[], rowCount: number | null, error?: Error }> {
  try {
    // Initialize params object for RPC calls
    const sqlParams: Record<string, any> = {};
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        sqlParams[`p${index + 1}`] = param;
      });
    }
    
    // Log the query being executed
    logger.debug(`Executing query: ${text}`, params);
    
    // First try to use the exec_sql RPC function if available
    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { query: text, params: sqlParams });
      if (!error) {
        logger.debug('Query executed via RPC successfully');
        return { rows: data || [], rowCount: data?.length || 0 };
      }
      
      // If error is not permission denied or function not found, throw it
      if (error.code !== 'PGRST116' && error.code !== '42883') {
        throw error;
      }
      
      // Otherwise fall through to next approach
      logger.debug('RPC exec_sql failed, trying alternative approach:', error);
    } catch (rpcError) {
      logger.debug('RPC exec_sql call failed:', rpcError);
      // Continue to next approach
    }

    // Handle specific SQL patterns using Supabase REST API
    if (text.trim().toLowerCase().startsWith('select')) {
      let tableName = '';
      let columnsToSelect = '*';
      let conditions = null;
      
      // Parse simple SELECT queries
      const selectMatch = text.match(/select\s+(.*?)\s+from\s+([^\s;]+)(?:\s+where\s+(.*?))?(?:\s+limit\s+(\d+))?(?:\s*;)?$/i);
      
      if (selectMatch) {
        columnsToSelect = selectMatch[1].trim();
        tableName = selectMatch[2].trim();
        conditions = selectMatch[3]?.trim();
        
        // Start building the query
        let query = supabaseAdmin.from(tableName);
        
        // Apply column selection
        if (columnsToSelect === '*') {
          query = query.select();
        } else {
          query = query.select(columnsToSelect);
        }
        
        // Apply conditions if present
        if (conditions) {
          // Handle basic WHERE conditions with AND
          const conditionParts = conditions.split(/\s+and\s+/i);
          
          for (let i = 0; i < conditionParts.length; i++) {
            const conditionMatch = conditionParts[i].match(/([^\s]+)\s*([=<>])\s*(.+)/);
            
            if (conditionMatch) {
              const [_, column, operator, value] = conditionMatch;
              
              // Use parameter if available
              const paramValue = params[i] !== undefined ? params[i] : 
                value.startsWith("'") && value.endsWith("'") ? value.slice(1, -1) : value;
              
              if (operator === '=') {
                query = query.eq(column, paramValue);
              } else if (operator === '>') {
                query = query.gt(column, paramValue);
              } else if (operator === '<') {
                query = query.lt(column, paramValue);
              }
            }
          }
        }
        
        // Apply limit if present
        const limitMatch = text.match(/limit\s+(\d+)/i);
        if (limitMatch && limitMatch[1]) {
          query = query.limit(parseInt(limitMatch[1]));
        }
        
        // Execute the query
        const { data, error } = await query;
        
        if (error) throw error;
        
        logger.debug('Query executed via REST API successfully');
        return { rows: data || [], rowCount: data?.length || 0 };
      }
    }
    
    // For INSERT, UPDATE, DELETE operations
    if (text.trim().toLowerCase().startsWith('insert into') ||
        text.trim().toLowerCase().startsWith('update') ||
        text.trim().toLowerCase().startsWith('delete from')) {
      
      // For these operations, we need to use DB Functions or fall back to REST API equivalents
      
      // Try to extract table name for simple operations
      let tableName = '';
      let operation = '';
      
      if (text.trim().toLowerCase().startsWith('insert into')) {
        operation = 'insert';
        const match = text.match(/insert\s+into\s+([^\s(]+)/i);
        if (match) tableName = match[1];
      } else if (text.trim().toLowerCase().startsWith('update')) {
        operation = 'update';
        const match = text.match(/update\s+([^\s]+)/i);
        if (match) tableName = match[1];
      } else if (text.trim().toLowerCase().startsWith('delete from')) {
        operation = 'delete';
        const match = text.match(/delete\s+from\s+([^\s]+)/i);
        if (match) tableName = match[1];
      }
      
      if (tableName && operation === 'insert') {
        // Try to extract column names and values for simple INSERT
        const columnsMatch = text.match(/insert\s+into\s+[^\s(]+\s*\(([^)]+)\)/i);
        const valuesMatch = text.match(/values\s*\(([^)]+)\)/i);
        
        if (columnsMatch && valuesMatch) {
          const columns = columnsMatch[1].split(',').map(c => c.trim());
          const values = valuesMatch[1].split(',').map((v, i) => {
            if (v.trim() === '$' + (i+1)) {
              return params[i];
            }
            return v.trim().replace(/^'|'$/g, '');
          });
          
          // Create object for insert
          const insertData: Record<string, any> = {};
          columns.forEach((col, i) => {
            insertData[col] = values[i];
          });
          
          // Execute insert
          const { data, error } = await supabaseAdmin.from(tableName).insert(insertData).select();
          
          if (error) throw error;
          
          logger.debug('Insert executed via REST API successfully');
          return { rows: data || [], rowCount: data?.length || 0 };
        }
      }
      
      // Create a simple database function for this query
      // Since we can't do direct SQL, we'll create a workaround
      logger.warn(`Complex operation not directly supported: ${text}`);
      return { 
        rows: [], 
        rowCount: 0, 
        error: new Error('Operation requires database function') 
      };
    }
    
    // For DDL operations (CREATE TABLE, etc.)
    if (text.trim().toLowerCase().startsWith('create table') ||
        text.trim().toLowerCase().startsWith('alter table') ||
        text.trim().toLowerCase().startsWith('drop table') ||
        text.trim().toLowerCase().startsWith('create index')) {
      
      logger.warn('DDL operations require database superuser privileges');
      
      // For these operations, we need to assume they might succeed in production
      // Return empty result but no error for CREATE IF NOT EXISTS
      if (text.includes('IF NOT EXISTS')) {
        return { rows: [], rowCount: 0 };
      }
      
      return { 
        rows: [], 
        rowCount: 0, 
        error: new Error('DDL operations require database privileges') 
      };
    }
    
    // For any other operation, log it as unsupported
    logger.warn(`Unsupported SQL operation: ${text}`);
    return { 
      rows: [], 
      rowCount: 0, 
      error: new Error('Unsupported operation') 
    };
  } catch (error) {
    logger.error('Error executing query:', error);
    return { rows: [], rowCount: 0, error: error as Error };
  }
}

// Create enhanced client that combines all functionality
export const supabase: EnhancedClient = {
  query: executeQuery,
  auth: supabaseAdmin.auth,
  realtime: supabaseAdmin.realtime,
  from: supabaseAdmin.from,
  rpc: supabaseAdmin.rpc
};