import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { createClient } from '@supabase/supabase-js';

type Order = Database['public']['Tables']['orders']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  addresses: Database['public']['Tables']['addresses']['Row'] | null;
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    coffee_products: Database['public']['Tables']['coffee_products']['Row'] | null;
  })[];
};

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

// Create a dedicated admin Supabase client to avoid conflicts
const adminSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Simple admin data hook that doesn't manage authentication
export const useAdmin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            id,
            name,
            email,
            phone
          ),
          addresses!delivery_address_id (
            id,
            address_line_1,
            address_line_2,
            city,
            county,
            postcode,
            is_within_delivery_zone,
            distance_from_business
          ),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            coffee_products (
              id,
              name_en,
              name_pt,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      // Check admin authorization
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      // Use secure function for order status updates
      const { data, error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: status,
      });

      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status, updated_at: new Date().toISOString() }
          : order
      ));

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      return { success: false, error: errorMessage };
    }
  };

  const getOrderStats = () => {
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

  // Real-time subscription for orders
  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const subscription = supabase
      .channel('orders_changes')
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
  }, []);

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

  const login = async (email: string, password: string) => {
    try {
      // Use dedicated admin client to avoid conflicts
      const { data, error } = await adminSupabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check specific error messages to determine if admin setup is needed
        if (error.message.includes('User not found') ||
            error.message.includes('Invalid email') ||
            error.message.includes('Email not confirmed')) {
          setNeedsSetup(true);
          return { success: false, error: 'Admin account not found. Please create admin account first.', needsSetup: true };
        }
        return { success: false, error: error.message };
      }

      // Verify this is Franklin's admin account
      if (data.user?.email === 'franklinmarceloderreiradelima@gmail.com') {
        // Manually update state instead of relying on auth listener
        setIsAuthenticated(true);
        setNeedsSetup(false);
        return { success: true };
      } else {
        // Sign out if not admin
        await adminSupabase.auth.signOut();
        return { success: false, error: 'Unauthorized: Admin access required' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
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

  // Manual session refresh function
  const refreshSession = async () => {
    try {
      const { data: { session } } = await adminSupabase.auth.getSession();
      const isAdmin = session?.user?.email === 'franklinmarceloderreiradelima@gmail.com';

      setIsAuthenticated(isAdmin);
      setIsLoading(false);

      if (isAdmin) {
        setNeedsSetup(false);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    // Simple session check using dedicated admin client
    const checkSession = async () => {
      try {
        const { data: { session } } = await adminSupabase.auth.getSession();
        const isAdmin = session?.user?.email === 'franklinmarceloderreiradelima@gmail.com';

        setIsAuthenticated(isAdmin);
        setIsLoading(false);

        if (isAdmin) {
          setNeedsSetup(false);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkSession();

    // No auth state listener to avoid conflicts with other auth systems
  }, []);

  return {
    isAuthenticated,
    isLoading,
    needsSetup,
    login,
    logout,
    createAdmin,
    checkAdminExists,
    refreshSession
  };
};
