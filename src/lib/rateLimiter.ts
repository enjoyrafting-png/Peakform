interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export class RateLimiter {
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  check(key: string): boolean {
    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return true
    }

    if (entry.count >= this.maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  getRemainingRequests(key: string): number {
    const entry = rateLimitStore.get(key)
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - entry.count)
  }

  getResetTime(key: string): number | null {
    const entry = rateLimitStore.get(key)
    if (!entry) return null
    return entry.resetTime
  }
}

// Create a default rate limiter: 100 requests per minute
export const defaultRateLimiter = new RateLimiter(100, 60000)

// Create a stricter rate limiter for write operations: 10 requests per minute
export const writeRateLimiter = new RateLimiter(10, 60000)
