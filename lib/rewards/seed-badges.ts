import { supabaseAdmin } from "@/lib/supabase"

/**
 * Seed default badge definitions, challenge definitions, and titles for a new org.
 * Called when a new organization is created.
 */
export async function seedRewardsForOrg(orgId: string): Promise<void> {
  // Seed titles
  const titles = [
    { name: "Newcomer", description: "Just getting started", unlockCriteria: { type: "level", level: 1 }, sortOrder: 1 },
    { name: "Regular", description: "A familiar face", unlockCriteria: { type: "level", level: 2 }, sortOrder: 2 },
    { name: "Committed", description: "Showing dedication", unlockCriteria: { type: "level", level: 3 }, sortOrder: 3 },
    { name: "Dedicated", description: "Truly dependable", unlockCriteria: { type: "level", level: 4 }, sortOrder: 4 },
    { name: "Reliable", description: "Always there", unlockCriteria: { type: "level", level: 5 }, sortOrder: 5 },
    { name: "Dependable", description: "Rock solid", unlockCriteria: { type: "level", level: 6 }, sortOrder: 6 },
    { name: "Standout", description: "Rising above", unlockCriteria: { type: "level", level: 7 }, sortOrder: 7 },
    { name: "Star", description: "Shining bright", unlockCriteria: { type: "level", level: 8 }, sortOrder: 8 },
    { name: "Ace", description: "Top performer", unlockCriteria: { type: "level", level: 9 }, sortOrder: 9 },
    { name: "Champion", description: "A true champion", unlockCriteria: { type: "level", level: 10 }, sortOrder: 10 },
    { name: "Hero", description: "Leading by example", unlockCriteria: { type: "level", level: 11 }, sortOrder: 11 },
    { name: "Elite", description: "Among the best", unlockCriteria: { type: "level", level: 12 }, sortOrder: 12 },
    { name: "Master", description: "Mastered the craft", unlockCriteria: { type: "level", level: 13 }, sortOrder: 13 },
    { name: "Grandmaster", description: "Exceptional mastery", unlockCriteria: { type: "level", level: 14 }, sortOrder: 14 },
    { name: "Legend", description: "Legendary status", unlockCriteria: { type: "level", level: 15 }, sortOrder: 15 },
    { name: "Mythic", description: "Beyond legend", unlockCriteria: { type: "level", level: 16 }, sortOrder: 16 },
    { name: "Titan", description: "Unstoppable force", unlockCriteria: { type: "level", level: 17 }, sortOrder: 17 },
    { name: "Immortal", description: "Timeless excellence", unlockCriteria: { type: "level", level: 18 }, sortOrder: 18 },
    { name: "Transcendent", description: "Above and beyond", unlockCriteria: { type: "level", level: 19 }, sortOrder: 19 },
    { name: "Apex", description: "The pinnacle", unlockCriteria: { type: "level", level: 20 }, sortOrder: 20 },
    { name: "Timekeeper", description: "Master of all hours", unlockCriteria: { type: "badge_set", setId: "time_master" }, sortOrder: 100 },
    { name: "The Connector", description: "Social butterfly", unlockCriteria: { type: "badge_set", setId: "social_butterfly" }, sortOrder: 101 },
    { name: "Ironclad", description: "Unbreakable resolve", unlockCriteria: { type: "badge_set", setId: "iron" }, sortOrder: 102 },
  ]

  await supabaseAdmin.from("Title").insert(
    titles.map((t) => ({ orgId, ...t }))
  )

  // Seed badge definitions (same as the SQL seed migration)
  const badges = [
    // ═══ Streak — Pure Milestones (14) ═══
    { slug: "first_spark", name: "First Spark", description: "3-day on-site streak", icon: "🔥", category: "streak", rarity: "common", xpReward: 15, coinReward: 5, criteria: { type: "streak", threshold: 3 } },
    { slug: "week_warrior", name: "Week Warrior", description: "5-day on-site streak", icon: "⚡", category: "streak", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "streak", threshold: 5 } },
    { slug: "full_week", name: "Full Week", description: "7-day on-site streak — a perfect work week", icon: "📅", category: "streak", rarity: "uncommon", xpReward: 75, coinReward: 15, criteria: { type: "streak", threshold: 7 } },
    { slug: "unstoppable", name: "Unstoppable", description: "10-day on-site streak", icon: "🔥", category: "streak", rarity: "rare", xpReward: 100, coinReward: 20, criteria: { type: "streak", threshold: 10 } },
    { slug: "on_fire", name: "On Fire", description: "15-day on-site streak", icon: "🌋", category: "streak", rarity: "epic", xpReward: 200, coinReward: 35, criteria: { type: "streak", threshold: 15 } },
    { slug: "iron_will", name: "Iron Will", description: "20-day on-site streak", icon: "💪", category: "streak", rarity: "legendary", xpReward: 500, coinReward: 75, criteria: { type: "streak", threshold: 20 }, setId: "iron" },
    { slug: "monolith", name: "Monolith", description: "25-day on-site streak — you are the rock", icon: "🗿", category: "streak", rarity: "legendary", xpReward: 600, coinReward: 90, criteria: { type: "streak", threshold: 25 } },
    { slug: "thirty_stack", name: "Thirty Stack", description: "30-day on-site streak", icon: "📦", category: "streak", rarity: "legendary", xpReward: 750, coinReward: 100, criteria: { type: "streak", threshold: 30 } },
    { slug: "forty_forged", name: "Forty Forged", description: "40-day on-site streak — forged in fire", icon: "⚒️", category: "streak", rarity: "legendary", xpReward: 900, coinReward: 125, criteria: { type: "streak", threshold: 40 } },
    { slug: "half_century_streak", name: "Half Century", description: "50-day on-site streak", icon: "🏅", category: "streak", rarity: "legendary", xpReward: 1200, coinReward: 175, criteria: { type: "streak", threshold: 50 } },
    { slug: "diamond_streak", name: "Diamond Streak", description: "75-day on-site streak — unbreakable", icon: "💎", category: "streak", rarity: "legendary", xpReward: 1500, coinReward: 225, isHidden: true, criteria: { type: "streak", threshold: 75 } },
    { slug: "century_streak", name: "Century Streak", description: "100-day on-site streak", icon: "💯", category: "streak", rarity: "legendary", xpReward: 2000, coinReward: 300, isHidden: true, criteria: { type: "streak", threshold: 100 } },
    { slug: "bicentennial", name: "Bicentennial", description: "200-day on-site streak — a living legend", icon: "🏛️", category: "streak", rarity: "legendary", xpReward: 3000, coinReward: 500, isHidden: true, criteria: { type: "streak", threshold: 200 } },
    { slug: "year_long", name: "Year Long", description: "365-day on-site streak — an entire year", icon: "🌍", category: "streak", rarity: "legendary", xpReward: 5000, coinReward: 1000, isHidden: true, criteria: { type: "streak", threshold: 365 } },

    // ═══ Streak — Recovery & Resilience (7) ═══
    { slug: "phoenix", name: "Phoenix", description: "Recover a 10+ day streak after a break", icon: "🐦‍🔥", category: "streak", rarity: "legendary", xpReward: 300, coinReward: 50, isHidden: true, criteria: { type: "streak_recovery", minPreviousStreak: 10 } },
    { slug: "bounceback", name: "Bounceback", description: "Start a new 5+ day streak within 3 days of losing one", icon: "🏀", category: "streak", rarity: "rare", xpReward: 75, coinReward: 15, isHidden: true, criteria: { type: "streak_comeback", minStreak: 5, maxGapDays: 3 } },
    { slug: "twice_burned", name: "Twice Burned", description: "Reach a 10+ day streak twice after losing it", icon: "🔁", category: "streak", rarity: "epic", xpReward: 200, coinReward: 40, isHidden: true, criteria: { type: "streak_count", minStreak: 10, count: 2 } },
    { slug: "unkillable", name: "Unkillable", description: "Reach a 20+ day streak 3 separate times", icon: "☠️", category: "streak", rarity: "legendary", xpReward: 500, coinReward: 100, isHidden: true, criteria: { type: "streak_count", minStreak: 20, count: 3 } },
    { slug: "rubber_band", name: "Rubber Band", description: "Lose and rebuild a streak 5 times — you always snap back", icon: "🪀", category: "streak", rarity: "rare", xpReward: 100, coinReward: 20, isHidden: true, criteria: { type: "streak_rebuilds", count: 5 } },
    { slug: "stubborn", name: "Stubborn", description: "Never go more than 2 days without clocking in for 30 days", icon: "🐂", category: "streak", rarity: "epic", xpReward: 250, coinReward: 50, isHidden: true, criteria: { type: "streak_no_gap", maxGapDays: 2, windowDays: 30 } },
    { slug: "the_terminator", name: "The Terminator", description: "Rebuild to a longer streak than the one you lost", icon: "🤖", category: "streak", rarity: "epic", xpReward: 200, coinReward: 40, isHidden: true, criteria: { type: "streak_beat_previous" } },

    // ═══ Streak — Shield Mastery (8) ═══
    { slug: "shield_master", name: "Shield Master", description: "Use 3 streak shields", icon: "🛡️", category: "streak", rarity: "rare", xpReward: 100, coinReward: 25, isHidden: true, criteria: { type: "shields_used", threshold: 3 } },
    { slug: "shield_wall", name: "Shield Wall", description: "Use 5 streak shields total", icon: "🏰", category: "streak", rarity: "epic", xpReward: 200, coinReward: 40, isHidden: true, criteria: { type: "shields_used", threshold: 5 } },
    { slug: "purist", name: "Purist", description: "30+ day streak with zero shields used", icon: "🧘", category: "streak", rarity: "epic", xpReward: 300, coinReward: 60, isHidden: true, criteria: { type: "streak_no_shields", minStreak: 30 } },
    { slug: "plot_armor", name: "Plot Armor", description: "Use a shield to save a 20+ day streak", icon: "📖", category: "streak", rarity: "legendary", xpReward: 350, coinReward: 65, isHidden: true, criteria: { type: "shield_save_streak", minStreak: 20 } },
    { slug: "living_dangerously", name: "Living Dangerously", description: "Maintain a 15+ day streak with 0 shields available", icon: "🎲", category: "streak", rarity: "epic", xpReward: 250, coinReward: 50, isHidden: true, criteria: { type: "streak_zero_shields", minStreak: 15 } },
    { slug: "insurance_policy", name: "Insurance Policy", description: "Hold 3+ shields unused during a 25+ day streak", icon: "🏦", category: "streak", rarity: "rare", xpReward: 125, coinReward: 25, isHidden: true, criteria: { type: "shields_unused_streak", minShields: 3, minStreak: 25 } },
    { slug: "shield_hoarder", name: "Shield Hoarder", description: "Accumulate 5 shields at once", icon: "🐉", category: "streak", rarity: "rare", xpReward: 100, coinReward: 20, isHidden: true, criteria: { type: "shields_accumulated", threshold: 5 } },
    { slug: "neo", name: "Neo", description: "Use a shield on the last workday before a weekend", icon: "🕶️", category: "streak", rarity: "legendary", xpReward: 200, coinReward: 40, isHidden: true, criteria: { type: "shield_before_weekend" } },

    // ═══ Streak — Personal Records (5) ═══
    { slug: "personal_best", name: "Personal Best", description: "Beat your previous longest streak", icon: "🥇", category: "streak", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "personal_best" } },
    { slug: "double_up", name: "Double Up", description: "Double your previous longest streak", icon: "✌️", category: "streak", rarity: "epic", xpReward: 250, coinReward: 50, isHidden: true, criteria: { type: "streak_double_previous" } },
    { slug: "no_looking_back", name: "No Looking Back", description: "Beat your own streak record 3 separate times", icon: "🚀", category: "streak", rarity: "epic", xpReward: 300, coinReward: 60, isHidden: true, criteria: { type: "personal_best_count", count: 3 } },
    { slug: "glass_ceiling", name: "Glass Ceiling", description: "Break past a streak length you've lost at 3+ times", icon: "🔨", category: "streak", rarity: "rare", xpReward: 150, coinReward: 30, isHidden: true, criteria: { type: "glass_ceiling", losses: 3 } },
    { slug: "comfort_zone", name: "Comfort Zone", description: "Surpass your most common streak-end length", icon: "🛋️", category: "streak", rarity: "uncommon", xpReward: 40, coinReward: 8, isHidden: true, criteria: { type: "comfort_zone" } },

    // ═══ Streak — Multiplier & XP (6) ═══
    { slug: "supercharged", name: "Supercharged", description: "Reach 1.2x XP multiplier from a 10-day streak", icon: "🔌", category: "streak", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "multiplier_reach", multiplier: 1.2 } },
    { slug: "overdrive", name: "Overdrive", description: "Reach 1.4x XP multiplier from a 20-day streak", icon: "🏎️", category: "streak", rarity: "rare", xpReward: 100, coinReward: 20, criteria: { type: "multiplier_reach", multiplier: 1.4 } },
    { slug: "ludicrous_speed", name: "Ludicrous Speed", description: "Hit the 1.5x multiplier cap (25+ day streak)", icon: "💨", category: "streak", rarity: "epic", xpReward: 200, coinReward: 40, criteria: { type: "multiplier_reach", multiplier: 1.5 } },
    { slug: "xp_farmer", name: "XP Farmer", description: "Earn 500 XP during a single streak", icon: "🌾", category: "streak", rarity: "rare", xpReward: 100, coinReward: 20, isHidden: true, criteria: { type: "xp_during_streak", threshold: 500 } },
    { slug: "xp_tycoon", name: "XP Tycoon", description: "Earn 2000 XP during a single streak", icon: "💰", category: "streak", rarity: "legendary", xpReward: 400, coinReward: 75, isHidden: true, criteria: { type: "xp_during_streak", threshold: 2000 } },
    { slug: "the_compounding", name: "The Compounding", description: "Earn more bonus XP from multipliers than base XP in a single day", icon: "📈", category: "streak", rarity: "epic", xpReward: 175, coinReward: 35, isHidden: true, criteria: { type: "compounding_xp" } },

    // ═══ Streak — Calendar & Timing (10) ═══
    { slug: "month_slayer", name: "Month Slayer", description: "Maintain a streak spanning an entire calendar month", icon: "🗓️", category: "streak", rarity: "epic", xpReward: 300, coinReward: 60, criteria: { type: "streak_spans_month" } },
    { slug: "bridge_builder", name: "Bridge Builder", description: "Clock in on a weekend to keep a streak alive 3 times", icon: "🌉", category: "streak", rarity: "rare", xpReward: 100, coinReward: 20, criteria: { type: "weekend_bridge", threshold: 3 } },
    { slug: "monday_monster", name: "Monday Monster", description: "Continue a streak on Monday 20 times", icon: "👹", category: "streak", rarity: "uncommon", xpReward: 60, coinReward: 12, criteria: { type: "monday_streak", threshold: 20 } },
    { slug: "friday_finisher", name: "Friday Finisher", description: "End the work week on a streak 15 Fridays in a row", icon: "🎉", category: "streak", rarity: "rare", xpReward: 125, coinReward: 25, criteria: { type: "friday_streak", threshold: 15 } },
    { slug: "quarter_crusher", name: "Quarter Crusher", description: "Maintain a streak for an entire quarter (60+ work days)", icon: "🏆", category: "streak", rarity: "legendary", xpReward: 1500, coinReward: 250, isHidden: true, criteria: { type: "streak", threshold: 60 } },
    { slug: "holiday_survivor", name: "Holiday Survivor", description: "Keep a streak alive through a holiday week", icon: "🎄", category: "streak", rarity: "rare", xpReward: 150, coinReward: 30, criteria: { type: "streak_holiday_week" } },
    { slug: "january_warrior", name: "January Warrior", description: "Maintain a streak for all of January", icon: "❄️", category: "streak", rarity: "epic", xpReward: 250, coinReward: 50, criteria: { type: "streak_full_month", month: 1 } },
    { slug: "summer_survivor", name: "Summer Survivor", description: "20+ day streak during June through August", icon: "🏖️", category: "streak", rarity: "rare", xpReward: 150, coinReward: 30, criteria: { type: "streak_season", months: [6, 7, 8], minStreak: 20 } },
    { slug: "dark_days", name: "Dark Days", description: "15+ day streak during November or December", icon: "🌑", category: "streak", rarity: "rare", xpReward: 150, coinReward: 30, criteria: { type: "streak_season", months: [11, 12], minStreak: 15 } },
    { slug: "cross_month", name: "Cross-Month", description: "Maintain a streak that spans across 3+ calendar months", icon: "🔀", category: "streak", rarity: "epic", xpReward: 200, coinReward: 40, isHidden: true, criteria: { type: "streak_cross_months", months: 3 } },

    // ═══ Streak — Fun & Quirky (12) ═══
    { slug: "lucky_seven", name: "Lucky Seven", description: "Hit exactly a 7-day streak 3 separate times", icon: "🎰", category: "streak", rarity: "rare", xpReward: 75, coinReward: 15, isHidden: true, criteria: { type: "exact_streak_count", exactDays: 7, count: 3 } },
    { slug: "double_digits", name: "Double Digits", description: "Reach a 10+ day streak for the 5th time", icon: "🔟", category: "streak", rarity: "epic", xpReward: 150, coinReward: 30, isHidden: true, criteria: { type: "streak_count", minStreak: 10, count: 5 } },
    { slug: "triple_threat", name: "Triple Threat", description: "Have 3 separate 15+ day streaks", icon: "3️⃣", category: "streak", rarity: "epic", xpReward: 250, coinReward: 50, isHidden: true, criteria: { type: "streak_count", minStreak: 15, count: 3 } },
    { slug: "the_answer", name: "The Answer", description: "Reach a 42-day streak — the answer to everything", icon: "🐬", category: "streak", rarity: "rare", xpReward: 175, coinReward: 35, isHidden: true, criteria: { type: "streak", threshold: 42 } },
    { slug: "nice", name: "Nice", description: "Reach a 69-day streak", icon: "😏", category: "streak", rarity: "rare", xpReward: 200, coinReward: 42, isHidden: true, criteria: { type: "streak", threshold: 69 } },
    { slug: "so_close", name: "So Close", description: "Reach a 99-day streak — almost there!", icon: "😤", category: "streak", rarity: "epic", xpReward: 300, coinReward: 60, isHidden: true, criteria: { type: "streak", threshold: 99 } },
    { slug: "streak_collector", name: "Streak Collector", description: "Accumulate 100 total streak days across all streaks", icon: "🃏", category: "streak", rarity: "rare", xpReward: 125, coinReward: 25, criteria: { type: "total_streak_days", threshold: 100 } },
    { slug: "old_faithful", name: "Old Faithful", description: "Complete 10 separate streaks of 5+ days", icon: "⛲", category: "streak", rarity: "uncommon", xpReward: 75, coinReward: 15, criteria: { type: "streak_count", minStreak: 5, count: 10 } },
    { slug: "energizer", name: "Energizer", description: "50 total streak days without any break longer than 3 days", icon: "🔋", category: "streak", rarity: "rare", xpReward: 100, coinReward: 20, isHidden: true, criteria: { type: "cumulative_no_long_break", totalDays: 50, maxBreak: 3 } },
    { slug: "eternal_flame", name: "Eternal Flame", description: "50+ day streak with at least 1 shield used along the way", icon: "🕯️", category: "streak", rarity: "legendary", xpReward: 400, coinReward: 75, isHidden: true, criteria: { type: "streak_with_shield", minStreak: 50 } },
    { slug: "groundhog_day", name: "Groundhog Day", description: "Clock in at the same time (within 10 min) for 10 streak days", icon: "🦫", category: "streak", rarity: "epic", xpReward: 175, coinReward: 35, isHidden: true, criteria: { type: "streak_same_time", windowMinutes: 10, threshold: 10 } },
    { slug: "fibonacci_streak", name: "Fibonacci", description: "Reach streak lengths of 3, 5, 8, 13, and 21 days", icon: "🐚", category: "streak", rarity: "epic", xpReward: 250, coinReward: 50, isHidden: true, criteria: { type: "streak_fibonacci", targets: [3, 5, 8, 13, 21] } },

    // ═══ Streak — Org & Social (5) ═══
    { slug: "highlander", name: "Highlander", description: "Hold the longest active streak in your organization", icon: "⚔️", category: "streak", rarity: "legendary", xpReward: 500, coinReward: 100, isHidden: true, criteria: { type: "org_longest_streak" } },
    { slug: "pack_runner", name: "Pack Runner", description: "You and 3+ teammates all on 5+ day streaks at the same time", icon: "🐺", category: "streak", rarity: "epic", xpReward: 200, coinReward: 40, isHidden: true, criteria: { type: "team_simultaneous_streak", minTeammates: 3, minStreak: 5 } },
    { slug: "streak_rival", name: "Streak Rival", description: "Match or beat another user's streak within 1 day of theirs", icon: "🤺", category: "streak", rarity: "rare", xpReward: 100, coinReward: 20, isHidden: true, criteria: { type: "streak_match" } },
    { slug: "trendsetter", name: "Trendsetter", description: "3+ teammates start streaks within 2 days of your streak hitting 10", icon: "📢", category: "streak", rarity: "legendary", xpReward: 300, coinReward: 60, isHidden: true, criteria: { type: "streak_trendsetter", minFollowers: 3, triggerStreak: 10 } },
    { slug: "last_one_standing", name: "Last One Standing", description: "Be the only person in your org with an active streak", icon: "🏚️", category: "streak", rarity: "epic", xpReward: 200, coinReward: 40, isHidden: true, criteria: { type: "org_only_streak" } },

    // ═══ Milestone (8) ═══
    { slug: "first_day", name: "First Day", description: "Complete your first on-site day", icon: "🎯", category: "milestone", rarity: "common", xpReward: 10, coinReward: 5, criteria: { type: "threshold", stat: "totalOnsiteDays", threshold: 1 } },
    { slug: "half_century", name: "Half Century", description: "50 total on-site days", icon: "🎖️", category: "milestone", rarity: "uncommon", xpReward: 75, coinReward: 15, criteria: { type: "threshold", stat: "totalOnsiteDays", threshold: 50 } },
    { slug: "centurion", name: "Centurion", description: "100 total on-site days", icon: "🏛️", category: "milestone", rarity: "rare", xpReward: 200, coinReward: 40, criteria: { type: "threshold", stat: "totalOnsiteDays", threshold: 100 } },
    { slug: "veteran", name: "Veteran", description: "250 total on-site days", icon: "💎", category: "milestone", rarity: "epic", xpReward: 500, coinReward: 80, criteria: { type: "threshold", stat: "totalOnsiteDays", threshold: 250 } },
    { slug: "lifer", name: "Lifer", description: "500 total on-site days", icon: "👑", category: "milestone", rarity: "legendary", xpReward: 1000, coinReward: 150, criteria: { type: "threshold", stat: "totalOnsiteDays", threshold: 500 } },
    { slug: "century_club", name: "Century Club", description: "100 total hours tracked", icon: "💯", category: "milestone", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "threshold", stat: "totalHours", threshold: 100 } },
    { slug: "dedicated_hours", name: "Dedicated", description: "500 total hours tracked", icon: "🌟", category: "milestone", rarity: "rare", xpReward: 150, coinReward: 30, criteria: { type: "threshold", stat: "totalHours", threshold: 500 } },
    { slug: "time_lord", name: "Time Lord", description: "2000 total hours tracked", icon: "⏳", category: "milestone", rarity: "legendary", xpReward: 750, coinReward: 125, criteria: { type: "threshold", stat: "totalHours", threshold: 2000 } },

    // ═══ Time-Based (8) ═══
    { slug: "early_bird", name: "Early Bird", description: "Clock in before 8am 10 times", icon: "🐦", category: "time", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "threshold", stat: "earlyBirdCount", threshold: 10 }, setId: "time_master" },
    { slug: "dawn_patrol", name: "Dawn Patrol", description: "Clock in before 7am 25 times", icon: "🌅", category: "time", rarity: "rare", xpReward: 150, coinReward: 30, criteria: { type: "threshold", stat: "dawnPatrolCount", threshold: 25 } },
    { slug: "night_owl", name: "Night Owl", description: "Clock out after 7pm 10 times", icon: "🦉", category: "time", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "threshold", stat: "nightOwlCount", threshold: 10 }, setId: "time_master" },
    { slug: "punctual", name: "Punctual", description: "Clock in 9-10am 20 times", icon: "⏰", category: "time", rarity: "uncommon", xpReward: 40, coinReward: 8, criteria: { type: "threshold", stat: "onTimeCount", threshold: 20 }, setId: "time_master" },
    { slug: "clockwork", name: "Clockwork", description: "Clock in within 5min of same time for 10 days", icon: "⚙️", category: "time", rarity: "epic", xpReward: 200, coinReward: 40, isHidden: true, criteria: { type: "consistency_window", windowMinutes: 5, threshold: 10 } },
    { slug: "marathon", name: "Marathon", description: "Work a 10+ hour day", icon: "🏃", category: "time", rarity: "rare", xpReward: 75, coinReward: 15, criteria: { type: "threshold", stat: "overtimeDays", threshold: 1 }, setId: "time_master" },
    { slug: "overtime_hero", name: "Overtime Hero", description: "Work 10+ hour days 10 times", icon: "🦸", category: "time", rarity: "epic", xpReward: 200, coinReward: 40, criteria: { type: "threshold", stat: "overtimeDays", threshold: 10 } },
    { slug: "full_timer", name: "Full Timer", description: "Work 8+ hour days 50 times", icon: "📊", category: "time", rarity: "rare", xpReward: 125, coinReward: 25, criteria: { type: "threshold", stat: "fullDays", threshold: 50 }, setId: "iron" },

    // ═══ Consistency (6) ═══
    { slug: "perfect_week", name: "Perfect Week", description: "First week with 3+ on-site days", icon: "✅", category: "consistency", rarity: "common", xpReward: 25, coinReward: 5, criteria: { type: "threshold", stat: "perfectWeeks", threshold: 1 } },
    { slug: "consistency_king", name: "Consistency King", description: "10 perfect weeks", icon: "👑", category: "consistency", rarity: "rare", xpReward: 150, coinReward: 30, criteria: { type: "threshold", stat: "perfectWeeks", threshold: 10 }, setId: "iron" },
    { slug: "routine_master", name: "Routine Master", description: "20 perfect weeks", icon: "🎭", category: "consistency", rarity: "epic", xpReward: 300, coinReward: 60, criteria: { type: "threshold", stat: "perfectWeeks", threshold: 20 } },
    { slug: "monthly_master", name: "Monthly Master", description: "15+ on-site days in a month", icon: "🏆", category: "consistency", rarity: "rare", xpReward: 100, coinReward: 20, criteria: { type: "threshold", stat: "thisMonthDays", threshold: 15 } },
    { slug: "quarter_champion", name: "Quarter Champion", description: "3 consecutive months qualifying", icon: "🎯", category: "consistency", rarity: "epic", xpReward: 250, coinReward: 50, criteria: { type: "consecutive_months", threshold: 3 } },
    { slug: "annual_legend", name: "Annual Legend", description: "50+ qualifying weeks in a year", icon: "🌟", category: "consistency", rarity: "legendary", xpReward: 500, coinReward: 100, criteria: { type: "qualifying_weeks_year", threshold: 50 } },

    // ═══ Social (6) ═══
    { slug: "first_kudos", name: "First Kudos", description: "Give your first kudos", icon: "👏", category: "social", rarity: "common", xpReward: 10, coinReward: 5, criteria: { type: "threshold", stat: "kudosGiven", threshold: 1 }, setId: "social_butterfly" },
    { slug: "cheerleader", name: "Cheerleader", description: "Give 25 kudos", icon: "📣", category: "social", rarity: "rare", xpReward: 75, coinReward: 15, criteria: { type: "threshold", stat: "kudosGiven", threshold: 25 }, setId: "social_butterfly" },
    { slug: "beloved", name: "Beloved", description: "Receive 10 kudos", icon: "❤️", category: "social", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "threshold", stat: "kudosReceived", threshold: 10 }, setId: "social_butterfly" },
    { slug: "team_mvp", name: "Team MVP", description: "Receive 25 kudos", icon: "🏅", category: "social", rarity: "rare", xpReward: 150, coinReward: 30, criteria: { type: "threshold", stat: "kudosReceived", threshold: 25 } },
    { slug: "inspiration", name: "Inspiration", description: "Receive 50 kudos", icon: "✨", category: "social", rarity: "epic", xpReward: 300, coinReward: 60, criteria: { type: "threshold", stat: "kudosReceived", threshold: 50 } },
    { slug: "kudos_monarch", name: "Kudos Monarch", description: "Most kudos received in a month", icon: "👑", category: "social", rarity: "legendary", xpReward: 500, coinReward: 100, isHidden: true, criteria: { type: "kudos_top_monthly" } },

    // ═══ Special (6) ═══
    { slug: "break_champion", name: "Break Champion", description: "Take breaks on 20 work days", icon: "☕", category: "special", rarity: "uncommon", xpReward: 40, coinReward: 8, criteria: { type: "threshold", stat: "breaksTaken", threshold: 20 } },
    { slug: "weekend_warrior", name: "Weekend Warrior", description: "Work 5 weekend days", icon: "🗓️", category: "special", rarity: "rare", xpReward: 100, coinReward: 20, criteria: { type: "threshold", stat: "weekendDays", threshold: 5 } },
    { slug: "challenge_crusher", name: "Challenge Crusher", description: "Complete 10 challenges", icon: "💥", category: "special", rarity: "rare", xpReward: 100, coinReward: 20, criteria: { type: "threshold", stat: "challengesCompleted", threshold: 10 } },
    { slug: "completionist", name: "Completionist", description: "Complete 25 challenges", icon: "🏆", category: "special", rarity: "epic", xpReward: 250, coinReward: 50, criteria: { type: "threshold", stat: "challengesCompleted", threshold: 25 } },
    { slug: "treasure_hunter", name: "Treasure Hunter", description: "Discover 3 hidden badges", icon: "🗝️", category: "special", rarity: "rare", xpReward: 150, coinReward: 30, isHidden: true, criteria: { type: "threshold", stat: "hiddenBadgesFound", threshold: 3 } },
    { slug: "the_collector", name: "The Collector", description: "Complete any badge collection set", icon: "📚", category: "special", rarity: "epic", xpReward: 200, coinReward: 50, criteria: { type: "badge_set_complete", anySet: true } },

    // ═══ Seasonal (4) ═══
    { slug: "new_year_resolve", name: "New Year Resolve", description: "Clock in on January 2nd", icon: "🎆", category: "seasonal", rarity: "rare", xpReward: 100, coinReward: 25, isSeasonal: true, criteria: { type: "seasonal_date", month: 1, day: 2 } },
    { slug: "summer_grind", name: "Summer Grind", description: "15 on-site days in July", icon: "☀️", category: "seasonal", rarity: "rare", xpReward: 150, coinReward: 30, isSeasonal: true, isHidden: true, criteria: { type: "seasonal_month", month: 7, threshold: 15 } },
    { slug: "holiday_hero", name: "Holiday Hero", description: "Work on a holiday", icon: "🎄", category: "seasonal", rarity: "epic", xpReward: 200, coinReward: 40, isSeasonal: true, criteria: { type: "holiday_work" } },
    { slug: "anniversary", name: "Anniversary", description: "1 year on the platform", icon: "🎂", category: "seasonal", rarity: "epic", xpReward: 300, coinReward: 60, isSeasonal: true, criteria: { type: "tenure_days", threshold: 365 } },
  ]

  await supabaseAdmin.from("BadgeDefinition").insert(
    badges.map((b) => ({
      orgId,
      isHidden: false,
      isSeasonal: false,
      ...b,
    }))
  )

  // Seed challenge definitions
  const challenges = [
    { name: "Early Start", description: "Clock in before 9am", icon: "sunrise", type: "daily", criteria: { type: "clock_in_before", hour: 9 }, xpReward: 15, coinReward: 3, minLevel: 1 },
    { name: "Take a Break", description: "Take a break today", icon: "coffee", type: "daily", criteria: { type: "take_break" }, xpReward: 10, coinReward: 2, minLevel: 1 },
    { name: "Full Day", description: "Work 6+ hours today", icon: "bicep", type: "daily", criteria: { type: "work_hours", hours: 6 }, xpReward: 20, coinReward: 5, minLevel: 1 },
    { name: "On Time", description: "Clock in between 8-9am", icon: "clock", type: "daily", criteria: { type: "clock_in_window", startHour: 8, endHour: 9 }, xpReward: 15, coinReward: 3, minLevel: 1 },
    { name: "Extended Day", description: "Work 8+ hours today", icon: "chart", type: "daily", criteria: { type: "work_hours", hours: 8 }, xpReward: 25, coinReward: 5, minLevel: 3 },
    { name: "Early Finish", description: "Clock out before 5pm after 6+ hours", icon: "runner", type: "daily", criteria: { type: "early_finish", hour: 17, minHours: 6 }, xpReward: 15, coinReward: 3, minLevel: 2 },
    { name: "Weekly Regular", description: "Clock in 3 days this week", icon: "calendar", type: "weekly", criteria: { type: "days_this_week", threshold: 3 }, xpReward: 50, coinReward: 10, minLevel: 1 },
    { name: "Perfect Attendance", description: "Clock in all 5 weekdays", icon: "star", type: "weekly", criteria: { type: "days_this_week", threshold: 5 }, xpReward: 75, coinReward: 15, minLevel: 3 },
    { name: "Early Bird Week", description: "Clock in before 9am 3 times this week", icon: "bird", type: "weekly", criteria: { type: "early_days_week", hour: 9, threshold: 3 }, xpReward: 40, coinReward: 8, minLevel: 2 },
    { name: "Streak Builder", description: "Build a 5-day streak", icon: "fire", type: "weekly", criteria: { type: "streak_reach", threshold: 5 }, xpReward: 75, coinReward: 15, minLevel: 1 },
    { name: "Monthly Regular", description: "Clock in 15+ days this month", icon: "calendar", type: "monthly", criteria: { type: "days_this_month", threshold: 15 }, xpReward: 200, coinReward: 50, minLevel: 1 },
    { name: "Monthly Streak", description: "Maintain a 15-day streak", icon: "fire", type: "monthly", criteria: { type: "streak_reach", threshold: 15 }, xpReward: 250, coinReward: 60, minLevel: 5 },
    { name: "Consistency Champion", description: "Clock in 18+ days this month", icon: "trophy", type: "monthly", criteria: { type: "days_this_month", threshold: 18 }, xpReward: 300, coinReward: 75, minLevel: 3 },
  ]

  await supabaseAdmin.from("ChallengeDefinition").insert(
    challenges.map((c) => ({ orgId, isTeamChallenge: false, ...c }))
  )
}
