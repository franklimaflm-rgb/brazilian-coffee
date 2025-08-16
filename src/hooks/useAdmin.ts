import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

type Order = Database['public']['Tables']['orders']['Row'] & {
  customers: Database['public']['Tables']['customers']['Row'] | null;
  addresses: Database['public']['Tables']['addresses']['Row'] | null;
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    coffee_products: Database['public']['Tables']['coffee_products']['Row'] | null;
  })[];
};

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export const useAdmin = () => {
  const { isAdmin, session } = useAuth();
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
          addresses (
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

// Hook for admin authentication
export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const adminCredentials = {
    email: 'franklinmarceloderreiradelima@gmail.com',
    // In a real app, this would be handled more securely
    password: 'admin123'
  };

  const login = async (email: string, password: string) => {
    try {
      if (email === adminCredentials.email && password === adminCredentials.password) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_authenticated', 'true');
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
  };

  useEffect(() => {
    // Check if admin is already authenticated
    const isAuth = localStorage.getItem('admin_authenticated') === 'true';
    setIsAuthenticated(isAuth);
    setIsLoading(false);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout
  };
};
