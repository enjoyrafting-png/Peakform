interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }
    this.cache.set(key, entry)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    Array.from(this.cache.keys()).forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    })
  }
}

// Export a singleton instance
export const cache = new SimpleCache()

// Cache keys constants
export const CACHE_KEYS = {
  PROFILE: (userId: string) => `profile:${userId}`,
  ATHLETES: (coachId: string) => `athletes:${coachId}`,
  TRAINING_LOGS: (userId: string) => `training_logs:${userId}`,
  MATCH_STATS: (userId: string) => `match_stats:${userId}`,
  FITNESS_DATA: (userId: string) => `fitness_data:${userId}`,
} as const
