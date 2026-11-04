CREATE TABLE public.store_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  delivery_base_fee numeric NOT NULL DEFAULT 3 CHECK (delivery_base_fee >= 0 AND delivery_base_fee <= 100),
  delivery_fee_per_km numeric NOT NULL DEFAULT 2 CHECK (delivery_fee_per_km >= 0 AND delivery_fee_per_km <= 50),
  min_order_amount numeric NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0 AND min_order_amount <= 1000),
  opening_hours jsonb NOT NULL DEFAULT '[
    {"open":true,"from":"08:00","to":"18:00"},
    {"open":true,"from":"08:00","to":"18:00"},
    {"open":true,"from":"08:00","to":"18:00"},
    {"open":true,"from":"08:00","to":"18:00"},
    {"open":true,"from":"08:00","to":"18:00"},
    {"open":true,"from":"08:00","to":"18:00"},
    {"open":true,"from":"09:00","to":"16:00"}
  ]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.store_settings.opening_hours IS 'Array of 7 days, Monday first, times in Europe/London';

GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store settings" ON public.store_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert store settings" ON public.store_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update store settings" ON public.store_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER store_settings_updated_at BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.store_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_store_open(_at timestamptz DEFAULT now())
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _local timestamp := _at AT TIME ZONE 'Europe/London';
  _day jsonb;
