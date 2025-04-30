import { createClient } from '@supabase/supabase-js';
import { logger } from './logger.js';
import { Pool } from 'pg';

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check for required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('CRITICAL: Supabase credentials not found in environment variables');
}

// Robust connection options with error handling and reconnection
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    // Add fetch options to improve reliability
    fetch: (url: any, options: any) => {
      // Set longer timeout for Supabase API requests
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 30000); // 30 second timeout
      
      return fetch(url, {
        ...options,
        signal: timeoutController.signal,
        keepalive: true,
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }
};

// Create Supabase clients
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, options);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, options);

// Create a connection pool for direct database access if DATABASE_URL is available
let pgPool: Pool | null = null;

if (process.env.DATABASE_URL) {
  try {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection couldn't be established
    });
    
    // Test the connection
    pgPool.query('SELECT NOW()').then(() => {
      logger.info('PostgreSQL direct connection pool initialized successfully');
    }).catch(err => {
      logger.error('Failed to verify PostgreSQL pool connection:', err);
      pgPool = null;
    });
    
    // Handle pool errors to prevent app crashes
    pgPool.on('error', (err) => {
      logger.error('Unexpected PostgreSQL pool error:', err);
      // Don't crash the server on connection errors
    });
  } catch (error) {
    logger.error('Failed to initialize PostgreSQL pool:', error);
    pgPool = null;
  }
} else {
  logger.warn('DATABASE_URL not set - direct SQL queries will use Supabase API');
}

// Enhanced client interface
export interface EnhancedClient {
  query: (text: string, params?: any[]) => Promise<{ rows: any[], rowCount: number | null, error?: Error }>;
  auth: typeof supabaseClient.auth;
  realtime: typeof supabaseClient.realtime;
  from: typeof supabaseClient.from;
  rpc: typeof supabaseClient.rpc;
}

/**
 * Execute a database query using the most direct and efficient method available
 */
async function executeQuery(text: string, params: any[] = []): Promise<{ rows: any[], rowCount: number | null, error?: Error }> {
  try {
    // Try direct PostgreSQL connection first if available
    if (pgPool) {
      try {
        const result = await pgPool.query(text, params);
        return { 
          rows: result.rows, 
          rowCount: result.rowCount 
        };
      } catch (pgError: any) {
        // If this is a connection error, null out the pool so we'll try alternatives
        if (pgError.code === 'ECONNREFUSED' || pgError.code === '57P01' || pgError.code === '57P02' || pgError.code === '57P03') {
          logger.error('PostgreSQL connection failed, falling back to Supabase API:', pgError);
          pgPool = null;
        } else {
          // For query errors (not connection errors), just throw normally
          throw pgError;
        }
      }
    }
    
    // Fall back to RPC method if direct connection failed or isn't available
    const sqlParams: Record<string, any> = {};
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        sqlParams[`p${index + 1}`] = param;
      });
    }
    
    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
        query: text, 
        params: sqlParams 
      });
      
      if (!error) {
        logger.debug('Query executed via RPC successfully');
        return { 
          rows: data || [], 
          rowCount: data?.length || 0 
        };
      }
      
      // If the error suggests RPC is not available, continue to next method
      if (error.code === 'PGRST116' || error.code === '42883') {
        logger.debug('RPC exec_sql not available, using REST API');
      } else {
        // For other errors, throw them
        throw error;
      }
    } catch (rpcError) {
      logger.debug('RPC method failed, trying REST API:', rpcError);
    }
    
    // Use REST API as a final fallback approach for supported operations
    if (text.trim().toLowerCase().startsWith('select')) {
      const result = await handleSelectWithREST(text, params);
      if (!result.error) {
        return result;
      }
      throw result.error;
    } else if (text.trim().toLowerCase().startsWith('insert into')) {
      const result = await handleInsertWithREST(text, params);
      if (!result.error) {
        return result;
      }
      throw result.error;
    } else if (text.trim().toLowerCase().startsWith('update')) {
      const result = await handleUpdateWithREST(text, params);
      if (!result.error) {
        return result;
      }
      throw result.error;
    } else if (text.trim().toLowerCase().startsWith('delete from')) {
      const result = await handleDeleteWithREST(text, params);
      if (!result.error) {
        return result;
      }
      throw result.error;
    }
    
    // If we get here, no methods worked
    throw new Error(`SQL operation not supported: ${text.split(' ').slice(0, 3).join(' ')}...`);
  } catch (error) {
    logger.error('Database query error:', error);
    return { rows: [], rowCount: 0, error: error as Error };
  }
}

/**
 * Parse and execute a SELECT query using Supabase REST API
 */
