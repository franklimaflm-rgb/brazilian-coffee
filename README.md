# Brazilian Coffee Academy

Welcome to Brazilian Coffee Academy - a professional coffee delivery service with educational content, built with modern web technologies and transformed from an educational platform into a complete delivery business solution.

**Live Demo**: https://brazilian-coffee.lovable.app/
**Lovable Project**: https://lovable.dev/projects/8bd35a72-9db6-4b92-ac9e-37376778c694

## 🚀 **Complete Delivery Platform Features**

### ☕ **Coffee Ordering System**
- **Menu-to-Delivery Flow**: Direct ordering from coffee cards with pre-populated delivery forms
- **4 Coffee Options**: Espresso (£8.50), Cappuccino (£9.50), Latte (£9.00), Americano (£8.00)
- **Real-time Order Processing**: Complete order management from selection to delivery
- **Order Tracking**: Unique order numbers (BC000001, BC000002, etc.) with status tracking

### 🗺️ **Advanced Mapping & Delivery**
- **Mapbox Satellite Integration**: High-resolution aerial view of delivery area
- **Precise Location**: Main Street, 68, Lubenham coordinates (52.4673, -0.9533)
- **5km Delivery Radius**: Interactive visualization covering Market Harborough area
- **Address Validation**: Real-time validation with distance calculation and delivery fees
- **Dynamic Pricing**: £3-13 delivery fees based on distance (15-25 minute delivery times)

### 👨‍💼 **Professional Admin Panel**
- **Real-time Dashboard**: Live order monitoring with comprehensive statistics
- **Order Management**: 6-stage status tracking (pending → confirmed → preparing → out for delivery → delivered → cancelled)
- **Customer Communication**: Complete contact information and delivery details
- **Revenue Tracking**: Built-in financial analytics and order statistics
- **Secure Authentication**: Protected access for business owner (Franklin)

### 📱 QR Code Integration
- **Multiple Formats**: Generate QR codes in PNG, SVG, and PDF formats
- **Physical Menu Support**: Downloadable QR codes for menus, delivery stickers, and social media
- **Direct Links**: QR codes linking to the delivery system

### 🌍 Internationalization
- **Language Selector**: Toggle between Portuguese and English with flag icons
- **Persistent Preferences**: Language choice saved in localStorage
- **Complete Translation**: All content including coffee names, descriptions, and interface elements

### 🗄️ Database Integration
- **Supabase Backend**: Complete database schema for orders, customers, and delivery management
- **Real-time Updates**: Live order tracking and status updates via Supabase subscriptions
- **Secure Authentication**: Row-level security policies for data protection
- **Auto-generated Order Numbers**: BC000001, BC000002, etc. with proper sequencing

## 🚨 **CRITICAL: Database Setup Required**

**⚠️ IMPORTANT**: The application requires database setup to function properly. If you're experiencing 404 errors or empty coffee selections, follow these steps:

### **Quick Database Setup**
1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to project**: `eticmvmetfpijbavteel`
3. **Use password**: `D52zVnfYSRrX//@`
4. **Open SQL Editor** and execute the migration from `supabase/migrations/001_initial_schema.sql`
5. **Verify tables created**: coffee_products, delivery_zones, orders, customers, addresses, order_items, business_settings

### **Expected Database Content After Setup**
- ✅ **4 Coffee Products**: Espresso, Cappuccino, Latte, Americano with pricing
- ✅ **1 Delivery Zone**: Market Harborough (5km radius from Lubenham coordinates)
- ✅ **Business Settings**: Contact information and operational parameters
- ✅ **RLS Policies**: Proper security configuration for data access

### **Test Database Connection**
After setup, verify these endpoints work:
- `https://eticmvmetfpijbavteel.supabase.co/rest/v1/coffee_products` (should return 4 coffees)
- `https://eticmvmetfpijbavteel.supabase.co/rest/v1/delivery_zones` (should return Market Harborough zone)

### **Browser Console Test**
Open browser console on https://brazilian-coffee.lovable.app/ and run:
```javascript
// Test coffee products
fetch('https://eticmvmetfpijbavteel.supabase.co/rest/v1/coffee_products', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aWNtdm1ldGZwaWpiYXZ0ZWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDI2OTQsImV4cCI6MjA3MDc3ODY5NH0.h6Isaa4WG-Yi8fgonQqj3czuFzGOju0AUs3QYOX_JOU'
  }
}).then(r => r.json()).then(console.log).catch(console.error);
```

## Business Information

**Owner**: Franklin Marcelo Ferreira de Lima
**Email**: franklinmarceloderreiradelima@gmail.com
**Phone**: +44 7386797734
**Address**: Main Street, 68 - Lubenham - Market Harborough - Leicestershire - England - LE16 9TG
**Delivery Area**: 5km radius covering Market Harborough, Lubenham, Great Bowden, Little Bowden, and surrounding villages

## 🔧 **Troubleshooting Common Issues**

### **Issue: Coffee dropdown is empty on delivery page**
- **Cause**: `coffee_products` table doesn't exist in database
- **Solution**: Run the database migration in Supabase SQL Editor

### **Issue: Address validation not working**
- **Cause**: `delivery_zones` table missing or empty
- **Solution**: Ensure migration created Market Harborough delivery zone

### **Issue: Admin panel shows no orders**
- **Cause**: Database tables not created or RLS policies blocking access
- **Solution**: Verify all tables exist and RLS policies are properly configured

### **Issue: 404 errors on API calls**
- **Cause**: Database tables don't exist
- **Solution**: Execute complete migration script in Supabase

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL with PostGIS extension)
- **Maps**: Mapbox GL JS with satellite view for delivery zone visualization
- **QR Codes**: qrcode library with PDF generation (jsPDF)
- **Internationalization**: Custom i18n system with React Context
- **State Management**: React hooks, custom hooks for order/admin management
- **Real-time**: Supabase subscriptions for live order updates
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **Build Tool**: Vite

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8bd35a72-9db6-4b92-ac9e-37376778c694) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
