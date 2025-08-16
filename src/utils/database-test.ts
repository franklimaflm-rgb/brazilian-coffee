// Database Connection Test Utility
// Use this to verify Supabase database connectivity and table existence

import { supabase } from '@/integrations/supabase/client';

export interface DatabaseTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const testDatabaseConnection = async (): Promise<DatabaseTestResult> => {
  try {
    console.log('🔍 Testing Supabase database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('coffee_products')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error);
      return {
        success: false,
        message: 'Database connection failed',
        error: error.message
      };
    }

    console.log('✅ Database connection successful');
    return {
      success: true,
      message: 'Database connection successful',
      data
    };
  } catch (err) {
    console.error('❌ Database test error:', err);
    return {
      success: false,
      message: 'Database test failed',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
};

export const testAllTables = async (): Promise<Record<string, DatabaseTestResult>> => {
  const tables = [
    'coffee_products',
    'delivery_zones', 
    'business_settings',
    'customers',
    'addresses',
    'orders',
    'order_items'
  ];

  const results: Record<string, DatabaseTestResult> = {};

  for (const table of tables) {
    try {
      console.log(`🔍 Testing table: ${table}`);
      
      const { data, error, count } = await supabase
        .from(table)
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
        console.log(`✅ Table ${table} accessible (${count} records)`);
        results[table] = {
          success: true,
          message: `Table ${table} accessible with ${count} records`,
          data: { count, sample: data }
        };
      }
    } catch (err) {
      console.error(`❌ Table ${table} error:`, err);
      results[table] = {
        success: false,
        message: `Table ${table} test failed`,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  return results;
};

export const testCoffeeProducts = async (): Promise<DatabaseTestResult> => {
  try {
    console.log('🔍 Testing coffee_products table...');
    
    const { data, error } = await supabase
      .from('coffee_products')
      .select('*');

    if (error) {
      return {
        success: false,
        message: 'Coffee products table not accessible',
        error: error.message
      };
    }

    const expectedCoffees = ['espresso', 'cappuccino', 'latte', 'americano'];
    const foundCoffees = data?.map(coffee => coffee.id) || [];
    const missingCoffees = expectedCoffees.filter(id => !foundCoffees.includes(id));

    if (missingCoffees.length > 0) {
      return {
        success: false,
        message: `Missing coffee products: ${missingCoffees.join(', ')}`,
        data: { found: foundCoffees, missing: missingCoffees }
      };
    }

    return {
      success: true,
      message: `All ${data.length} coffee products found`,
      data
    };
  } catch (err) {
    return {
      success: false,
      message: 'Coffee products test failed',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
};

export const testDeliveryZones = async (): Promise<DatabaseTestResult> => {
  try {
    console.log('🔍 Testing delivery_zones table...');
    
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*');

    if (error) {
      return {
        success: false,
        message: 'Delivery zones table not accessible',
        error: error.message
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: 'No delivery zones found',
        data: []
      };
    }

    const marketHarboroughZone = data.find(zone => zone.name === 'Market Harborough');
    if (!marketHarboroughZone) {
      return {
        success: false,
        message: 'Market Harborough delivery zone not found',
        data
      };
    }

    return {
      success: true,
      message: `Found ${data.length} delivery zone(s)`,
      data
    };
  } catch (err) {
    return {
      success: false,
      message: 'Delivery zones test failed',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
};

export const runFullDatabaseTest = async (): Promise<void> => {
  console.log('🚀 Starting comprehensive database test...');
  console.log('=====================================');

  // Test basic connection
  const connectionTest = await testDatabaseConnection();
  console.log('Connection Test:', connectionTest);

  // Test all tables
  const tableTests = await testAllTables();
  console.log('Table Tests:', tableTests);

  // Test specific critical tables
  const coffeeTest = await testCoffeeProducts();
  console.log('Coffee Products Test:', coffeeTest);

  const deliveryTest = await testDeliveryZones();
  console.log('Delivery Zones Test:', deliveryTest);

  console.log('=====================================');
  console.log('🏁 Database test completed');

  // Summary
  const allTests = [connectionTest, coffeeTest, deliveryTest, ...Object.values(tableTests)];
  const successCount = allTests.filter(test => test.success).length;
  const totalTests = allTests.length;

  console.log(`📊 Results: ${successCount}/${totalTests} tests passed`);

  if (successCount === totalTests) {
    console.log('✅ All database tests passed! The system should work correctly.');
  } else {
    console.log('❌ Some database tests failed. Please check the database setup.');
    console.log('📖 Refer to database-setup.md for troubleshooting steps.');
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testDatabase = {
    testConnection: testDatabaseConnection,
    testAllTables,
    testCoffeeProducts,
    testDeliveryZones,
    runFullTest: runFullDatabaseTest
  };
}
