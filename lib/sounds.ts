/**
 * Plays a short "new order" beep using Web Audio API.
 * No external assets needed — generated entirely in-browser.
 */
export function playNewOrderSound(): void {
  if (typeof window === 'undefined') return
  try {
    const ctx = new AudioContext()

    // Two-tone "ding ding" — friendly, not harsh
    const playTone = (freq: number, startAt: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt)
      gain.gain.setValueAtTime(0, ctx.currentTime + startAt)
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + startAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + duration)
      osc.start(ctx.currentTime + startAt)
      osc.stop(ctx.currentTime + startAt + duration)
    }

    playTone(880, 0, 0.25)    // A5
    playTone(1100, 0.28, 0.25) // C#6
  } catch {
    // Ignore if AudioContext is not available (e.g. during SSR or in restricted contexts)
  }
}

/**
 * Plays a waiter-call alert (single lower tone).
 */
export function playWaiterCallSound(): void {
  if (typeof window === 'undefined') return
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // Ignore
  }
}
