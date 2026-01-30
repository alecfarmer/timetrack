-- Migration: Infrastructure & Features
-- Date: 2026-01-30
-- Description: Composite indexes, multi-jurisdiction policy engine, smart corrections,
--              burnout & well-being signals, and payroll enhancement.

-- =============================================================================
-- 1. Composite Indexes for Query Performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_entry_user_timestamp ON "Entry" ("userId", "timestampServer" DESC);
CREATE INDEX IF NOT EXISTS idx_workday_user_date ON "WorkDay" ("userId", "date" DESC);
CREATE INDEX IF NOT EXISTS idx_leave_user_date ON "LeaveRequest" ("userId", "date");
CREATE INDEX IF NOT EXISTS idx_entry_user_type ON "Entry" ("userId", "type");

-- =============================================================================
-- 2. Multi-Jurisdiction Policy Engine — extend PolicyConfig
-- =============================================================================

ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "jurisdiction" TEXT;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "overtimeThresholdDaily" INT DEFAULT 0;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "overtimeThresholdWeekly" INT DEFAULT 2400;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "mealBreakRequired" BOOLEAN DEFAULT false;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "mealBreakAfterMinutes" INT DEFAULT 360;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "mealBreakDuration" INT DEFAULT 30;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "restBreakRequired" BOOLEAN DEFAULT false;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "restBreakInterval" INT DEFAULT 240;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "restBreakDuration" INT DEFAULT 10;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "predictiveScheduling" BOOLEAN DEFAULT false;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "advanceNoticeHours" INT DEFAULT 0;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "clopeningMinHours" INT DEFAULT 0;

-- =============================================================================
-- 3. Smart Corrections — add auto-approve and status to EntryCorrection
-- =============================================================================

ALTER TABLE "EntryCorrection" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'APPROVED';
ALTER TABLE "EntryCorrection" ADD COLUMN IF NOT EXISTS "autoApproved" BOOLEAN DEFAULT false;
ALTER TABLE "EntryCorrection" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;
ALTER TABLE "EntryCorrection" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMPTZ;

-- =============================================================================
-- 4. Burnout & Well-Being Signals
-- =============================================================================

CREATE TABLE IF NOT EXISTS "WellBeingSnapshot" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "weekStart" DATE NOT NULL,
  "consecutiveWorkDays" INT DEFAULT 0,
  "overtimeMinutes" INT DEFAULT 0,
  "breakSkipCount" INT DEFAULT 0,
  "clopeningCount" INT DEFAULT 0,
  "avgDailyMinutes" INT DEFAULT 0,
  "scheduleVolatility" FLOAT DEFAULT 0,
  "burnoutScore" INT DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("userId", "weekStart")
);

CREATE INDEX IF NOT EXISTS idx_wellbeing_org ON "WellBeingSnapshot" ("orgId");
CREATE INDEX IF NOT EXISTS idx_wellbeing_user_week ON "WellBeingSnapshot" ("userId", "weekStart" DESC);

ALTER TABLE "WellBeingSnapshot" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'WellBeingSnapshot' AND policyname = 'wellbeing_service'
  ) THEN
    CREATE POLICY "wellbeing_service" ON "WellBeingSnapshot" FOR ALL TO service_role USING (true);
  END IF;
END
$$;

-- =============================================================================
-- 5. Payroll Enhancement — payroll mapping config
-- =============================================================================

CREATE TABLE IF NOT EXISTS "PayrollMapping" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "provider" TEXT NOT NULL DEFAULT 'csv',
  "regularPayCode" TEXT DEFAULT 'REG',
  "overtimePayCode" TEXT DEFAULT 'OT',
  "calloutPayCode" TEXT DEFAULT 'CALL',
  "breakDeductionEnabled" BOOLEAN DEFAULT false,
  "roundingRule" TEXT DEFAULT 'none',
  "roundingIncrement" INT DEFAULT 15,
  "config" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("orgId")
);

ALTER TABLE "PayrollMapping" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'PayrollMapping' AND policyname = 'payroll_mapping_service'
  ) THEN
    CREATE POLICY "payroll_mapping_service" ON "PayrollMapping" FOR ALL TO service_role USING (true);
  END IF;
END
$$;
