-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create customers table
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create addresses table
CREATE TABLE addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    county VARCHAR(100),
    postcode VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'United Kingdom',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_within_delivery_zone BOOLEAN DEFAULT FALSE,
    distance_from_business DECIMAL(5, 2), -- in kilometers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coffee_products table
CREATE TABLE coffee_products (
    id VARCHAR(50) PRIMARY KEY, -- matches coffee IDs from frontend
    name_en VARCHAR(255) NOT NULL,
    name_pt VARCHAR(255) NOT NULL,
    description_en TEXT,
    description_pt TEXT,
    price DECIMAL(10, 2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    prep_time_minutes INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    delivery_address_id UUID REFERENCES addresses(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    special_instructions TEXT,
    estimated_delivery_time INTEGER, -- in minutes
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    coffee_product_id VARCHAR(50) REFERENCES coffee_products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_zones table
CREATE TABLE delivery_zones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    center_latitude DECIMAL(10, 8) NOT NULL,
    center_longitude DECIMAL(11, 8) NOT NULL,
    radius_km DECIMAL(5, 2) NOT NULL,
    base_delivery_fee DECIMAL(10, 2) NOT NULL,
    fee_per_km DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create business_settings table
CREATE TABLE business_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial coffee products
INSERT INTO coffee_products (id, name_en, name_pt, description_en, description_pt, price) VALUES
('espresso', 'Espresso', 'Espresso', 'Pure and concentrated coffee, the base for all other drinks.', 'O café mais puro e concentrado, base para todas as outras bebidas.', 8.50),
('cappuccino', 'Cappuccino', 'Cappuccino', 'Perfect balance of espresso, steamed milk and foam.', 'Equilíbrio perfeito entre espresso, leite vaporizado e espuma.', 9.50),
('latte', 'Latte', 'Latte', 'Smooth and creamy with silky steamed milk.', 'Suave e cremoso com leite vaporizado sedoso.', 9.00),
('americano', 'Americano', 'Americano', 'Espresso with hot water, clean and strong flavor.', 'Espresso com água quente, sabor limpo e forte.', 8.00);

-- Insert initial delivery zone (Market Harborough area)
INSERT INTO delivery_zones (name, center_latitude, center_longitude, radius_km, base_delivery_fee, fee_per_km) VALUES
('Market Harborough', 52.4673, -0.9533, 5.0, 3.00, 2.00);

-- Insert business settings
INSERT INTO business_settings (setting_key, setting_value, description) VALUES
('business_name', 'Brazilian Coffee Academy', 'Business name'),
('business_address', 'Main Street, 68 - Lubenham - Market Harborough - Leicestershire - England - LE16 9TG', 'Business address'),
('business_phone', '+44 7386797734', 'Business phone number'),
('business_email', 'franklinmarceloderreiradelima@gmail.com', 'Business email'),
('owner_name', 'Franklin Marcelo Ferreira de Lima', 'Business owner name'),
('delivery_radius_km', '5', 'Maximum delivery radius in kilometers'),
('min_delivery_time_minutes', '15', 'Minimum delivery time in minutes'),
('max_delivery_time_minutes', '45', 'Maximum delivery time in minutes'),
('order_number_prefix', 'BC', 'Prefix for order numbers');

-- Create indexes for better performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_addresses_customer_id ON addresses(customer_id);
CREATE INDEX idx_addresses_postcode ON addresses(postcode);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    next_number INTEGER;
    order_number TEXT;
BEGIN
    -- Get the prefix from business settings
    SELECT setting_value INTO prefix FROM business_settings WHERE setting_key = 'order_number_prefix';
    
    -- Get the next number (count of orders + 1)
    SELECT COUNT(*) + 1 INTO next_number FROM orders;
    
    -- Format the order number
    order_number := prefix || LPAD(next_number::TEXT, 6, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER trigger_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_coffee_products_updated_at BEFORE UPDATE ON coffee_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_delivery_zones_updated_at BEFORE UPDATE ON delivery_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_business_settings_updated_at BEFORE UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access to coffee_products" ON coffee_products FOR SELECT USING (true);
CREATE POLICY "Allow public read access to delivery_zones" ON delivery_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Allow public read access to business_settings" ON business_settings FOR SELECT USING (true);

-- Create policies for authenticated users (you may want to adjust these based on your auth setup)
CREATE POLICY "Users can insert their own customer data" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own customer data" ON customers FOR SELECT USING (true);
CREATE POLICY "Users can update their own customer data" ON customers FOR UPDATE USING (true);

CREATE POLICY "Users can insert addresses" ON addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view addresses" ON addresses FOR SELECT USING (true);
CREATE POLICY "Users can update addresses" ON addresses FOR UPDATE USING (true);

CREATE POLICY "Users can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Users can update orders" ON orders FOR UPDATE USING (true);

CREATE POLICY "Users can insert order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view order items" ON order_items FOR SELECT USING (true);
