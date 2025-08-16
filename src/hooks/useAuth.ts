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
      const isAdmin = session?.user?.email === 'franklinmarceloderreiradelima@gmail.com';
      
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
      async (event, session) => {
        const isAdmin = session?.user?.email === 'franklinmarceloderreiradelima@gmail.com';
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
          isAdmin,
        });
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
        const { error: customerError } = await supabase.rpc('register_customer', {
          p_name: customerData.name,
          p_email: customerData.email,
          p_phone: customerData.phone || null,
        });

        if (customerError) {
          console.error('Error creating customer record:', customerError);
        }
      }

      return { success: true, data };
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
      // First try to get existing customer
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerData.email)
        .single();

      if (existingCustomer) {
        return { success: true, customerId: existingCustomer.id };
      }

      // Create new customer using secure function
      const { data: customerId, error } = await supabase.rpc('register_customer', {
        p_name: customerData.name,
        p_email: customerData.email,
        p_phone: customerData.phone || null,
      });

      if (error) throw error;

      return { success: true, customerId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Create order using secure function
  const createOrder = async (orderData: {
    customerEmail: string;
    addressId: string;
    coffeeItems: Array<{ coffee_id: string; quantity: number }>;
    specialInstructions?: string;
    deliveryFee: number;
  }) => {
    try {
      const { data: orderId, error } = await supabase.rpc('create_order', {
        p_customer_email: orderData.customerEmail,
        p_address_id: orderData.addressId,
        p_coffee_items: orderData.coffeeItems,
        p_special_instructions: orderData.specialInstructions || null,
        p_delivery_fee: orderData.deliveryFee,
      });

      if (error) throw error;

      return { success: true, orderId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Update order status (admin only)
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      if (!authState.isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: newStatus,
      });

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
