-- =====================================================
-- SECURITY TESTING SCRIPT FOR BRAZILIAN COFFEE ACADEMY
-- =====================================================
-- This script tests all security policies and verifies
-- that the critical vulnerabilities have been fixed.

-- =====================================================
-- 1. TEST RLS POLICY STATUS
-- =====================================================

-- Check that RLS is enabled on all sensitive tables
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ SECURE'
        ELSE '❌ VULNERABLE'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'addresses', 'orders', 'order_items', 'business_settings')
ORDER BY tablename;

-- =====================================================
-- 2. TEST POLICY COVERAGE
-- =====================================================

-- Check that all sensitive tables have proper policies
SELECT 
    t.tablename,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN COUNT(p.policyname) > 0 THEN '✅ PROTECTED'
        ELSE '❌ NO POLICIES'
    END as protection_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
AND t.tablename IN ('customers', 'addresses', 'orders', 'order_items')
GROUP BY t.tablename
ORDER BY t.tablename;

-- =====================================================
-- 3. TEST PUBLIC ACCESS POLICIES
-- =====================================================

-- Identify any policies that still allow public access to sensitive data
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    CASE 
        WHEN qual = 'true' AND tablename IN ('customers', 'addresses', 'orders', 'order_items') 
        THEN '❌ CRITICAL: PUBLIC ACCESS TO SENSITIVE DATA'
        WHEN qual LIKE '%auth.uid()%' THEN '✅ USER-SPECIFIC ACCESS'
        WHEN qual LIKE '%is_admin()%' OR qual LIKE '%franklinmarceloderreiradelima%' THEN '✅ ADMIN-ONLY ACCESS'
        ELSE '⚠️ REVIEW NEEDED'
    END as security_assessment
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('customers', 'addresses', 'orders', 'order_items', 'business_settings')
ORDER BY 
    CASE 
        WHEN qual = 'true' AND tablename IN ('customers', 'addresses', 'orders', 'order_items') THEN 1
        ELSE 2
    END,
    tablename, policyname;

-- =====================================================
-- 4. TEST FUNCTION SECURITY
-- =====================================================

-- Check that security functions exist and have proper search paths
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    proconfig as search_path_config,
    CASE 
        WHEN prosecdef = true AND proconfig IS NOT NULL THEN '✅ SECURE'
        WHEN prosecdef = true AND proconfig IS NULL THEN '⚠️ MISSING SEARCH PATH'
        ELSE '❌ NOT SECURITY DEFINER'
    END as security_status
FROM pg_proc 
WHERE proname IN ('is_admin', 'create_order', 'update_order_status', 'register_customer', 'get_customer_id_by_email')
ORDER BY proname;

-- =====================================================
-- 5. TEST BUSINESS SETTINGS SECURITY
-- =====================================================

-- Verify that business_settings is properly secured
SELECT 
    'business_settings' as table_name,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN qual LIKE '%franklinmarceloderreiradelima%' OR qual LIKE '%is_admin%' THEN 1 END) as admin_only_policies,
    COUNT(CASE WHEN qual = 'true' THEN 1 END) as public_access_policies,
    CASE 
        WHEN COUNT(CASE WHEN qual = 'true' THEN 1 END) = 0 THEN '✅ SECURE - NO PUBLIC ACCESS'
        ELSE '❌ VULNERABLE - PUBLIC ACCESS DETECTED'
    END as security_status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'business_settings';

-- =====================================================
-- 6. TEST PUBLIC BUSINESS INFO
-- =====================================================

-- Check that public_business_info table exists and is properly configured
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'public_business_info') 
        THEN '✅ PUBLIC BUSINESS INFO TABLE EXISTS'
        ELSE '❌ PUBLIC BUSINESS INFO TABLE MISSING'
    END as table_status;

-- Check public_business_info policies
SELECT 
    policyname,
    cmd,
    qual,
    CASE 
        WHEN qual = 'true' AND cmd = 'SELECT' THEN '✅ PROPER PUBLIC READ ACCESS'
        ELSE '⚠️ REVIEW POLICY'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'public_business_info';

-- =====================================================
-- 7. TEST EXTENSION SECURITY
-- =====================================================

