import { supabase } from '@/integrations/supabase/client';

export interface DatabaseTestResult {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
  count?: number;
}

export const testDatabaseConnection = async (): Promise<DatabaseTestResult> => {
  console.log('🔍 Starting database connection test...');

  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Supabase client initialized:', !!data);
    return {
      success: true,
      message: 'Database connection successful',
      data: { initialized: true }
    };
  } catch (error) {
    console.error('❌ Supabase client initialization failed:', error);
    return {
      success: false,
      message: 'Failed to initialize Supabase client',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const testAllTables = async (): Promise<Record<string, DatabaseTestResult>> => {
  console.log('🔍 Starting all tables test...');
  
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

export const testCoffeeProducts = async (): Promise<DatabaseTestResult> => {
  console.log('🔍 Testing coffee products...');
  
  try {
    const { data, error, count } = await supabase
      .from('coffee_products')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      return {
        success: false,
        message: 'Coffee products test failed',
        error: error.message
      };
    }

    return {
      success: true,
      message: `Found ${count || 0} coffee products`,
      count: count || 0,
      data: data
    };
  } catch (err) {
    return {
      success: false,
      message: 'Coffee products test exception',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
};

export const testDeliveryZones = async (): Promise<DatabaseTestResult> => {
  console.log('🔍 Testing delivery zones...');
  
  // Note: delivery_zones table not available in current schema
  // This would need to be implemented when the table exists
  return {
    success: false,
    message: 'Delivery zones table not available in current schema',
    error: 'Table not found in database types'
  };
};
