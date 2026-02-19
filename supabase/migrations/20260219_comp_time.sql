-- ============================================================================
-- Comp Time System Migration
-- Adds priority to callouts and creates comp time tracking
-- ============================================================================

-- Add priority field to Callout table
ALTER TABLE "Callout" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'P3';

-- Create enum-like check constraint for priority
ALTER TABLE "Callout" ADD CONSTRAINT "Callout_priority_check"
  CHECK ("priority" IN ('P1', 'P2', 'P3', 'P4', 'P5'));

-- Create index on priority for filtering
CREATE INDEX IF NOT EXISTS "Callout_priority_idx" ON "Callout" ("priority");

-- ============================================================================
-- Comp Time Entry Table
-- Tracks earned and used comp time with 90-day expiration
-- ============================================================================

CREATE TABLE IF NOT EXISTS "CompTimeEntry" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "orgId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,

  -- Source of comp time
  "type" TEXT NOT NULL CHECK ("type" IN ('CALLOUT', 'TRAVEL', 'MANUAL')),
  "sourceId" UUID,  -- Reference to Callout.id or LeaveRequest.id
  "sourceDate" DATE NOT NULL,  -- Date the comp time was earned

  -- Time earned (in minutes for callouts, 480 = 1 day for travel)
  "minutesEarned" INTEGER NOT NULL CHECK ("minutesEarned" > 0),
  "minutesUsed" INTEGER NOT NULL DEFAULT 0 CHECK ("minutesUsed" >= 0),

  -- Metadata
  "description" TEXT,  -- e.g., "P1 Incident #12345" or "Weekend travel: SFO-NYC"
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK ("status" IN ('AVAILABLE', 'PARTIALLY_USED', 'FULLY_USED', 'EXPIRED')),

  -- Expiration (90 days from sourceDate)
  "expiresAt" TIMESTAMPTZ NOT NULL,

  -- Audit
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate entries for same source
  CONSTRAINT "CompTimeEntry_source_unique" UNIQUE ("type", "sourceId")
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS "CompTimeEntry_userId_idx" ON "CompTimeEntry" ("userId");
CREATE INDEX IF NOT EXISTS "CompTimeEntry_orgId_idx" ON "CompTimeEntry" ("orgId");
CREATE INDEX IF NOT EXISTS "CompTimeEntry_status_idx" ON "CompTimeEntry" ("status");
CREATE INDEX IF NOT EXISTS "CompTimeEntry_expiresAt_idx" ON "CompTimeEntry" ("expiresAt");
CREATE INDEX IF NOT EXISTS "CompTimeEntry_sourceDate_idx" ON "CompTimeEntry" ("sourceDate");

-- ============================================================================
-- Comp Time Usage Table
-- Tracks when comp time is used (linked to leave requests)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "CompTimeUsage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "compTimeEntryId" UUID NOT NULL REFERENCES "CompTimeEntry"(id) ON DELETE CASCADE,
  "leaveRequestId" TEXT NOT NULL REFERENCES "LeaveRequest"(id) ON DELETE CASCADE,
  "minutesUsed" INTEGER NOT NULL CHECK ("minutesUsed" > 0),
  "usedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "CompTimeUsage_unique" UNIQUE ("compTimeEntryId", "leaveRequestId")
);

CREATE INDEX IF NOT EXISTS "CompTimeUsage_compTimeEntryId_idx" ON "CompTimeUsage" ("compTimeEntryId");
CREATE INDEX IF NOT EXISTS "CompTimeUsage_leaveRequestId_idx" ON "CompTimeUsage" ("leaveRequestId");

-- ============================================================================
-- Update trigger for CompTimeEntry
-- ============================================================================

CREATE OR REPLACE FUNCTION update_comp_time_entry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "CompTimeEntry_updated_at" ON "CompTimeEntry";
CREATE TRIGGER "CompTimeEntry_updated_at"
  BEFORE UPDATE ON "CompTimeEntry"
  FOR EACH ROW
  EXECUTE FUNCTION update_comp_time_entry_timestamp();

-- ============================================================================
-- Function to expire old comp time entries (run via cron or on access)
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_comp_time_entries()
RETURNS void AS $$
BEGIN
  UPDATE "CompTimeEntry"
  SET "status" = 'EXPIRED', "updatedAt" = now()
  WHERE "status" IN ('AVAILABLE', 'PARTIALLY_USED')
    AND "expiresAt" < now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Add COMP and TRAVEL to LeaveType enum
-- ============================================================================

ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'COMP';
ALTER TYPE "LeaveType" ADD VALUE IF NOT EXISTS 'TRAVEL';
