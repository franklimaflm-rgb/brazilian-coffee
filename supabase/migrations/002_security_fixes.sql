-- =====================================================
-- CRITICAL SECURITY FIXES FOR BRAZILIAN COFFEE ACADEMY
-- =====================================================
-- This migration addresses all critical security vulnerabilities
-- identified in the security review.

-- =====================================================
-- 1. DROP INSECURE POLICIES
-- =====================================================

-- Drop all existing insecure policies that allow public access to sensitive data
DROP POLICY IF EXISTS "Allow read addresses" ON addresses;
DROP POLICY IF EXISTS "Allow insert for addresses" ON addresses;
DROP POLICY IF EXISTS "Allow read orders" ON orders;
DROP POLICY IF EXISTS "Allow insert for orders" ON orders;
DROP POLICY IF EXISTS "Allow update orders" ON orders;
DROP POLICY IF EXISTS "Allow read order_items" ON order_items;
DROP POLICY IF EXISTS "Allow insert for order_items" ON order_items;
DROP POLICY IF EXISTS "Allow insert for customers" ON customers;
DROP POLICY IF EXISTS "Allow read own customer data" ON customers;

-- =====================================================
-- 2. CREATE SECURE CUSTOMER POLICIES
-- =====================================================

-- Customers can only view and update their own data
CREATE POLICY "customers_select_own" ON customers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "customers_insert_own" ON customers
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "customers_update_own" ON customers
    FOR UPDATE USING (auth.uid() = id);

-- Admin access for Franklin's order management
CREATE POLICY "customers_admin_access" ON customers
    FOR ALL USING (
        auth.jwt() ->> 'email' = 'franklinmarceloderreiradelima@gmail.com'
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- 3. CREATE SECURE ADDRESS POLICIES
-- =====================================================

-- Customers can only access their own addresses
CREATE POLICY "addresses_select_own" ON addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE customers.id = addresses.customer_id 
            AND customers.id = auth.uid()
        )
    );

CREATE POLICY "addresses_insert_own" ON addresses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE customers.id = addresses.customer_id 
            AND customers.id = auth.uid()
        )
    );

CREATE POLICY "addresses_update_own" ON addresses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE customers.id = addresses.customer_id 
            AND customers.id = auth.uid()
        )
    );

-- Admin access for Franklin's order management
CREATE POLICY "addresses_admin_access" ON addresses
    FOR ALL USING (
        auth.jwt() ->> 'email' = 'franklinmarceloderreiradelima@gmail.com'
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- 4. CREATE SECURE ORDER POLICIES
-- =====================================================

-- Customers can only access their own orders
CREATE POLICY "orders_select_own" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE customers.id = orders.customer_id 
            AND customers.id = auth.uid()
        )
    );

CREATE POLICY "orders_insert_own" ON orders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM customers 
            WHERE customers.id = orders.customer_id 
            AND customers.id = auth.uid()
        )
    );

-- Only admin can update order status
CREATE POLICY "orders_admin_update" ON orders
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'franklinmarceloderreiradelima@gmail.com'
        OR auth.role() = 'service_role'
    );

-- Admin access for Franklin's order management
CREATE POLICY "orders_admin_access" ON orders
    FOR ALL USING (
        auth.jwt() ->> 'email' = 'franklinmarceloderreiradelima@gmail.com'
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- 5. CREATE SECURE ORDER ITEMS POLICIES
-- =====================================================

-- Customers can only access their own order items
CREATE POLICY "order_items_select_own" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN customers ON customers.id = orders.customer_id
            WHERE orders.id = order_items.order_id 
            AND customers.id = auth.uid()
        )
    );

CREATE POLICY "order_items_insert_own" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN customers ON customers.id = orders.customer_id
            WHERE orders.id = order_items.order_id 
            AND customers.id = auth.uid()
        )
    );

-- Admin access for Franklin's order management
CREATE POLICY "order_items_admin_access" ON order_items
    FOR ALL USING (
        auth.jwt() ->> 'email' = 'franklinmarceloderreiradelima@gmail.com'
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- 6. SECURE BUSINESS SETTINGS
-- =====================================================

-- Create separate table for public business information
CREATE TABLE IF NOT EXISTS public_business_info (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    business_name VARCHAR(255),
    business_address TEXT,
    delivery_radius_km INTEGER,
    min_delivery_time_minutes INTEGER,
    max_delivery_time_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert public business information (without sensitive contact details)
INSERT INTO public_business_info (
    business_name, 
    business_address, 
    delivery_radius_km, 
    min_delivery_time_minutes, 
    max_delivery_time_minutes
) VALUES (
    'Brazilian Coffee Academy',
    'Main Street, 68 - Lubenham - Market Harborough - Leicestershire - England - LE16 9TG',
    5,
    15,
    45
) ON CONFLICT DO NOTHING;

-- Allow public read access to non-sensitive business info
ALTER TABLE public_business_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_business_info_read" ON public_business_info
    FOR SELECT USING (true);

-- Restrict business_settings to admin only
DROP POLICY IF EXISTS "Allow public read access to business_settings" ON business_settings;
CREATE POLICY "business_settings_admin_only" ON business_settings
    FOR ALL USING (
        auth.jwt() ->> 'email' = 'franklinmarceloderreiradelima@gmail.com'
        OR auth.role() = 'service_role'
    );

-- =====================================================
-- 7. CREATE ADMIN AUTHENTICATION FUNCTION
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'email' = 'franklinmarceloderreiradelima@gmail.com'
        OR auth.role() = 'service_role'
    );
END;
$$;

-- =====================================================
-- 8. CREATE CUSTOMER LOOKUP FUNCTION
-- =====================================================

-- Function to get customer ID by email (for order creation)
CREATE OR REPLACE FUNCTION get_customer_id_by_email(customer_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    customer_id UUID;
BEGIN
    SELECT id INTO customer_id 
    FROM customers 
    WHERE email = customer_email;
    
    RETURN customer_id;
END;
$$;

-- =====================================================
-- 9. UPDATE TRIGGERS FOR SECURITY
-- =====================================================

-- Create trigger for public_business_info updated_at
CREATE TRIGGER trigger_public_business_info_updated_at 
    BEFORE UPDATE ON public_business_info 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. GRANT APPROPRIATE PERMISSIONS
-- =====================================================

-- Grant necessary permissions for authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public_business_info TO authenticated, anon;
GRANT SELECT ON coffee_products TO authenticated, anon;
GRANT SELECT ON delivery_zones TO authenticated, anon;

-- Grant permissions for customer operations
GRANT SELECT, INSERT, UPDATE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON addresses TO authenticated;
GRANT SELECT, INSERT ON orders TO authenticated;
GRANT SELECT, INSERT ON order_items TO authenticated;

-- Grant admin permissions for order management
GRANT UPDATE ON orders TO authenticated;

-- =====================================================
-- 11. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Add indexes for security-related queries
CREATE INDEX IF NOT EXISTS idx_customers_auth_uid ON customers(id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_auth ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_customer_auth ON addresses(customer_id);

-- =====================================================
-- SECURITY MIGRATION COMPLETE
-- =====================================================

-- This migration addresses:
-- ✅ Customer address data exposure (CRITICAL)
-- ✅ Customer order history exposure (CRITICAL) 
-- ✅ Detailed purchase data exposure (CRITICAL)
-- ✅ Row Level Security implementation (CRITICAL)
-- ✅ Business owner personal information exposure
-- ✅ Function search path security
-- ✅ Proper admin access for Franklin's order management
-- ✅ Maintains application functionality while securing data
