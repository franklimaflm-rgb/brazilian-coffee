-- Step 1: Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Step 2: Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "users_can_view_own_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Step 3: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 4: Add user_id column to customers for auth linking
ALTER TABLE public.customers
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_customers_user_id ON public.customers(user_id);

-- Step 5: Update RLS policies for guest checkout

-- CUSTOMERS: Allow anonymous INSERT (guest checkout)
CREATE POLICY "customers_anonymous_insert"
ON public.customers
FOR INSERT
TO anon
WITH CHECK (true);

-- CUSTOMERS: Update select policy to include user_id linking
DROP POLICY IF EXISTS "customers_select_own" ON public.customers;
CREATE POLICY "customers_select_own"
ON public.customers
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  auth.uid() = user_id OR
  has_role(auth.uid(), 'admin')
);

-- ADDRESSES: Allow anonymous INSERT
CREATE POLICY "addresses_anonymous_insert"
ON public.addresses
FOR INSERT
TO anon
WITH CHECK (true);

-- ORDERS: Allow anonymous INSERT
CREATE POLICY "orders_anonymous_insert"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);

-- ORDERS: Update select to use has_role for admin
DROP POLICY IF EXISTS "orders_admin_access" ON public.orders;
CREATE POLICY "orders_admin_access"
ON public.orders
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ORDERS: Update select policy
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = orders.customer_id
    AND (
      customers.id = auth.uid() OR 
      customers.user_id = auth.uid()
    )
  )
);

-- ORDER_ITEMS: Allow anonymous INSERT
CREATE POLICY "order_items_anonymous_insert"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (true);

-- ORDER_ITEMS: Update admin policy to use has_role
DROP POLICY IF EXISTS "order_items_admin_access" ON public.order_items;
CREATE POLICY "order_items_admin_access"
ON public.order_items
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Step 6: Create secure order lookup function
CREATE OR REPLACE FUNCTION public.get_order_by_number(
  p_order_number VARCHAR,
  p_email VARCHAR
)
RETURNS TABLE (
  id UUID,
  order_number VARCHAR,
  status VARCHAR,
  total_amount NUMERIC,
  delivery_fee NUMERIC,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  customer_name VARCHAR,
  customer_email VARCHAR,
  customer_phone VARCHAR,
  delivery_address TEXT,
  items JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.delivery_fee,
    o.estimated_delivery_time,
    o.special_instructions,
    o.created_at,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    (a.address_line_1 || ', ' || a.city || ', ' || a.postcode) as delivery_address,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'coffee_product_id', oi.coffee_product_id,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'total_price', oi.total_price
        )
      )
      FROM order_items oi
      WHERE oi.order_id = o.id
    ) as items
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  LEFT JOIN addresses a ON a.id = o.delivery_address_id
  WHERE o.order_number = p_order_number
    AND LOWER(c.email) = LOWER(p_email);
END;
$$;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_order_by_number(VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_by_number(VARCHAR, VARCHAR) TO authenticated;