import { describe, it, expect, beforeEach, vi } from 'vitest'

// Reset the module store between tests so each test starts fresh
vi.resetModules()

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('allows first request', async () => {
    const { checkRateLimit } = await import('../lib/rate-limit')
    const result = checkRateLimit('test-key-1', { limit: 3, windowMs: 60_000 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('decrements remaining on each call', async () => {
    const { checkRateLimit } = await import('../lib/rate-limit')
    checkRateLimit('test-key-2', { limit: 3, windowMs: 60_000 })
    checkRateLimit('test-key-2', { limit: 3, windowMs: 60_000 })
    const third = checkRateLimit('test-key-2', { limit: 3, windowMs: 60_000 })
    expect(third.remaining).toBe(0)
    expect(third.allowed).toBe(true)
  })

  it('blocks when limit is exceeded', async () => {
    const { checkRateLimit } = await import('../lib/rate-limit')
    for (let i = 0; i < 3; i++) {
      checkRateLimit('test-key-3', { limit: 3, windowMs: 60_000 })
    }
    const overflow = checkRateLimit('test-key-3', { limit: 3, windowMs: 60_000 })
    expect(overflow.allowed).toBe(false)
    expect(overflow.remaining).toBe(0)
  })

  it('different keys do not interfere', async () => {
    const { checkRateLimit } = await import('../lib/rate-limit')
    for (let i = 0; i < 3; i++) {
      checkRateLimit('key-a', { limit: 3, windowMs: 60_000 })
    }
    const other = checkRateLimit('key-b', { limit: 3, windowMs: 60_000 })
    expect(other.allowed).toBe(true)
  })

  it('resets after the window expires', async () => {
    vi.useFakeTimers()
    const { checkRateLimit } = await import('../lib/rate-limit')

    for (let i = 0; i < 3; i++) {
      checkRateLimit('test-key-4', { limit: 3, windowMs: 1_000 })
    }
    const blocked = checkRateLimit('test-key-4', { limit: 3, windowMs: 1_000 })
    expect(blocked.allowed).toBe(false)

    // Advance past the window
    vi.advanceTimersByTime(1_001)

    const reset = checkRateLimit('test-key-4', { limit: 3, windowMs: 1_000 })
    expect(reset.allowed).toBe(true)
    expect(reset.remaining).toBe(2)

    vi.useRealTimers()
  })
})
