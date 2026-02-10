/**
 * Overtime calculation engine supporting jurisdiction-specific rules.
 *
 * Default (US-FLSA):
 *   - Weekly overtime after 40 hours
 *   - No daily overtime threshold by default
 *
 * California (CA):
 *   - Daily overtime after 8 hours (1.5x)
 *   - Daily double-time after 12 hours
 *   - Weekly overtime after 40 hours
 *   - 7th consecutive day: first 8 hours at 1.5x, beyond 8 at 2x
 *
 * Custom jurisdictions can define their own thresholds.
 */

export interface OvertimePolicy {
  /** Weekly overtime threshold in minutes. Default: 2400 (40h). */
  weeklyThresholdMinutes: number
  /** Daily overtime threshold in minutes. 0 = no daily OT. */
  dailyThresholdMinutes: number
  /** Daily double-time threshold in minutes. 0 = no double-time. */
  dailyDoubleTimeMinutes: number
  /** Whether 7th consecutive day has special OT rules. */
  seventhDayRule: boolean
}

export interface DayEntry {
  date: string
  totalMinutes: number
}

export interface OvertimeResult {
  regularMinutes: number
  overtimeMinutes: number
  doubleTimeMinutes: number
  totalMinutes: number
  dailyBreakdown: {
    date: string
    regularMinutes: number
    overtimeMinutes: number
    doubleTimeMinutes: number
  }[]
}

const DEFAULT_POLICY: OvertimePolicy = {
  weeklyThresholdMinutes: 2400,
  dailyThresholdMinutes: 0,
  dailyDoubleTimeMinutes: 0,
  seventhDayRule: false,
}

const CA_POLICY: OvertimePolicy = {
  weeklyThresholdMinutes: 2400,
  dailyThresholdMinutes: 480,
  dailyDoubleTimeMinutes: 720,
  seventhDayRule: true,
}

export const JURISDICTION_POLICIES: Record<string, OvertimePolicy> = {
  "US-FLSA": DEFAULT_POLICY,
  "US-CA": CA_POLICY,
}

/**
 * Resolve overtime policy from jurisdiction code or custom config.
 */
export function resolveOvertimePolicy(
  jurisdictionCode?: string | null,
  customConfig?: Partial<OvertimePolicy> | null
): OvertimePolicy {
  const base = jurisdictionCode
    ? JURISDICTION_POLICIES[jurisdictionCode] || DEFAULT_POLICY
    : DEFAULT_POLICY

  if (!customConfig) return base

  return {
    weeklyThresholdMinutes: customConfig.weeklyThresholdMinutes ?? base.weeklyThresholdMinutes,
    dailyThresholdMinutes: customConfig.dailyThresholdMinutes ?? base.dailyThresholdMinutes,
    dailyDoubleTimeMinutes: customConfig.dailyDoubleTimeMinutes ?? base.dailyDoubleTimeMinutes,
    seventhDayRule: customConfig.seventhDayRule ?? base.seventhDayRule,
  }
}

/**
 * Calculate overtime for a week of daily entries.
 *
 * @param days - Array of 7 day entries (Mon-Sun), sorted by date
 * @param policy - Overtime policy to apply
 * @returns Breakdown of regular, overtime, and double-time minutes
 */
export function calculateWeeklyOvertime(
  days: DayEntry[],
  policy: OvertimePolicy = DEFAULT_POLICY
): OvertimeResult {
  let weeklyRegular = 0
  let weeklyOvertime = 0
  let weeklyDoubleTime = 0
  let consecutiveWorkDays = 0

  const dailyBreakdown = days.map((day) => {
    const mins = day.totalMinutes
    let dayRegular = mins
    let dayOT = 0
    let dayDT = 0

    if (mins > 0) {
      consecutiveWorkDays++
    } else {
      consecutiveWorkDays = 0
    }

    // Daily double-time
    if (policy.dailyDoubleTimeMinutes > 0 && mins > policy.dailyDoubleTimeMinutes) {
      dayDT = mins - policy.dailyDoubleTimeMinutes
      dayRegular = mins - dayDT
    }

    // Daily overtime
    if (policy.dailyThresholdMinutes > 0 && dayRegular > policy.dailyThresholdMinutes) {
      dayOT = dayRegular - policy.dailyThresholdMinutes
      dayRegular = policy.dailyThresholdMinutes
    }

    // 7th consecutive day rule
    if (policy.seventhDayRule && consecutiveWorkDays >= 7 && mins > 0) {
      // All time on 7th day is OT; beyond 8h is double-time
      const threshold = 480
      if (mins > threshold) {
        dayDT = mins - threshold
        dayOT = threshold
        dayRegular = 0
      } else {
        dayOT = mins
        dayRegular = 0
        dayDT = 0
      }
    }

    weeklyRegular += dayRegular
    weeklyOvertime += dayOT
    weeklyDoubleTime += dayDT

    return {
      date: day.date,
      regularMinutes: dayRegular,
      overtimeMinutes: dayOT,
      doubleTimeMinutes: dayDT,
    }
  })

  // Weekly overtime: if total regular exceeds weekly threshold, shift excess to OT
  if (policy.weeklyThresholdMinutes > 0 && weeklyRegular > policy.weeklyThresholdMinutes) {
    const weeklyExcess = weeklyRegular - policy.weeklyThresholdMinutes
    weeklyOvertime += weeklyExcess
    weeklyRegular = policy.weeklyThresholdMinutes
  }

  const totalMinutes = weeklyRegular + weeklyOvertime + weeklyDoubleTime

  return {
    regularMinutes: weeklyRegular,
    overtimeMinutes: weeklyOvertime,
    doubleTimeMinutes: weeklyDoubleTime,
    totalMinutes,
    dailyBreakdown,
  }
}

/**
 * Check if a day entry exceeds daily overtime threshold.
 */
export function isDailyOvertime(
  totalMinutes: number,
  policy: OvertimePolicy = DEFAULT_POLICY
): boolean {
  if (policy.dailyThresholdMinutes <= 0) return false
  return totalMinutes > policy.dailyThresholdMinutes
}

/**
 * Check if a week's total exceeds weekly overtime threshold.
 */
export function isWeeklyOvertime(
  totalWeekMinutes: number,
  policy: OvertimePolicy = DEFAULT_POLICY
): boolean {
  return totalWeekMinutes > policy.weeklyThresholdMinutes
}
