
-- 1) Lock down user_roles writes: only admins (or service_role) may insert/update/delete.
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2) Drop the unsafe single-argument order lookup that returned a full row without email gating.
DROP FUNCTION IF EXISTS public.get_order_by_number(text);

-- 3) Rebuild create_guest_order to use server-side prices and compute totals server-side.
CREATE OR REPLACE FUNCTION public.create_guest_order(
  _customer_data jsonb,
  _address_data jsonb,
  _order_data jsonb,
  _items jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  _delivery_fee NUMERIC := 0;
  _items_subtotal NUMERIC := 0;
  _total_amount NUMERIC;
  _item JSONB;
  _coffee_product_id TEXT;
  _quantity INTEGER;
  _server_unit_price NUMERIC;
  _server_total_price NUMERIC;
BEGIN
  -- Customer validation
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

  -- Address validation
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

  -- Order header validation
  _order_number := TRIM(_order_data->>'order_number');
  _delivery_fee := COALESCE((_order_data->>'delivery_fee')::NUMERIC, 0);

  IF _order_number IS NULL OR length(_order_number) < 1 OR length(_order_number) > 50 THEN
    RAISE EXCEPTION 'Invalid order number';
  END IF;
  IF _delivery_fee < 0 OR _delivery_fee > 1000 THEN
    RAISE EXCEPTION 'Invalid delivery fee';
  END IF;

  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Order must have at least one item';
  END IF;
  IF jsonb_array_length(_items) > 50 THEN
    RAISE EXCEPTION 'Too many items in order';
  END IF;

  -- Upsert customer
  SELECT id INTO _customer_id
  FROM public.customers
  WHERE LOWER(TRIM(email)) = LOWER(_email)
  LIMIT 1;

  IF _customer_id IS NULL THEN
    INSERT INTO public.customers (name, email, phone, user_id)
    VALUES (_name, _email, _phone, NULL)
    RETURNING id INTO _customer_id;
  END IF;

  -- Insert address
  INSERT INTO public.addresses (customer_id, street, city, postal_code, country)
  VALUES (_customer_id, _street, _city, _postal_code, _country)
  RETURNING id INTO _address_id;

  -- Validate items and compute subtotal using SERVER-SIDE prices
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _coffee_product_id := _item->>'coffee_product_id';
    _quantity := (_item->>'quantity')::INTEGER;

    IF _coffee_product_id IS NULL OR length(_coffee_product_id) = 0 THEN
      RAISE EXCEPTION 'Invalid coffee product ID';
    END IF;
    IF _quantity IS NULL OR _quantity < 1 OR _quantity > 100 THEN
      RAISE EXCEPTION 'Invalid item quantity';
    END IF;

    -- Look up the canonical server-side price; ignore any client supplied price
    SELECT price INTO _server_unit_price
    FROM public.coffee_products
    WHERE id = _coffee_product_id AND available = true;

    IF _server_unit_price IS NULL THEN
      RAISE EXCEPTION 'Coffee product not available: %', _coffee_product_id;
    END IF;

    _server_total_price := _server_unit_price * _quantity;
    _items_subtotal := _items_subtotal + _server_total_price;
  END LOOP;

  _total_amount := _items_subtotal + _delivery_fee;

  IF _total_amount <= 0 OR _total_amount > 10000 THEN
    RAISE EXCEPTION 'Invalid total amount';
  END IF;

  -- Insert order using server-computed total
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

  -- Insert items using server-side prices
  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _coffee_product_id := _item->>'coffee_product_id';
    _quantity := (_item->>'quantity')::INTEGER;

    SELECT price INTO _server_unit_price
    FROM public.coffee_products
    WHERE id = _coffee_product_id AND available = true;

    _server_total_price := _server_unit_price * _quantity;

    INSERT INTO public.order_items (order_id, coffee_product_id, quantity, unit_price, total_price)
    VALUES (_order_id, _coffee_product_id, _quantity, _server_unit_price, _server_total_price);
  END LOOP;

  RETURN _order_id;
END;
$function$;
