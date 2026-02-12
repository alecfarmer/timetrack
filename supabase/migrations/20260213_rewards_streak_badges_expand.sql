-- Migration: Add 59 new streak badges to existing organizations
-- Expands streak category from 8 to 67 badges across 8 subcategories

BEGIN;

DO $$
DECLARE
  org_id TEXT;
BEGIN
  FOR org_id IN SELECT id FROM "Organization"
  LOOP

    INSERT INTO "BadgeDefinition" ("orgId", "slug", "name", "description", "icon", "category", "rarity", "xpReward", "coinReward", "isHidden", "criteria") VALUES
    -- ═══ Streak: Pure Milestones (6 new) ═══
    (org_id, 'full_week', 'Full Week', '7-day on-site streak — a perfect work week', '📅', 'streak', 'uncommon', 75, 15, false, '{"type":"streak","threshold":7}'),
    (org_id, 'monolith', 'Monolith', '25-day on-site streak — you are the rock', '🗿', 'streak', 'legendary', 600, 90, false, '{"type":"streak","threshold":25}'),
    (org_id, 'thirty_stack', 'Thirty Stack', '30-day on-site streak', '📦', 'streak', 'legendary', 750, 100, false, '{"type":"streak","threshold":30}'),
    (org_id, 'forty_forged', 'Forty Forged', '40-day on-site streak — forged in fire', '⚒️', 'streak', 'legendary', 900, 125, false, '{"type":"streak","threshold":40}'),
    (org_id, 'half_century_streak', 'Half Century', '50-day on-site streak', '🏅', 'streak', 'legendary', 1200, 175, false, '{"type":"streak","threshold":50}'),
    (org_id, 'diamond_streak', 'Diamond Streak', '75-day on-site streak — unbreakable', '💎', 'streak', 'legendary', 1500, 225, true, '{"type":"streak","threshold":75}'),
    (org_id, 'bicentennial', 'Bicentennial', '200-day on-site streak — a living legend', '🏛️', 'streak', 'legendary', 3000, 500, true, '{"type":"streak","threshold":200}'),
    (org_id, 'year_long', 'Year Long', '365-day on-site streak — an entire year', '🌍', 'streak', 'legendary', 5000, 1000, true, '{"type":"streak","threshold":365}'),

    -- ═══ Streak: Recovery & Resilience (6 new) ═══
    (org_id, 'bounceback', 'Bounceback', 'Start a new 5+ day streak within 3 days of losing one', '🏀', 'streak', 'rare', 75, 15, true, '{"type":"streak_comeback","minStreak":5,"maxGapDays":3}'),
    (org_id, 'twice_burned', 'Twice Burned', 'Reach a 10+ day streak twice after losing it', '🔁', 'streak', 'epic', 200, 40, true, '{"type":"streak_count","minStreak":10,"count":2}'),
    (org_id, 'unkillable', 'Unkillable', 'Reach a 20+ day streak 3 separate times', '☠️', 'streak', 'legendary', 500, 100, true, '{"type":"streak_count","minStreak":20,"count":3}'),
    (org_id, 'rubber_band', 'Rubber Band', 'Lose and rebuild a streak 5 times — you always snap back', '🪀', 'streak', 'rare', 100, 20, true, '{"type":"streak_rebuilds","count":5}'),
    (org_id, 'stubborn', 'Stubborn', 'Never go more than 2 days without clocking in for 30 days', '🐂', 'streak', 'epic', 250, 50, true, '{"type":"streak_no_gap","maxGapDays":2,"windowDays":30}'),
    (org_id, 'the_terminator', 'The Terminator', 'Rebuild to a longer streak than the one you lost', '🤖', 'streak', 'epic', 200, 40, true, '{"type":"streak_beat_previous"}'),

    -- ═══ Streak: Shield Mastery (7 new) ═══
    (org_id, 'shield_wall', 'Shield Wall', 'Use 5 streak shields total', '🏰', 'streak', 'epic', 200, 40, true, '{"type":"shields_used","threshold":5}'),
    (org_id, 'purist', 'Purist', '30+ day streak with zero shields used', '🧘', 'streak', 'epic', 300, 60, true, '{"type":"streak_no_shields","minStreak":30}'),
    (org_id, 'plot_armor', 'Plot Armor', 'Use a shield to save a 20+ day streak', '📖', 'streak', 'legendary', 350, 65, true, '{"type":"shield_save_streak","minStreak":20}'),
    (org_id, 'living_dangerously', 'Living Dangerously', 'Maintain a 15+ day streak with 0 shields available', '🎲', 'streak', 'epic', 250, 50, true, '{"type":"streak_zero_shields","minStreak":15}'),
    (org_id, 'insurance_policy', 'Insurance Policy', 'Hold 3+ shields unused during a 25+ day streak', '🏦', 'streak', 'rare', 125, 25, true, '{"type":"shields_unused_streak","minShields":3,"minStreak":25}'),
    (org_id, 'shield_hoarder', 'Shield Hoarder', 'Accumulate 5 shields at once', '🐉', 'streak', 'rare', 100, 20, true, '{"type":"shields_accumulated","threshold":5}'),
    (org_id, 'neo', 'Neo', 'Use a shield on the last workday before a weekend', '🕶️', 'streak', 'legendary', 200, 40, true, '{"type":"shield_before_weekend"}'),

    -- ═══ Streak: Personal Records (5 new) ═══
    (org_id, 'personal_best', 'Personal Best', 'Beat your previous longest streak', '🥇', 'streak', 'uncommon', 50, 10, false, '{"type":"personal_best"}'),
    (org_id, 'double_up', 'Double Up', 'Double your previous longest streak', '✌️', 'streak', 'epic', 250, 50, true, '{"type":"streak_double_previous"}'),
    (org_id, 'no_looking_back', 'No Looking Back', 'Beat your own streak record 3 separate times', '🚀', 'streak', 'epic', 300, 60, true, '{"type":"personal_best_count","count":3}'),
    (org_id, 'glass_ceiling', 'Glass Ceiling', 'Break past a streak length you''ve lost at 3+ times', '🔨', 'streak', 'rare', 150, 30, true, '{"type":"glass_ceiling","losses":3}'),
    (org_id, 'comfort_zone', 'Comfort Zone', 'Surpass your most common streak-end length', '🛋️', 'streak', 'uncommon', 40, 8, true, '{"type":"comfort_zone"}'),

    -- ═══ Streak: Multiplier & XP (6 new) ═══
    (org_id, 'supercharged', 'Supercharged', 'Reach 1.2x XP multiplier from a 10-day streak', '🔌', 'streak', 'uncommon', 50, 10, false, '{"type":"multiplier_reach","multiplier":1.2}'),
    (org_id, 'overdrive', 'Overdrive', 'Reach 1.4x XP multiplier from a 20-day streak', '🏎️', 'streak', 'rare', 100, 20, false, '{"type":"multiplier_reach","multiplier":1.4}'),
    (org_id, 'ludicrous_speed', 'Ludicrous Speed', 'Hit the 1.5x multiplier cap (25+ day streak)', '💨', 'streak', 'epic', 200, 40, false, '{"type":"multiplier_reach","multiplier":1.5}'),
    (org_id, 'xp_farmer', 'XP Farmer', 'Earn 500 XP during a single streak', '🌾', 'streak', 'rare', 100, 20, true, '{"type":"xp_during_streak","threshold":500}'),
    (org_id, 'xp_tycoon', 'XP Tycoon', 'Earn 2000 XP during a single streak', '💰', 'streak', 'legendary', 400, 75, true, '{"type":"xp_during_streak","threshold":2000}'),
    (org_id, 'the_compounding', 'The Compounding', 'Earn more bonus XP from multipliers than base XP in a single day', '📈', 'streak', 'epic', 175, 35, true, '{"type":"compounding_xp"}'),

    -- ═══ Streak: Calendar & Timing (10 new) ═══
    (org_id, 'month_slayer', 'Month Slayer', 'Maintain a streak spanning an entire calendar month', '🗓️', 'streak', 'epic', 300, 60, false, '{"type":"streak_spans_month"}'),
    (org_id, 'bridge_builder', 'Bridge Builder', 'Clock in on a weekend to keep a streak alive 3 times', '🌉', 'streak', 'rare', 100, 20, false, '{"type":"weekend_bridge","threshold":3}'),
    (org_id, 'monday_monster', 'Monday Monster', 'Continue a streak on Monday 20 times', '👹', 'streak', 'uncommon', 60, 12, false, '{"type":"monday_streak","threshold":20}'),
    (org_id, 'friday_finisher', 'Friday Finisher', 'End the work week on a streak 15 Fridays in a row', '🎉', 'streak', 'rare', 125, 25, false, '{"type":"friday_streak","threshold":15}'),
    (org_id, 'quarter_crusher', 'Quarter Crusher', 'Maintain a streak for an entire quarter (60+ work days)', '🏆', 'streak', 'legendary', 1500, 250, true, '{"type":"streak","threshold":60}'),
    (org_id, 'holiday_survivor', 'Holiday Survivor', 'Keep a streak alive through a holiday week', '🎄', 'streak', 'rare', 150, 30, false, '{"type":"streak_holiday_week"}'),
    (org_id, 'january_warrior', 'January Warrior', 'Maintain a streak for all of January', '❄️', 'streak', 'epic', 250, 50, false, '{"type":"streak_full_month","month":1}'),
    (org_id, 'summer_survivor', 'Summer Survivor', '20+ day streak during June through August', '🏖️', 'streak', 'rare', 150, 30, false, '{"type":"streak_season","months":[6,7,8],"minStreak":20}'),
    (org_id, 'dark_days', 'Dark Days', '15+ day streak during November or December', '🌑', 'streak', 'rare', 150, 30, false, '{"type":"streak_season","months":[11,12],"minStreak":15}'),
    (org_id, 'cross_month', 'Cross-Month', 'Maintain a streak that spans across 3+ calendar months', '🔀', 'streak', 'epic', 200, 40, true, '{"type":"streak_cross_months","months":3}'),

    -- ═══ Streak: Fun & Quirky (12 new) ═══
    (org_id, 'lucky_seven', 'Lucky Seven', 'Hit exactly a 7-day streak 3 separate times', '🎰', 'streak', 'rare', 75, 15, true, '{"type":"exact_streak_count","exactDays":7,"count":3}'),
    (org_id, 'double_digits', 'Double Digits', 'Reach a 10+ day streak for the 5th time', '🔟', 'streak', 'epic', 150, 30, true, '{"type":"streak_count","minStreak":10,"count":5}'),
    (org_id, 'triple_threat', 'Triple Threat', 'Have 3 separate 15+ day streaks', '3️⃣', 'streak', 'epic', 250, 50, true, '{"type":"streak_count","minStreak":15,"count":3}'),
    (org_id, 'the_answer', 'The Answer', 'Reach a 42-day streak — the answer to everything', '🐬', 'streak', 'rare', 175, 35, true, '{"type":"streak","threshold":42}'),
    (org_id, 'nice', 'Nice', 'Reach a 69-day streak', '😏', 'streak', 'rare', 200, 42, true, '{"type":"streak","threshold":69}'),
    (org_id, 'so_close', 'So Close', 'Reach a 99-day streak — almost there!', '😤', 'streak', 'epic', 300, 60, true, '{"type":"streak","threshold":99}'),
    (org_id, 'streak_collector', 'Streak Collector', 'Accumulate 100 total streak days across all streaks', '🃏', 'streak', 'rare', 125, 25, false, '{"type":"total_streak_days","threshold":100}'),
    (org_id, 'old_faithful', 'Old Faithful', 'Complete 10 separate streaks of 5+ days', '⛲', 'streak', 'uncommon', 75, 15, false, '{"type":"streak_count","minStreak":5,"count":10}'),
    (org_id, 'energizer', 'Energizer', '50 total streak days without any break longer than 3 days', '🔋', 'streak', 'rare', 100, 20, true, '{"type":"cumulative_no_long_break","totalDays":50,"maxBreak":3}'),
    (org_id, 'eternal_flame', 'Eternal Flame', '50+ day streak with at least 1 shield used along the way', '🕯️', 'streak', 'legendary', 400, 75, true, '{"type":"streak_with_shield","minStreak":50}'),
    (org_id, 'groundhog_day', 'Groundhog Day', 'Clock in at the same time (within 10 min) for 10 streak days', '🦫', 'streak', 'epic', 175, 35, true, '{"type":"streak_same_time","windowMinutes":10,"threshold":10}'),
    (org_id, 'fibonacci_streak', 'Fibonacci', 'Reach streak lengths of 3, 5, 8, 13, and 21 days', '🐚', 'streak', 'epic', 250, 50, true, '{"type":"streak_fibonacci","targets":[3,5,8,13,21]}'),

    -- ═══ Streak: Org & Social (5 new) ═══
    (org_id, 'highlander', 'Highlander', 'Hold the longest active streak in your organization', '⚔️', 'streak', 'legendary', 500, 100, true, '{"type":"org_longest_streak"}'),
    (org_id, 'pack_runner', 'Pack Runner', 'You and 3+ teammates all on 5+ day streaks at the same time', '🐺', 'streak', 'epic', 200, 40, true, '{"type":"team_simultaneous_streak","minTeammates":3,"minStreak":5}'),
    (org_id, 'streak_rival', 'Streak Rival', 'Match or beat another user''s streak within 1 day of theirs', '🤺', 'streak', 'rare', 100, 20, true, '{"type":"streak_match"}'),
    (org_id, 'trendsetter', 'Trendsetter', '3+ teammates start streaks within 2 days of your streak hitting 10', '📢', 'streak', 'legendary', 300, 60, true, '{"type":"streak_trendsetter","minFollowers":3,"triggerStreak":10}'),
    (org_id, 'last_one_standing', 'Last One Standing', 'Be the only person in your org with an active streak', '🏚️', 'streak', 'epic', 200, 40, true, '{"type":"org_only_streak"}')
    ON CONFLICT ("orgId", "slug") DO NOTHING;

    -- Also update the existing century_streak badge to use new XP/coin values
    UPDATE "BadgeDefinition"
    SET "xpReward" = 2000, "coinReward" = 300, "icon" = '💯'
    WHERE "orgId" = org_id AND "slug" = 'century_streak';

  END LOOP;
END $$;

COMMIT;
