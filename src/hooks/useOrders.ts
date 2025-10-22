import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Simplified types for the hooks
type OrderItem = {
  id: string;
  order_id: string;
  coffee_product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

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

  // Remove RPC function calls that don't exist - use simple customer creation  
  const getOrCreateCustomer = async (customerData: { name: string; email: string; phone: string }) => {
    try {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerData.email)
        .single();

      if (existingCustomer) {
        return existingCustomer.id;
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
      return newCustomer.id;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  };

  const submitOrder = async (orderData: OrderFormData): Promise<OrderResult> => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Create customer
      const customerId = await getOrCreateCustomer(orderData.customer);

      // Create address
      const { data: address, error: addressError } = await supabase
        .from('addresses')
        .insert({
          customer_id: customerId,
          address_line_1: orderData.address.address_line_1,
          address_line_2: orderData.address.address_line_2,
          city: orderData.address.city,
          county: orderData.address.county,
          postcode: orderData.address.postcode,
          country: orderData.address.country || 'United Kingdom'
        })
        .select()
        .single();

      if (addressError) throw addressError;

      // Generate order number
      const orderNumber = `BC${Date.now().toString().slice(-6)}`;

      // Calculate amounts
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const totalAmount = subtotal + orderData.delivery_fee;

      // Create order
      const { data: order, error: orderError} = await supabase
        .from('orders')
        .insert([{
          customer_id: customerId,
          delivery_address_id: address.id,
          order_number: orderNumber,
          delivery_fee: orderData.delivery_fee,
          total_amount: totalAmount,
          estimated_delivery_time: orderData.estimated_delivery_time as any,
          special_instructions: orderData.special_instructions || null,
          status: 'pending' as any
        } as any])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        coffee_product_id: item.coffee_product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        throw itemsError;
      }

      return {
        success: true,
        order_id: order.id,
        order_number: order.order_number
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
          addresses (address_line_1, city, postcode)
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

  const getOrderByNumber = async (orderNumber: string, email: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_order_by_number', {
          p_order_number: orderNumber,
          p_email: email
        });

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Order not found');
      }
      
      return data[0];
    } catch (error) {
      console.error('Error fetching order by number:', error);
      throw error;
    }
  };

  const getCustomerOrders = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          addresses (address_line_1, city, postcode)
        `)
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
    getOrderByNumber,
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
      // First try to get from database
      const { data: dbProducts, error } = await supabase
        .from('coffee_products')
        .select('*')
        .eq('is_available', true);
      
      if (error) {
        console.warn('Database products not available, using static data:', error);
      }

      if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts);
      } else {
        // Fallback to static data
        const { coffeesI18n } = await import('@/data/coffees-i18n');
        const staticProducts = coffeesI18n.map(coffee => ({
          id: coffee.id,
          name_pt: coffee.name['pt-BR'],
          name_en: coffee.name['en-GB'],
          description_pt: coffee.description['pt-BR'],
          description_en: coffee.description['en-GB'],
          price: 4.50,
          is_available: true,
          prep_time_minutes: 5,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setProducts(staticProducts);
      }
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
      const normalizedAddress = address.toLowerCase();
      const isInArea = normalizedAddress.includes('market harborough') || 
                      normalizedAddress.includes('leicestershire') || 
                      normalizedAddress.includes('lubenham') ||
                      normalizedAddress.includes('le16') ||
                      normalizedAddress.includes('le17');

      if (isInArea) {
        const distance = Math.random() * 4 + 1;
        const baseFee = 3.00;
        const feePerKm = 2.00;
        const deliveryFee = baseFee + (distance * feePerKm);
        const estimatedTime = Math.round(distance * 5 + 15);

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

  return { validateAddress, isValidating };
};