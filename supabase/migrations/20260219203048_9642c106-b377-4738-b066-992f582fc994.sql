
-- Drop any existing anonymous insert policies on sensitive tables
DROP POLICY IF EXISTS "customers_anonymous_insert" ON public.customers;
DROP POLICY IF EXISTS "addresses_anonymous_insert" ON public.addresses;
DROP POLICY IF EXISTS "orders_anonymous_insert" ON public.orders;
DROP POLICY IF EXISTS "order_items_anonymous_insert" ON public.order_items;

-- Create a SECURITY DEFINER function for guest order creation
-- This centralizes validation and prevents direct anonymous table access
CREATE OR REPLACE FUNCTION public.create_guest_order(
  _customer_data JSONB,
  _address_data JSONB,
  _order_data JSONB,
  _items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id UUID;
  _address_id UUID;
  _order_id UUID;
  _name TEXT;
  _email TEXT;
  _phone TEXT;
  _street TEXT;
  _city TEXT;
  _postal_code TEXT;
  _country TEXT;
  _order_number TEXT;
  _total_amount NUMERIC;
  _item JSONB;
  _coffee_product_id TEXT;
  _quantity INTEGER;
  _unit_price NUMERIC;
  _total_price NUMERIC;
BEGIN
  -- Extract and validate customer data
  _name := TRIM(_customer_data->>'name');
  _email := TRIM(_customer_data->>'email');
  _phone := TRIM(_customer_data->>'phone');

  IF _name IS NULL OR length(_name) < 1 OR length(_name) > 100 THEN
    RAISE EXCEPTION 'Invalid customer name';
  END IF;

  IF _email IS NULL OR _email !~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;

  IF _phone IS NOT NULL AND length(_phone) > 30 THEN
    RAISE EXCEPTION 'Invalid phone number';
  END IF;

  -- Extract and validate address data
  _street := TRIM(_address_data->>'street');
  _city := TRIM(_address_data->>'city');
  _postal_code := TRIM(_address_data->>'postal_code');
  _country := COALESCE(TRIM(_address_data->>'country'), 'UK');

  IF _street IS NULL OR length(_street) < 1 OR length(_street) > 200 THEN
    RAISE EXCEPTION 'Invalid street address';
  END IF;

  IF _city IS NULL OR length(_city) < 1 OR length(_city) > 100 THEN
    RAISE EXCEPTION 'Invalid city';
  END IF;

  IF _postal_code IS NULL OR length(_postal_code) < 1 OR length(_postal_code) > 20 THEN
    RAISE EXCEPTION 'Invalid postal code';
  END IF;

  -- Extract and validate order data
  _order_number := TRIM(_order_data->>'order_number');
  _total_amount := (_order_data->>'total_amount')::NUMERIC;

  IF _order_number IS NULL OR length(_order_number) < 1 OR length(_order_number) > 50 THEN
    RAISE EXCEPTION 'Invalid order number';
  END IF;

  IF _total_amount IS NULL OR _total_amount <= 0 OR _total_amount > 10000 THEN
    RAISE EXCEPTION 'Invalid total amount';
  END IF;

  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Order must have at least one item';
  END IF;

  IF jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Too many items in order';
  END IF;

  -- Validate each item
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _coffee_product_id := _item->>'coffee_product_id';
    _quantity := (_item->>'quantity')::INTEGER;
    _unit_price := (_item->>'unit_price')::NUMERIC;

    IF _coffee_product_id IS NULL OR length(_coffee_product_id) = 0 THEN
      RAISE EXCEPTION 'Invalid coffee product ID';
    END IF;

    IF _quantity IS NULL OR _quantity < 1 OR _quantity > 100 THEN
      RAISE EXCEPTION 'Invalid item quantity';
    END IF;

    IF _unit_price IS NULL OR _unit_price <= 0 OR _unit_price > 1000 THEN
      RAISE EXCEPTION 'Invalid item price';
    END IF;

    -- Verify coffee product exists and is available
    IF NOT EXISTS (
      SELECT 1 FROM public.coffee_products
      WHERE id = _coffee_product_id AND available = true
    ) THEN
      RAISE EXCEPTION 'Coffee product not available: %', _coffee_product_id;
    END IF;
  END LOOP;

  -- Upsert customer (check if email already exists)
  SELECT id INTO _customer_id
  FROM public.customers
  WHERE LOWER(TRIM(email)) = LOWER(_email)
  LIMIT 1;

  IF _customer_id IS NULL THEN
    INSERT INTO public.customers (name, email, phone, user_id)
    VALUES (_name, _email, _phone, NULL)
    RETURNING id INTO _customer_id;
  END IF;

  -- Insert address linked to customer
  INSERT INTO public.addresses (customer_id, street, city, postal_code, country)
  VALUES (_customer_id, _street, _city, _postal_code, _country)
  RETURNING id INTO _address_id;

  -- Insert order
  INSERT INTO public.orders (customer_id, address_id, order_number, total_amount, delivery_instructions, status)
  VALUES (
    _customer_id,
    _address_id,
    _order_number,
    _total_amount,
    COALESCE(TRIM(_order_data->>'delivery_instructions'), NULL),
    'pending'
  )
  RETURNING id INTO _order_id;

  -- Insert order items
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _coffee_product_id := _item->>'coffee_product_id';
    _quantity := (_item->>'quantity')::INTEGER;
    _unit_price := (_item->>'unit_price')::NUMERIC;
    _total_price := (_item->>'total_price')::NUMERIC;

    INSERT INTO public.order_items (order_id, coffee_product_id, quantity, unit_price, total_price)
    VALUES (_order_id, _coffee_product_id, _quantity, _unit_price, _total_price);
  END LOOP;

  RETURN _order_id;
END;
$$;

-- Grant execute to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.create_guest_order(JSONB, JSONB, JSONB, JSONB) TO anon, authenticated;
