-- =====================================================
-- ORGANIZATION MODEL MIGRATION
-- =====================================================
-- Adds Organization, Membership, Invite tables.
-- Makes Location and PolicyConfig org-scoped.
-- Migrates existing users into a single organization.
-- =====================================================

BEGIN;

-- ─── 1. Create Organization table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. Create Membership table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Membership" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL DEFAULT 'MEMBER' CHECK ("role" IN ('ADMIN', 'MEMBER')),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("userId", "orgId")
);

-- ─── 3. Create Invite table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Invite" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "email" TEXT,
  "code" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL DEFAULT 'MEMBER' CHECK ("role" IN ('ADMIN', 'MEMBER')),
  "usedBy" TEXT,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. Add orgId to Location ──────────────────────────────────────
-- Shared org locations will have orgId set and userId NULL.
-- Personal locations (WFH) will have both orgId and userId set.
ALTER TABLE "Location" ADD COLUMN IF NOT EXISTS "orgId" TEXT REFERENCES "Organization"("id");
-- Make userId nullable (shared locations don't belong to a single user)
ALTER TABLE "Location" ALTER COLUMN "userId" DROP NOT NULL;

-- ─── 5. Add orgId to PolicyConfig ──────────────────────────────────
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "orgId" TEXT REFERENCES "Organization"("id");

-- ─── 6. Create indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Organization_slug_idx" ON "Organization"("slug");
CREATE INDEX IF NOT EXISTS "Membership_userId_idx" ON "Membership"("userId");
CREATE INDEX IF NOT EXISTS "Membership_orgId_idx" ON "Membership"("orgId");
CREATE INDEX IF NOT EXISTS "Location_orgId_idx" ON "Location"("orgId");
CREATE INDEX IF NOT EXISTS "PolicyConfig_orgId_idx" ON "PolicyConfig"("orgId");
CREATE INDEX IF NOT EXISTS "Invite_code_idx" ON "Invite"("code");
CREATE INDEX IF NOT EXISTS "Invite_orgId_idx" ON "Invite"("orgId");

-- ─── 7. Enable RLS on new tables ───────────────────────────────────
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invite" ENABLE ROW LEVEL SECURITY;

-- ─── 8. RLS Policies for Organization ──────────────────────────────
-- Members can read their org
CREATE POLICY "Members can read own org"
ON "Organization"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Membership"
    WHERE "Membership"."orgId" = "Organization"."id"
    AND "Membership"."userId" = auth.uid()::text
  )
);

-- Only allow insert via service role (API handles org creation)
CREATE POLICY "Service role can manage orgs"
ON "Organization"
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Admins can update their org
CREATE POLICY "Admins can update own org"
ON "Organization"
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Membership"
    WHERE "Membership"."orgId" = "Organization"."id"
    AND "Membership"."userId" = auth.uid()::text
    AND "Membership"."role" = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Membership"
    WHERE "Membership"."orgId" = "Organization"."id"
    AND "Membership"."userId" = auth.uid()::text
    AND "Membership"."role" = 'ADMIN'
  )
);

-- ─── 9. RLS Policies for Membership ────────────────────────────────
-- Members can read memberships in their org
CREATE POLICY "Members can read org memberships"
ON "Membership"
FOR SELECT TO authenticated
USING (
  "orgId" IN (
    SELECT m."orgId" FROM "Membership" m
    WHERE m."userId" = auth.uid()::text
  )
);

-- Service role can manage memberships
CREATE POLICY "Service role can manage memberships"
ON "Membership"
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ─── 10. RLS Policies for Invite ───────────────────────────────────
-- Admins can read invites for their org
CREATE POLICY "Admins can read org invites"
ON "Invite"
FOR SELECT TO authenticated
USING (
  "orgId" IN (
    SELECT m."orgId" FROM "Membership" m
    WHERE m."userId" = auth.uid()::text
    AND m."role" = 'ADMIN'
  )
);

