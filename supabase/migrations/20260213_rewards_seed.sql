-- Migration: Seed default badge definitions, challenge definitions, and titles
-- for all existing organizations

BEGIN;

-- Seed badges, challenges, and titles for each existing org
DO $$
DECLARE
  org_id TEXT;
BEGIN
  FOR org_id IN SELECT id FROM "Organization"
  LOOP

    -- ═══════════════════════════════════════════════════════════
    -- TITLES
    -- ═══════════════════════════════════════════════════════════
    INSERT INTO "Title" ("orgId", "name", "description", "unlockCriteria", "sortOrder") VALUES
    (org_id, 'Newcomer', 'Just getting started', '{"type":"level","level":1}', 1),
    (org_id, 'Regular', 'A familiar face', '{"type":"level","level":2}', 2),
    (org_id, 'Committed', 'Showing dedication', '{"type":"level","level":3}', 3),
    (org_id, 'Dedicated', 'Truly dependable', '{"type":"level","level":4}', 4),
    (org_id, 'Reliable', 'Always there', '{"type":"level","level":5}', 5),
    (org_id, 'Dependable', 'Rock solid', '{"type":"level","level":6}', 6),
    (org_id, 'Standout', 'Rising above', '{"type":"level","level":7}', 7),
    (org_id, 'Star', 'Shining bright', '{"type":"level","level":8}', 8),
    (org_id, 'Ace', 'Top performer', '{"type":"level","level":9}', 9),
    (org_id, 'Champion', 'A true champion', '{"type":"level","level":10}', 10),
    (org_id, 'Hero', 'Leading by example', '{"type":"level","level":11}', 11),
    (org_id, 'Elite', 'Among the best', '{"type":"level","level":12}', 12),
    (org_id, 'Master', 'Mastered the craft', '{"type":"level","level":13}', 13),
    (org_id, 'Grandmaster', 'Exceptional mastery', '{"type":"level","level":14}', 14),
    (org_id, 'Legend', 'Legendary status', '{"type":"level","level":15}', 15),
    (org_id, 'Mythic', 'Beyond legend', '{"type":"level","level":16}', 16),
    (org_id, 'Titan', 'Unstoppable force', '{"type":"level","level":17}', 17),
    (org_id, 'Immortal', 'Timeless excellence', '{"type":"level","level":18}', 18),
    (org_id, 'Transcendent', 'Above and beyond', '{"type":"level","level":19}', 19),
    (org_id, 'Apex', 'The pinnacle', '{"type":"level","level":20}', 20),
    -- Collection set titles
    (org_id, 'Timekeeper', 'Master of all hours', '{"type":"badge_set","setId":"time_master"}', 100),
    (org_id, 'The Connector', 'Social butterfly', '{"type":"badge_set","setId":"social_butterfly"}', 101),
    (org_id, 'Ironclad', 'Unbreakable resolve', '{"type":"badge_set","setId":"iron"}', 102)
    ON CONFLICT DO NOTHING;

    -- ═══════════════════════════════════════════════════════════
    -- BADGE DEFINITIONS — Streak (8)
    -- ═══════════════════════════════════════════════════════════
    INSERT INTO "BadgeDefinition" ("orgId", "slug", "name", "description", "icon", "category", "rarity", "xpReward", "coinReward", "isHidden", "criteria") VALUES
    (org_id, 'first_spark', 'First Spark', '3-day on-site streak', '🔥', 'streak', 'common', 15, 5, false, '{"type":"streak","threshold":3}'),
    (org_id, 'week_warrior', 'Week Warrior', '5-day on-site streak', '⚡', 'streak', 'uncommon', 50, 10, false, '{"type":"streak","threshold":5}'),
    (org_id, 'unstoppable', 'Unstoppable', '10-day on-site streak', '🔥', 'streak', 'rare', 100, 20, false, '{"type":"streak","threshold":10}'),
    (org_id, 'on_fire', 'On Fire', '15-day on-site streak', '🌋', 'streak', 'epic', 200, 35, false, '{"type":"streak","threshold":15}'),
    (org_id, 'iron_will', 'Iron Will', '20-day on-site streak', '💪', 'streak', 'legendary', 500, 75, false, '{"type":"streak","threshold":20}'),
    (org_id, 'phoenix', 'Phoenix', 'Recover a 10+ day streak after a break', '🐦‍🔥', 'streak', 'legendary', 300, 50, true, '{"type":"streak_recovery","minPreviousStreak":10}'),
    (org_id, 'shield_master', 'Shield Master', 'Use 3 streak shields', '🛡️', 'streak', 'rare', 100, 25, true, '{"type":"shields_used","threshold":3}'),
    (org_id, 'century_streak', 'Century Streak', '100-day on-site streak', '💎', 'streak', 'legendary', 1000, 200, true, '{"type":"streak","threshold":100}'),

    -- Milestone (8)
    (org_id, 'first_day', 'First Day', 'Complete your first on-site day', '🎯', 'milestone', 'common', 10, 5, false, '{"type":"threshold","stat":"totalOnsiteDays","threshold":1}'),
    (org_id, 'half_century', 'Half Century', '50 total on-site days', '🎖️', 'milestone', 'uncommon', 75, 15, false, '{"type":"threshold","stat":"totalOnsiteDays","threshold":50}'),
    (org_id, 'centurion', 'Centurion', '100 total on-site days', '🏛️', 'milestone', 'rare', 200, 40, false, '{"type":"threshold","stat":"totalOnsiteDays","threshold":100}'),
    (org_id, 'veteran', 'Veteran', '250 total on-site days', '💎', 'milestone', 'epic', 500, 80, false, '{"type":"threshold","stat":"totalOnsiteDays","threshold":250}'),
    (org_id, 'lifer', 'Lifer', '500 total on-site days', '👑', 'milestone', 'legendary', 1000, 150, false, '{"type":"threshold","stat":"totalOnsiteDays","threshold":500}'),
    (org_id, 'century_club', 'Century Club', '100 total hours tracked', '💯', 'milestone', 'uncommon', 50, 10, false, '{"type":"threshold","stat":"totalHours","threshold":100}'),
    (org_id, 'dedicated_hours', 'Dedicated', '500 total hours tracked', '🌟', 'milestone', 'rare', 150, 30, false, '{"type":"threshold","stat":"totalHours","threshold":500}'),
    (org_id, 'time_lord', 'Time Lord', '2000 total hours tracked', '⏳', 'milestone', 'legendary', 750, 125, false, '{"type":"threshold","stat":"totalHours","threshold":2000}'),

    -- Time-Based (8)
    (org_id, 'early_bird', 'Early Bird', 'Clock in before 8am 10 times', '🐦', 'time', 'uncommon', 50, 10, false, '{"type":"threshold","stat":"earlyBirdCount","threshold":10}'),
    (org_id, 'dawn_patrol', 'Dawn Patrol', 'Clock in before 7am 25 times', '🌅', 'time', 'rare', 150, 30, false, '{"type":"threshold","stat":"dawnPatrolCount","threshold":25}'),
    (org_id, 'night_owl', 'Night Owl', 'Clock out after 7pm 10 times', '🦉', 'time', 'uncommon', 50, 10, false, '{"type":"threshold","stat":"nightOwlCount","threshold":10}'),
    (org_id, 'punctual', 'Punctual', 'Clock in 9-10am 20 times', '⏰', 'time', 'uncommon', 40, 8, false, '{"type":"threshold","stat":"onTimeCount","threshold":20}'),
    (org_id, 'clockwork', 'Clockwork', 'Clock in within 5min of same time for 10 days', '⚙️', 'time', 'epic', 200, 40, true, '{"type":"consistency_window","windowMinutes":5,"threshold":10}'),
    (org_id, 'marathon', 'Marathon', 'Work a 10+ hour day', '🏃', 'time', 'rare', 75, 15, false, '{"type":"threshold","stat":"overtimeDays","threshold":1}'),
    (org_id, 'overtime_hero', 'Overtime Hero', 'Work 10+ hour days 10 times', '🦸', 'time', 'epic', 200, 40, false, '{"type":"threshold","stat":"overtimeDays","threshold":10}'),
    (org_id, 'full_timer', 'Full Timer', 'Work 8+ hour days 50 times', '📊', 'time', 'rare', 125, 25, false, '{"type":"threshold","stat":"fullDays","threshold":50}'),

    -- Consistency (6)
    (org_id, 'perfect_week', 'Perfect Week', 'First week with 3+ on-site days', '✅', 'consistency', 'common', 25, 5, false, '{"type":"threshold","stat":"perfectWeeks","threshold":1}'),
    (org_id, 'consistency_king', 'Consistency King', '10 perfect weeks', '👑', 'consistency', 'rare', 150, 30, false, '{"type":"threshold","stat":"perfectWeeks","threshold":10}'),
    (org_id, 'routine_master', 'Routine Master', '20 perfect weeks', '🎭', 'consistency', 'epic', 300, 60, false, '{"type":"threshold","stat":"perfectWeeks","threshold":20}'),
    (org_id, 'monthly_master', 'Monthly Master', '15+ on-site days in a month', '🏆', 'consistency', 'rare', 100, 20, false, '{"type":"threshold","stat":"thisMonthDays","threshold":15}'),
    (org_id, 'quarter_champion', 'Quarter Champion', '3 consecutive months qualifying', '🎯', 'consistency', 'epic', 250, 50, false, '{"type":"consecutive_months","threshold":3}'),
    (org_id, 'annual_legend', 'Annual Legend', '50+ qualifying weeks in a year', '🌟', 'consistency', 'legendary', 500, 100, false, '{"type":"qualifying_weeks_year","threshold":50}'),

    -- Social (6)
    (org_id, 'first_kudos', 'First Kudos', 'Give your first kudos', '👏', 'social', 'common', 10, 5, false, '{"type":"threshold","stat":"kudosGiven","threshold":1}'),
    (org_id, 'cheerleader', 'Cheerleader', 'Give 25 kudos', '📣', 'social', 'rare', 75, 15, false, '{"type":"threshold","stat":"kudosGiven","threshold":25}'),
    (org_id, 'beloved', 'Beloved', 'Receive 10 kudos', '❤️', 'social', 'uncommon', 50, 10, false, '{"type":"threshold","stat":"kudosReceived","threshold":10}'),
    (org_id, 'team_mvp', 'Team MVP', 'Receive 25 kudos', '🏅', 'social', 'rare', 150, 30, false, '{"type":"threshold","stat":"kudosReceived","threshold":25}'),
    (org_id, 'inspiration', 'Inspiration', 'Receive 50 kudos', '✨', 'social', 'epic', 300, 60, false, '{"type":"threshold","stat":"kudosReceived","threshold":50}'),
    (org_id, 'kudos_monarch', 'Kudos Monarch', 'Most kudos received in a month', '👑', 'social', 'legendary', 500, 100, true, '{"type":"kudos_top_monthly"}'),

    -- Special (6)
    (org_id, 'break_champion', 'Break Champion', 'Take breaks on 20 work days', '☕', 'special', 'uncommon', 40, 8, false, '{"type":"threshold","stat":"breaksTaken","threshold":20}'),
    (org_id, 'weekend_warrior', 'Weekend Warrior', 'Work 5 weekend days', '🗓️', 'special', 'rare', 100, 20, false, '{"type":"threshold","stat":"weekendDays","threshold":5}'),
    (org_id, 'challenge_crusher', 'Challenge Crusher', 'Complete 10 challenges', '💥', 'special', 'rare', 100, 20, false, '{"type":"threshold","stat":"challengesCompleted","threshold":10}'),
    (org_id, 'completionist', 'Completionist', 'Complete 25 challenges', '🏆', 'special', 'epic', 250, 50, false, '{"type":"threshold","stat":"challengesCompleted","threshold":25}'),
    (org_id, 'treasure_hunter', 'Treasure Hunter', 'Discover 3 hidden badges', '🗝️', 'special', 'rare', 150, 30, true, '{"type":"threshold","stat":"hiddenBadgesFound","threshold":3}'),
    (org_id, 'the_collector', 'The Collector', 'Complete any badge collection set', '📚', 'special', 'epic', 200, 50, false, '{"type":"badge_set_complete","anySet":true}'),

    -- Seasonal (4)
    (org_id, 'new_year_resolve', 'New Year Resolve', 'Clock in on January 2nd', '🎆', 'seasonal', 'rare', 100, 25, false, '{"type":"seasonal_date","month":1,"day":2}'),
    (org_id, 'summer_grind', 'Summer Grind', '15 on-site days in July', '☀️', 'seasonal', 'rare', 150, 30, true, '{"type":"seasonal_month","month":7,"threshold":15}'),
    (org_id, 'holiday_hero', 'Holiday Hero', 'Work on a holiday', '🎄', 'seasonal', 'epic', 200, 40, false, '{"type":"holiday_work"}'),
    (org_id, 'anniversary', 'Anniversary', '1 year on the platform', '🎂', 'seasonal', 'epic', 300, 60, false, '{"type":"tenure_days","threshold":365}')
    ON CONFLICT ("orgId", "slug") DO NOTHING;

    -- Set collection IDs for badge sets
    UPDATE "BadgeDefinition" SET "setId" = 'time_master'
    WHERE "orgId" = org_id AND "slug" IN ('early_bird', 'night_owl', 'punctual', 'marathon');

    UPDATE "BadgeDefinition" SET "setId" = 'social_butterfly'
    WHERE "orgId" = org_id AND "slug" IN ('first_kudos', 'cheerleader', 'beloved');

    UPDATE "BadgeDefinition" SET "setId" = 'iron'
    WHERE "orgId" = org_id AND "slug" IN ('iron_will', 'full_timer', 'consistency_king');

    -- ═══════════════════════════════════════════════════════════
    -- CHALLENGE DEFINITIONS
    -- ═══════════════════════════════════════════════════════════

    -- Daily challenges
    INSERT INTO "ChallengeDefinition" ("orgId", "name", "description", "icon", "type", "criteria", "xpReward", "coinReward", "minLevel") VALUES
    (org_id, 'Early Start', 'Clock in before 9am', '🌅', 'daily', '{"type":"clock_in_before","hour":9}', 15, 3, 1),
    (org_id, 'Take a Break', 'Take a break today', '☕', 'daily', '{"type":"take_break"}', 10, 2, 1),
    (org_id, 'Full Day', 'Work 6+ hours today', '💪', 'daily', '{"type":"work_hours","hours":6}', 20, 5, 1),
    (org_id, 'On Time', 'Clock in between 8-9am', '⏰', 'daily', '{"type":"clock_in_window","startHour":8,"endHour":9}', 15, 3, 1),
    (org_id, 'Extended Day', 'Work 8+ hours today', '📊', 'daily', '{"type":"work_hours","hours":8}', 25, 5, 3),
    (org_id, 'Early Finish', 'Clock out before 5pm after 6+ hours', '🏃', 'daily', '{"type":"early_finish","hour":17,"minHours":6}', 15, 3, 2),

    -- Weekly challenges
    (org_id, 'Weekly Regular', 'Clock in 3 days this week', '📅', 'weekly', '{"type":"days_this_week","threshold":3}', 50, 10, 1),
    (org_id, 'Perfect Attendance', 'Clock in all 5 weekdays', '⭐', 'weekly', '{"type":"days_this_week","threshold":5}', 75, 15, 3),
    (org_id, 'Early Bird Week', 'Clock in before 9am 3 times this week', '🐦', 'weekly', '{"type":"early_days_week","hour":9,"threshold":3}', 40, 8, 2),
    (org_id, 'Break Taker', 'Take breaks on 3 days this week', '☕', 'weekly', '{"type":"break_days_week","threshold":3}', 35, 7, 2),
    (org_id, 'Streak Builder', 'Build a 5-day streak', '🔥', 'weekly', '{"type":"streak_reach","threshold":5}', 75, 15, 1),
    (org_id, 'Full Week', 'Work 30+ hours this week', '💪', 'weekly', '{"type":"weekly_hours","hours":30}', 60, 12, 4),

    -- Monthly challenges
    (org_id, 'Monthly Regular', 'Clock in 15+ days this month', '🗓️', 'monthly', '{"type":"days_this_month","threshold":15}', 200, 50, 1),
    (org_id, 'Monthly Streak', 'Maintain a 15-day streak', '🔥', 'monthly', '{"type":"streak_reach","threshold":15}', 250, 60, 5),
    (org_id, 'Consistency Champion', 'Clock in 18+ days this month', '🏆', 'monthly', '{"type":"days_this_month","threshold":18}', 300, 75, 3),

    -- Team challenges
    (org_id, 'Team Spirit', 'Team clocks in 50 times this week', '🤝', 'team', '{"type":"team_clock_ins","threshold":50}', 100, 25, 1, true, 50),
    (org_id, 'Team Streak', 'Every team member clocks in on the same day', '⚡', 'team', '{"type":"team_full_day"}', 150, 35, 1, true, NULL),

    -- Personal (user-selected)
    (org_id, 'Break Habit', 'Take breaks every day for a week', '☕', 'personal', '{"type":"break_streak","threshold":5}', 50, 10, 1),
    (org_id, 'Punctuality Goal', 'Clock in on time (9-10am) 10 times', '⏰', 'personal', '{"type":"on_time_count","threshold":10}', 75, 15, 2),
    (org_id, 'Hour Builder', 'Log 40 hours in a week', '📊', 'personal', '{"type":"weekly_hours","hours":40}', 100, 25, 5),
    (org_id, 'Streak Master', 'Reach a 10-day streak', '🔥', 'personal', '{"type":"streak_reach","threshold":10}', 100, 25, 3)
    ON CONFLICT DO NOTHING;

  END LOOP;
END $$;

COMMIT;
