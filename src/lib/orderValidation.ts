import { z } from 'zod';

// Customer validation schema
export const customerSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Name contains invalid characters'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  phone: z.string()
    .trim()
    .min(1, 'Phone is required')
    .max(20, 'Phone must be less than 20 characters')
    .regex(/^[0-9+\-\s()]+$/, 'Phone number contains invalid characters'),
});

// Address validation schema
export const addressSchema = z.object({
  address_line_1: z.string()
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .max(255, 'Address must be less than 255 characters'),
  address_line_2: z.string()
    .trim()
    .max(255, 'Address line 2 must be less than 255 characters')
    .optional(),
  city: z.string()
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters'),
  county: z.string()
    .trim()
    .max(100, 'County must be less than 100 characters')
    .optional(),
  postcode: z.string()
    .trim()
    .min(3, 'Postcode must be at least 3 characters')
    .max(20, 'Postcode must be less than 20 characters'),
  country: z.string()
    .trim()
    .max(100, 'Country must be less than 100 characters')
    .optional(),
});

// Order item validation schema
export const orderItemSchema = z.object({
  coffee_product_id: z.string()
    .trim()
    .min(1, 'Product ID is required')
    .max(50, 'Product ID must be less than 50 characters'),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100'),
  unit_price: z.number()
    .min(0, 'Unit price cannot be negative')
    .max(10000, 'Unit price exceeds maximum'),
});

// Special instructions validation
export const specialInstructionsSchema = z.string()
  .trim()
  .max(1000, 'Special instructions must be less than 1000 characters')
  .optional();

// Complete order form validation schema
export const orderFormSchema = z.object({
  customer: customerSchema,
  address: addressSchema,
  items: z.array(orderItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Cannot have more than 50 items'),
  special_instructions: specialInstructionsSchema,
  delivery_fee: z.number()
    .min(0, 'Delivery fee cannot be negative')
    .max(100, 'Delivery fee exceeds maximum'),
  estimated_delivery_time: z.number()
    .int('Delivery time must be a whole number')
    .min(1, 'Delivery time must be at least 1 minute')
    .max(300, 'Delivery time exceeds maximum'),
});

// Type exports
export type CustomerData = z.infer<typeof customerSchema>;
export type AddressData = z.infer<typeof addressSchema>;
export type OrderItemData = z.infer<typeof orderItemSchema>;
export type OrderFormData = z.infer<typeof orderFormSchema>;

// Validation function with detailed error messages
export const validateOrderForm = (data: unknown): { success: true; data: OrderFormData } | { success: false; errors: string[] } => {
  const result = orderFormSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
  
  return { success: false, errors };
};

// Individual field validators for real-time validation
export const validateCustomer = (data: unknown) => customerSchema.safeParse(data);
export const validateAddress = (data: unknown) => addressSchema.safeParse(data);
export const validateOrderItem = (data: unknown) => orderItemSchema.safeParse(data);
