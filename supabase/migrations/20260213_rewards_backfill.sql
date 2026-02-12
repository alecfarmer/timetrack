-- Migration: Backfill rewards data for existing users
-- Creates RewardsProfile, computes XP from badge history, inserts EarnedBadge + XpLedger

BEGIN;

DO $$
DECLARE
  r RECORD;
  user_xp INT;
  user_level INT;
  user_streak INT;
  user_longest INT;
  user_last_date DATE;
  badge_rec RECORD;
  streak_start DATE;
BEGIN
  -- For each user with WorkDay records, create a RewardsProfile
  FOR r IN
    SELECT DISTINCT w."userId", m."orgId"
    FROM "WorkDay" w
    JOIN "Membership" m ON m."userId" = w."userId"
    WHERE NOT EXISTS (
      SELECT 1 FROM "RewardsProfile" rp
      WHERE rp."userId" = w."userId" AND rp."orgId" = m."orgId"
    )
  LOOP
    -- Calculate total work days (all locations including HOME)
    SELECT COUNT(DISTINCT w."date")
    INTO user_xp
    FROM "WorkDay" w
    WHERE w."userId" = r."userId";

    -- Simple XP: 15 XP per work day as migration baseline
    user_xp := user_xp * 15;

    -- Calculate level from XP using the 20-level table
    user_level := CASE
      WHEN user_xp >= 65000 THEN 20
      WHEN user_xp >= 55000 THEN 19
      WHEN user_xp >= 46000 THEN 18
      WHEN user_xp >= 38000 THEN 17
      WHEN user_xp >= 31000 THEN 16
      WHEN user_xp >= 25000 THEN 15
      WHEN user_xp >= 20000 THEN 14
      WHEN user_xp >= 16000 THEN 13
      WHEN user_xp >= 12500 THEN 12
      WHEN user_xp >= 9500 THEN 11
      WHEN user_xp >= 7000 THEN 10
      WHEN user_xp >= 5000 THEN 9
      WHEN user_xp >= 3500 THEN 8
      WHEN user_xp >= 2400 THEN 7
      WHEN user_xp >= 1600 THEN 6
      WHEN user_xp >= 1000 THEN 5
      WHEN user_xp >= 600 THEN 4
      WHEN user_xp >= 300 THEN 3
      WHEN user_xp >= 100 THEN 2
      ELSE 1
    END;

    -- Calculate current streak (weekdays only, skip weekends)
    user_streak := 0;
    user_last_date := NULL;
    streak_start := NULL;

    FOR badge_rec IN
      SELECT DISTINCT w."date"
      FROM "WorkDay" w
      WHERE w."userId" = r."userId"
      ORDER BY w."date" DESC
    LOOP
      -- Skip weekends
      IF EXTRACT(DOW FROM badge_rec."date") IN (0, 6) THEN
        CONTINUE;
      END IF;

      IF user_last_date IS NULL THEN
        -- First record: check if it's today or yesterday (weekday)
        IF badge_rec."date" >= CURRENT_DATE - INTERVAL '1 day' THEN
          user_streak := 1;
          user_last_date := badge_rec."date";
          streak_start := badge_rec."date";
        ELSE
          EXIT;
        END IF;
      ELSE
        -- Check continuity (allow weekend gaps)
        IF badge_rec."date" = user_last_date - INTERVAL '1 day'
           OR (badge_rec."date" = user_last_date - INTERVAL '3 days'
               AND EXTRACT(DOW FROM user_last_date) = 1) THEN
          user_streak := user_streak + 1;
          user_last_date := badge_rec."date";
          streak_start := badge_rec."date";
        ELSE
          EXIT;
        END IF;
      END IF;
    END LOOP;

    -- Calculate longest streak
    user_longest := user_streak;

    -- Create RewardsProfile
    INSERT INTO "RewardsProfile" (
      "userId", "orgId", "totalXp", "level", "currentStreak",
      "longestStreak", "lastStreakDate", "coins", "xpMultiplier"
    ) VALUES (
      r."userId", r."orgId", user_xp, user_level, user_streak,
      user_longest, user_last_date, 0, 1.00 + LEAST(user_streak * 0.02, 0.50)
    ) ON CONFLICT ("userId", "orgId") DO NOTHING;

    -- Insert migration XP ledger entry
    INSERT INTO "XpLedger" (
      "userId", "orgId", "amount", "reason", "metadata"
    ) VALUES (
      r."userId", r."orgId", user_xp, 'MIGRATION',
      jsonb_build_object('source', 'backfill', 'daysComputed', user_xp / 15)
    );

    -- Create StreakHistory for active streak
    IF user_streak > 0 AND streak_start IS NOT NULL THEN
      INSERT INTO "StreakHistory" (
        "userId", "orgId", "startDate", "length",
        "xpEarned", "peakMultiplier"
      ) VALUES (
        r."userId", r."orgId", streak_start, user_streak,
        0, 1.00 + LEAST(user_streak * 0.02, 0.50)
      );
    END IF;

    -- Award earned badges based on current stats
    -- We check each badge definition's criteria against the user's data
    FOR badge_rec IN
      SELECT bd."id", bd."slug", bd."criteria", bd."xpReward", bd."coinReward"
      FROM "BadgeDefinition" bd
      WHERE bd."orgId" = r."orgId"
        AND bd."isHidden" = false
        AND bd."isSeasonal" = false
        AND NOT EXISTS (
          SELECT 1 FROM "EarnedBadge" eb
          WHERE eb."userId" = r."userId" AND eb."badgeDefinitionId" = bd."id"
        )
    LOOP
      -- Check threshold-type badges
      IF (badge_rec."criteria"->>'type') = 'threshold' THEN
        DECLARE
          stat_name TEXT := badge_rec."criteria"->>'stat';
          threshold INT := (badge_rec."criteria"->>'threshold')::int;
          stat_value INT := 0;
        BEGIN
          -- Compute the stat value
          IF stat_name = 'totalOnsiteDays' THEN
            SELECT COUNT(DISTINCT w."date") INTO stat_value
            FROM "WorkDay" w JOIN "Location" l ON l."id" = w."locationId"
            WHERE w."userId" = r."userId" AND l."category" != 'HOME';
          ELSIF stat_name = 'totalHours' THEN
            SELECT COALESCE(SUM(w."totalMinutes"), 0) / 60 INTO stat_value
            FROM "WorkDay" w WHERE w."userId" = r."userId";
          ELSIF stat_name = 'perfectWeeks' THEN
            SELECT COUNT(*) INTO stat_value FROM (
              SELECT date_trunc('week', w."date") AS wk
              FROM "WorkDay" w JOIN "Location" l ON l."id" = w."locationId"
              WHERE w."userId" = r."userId" AND l."category" != 'HOME'
              GROUP BY wk HAVING COUNT(DISTINCT w."date") >= 3
            ) sub;
          ELSIF stat_name = 'fullDays' THEN
            SELECT COUNT(*) INTO stat_value
            FROM "WorkDay" w WHERE w."userId" = r."userId" AND w."totalMinutes" >= 480;
          ELSIF stat_name = 'overtimeDays' THEN
            SELECT COUNT(*) INTO stat_value
            FROM "WorkDay" w WHERE w."userId" = r."userId" AND w."totalMinutes" >= 600;
          ELSIF stat_name = 'breaksTaken' THEN
            SELECT COUNT(*) INTO stat_value
            FROM "WorkDay" w WHERE w."userId" = r."userId" AND w."breakMinutes" > 0;
          ELSIF stat_name = 'weekendDays' THEN
            SELECT COUNT(*) INTO stat_value
            FROM "WorkDay" w WHERE w."userId" = r."userId"
              AND EXTRACT(DOW FROM w."date") IN (0, 6);
          ELSIF stat_name = 'earlyBirdCount' THEN
            SELECT COUNT(*) INTO stat_value
            FROM "WorkDay" w WHERE w."userId" = r."userId"
              AND w."firstClockIn" IS NOT NULL
              AND EXTRACT(HOUR FROM w."firstClockIn") < 8;
          ELSIF stat_name = 'nightOwlCount' THEN
            SELECT COUNT(*) INTO stat_value
            FROM "WorkDay" w WHERE w."userId" = r."userId"
              AND w."lastClockOut" IS NOT NULL
              AND EXTRACT(HOUR FROM w."lastClockOut") >= 19;
          ELSIF stat_name = 'onTimeCount' THEN
            SELECT COUNT(*) INTO stat_value
            FROM "WorkDay" w WHERE w."userId" = r."userId"
              AND w."firstClockIn" IS NOT NULL
              AND EXTRACT(HOUR FROM w."firstClockIn") BETWEEN 9 AND 10;
          END IF;

          IF stat_value >= threshold THEN
            INSERT INTO "EarnedBadge" ("userId", "orgId", "badgeDefinitionId", "notified")
            VALUES (r."userId", r."orgId", badge_rec."id", true)
            ON CONFLICT ("userId", "badgeDefinitionId") DO NOTHING;

            -- Add badge XP to total
            user_xp := user_xp + badge_rec."xpReward";
          END IF;
        END;
      END IF;

      -- Check streak-type badges
      IF (badge_rec."criteria"->>'type') = 'streak' THEN
        IF user_longest >= (badge_rec."criteria"->>'threshold')::int THEN
          INSERT INTO "EarnedBadge" ("userId", "orgId", "badgeDefinitionId", "notified")
          VALUES (r."userId", r."orgId", badge_rec."id", true)
          ON CONFLICT ("userId", "badgeDefinitionId") DO NOTHING;

          user_xp := user_xp + badge_rec."xpReward";
        END IF;
      END IF;
    END LOOP;

    -- Update the profile with badge XP added
    UPDATE "RewardsProfile"
    SET "totalXp" = user_xp,
        "level" = CASE
          WHEN user_xp >= 65000 THEN 20
          WHEN user_xp >= 55000 THEN 19
          WHEN user_xp >= 46000 THEN 18
          WHEN user_xp >= 38000 THEN 17
          WHEN user_xp >= 31000 THEN 16
          WHEN user_xp >= 25000 THEN 15
          WHEN user_xp >= 20000 THEN 14
          WHEN user_xp >= 16000 THEN 13
          WHEN user_xp >= 12500 THEN 12
          WHEN user_xp >= 9500 THEN 11
          WHEN user_xp >= 7000 THEN 10
          WHEN user_xp >= 5000 THEN 9
          WHEN user_xp >= 3500 THEN 8
          WHEN user_xp >= 2400 THEN 7
          WHEN user_xp >= 1600 THEN 6
          WHEN user_xp >= 1000 THEN 5
          WHEN user_xp >= 600 THEN 4
          WHEN user_xp >= 300 THEN 3
          WHEN user_xp >= 100 THEN 2
          ELSE 1
        END
    WHERE "userId" = r."userId" AND "orgId" = r."orgId";

  END LOOP;
END $$;

COMMIT;
