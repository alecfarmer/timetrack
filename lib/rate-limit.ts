const windowMs = 60_000 // 1 minute window
const maxRequests = 60 // per window

const hits = new Map<string, { count: number; resetAt: number }>()

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) {
      if (entry.resetAt < now) hits.delete(key)
    }
  }, 5 * 60_000)
}

/**
 * In-memory rate limiter keyed by IP or user ID.
 * Returns { limited: true } if the caller has exceeded the rate limit.
 */
export function rateLimit(key: string): { limited: boolean; remaining: number } {
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: maxRequests - 1 }
  }

  entry.count++
  if (entry.count > maxRequests) {
    return { limited: true, remaining: 0 }
  }

  return { limited: false, remaining: maxRequests - entry.count }
}
