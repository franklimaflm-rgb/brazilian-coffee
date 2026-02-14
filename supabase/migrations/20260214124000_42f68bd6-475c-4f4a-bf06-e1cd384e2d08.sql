
-- Fix 1: Replace get_order_by_number with secure version that validates email
CREATE OR REPLACE FUNCTION public.get_order_by_number(
  _order_number TEXT,
  _email TEXT
)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  status order_status,
  total_amount NUMERIC,
  delivery_fee NUMERIC,
  estimated_delivery_time INTEGER,
  special_instructions TEXT,
  created_at TIMESTAMPTZ,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  items JSONB
)
LANGUAGE plpgsql
STABLE
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
    CAST(0 AS NUMERIC) as delivery_fee,
    0 as estimated_delivery_time,
    o.delivery_instructions as special_instructions,
    o.created_at,
    c.name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    CONCAT(a.street, ', ', a.city, ', ', a.postal_code) as delivery_address,
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
  LEFT JOIN addresses a ON a.id = o.address_id
  WHERE o.order_number = _order_number
    AND LOWER(TRIM(c.email)) = LOWER(TRIM(_email));
END;
$$;

-- Fix 2: Allow anonymous users to view available coffee products
DROP POLICY IF EXISTS "Anyone can view available coffee products" ON public.coffee_products;

CREATE POLICY "Anyone can view available coffee products"
ON public.coffee_products FOR SELECT
TO anon, authenticated
USING (available = true);
