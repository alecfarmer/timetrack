-- Migration: Rewards system foundation
-- 13 new tables for XP ledger, badges, challenges, streaks, shop, kudos, leaderboards

BEGIN;

-- ═══════════════════════════════════════════════════════════════
-- 1. TITLES (unlockable rank titles)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "Title" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "unlockCriteria" JSONB NOT NULL DEFAULT '{}',
  "sortOrder" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Title_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Title_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Title_orgId_idx" ON "Title"("orgId");

-- ═══════════════════════════════════════════════════════════════
-- 2. REWARDS PROFILE (cached user aggregates)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "RewardsProfile" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "totalXp" INT NOT NULL DEFAULT 0,
  "level" INT NOT NULL DEFAULT 1,
  "titleId" TEXT,
  "currentStreak" INT NOT NULL DEFAULT 0,
  "longestStreak" INT NOT NULL DEFAULT 0,
  "streakShields" INT NOT NULL DEFAULT 0,
  "lastStreakDate" DATE,
  "coins" INT NOT NULL DEFAULT 0,
  "xpMultiplier" NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  "showcaseBadges" TEXT[] NOT NULL DEFAULT '{}',
  "leaderboardOptIn" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "RewardsProfile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RewardsProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "RewardsProfile_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "RewardsProfile_userId_orgId_key" ON "RewardsProfile"("userId", "orgId");
CREATE INDEX IF NOT EXISTS "RewardsProfile_orgId_idx" ON "RewardsProfile"("orgId");
CREATE INDEX IF NOT EXISTS "RewardsProfile_totalXp_idx" ON "RewardsProfile"("orgId", "totalXp" DESC);

-- ═══════════════════════════════════════════════════════════════
-- 3. XP LEDGER (immutable append-only log)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "XpLedger" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "amount" INT NOT NULL,
  "reason" TEXT NOT NULL,
  "sourceType" TEXT,
  "sourceId" TEXT,
  "multiplier" NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "XpLedger_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "XpLedger_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "XpLedger_userId_orgId_idx" ON "XpLedger"("userId", "orgId");
CREATE INDEX IF NOT EXISTS "XpLedger_createdAt_idx" ON "XpLedger"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "XpLedger_reason_idx" ON "XpLedger"("reason");

-- ═══════════════════════════════════════════════════════════════
-- 4. BADGE DEFINITIONS (org-scoped badge catalog)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "BadgeDefinition" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "rarity" TEXT NOT NULL DEFAULT 'common',
  "xpReward" INT NOT NULL DEFAULT 0,
  "coinReward" INT NOT NULL DEFAULT 0,
  "isHidden" BOOLEAN NOT NULL DEFAULT false,
  "isSeasonal" BOOLEAN NOT NULL DEFAULT false,
  "seasonStart" DATE,
  "seasonEnd" DATE,
  "setId" TEXT,
  "criteria" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BadgeDefinition_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "BadgeDefinition_orgId_slug_key" ON "BadgeDefinition"("orgId", "slug");
CREATE INDEX IF NOT EXISTS "BadgeDefinition_orgId_idx" ON "BadgeDefinition"("orgId");
CREATE INDEX IF NOT EXISTS "BadgeDefinition_category_idx" ON "BadgeDefinition"("orgId", "category");

-- ═══════════════════════════════════════════════════════════════
-- 5. EARNED BADGES (user-badge join)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "EarnedBadge" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "badgeDefinitionId" TEXT NOT NULL,
  "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "notified" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "EarnedBadge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EarnedBadge_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "EarnedBadge_badgeDefinitionId_fkey" FOREIGN KEY ("badgeDefinitionId") REFERENCES "BadgeDefinition"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "EarnedBadge_userId_badgeDefId_key" ON "EarnedBadge"("userId", "badgeDefinitionId");
