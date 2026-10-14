ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;

CREATE TABLE public.referral_codes (
  code text PRIMARY KEY,
  owner_email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view referral codes" ON public.referral_codes FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL REFERENCES public.referral_codes(code),
  referrer_email text NOT NULL,
  referred_email text NOT NULL UNIQUE,
  order_id uuid REFERENCES public.orders(id),
  discount_amount numeric NOT NULL DEFAULT 0,
  reward_amount numeric NOT NULL DEFAULT 0,
  reward_used_order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view referrals" ON public.referrals FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.get_or_create_referral_code(_email text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _e text := LOWER(TRIM(_email)); _c text;
BEGIN
  IF _e IS NULL OR _e !~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email address';
  END IF;
  SELECT code INTO _c FROM referral_codes WHERE owner_email = _e;
  IF _c IS NOT NULL THEN RETURN _c; END IF;
  LOOP
    _c := 'CAFE' || upper(substr(md5(random()::text || _e), 1, 5));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM referral_codes WHERE code = _c);
  END LOOP;
  INSERT INTO referral_codes(code, owner_email) VALUES (_c, _e);
  RETURN _c;
END $$;

CREATE OR REPLACE FUNCTION public.get_referral_stats(_code text)
RETURNS TABLE(referrals_count integer, rewards_available numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COUNT(*)::int, COALESCE(SUM(reward_amount) FILTER (WHERE reward_used_order_id IS NULL),0)
  FROM referrals WHERE code = UPPER(TRIM(_code));
$$;

CREATE OR REPLACE FUNCTION public.check_referral_code(_code text, _email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM referral_codes rc WHERE rc.code = UPPER(TRIM(_code))
    AND rc.owner_email <> LOWER(TRIM(COALESCE(_email,''))))
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_referral_code(text), public.get_referral_stats(text), public.check_referral_code(text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_guest_order(_customer_data jsonb, _address_data jsonb, _order_data jsonb, _items jsonb)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  _customer_id UUID; _address_id UUID; _order_id UUID;
  _name TEXT; _email TEXT; _phone TEXT; _street TEXT; _city TEXT; _postal_code TEXT; _country TEXT;
  _order_number TEXT; _delivery_fee NUMERIC := 0; _items_subtotal NUMERIC := 0; _total_amount NUMERIC;
  _item JSONB; _coffee_product_id TEXT; _quantity INTEGER; _server_unit_price NUMERIC; _server_total_price NUMERIC;
  _ref_code TEXT; _referrer TEXT; _discount NUMERIC := 0; _referral_discount NUMERIC := 0; _credit NUMERIC := 0;
BEGIN
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

  IF _customer_id IS NULL THEN
    INSERT INTO public.customers (name, email, phone, user_id) VALUES (_name, _email, _phone, NULL) RETURNING id INTO _customer_id;
  END IF;
  INSERT INTO public.addresses (customer_id, street, city, postal_code, country)
  VALUES (_customer_id, _street, _city, _postal_code, _country) RETURNING id INTO _address_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _coffee_product_id := _item->>'coffee_product_id'; _quantity := (_item->>'quantity')::INTEGER;
    IF _coffee_product_id IS NULL OR length(_coffee_product_id) = 0 THEN RAISE EXCEPTION 'Invalid coffee product ID'; END IF;
    IF _quantity IS NULL OR _quantity < 1 OR _quantity > 100 THEN RAISE EXCEPTION 'Invalid item quantity'; END IF;
    SELECT price INTO _server_unit_price FROM public.coffee_products WHERE id = _coffee_product_id AND available = true;
    IF _server_unit_price IS NULL THEN RAISE EXCEPTION 'Coffee product not available: %', _coffee_product_id; END IF;
    _items_subtotal := _items_subtotal + _server_unit_price * _quantity;
  END LOOP;

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