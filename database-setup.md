# Database Setup Guide - Brazilian Coffee Academy

## 🚨 **Critical Issue Identified**
The Supabase database tables are missing, causing 404 errors when the application tries to access:
- `coffee_products` table
- `delivery_zones` table
- `orders`, `customers`, `addresses` tables

## 🔧 **Step-by-Step Database Setup**

### **Step 1: Access Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Navigate to your project: `eticmvmetfpijbavteel`
4. Use the database password: `D52zVnfYSRrX//@`

### **Step 2: Execute Database Migration**
1. In the Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the entire content from `supabase/migrations/001_initial_schema.sql`
4. Click **Run** to execute the migration

### **Step 3: Verify Tables Creation**
After running the migration, verify these tables exist:
- ✅ `customers`
- ✅ `addresses` 
- ✅ `coffee_products`
- ✅ `orders`
- ✅ `order_items`
- ✅ `delivery_zones`
- ✅ `business_settings`

### **Step 4: Check Initial Data**
Verify that initial data was inserted:

#### **Coffee Products** (should have 4 entries):
```sql
SELECT * FROM coffee_products;
```
Expected results:
- espresso
- cappuccino  
- latte
- americano

#### **Delivery Zones** (should have 1 entry):
```sql
SELECT * FROM delivery_zones;
```
Expected: Market Harborough zone with coordinates (52.4673, -0.9533)

#### **Business Settings** (should have multiple entries):
```sql
SELECT * FROM business_settings;
```

### **Step 5: Test Database Connection**
Run this test query to verify connectivity:
```sql
-- Test query to verify all tables and data
SELECT 
  'coffee_products' as table_name, 
  COUNT(*) as record_count 
FROM coffee_products
UNION ALL
SELECT 
  'delivery_zones' as table_name, 
  COUNT(*) as record_count 
FROM delivery_zones
UNION ALL
SELECT 
  'business_settings' as table_name, 
  COUNT(*) as record_count 
FROM business_settings;
```

Expected results:
- coffee_products: 4 records
- delivery_zones: 1 record  
- business_settings: 8+ records

## 🔐 **Row Level Security (RLS) Configuration**

The migration includes RLS policies, but verify they're active:

### **Check RLS Status:**
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'addresses', 'orders', 'order_items');
```

### **Verify Policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public';
```

## 🧪 **Test Application Connectivity**

After setting up the database, test these endpoints:

### **1. Coffee Products API Test:**
```
GET https://eticmvmetfpijbavteel.supabase.co/rest/v1/coffee_products
Headers:
- apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aWNtdm1ldGZwaWpiYXZ0ZWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDI2OTQsImV4cCI6MjA3MDc3ODY5NH0.h6Isaa4WG-Yi8fgonQqj3czuFzGOju0AUs3QYOX_JOU
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aWNtdm1ldGZwaWpiYXZ0ZWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDI2OTQsImV4cCI6MjA3MDc3ODY5NH0.h6Isaa4WG-Yi8fgonQqj3czuFzGOju0AUs3QYOX_JOU
```

### **2. Delivery Zones API Test:**
```
GET https://eticmvmetfpijbavteel.supabase.co/rest/v1/delivery_zones
Headers: (same as above)
```

## 🚀 **Application Testing After Database Setup**

Once the database is properly set up, test these features:

### **1. Delivery Page:**
- Visit: `https://brazilian-coffee.lovable.app/delivery?coffee=espresso`
- Coffee dropdown should populate with 4 options
- Address validation should work

### **2. Admin Panel:**
- Visit: `https://brazilian-coffee.lovable.app/admin`
- Login with: `franklinmarceloderreiradelima@gmail.com` / `admin123`
- Dashboard should load without errors

### **3. Order Flow:**
- Menu → Delivery → Order submission should work end-to-end

## 🔍 **Troubleshooting**

### **If Tables Still Don't Exist:**
1. Check if migration ran successfully (no SQL errors)
2. Verify you're in the correct Supabase project
3. Check database permissions

### **If RLS Blocks Access:**
1. Verify RLS policies are correctly configured
2. Check that anon key has proper permissions
3. Test with service role key if needed (temporarily)

### **If Data Is Missing:**
1. Re-run the INSERT statements from the migration
2. Check for constraint violations
3. Verify data types match schema

## 📞 **Support Information**

**Business Owner:** Franklin Marcelo Ferreira de Lima
**Email:** franklinmarceloderreiradelima@gmail.com  
**Phone:** +44 7386797734
**Address:** Main Street, 68 - Lubenham - Market Harborough - LE16 9TG

---

**Next Steps:** After completing the database setup, the Brazilian Coffee Academy delivery system should be fully functional with order management, admin panel, and Mapbox integration working properly.
