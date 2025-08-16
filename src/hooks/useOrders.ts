import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

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

  const submitOrder = async (orderData: OrderFormData): Promise<OrderResult> => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Start a transaction-like process
      
      // 1. Create or get customer
      let customerId: string;
      
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', orderData.customer.email)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        
        // Update customer info
        await supabase
          .from('customers')
          .update({
            name: orderData.customer.name,
            phone: orderData.customer.phone,
          })
          .eq('id', customerId);
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: orderData.customer.name,
            email: orderData.customer.email,
            phone: orderData.customer.phone,
          })
          .select('id')
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // 2. Create address
      const { data: newAddress, error: addressError } = await supabase
        .from('addresses')
        .insert({
          customer_id: customerId,
          address_line_1: orderData.address.address_line_1,
          address_line_2: orderData.address.address_line_2,
          city: orderData.address.city,
          county: orderData.address.county,
          postcode: orderData.address.postcode,
          country: orderData.address.country || 'United Kingdom',
          is_within_delivery_zone: true, // We've already validated this
        })
        .select('id')
        .single();

      if (addressError) throw addressError;

      // 3. Calculate totals
      const subtotal = orderData.items.reduce(
        (sum, item) => sum + (item.unit_price * item.quantity),
        0
      );
      const total = subtotal + orderData.delivery_fee;

      // 4. Create order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: customerId,
          delivery_address_id: newAddress.id,
          subtotal,
          delivery_fee: orderData.delivery_fee,
          total_amount: total,
          special_instructions: orderData.special_instructions,
          estimated_delivery_time: orderData.estimated_delivery_time,
          status: 'pending',
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      // 5. Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: newOrder.id,
        coffee_product_id: item.coffee_product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return {
        success: true,
        order_id: newOrder.id,
        order_number: newOrder.order_number,
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
  const [products, setProducts] = useState<Database['public']['Tables']['coffee_products']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coffee_products')
        .select('*')
        .eq('is_available', true)
        .order('name_en');

      if (error) throw error;
      setProducts(data || []);
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
        
        // Get delivery zone info from database
        const { data: deliveryZone } = await supabase
          .from('delivery_zones')
          .select('*')
          .eq('is_active', true)
          .single();

        const baseFee = deliveryZone?.base_delivery_fee || 3.00;
        const feePerKm = deliveryZone?.fee_per_km || 2.00;
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