-- Anyone authenticated can read invite by code (for joining)
CREATE POLICY "Anyone can read invite by code"
ON "Invite"
FOR SELECT TO authenticated
USING (true);

-- Service role can manage invites
CREATE POLICY "Service role can manage invites"
ON "Invite"
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- ─── 11. Update Location RLS ───────────────────────────────────────
-- Drop old user-scoped policies
DROP POLICY IF EXISTS "Users can read own locations" ON "Location";
DROP POLICY IF EXISTS "Users can insert own locations" ON "Location";
DROP POLICY IF EXISTS "Users can update own locations" ON "Location";
DROP POLICY IF EXISTS "Users can delete own locations" ON "Location";

-- New: Members can read locations in their org (shared + personal)
CREATE POLICY "Members can read org locations"
ON "Location"
FOR SELECT TO authenticated
USING (
  "orgId" IN (
    SELECT m."orgId" FROM "Membership" m
    WHERE m."userId" = auth.uid()::text
  )
  AND ("userId" IS NULL OR "userId" = auth.uid()::text)
);

-- Insert: user can insert locations for their org
CREATE POLICY "Members can insert org locations"
ON "Location"
FOR INSERT TO authenticated
WITH CHECK (
  "orgId" IN (
    SELECT m."orgId" FROM "Membership" m
    WHERE m."userId" = auth.uid()::text
  )
);

-- Update: admins can update shared locations, users can update their own
CREATE POLICY "Members can update org locations"
ON "Location"
FOR UPDATE TO authenticated
USING (
  "orgId" IN (
    SELECT m."orgId" FROM "Membership" m
    WHERE m."userId" = auth.uid()::text
  )
  AND (
    "userId" = auth.uid()::text
    OR (
      "userId" IS NULL
      AND EXISTS (
        SELECT 1 FROM "Membership" m
        WHERE m."orgId" = "Location"."orgId"
        AND m."userId" = auth.uid()::text
        AND m."role" = 'ADMIN'
      )
    )
  )
)
WITH CHECK (
  "orgId" IN (
    SELECT m."orgId" FROM "Membership" m
    WHERE m."userId" = auth.uid()::text
  )
);

-- Delete: admins can delete shared, users can delete their own personal
CREATE POLICY "Members can delete org locations"
ON "Location"
FOR DELETE TO authenticated
USING (
  "orgId" IN (
    SELECT m."orgId" FROM "Membership" m
    WHERE m."userId" = auth.uid()::text
  )
  AND (
    "userId" = auth.uid()::text
    OR (
      "userId" IS NULL
      AND EXISTS (
        SELECT 1 FROM "Membership" m
        WHERE m."orgId" = "Location"."orgId"
        AND m."userId" = auth.uid()::text
        AND m."role" = 'ADMIN'
      )
    )
  )
);

-- ─── 12. Update PolicyConfig RLS ───────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read policy config" ON "PolicyConfig";

-- Members can read policy for their org
CREATE POLICY "Members can read org policy"
ON "PolicyConfig"
FOR SELECT TO authenticated
USING (
  "orgId" IN (
    SELECT m."orgId" FROM "Membership" m
    WHERE m."userId" = auth.uid()::text
  )
);

-- Admins can manage policy for their org
CREATE POLICY "Admins can manage org policy"
ON "PolicyConfig"
FOR ALL TO authenticated
USING (
  "orgId" IN (
    SELECT m."orgId" FROM "Membership" m
    WHERE m."userId" = auth.uid()::text
    AND m."role" = 'ADMIN'
  )
)
WITH CHECK (
  "orgId" IN (
    SELECT m."orgId" FROM "Membership" m
    WHERE m."userId" = auth.uid()::text
    AND m."role" = 'ADMIN'
  )
);

-- Service role bypass for all tables
CREATE POLICY "Service role can manage locations"
ON "Location"
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage policy"
ON "PolicyConfig"
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

COMMIT;