-- Check if extensions schema exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') 
        THEN '✅ EXTENSIONS SCHEMA EXISTS'
        ELSE '⚠️ EXTENSIONS SCHEMA NOT FOUND'
    END as extensions_schema_status;

-- =====================================================
-- 8. SECURITY SUMMARY REPORT
-- =====================================================

-- Generate comprehensive security summary
WITH security_checks AS (
    -- RLS Status Check
    SELECT 
        'RLS_ENABLED' as check_type,
        COUNT(*) as total_tables,
        COUNT(CASE WHEN rowsecurity = true THEN 1 END) as secure_tables,
        CASE 
            WHEN COUNT(*) = COUNT(CASE WHEN rowsecurity = true THEN 1 END) THEN 'PASS'
            ELSE 'FAIL'
        END as status
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('customers', 'addresses', 'orders', 'order_items')
    
    UNION ALL
    
    -- Public Access Check
    SELECT 
        'NO_PUBLIC_ACCESS_TO_SENSITIVE_DATA' as check_type,
        COUNT(*) as total_policies,
        COUNT(CASE WHEN qual = 'true' THEN 1 END) as public_policies,
        CASE 
            WHEN COUNT(CASE WHEN qual = 'true' THEN 1 END) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status
    FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename IN ('customers', 'addresses', 'orders', 'order_items')
    
    UNION ALL
    
    -- Admin Functions Check
    SELECT 
        'ADMIN_FUNCTIONS_EXIST' as check_type,
        5 as total_tables, -- Expected number of admin functions
        COUNT(*) as secure_tables,
        CASE 
            WHEN COUNT(*) >= 4 THEN 'PASS' -- At least 4 critical functions should exist
            ELSE 'FAIL'
        END as status
    FROM pg_proc 
    WHERE proname IN ('is_admin', 'create_order', 'update_order_status', 'register_customer')
    
    UNION ALL
    
    -- Business Settings Security Check
    SELECT 
        'BUSINESS_SETTINGS_SECURED' as check_type,
        1 as total_tables,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'public' 
                AND tablename = 'business_settings' 
                AND qual LIKE '%franklinmarceloderreiradelima%'
            ) THEN 1 
            ELSE 0 
        END as secure_tables,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'public' 
                AND tablename = 'business_settings' 
                AND qual LIKE '%franklinmarceloderreiradelima%'
            ) THEN 'PASS'
            ELSE 'FAIL'
        END as status
)
SELECT 
    check_type,
    total_tables,
    secure_tables,
    status,
    CASE 
        WHEN status = 'PASS' THEN '✅'
        ELSE '❌'
    END as result
FROM security_checks
ORDER BY 
    CASE WHEN status = 'FAIL' THEN 1 ELSE 2 END,
    check_type;

-- =====================================================
-- 9. CRITICAL VULNERABILITIES STATUS
-- =====================================================

-- Final report on the original critical issues
SELECT 
    'SECURITY AUDIT SUMMARY' as report_section,
    '===================' as separator;

SELECT 
    '1. Customer Address Data Exposure' as vulnerability,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'addresses' 
            AND qual LIKE '%auth.uid()%'
        ) THEN '✅ FIXED - User-specific access implemented'
        ELSE '❌ NOT FIXED - Still vulnerable'
    END as status;

SELECT 
    '2. Customer Order History Exposure' as vulnerability,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'orders' 
            AND qual LIKE '%auth.uid()%'
        ) THEN '✅ FIXED - User-specific access implemented'
        ELSE '❌ NOT FIXED - Still vulnerable'
    END as status;

SELECT 
    '3. Detailed Purchase Data Exposure' as vulnerability,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'order_items' 
            AND qual LIKE '%auth.uid()%'
        ) THEN '✅ FIXED - User-specific access implemented'
        ELSE '❌ NOT FIXED - Still vulnerable'
    END as status;

SELECT 
    '4. Business Owner Information Exposure' as vulnerability,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'business_settings' 
            AND qual LIKE '%franklinmarceloderreiradelima%'
        ) THEN '✅ FIXED - Admin-only access implemented'
        ELSE '❌ NOT FIXED - Still vulnerable'
    END as status;

-- =====================================================
-- END OF SECURITY TEST SCRIPT
-- =====================================================
