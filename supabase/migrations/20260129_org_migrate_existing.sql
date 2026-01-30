-- =====================================================
-- DATA MIGRATION: Move existing users into an organization
-- =====================================================
-- NON-DESTRUCTIVE: No locations are deleted or remapped.
-- Each user keeps their own location records and all
-- existing foreign keys (Entry, WorkDay, Callout) are untouched.
-- We simply:
--   1. Create an org
--   2. Add both users as members (first = ADMIN)
--   3. Stamp orgId on every existing Location
--   4. Stamp orgId on existing PolicyConfig
-- =====================================================

BEGIN;

-- ─── 1. Create the organization ────────────────────────────────────
INSERT INTO "Organization" ("id", "name", "slug", "createdBy")
SELECT
  'org_default',
  'My Organization',
  'my-org',
  (SELECT DISTINCT "userId" FROM "Location" ORDER BY "userId" LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM "Organization" WHERE "id" = 'org_default');

-- ─── 2. Create memberships for all existing users ──────────────────
-- First user (alphabetically) becomes ADMIN, rest become MEMBER
DO $$
DECLARE
  user_record RECORD;
  is_first BOOLEAN := true;
BEGIN
  FOR user_record IN
    SELECT DISTINCT "userId" FROM "Location" ORDER BY "userId"
  LOOP
    INSERT INTO "Membership" ("userId", "orgId", "role")
    VALUES (
      user_record."userId",
      'org_default',
      CASE WHEN is_first THEN 'ADMIN' ELSE 'MEMBER' END
    )
    ON CONFLICT ("userId", "orgId") DO NOTHING;
    is_first := false;
  END LOOP;
END $$;

-- ─── 2b. Ensure realalecfarmer@gmail.com is in the org as ADMIN ───
INSERT INTO "Membership" ("userId", "orgId", "role")
SELECT
  id::text,
  'org_default',
  'ADMIN'
FROM auth.users
WHERE email = 'realalecfarmer@gmail.com'
ON CONFLICT ("userId", "orgId") DO UPDATE SET "role" = 'ADMIN';

-- ─── 3. Stamp orgId on ALL existing locations ──────────────────────
-- Every location (office sites AND WFH) gets orgId set.
-- userId is NOT changed — each user keeps their own records.
-- No locations are deleted. No foreign keys are touched.
UPDATE "Location"
SET "orgId" = 'org_default'
WHERE "orgId" IS NULL;

-- ─── 4. Stamp orgId on existing PolicyConfig ───────────────────────
UPDATE "PolicyConfig"
SET "orgId" = 'org_default'
WHERE "orgId" IS NULL;

-- If no policy exists at all, create a default one
INSERT INTO "PolicyConfig" ("id", "name", "requiredDaysPerWeek", "minimumMinutesPerDay", "isActive", "orgId")
SELECT
  gen_random_uuid()::text,
  'Default Policy',
  3,
  0,
  true,
  'org_default'
WHERE NOT EXISTS (
  SELECT 1 FROM "PolicyConfig" WHERE "orgId" = 'org_default'
);

-- ─── 5. Pre-seed an invite code for the default org ─────────────
INSERT INTO "Invite" ("id", "orgId", "code", "role", "expiresAt")
SELECT
  gen_random_uuid()::text,
  'org_default',
  'ONSITE24',
  'MEMBER',
  now() + interval '1 year'
WHERE NOT EXISTS (
  SELECT 1 FROM "Invite" WHERE "code" = 'ONSITE24'
);

COMMIT;
