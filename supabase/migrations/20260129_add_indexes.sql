-- Add indexes on frequently queried columns that are missing indexes.
-- These improve query performance for the most common access patterns.

-- Entry: queried by locationId for location-scoped entry lists
CREATE INDEX IF NOT EXISTS "Entry_locationId_idx" ON "Entry" ("locationId");

-- Entry: queried by timestampServer for date-range filters
CREATE INDEX IF NOT EXISTS "Entry_timestampServer_idx" ON "Entry" ("timestampServer");

-- WorkDay: queried by date for weekly/monthly reports
CREATE INDEX IF NOT EXISTS "WorkDay_date_idx" ON "WorkDay" ("date");

-- Callout: queried by userId + timeReceived for active callout lookups
CREATE INDEX IF NOT EXISTS "Callout_userId_timeReceived_idx" ON "Callout" ("userId", "timeReceived");

-- LeaveRequest: queried by date range for month/year views
CREATE INDEX IF NOT EXISTS "LeaveRequest_date_idx" ON "LeaveRequest" ("date");
