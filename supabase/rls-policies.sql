-- =====================================================
-- ROW LEVEL SECURITY POLICIES FOR ONSITE APP
-- =====================================================
-- Run this in your Supabase SQL Editor
-- Multi-user: Entry, WorkDay, Callout are scoped per user
-- Shared: Location, PolicyConfig, AppConfig are accessible to all authenticated users
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkDay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Callout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PolicyConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppConfig" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Drop existing policies (safe re-run)
-- =====================================================
DROP POLICY IF EXISTS "Allow public read access to locations" ON "Location";
DROP POLICY IF EXISTS "Allow public insert access to locations" ON "Location";
DROP POLICY IF EXISTS "Allow public update access to locations" ON "Location";
DROP POLICY IF EXISTS "Allow public delete access to locations" ON "Location";

DROP POLICY IF EXISTS "Allow public read access to entries" ON "Entry";
DROP POLICY IF EXISTS "Allow public insert access to entries" ON "Entry";
DROP POLICY IF EXISTS "Allow public update access to entries" ON "Entry";
DROP POLICY IF EXISTS "Allow public delete access to entries" ON "Entry";

DROP POLICY IF EXISTS "Allow public read access to workdays" ON "WorkDay";
DROP POLICY IF EXISTS "Allow public insert access to workdays" ON "WorkDay";
DROP POLICY IF EXISTS "Allow public update access to workdays" ON "WorkDay";
DROP POLICY IF EXISTS "Allow public delete access to workdays" ON "WorkDay";

DROP POLICY IF EXISTS "Allow public read access to callouts" ON "Callout";
DROP POLICY IF EXISTS "Allow public insert access to callouts" ON "Callout";
DROP POLICY IF EXISTS "Allow public update access to callouts" ON "Callout";
DROP POLICY IF EXISTS "Allow public delete access to callouts" ON "Callout";

DROP POLICY IF EXISTS "Allow public read access to policy config" ON "PolicyConfig";
DROP POLICY IF EXISTS "Allow public insert access to policy config" ON "PolicyConfig";
DROP POLICY IF EXISTS "Allow public update access to policy config" ON "PolicyConfig";
DROP POLICY IF EXISTS "Allow public delete access to policy config" ON "PolicyConfig";

DROP POLICY IF EXISTS "Allow public read access to app config" ON "AppConfig";
DROP POLICY IF EXISTS "Allow public insert access to app config" ON "AppConfig";
DROP POLICY IF EXISTS "Allow public update access to app config" ON "AppConfig";
DROP POLICY IF EXISTS "Allow public delete access to app config" ON "AppConfig";

-- Also drop the new named policies in case of re-run
DROP POLICY IF EXISTS "Authenticated users can read locations" ON "Location";
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON "Location";
DROP POLICY IF EXISTS "Authenticated users can update locations" ON "Location";
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON "Location";

DROP POLICY IF EXISTS "Users can read own entries" ON "Entry";
DROP POLICY IF EXISTS "Users can insert own entries" ON "Entry";
DROP POLICY IF EXISTS "Users can update own entries" ON "Entry";
DROP POLICY IF EXISTS "Users can delete own entries" ON "Entry";

DROP POLICY IF EXISTS "Users can read own workdays" ON "WorkDay";
DROP POLICY IF EXISTS "Users can insert own workdays" ON "WorkDay";
DROP POLICY IF EXISTS "Users can update own workdays" ON "WorkDay";
DROP POLICY IF EXISTS "Users can delete own workdays" ON "WorkDay";

DROP POLICY IF EXISTS "Users can read own callouts" ON "Callout";
DROP POLICY IF EXISTS "Users can insert own callouts" ON "Callout";
DROP POLICY IF EXISTS "Users can update own callouts" ON "Callout";
DROP POLICY IF EXISTS "Users can delete own callouts" ON "Callout";

DROP POLICY IF EXISTS "Authenticated users can read policy config" ON "PolicyConfig";
DROP POLICY IF EXISTS "Authenticated users can read app config" ON "AppConfig";

-- =====================================================
-- LOCATION POLICIES (shared across all authenticated users)
-- =====================================================
CREATE POLICY "Authenticated users can read locations"
ON "Location"
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert locations"
ON "Location"
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update locations"
ON "Location"
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete locations"
ON "Location"
FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- ENTRY POLICIES (per-user)
-- =====================================================
CREATE POLICY "Users can read own entries"
ON "Entry"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own entries"
ON "Entry"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own entries"
ON "Entry"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own entries"
ON "Entry"
FOR DELETE
TO authenticated
USING (auth.uid()::text = "userId");

-- =====================================================
-- WORKDAY POLICIES (per-user)
-- =====================================================
CREATE POLICY "Users can read own workdays"
ON "WorkDay"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own workdays"
ON "WorkDay"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own workdays"
ON "WorkDay"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own workdays"
ON "WorkDay"
FOR DELETE
TO authenticated
USING (auth.uid()::text = "userId");

-- =====================================================
-- CALLOUT POLICIES (per-user)
-- =====================================================
CREATE POLICY "Users can read own callouts"
ON "Callout"
FOR SELECT
TO authenticated
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own callouts"
ON "Callout"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own callouts"
ON "Callout"
FOR UPDATE
TO authenticated
USING (auth.uid()::text = "userId")
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own callouts"
ON "Callout"
FOR DELETE
TO authenticated
USING (auth.uid()::text = "userId");

-- =====================================================
-- POLICYCONFIG POLICIES (shared, read-only for authenticated)
-- =====================================================
CREATE POLICY "Authenticated users can read policy config"
ON "PolicyConfig"
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- APPCONFIG POLICIES (shared, read-only for authenticated)
-- =====================================================
CREATE POLICY "Authenticated users can read app config"
ON "AppConfig"
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- VERIFY RLS IS ENABLED
-- =====================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('Location', 'Entry', 'WorkDay', 'Callout', 'PolicyConfig', 'AppConfig');