CREATE INDEX IF NOT EXISTS "EarnedBadge_userId_orgId_idx" ON "EarnedBadge"("userId", "orgId");
CREATE INDEX IF NOT EXISTS "EarnedBadge_earnedAt_idx" ON "EarnedBadge"("earnedAt" DESC);

-- ═══════════════════════════════════════════════════════════════
-- 6. STREAK HISTORY
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "StreakHistory" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE,
  "length" INT NOT NULL DEFAULT 0,
  "shieldsUsed" INT NOT NULL DEFAULT 0,
  "xpEarned" INT NOT NULL DEFAULT 0,
  "peakMultiplier" NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "StreakHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StreakHistory_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "StreakHistory_userId_orgId_idx" ON "StreakHistory"("userId", "orgId");
CREATE INDEX IF NOT EXISTS "StreakHistory_startDate_idx" ON "StreakHistory"("startDate" DESC);

-- ═══════════════════════════════════════════════════════════════
-- 7. CHALLENGE DEFINITIONS (challenge pool)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "ChallengeDefinition" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "criteria" JSONB NOT NULL DEFAULT '{}',
  "xpReward" INT NOT NULL DEFAULT 0,
  "coinReward" INT NOT NULL DEFAULT 0,
  "minLevel" INT NOT NULL DEFAULT 1,
  "isTeamChallenge" BOOLEAN NOT NULL DEFAULT false,
  "teamTarget" INT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "ChallengeDefinition_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChallengeDefinition_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ChallengeDefinition_orgId_idx" ON "ChallengeDefinition"("orgId");
CREATE INDEX IF NOT EXISTS "ChallengeDefinition_type_idx" ON "ChallengeDefinition"("orgId", "type");

-- ═══════════════════════════════════════════════════════════════
-- 8. ACTIVE CHALLENGES (assigned to users)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "ActiveChallenge" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT,
  "orgId" TEXT NOT NULL,
  "challengeDefinitionId" TEXT NOT NULL,
  "progress" INT NOT NULL DEFAULT 0,
  "target" INT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "xpReward" INT NOT NULL DEFAULT 0,
  "coinReward" INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "ActiveChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ActiveChallenge_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "ActiveChallenge_challengeDefId_fkey" FOREIGN KEY ("challengeDefinitionId") REFERENCES "ChallengeDefinition"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ActiveChallenge_userId_orgId_idx" ON "ActiveChallenge"("userId", "orgId");
CREATE INDEX IF NOT EXISTS "ActiveChallenge_status_idx" ON "ActiveChallenge"("status");
CREATE INDEX IF NOT EXISTS "ActiveChallenge_expiresAt_idx" ON "ActiveChallenge"("expiresAt");

-- ═══════════════════════════════════════════════════════════════
-- 9. REWARD SHOP ITEMS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "RewardShopItem" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT NOT NULL DEFAULT '🎁',
  "costCoins" INT NOT NULL DEFAULT 0,
  "costXp" INT NOT NULL DEFAULT 0,
  "category" TEXT NOT NULL DEFAULT 'perk',
  "stock" INT,
  "maxPerUser" INT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "RewardShopItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RewardShopItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "RewardShopItem_orgId_idx" ON "RewardShopItem"("orgId");

-- ═══════════════════════════════════════════════════════════════
-- 10. REDEMPTIONS (shop purchases)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "Redemption" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "shopItemId" TEXT NOT NULL,
  "costCoins" INT NOT NULL DEFAULT 0,
  "costXp" INT NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Redemption_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "Redemption_shopItemId_fkey" FOREIGN KEY ("shopItemId") REFERENCES "RewardShopItem"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Redemption_userId_orgId_idx" ON "Redemption"("userId", "orgId");
CREATE INDEX IF NOT EXISTS "Redemption_status_idx" ON "Redemption"("status");

-- ═══════════════════════════════════════════════════════════════
-- 11. KUDOS (peer recognition)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "Kudos" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'team_player',
  "message" TEXT,
  "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  "weekOf" DATE NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "Kudos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Kudos_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "Kudos_no_self" CHECK ("fromUserId" != "toUserId")
);