async function handleSelectWithREST(text: string, params: any[] = []): Promise<{ rows: any[], rowCount: number | null, error?: Error }> {
  try {
    // Parse the SELECT query
    const selectMatch = text.match(/select\s+(.*?)\s+from\s+([^\s;]+)(?:\s+where\s+(.*?))?(?:\s+order\s+by\s+(.*?))?(?:\s+limit\s+(\d+))?(?:\s*;)?$/i);
    
    if (!selectMatch) {
      return { 
        rows: [], 
        rowCount: 0, 
        error: new Error('Could not parse SELECT query for REST API') 
      };
    }
    
    const columnsToSelect = selectMatch[1].trim();
    const tableName = selectMatch[2].trim();
    const whereClause = selectMatch[3]?.trim();
    const orderByClause = selectMatch[4]?.trim();
    const limitValue = selectMatch[5] ? parseInt(selectMatch[5]) : undefined;
    
    let query = supabaseAdmin.from(tableName);
    
    // Apply columns
    query = query.select(columnsToSelect === '*' ? '*' : columnsToSelect);
    
    // Apply WHERE conditions
    if (whereClause) {
      const conditions = whereClause.split(/\s+and\s+/i);
      for (let i = 0; i < conditions.length; i++) {
        // Match column, operator, and value
        const condMatch = conditions[i].match(/([^\s]+)\s*([=<>!]+)\s*(.+)/);
        if (condMatch) {
          const [_, column, operator, rawValue] = condMatch;
          
          // Check if value is a parameter or literal
          let value;
          if (rawValue.trim().startsWith('$')) {
            const paramIndex = parseInt(rawValue.trim().substring(1)) - 1;
            value = params[paramIndex];
          } else {
            value = rawValue.trim().replace(/^['"]|['"]$/g, '');
          }
          
          // Apply filter based on operator
          switch (operator) {
            case '=':
              query = query.eq(column, value);
              break;
            case '>':
              query = query.gt(column, value);
              break;
            case '>=':
              query = query.gte(column, value);
              break;
            case '<':
              query = query.lt(column, value);
              break;
            case '<=':
              query = query.lte(column, value);
              break;
            case '!=':
            case '<>':
              query = query.neq(column, value);
              break;
            default:
              logger.warn(`Unsupported operator in WHERE clause: ${operator}`);
          }
        }
      }
    }
    
    // Apply ORDER BY if present
    if (orderByClause) {
      const orderParts = orderByClause.split(',').map(part => part.trim());
      for (const part of orderParts) {
        const [column, direction] = part.split(/\s+/);
        const ascending = !direction || direction.toLowerCase() !== 'desc';
        query = query.order(column, { ascending });
      }
    }
    
    // Apply LIMIT if present
    if (limitValue) {
      query = query.limit(limitValue);
    }
    
    // Execute the query
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return { 
      rows: data || [], 
      rowCount: count || data?.length || 0 
    };
  } catch (error) {
    logger.error('Error executing SELECT via REST API:', error);
    return { 
      rows: [], 
      rowCount: 0, 
      error: error as Error 
    };
  }
}

/**
 * Parse and execute an INSERT query using Supabase REST API
 */
async function handleInsertWithREST(text: string, params: any[] = []): Promise<{ rows: any[], rowCount: number | null, error?: Error }> {
  try {
    // Extract table name
    const tableMatch = text.match(/insert\s+into\s+([^\s(]+)/i);
    if (!tableMatch) {
      return { 
        rows: [], 
        rowCount: 0, 
        error: new Error('Could not parse table name from INSERT query') 
      };
    }
    
    const tableName = tableMatch[1];
    
    // Extract columns and values
    const columnsMatch = text.match(/insert\s+into\s+[^\s(]+\s*\(([^)]+)\)/i);
    const valuesMatch = text.match(/values\s*\(([^)]+)\)/i);
    
    if (!columnsMatch || !valuesMatch) {
      return { 
        rows: [], 
        rowCount: 0, 
        error: new Error('Could not parse columns or values from INSERT query') 
      };
    }
    
    const columns = columnsMatch[1].split(',').map(c => c.trim());
    const valueExpressions = valuesMatch[1].split(',').map(v => v.trim());
    
    // Build the data object for insertion
    const insertData: Record<string, any> = {};
    
    columns.forEach((column, index) => {
      const valueExpr = valueExpressions[index];
      
      // Handle parameter references ($1, $2, etc.)
      if (valueExpr.startsWith('$')) {
        const paramIndex = parseInt(valueExpr.substring(1)) - 1;
        insertData[column] = params[paramIndex];
      } 
      // Handle string literals
      else if (valueExpr.startsWith("'") && valueExpr.endsWith("'")) {
        insertData[column] = valueExpr.substring(1, valueExpr.length - 1);
      }
      // Handle other literals (numbers, booleans, etc.)
      else {
        insertData[column] = valueExpr;
      }
    });
    
    // Execute the insert
    const { data, error } = await supabaseAdmin.from(tableName).insert(insertData).select();
    
    if (error) throw error;
    
    return { 
      rows: data || [], 
      rowCount: data?.length || 1
    };
  } catch (error) {
    logger.error('Error executing INSERT via REST API:', error);
    return { 
      rows: [], 
      rowCount: 0, 
      error: error as Error 
    };
  }
}

/**
 * Parse and execute an UPDATE query using Supabase REST API
 */
async function handleUpdateWithREST(text: string, params: any[] = []): Promise<{ rows: any[], rowCount: number | null, error?: Error }> {
  try {
    // Parse the basic UPDATE structure: UPDATE table SET col1 = val1, col2 = val2 WHERE condition
    const updateMatch = text.match(/update\s+([^\s]+)\s+set\s+(.*?)(?:\s+where\s+(.*?))?(?:\s*;)?$/i);
    
    if (!updateMatch) {
      return { 
        rows: [], 
        rowCount: 0, 
        error: new Error('Could not parse UPDATE query for REST API') 
      };
    }
    
    const tableName = updateMatch[1];
    const setClause = updateMatch[2];
    const whereClause = updateMatch[3]?.trim();
    
    // Parse SET clause
    const assignments = setClause.split(',').map(a => a.trim());
    const updateData: Record<string, any> = {};
    
    for (const assignment of assignments) {
      const [column, expression] = assignment.split('=').map(p => p.trim());
      
      // Handle parameter references
      if (expression.startsWith('$')) {
        const paramIndex = parseInt(expression.substring(1)) - 1;
        updateData[column] = params[paramIndex];
      }
      // Handle string literals
      else if (expression.startsWith("'") && expression.endsWith("'")) {
        updateData[column] = expression.substring(1, expression.length - 1);
      }
      // Handle other literals
      else {
        updateData[column] = expression;
      }
    }
    
    // Start building query
    let query = supabaseAdmin.from(tableName).update(updateData);
    
    // Parse WHERE conditions if present
    if (whereClause) {
      const conditions = whereClause.split(/\s+and\s+/i);
      
      for (const condition of conditions) {
        const condMatch = condition.match(/([^\s]+)\s*([=<>!]+)\s*(.+)/);
        
        if (condMatch) {
          const [_, column, operator, rawValue] = condMatch;
          
          // Check if value is a parameter or literal
          let value;
          if (rawValue.trim().startsWith('$')) {
            const paramIndex = parseInt(rawValue.trim().substring(1)) - 1;
            value = params[paramIndex];
          } else {
            value = rawValue.trim().replace(/^['"]|['"]$/g, '');
          }
          
          // Currently we only handle equality conditions for updates
          if (operator === '=') {
            query = query.eq(column, value);
          } else {
            return { 
              rows: [], 
              rowCount: 0, 
              error: new Error(`Unsupported operator in UPDATE WHERE clause: ${operator}`) 
            };
          }
        }
      }
    }
    
    // Execute the update
    const { data, error } = await query.select();
    
    if (error) throw error;
    
    return { 
      rows: data || [], 
      rowCount: data?.length || 0 
    };
  } catch (error) {
    logger.error('Error executing UPDATE via REST API:', error);
    return { 
      rows: [], 
      rowCount: 0, 
      error: error as Error 
    };
  }
}

/**
 * Parse and execute a DELETE query using Supabase REST API
 */
async function handleDeleteWithREST(text: string, params: any[] = []): Promise<{ rows: any[], rowCount: number | null, error?: Error }> {
  try {
    // Parse DELETE FROM table WHERE condition
    const deleteMatch = text.match(/delete\s+from\s+([^\s]+)(?:\s+where\s+(.*?))?(?:\s*;)?$/i);
    
    if (!deleteMatch) {
      return { 
        rows: [], 
        rowCount: 0, 
        error: new Error('Could not parse DELETE query for REST API') 
      };
    }
    
    const tableName = deleteMatch[1];
    const whereClause = deleteMatch[2]?.trim();
    
    if (!whereClause) {
      return { 
        rows: [], 
        rowCount: 0, 
        error: new Error('DELETE without WHERE clause is not supported via REST API') 
      };
    }
    
    // Start building query
    let query = supabaseAdmin.from(tableName).delete();
    
    // Parse WHERE conditions
    const conditions = whereClause.split(/\s+and\s+/i);
    
    for (const condition of conditions) {
      const condMatch = condition.match(/([^\s]+)\s*([=<>!]+)\s*(.+)/);
      
      if (condMatch) {
        const [_, column, operator, rawValue] = condMatch;
        
        // Check if value is a parameter or literal
        let value;
        if (rawValue.trim().startsWith('$')) {
          const paramIndex = parseInt(rawValue.trim().substring(1)) - 1;
          value = params[paramIndex];
        } else {
          value = rawValue.trim().replace(/^['"]|['"]$/g, '');
        }
        
        // Currently we only handle equality conditions for deletes
        if (operator === '=') {
          query = query.eq(column, value);
        } else {
          return { 
            rows: [], 
            rowCount: 0, 
            error: new Error(`Unsupported operator in DELETE WHERE clause: ${operator}`) 
          };
        }
      }
    }
    
    // Execute the delete
    const { data, error } = await query.select();
    
    if (error) throw error;
    
    return { 
      rows: data || [], 
      rowCount: data?.length || 1 
    };
  } catch (error) {
    logger.error('Error executing DELETE via REST API:', error);
    return { 
      rows: [], 
      rowCount: 0, 
      error: error as Error 
    };
  }
}

// Create and export the enhanced client
export const supabase: EnhancedClient = {
  query: executeQuery,
  auth: supabaseAdmin.auth,
  realtime: supabaseAdmin.realtime,
  from: supabaseAdmin.from,
  rpc: supabaseAdmin.rpc
};