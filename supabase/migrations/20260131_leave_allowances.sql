-- Add leave policy fields to PolicyConfig
ALTER TABLE "PolicyConfig"
  ADD COLUMN IF NOT EXISTS "annualPtoDays" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "maxCarryoverDays" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "leaveYearStartMonth" integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "leaveYearStartDay" integer NOT NULL DEFAULT 1;

-- Add orgId to LeaveRequest
ALTER TABLE "LeaveRequest"
  ADD COLUMN IF NOT EXISTS "orgId" text;

ALTER TABLE "LeaveRequest"
  ADD CONSTRAINT "LeaveRequest_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "LeaveRequest_orgId_idx" ON "LeaveRequest"("orgId");

-- Backfill orgId from Membership
UPDATE "LeaveRequest" lr
SET "orgId" = m."orgId"
FROM "Membership" m
WHERE m."userId" = lr."userId"
  AND lr."orgId" IS NULL;

-- Create LeaveAllowanceOverride table
CREATE TABLE IF NOT EXISTS "LeaveAllowanceOverride" (
  "id" text NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" text NOT NULL,
  "orgId" text NOT NULL,
  "annualPtoDays" integer NOT NULL,
  "effectiveYear" integer,
  "notes" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT "LeaveAllowanceOverride_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeaveAllowanceOverride_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "LeaveAllowanceOverride_userId_orgId_effectiveYear_key"
  ON "LeaveAllowanceOverride"("userId", "orgId", "effectiveYear");

CREATE INDEX IF NOT EXISTS "LeaveAllowanceOverride_orgId_idx" ON "LeaveAllowanceOverride"("orgId");
CREATE INDEX IF NOT EXISTS "LeaveAllowanceOverride_userId_idx" ON "LeaveAllowanceOverride"("userId");

-- RLS: enable but allow service_role full access (default behavior)
ALTER TABLE "LeaveAllowanceOverride" ENABLE ROW LEVEL SECURITY;