BEGIN
  SELECT opening_hours -> (EXTRACT(ISODOW FROM _local)::int - 1) INTO _day FROM public.store_settings WHERE id = true;
  IF _day IS NULL THEN RETURN true; END IF;
  IF NOT COALESCE((_day->>'open')::boolean, false) THEN RETURN false; END IF;
  RETURN _local::time >= (_day->>'from')::time AND _local::time < (_day->>'to')::time;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_guest_order(_customer_data jsonb, _address_data jsonb, _order_data jsonb, _items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _customer_id UUID; _address_id UUID; _order_id UUID;
  _name TEXT; _email TEXT; _phone TEXT; _street TEXT; _city TEXT; _postal_code TEXT; _country TEXT;
  _order_number TEXT; _delivery_fee NUMERIC := 0; _items_subtotal NUMERIC := 0; _total_amount NUMERIC;
  _item JSONB; _coffee_product_id TEXT; _quantity INTEGER; _server_unit_price NUMERIC; _server_total_price NUMERIC;
  _ref_code TEXT; _referrer TEXT; _discount NUMERIC := 0; _referral_discount NUMERIC := 0; _credit NUMERIC := 0;
  _settings public.store_settings%ROWTYPE;
BEGIN
  SELECT * INTO _settings FROM public.store_settings WHERE id = true;
  IF NOT public.is_store_open(now()) THEN RAISE EXCEPTION 'STORE_CLOSED: We are closed right now'; END IF;

  _name := TRIM(_customer_data->>'name'); _email := TRIM(_customer_data->>'email'); _phone := TRIM(_customer_data->>'phone');
  IF _name IS NULL OR length(_name) < 1 OR length(_name) > 100 THEN RAISE EXCEPTION 'Invalid customer name'; END IF;
  IF _email IS NULL OR _email !~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$' THEN RAISE EXCEPTION 'Invalid email address'; END IF;
  IF _phone IS NOT NULL AND length(_phone) > 30 THEN RAISE EXCEPTION 'Invalid phone number'; END IF;
  _street := TRIM(_address_data->>'street'); _city := TRIM(_address_data->>'city');
  _postal_code := TRIM(_address_data->>'postal_code'); _country := COALESCE(TRIM(_address_data->>'country'), 'UK');
  IF _street IS NULL OR length(_street) < 1 OR length(_street) > 200 THEN RAISE EXCEPTION 'Invalid street address'; END IF;
  IF _city IS NULL OR length(_city) < 1 OR length(_city) > 100 THEN RAISE EXCEPTION 'Invalid city'; END IF;
  IF _postal_code IS NULL OR length(_postal_code) < 1 OR length(_postal_code) > 20 THEN RAISE EXCEPTION 'Invalid postal code'; END IF;
  _order_number := TRIM(_order_data->>'order_number');
  _delivery_fee := COALESCE((_order_data->>'delivery_fee')::NUMERIC, 0);
  IF _order_number IS NULL OR length(_order_number) < 1 OR length(_order_number) > 50 THEN RAISE EXCEPTION 'Invalid order number'; END IF;
  IF _delivery_fee < 0 OR _delivery_fee > 1000 THEN RAISE EXCEPTION 'Invalid delivery fee'; END IF;
  IF _settings.id IS NOT NULL AND (_delivery_fee < _settings.delivery_base_fee - 0.01
     OR _delivery_fee > _settings.delivery_base_fee + _settings.delivery_fee_per_km * 5 + 0.01) THEN
    RAISE EXCEPTION 'FEE_OUTDATED: Delivery fee changed, please check your address again';
  END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'Order must have at least one item'; END IF;
  IF jsonb_array_length(_items) > 50 THEN RAISE EXCEPTION 'Too many items in order'; END IF;

  SELECT id INTO _customer_id FROM public.customers WHERE LOWER(TRIM(email)) = LOWER(_email) LIMIT 1;

  -- Referral: valid only for a brand-new customer (no previous orders, not already referred, not own code)
  _ref_code := UPPER(TRIM(COALESCE(_order_data->>'referral_code', '')));
  IF _ref_code <> '' THEN
    SELECT owner_email INTO _referrer FROM referral_codes WHERE code = _ref_code;
    IF _referrer IS NULL THEN RAISE EXCEPTION 'Invalid referral code'; END IF;
    IF _referrer = LOWER(_email) THEN RAISE EXCEPTION 'You cannot use your own referral code'; END IF;
    IF EXISTS (SELECT 1 FROM referrals WHERE referred_email = LOWER(_email))
       OR (_customer_id IS NOT NULL AND EXISTS (SELECT 1 FROM orders WHERE customer_id = _customer_id)) THEN
      RAISE EXCEPTION 'Referral discount is only for new customers';
    END IF;
  END IF;

  -- Validate items and minimum order before writing anything
  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _coffee_product_id := _item->>'coffee_product_id'; _quantity := (_item->>'quantity')::INTEGER;
    IF _coffee_product_id IS NULL OR length(_coffee_product_id) = 0 THEN RAISE EXCEPTION 'Invalid coffee product ID'; END IF;
    IF _quantity IS NULL OR _quantity < 1 OR _quantity > 100 THEN RAISE EXCEPTION 'Invalid item quantity'; END IF;
    SELECT price INTO _server_unit_price FROM public.coffee_products WHERE id = _coffee_product_id AND available = true;
    IF _server_unit_price IS NULL THEN RAISE EXCEPTION 'Coffee product not available: %', _coffee_product_id; END IF;
    _items_subtotal := _items_subtotal + _server_unit_price * _quantity;
  END LOOP;
  IF _settings.id IS NOT NULL AND _items_subtotal < _settings.min_order_amount THEN
    RAISE EXCEPTION 'MIN_ORDER: Minimum order is £%', to_char(_settings.min_order_amount, 'FM999990.00');
  END IF;

  IF _customer_id IS NULL THEN
    INSERT INTO public.customers (name, email, phone, user_id) VALUES (_name, _email, _phone, NULL) RETURNING id INTO _customer_id;
  END IF;
  INSERT INTO public.addresses (customer_id, street, city, postal_code, country)
  VALUES (_customer_id, _street, _city, _postal_code, _country) RETURNING id INTO _address_id;

  -- New customer: 10% off items. Referrer: unused £3 credits apply to items.
  IF _referrer IS NOT NULL THEN _referral_discount := round(_items_subtotal * 0.10, 2); END IF;
  SELECT COALESCE(SUM(reward_amount),0) INTO _credit FROM referrals WHERE referrer_email = LOWER(_email) AND reward_used_order_id IS NULL;
  _credit := LEAST(_credit, _items_subtotal - _referral_discount);
  _discount := _referral_discount + _credit;

  _total_amount := _items_subtotal - _discount + _delivery_fee;
  IF _total_amount < 0 OR _total_amount > 10000 OR _items_subtotal <= 0 THEN RAISE EXCEPTION 'Invalid total amount'; END IF;

  INSERT INTO public.orders (customer_id, address_id, order_number, total_amount, discount_amount, delivery_instructions, status)
  VALUES (_customer_id, _address_id, _order_number, _total_amount, _discount, NULLIF(TRIM(_order_data->>'delivery_instructions'),''), 'pending')
  RETURNING id INTO _order_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _coffee_product_id := _item->>'coffee_product_id'; _quantity := (_item->>'quantity')::INTEGER;
    SELECT price INTO _server_unit_price FROM public.coffee_products WHERE id = _coffee_product_id AND available = true;
    INSERT INTO public.order_items (order_id, coffee_product_id, quantity, unit_price, total_price)
    VALUES (_order_id, _coffee_product_id, _quantity, _server_unit_price, _server_unit_price * _quantity);
  END LOOP;

  IF _credit > 0 THEN
    UPDATE referrals SET reward_used_order_id = _order_id WHERE referrer_email = LOWER(_email) AND reward_used_order_id IS NULL;
  END IF;
  IF _referrer IS NOT NULL THEN
    INSERT INTO referrals (code, referrer_email, referred_email, order_id, discount_amount, reward_amount)
    VALUES (_ref_code, _referrer, LOWER(_email), _order_id, _referral_discount, 3);
  END IF;
  RETURN _order_id;
END;
$function$;