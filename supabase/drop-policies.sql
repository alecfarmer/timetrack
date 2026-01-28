-- =====================================================
-- DROP EXISTING RLS POLICIES (Run this first if you get conflicts)
-- =====================================================

-- Drop Location policies
DROP POLICY IF EXISTS "Allow public read access to locations" ON "Location";
DROP POLICY IF EXISTS "Allow public insert access to locations" ON "Location";
DROP POLICY IF EXISTS "Allow public update access to locations" ON "Location";
DROP POLICY IF EXISTS "Allow public delete access to locations" ON "Location";

-- Drop Entry policies
DROP POLICY IF EXISTS "Allow public read access to entries" ON "Entry";
DROP POLICY IF EXISTS "Allow public insert access to entries" ON "Entry";
DROP POLICY IF EXISTS "Allow public update access to entries" ON "Entry";
DROP POLICY IF EXISTS "Allow public delete access to entries" ON "Entry";

-- Drop WorkDay policies
DROP POLICY IF EXISTS "Allow public read access to workdays" ON "WorkDay";
DROP POLICY IF EXISTS "Allow public insert access to workdays" ON "WorkDay";
DROP POLICY IF EXISTS "Allow public update access to workdays" ON "WorkDay";
DROP POLICY IF EXISTS "Allow public delete access to workdays" ON "WorkDay";

-- Drop Callout policies
DROP POLICY IF EXISTS "Allow public read access to callouts" ON "Callout";
DROP POLICY IF EXISTS "Allow public insert access to callouts" ON "Callout";
DROP POLICY IF EXISTS "Allow public update access to callouts" ON "Callout";
DROP POLICY IF EXISTS "Allow public delete access to callouts" ON "Callout";

-- Drop PolicyConfig policies
DROP POLICY IF EXISTS "Allow public read access to policy config" ON "PolicyConfig";
DROP POLICY IF EXISTS "Allow public insert access to policy config" ON "PolicyConfig";
DROP POLICY IF EXISTS "Allow public update access to policy config" ON "PolicyConfig";
DROP POLICY IF EXISTS "Allow public delete access to policy config" ON "PolicyConfig";

-- Drop AppConfig policies
DROP POLICY IF EXISTS "Allow public read access to app config" ON "AppConfig";
DROP POLICY IF EXISTS "Allow public insert access to app config" ON "AppConfig";
DROP POLICY IF EXISTS "Allow public update access to app config" ON "AppConfig";
DROP POLICY IF EXISTS "Allow public delete access to app config" ON "AppConfig";
