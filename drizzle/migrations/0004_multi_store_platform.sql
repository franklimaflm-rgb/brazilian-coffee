CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#7c4a2d',
  whatsapp text,
  address text,
  delivery_fee numeric NOT NULL DEFAULT 3,
  min_order_amount numeric NOT NULL DEFAULT 0,
  opening_hours jsonb NOT NULL DEFAULT '[{"to":"18:00","from":"08:00","open":true},{"to":"18:00","from":"08:00","open":true},{"to":"18:00","from":"08:00","open":true},{"to":"18:00","from":"08:00","open":true},{"to":"18:00","from":"08:00","open":true},{"to":"18:00","from":"08:00","open":true},{"to":"16:00","from":"09:00","open":true}]'::jsonb,
  timezone text NOT NULL DEFAULT 'Europe/London',
  owner_id uuid,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stores TO anon;
GRANT SELECT, UPDATE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

INSERT INTO public.stores (id, slug, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'brazilian-coffee', 'Brazilian Coffee Academy', 'Café brasileiro entregue na sua porta')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_store_owner(_store_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = auth.uid() AND auth.uid() IS NOT NULL)
$$;

CREATE POLICY "Anyone can view active stores" ON public.stores FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Owners view own store" ON public.stores FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Admins view all stores" ON public.stores FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners update own store" ON public.stores FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins update all stores" ON public.stores FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.validate_store()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.slug !~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])$' THEN RAISE EXCEPTION 'Invalid store link'; END IF;
  IF length(trim(NEW.name)) < 2 OR length(NEW.name) > 80 THEN RAISE EXCEPTION 'Invalid store name'; END IF;
  IF NEW.description IS NOT NULL AND length(NEW.description) > 500 THEN RAISE EXCEPTION 'Description too long'; END IF;
  IF NEW.whatsapp IS NOT NULL AND length(NEW.whatsapp) > 30 THEN RAISE EXCEPTION 'Invalid WhatsApp'; END IF;
  IF NEW.address IS NOT NULL AND length(NEW.address) > 200 THEN RAISE EXCEPTION 'Address too long'; END IF;
  IF NEW.primary_color !~ '^#[0-9a-fA-F]{6}$' THEN RAISE EXCEPTION 'Invalid color'; END IF;
  IF NEW.delivery_fee < 0 OR NEW.delivery_fee > 100 OR NEW.min_order_amount < 0 OR NEW.min_order_amount > 1000 THEN RAISE EXCEPTION 'Invalid fees'; END IF;
  IF jsonb_typeof(NEW.opening_hours) <> 'array' OR jsonb_array_length(NEW.opening_hours) <> 7 THEN RAISE EXCEPTION 'Invalid opening hours'; END IF;
  IF TG_OP = 'UPDATE' AND NOT public.has_role(auth.uid(), 'admin') AND auth.uid() IS NOT NULL THEN
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.active IS DISTINCT FROM OLD.active OR NEW.slug <> OLD.slug THEN
      RAISE EXCEPTION 'Not allowed to change this field';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER stores_validate BEFORE INSERT OR UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.validate_store();

ALTER TABLE public.coffee_products ADD COLUMN store_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.stores(id);
ALTER TABLE public.orders ADD COLUMN store_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.stores(id);
ALTER TABLE public.customers ADD COLUMN store_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.stores(id);
CREATE INDEX coffee_products_store_idx ON public.coffee_products(store_id);
CREATE INDEX orders_store_idx ON public.orders(store_id);
CREATE INDEX customers_store_idx ON public.customers(store_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coffee_products TO authenticated;
CREATE POLICY "Owners view own products" ON public.coffee_products FOR SELECT TO authenticated USING (public.is_store_owner(store_id));
CREATE POLICY "Owners insert own products" ON public.coffee_products FOR INSERT TO authenticated WITH CHECK (public.is_store_owner(store_id));
CREATE POLICY "Owners update own products" ON public.coffee_products FOR UPDATE TO authenticated USING (public.is_store_owner(store_id)) WITH CHECK (public.is_store_owner(store_id));
CREATE POLICY "Owners delete own products" ON public.coffee_products FOR DELETE TO authenticated USING (public.is_store_owner(store_id));
CREATE POLICY "Owners view own orders" ON public.orders FOR SELECT TO authenticated USING (public.is_store_owner(store_id));
CREATE POLICY "Owners update own orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_store_owner(store_id)) WITH CHECK (public.is_store_owner(store_id));
CREATE POLICY "Owners view own order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND public.is_store_owner(o.store_id)));
CREATE POLICY "Owners view own customers" ON public.customers FOR SELECT TO authenticated USING (public.is_store_owner(store_id));
CREATE POLICY "Owners view own addresses" ON public.addresses FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.customers c WHERE c.id = addresses.customer_id AND public.is_store_owner(c.store_id)));

