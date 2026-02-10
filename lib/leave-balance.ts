import { supabaseAdmin as supabase } from "@/lib/supabase"
import { format } from "date-fns"

export interface PtoBalance {
  annualAllowance: number
  carryover: number
  taken: number
  remaining: number
  leaveYearStart: string // YYYY-MM-DD
  leaveYearEnd: string   // YYYY-MM-DD
  priorYearStart: string
  priorYearEnd: string
  overrideApplied: boolean
}

interface PolicyLeaveConfig {
  annualPtoDays: number
  maxCarryoverDays: number
  leaveYearStartMonth: number
  leaveYearStartDay: number
}

/**
 * Compute the leave year boundaries for a given reference date.
 * The leave year starts on startMonth/startDay each year.
 */
function getLeaveYearBounds(
  referenceDate: Date,
  startMonth: number,
  startDay: number
): { currentStart: Date; currentEnd: Date; priorStart: Date; priorEnd: Date } {
  const refYear = referenceDate.getFullYear()
  // Leave year start in the reference year
  const yearStartThisYear = new Date(refYear, startMonth - 1, startDay)

  let currentStart: Date
  if (referenceDate >= yearStartThisYear) {
    currentStart = yearStartThisYear
  } else {
    currentStart = new Date(refYear - 1, startMonth - 1, startDay)
  }

  const currentEnd = new Date(
    currentStart.getFullYear() + 1,
    startMonth - 1,
    startDay - 1
  )

  const priorStart = new Date(
    currentStart.getFullYear() - 1,
    startMonth - 1,
    startDay
  )
  const priorEnd = new Date(
    currentStart.getFullYear(),
    startMonth - 1,
    startDay - 1
  )

  return { currentStart, currentEnd, priorStart, priorEnd }
}

/**
 * Calculate PTO balance for a user within their org.
 */
export async function calculatePtoBalance(
  userId: string,
  orgId: string,
  referenceDate?: Date
): Promise<PtoBalance> {
  const refDate = referenceDate || new Date()

  // 1. Fetch org policy
  const { data: policy } = await supabase
    .from("PolicyConfig")
    .select("annualPtoDays, maxCarryoverDays, leaveYearStartMonth, leaveYearStartDay")
    .eq("orgId", orgId)
    .eq("isActive", true)
    .order("effectiveDate", { ascending: false })
    .limit(1)
    .single()

  const config: PolicyLeaveConfig = {
    annualPtoDays: policy?.annualPtoDays ?? 0,
    maxCarryoverDays: policy?.maxCarryoverDays ?? 0,
    leaveYearStartMonth: policy?.leaveYearStartMonth ?? 1,
    leaveYearStartDay: policy?.leaveYearStartDay ?? 1,
  }

  // 2. Resolve per-employee override
  const currentYear = refDate.getFullYear()

  // Try year-specific override first, then permanent (effectiveYear IS NULL)
  const { data: overrides } = await supabase
    .from("LeaveAllowanceOverride")
    .select("annualPtoDays, effectiveYear")
    .eq("userId", userId)
    .eq("orgId", orgId)
    .or(`effectiveYear.eq.${currentYear},effectiveYear.is.null`)
    .order("effectiveYear", { ascending: false, nullsFirst: false })

  let annualAllowance = config.annualPtoDays
  let overrideApplied = false

  if (overrides && overrides.length > 0) {
    // Year-specific takes priority over permanent
    const yearSpecific = overrides.find((o) => o.effectiveYear === currentYear)
    const permanent = overrides.find((o) => o.effectiveYear === null)
    if (yearSpecific) {
      annualAllowance = yearSpecific.annualPtoDays
      overrideApplied = true
    } else if (permanent) {
      annualAllowance = permanent.annualPtoDays
      overrideApplied = true
    }
  }

  // 3. Compute leave year boundaries
  const bounds = getLeaveYearBounds(
    refDate,
    config.leaveYearStartMonth,
    config.leaveYearStartDay
  )

  const currentStartStr = format(bounds.currentStart, "yyyy-MM-dd")
  const currentEndStr = format(bounds.currentEnd, "yyyy-MM-dd")
  const priorStartStr = format(bounds.priorStart, "yyyy-MM-dd")
  const priorEndStr = format(bounds.priorEnd, "yyyy-MM-dd")

  // 4. Count PTO days taken in current leave year
  const { count: currentTaken } = await supabase
    .from("LeaveRequest")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId)
    .eq("type", "PTO")
    .eq("status", "APPROVED")
    .gte("date", currentStartStr)
    .lte("date", currentEndStr)

  const taken = currentTaken ?? 0

  // 5. Compute carryover from prior year
  let carryover = 0
  if (config.maxCarryoverDays > 0) {
    // Get prior year's allowance (could also have override)
    const priorYear = bounds.priorStart.getFullYear()
    const { data: priorOverrides } = await supabase
      .from("LeaveAllowanceOverride")
      .select("annualPtoDays, effectiveYear")
      .eq("userId", userId)
      .eq("orgId", orgId)
      .or(`effectiveYear.eq.${priorYear},effectiveYear.is.null`)

    let priorAllowance = config.annualPtoDays
    if (priorOverrides && priorOverrides.length > 0) {
      const ys = priorOverrides.find((o) => o.effectiveYear === priorYear)
      const perm = priorOverrides.find((o) => o.effectiveYear === null)
      if (ys) priorAllowance = ys.annualPtoDays
      else if (perm) priorAllowance = perm.annualPtoDays
    }

    const { count: priorTaken } = await supabase
      .from("LeaveRequest")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId)
      .eq("type", "PTO")
      .eq("status", "APPROVED")
      .gte("date", priorStartStr)
      .lte("date", priorEndStr)

    const priorUsed = priorTaken ?? 0
    const priorUnused = Math.max(0, priorAllowance - priorUsed)
    carryover = Math.min(priorUnused, config.maxCarryoverDays)
  }

  const remaining = annualAllowance + carryover - taken

  return {
    annualAllowance,
    carryover,
    taken,
    remaining,
    leaveYearStart: currentStartStr,
    leaveYearEnd: currentEndStr,
    priorYearStart: priorStartStr,
    priorYearEnd: priorEndStr,
    overrideApplied,
  }
}
