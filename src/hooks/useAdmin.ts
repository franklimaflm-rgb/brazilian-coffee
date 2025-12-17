import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Flexible Order type for admin panel - matches database schema
type Order = {
  id: string;
  customer_id: string | null;
  address_id: string | null;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  delivery_instructions?: string | null;
  customers?: any;
  addresses?: any;
  order_items?: any[];
};

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

// Admin data hook that requires authentication
export const useAdmin = (isAuthenticated: boolean = false) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use main Supabase client - RLS policies enforce admin access
      const { data: simpleData, error: simpleError } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, updated_at, customer_id, address_id, delivery_instructions')
        .order('created_at', { ascending: false });

      if (simpleError) {
        console.error('Orders query error:', simpleError);
        throw simpleError;
      }

      // Try to get orders with customer data
      const { data: ordersWithCustomers, error: joinError } = await supabase
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

      if (joinError) {
        console.warn('Join query failed, using simple data:', joinError);
        setOrders(simpleData || []);
      } else {
        setOrders(ordersWithCustomers || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      console.error('Orders fetch error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      // RLS policies enforce admin access - server-side validation
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Order status update error:', error);
        throw error;
      }

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: data.status as string, updated_at: data.updated_at as string }
          : order
      ));

      return { success: true };
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  };

  const getOrderStats = () => {
    return {
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
  };

  const getTodaysOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= today;
    });
  };

  // Fetch orders when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setOrders([]);
      return;
    }

    // Add delay to ensure authentication is established
    const fetchWithDelay = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      fetchOrders();
    };

    fetchWithDelay();

    // Real-time subscription
    const subscription = supabase
      .channel('admin_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
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

// Hook for admin authentication using server-side role validation
export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  // Check if user has admin role using server-side has_role function
  const checkIsAdmin = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });
      
      if (error) {
        console.error('Role check error:', error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      console.error('Role check exception:', error);
      return false;
    }
  };

  const createAdmin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: 'Admin',
            role: 'admin'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await supabase.auth.signOut();
        setNeedsSetup(false);
        return { success: true, message: 'Admin account created. Please add the admin role in the database, then log in.' };
      }

      return { success: false, error: 'Failed to create admin account' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Sign out any existing session
      await supabase.auth.signOut();

      // Authenticate
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed - no user data' };
      }

      // Check admin role via server-side function
      const isAdmin = await checkIsAdmin(data.user.id);

      if (isAdmin) {
        setIsAuthenticated(true);
        setNeedsSetup(false);
        return { success: true };
      } else {
        await supabase.auth.signOut();
        return { success: false, error: 'Unauthorized: Admin role required. Contact administrator.' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed - network error' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      setIsAuthenticated(false);
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const isAdmin = await checkIsAdmin(session.user.id);
        setIsAuthenticated(isAdmin);
        if (isAdmin) {
          setNeedsSetup(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Session refresh error:', error);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Generate diagnostic file for troubleshooting
  const generateDiagnosticFile = (diagnosticData: any) => {
    const timestamp = new Date().toISOString();
    const diagnosticContent = `
BRAZILIAN COFFEE ACADEMY - AUTHENTICATION DIAGNOSTIC REPORT
Generated: ${timestamp}
==========================================================

AUTHENTICATION STATE:
- Is Authenticated: ${isAuthenticated}
- Is Loading: ${isLoading}
- Needs Setup: ${needsSetup}

DIAGNOSTIC DATA:
${JSON.stringify(diagnosticData, null, 2)}

BROWSER INFORMATION:
- User Agent: ${navigator.userAgent}
- URL: ${window.location.href}
- Timestamp: ${timestamp}

TROUBLESHOOTING STEPS:
1. Verify admin email and password
2. Check if user has admin role in user_roles table
3. Check browser console for errors
4. Try clearing browser cache and cookies

==========================================================
End of Diagnostic Report
`;

    const blob = new Blob([diagnosticContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auth-diagnostic-${timestamp.replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user?.id) {
          const isAdmin = await checkIsAdmin(session.user.id);
          setIsAuthenticated(isAdmin);
          if (isAdmin) {
            setNeedsSetup(false);
          }
        } else {
          setIsAuthenticated(false);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Session check error:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkSession();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user?.id) {
          // Check admin role asynchronously
          setTimeout(async () => {
            const isAdmin = await checkIsAdmin(session.user.id);
            setIsAuthenticated(isAdmin);
            setIsLoading(false);
            if (isAdmin) {
              setNeedsSetup(false);
            }
          }, 0);
        } else {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    );

    return () => {
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
    checkAdminExists: async () => true,
    refreshSession,
    generateDiagnosticFile
  };
};
