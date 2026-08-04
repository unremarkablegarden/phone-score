/**
 * Thin, defensive wrapper around localStorage. Everything is namespaced `ps:`
 * and every read is guarded — a corrupt blob must never white-screen the app.
 */

const PREFIX = 'ps:'
const VERSION_KEY = PREFIX + 'v'
const VERSION = 1

export const KEYS = {
  scripts: PREFIX + 'scripts',
  settings: PREFIX + 'settings',
  draft: PREFIX + 'draft',
} as const

function available(): boolean {
  try {
    const probe = PREFIX + 'probe'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

const ok = typeof localStorage !== 'undefined' && available()

if (ok) {
  const stored = localStorage.getItem(VERSION_KEY)
  if (stored !== String(VERSION)) {
    // No migrations to run yet; just stamp the current version.
    try {
      localStorage.setItem(VERSION_KEY, String(VERSION))
    } catch {
      /* ignore */
    }
  }
}

export function read<T>(key: string, fallback: T, validate?: (value: unknown) => boolean): T {
  if (!ok) return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw) as unknown
    if (validate && !validate(parsed)) return fallback
    return parsed as T
  } catch {
    return fallback
  }
}

export function write(key: string, value: unknown): void {
  if (!ok) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota or private mode — nothing useful to do */
  }
}

export function remove(key: string): void {
  if (!ok) return
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}