CREATE OR REPLACE FUNCTION public.create_store(_name text, _slug text, _whatsapp text, _address text, _color text, _description text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF (SELECT count(*) FROM stores WHERE owner_id = auth.uid()) >= 3 THEN RAISE EXCEPTION 'Store limit reached'; END IF;
  IF EXISTS (SELECT 1 FROM stores WHERE slug = lower(trim(_slug))) THEN RAISE EXCEPTION 'SLUG_TAKEN'; END IF;
  INSERT INTO stores (name, slug, whatsapp, address, primary_color, description, owner_id)
  VALUES (trim(_name), lower(trim(_slug)), NULLIF(trim(_whatsapp),''), NULLIF(trim(_address),''), COALESCE(NULLIF(_color,''),'#7c4a2d'), NULLIF(trim(_description),''), auth.uid())
  RETURNING id INTO _id;
  RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.create_store(text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_store(text,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.store_is_open(_store_id uuid, _at timestamptz DEFAULT now())
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _s stores%ROWTYPE; _local timestamp; _day jsonb;
BEGIN
  SELECT * INTO _s FROM stores WHERE id = _store_id;
  IF _s.id IS NULL THEN RETURN false; END IF;
  _local := _at AT TIME ZONE _s.timezone;
  _day := _s.opening_hours -> (EXTRACT(ISODOW FROM _local)::int - 1);
  IF _day IS NULL OR NOT COALESCE((_day->>'open')::boolean, false) THEN RETURN false; END IF;
  RETURN _local::time >= (_day->>'from')::time AND _local::time < (_day->>'to')::time;
END $$;

CREATE OR REPLACE FUNCTION public.create_store_order(_store_id uuid, _customer jsonb, _address jsonb, _items jsonb, _instructions text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _s stores%ROWTYPE; _name text; _email text; _phone text; _street text; _city text; _pc text;
  _cid uuid; _aid uuid; _oid uuid; _num text; _sub numeric := 0; _item jsonb; _pid text; _q int; _price numeric;
BEGIN
  SELECT * INTO _s FROM stores WHERE id = _store_id AND active = true;
  IF _s.id IS NULL THEN RAISE EXCEPTION 'Store not found'; END IF;
  IF NOT public.store_is_open(_store_id, now()) THEN RAISE EXCEPTION 'STORE_CLOSED: We are closed right now'; END IF;
  _name := trim(_customer->>'name'); _email := lower(trim(_customer->>'email')); _phone := trim(_customer->>'phone');
  IF _name IS NULL OR length(_name) < 1 OR length(_name) > 100 THEN RAISE EXCEPTION 'Invalid customer name'; END IF;
  IF _email IS NULL OR _email !~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$' THEN RAISE EXCEPTION 'Invalid email address'; END IF;
  IF _phone IS NOT NULL AND length(_phone) > 30 THEN RAISE EXCEPTION 'Invalid phone number'; END IF;
  _street := trim(_address->>'street'); _city := trim(_address->>'city'); _pc := trim(_address->>'postal_code');
  IF _street IS NULL OR length(_street) < 1 OR length(_street) > 200 THEN RAISE EXCEPTION 'Invalid street address'; END IF;
  IF _city IS NULL OR length(_city) < 1 OR length(_city) > 100 THEN RAISE EXCEPTION 'Invalid city'; END IF;
  IF _pc IS NULL OR length(_pc) < 1 OR length(_pc) > 20 THEN RAISE EXCEPTION 'Invalid postal code'; END IF;
  IF _instructions IS NOT NULL AND length(_instructions) > 500 THEN RAISE EXCEPTION 'Instructions too long'; END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 50 THEN RAISE EXCEPTION 'Invalid items'; END IF;
  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _pid := _item->>'coffee_product_id'; _q := (_item->>'quantity')::int;
    IF _q IS NULL OR _q < 1 OR _q > 100 THEN RAISE EXCEPTION 'Invalid item quantity'; END IF;
    SELECT price INTO _price FROM coffee_products WHERE id = _pid AND store_id = _store_id AND available = true;
    IF _price IS NULL THEN RAISE EXCEPTION 'Product not available'; END IF;
    _sub := _sub + _price * _q;
  END LOOP;
  IF _sub < _s.min_order_amount THEN RAISE EXCEPTION 'MIN_ORDER: Minimum order is %', to_char(_s.min_order_amount, 'FM999990.00'); END IF;

  SELECT id INTO _cid FROM customers WHERE store_id = _store_id AND lower(trim(email)) = _email LIMIT 1;
  IF _cid IS NULL THEN
    INSERT INTO customers (name, email, phone, store_id) VALUES (_name, _email, _phone, _store_id) RETURNING id INTO _cid;
  END IF;
  INSERT INTO addresses (customer_id, street, city, postal_code) VALUES (_cid, _street, _city, _pc) RETURNING id INTO _aid;
  LOOP
    _num := 'P' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 7));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = _num);
  END LOOP;
  INSERT INTO orders (customer_id, address_id, order_number, total_amount, delivery_instructions, status, store_id)
  VALUES (_cid, _aid, _num, _sub + _s.delivery_fee, NULLIF(trim(_instructions),''), 'pending', _store_id) RETURNING id INTO _oid;
  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _pid := _item->>'coffee_product_id'; _q := (_item->>'quantity')::int;
    SELECT price INTO _price FROM coffee_products WHERE id = _pid AND store_id = _store_id;
    INSERT INTO order_items (order_id, coffee_product_id, quantity, unit_price, total_price) VALUES (_oid, _pid, _q, _price, _price * _q);
  END LOOP;
  RETURN _num;
END $$;
GRANT EXECUTE ON FUNCTION public.create_store_order(uuid,jsonb,jsonb,jsonb,text) TO anon, authenticated;

CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cafe_name text,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT SELECT ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send a contact message" ON public.contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) BETWEEN 1 AND 100 AND length(email) BETWEEN 3 AND 255 AND length(message) BETWEEN 1 AND 2000
    AND (cafe_name IS NULL OR length(cafe_name) <= 100) AND (phone IS NULL OR length(phone) <= 30));
CREATE POLICY "Admins read contact messages" ON public.contact_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners upload store assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-assets' AND public.is_store_owner(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Owners update store assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-assets' AND public.is_store_owner(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Owners delete store assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-assets' AND public.is_store_owner(((storage.foldername(name))[1])::uuid));