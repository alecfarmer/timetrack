import { describe, it, expect } from "vitest"
import { rateLimit } from "@/lib/rate-limit"

describe("rateLimit", () => {
  it("allows first request", () => {
    const result = rateLimit("test-user-1")
    expect(result.limited).toBe(false)
    expect(result.remaining).toBe(59)
  })

  it("tracks remaining requests", () => {
    const key = "test-user-remaining"
    rateLimit(key)
    const result = rateLimit(key)
    expect(result.limited).toBe(false)
    expect(result.remaining).toBe(58)
  })

  it("limits after max requests exceeded", () => {
    const key = "test-user-limit"
    for (let i = 0; i < 60; i++) {
      rateLimit(key)
    }
    const result = rateLimit(key)
    expect(result.limited).toBe(true)
    expect(result.remaining).toBe(0)
  })

  it("uses different counters for different keys", () => {
    const r1 = rateLimit("user-a-unique")
    const r2 = rateLimit("user-b-unique")
    expect(r1.remaining).toBe(59)
    expect(r2.remaining).toBe(59)
  })
})
