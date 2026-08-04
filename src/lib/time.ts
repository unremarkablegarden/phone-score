/**
 * Duration parsing/formatting. Input is deliberately forgiving so a duration
 * can be typed fast on a phone keypad:
 *   "5"       ->      5s
 *   "90"      ->     90s
 *   "1:30"    ->     90s
 *   "2:05:00" ->  7500s
 */

const MAX_SECONDS = 99 * 3600 + 59 * 60 + 59

export function parseDuration(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const parts = trimmed.split(':')
  if (parts.length > 3) return null

  const nums: number[] = []
  for (const part of parts) {
    const cleaned = part.trim()
    if (!/^\d+$/.test(cleaned)) return null
    nums.push(Number(cleaned))
  }

  // Only the leading unit may exceed its natural range ("90" -> 90s, "90:00" -> 90m).
  if (nums.length > 1 && nums.slice(1).some((n) => n > 59)) return null

  let seconds = 0
  for (const n of nums) seconds = seconds * 60 + n

  if (!Number.isFinite(seconds) || seconds < 0 || seconds > MAX_SECONDS) return null
  return seconds
}

/** Canonical hh:mm:ss, used to rewrite the input on blur. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${pad(h)}:${pad(m)}:${pad(sec)}`
}

/** Compact form for the big countdown: mm:ss, widening to h:mm:ss past an hour. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** Human summary for lists and totals: "1h 04m", "3m 20s", "45s". */
export function formatHuman(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${pad(m)}m`
  if (m > 0) return `${m}m ${pad(sec)}s`
  return `${sec}s`
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
