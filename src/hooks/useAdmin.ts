import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { createClient } from '@supabase/supabase-js';

// Flexible Order type for testing - can handle simple or complex queries
type Order = Database['public']['Tables']['orders']['Row'] & {
  customers?: Database['public']['Tables']['customers']['Row'] | null;
  addresses?: Database['public']['Tables']['addresses']['Row'] | null;
  order_items?: (Database['public']['Tables']['order_items']['Row'] & {
    coffee_products?: Database['public']['Tables']['coffee_products']['Row'] | null;
  })[];
};

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

// Create a completely isolated admin Supabase client with explicit configuration
const ADMIN_SUPABASE_URL = 'https://eticmvmetfpijbavteel.supabase.co';
const ADMIN_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aWNtdm1ldGZwaWpiYXZ0ZWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDI2OTQsImV4cCI6MjA3MDc3ODY5NH0.h6Isaa4WG-Yi8fgonQqj3czuFzGOju0AUs3QYOX_JOU';
const ADMIN_EMAIL = 'franklinmarceloferreiradelima@gmail.com';

// Create admin client with singleton pattern to avoid multiple instances
let _adminSupabaseInstance: ReturnType<typeof createClient> | null = null;

const adminSupabase = (() => {
  if (!_adminSupabaseInstance) {
    console.log('🔍 Creating admin Supabase client instance');
    _adminSupabaseInstance = createClient(
      ADMIN_SUPABASE_URL,
      ADMIN_SUPABASE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: localStorage,
          storageKey: 'admin-auth-token', // Use unique storage key
        }
      }
    );

    // Track admin client instance (intentional dual-client architecture)
    if (typeof window !== 'undefined') {
      window.__supabaseClients = window.__supabaseClients || [];
      window.__supabaseClients.push('admin-client');

      // Log client info for debugging (not a warning since it's intentional)
      console.log('ℹ️ Admin client initialized. Total clients:', window.__supabaseClients);
    }
  } else {
    console.log('🔍 Reusing existing admin Supabase client instance');
  }
  return _adminSupabaseInstance;
})();

