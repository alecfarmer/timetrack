import { describe, it, expect } from "vitest"
import {
  calculateDistance,
  formatDistance,
  getAccuracyLevel,
  getAccuracyColor,
  isWithinGeofence,
} from "@/lib/geo"

describe("calculateDistance", () => {
  it("returns 0 for the same point", () => {
    const d = calculateDistance(40.7128, -74.006, 40.7128, -74.006)
    expect(d).toBe(0)
  })

  it("calculates distance between NYC and LA approximately", () => {
    const d = calculateDistance(40.7128, -74.006, 34.0522, -118.2437)
    expect(d).toBeGreaterThan(3_900_000)
    expect(d).toBeLessThan(4_000_000)
  })

  it("calculates short distances accurately", () => {
    const d = calculateDistance(40.0, -74.0, 40.001, -74.0)
    expect(d).toBeGreaterThan(100)
    expect(d).toBeLessThan(120)
  })

  it("is symmetric", () => {
    const d1 = calculateDistance(40.7128, -74.006, 34.0522, -118.2437)
    const d2 = calculateDistance(34.0522, -118.2437, 40.7128, -74.006)
    expect(d1).toBeCloseTo(d2, 5)
  })
})

describe("formatDistance", () => {
  it("formats small distances in feet", () => {
    expect(formatDistance(10)).toBe("33 ft")
  })

  it("formats large distances in miles", () => {
    const result = formatDistance(2000)
    expect(result).toMatch(/mi$/)
  })

  it("formats distances just under a mile in feet", () => {
    const result = formatDistance(400)
    expect(result).toMatch(/^\d+ ft$/)
  })
})

describe("getAccuracyLevel", () => {
  it("returns high for accuracy <= 20", () => {
    expect(getAccuracyLevel(5)).toBe("high")
    expect(getAccuracyLevel(20)).toBe("high")
  })

  it("returns medium for accuracy 21-50", () => {
    expect(getAccuracyLevel(21)).toBe("medium")
    expect(getAccuracyLevel(50)).toBe("medium")
  })

  it("returns low for accuracy > 50", () => {
    expect(getAccuracyLevel(51)).toBe("low")
    expect(getAccuracyLevel(100)).toBe("low")
  })
})

describe("getAccuracyColor", () => {
  it("returns green for high accuracy", () => {
    expect(getAccuracyColor(10)).toBe("text-green-500")
  })

  it("returns yellow for medium accuracy", () => {
    expect(getAccuracyColor(30)).toBe("text-yellow-500")
  })

  it("returns red for low accuracy", () => {
    expect(getAccuracyColor(100)).toBe("text-red-500")
  })
})

describe("isWithinGeofence", () => {
  it("returns true when user is at same point", () => {
    expect(isWithinGeofence(40.7128, -74.006, 40.7128, -74.006, 100)).toBe(true)
  })

  it("returns false when user is outside radius", () => {
    expect(isWithinGeofence(40.0, -74.0, 40.001, -74.0, 50)).toBe(false)
  })

  it("returns true when user is within radius", () => {
    expect(isWithinGeofence(40.0, -74.0, 40.001, -74.0, 120)).toBe(true)
  })
})
