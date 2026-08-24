INSERT INTO public.coffee_products (id, name, description, price, available)
VALUES
  ('espresso', 'Espresso', 'Pure and concentrated coffee, the base for all other drinks.', 8.50, true),
  ('cappuccino', 'Cappuccino', 'Perfect balance of espresso, steamed milk and foam.', 9.50, true),
  ('latte', 'Latte', 'Smooth espresso with steamed milk and a delicate layer of foam.', 9.50, true),
  ('americano', 'Americano', 'Espresso lengthened with hot water for a smooth, full cup.', 8.50, true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    available = EXCLUDED.available;