// Admin data hook that requires authentication
export const useAdmin = (isAuthenticated: boolean = false) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging for orders state changes
  useEffect(() => {
    console.log('🔍 Orders state changed:', {
      ordersCount: orders.length,
      orders: orders.map(o => ({ id: o.id, order_number: o.order_number, status: o.status }))
    });
  }, [orders]);

  // Function to ensure admin is authenticated before making queries
  const ensureAdminAuthenticated = async () => {
    const { data: { session } } = await adminSupabase.auth.getSession();
    console.log('🔍 Session check for database query:', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      expectedEmail: ADMIN_EMAIL,
      isValidAdmin: session?.user?.email === ADMIN_EMAIL
    });

    if (!session || session.user?.email !== ADMIN_EMAIL) {
      throw new Error(`Admin not authenticated. Session: ${!!session}, Email: ${session?.user?.email}`);
    }
    return session;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 FETCHING ORDERS - Admin authenticated:', isAuthenticated);

      // Force session refresh before queries
      console.log('🔍 Forcing session refresh...');
      const { data: { session: refreshedSession }, error: refreshError } = await adminSupabase.auth.refreshSession();
      console.log('🔍 Session refresh result:', {
        success: !refreshError,
        error: refreshError?.message,
        hasSession: !!refreshedSession,
        userEmail: refreshedSession?.user?.email
      });

      // Ensure admin is authenticated before making queries
      const session = await ensureAdminAuthenticated();
      console.log('🔍 Admin session verified:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        isAdmin: session?.user?.email === ADMIN_EMAIL
      });

      // Test authentication context in database query
      console.log('🔍 Testing authentication context...');
      const { data: authTest, error: authTestError } = await adminSupabase
        .rpc('get_current_user_info');

      console.log('🔍 Auth context test:', {
        success: !authTestError,
        error: authTestError?.message,
        authData: authTest
      });

      // Use service-role admin function that bypasses authentication issues
      console.log('🔍 Attempting service-role admin function query...');
      const { data: adminFunctionData, error: adminFunctionError } = await adminSupabase
        .rpc('get_admin_orders');

      // Parse the JSON response from the admin function
      let parsedAdminData = null;
      if (adminFunctionData && !adminFunctionError) {
        try {
          // The function returns a single JSON value, extract it
          parsedAdminData = adminFunctionData;
          console.log('🔍 Parsed admin function data:', parsedAdminData);
        } catch (parseError) {
          console.error('🚨 Error parsing admin function data:', parseError);
        }
      }

      console.log('🔍 Admin function result:', {
        success: !adminFunctionError,
        error: adminFunctionError?.message,
        rawDataType: typeof adminFunctionData,
        rawData: adminFunctionData,
        parsedDataCount: parsedAdminData?.length || 0,
        parsedData: parsedAdminData
      });

      // First try a simple query to test basic access
      console.log('🔍 Attempting simple orders query...');
      const { data: simpleData, error: simpleError } = await adminSupabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at')
        .order('created_at', { ascending: false });

      console.log('🔍 Simple query result:', {
        success: !simpleError,
        error: simpleError?.message,
        dataCount: simpleData?.length || 0,
        data: simpleData
      });

      if (simpleError) {
        console.error('🚨 Simple query failed:', simpleError);
        throw simpleError;
      }

      // If simple query works, try a basic query with just customers
      console.log('🔍 Attempting basic orders query with customers...');
      const { data: basicData, error: basicError } = await adminSupabase
        .from('orders')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      console.log('🔍 Basic query with customers result:', {
        success: !basicError,
        error: basicError?.message,
        dataCount: basicData?.length || 0,
        data: basicData
      });

      if (basicError) {
        console.error('🚨 Basic query failed, falling back to simple data:', basicError);
        // Use simple data if complex query fails
        const data = simpleData;
        const error = null;
      } else {
        // Use basic data if it works
        const data = basicData;
        const error = basicError;
      }

      // Use admin function data if available, otherwise fall back to simple data
      let data, error;
      if (parsedAdminData && parsedAdminData.length > 0) {
        console.log('🔍 Using parsed admin function data');
        data = parsedAdminData;
        error = adminFunctionError;
      } else if (simpleData && simpleData.length > 0) {
        console.log('🔍 Using simple query data');
        data = simpleData;
        error = simpleError;
      } else {
        console.log('🔍 No data from any query, using admin function as fallback');
        data = parsedAdminData || simpleData || [];
        error = adminFunctionError || simpleError;
      }

      console.log('🔍 Orders query result:', {
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0,
        rawData: data,
        dataType: typeof data,
        isArray: Array.isArray(data)
      });

      if (error) {
        console.error('🚨 Database query error:', error);
        throw error;
      }

      console.log('🔍 Setting orders state with data:', data);
      setOrders(data || []);
      console.log('🔍 Orders state should now be updated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      console.error('🚨 Orders fetch error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      console.log('🔍 Updating order status:', { orderId, status });

      // Use admin-friendly function that bypasses authentication context issues
      const { data, error } = await adminSupabase.rpc('update_order_status_admin', {
        p_order_id: orderId,
        p_new_status: status,
        p_admin_email: ADMIN_EMAIL
      });

      console.log('🔍 Order status update result:', { data, error });

      if (error) {
        console.error('🚨 Order status update error:', error);
        throw error;
      }

      // Check if the function returned an error in the response
      if (data && !data.success) {
        console.error('🚨 Order status update failed:', data.error);
        throw new Error(data.error);
      }

      // Update local state with the actual updated data
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: data.new_status, updated_at: data.updated_at }
          : order
      ));

      console.log('✅ Order status updated successfully');
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      console.error('🚨 updateOrderStatus error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getOrderStats = () => {
    console.log('🔍 Calculating stats for orders:', orders.length);
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      outForDelivery: orders.filter(o => o.status === 'out_for_delivery').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, order) => sum + order.total_amount, 0)
    };

    console.log('🔍 Order stats calculated:', stats);
    return stats;
  };

  const getTodaysOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= today;
    });
  };

  // Real-time subscription for orders - only when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setOrders([]);
      return;
    }

    // Add a small delay to ensure authentication is fully established
    const fetchWithDelay = async () => {
      // Wait a bit for authentication to be fully established
      await new Promise(resolve => setTimeout(resolve, 500));
      fetchOrders();
    };

    fetchWithDelay();

    // Set up real-time subscription using admin client
    const subscription = adminSupabase
      .channel('admin_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change detected:', payload);
          fetchOrders(); // Refetch orders when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateOrderStatus,
    getOrderStats,
    getTodaysOrders
  };
};

