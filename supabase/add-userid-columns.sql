-- =====================================================
-- MIGRATION: Add userId column to Entry, WorkDay, Callout
-- =====================================================
-- Run this in your Supabase SQL Editor BEFORE updating RLS policies
-- This adds per-user scoping to all user-owned tables
-- =====================================================

-- 1. Add userId column to Entry
ALTER TABLE "Entry" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- 2. Add userId column to WorkDay
ALTER TABLE "WorkDay" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- 3. Add userId column to Callout
ALTER TABLE "Callout" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- 4. Backfill existing data with a specific user ID
-- Replace 'YOUR_USER_ID_HERE' with the actual Supabase auth.uid() of the existing user
-- You can find this in Supabase Dashboard > Authentication > Users
-- Example: UPDATE "Entry" SET "userId" = 'abc123-def456-...' WHERE "userId" IS NULL;

-- UPDATE "Entry" SET "userId" = 'YOUR_USER_ID_HERE' WHERE "userId" IS NULL;
-- UPDATE "WorkDay" SET "userId" = 'YOUR_USER_ID_HERE' WHERE "userId" IS NULL;
-- UPDATE "Callout" SET "userId" = 'YOUR_USER_ID_HERE' WHERE "userId" IS NULL;

-- 5. After backfill, make userId NOT NULL
-- Only run these AFTER you've backfilled existing rows:
-- ALTER TABLE "Entry" ALTER COLUMN "userId" SET NOT NULL;
-- ALTER TABLE "WorkDay" ALTER COLUMN "userId" SET NOT NULL;
-- ALTER TABLE "Callout" ALTER COLUMN "userId" SET NOT NULL;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS "Entry_userId_idx" ON "Entry"("userId");
CREATE INDEX IF NOT EXISTS "WorkDay_userId_idx" ON "WorkDay"("userId");
CREATE INDEX IF NOT EXISTS "Callout_userId_idx" ON "Callout"("userId");

-- 7. Update WorkDay unique constraint to include userId
-- Drop the old constraint and create new one
ALTER TABLE "WorkDay" DROP CONSTRAINT IF EXISTS "WorkDay_date_locationId_key";
ALTER TABLE "WorkDay" ADD CONSTRAINT "WorkDay_date_locationId_userId_key" UNIQUE ("date", "locationId", "userId");
