/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-tenant, low-traffic admin endpoints on Vercel serverless.
 * Each function instance has its own store — protection is per-instance,
 * which is sufficient to stop brute-force bursts.
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

interface RateLimitOptions {
  /** Max requests allowed within the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export function checkRateLimit(key: string, opts: RateLimitOptions): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now >= existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs })
    return { allowed: true, remaining: opts.limit - 1, resetAt: now + opts.windowMs }
  }

  existing.count++
  const remaining = Math.max(0, opts.limit - existing.count)
  return {
    allowed: existing.count <= opts.limit,
    remaining,
    resetAt: existing.resetAt,
  }
}
