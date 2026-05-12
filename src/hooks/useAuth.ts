import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
}

interface CustomerData {
  name: string;
  email: string;
  phone?: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAdmin: false,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check admin role via server-side has_role function
      let isAdmin = false;
      if (session?.user?.id) {
        const { data } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        isAdmin = data === true;
      }
      
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        isAdmin,
      });
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          user: session?.user ?? null,
          session,
          loading: false,
          isAdmin: prev.isAdmin, // Keep previous admin status, will be updated on next check
        }));
        
        // Check admin role asynchronously after state update
        if (session?.user?.id) {
          setTimeout(async () => {
            const { data } = await supabase.rpc('has_role', {
              _user_id: session.user.id,
              _role: 'admin'
            });
            setAuthState(prev => ({ ...prev, isAdmin: data === true }));
          }, 0);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email/password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string, customerData: CustomerData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: customerData.name,
            phone: customerData.phone,
          }
        }
      });

      if (error) throw error;

      // Create customer record if signup successful
      if (data.user) {
        const customerResult = await registerCustomer(customerData);
        if (!customerResult.success) {
          console.error('Error creating customer record:', customerResult.error);
        }
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Simplified customer creation - direct database insert
  const registerCustomer = async (customerData: { name: string; email: string; phone?: string }) => {
    try {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerData.email)
        .single();

      if (existingCustomer) {
        return { success: true, customerId: existingCustomer.id };
      }

      // Create new customer
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, customerId: newCustomer.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Update password
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Get or create customer for anonymous orders
  const getOrCreateCustomer = async (customerData: CustomerData) => {
    try {
      return await registerCustomer(customerData);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Create order using direct database operations
  const createOrder = async (orderData: {
    customerEmail: string;
    addressId: string;
    coffeeItems: Array<{ coffee_id: string; quantity: number }>;
    specialInstructions?: string;
    deliveryFee: number;
  }) => {
    try {
      // Get customer by email
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', orderData.customerEmail)
        .single();

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Generate order number
      const orderNumber = `BC${Date.now().toString().slice(-6)}`;

      // Calculate total amount (simplified)
      const itemTotal = orderData.coffeeItems.length * 4.50; // Default price
      const totalAmount = itemTotal + orderData.deliveryFee;

      // Create order
      const { data: order, error } = await (supabase
        .from('orders') as any)
        .insert({
          customer_id: customer.id,
          delivery_address_id: orderData.addressId,
          order_number: orderNumber,
          subtotal: itemTotal,
          delivery_fee: orderData.deliveryFee,
          total_amount: totalAmount,
          special_instructions: orderData.specialInstructions || null,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, orderId: order.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Update order status (admin only - enforced by RLS)
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Server-side RLS policies enforce admin access - no client-side check needed
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus as any, 
          updated_at: new Date().toISOString() 
        } as any)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    getOrCreateCustomer,
    createOrder,
    updateOrderStatus,
  };
};
