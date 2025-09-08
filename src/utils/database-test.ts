import { supabase } from '@/integrations/supabase/client';

export interface DatabaseTestResult {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
  count?: number;
}

export const testDatabaseConnection = async (): Promise<Record<string, DatabaseTestResult>> => {
  console.log('🔍 Starting database connection tests...');

  // Test basic connection first
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Supabase client initialized:', !!data);
  } catch (error) {
    console.error('❌ Supabase client initialization failed:', error);
    return {
      connection: {
        success: false,
        message: 'Failed to initialize Supabase client',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }

  // List of tables to test - only use tables that exist
  const tables = ['customers', 'addresses', 'coffee_products', 'orders'];
  const results: Record<string, DatabaseTestResult> = {};

  for (const table of tables) {
    try {
      console.log(`🔍 Testing table: ${table}`);
      
      const { data, error, count } = await supabase
        .from(table as any)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.error(`❌ Table ${table} test failed:`, error);
        results[table] = {
          success: false,
          message: `Table ${table} not accessible`,
          error: error.message
        };
      } else {
        console.log(`✅ Table ${table} accessible, count: ${count}`);
        results[table] = {
          success: true,
          message: `Table ${table} accessible`,
          count: count || 0,
          data: data
        };
      }
    } catch (err) {
      console.error(`❌ Table ${table} test exception:`, err);
      results[table] = {
        success: false,
        message: `Exception testing table ${table}`,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  return results;
};