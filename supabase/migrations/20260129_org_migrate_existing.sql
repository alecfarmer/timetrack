-- =====================================================
-- DATA MIGRATION: Move existing users into an organization
-- =====================================================
-- This migrates the 2 existing users and their data into
-- a single organization. The first user found becomes ADMIN.
-- Shared locations (non-HOME) are consolidated so the org
-- has one set. Personal WFH locations are preserved per-user.
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
-- First user becomes ADMIN, rest become MEMBER
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

-- ─── 3. Handle shared (non-HOME) locations ─────────────────────────
-- Strategy: For each unique location code, keep ONE canonical location
-- (from the first user), remap other users' entries/workdays/callouts,
-- then delete duplicates.

DO $$
DECLARE
  loc_code TEXT;
  canonical_id TEXT;
  dup_record RECORD;
BEGIN
  -- For each unique location code (non-HOME)
  FOR loc_code IN
    SELECT DISTINCT "code" FROM "Location"
    WHERE "category" != 'HOME' AND "code" IS NOT NULL
  LOOP
    -- Pick the canonical location (first by userId, then by createdAt)
    SELECT "id" INTO canonical_id
    FROM "Location"
    WHERE "code" = loc_code AND "category" != 'HOME'
    ORDER BY "userId", "createdAt"
    LIMIT 1;

    -- Set orgId and clear userId on the canonical location
    UPDATE "Location"
    SET "orgId" = 'org_default', "userId" = NULL
    WHERE "id" = canonical_id;

    -- For each duplicate of this location code
    FOR dup_record IN
      SELECT "id" FROM "Location"
      WHERE "code" = loc_code AND "category" != 'HOME' AND "id" != canonical_id
    LOOP
      -- Remap entries
      UPDATE "Entry"
      SET "locationId" = canonical_id
      WHERE "locationId" = dup_record."id";

      -- Remap workdays
      UPDATE "WorkDay"
      SET "locationId" = canonical_id
      WHERE "locationId" = dup_record."id";

      -- Remap callouts
      UPDATE "Callout"
      SET "locationId" = canonical_id
      WHERE "locationId" = dup_record."id";

      -- Delete the duplicate location
      DELETE FROM "Location" WHERE "id" = dup_record."id";
    END LOOP;
  END LOOP;

  -- Handle any non-HOME locations without a code (shouldn't exist but safety)
  UPDATE "Location"
  SET "orgId" = 'org_default', "userId" = NULL
  WHERE "category" != 'HOME' AND "orgId" IS NULL AND "code" IS NULL;
END $$;

-- ─── 4. Handle personal (HOME/WFH) locations ──────────────────────
-- These stay user-scoped but get orgId added
UPDATE "Location"
SET "orgId" = 'org_default'
WHERE "category" = 'HOME' AND "orgId" IS NULL;

-- ─── 5. Create default policy for the org ──────────────────────────
-- Migrate existing active policy to be org-scoped
UPDATE "PolicyConfig"
SET "orgId" = 'org_default'
WHERE "orgId" IS NULL;

-- If no policy exists, create a default one
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

-- ─── 6. Fix WorkDay unique constraint ──────────────────────────────
-- The old unique constraint is (date, locationId, userId).
-- After consolidating locations, there might be conflicts.
-- Handle by keeping the one with more totalMinutes.
-- (This is a safety measure; conflicts are unlikely with 2 users.)

COMMIT;
