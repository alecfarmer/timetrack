import { describe, it, expect } from "vitest"
import {
  calculateWeeklyOvertime,
  resolveOvertimePolicy,
  isDailyOvertime,
  isWeeklyOvertime,
  JURISDICTION_POLICIES,
  type DayEntry,
} from "@/lib/overtime"

const makeWeek = (minutesPerDay: number[]): DayEntry[] =>
  minutesPerDay.map((mins, i) => ({
    date: `2026-01-${(26 + i).toString().padStart(2, "0")}`,
    totalMinutes: mins,
  }))

describe("resolveOvertimePolicy", () => {
  it("returns default policy when no jurisdiction", () => {
    const p = resolveOvertimePolicy()
    expect(p.weeklyThresholdMinutes).toBe(2400)
    expect(p.dailyThresholdMinutes).toBe(0)
    expect(p.seventhDayRule).toBe(false)
  })

  it("returns CA policy for US-CA", () => {
    const p = resolveOvertimePolicy("US-CA")
    expect(p.dailyThresholdMinutes).toBe(480)
    expect(p.dailyDoubleTimeMinutes).toBe(720)
    expect(p.seventhDayRule).toBe(true)
  })

  it("merges custom config over base policy", () => {
    const p = resolveOvertimePolicy("US-FLSA", { weeklyThresholdMinutes: 2000 })
    expect(p.weeklyThresholdMinutes).toBe(2000)
    expect(p.dailyThresholdMinutes).toBe(0)
  })

  it("falls back to default for unknown jurisdiction", () => {
    const p = resolveOvertimePolicy("XX-UNKNOWN")
    expect(p.weeklyThresholdMinutes).toBe(2400)
  })
})

describe("calculateWeeklyOvertime", () => {
  it("no overtime for under-40h week", () => {
    const days = makeWeek([480, 480, 480, 480, 0, 0, 0])
    const result = calculateWeeklyOvertime(days)
    expect(result.regularMinutes).toBe(1920)
    expect(result.overtimeMinutes).toBe(0)
    expect(result.doubleTimeMinutes).toBe(0)
  })

  it("calculates weekly overtime for over-40h", () => {
    const days = makeWeek([600, 600, 600, 600, 600, 0, 0])
    const result = calculateWeeklyOvertime(days)
    expect(result.regularMinutes).toBe(2400)
    expect(result.overtimeMinutes).toBe(600)
    expect(result.totalMinutes).toBe(3000)
  })

  it("returns zero for empty week", () => {
    const days = makeWeek([0, 0, 0, 0, 0, 0, 0])
    const result = calculateWeeklyOvertime(days)
    expect(result.regularMinutes).toBe(0)
    expect(result.overtimeMinutes).toBe(0)
    expect(result.totalMinutes).toBe(0)
  })

  it("calculates daily overtime with CA policy", () => {
    const caPolicy = JURISDICTION_POLICIES["US-CA"]
    const days = makeWeek([600, 480, 480, 480, 480, 0, 0])
    const result = calculateWeeklyOvertime(days, caPolicy)
    expect(result.overtimeMinutes).toBe(120)
    expect(result.regularMinutes).toBe(2400)
  })

  it("calculates daily double-time with CA policy", () => {
    const caPolicy = JURISDICTION_POLICIES["US-CA"]
    const days = makeWeek([780, 0, 0, 0, 0, 0, 0])
    const result = calculateWeeklyOvertime(days, caPolicy)
    expect(result.doubleTimeMinutes).toBe(60)
    expect(result.overtimeMinutes).toBe(240)
    expect(result.regularMinutes).toBe(480)
  })

  it("provides daily breakdown", () => {
    const days = makeWeek([480, 480, 480, 480, 480, 0, 0])
    const result = calculateWeeklyOvertime(days)
    expect(result.dailyBreakdown).toHaveLength(7)
    expect(result.dailyBreakdown[0].regularMinutes).toBe(480)
    expect(result.dailyBreakdown[5].regularMinutes).toBe(0)
  })
})

describe("isDailyOvertime", () => {
  it("returns false with default policy", () => {
    expect(isDailyOvertime(600)).toBe(false)
  })

  it("returns true with CA policy for 9h day", () => {
    expect(isDailyOvertime(540, JURISDICTION_POLICIES["US-CA"])).toBe(true)
  })

  it("returns false with CA policy for 8h day", () => {
    expect(isDailyOvertime(480, JURISDICTION_POLICIES["US-CA"])).toBe(false)
  })
})

describe("isWeeklyOvertime", () => {
  it("returns true for over 40h", () => {
    expect(isWeeklyOvertime(2401)).toBe(true)
  })

  it("returns false for exactly 40h", () => {
    expect(isWeeklyOvertime(2400)).toBe(false)
  })

  it("returns false for under 40h", () => {
    expect(isWeeklyOvertime(2000)).toBe(false)
  })
})
