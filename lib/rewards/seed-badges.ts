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
    // Streak
    { slug: "first_spark", name: "First Spark", description: "3-day on-site streak", icon: "fire", category: "streak", rarity: "common", xpReward: 15, coinReward: 5, criteria: { type: "streak", threshold: 3 } },
    { slug: "week_warrior", name: "Week Warrior", description: "5-day on-site streak", icon: "zap", category: "streak", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "streak", threshold: 5 } },
    { slug: "unstoppable", name: "Unstoppable", description: "10-day on-site streak", icon: "flame", category: "streak", rarity: "rare", xpReward: 100, coinReward: 20, criteria: { type: "streak", threshold: 10 } },
    { slug: "on_fire", name: "On Fire", description: "15-day on-site streak", icon: "volcano", category: "streak", rarity: "epic", xpReward: 200, coinReward: 35, criteria: { type: "streak", threshold: 15 } },
    { slug: "iron_will", name: "Iron Will", description: "20-day on-site streak", icon: "bicep", category: "streak", rarity: "legendary", xpReward: 500, coinReward: 75, criteria: { type: "streak", threshold: 20 }, setId: "iron" },
    { slug: "phoenix", name: "Phoenix", description: "Recover a 10+ day streak after a break", icon: "phoenix", category: "streak", rarity: "legendary", xpReward: 300, coinReward: 50, isHidden: true, criteria: { type: "streak_recovery", minPreviousStreak: 10 } },
    { slug: "shield_master", name: "Shield Master", description: "Use 3 streak shields", icon: "shield", category: "streak", rarity: "rare", xpReward: 100, coinReward: 25, isHidden: true, criteria: { type: "shields_used", threshold: 3 } },
    { slug: "century_streak", name: "Century Streak", description: "100-day on-site streak", icon: "diamond", category: "streak", rarity: "legendary", xpReward: 1000, coinReward: 200, isHidden: true, criteria: { type: "streak", threshold: 100 } },

    // Milestone
    { slug: "first_day", name: "First Day", description: "Complete your first on-site day", icon: "target", category: "milestone", rarity: "common", xpReward: 10, coinReward: 5, criteria: { type: "threshold", stat: "totalOnsiteDays", threshold: 1 } },
    { slug: "half_century", name: "Half Century", description: "50 total on-site days", icon: "medal", category: "milestone", rarity: "uncommon", xpReward: 75, coinReward: 15, criteria: { type: "threshold", stat: "totalOnsiteDays", threshold: 50 } },
    { slug: "centurion", name: "Centurion", description: "100 total on-site days", icon: "temple", category: "milestone", rarity: "rare", xpReward: 200, coinReward: 40, criteria: { type: "threshold", stat: "totalOnsiteDays", threshold: 100 } },
    { slug: "veteran", name: "Veteran", description: "250 total on-site days", icon: "gem", category: "milestone", rarity: "epic", xpReward: 500, coinReward: 80, criteria: { type: "threshold", stat: "totalOnsiteDays", threshold: 250 } },
    { slug: "lifer", name: "Lifer", description: "500 total on-site days", icon: "crown", category: "milestone", rarity: "legendary", xpReward: 1000, coinReward: 150, criteria: { type: "threshold", stat: "totalOnsiteDays", threshold: 500 } },
    { slug: "century_club", name: "Century Club", description: "100 total hours tracked", icon: "hundred", category: "milestone", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "threshold", stat: "totalHours", threshold: 100 } },
    { slug: "dedicated_hours", name: "Dedicated", description: "500 total hours tracked", icon: "star", category: "milestone", rarity: "rare", xpReward: 150, coinReward: 30, criteria: { type: "threshold", stat: "totalHours", threshold: 500 } },
    { slug: "time_lord", name: "Time Lord", description: "2000 total hours tracked", icon: "hourglass", category: "milestone", rarity: "legendary", xpReward: 750, coinReward: 125, criteria: { type: "threshold", stat: "totalHours", threshold: 2000 } },

    // Time-Based
    { slug: "early_bird", name: "Early Bird", description: "Clock in before 8am 10 times", icon: "bird", category: "time", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "threshold", stat: "earlyBirdCount", threshold: 10 }, setId: "time_master" },
    { slug: "dawn_patrol", name: "Dawn Patrol", description: "Clock in before 7am 25 times", icon: "sunrise", category: "time", rarity: "rare", xpReward: 150, coinReward: 30, criteria: { type: "threshold", stat: "dawnPatrolCount", threshold: 25 } },
    { slug: "night_owl", name: "Night Owl", description: "Clock out after 7pm 10 times", icon: "owl", category: "time", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "threshold", stat: "nightOwlCount", threshold: 10 }, setId: "time_master" },
    { slug: "punctual", name: "Punctual", description: "Clock in 9-10am 20 times", icon: "clock", category: "time", rarity: "uncommon", xpReward: 40, coinReward: 8, criteria: { type: "threshold", stat: "onTimeCount", threshold: 20 }, setId: "time_master" },
    { slug: "clockwork", name: "Clockwork", description: "Clock in within 5min of same time for 10 days", icon: "gear", category: "time", rarity: "epic", xpReward: 200, coinReward: 40, isHidden: true, criteria: { type: "consistency_window", windowMinutes: 5, threshold: 10 } },
    { slug: "marathon", name: "Marathon", description: "Work a 10+ hour day", icon: "runner", category: "time", rarity: "rare", xpReward: 75, coinReward: 15, criteria: { type: "threshold", stat: "overtimeDays", threshold: 1 }, setId: "time_master" },
    { slug: "overtime_hero", name: "Overtime Hero", description: "Work 10+ hour days 10 times", icon: "hero", category: "time", rarity: "epic", xpReward: 200, coinReward: 40, criteria: { type: "threshold", stat: "overtimeDays", threshold: 10 } },
    { slug: "full_timer", name: "Full Timer", description: "Work 8+ hour days 50 times", icon: "chart", category: "time", rarity: "rare", xpReward: 125, coinReward: 25, criteria: { type: "threshold", stat: "fullDays", threshold: 50 }, setId: "iron" },

    // Consistency
    { slug: "perfect_week", name: "Perfect Week", description: "First week with 3+ on-site days", icon: "check", category: "consistency", rarity: "common", xpReward: 25, coinReward: 5, criteria: { type: "threshold", stat: "perfectWeeks", threshold: 1 } },
    { slug: "consistency_king", name: "Consistency King", description: "10 perfect weeks", icon: "crown", category: "consistency", rarity: "rare", xpReward: 150, coinReward: 30, criteria: { type: "threshold", stat: "perfectWeeks", threshold: 10 }, setId: "iron" },
    { slug: "routine_master", name: "Routine Master", description: "20 perfect weeks", icon: "mask", category: "consistency", rarity: "epic", xpReward: 300, coinReward: 60, criteria: { type: "threshold", stat: "perfectWeeks", threshold: 20 } },
    { slug: "monthly_master", name: "Monthly Master", description: "15+ on-site days in a month", icon: "trophy", category: "consistency", rarity: "rare", xpReward: 100, coinReward: 20, criteria: { type: "threshold", stat: "thisMonthDays", threshold: 15 } },
    { slug: "quarter_champion", name: "Quarter Champion", description: "3 consecutive months qualifying", icon: "target", category: "consistency", rarity: "epic", xpReward: 250, coinReward: 50, criteria: { type: "consecutive_months", threshold: 3 } },
    { slug: "annual_legend", name: "Annual Legend", description: "50+ qualifying weeks in a year", icon: "star", category: "consistency", rarity: "legendary", xpReward: 500, coinReward: 100, criteria: { type: "qualifying_weeks_year", threshold: 50 } },

    // Social
    { slug: "first_kudos", name: "First Kudos", description: "Give your first kudos", icon: "clap", category: "social", rarity: "common", xpReward: 10, coinReward: 5, criteria: { type: "threshold", stat: "kudosGiven", threshold: 1 }, setId: "social_butterfly" },
    { slug: "cheerleader", name: "Cheerleader", description: "Give 25 kudos", icon: "megaphone", category: "social", rarity: "rare", xpReward: 75, coinReward: 15, criteria: { type: "threshold", stat: "kudosGiven", threshold: 25 }, setId: "social_butterfly" },
    { slug: "beloved", name: "Beloved", description: "Receive 10 kudos", icon: "heart", category: "social", rarity: "uncommon", xpReward: 50, coinReward: 10, criteria: { type: "threshold", stat: "kudosReceived", threshold: 10 }, setId: "social_butterfly" },
    { slug: "team_mvp", name: "Team MVP", description: "Receive 25 kudos", icon: "medal", category: "social", rarity: "rare", xpReward: 150, coinReward: 30, criteria: { type: "threshold", stat: "kudosReceived", threshold: 25 } },
    { slug: "inspiration", name: "Inspiration", description: "Receive 50 kudos", icon: "sparkles", category: "social", rarity: "epic", xpReward: 300, coinReward: 60, criteria: { type: "threshold", stat: "kudosReceived", threshold: 50 } },
    { slug: "kudos_monarch", name: "Kudos Monarch", description: "Most kudos received in a month", icon: "crown", category: "social", rarity: "legendary", xpReward: 500, coinReward: 100, isHidden: true, criteria: { type: "kudos_top_monthly" } },

    // Special
    { slug: "break_champion", name: "Break Champion", description: "Take breaks on 20 work days", icon: "coffee", category: "special", rarity: "uncommon", xpReward: 40, coinReward: 8, criteria: { type: "threshold", stat: "breaksTaken", threshold: 20 } },
    { slug: "weekend_warrior", name: "Weekend Warrior", description: "Work 5 weekend days", icon: "calendar", category: "special", rarity: "rare", xpReward: 100, coinReward: 20, criteria: { type: "threshold", stat: "weekendDays", threshold: 5 } },
    { slug: "challenge_crusher", name: "Challenge Crusher", description: "Complete 10 challenges", icon: "boom", category: "special", rarity: "rare", xpReward: 100, coinReward: 20, criteria: { type: "threshold", stat: "challengesCompleted", threshold: 10 } },
    { slug: "completionist", name: "Completionist", description: "Complete 25 challenges", icon: "trophy", category: "special", rarity: "epic", xpReward: 250, coinReward: 50, criteria: { type: "threshold", stat: "challengesCompleted", threshold: 25 } },
    { slug: "treasure_hunter", name: "Treasure Hunter", description: "Discover 3 hidden badges", icon: "key", category: "special", rarity: "rare", xpReward: 150, coinReward: 30, isHidden: true, criteria: { type: "threshold", stat: "hiddenBadgesFound", threshold: 3 } },
    { slug: "the_collector", name: "The Collector", description: "Complete any badge collection set", icon: "book", category: "special", rarity: "epic", xpReward: 200, coinReward: 50, criteria: { type: "badge_set_complete", anySet: true } },

    // Seasonal
    { slug: "new_year_resolve", name: "New Year Resolve", description: "Clock in on January 2nd", icon: "fireworks", category: "seasonal", rarity: "rare", xpReward: 100, coinReward: 25, isSeasonal: true, criteria: { type: "seasonal_date", month: 1, day: 2 } },
    { slug: "summer_grind", name: "Summer Grind", description: "15 on-site days in July", icon: "sun", category: "seasonal", rarity: "rare", xpReward: 150, coinReward: 30, isSeasonal: true, isHidden: true, criteria: { type: "seasonal_month", month: 7, threshold: 15 } },
    { slug: "holiday_hero", name: "Holiday Hero", description: "Work on a holiday", icon: "tree", category: "seasonal", rarity: "epic", xpReward: 200, coinReward: 40, isSeasonal: true, criteria: { type: "holiday_work" } },
    { slug: "anniversary", name: "Anniversary", description: "1 year on the platform", icon: "cake", category: "seasonal", rarity: "epic", xpReward: 300, coinReward: 60, isSeasonal: true, criteria: { type: "tenure_days", threshold: 365 } },
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
