-- =====================================================
-- ROW LEVEL SECURITY POLICIES FOR ONSITE APP
-- =====================================================
-- Run this in your Supabase SQL Editor
-- These policies allow full access via the anon key for this personal app
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "Location" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkDay" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Callout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PolicyConfig" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- LOCATION POLICIES
-- =====================================================
-- Allow anyone to read locations
CREATE POLICY "Allow public read access to locations"
ON "Location"
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to insert locations
CREATE POLICY "Allow public insert access to locations"
ON "Location"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to update locations
CREATE POLICY "Allow public update access to locations"
ON "Location"
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anyone to delete locations
CREATE POLICY "Allow public delete access to locations"
ON "Location"
FOR DELETE
TO anon, authenticated
USING (true);

-- =====================================================
-- ENTRY POLICIES
-- =====================================================
CREATE POLICY "Allow public read access to entries"
ON "Entry"
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert access to entries"
ON "Entry"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update access to entries"
ON "Entry"
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access to entries"
ON "Entry"
FOR DELETE
TO anon, authenticated
USING (true);

-- =====================================================
-- WORKDAY POLICIES
-- =====================================================
CREATE POLICY "Allow public read access to workdays"
ON "WorkDay"
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert access to workdays"
ON "WorkDay"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update access to workdays"
ON "WorkDay"
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access to workdays"
ON "WorkDay"
FOR DELETE
TO anon, authenticated
USING (true);

-- =====================================================
-- CALLOUT POLICIES
-- =====================================================
CREATE POLICY "Allow public read access to callouts"
ON "Callout"
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert access to callouts"
ON "Callout"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update access to callouts"
ON "Callout"
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access to callouts"
ON "Callout"
FOR DELETE
TO anon, authenticated
USING (true);

-- =====================================================
-- POLICYCONFIG POLICIES
-- =====================================================
CREATE POLICY "Allow public read access to policy config"
ON "PolicyConfig"
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert access to policy config"
ON "PolicyConfig"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public update access to policy config"
ON "PolicyConfig"
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access to policy config"
ON "PolicyConfig"
FOR DELETE
TO anon, authenticated
USING (true);

-- =====================================================
-- VERIFY RLS IS ENABLED
-- =====================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('Location', 'Entry', 'WorkDay', 'Callout', 'PolicyConfig');