CREATE INDEX IF NOT EXISTS "Kudos_orgId_idx" ON "Kudos"("orgId");
CREATE INDEX IF NOT EXISTS "Kudos_toUserId_idx" ON "Kudos"("toUserId");
CREATE INDEX IF NOT EXISTS "Kudos_fromUserId_weekOf_idx" ON "Kudos"("fromUserId", "weekOf");

-- ═══════════════════════════════════════════════════════════════
-- 12. LEADERBOARD SNAPSHOTS (pre-computed rankings)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "LeaderboardSnapshot" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "periodStart" DATE NOT NULL,
  "periodEnd" DATE NOT NULL,
  "category" TEXT NOT NULL,
  "rankings" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "LeaderboardSnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeaderboardSnapshot_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "LeaderboardSnapshot_unique_key" ON "LeaderboardSnapshot"("orgId", "period", "periodStart", "category");
CREATE INDEX IF NOT EXISTS "LeaderboardSnapshot_orgId_idx" ON "LeaderboardSnapshot"("orgId");

-- ═══════════════════════════════════════════════════════════════
-- 13. REWARDS ACTIVITY (social feed)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "RewardsActivity" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "RewardsActivity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RewardsActivity_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "RewardsActivity_orgId_idx" ON "RewardsActivity"("orgId");
CREATE INDEX IF NOT EXISTS "RewardsActivity_createdAt_idx" ON "RewardsActivity"("orgId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "RewardsActivity_userId_idx" ON "RewardsActivity"("userId");

-- ═══════════════════════════════════════════════════════════════
-- 14. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE "Title" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RewardsProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "XpLedger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BadgeDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EarnedBadge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StreakHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChallengeDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActiveChallenge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RewardShopItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Redemption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Kudos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeaderboardSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RewardsActivity" ENABLE ROW LEVEL SECURITY;

-- Service role policies (full access for API routes)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'Title', 'RewardsProfile', 'XpLedger', 'BadgeDefinition', 'EarnedBadge',
    'StreakHistory', 'ChallengeDefinition', 'ActiveChallenge', 'RewardShopItem',
    'Redemption', 'Kudos', 'LeaderboardSnapshot', 'RewardsActivity'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "service_role_%s" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- Authenticated user read policies (org-scoped)
CREATE POLICY "auth_read_Title" ON "Title" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_RewardsProfile" ON "RewardsProfile" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_XpLedger" ON "XpLedger" FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text);

CREATE POLICY "auth_read_BadgeDefinition" ON "BadgeDefinition" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_EarnedBadge" ON "EarnedBadge" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_StreakHistory" ON "StreakHistory" FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text);

CREATE POLICY "auth_read_ChallengeDefinition" ON "ChallengeDefinition" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_ActiveChallenge" ON "ActiveChallenge" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_RewardShopItem" ON "RewardShopItem" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_Redemption" ON "Redemption" FOR SELECT TO authenticated
  USING ("userId" = auth.uid()::text);

CREATE POLICY "auth_read_Kudos" ON "Kudos" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_LeaderboardSnapshot" ON "LeaderboardSnapshot" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

CREATE POLICY "auth_read_RewardsActivity" ON "RewardsActivity" FOR SELECT TO authenticated
  USING ("orgId" IN (SELECT "orgId" FROM "Membership" WHERE "userId" = auth.uid()::text));

-- ═══════════════════════════════════════════════════════════════
-- 15. UPDATE ORG FEATURES DEFAULT (add gamification flags)
-- ═══════════════════════════════════════════════════════════════
UPDATE "Organization"
SET "features" = "features" || '{
  "gamification": true,
  "kudos": true,
  "leaderboard": true,
  "rewardShop": true,
  "kudosBudgetPerWeek": 5,
  "happyHour": null
}'::jsonb
WHERE NOT ("features" ? 'gamification');

COMMIT;