// Hook for admin authentication - Completely isolated system
export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Simple admin existence check without making auth requests
  const checkAdminExists = async () => {
    // Always return true to avoid any authentication requests
    // Let the actual login attempt handle user existence detection
    return true;
  };

  const createAdmin = async (email: string, password: string) => {
    try {
      // Create the admin user using dedicated client
      const { data, error } = await adminSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: 'Franklin Marcelo Ferreira de Lima',
            role: 'admin',
            business: 'Brazilian Coffee Academy'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Sign out immediately after creation for security
        await adminSupabase.auth.signOut();
        setNeedsSetup(false);
        return { success: true, message: 'Admin account created successfully! You can now log in.' };
      }

      return { success: false, error: 'Failed to create admin account' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Generate diagnostic file
  const generateDiagnosticFile = (diagnosticData: any) => {
    const timestamp = new Date().toISOString();
    const diagnosticContent = `
BRAZILIAN COFFEE ACADEMY - AUTHENTICATION DIAGNOSTIC REPORT
Generated: ${timestamp}
==========================================================

ENVIRONMENT CONFIGURATION:
- Supabase URL: ${ADMIN_SUPABASE_URL}
- Supabase Key: ${ADMIN_SUPABASE_KEY.substring(0, 20)}...
- Admin Email: ${ADMIN_EMAIL}
- Storage Key: admin-auth-token

INPUT PARAMETERS:
- Input Email: ${diagnosticData.inputEmail}
- Password Length: ${diagnosticData.passwordLength}
- Email Trimmed: ${diagnosticData.emailTrimmed}
- Email Match (case-insensitive): ${diagnosticData.emailMatchInput}

AUTHENTICATION REQUEST:
- Method: signInWithPassword
- URL: ${ADMIN_SUPABASE_URL}/auth/v1/token
- Headers: Content-Type: application/json, apikey: ${ADMIN_SUPABASE_KEY.substring(0, 20)}...
- Payload: {email: "${diagnosticData.emailTrimmed}", password: "[REDACTED]"}

AUTHENTICATION RESPONSE:
- Success: ${diagnosticData.authSuccess}
- Error: ${diagnosticData.authError || 'None'}
- User ID: ${diagnosticData.userId || 'None'}
- User Email: ${diagnosticData.userEmail || 'None'}
- Email Confirmed: ${diagnosticData.emailConfirmed || 'None'}

EMAIL VALIDATION:
- User Email: ${diagnosticData.userEmail || 'None'}
- Expected Email: ${ADMIN_EMAIL}
- Exact Match: ${diagnosticData.emailExactMatch}
- Is Valid Admin: ${diagnosticData.isValidAdmin}

SESSION INFORMATION:
- Session Created: ${diagnosticData.sessionCreated}
- Session Storage: admin-auth-token
- Auth State: ${diagnosticData.authState}

ERROR DETAILS:
- Primary Error: ${diagnosticData.primaryError || 'None'}
- Error Type: ${diagnosticData.errorType || 'None'}
- Stack Trace: ${diagnosticData.stackTrace || 'None'}

BROWSER INFORMATION:
- User Agent: ${navigator.userAgent}
- URL: ${window.location.href}
- Timestamp: ${timestamp}

DEBUGGING STEPS TAKEN:
1. Clear existing session
2. Attempt authentication with Supabase
3. Validate user data
4. Check email match
5. Set authentication state

RECOMMENDATIONS:
${diagnosticData.recommendations || 'Review authentication flow and email validation logic'}

==========================================================
End of Diagnostic Report
`;

    // Create and download the file
    const blob = new Blob([diagnosticContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brazilian-coffee-auth-diagnostic-${timestamp.replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const login = async (email: string, password: string) => {
    const diagnosticData: any = {
      inputEmail: email,
      passwordLength: password.length,
      emailTrimmed: email.trim(),
      emailMatchInput: email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase(),
      timestamp: new Date().toISOString()
    };

    try {
      console.log('🔍 ADMIN LOGIN START');
      console.log('🔍 Input Email:', email);
      console.log('🔍 Expected Email:', ADMIN_EMAIL);
      console.log('🔍 Email Match (input):', diagnosticData.emailMatchInput);

      // Clear any existing session first
      await adminSupabase.auth.signOut();

      // Perform authentication
      const { data, error } = await adminSupabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      // Capture authentication response data
      diagnosticData.authSuccess = !error;
      diagnosticData.authError = error?.message;
      diagnosticData.userId = data.user?.id;
      diagnosticData.userEmail = data.user?.email;
      diagnosticData.emailConfirmed = data.user?.email_confirmed_at;
      diagnosticData.sessionCreated = !!data.session;

      console.log('🔍 Auth Response:', {
        success: !error,
        error: error?.message,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          confirmed: data.user.email_confirmed_at
        } : null
      });

      if (error) {
        diagnosticData.primaryError = error.message;
        diagnosticData.errorType = 'Authentication Error';
        diagnosticData.recommendations = 'Check credentials and Supabase configuration';

        console.log('🚨 Authentication failed:', error.message);

        // Generate diagnostic file on failure
        generateDiagnosticFile(diagnosticData);

        return { success: false, error: error.message, diagnosticData };
      }

      if (!data.user) {
        diagnosticData.primaryError = 'No user data returned';
        diagnosticData.errorType = 'Data Error';
        diagnosticData.recommendations = 'Check Supabase user creation and authentication flow';

        console.log('🚨 No user data returned');

        // Generate diagnostic file on failure
        generateDiagnosticFile(diagnosticData);

        return { success: false, error: 'Authentication failed - no user data', diagnosticData };
      }

      // Simple email validation
      const userEmail = data.user.email;
      const isValidAdmin = userEmail === ADMIN_EMAIL;

      diagnosticData.emailExactMatch = userEmail === ADMIN_EMAIL;
      diagnosticData.isValidAdmin = isValidAdmin;
      diagnosticData.authState = 'Email validation completed';

      console.log('🔍 Admin Validation:', {
        userEmail,
        expectedEmail: ADMIN_EMAIL,
        isValidAdmin,
        emailsMatch: userEmail === ADMIN_EMAIL
      });

      if (isValidAdmin) {
        console.log('✅ ADMIN ACCESS GRANTED');
        setIsAuthenticated(true);
        setNeedsSetup(false);
        return { success: true, diagnosticData };
      } else {
        diagnosticData.primaryError = 'Email validation failed - not admin user';
        diagnosticData.errorType = 'Authorization Error';
        diagnosticData.recommendations = 'Verify admin email address in database and code';

        console.log('❌ ADMIN ACCESS DENIED - Invalid email');
        await adminSupabase.auth.signOut();

        // Generate diagnostic file on failure
        generateDiagnosticFile(diagnosticData);

        return { success: false, error: 'Unauthorized: Admin access required', diagnosticData };
      }
    } catch (error) {
      diagnosticData.primaryError = error instanceof Error ? error.message : 'Unknown error';
      diagnosticData.errorType = 'Exception';
      diagnosticData.stackTrace = error instanceof Error ? error.stack : 'No stack trace';
      diagnosticData.recommendations = 'Check network connectivity and Supabase configuration';

      console.error('🚨 Login Exception:', error);

      // Generate diagnostic file on exception
      generateDiagnosticFile(diagnosticData);

      return { success: false, error: 'Login failed - network error', diagnosticData };
    }
  };

  const logout = async () => {
    try {
      await adminSupabase.auth.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      setIsAuthenticated(false);
    }
  };

  // Simple session refresh
  const refreshSession = async () => {
    try {
      console.log('🔍 REFRESHING SESSION');
      const { data: { session } } = await adminSupabase.auth.getSession();
      const isAdmin = session?.user?.email === ADMIN_EMAIL;

      console.log('🔍 Refresh Result:', {
        hasSession: !!session,
        userEmail: session?.user?.email,
        isAdmin
      });

      setIsAuthenticated(isAdmin);
      setIsLoading(false);

      if (isAdmin) {
        setNeedsSetup(false);
      }
    } catch (error) {
      console.error('🚨 Session refresh error:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Simple session check
    const checkSession = async () => {
      try {
        console.log('🔍 INITIAL SESSION CHECK');
        const { data: { session } } = await adminSupabase.auth.getSession();

        const isAdmin = session?.user?.email === ADMIN_EMAIL;

        console.log('🔍 Session Status:', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          expectedEmail: ADMIN_EMAIL,
          isAdmin
        });

        setIsAuthenticated(isAdmin);
        setIsLoading(false);

        if (isAdmin) {
          setNeedsSetup(false);
        }
      } catch (error) {
        console.error('🚨 Session check error:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkSession();

    // Debounced auth state listener to prevent excessive events
    let authStateTimeout: NodeJS.Timeout | null = null;
    const { data: { subscription } } = adminSupabase.auth.onAuthStateChange(
      (event, session) => {
        // Clear previous timeout
        if (authStateTimeout) {
          clearTimeout(authStateTimeout);
        }

        // Debounce auth state changes
        authStateTimeout = setTimeout(() => {
          console.log('🔍 AUTH STATE CHANGE (debounced):', {
            event,
            hasSession: !!session,
            userEmail: session?.user?.email
          });

          const isAdmin = session?.user?.email === ADMIN_EMAIL;

          console.log('🔍 Admin Status:', { isAdmin });

          setIsAuthenticated(isAdmin);
          setIsLoading(false);

          if (isAdmin) {
            setNeedsSetup(false);
          }
        }, 100); // 100ms debounce
      }
    );

    return () => {
      if (authStateTimeout) {
        clearTimeout(authStateTimeout);
      }
      subscription.unsubscribe();
    };
  }, []);

  return {
    isAuthenticated,
    isLoading,
    needsSetup,
    login,
    logout,
    createAdmin,
    checkAdminExists,
    refreshSession,
    generateDiagnosticFile
  };
};
