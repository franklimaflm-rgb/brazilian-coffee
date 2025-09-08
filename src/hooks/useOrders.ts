import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { coffeesI18n } from '@/data/coffees-i18n';

type Customer = Database['public']['Tables']['customers']['Insert'];
type Address = Database['public']['Tables']['addresses']['Insert'];
type Order = Database['public']['Tables']['orders']['Insert'];
type OrderItem = Database['public']['Tables']['order_items']['Insert'];

export interface OrderFormData {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  address: {
    address_line_1: string;
    address_line_2?: string;
    city: string;
    county?: string;
    postcode: string;
    country?: string;
  };
  items: {
    coffee_product_id: string;
    quantity: number;
    unit_price: number;
  }[];
  special_instructions?: string;
  delivery_fee: number;
  estimated_delivery_time: number;
}

export interface OrderResult {
  success: boolean;
  order_id?: string;
  order_number?: string;
  error?: string;
}

export const useOrders = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Independent customer creation function (no auth dependency)
  const getOrCreateCustomer = async (customerData: { name: string; email: string; phone: string }) => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_customer', {
        p_name: customerData.name,
        p_email: customerData.email,
        p_phone: customerData.phone,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const submitOrder = async (orderData: OrderFormData): Promise<OrderResult> => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Start a transaction-like process
      
      // Use the secure create_order function for anonymous order creation
      const coffeeItems = orderData.items.map(item => ({
        coffee_product_id: item.coffee_product_id,
        quantity: item.quantity,
      }));

      const { data: orderId, error } = await supabase.rpc('create_order', {
        p_customer_email: orderData.customer.email,
        p_customer_name: orderData.customer.name,
        p_customer_phone: orderData.customer.phone,
        p_address_line_1: orderData.address.address_line_1,
        p_coffee_items: coffeeItems,
        p_address_line_2: orderData.address.address_line_2,
        p_city: orderData.address.city || 'Market Harborough',
        p_county: orderData.address.county || 'Leicestershire',
        p_postcode: orderData.address.postcode || 'LE16',
        p_country: orderData.address.country || 'United Kingdom',
        p_special_instructions: orderData.special_instructions,
        p_delivery_fee: orderData.delivery_fee,
      });

      if (error) throw error;

      // Get the order number for confirmation
      const { data: orderDetails } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', orderId)
        .single();

      return {
        success: true,
        order_id: orderId,
        order_number: orderDetails?.order_number || 'BC000000',
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOrderStatus = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (name, email, phone),
          addresses (address_line_1, city, postcode),
          order_items (
            *,
            coffee_products (name_en, name_pt)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return { success: true, order: data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order';
      return { success: false, error: errorMessage };
    }
  };

  const getCustomerOrders = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          addresses (address_line_1, city, postcode),
          order_items (
            *,
            coffee_products (name_en, name_pt)
          )
        `)
        .eq('customers.email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, orders: data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      return { success: false, error: errorMessage };
    }
  };

  return {
    submitOrder,
    getOrderStatus,
    getCustomerOrders,
    isSubmitting,
    error,
  };
};

// Hook for fetching coffee products from database
export const useCoffeeProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Use static coffee data until coffee_products table is available
      const staticProducts = coffeesI18n.map(coffee => ({
        id: coffee.id,
        name_pt: coffee.name['pt-BR'],
        name_en: coffee.name['en-GB'],
        description_pt: coffee.description['pt-BR'],
        description_en: coffee.description['en-GB'],
        price: 4.50, // Default price
        is_available: true,
        prep_time_minutes: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      setProducts(staticProducts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
  };
};

// Hook for delivery zone validation
export const useDeliveryValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateAddress = async (address: string): Promise<{
    isValid: boolean;
    isWithinRange: boolean;
    distance?: number;
    deliveryFee?: number;
    estimatedTime?: number;
    message: string;
  }> => {
    setIsValidating(true);

    try {
      // In a real application, you would use a geocoding service here
      // For demo purposes, we'll simulate validation
      
      const normalizedAddress = address.toLowerCase();
      const isInArea = normalizedAddress.includes('market harborough') || 
                      normalizedAddress.includes('leicestershire') || 
                      normalizedAddress.includes('lubenham') ||
                      normalizedAddress.includes('le16') ||
                      normalizedAddress.includes('le17');

      if (isInArea) {
        // Simulate distance calculation
        const distance = Math.random() * 4 + 1; // 1-5km
        
        // Get delivery zone info - use static values for now
        const baseFee = 3.00;
        const feePerKm = 2.00;
        const deliveryFee = baseFee + (distance * feePerKm);
        const estimatedTime = Math.round(distance * 5 + 15); // 15-40 minutes

        return {
          isValid: true,
          isWithinRange: true,
          distance,
          deliveryFee: Math.round(deliveryFee * 100) / 100,
          estimatedTime,
          message: 'Address is within our delivery area!',
        };
      } else {
        return {
          isValid: true,
          isWithinRange: false,
          message: 'Address is outside our delivery area (maximum 5km from Lubenham)',
        };
      }
    } catch (error) {
      return {
        isValid: false,
        isWithinRange: false,
        message: 'Unable to validate address. Please check and try again.',
      };
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateAddress,
    isValidating,
  };
};
