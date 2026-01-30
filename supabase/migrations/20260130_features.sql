-- Migration: Feature flags, photo verification, break tracking,
-- manual corrections, audit log, timesheet approval, alerts, analytics
-- Run after org_model migrations

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- 1. ORG FEATURE FLAGS
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "features" JSONB NOT NULL DEFAULT '{
  "photoVerification": false,
  "breakTracking": false,
  "timesheetApproval": false,
  "alerts": true,
  "analytics": true,
  "manualCorrections": true,
  "auditLog": true
}'::jsonb;

-- ═══════════════════════════════════════════════════════════════
-- 2. EXTEND ENTRY TYPES for breaks
-- ═══════════════════════════════════════════════════════════════
ALTER TYPE "EntryType" ADD VALUE IF NOT EXISTS 'BREAK_START';
ALTER TYPE "EntryType" ADD VALUE IF NOT EXISTS 'BREAK_END';

-- ═══════════════════════════════════════════════════════════════
-- 3. ADD BREAK POLICY to PolicyConfig
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "breakMinutesPerDay" INT NOT NULL DEFAULT 0;
ALTER TABLE "PolicyConfig" ADD COLUMN IF NOT EXISTS "autoDeductBreak" BOOLEAN NOT NULL DEFAULT false;

-- ═══════════════════════════════════════════════════════════════
-- 4. ADD BREAK TRACKING FIELDS to WorkDay
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE "WorkDay" ADD COLUMN IF NOT EXISTS "breakMinutes" INT NOT NULL DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════
-- 5. AUDIT LOG TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "details" JSONB,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AuditLog_orgId_idx" ON "AuditLog"("orgId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");

-- ═══════════════════════════════════════════════════════════════
-- 6. ENTRY CORRECTION TABLE (edit history)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "EntryCorrection" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "entryId" TEXT NOT NULL,
  "correctedBy" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "fieldChanged" TEXT NOT NULL,
  "oldValue" TEXT,
  "newValue" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "EntryCorrection_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EntryCorrection_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "EntryCorrection_entryId_idx" ON "EntryCorrection"("entryId");

-- ═══════════════════════════════════════════════════════════════
-- 7. TIMESHEET SUBMISSION TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "TimesheetSubmission" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "weekStart" DATE NOT NULL,
  "weekEnd" DATE NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "totalMinutes" INT NOT NULL DEFAULT 0,
  "totalDays" INT NOT NULL DEFAULT 0,
  "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMPTZ,
  "reviewNotes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "TimesheetSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TimesheetSubmission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TimesheetSubmission_userId_weekStart_key" ON "TimesheetSubmission"("userId", "weekStart");
CREATE INDEX IF NOT EXISTS "TimesheetSubmission_orgId_idx" ON "TimesheetSubmission"("orgId");
CREATE INDEX IF NOT EXISTS "TimesheetSubmission_status_idx" ON "TimesheetSubmission"("status");

-- ═══════════════════════════════════════════════════════════════
-- 8. ALERT RULES TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "AlertRule" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "config" JSONB NOT NULL DEFAULT '{}',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AlertRule_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AlertRule_orgId_idx" ON "AlertRule"("orgId");

-- ═══════════════════════════════════════════════════════════════
-- 9. ALERT NOTIFICATIONS TABLE
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "AlertNotification" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "ruleId" TEXT,
  "targetUserId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "AlertNotification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AlertNotification_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "AlertNotification_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AlertRule"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "AlertNotification_targetUserId_idx" ON "AlertNotification"("targetUserId");
CREATE INDEX IF NOT EXISTS "AlertNotification_isRead_idx" ON "AlertNotification"("targetUserId", "isRead");
CREATE INDEX IF NOT EXISTS "AlertNotification_createdAt_idx" ON "AlertNotification"("createdAt" DESC);

-- ═══════════════════════════════════════════════════════════════
-- 10. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EntryCorrection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimesheetSubmission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlertRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AlertNotification" ENABLE ROW LEVEL SECURITY;

-- Service role policies (all tables)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['AuditLog', 'EntryCorrection', 'TimesheetSubmission', 'AlertRule', 'AlertNotification'])
  LOOP
    EXECUTE format('CREATE POLICY "service_role_%s" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- Authenticated user policies
CREATE POLICY "auth_read_AuditLog" ON "AuditLog" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_EntryCorrection" ON "EntryCorrection" FOR SELECT TO authenticated
  USING ("entryId" IN (SELECT "id" FROM "Entry" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_TimesheetSubmission" ON "TimesheetSubmission" FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text OR "orgId" IN (
    SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text AND "role" = 'ADMIN'
  ));

CREATE POLICY "auth_write_TimesheetSubmission" ON "TimesheetSubmission" FOR INSERT TO authenticated
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "auth_read_AlertRule" ON "AlertRule" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text AND "role" = 'ADMIN'));

CREATE POLICY "auth_read_AlertNotification" ON "AlertNotification" FOR SELECT TO authenticated
  USING ("targetUserId" = auth.uid()::text);

CREATE POLICY "auth_update_AlertNotification" ON "AlertNotification" FOR UPDATE TO authenticated
  USING ("targetUserId" = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════════
-- 11. SEED DEFAULT ALERT RULES for existing org
-- ═══════════════════════════════════════════════════════════════
INSERT INTO "AlertRule" ("orgId", "type", "config", "isActive")
SELECT id, 'LATE_ARRIVAL', '{"thresholdMinutes": 570, "description": "No clock-in by 9:30 AM"}'::jsonb, true
FROM "Organization"
ON CONFLICT DO NOTHING;

INSERT INTO "AlertRule" ("orgId", "type", "config", "isActive")
SELECT id, 'MISSED_CLOCK_OUT', '{"thresholdHours": 12, "description": "Clocked in for 12+ hours"}'::jsonb, true
FROM "Organization"
ON CONFLICT DO NOTHING;

INSERT INTO "AlertRule" ("orgId", "type", "config", "isActive")
SELECT id, 'OVERTIME_APPROACHING', '{"thresholdMinutes": 2280, "description": "Approaching 40 hours (38h reached)"}'::jsonb, true
FROM "Organization"
ON CONFLICT DO NOTHING;

COMMIT;
