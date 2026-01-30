-- Migration: Shift scheduling tables
BEGIN;

-- Shift definitions
CREATE TABLE IF NOT EXISTS "Shift" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startTime" TIME NOT NULL,
  "endTime" TIME NOT NULL,
  "daysOfWeek" INT[] NOT NULL DEFAULT '{1,2,3,4,5}',
  "color" TEXT DEFAULT '#3b82f6',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Shift_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Shift_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Shift_orgId_idx" ON "Shift"("orgId");

-- Shift assignments (user <-> shift)
CREATE TABLE IF NOT EXISTS "ShiftAssignment" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "shiftId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "effectiveDate" DATE NOT NULL DEFAULT CURRENT_DATE,
  "endDate" DATE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ShiftAssignment_shiftId_idx" ON "ShiftAssignment"("shiftId");
CREATE INDEX IF NOT EXISTS "ShiftAssignment_userId_idx" ON "ShiftAssignment"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ShiftAssignment_userId_shiftId_key" ON "ShiftAssignment"("userId", "shiftId") WHERE "endDate" IS NULL;

-- RLS
ALTER TABLE "Shift" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShiftAssignment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_Shift" ON "Shift" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_ShiftAssignment" ON "ShiftAssignment" FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_Shift" ON "Shift" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_ShiftAssignment" ON "ShiftAssignment" FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text OR "shiftId" IN (
    SELECT s."id" FROM "Shift" s
    JOIN "Membership" m ON m."orgId" = s."orgId"
    WHERE m."userId" = auth.uid()::text AND m."role" = 'ADMIN'
  ));

COMMIT;
